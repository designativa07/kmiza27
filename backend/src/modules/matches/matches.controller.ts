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
    try {
      const topScorers = await this.matchesService.getTopScorers();
      
      // Adicionar headers para evitar cache
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      });
      
      return res.json(topScorers);
    } catch (error) {
      console.error('❌ Controller: Erro ao buscar artilheiros:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  @Get('test')
  async testEndpoint() {
    return { message: 'Teste funcionando!' };
  }

  @Get('today')
  async getTodayMatches(@Res() res: Response) {
    try {
      const matches = await this.matchesService.getTodayMatches();
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      });
      return res.json(matches);
    } catch (error) {
      console.error('❌ Controller: Erro ao buscar jogos de hoje:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  @Get('tomorrow')
  async getTomorrowMatches(@Res() res: Response) {
    try {
      const matches = await this.matchesService.getTomorrowMatches();
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      });
      return res.json(matches);
    } catch (error) {
      console.error('❌ Controller: Erro ao buscar jogos de amanhã:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }

  @Get('week')
  async getWeekMatches(@Res() res: Response) {
    try {
      const matches = await this.matchesService.getWeekMatches();
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Last-Modified': new Date().toUTCString()
      });
      return res.json(matches);
    } catch (error) {
      console.error('❌ Controller: Erro ao buscar jogos da semana:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
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
  async findAll(
    @Query('page') page: string = '1', 
    @Query('limit') limit: string = '20',
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('status') status?: string,
    @Query('competition_id') competitionId?: string,
    @Query('round_id') roundId?: string
  ) {
    try {
      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);
      const result = await this.matchesService.findAll(pageNumber, limitNumber, fromDate, toDate, status, competitionId ? +competitionId : undefined, roundId ? +roundId : undefined);
      return result; // Retornar o objeto completo com data e total
    } catch (error) {
      console.error('❌ Controller: Erro ao buscar matches:', error);
      throw error;
    }
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.matchesService.findOne(+id);
  }

  @Get(':id/broadcasts')
  async getMatchBroadcasts(@Param('id') id: string) {
    return this.matchesService.getMatchBroadcasts(+id);
  }

  @Get(':id/prediction')
  async getMatchPrediction(@Param('id') id: string) {
    try {
      return await this.matchesService.getMatchPrediction(+id);
    } catch (error) {
      console.error(`Error fetching prediction for match ${id}:`, error);
      throw error;
    }
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