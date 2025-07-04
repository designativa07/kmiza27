import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe, Put } from '@nestjs/common';
import { RoundsService, CreateRoundDto, UpdateRoundDto } from './rounds.service';

@Controller('rounds')
export class RoundsController {
  constructor(private readonly roundsService: RoundsService) {}

  @Get('competition/:competitionId')
  async findByCompetition(@Param('competitionId', ParseIntPipe) competitionId: number) {
    return this.roundsService.findByCompetition(competitionId);
  }

  @Get('competition/:competitionId/with-suggestions')
  async getWithSuggestions(@Param('competitionId', ParseIntPipe) competitionId: number) {
    return this.roundsService.getWithSuggestions(competitionId);
  }

  @Get('competition/:competitionId/suggestions')
  async getSuggestions(@Param('competitionId', ParseIntPipe) competitionId: number) {
    return this.roundsService.getSuggestions(competitionId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.roundsService.findOne(id);
  }

  @Post()
  async create(@Body() createRoundDto: CreateRoundDto) {
    return this.roundsService.create(createRoundDto);
  }

  @Patch(':id')
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoundDto: UpdateRoundDto) {
    return this.roundsService.update(id, updateRoundDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.roundsService.remove(id);
    return { message: 'Rodada excluída com sucesso' };
  }

  @Put('competition/:competitionId/reorder')
  async reorder(
    @Param('competitionId', ParseIntPipe) competitionId: number,
    @Body() body: { roundIds: number[] }
  ) {
    return this.roundsService.reorder(competitionId, body.roundIds);
  }
} 