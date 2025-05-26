import { IsOptional, IsNumber, IsString, IsDateString, IsEnum, IsArray } from 'class-validator';
import { MatchStatus } from '../../../entities/match.entity';

export class UpdateMatchDto {
  @IsOptional()
  @IsNumber()
  home_team_id?: number;

  @IsOptional()
  @IsNumber()
  away_team_id?: number;

  @IsOptional()
  @IsNumber()
  competition_id?: number;

  @IsOptional()
  @IsNumber()
  round_id?: number;

  @IsOptional()
  @IsNumber()
  stadium_id?: number;

  @IsOptional()
  @IsString()
  group_name?: string;

  @IsOptional()
  @IsString()
  phase?: string;

  @IsOptional()
  @IsDateString()
  match_date?: string;

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
  streaming_links?: any;

  @IsOptional()
  @IsString()
  highlights_url?: string;

  @IsOptional()
  match_stats?: any;
} 