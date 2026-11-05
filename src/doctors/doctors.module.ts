import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctor, DoctorSchema } from '../database/schemas/doctor.schema';
import { Patient, PatientSchema } from '../database/schemas/patient.schema';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
@Module({ imports:[MongooseModule.forFeature([{name:Doctor.name,schema:DoctorSchema},{name:Patient.name,schema:PatientSchema}])], controllers:[DoctorsController], providers:[DoctorsService], exports:[DoctorsService] })
export class DoctorsModule {}
