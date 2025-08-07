import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QueueService } from './queue.service';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private queueService: QueueService) {
    // Subscribe to queue state changes and broadcast to all clients
    this.queueService.onStateChange().subscribe((state) => {
      this.server.emit('queue_state_update', state);
    });
  }

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    // Send current state to newly connected client
    const currentState = await this.queueService.getQueueState();
    client.emit('queue_state_update', currentState);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_queue_room')
  async handleJoinQueueRoom(@ConnectedSocket() client: Socket) {
    client.join('queue_room');
    const currentState = await this.queueService.getQueueState();
    client.emit('queue_state_update', currentState);
  }

  @SubscribeMessage('leave_queue_room')
  handleLeaveQueueRoom(@ConnectedSocket() client: Socket) {
    client.leave('queue_room');
  }

  @SubscribeMessage("add_customer")
  async handleAddCustomer(
    @MessageBody() data: { isPriority: boolean },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const customer = await this.queueService.addCustomer(data.isPriority);
      client.emit("customer_added", { success: true, customer });
    } catch (error) {
      client.emit("customer_added", { success: false, message: error.message });
    }
  }

  @SubscribeMessage("call_next_customer")
  async handleCallNextCustomer(
    @MessageBody() data: { windowId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const customer = await this.queueService.callNextCustomer(data.windowId);
      if (customer) {
        client.emit("customer_called", { success: true, customer });
      } else {
        client.emit("customer_called", { success: false, message: "No customers in queue" });
      }
    } catch (error) {
      client.emit("customer_called", { success: false, message: error.message });
    }
  }

  @SubscribeMessage("complete_service")
  async handleCompleteService(
    @MessageBody() data: { windowId: number },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const success = await this.queueService.completeService(data.windowId);
      client.emit("service_completed", { success, windowId: data.windowId });
    } catch (error) {
      client.emit("service_completed", { success: false, message: error.message });
    }
  }

  @SubscribeMessage("toggle_customer_priority")
  async handleToggleCustomerPriority(
    @MessageBody() data: { customerId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const success = await this.queueService.toggleCustomerPriority(data.customerId);
      client.emit("priority_toggled", { success, customerId: data.customerId });
    } catch (error) {
      client.emit("priority_toggled", { success: false, message: error.message });
    }
  }

  @SubscribeMessage("reset_queue")
  async handleResetQueue(
    @MessageBody() data: { password: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      // Validate password before allowing reset
      const validPassword = process.env.RESET_PASSWORD || "123456"; // You can make this configurable
      
      if (!data.password || data.password !== validPassword) {
        client.emit("queue_reset", { 
          success: false, 
          message: "Invalid password. Queue reset denied." 
        });
        return;
      }
      
      const success = await this.queueService.resetQueue();
      client.emit("queue_reset", { 
        success, 
        message: success ? "Queue reset successfully" : "Failed to reset queue" 
      });
    } catch (error) {
      client.emit("queue_reset", { success: false, message: error.message });
    }
  }

  @SubscribeMessage("ring_notification")
  handleRingNotification() {
    // Broadcast ring notification to all connected clients
    this.server.emit("play_ring_notification");
  }
}