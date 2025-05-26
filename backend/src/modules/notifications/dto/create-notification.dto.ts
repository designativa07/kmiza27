import { IsString, IsOptional, IsBoolean, IsNumber } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  type: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsNumber()
  user_id?: number;

  @IsOptional()
  @IsNumber()
  match_id?: number;

  @IsOptional()
  @IsBoolean()
  is_sent?: boolean;

  @IsOptional()
  @IsString()
  error_message?: string;

  @IsOptional()
  @IsNumber()
  send_interval_ms?: number;
} 