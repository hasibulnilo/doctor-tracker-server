import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DoctorsService } from './doctors.service';
import { CreateDoctorDto } from './dto/create-doctor.dto';
@ApiTags('Doctors') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('doctors')
export class DoctorsController {
  constructor(private service: DoctorsService) {}
  @Get() list(@Query() q: any) { return this.service.list(q); }
  @Post() create(@Body() dto: CreateDoctorDto) { return this.service.create(dto); }
  @Get(':id/patients') patients(@Param('id') id: string, @Query() q: any) { return this.service.patientsForDoctor(id,q); }
  @Get(':id') get(@Param('id') id: string) { return this.service.get(id); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: Partial<CreateDoctorDto>) { return this.service.update(id,dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }
}
