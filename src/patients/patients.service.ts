import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from '../database/schemas/patient.schema';
import { Doctor, DoctorDocument } from '../database/schemas/doctor.schema';
import { CreatePatientDto } from './dto/create-patient.dto';
@Injectable()
export class PatientsService {
  constructor(@InjectModel(Patient.name) private patients: Model<PatientDocument>, @InjectModel(Doctor.name) private doctors: Model<DoctorDocument>) {}
  async list(q:any) {
    const page=Math.max(1,Number(q.page)||1), limit=Math.min(100,Math.max(1,Number(q.limit)||10)), filter:any={};
    if(q.search) filter.$or=['name','phone','condition'].map(k=>({[k]:{$regex:q.search,$options:'i'}}));
    if(q.condition) filter.condition={$regex:q.condition,$options:'i'};
    if(q.doctorId) filter.doctor=q.doctorId;
    if(q.from||q.to) filter.createdAt={...(q.from?{$gte:new Date(q.from)}:{}),...(q.to?{$lte:new Date(q.to)}:{})};
    const [data,total]=await Promise.all([this.patients.find(filter).populate('doctor','name specialization').sort({createdAt:-1}).skip((page-1)*limit).limit(limit).lean(),this.patients.countDocuments(filter)]);
    return {data,meta:{total,page,limit,totalPages:Math.ceil(total/limit)}};
  }
  async create(dto:CreatePatientDto) { const doctor=await this.doctors.findById(dto.doctorId); if(!doctor) throw new NotFoundException('Doctor not found'); const {doctorId,...rest}=dto; return this.patients.create({...rest,doctor:doctorId}); }
  async get(id:string) { const p=await this.patients.findById(id).populate('doctor','name specialization'); if(!p) throw new NotFoundException('Patient not found'); return p; }
  async update(id:string,dto:Partial<CreatePatientDto>) { const update:any={...dto}; if(dto.doctorId){ const d=await this.doctors.findById(dto.doctorId); if(!d) throw new NotFoundException('Doctor not found'); update.doctor=d.id; delete update.doctorId; } const p=await this.patients.findByIdAndUpdate(id,update,{new:true,runValidators:true}); if(!p) throw new NotFoundException('Patient not found'); return p; }
  async remove(id:string) { const p=await this.patients.findByIdAndDelete(id); if(!p) throw new NotFoundException('Patient not found'); return {message:'Patient deleted'}; }
}
