import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Doctor,DoctorSchema } from '../database/schemas/doctor.schema';
import { Patient,PatientSchema } from '../database/schemas/patient.schema';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
@Module({imports:[MongooseModule.forFeature([{name:Doctor.name,schema:DoctorSchema},{name:Patient.name,schema:PatientSchema}])],controllers:[DashboardController],providers:[DashboardService]})
export class DashboardModule {}
