import { IsNotEmpty, IsNumber, IsString, IsDateString, IsEnum, IsArray, IsOptional } from 'class-validator';
import { MatchStatus } from '../../../entities/match.entity';
import { MatchLeg } from '../../../entities/match.entity';

export class CreateTwoLegTieDto {
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
  @IsString()
  group_name?: string;

  @IsOptional()
  @IsString()
  phase?: string;

  @IsNotEmpty()
  @IsDateString()
  match_date_first_leg: string; // Data e hora da partida de ida

  @IsOptional()
  @IsNumber()
  stadium_id_first_leg?: number; // Estádio da partida de ida

  @IsNotEmpty()
  @IsDateString()
  match_date_second_leg: string; // Data e hora da partida de volta

  @IsOptional()
  @IsNumber()
  stadium_id_second_leg?: number; // Estádio da partida de volta

  @IsOptional()
  @IsEnum(MatchStatus)
  status?: MatchStatus; // Status inicial para ambas as partidas (ex: scheduled)

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  channel_ids?: number[]; // Canais de transmissão para ambas as partidas

  @IsOptional()
  @IsString()
  broadcast_channels?: string; // Canais adicionais em texto
} 