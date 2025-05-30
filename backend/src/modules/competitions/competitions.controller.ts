import { Controller, Get, Post, Body, Patch, Param, Delete, Res } from '@nestjs/common';
import { Response } from 'express';
import { CompetitionsService } from './competitions.service';
import { Competition } from '../../entities';
import { AddTeamsToCompetitionDto } from './dto/add-teams.dto';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Get()
  async findAll(@Res() res: Response) {
    const competitions = await this.competitionsService.findAll();
    
    // Adicionar headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.json(competitions);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitionsService.findOne(+id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.competitionsService.findBySlug(slug);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateCompetitionDto: UpdateCompetitionDto, @Res() res: Response) {
    console.log('🔍 PATCH /competitions/:id - Dados recebidos:', {
      id,
      updateCompetitionDto
    });
    
    const updatedCompetition = await this.competitionsService.update(+id, updateCompetitionDto);
    
    // Adicionar headers para evitar cache
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    return res.json(updatedCompetition);
  }

  @Post(':id/teams')
  addTeams(@Param('id') id: string, @Body() addTeamsDto: AddTeamsToCompetitionDto) {
    return this.competitionsService.addTeams(+id, addTeamsDto);
  }

  @Get(':id/teams')
  getTeams(@Param('id') id: string) {
    return this.competitionsService.getTeams(+id);
  }

  @Delete(':id/teams/:teamId')
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.competitionsService.removeTeam(+id, +teamId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.competitionsService.remove(+id);
  }
} 