import { Controller, Get, Post, Body, Patch, Param, Delete, Res, Query } from '@nestjs/common';
import { Response } from 'express';
import { MatchesService } from './matches.service';
import { Match } from '../../entities';
import { CreateMatchDto } from './dto/create-match.dto';
import { UpdateMatchDto } from './dto/update-match.dto';
import { CreateTwoLegTieDto } from './dto/create-two-leg-tie.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Post()
  create(@Body() createMatchDto: CreateMatchDto) {
    return this.matchesService.create(createMatchDto);
  }

  @Post('two-leg-tie')
  createTwoLegTie(@Body() createTwoLegTieDto: CreateTwoLegTieDto) {
    return this.matchesService.createTwoLegTie(createTwoLegTieDto);
  }

  @Get('top-scorers')
  async getTopScorers(@Res() res: Response) {
    const topScorers = await this.matchesService.getTopScorers();
    
    // Adicionar headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    });
    
    return res.json(topScorers);
  }

  @Get('/competition/:competitionId')
  async findByCompetitionId(@Param('competitionId') competitionId: string, @Res() res: Response) {
    const matches = await this.matchesService.findByCompetitionId(+competitionId);
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    });
    return res.json(matches);
  }

  @Get('/competition/:competitionId/rounds')
  async getRoundsByCompetition(@Param('competitionId') competitionId: string, @Res() res: Response) {
    const rounds = await this.matchesService.getRoundsByCompetition(+competitionId);
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      'Last-Modified': new Date().toUTCString()
    });
    return res.json(rounds);
  }

  @Get()
  async findAll(@Query('page') page: string = '1', @Query('limit') limit: string = '20') {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.matchesService.findAll(pageNumber, limitNumber);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(+id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMatchDto: UpdateMatchDto, @Res() res: Response) {
    console.log('🔍 PATCH /matches/:id - Dados recebidos:', {
      id,
      updateMatchDto
    });
    
    const updatedMatch = await this.matchesService.update(+id, updateMatchDto);
    
    // Adicionar headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.json(updatedMatch);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.matchesService.remove(+id);
  }
} 