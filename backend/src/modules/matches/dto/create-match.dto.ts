import { IsNotEmpty, IsNumber, IsString, IsDateString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { MatchStatus } from '../../../entities/match.entity';

export class CreateMatchDto {
  @IsNotEmpty()
  @IsNumber()
  home_team_id: number;

  @IsNotEmpty()
  @IsNumber()
  away_team_id: number;

  @IsNotEmpty()
  @IsNumber()
  competition_id: number;

  @IsOptional()
  @IsNumber()
  round_id?: number;

  @IsOptional()
  @IsString()
  round_name?: string;

  @IsOptional()
  @IsNumber()
  stadium_id?: number;

  @IsOptional()
  @IsString()
  group_name?: string;

  @IsOptional()
  @IsString()
  phase?: string;

  @IsNotEmpty()
  @IsDateString()
  match_date: string;

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus;

  @IsOptional()
  @IsNumber()
  home_score?: number;

  @IsOptional()
  @IsNumber()
  away_score?: number;

  @IsOptional()
  @IsNumber()
  home_score_penalties?: number;

  @IsOptional()
  @IsNumber()
  away_score_penalties?: number;

  @IsOptional()
  @IsNumber()
  attendance?: number;

  @IsOptional()
  @IsString()
  referee?: string;

  @IsOptional()
  @IsArray()
  broadcast_channels?: any;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  channel_ids?: number[];

  @IsOptional()
  streaming_links?: any;

  @IsOptional()
  @IsString()
  highlights_url?: string;

  @IsOptional()
  match_stats?: any;
} 