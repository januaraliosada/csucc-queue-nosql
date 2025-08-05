import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QueueGateway } from './queue.gateway';
import { QueueService } from './queue.service';
import { Customer, CustomerSchema } from '../schemas/customer.schema';
import { QueueState, QueueStateSchema } from '../schemas/queue-state.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: QueueState.name, schema: QueueStateSchema },
    ]),
  ],
  providers: [QueueGateway, QueueService],
})
export class QueueModule {}

