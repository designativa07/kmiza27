import { IsOptional, IsNumber, IsString, IsDateString, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { MatchStatus } from '../../../entities/match.entity';
import { MatchLeg } from '../../../entities/match.entity';

export class MatchPlayerStatDto {
  @IsOptional()
  @IsNumber()
  player_id?: number;

  @IsOptional()
  @IsNumber()
  goals?: number;

  @IsOptional()
  @IsNumber()
  yellow_cards?: number;

  @IsOptional()
  @IsNumber()
  red_cards?: number;
}

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
  stadium_id?: number | null;

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

  @IsOptional()
  @IsEnum(MatchLeg)
  leg?: MatchLeg;

  @IsOptional()
  @IsString()
  // @IsUUID('4') // Se o tie_id for um UUID V4, descomente esta linha
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
} 