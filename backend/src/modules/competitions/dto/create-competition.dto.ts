import { IsString, IsEnum, IsOptional, IsBoolean, IsObject, IsNumber } from 'class-validator';
import { CompetitionType } from '../../../entities/competition.entity';

export class CreateCompetitionDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsEnum(CompetitionType)
  type: CompetitionType;

  @IsString()
  season: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  logo_url?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsNumber()
  display_order?: number;

  @IsOptional()
  @IsObject()
  rules?: any;

  @IsOptional()
  @IsObject()
  tiebreaker_criteria?: any;
} 