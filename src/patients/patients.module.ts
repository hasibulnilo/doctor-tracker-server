import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Patient,PatientSchema } from '../database/schemas/patient.schema';
import { Doctor,DoctorSchema } from '../database/schemas/doctor.schema';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
@Module({imports:[MongooseModule.forFeature([{name:Patient.name,schema:PatientSchema},{name:Doctor.name,schema:DoctorSchema}])],controllers:[PatientsController],providers:[PatientsService]})
export class PatientsModule {}
