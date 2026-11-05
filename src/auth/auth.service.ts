import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../database/schemas/user.schema';
import { LoginDto } from './dto/login.dto';
@Injectable()
export class AuthService {
  constructor(@InjectModel(User.name) private users: Model<UserDocument>, private jwt: JwtService) {}
  async login(dto: LoginDto) {
    const user = await this.users.findOne({ email: dto.email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(dto.password, user.password))) throw new UnauthorizedException('Invalid email or password');
    const accessToken = await this.jwt.signAsync({ sub: user.id, email: user.email, role: user.role });
    return { accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
  }
  async me(userId: string) {
    const user = await this.users.findById(userId).select('-password');
    if (!user) throw new UnauthorizedException();
    return user;
  }
}
