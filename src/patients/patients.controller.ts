import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
@ApiTags('Patients') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('patients')
export class PatientsController {
  constructor(private service:PatientsService) {}
  @Get() list(@Query() q:any){return this.service.list(q);}
  @Post() create(@Body() dto:CreatePatientDto){return this.service.create(dto);}
  @Get(':id') get(@Param('id') id:string){return this.service.get(id);}
  @Patch(':id') update(@Param('id') id:string,@Body() dto:Partial<CreatePatientDto>){return this.service.update(id,dto);}
  @Delete(':id') remove(@Param('id') id:string){return this.service.remove(id);}
}
