import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QueueStateDocument = QueueState & Document;

@Schema()
export class WindowState {
  @Prop({ required: true })
  id: number;

  @Prop({ required: true })
  window_name: string;

  @Prop({ 
    required: true, 
    enum: ['available', 'serving', 'closed'],
    default: 'available'
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'Customer', default: null })
  current_customer_id: Types.ObjectId | null;
}

@Schema({ timestamps: true })
export class QueueState {
  @Prop({ type: [Types.ObjectId], ref: 'Customer', default: [] })
  current_queue: Types.ObjectId[];

  @Prop({ type: [WindowState], default: [] })
  windows: WindowState[];

  @Prop({ default: 1 })
  next_customer_number: number;

  @Prop({ default: Date.now })
  lastUpdated: Date;
}

export const QueueStateSchema = SchemaFactory.createForClass(QueueState);

