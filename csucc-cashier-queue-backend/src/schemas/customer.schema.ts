import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CustomerDocument = Customer & Document;

@Schema({ timestamps: true })
export class Customer {
  @Prop({ required: true, unique: true })
  queue_number: string;

  @Prop({ default: false })
  isPriority: boolean;

  @Prop({ required: true })
  joinedAt: Date;

  @Prop({ 
    required: true, 
    enum: ['waiting', 'serving', 'completed', 'skipped'],
    default: 'waiting'
  })
  status: string;

  @Prop({ default: null })
  windowId: number;

  @Prop({ default: null })
  servedAt: Date;

  @Prop({ default: null })
  completedAt: Date;
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

