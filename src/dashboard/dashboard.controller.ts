import { Controller,Get,UseGuards } from '@nestjs/common';
import { ApiBearerAuth,ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DashboardService } from './dashboard.service';
@ApiTags('Dashboard') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('dashboard')
export class DashboardController { constructor(private service:DashboardService){} @Get() summary(){return this.service.summary();} }
