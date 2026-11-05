import mongoose, { HydratedDocument } from 'mongoose';

export type DoctorDocument = HydratedDocument<{
  name: string;
  specialization: string;
  hospital: string;
  phone: string;
  email: string;
}>;

export const DoctorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    specialization: { type: String, required: true, trim: true, index: true },
    hospital: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, unique: true, index: true },
  },
  { timestamps: true },
);

DoctorSchema.index({ name: 'text', specialization: 'text', hospital: 'text' });
DoctorSchema.index({ createdAt: -1 });
