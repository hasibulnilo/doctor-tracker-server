import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}
  @Post('login') login(@Body() dto: LoginDto) { return this.auth.login(dto); }
  @Get('me') @UseGuards(JwtAuthGuard) @ApiBearerAuth() me(@Req() req: any) { return this.auth.me(req.user.userId); }
}
