import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { Competition } from '../../entities';
import { AddTeamsToCompetitionDto } from './dto/add-teams.dto';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  create(@Body() createCompetitionDto: Partial<Competition>) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Get()
  findAll() {
    return this.competitionsService.findAll();
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
  update(@Param('id') id: string, @Body() updateCompetitionDto: Partial<Competition>) {
    return this.competitionsService.update(+id, updateCompetitionDto);
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