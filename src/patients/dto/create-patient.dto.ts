import { IsIn, IsInt, IsMongoId, IsString, Min, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class CreatePatientDto {
  @ApiProperty() @IsString() @MinLength(2) name: string;
  @ApiProperty() @IsInt() @Min(0) age: number;
  @ApiProperty({ enum: ['male','female','other'] }) @IsIn(['male','female','other']) gender: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() condition: string;
  @ApiProperty() @IsMongoId() doctorId: string;
}
