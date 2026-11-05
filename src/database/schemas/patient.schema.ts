import mongoose, { HydratedDocument, Types } from 'mongoose';

export type PatientDocument = HydratedDocument<{
  name: string;
  age: number;
  gender: string;
  phone: string;
  condition: string;
  doctor: Types.ObjectId;
}>;

export const PatientSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, required: true, enum: ['male', 'female', 'other'] },
    phone: { type: String, required: true, trim: true },
    condition: { type: String, required: true, trim: true, index: true },
    doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true, index: true },
  },
  { timestamps: true },
);

PatientSchema.index({ createdAt: -1 });
PatientSchema.index({ name: 'text', condition: 'text' });
