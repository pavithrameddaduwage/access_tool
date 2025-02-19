import { IsEmail, IsNumber } from 'class-validator';

export class ExternalDeleteAssignmentDto {
  @IsEmail()
  email: string;

  @IsNumber()
  webtoolId: number;
}