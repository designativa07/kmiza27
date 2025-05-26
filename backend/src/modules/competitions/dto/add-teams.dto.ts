import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class AddTeamsToCompetitionDto {
  @IsArray()
  @IsNumber({}, { each: true })
  team_ids: number[];

  @IsOptional()
  @IsString()
  group_name?: string;
} 