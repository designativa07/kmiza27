import { IsString, IsNotEmpty, IsOptional, IsNumber, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateStadiumDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  state?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber()
  @IsOptional()
  @Type(() => Number) // Garante que a capacidade seja tratada como número
  capacity?: number;

  @IsDecimal({ decimal_digits: '0,8' }) // Ajuste para 8 casas decimais
  @IsOptional()
  latitude?: number;

  @IsDecimal({ decimal_digits: '0,8' }) // Ajuste para 8 casas decimais
  @IsOptional()
  longitude?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  opened_year?: number;

  @IsString()
  @IsOptional()
  history?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  url?: string;
} 