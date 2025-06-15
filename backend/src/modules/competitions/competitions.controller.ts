import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { CompetitionsService } from './competitions.service';
import { AddTeamsToCompetitionDto } from './dto/add-teams.dto';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Get()
  findAll() {
    return this.competitionsService.findAll();
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.competitionsService.findBySlug(slug);
  }

  @Get(':id/top-scorers')
  getTopScorers(@Param('id') id: string) {
    return this.competitionsService.getTopScorers(+id);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitionsService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateCompetitionDto: UpdateCompetitionDto) {
    return this.competitionsService.update(+id, updateCompetitionDto);
  }

  @Post(':id/teams')
  @UseGuards(JwtAuthGuard)
  addTeams(@Param('id') id: string, @Body() addTeamsDto: AddTeamsToCompetitionDto) {
    return this.competitionsService.addTeams(+id, addTeamsDto);
  }

  @Get(':id/teams')
  getTeams(@Param('id') id: string) {
    return this.competitionsService.getTeams(+id);
  }

  @Delete(':id/teams/:teamId')
  @UseGuards(JwtAuthGuard)
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.competitionsService.removeTeam(+id, +teamId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.competitionsService.remove(+id);
  }
} 