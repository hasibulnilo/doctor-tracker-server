import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreateDoctorDto {
  @ApiProperty() @IsString() @MinLength(2) name: string;
  @ApiProperty() @IsString() specialization: string;
  @ApiProperty() @IsString() hospital: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsEmail() email: string;
}
