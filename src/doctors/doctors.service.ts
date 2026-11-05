import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor, DoctorDocument } from '../database/schemas/doctor.schema';
import { Patient, PatientDocument } from '../database/schemas/patient.schema';
import { CreateDoctorDto } from './dto/create-doctor.dto';
@Injectable()
export class DoctorsService {
  constructor(@InjectModel(Doctor.name) private doctors: Model<DoctorDocument>, @InjectModel(Patient.name) private patients: Model<PatientDocument>) {}
  async list(q: any) {
    const page = Math.max(1, Number(q.page) || 1), limit = Math.min(100, Math.max(1, Number(q.limit) || 10));
    const filter: any = {};
    if (q.search) filter.$or = ['name','specialization','hospital','email','phone'].map(k => ({ [k]: { $regex: q.search, $options: 'i' } }));
    if (q.specialization) filter.specialization = { $regex: q.specialization, $options: 'i' };
    if (q.from || q.to) filter.createdAt = { ...(q.from ? { $gte: new Date(q.from) } : {}), ...(q.to ? { $lte: new Date(q.to) } : {}) };
    const [data, total] = await Promise.all([this.doctors.find(filter).sort({ createdAt: -1 }).skip((page-1)*limit).limit(limit).lean(), this.doctors.countDocuments(filter)]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total/limit) } };
  }
  create(dto: CreateDoctorDto) { return this.doctors.create({ ...dto, email: dto.email.toLowerCase() }); }
  async get(id: string) { const d = await this.doctors.findById(id); if (!d) throw new NotFoundException('Doctor not found'); return d; }
  async update(id: string, dto: Partial<CreateDoctorDto>) { const d = await this.doctors.findByIdAndUpdate(id, dto, { new: true, runValidators: true }); if (!d) throw new NotFoundException('Doctor not found'); return d; }
  async remove(id: string) { const d = await this.doctors.findByIdAndDelete(id); if (!d) throw new NotFoundException('Doctor not found'); await this.patients.deleteMany({ doctor: id }); return { message: 'Doctor and associated patients deleted' }; }
  async patientsForDoctor(id: string, q: any) { await this.get(id); const page=Math.max(1,Number(q.page)||1), limit=Math.min(100,Math.max(1,Number(q.limit)||10)); const [data,total]=await Promise.all([this.patients.find({doctor:id}).sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),this.patients.countDocuments({doctor:id})]); return {data,meta:{total,page,limit,totalPages:Math.ceil(total/limit)}}; }
}
