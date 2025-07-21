import { IsNotEmpty, IsNumber, IsString, IsDateString, IsEnum, IsArray, IsOptional, ValidateNested, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { MatchStatus, MatchLeg } from '../../../entities/match.entity';

export class MatchPlayerStatDto {
  @IsNotEmpty()
  @IsNumber()
  player_id: number;

  @IsNotEmpty()
  @IsNumber()
  minutes_played: number;

  @IsOptional()
  @IsNumber()
  goals?: number;

  @IsOptional()
  @IsNumber()
  assists?: number;

  @IsOptional()
  @IsNumber()
  yellow_cards?: number;

  @IsOptional()
  @IsNumber()
  red_cards?: number;
}


export class CreateMatchDto {
  @IsNotEmpty()
  @IsNumber()
  competition_id: number;

  @IsOptional()
  @IsNumber()
  round_id?: number;

  @IsOptional()
  @IsString()
  round_name?: string;

  @IsNotEmpty()
  @IsNumber()
  home_team_id: number;

  @IsNotEmpty()
  @IsNumber()
  away_team_id: number;

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
  @IsBoolean()
  is_knockout?: boolean;

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
  home_yellow_cards?: number;

  @IsOptional()
  @IsNumber()
  away_yellow_cards?: number;

  @IsOptional()
  @IsNumber()
  home_red_cards?: number;

  @IsOptional()
  @IsNumber()
  away_red_cards?: number;

  @IsOptional()
  @IsNumber()
  attendance?: number;

  @IsOptional()
  @IsString()
  referee?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  broadcast_channels?: string[];

  @IsOptional()
  @IsString()
  highlights_url?: string;

  @IsOptional()
  @IsString()
  match_stats?: string;

  @IsOptional()
  @IsEnum(MatchLeg)
  leg?: MatchLeg;

  @IsOptional()
  @IsString()
  tie_id?: string;

  @IsOptional()
  @IsNumber()
  home_aggregate_score?: number;

  @IsOptional()
  @IsNumber()
  away_aggregate_score?: number;

  @IsOptional()
  @IsNumber()
  qualified_team_id?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchPlayerStatDto)
  home_team_player_stats?: MatchPlayerStatDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MatchPlayerStatDto)
  away_team_player_stats?: MatchPlayerStatDto[];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  channel_ids?: number[];
} 