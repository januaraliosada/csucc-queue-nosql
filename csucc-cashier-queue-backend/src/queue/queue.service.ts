import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Subject } from 'rxjs';
import { Customer, CustomerDocument } from '../schemas/customer.schema';
import { QueueState, QueueStateDocument } from '../schemas/queue-state.schema';

interface QueueStateResponse {
  queue: any[];
  windows: any[];
  nextNumber: number;
  lastUpdated: number;
}

@Injectable()
export class QueueService implements OnModuleInit {
  private stateSubject: Subject<QueueStateResponse> = new Subject<QueueStateResponse>();
  private readonly QUEUE_STATE_ID = new Types.ObjectId('507f1f77bcf86cd799439011');

  constructor(
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectModel(QueueState.name) private queueStateModel: Model<QueueStateDocument>,
  ) {}

  async onModuleInit() {
    await this.initializeState();
  }

  private async initializeState() {
    let queueState = await this.queueStateModel.findById(this.QUEUE_STATE_ID);
    
    if (!queueState) {
      queueState = new this.queueStateModel({
        _id: this.QUEUE_STATE_ID,
        current_queue: [],
        windows: [
          { id: 1, window_name: 'Window 1', status: 'available', current_customer_id: null },
          { id: 2, window_name: 'Window 2', status: 'available', current_customer_id: null },
        ],
        next_customer_number: 1,
        lastUpdated: new Date(),
      });
      await queueState.save();
    }
    
    await this.emitState();
  }

  private async emitState() {
    const state = await this.getQueueStateFormatted();
    this.stateSubject.next(state);
  }

  async getQueueState(): Promise<QueueStateResponse> {
    return await this.getQueueStateFormatted();
  }

  private async getQueueStateFormatted(): Promise<QueueStateResponse> {
    const queueState = await this.queueStateModel
      .findById(this.QUEUE_STATE_ID)
      .populate('current_queue')
      .populate('windows.current_customer_id');

    if (!queueState) {
      throw new Error('Queue state not found');
    }

    // Format the queue with customer details
    const formattedQueue = queueState.current_queue.map((customer: any) => ({
      id: customer._id.toString(),
      queue_number: customer.queue_number,
      isPriority: customer.isPriority,
      joinedAt: customer.joinedAt.getTime(),
      timestamp: customer.joinedAt.toISOString(),
      status: customer.status,
    }));

    // Format windows with current customer details
    const formattedWindows = queueState.windows.map((window: any) => ({
      id: window.id,
      window_name: window.window_name,
      status: window.status,
      current_customer: window.current_customer_id ? window.current_customer_id.queue_number : null,
      joinedAt: window.current_customer_id ? window.current_customer_id.servedAt?.getTime() : null,
      timestamp: window.current_customer_id ? window.current_customer_id.servedAt?.toISOString() : null,
      isPriority: window.current_customer_id ? window.current_customer_id.isPriority : null,
    }));

    return {
      queue: formattedQueue,
      windows: formattedWindows,
      nextNumber: queueState.next_customer_number,
      lastUpdated: queueState.lastUpdated.getTime(),
    };
  }

  onStateChange() {
    return this.stateSubject.asObservable();
  }

  async addCustomer(isPriority: boolean = false): Promise<any> {
    const queueState = await this.queueStateModel.findById(this.QUEUE_STATE_ID);
    if (!queueState) {
      throw new Error('Queue state not found');
    }

    const customerNumber = `C${String(queueState.next_customer_number).padStart(3, '0')}`;
    
    // Create new customer
    const newCustomer = new this.customerModel({
      queue_number: customerNumber,
      isPriority: isPriority,
      joinedAt: new Date(),
      status: 'waiting',
    });
    
    await newCustomer.save();

    // Update queue state
    if (isPriority) {
      // Find position to insert priority customer
      const queueCustomers = await this.customerModel.find({
        _id: { $in: queueState.current_queue }
      }).sort({ joinedAt: 1 });

      const lastPriorityIndex = queueCustomers.findLastIndex(customer => customer.isPriority);
      
      if (lastPriorityIndex === -1) {
        // No priority customers, add at beginning
        queueState.current_queue.unshift(newCustomer._id as Types.ObjectId);
      } else {
        // Insert after last priority customer
        const insertIndex = lastPriorityIndex + 1;
        queueState.current_queue.splice(insertIndex, 0, newCustomer._id as Types.ObjectId);
      }
    } else {
      // Regular customer goes to the end
      queueState.current_queue.push(newCustomer._id as Types.ObjectId);
    }

    queueState.next_customer_number++;
    queueState.lastUpdated = new Date();
    await queueState.save();

    await this.emitState();
    
    return {
      id: (newCustomer._id as Types.ObjectId).toString(),
      queue_number: newCustomer.queue_number,
      isPriority: newCustomer.isPriority,
      joinedAt: newCustomer.joinedAt.getTime(),
      timestamp: newCustomer.joinedAt.toISOString(),
      status: newCustomer.status,
    };
  }

