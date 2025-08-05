import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password_hash: string;

  @Prop({ required: true, enum: ['admin', 'cashier'], default: 'cashier' })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

