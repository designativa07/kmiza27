import { IsString, IsOptional, IsEnum, IsBoolean, IsNumber, IsArray, IsDateString, IsObject } from 'class-validator';
import { PoolType } from '../../../entities/pool.entity';

export class CreatePoolDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PoolType)
  type: PoolType;

  @IsOptional()
  @IsNumber()
  competition_id?: number;

  @IsOptional()
  @IsNumber()
  round_id?: number;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  match_ids?: number[];

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsObject()
  scoring_rules?: {
    exact_score: number;
    correct_result: number;
    goal_difference: number;
  };

  @IsOptional()
  @IsBoolean()
  is_public?: boolean;
}