import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Doctor,DoctorDocument } from '../database/schemas/doctor.schema';
import { Patient,PatientDocument } from '../database/schemas/patient.schema';
@Injectable()
export class DashboardService {
  constructor(@InjectModel(Doctor.name) private doctors:Model<DoctorDocument>,@InjectModel(Patient.name) private patients:Model<PatientDocument>){}
  async summary(){
    const [totalDoctors,totalPatients,patientsPerDoctor,monthlyPatients]=await Promise.all([
      this.doctors.countDocuments(),this.patients.countDocuments(),
      this.patients.aggregate([{$group:{_id:'$doctor',count:{$sum:1}}},{$lookup:{from:'doctors',localField:'_id',foreignField:'_id',as:'doctor'}},{$unwind:{path:'$doctor',preserveNullAndEmptyArrays:true}},{$project:{_id:0,doctorId:'$_id',doctorName:'$doctor.name',patients:'$count'}},{$sort:{patients:-1}},{$limit:10}]),
      this.patients.aggregate([{$group:{_id:{$dateToString:{format:'%Y-%m',date:'$createdAt'}},count:{$sum:1}}},{$sort:{_id:1}},{$limit:12}])
    ]);
    return {totalDoctors,totalPatients,patientsPerDoctor,monthlyPatients};
  }
}
