import mongoose from 'mongoose';
import { DoctorSchema } from './schemas/doctor.schema';
import { PatientSchema } from './schemas/patient.schema';
import { UserSchema } from './schemas/user.schema';

export const UserModel: any = mongoose.models.User || mongoose.model('User', UserSchema);
export const DoctorModel: any = mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);
export const PatientModel: any = mongoose.models.Patient || mongoose.model('Patient', PatientSchema);