  async toggleCustomerPriority(customerId: string): Promise<boolean> {
    const customer = await this.customerModel.findById(customerId);
    if (!customer) return false;

    const queueState = await this.queueStateModel.findById(this.QUEUE_STATE_ID);
    if (!queueState) return false;

    // Toggle priority
    customer.isPriority = !customer.isPriority;
    await customer.save();

    // Reorder the entire queue after priority change
    await this.reorderQueue(queueState);

    await this.emitState();
    return true;
  }


  private async reorderQueue(queueState: QueueStateDocument): Promise<void> {
    const customers = await this.customerModel.find({
      _id: { $in: queueState.current_queue },
      status: 'waiting'
    }).sort({ joinedAt: 1 });

    // Separate and sort by joinedAt
    const priority = customers.filter(c => c.isPriority);
    const regular = customers.filter(c => !c.isPriority);

    const newQueue = [...priority, ...regular].map(c => c._id as Types.ObjectId);

    queueState.current_queue = newQueue;
    queueState.lastUpdated = new Date();
    await queueState.save();
  }


  async callNextCustomer(windowId: number): Promise<any | null> {
    const queueState = await this.queueStateModel.findById(this.QUEUE_STATE_ID);
    if (!queueState || queueState.current_queue.length === 0) {
      return null;
    }

    const nextCustomerId = queueState.current_queue[0];
    const nextCustomer = await this.customerModel.findById(nextCustomerId);
    
    if (!nextCustomer) return null;

    // Remove customer from queue
    queueState.current_queue.shift();

    // Update customer status
    nextCustomer.status = 'serving';
    nextCustomer.windowId = windowId;
    nextCustomer.servedAt = new Date();
    await nextCustomer.save();

    // Update window status
    const windowIndex = queueState.windows.findIndex(w => w.id === windowId);
    if (windowIndex !== -1) {
      queueState.windows[windowIndex].status = 'serving';
      queueState.windows[windowIndex].current_customer_id = nextCustomer._id as Types.ObjectId;
    }

    queueState.lastUpdated = new Date();
    await queueState.save();

    await this.emitState();
    
    return {
      id: (nextCustomer._id as Types.ObjectId).toString(),
      queue_number: nextCustomer.queue_number,
      isPriority: nextCustomer.isPriority,
      joinedAt: nextCustomer.joinedAt.getTime(),
      timestamp: nextCustomer.joinedAt.toISOString(),
      status: nextCustomer.status,
    };
  }

  async completeService(windowId: number): Promise<boolean> {
    const queueState = await this.queueStateModel.findById(this.QUEUE_STATE_ID);
    if (!queueState) return false;

    const windowIndex = queueState.windows.findIndex(w => w.id === windowId);
    if (windowIndex === -1) return false;

    const currentCustomerId = queueState.windows[windowIndex].current_customer_id;
    
    if (currentCustomerId) {
      // Update customer status
      const customer = await this.customerModel.findById(currentCustomerId);
      if (customer) {
        customer.status = 'completed';
        customer.completedAt = new Date();
        await customer.save();
      }
    }

    // Update window status
    queueState.windows[windowIndex].status = 'available';
    queueState.windows[windowIndex].current_customer_id = null;
    queueState.lastUpdated = new Date();
    await queueState.save();

    await this.emitState();
    return true;
  }

  async resetQueue(): Promise<boolean> {
    // Step 1: (Optional) Delete all customers for a fresh start
    await this.customerModel.deleteMany({}); // ⚠️ Be careful: deletes all

    // Step 2: Reset queue state
    const queueState = await this.queueStateModel.findById(this.QUEUE_STATE_ID);
    if (!queueState) return false;

    queueState.current_queue = [];
    queueState.next_customer_number = 1;

    queueState.windows = queueState.windows.map(window => ({
      ...window,
      status: 'available',
      current_customer_id: null,
    }));

    queueState.lastUpdated = new Date();
    await queueState.save();

    // Step 3: Notify frontend or state consumers
    await this.emitState();

    console.log('Queue has been successfully reset.');
    return true;
  }
}

