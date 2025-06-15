import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { CompetitionsService } from './competitions.service';
import { TopScorer } from './competitions.service';
import { AddTeamsToCompetitionDto } from './dto/add-teams.dto';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Removido temporariamente

@Controller('competitions')
export class CompetitionsController {
  constructor(private readonly competitionsService: CompetitionsService) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
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
  getTopScorers(@Param('id') id: string): Promise<TopScorer[]> {
    return this.competitionsService.getTopScorers(+id);
  }
  
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.competitionsService.findOne(+id);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard)
  update(@Param('id') id: string, @Body() updateCompetitionDto: UpdateCompetitionDto) {
    return this.competitionsService.update(+id, updateCompetitionDto);
  }

  @Post(':id/teams')
  // @UseGuards(JwtAuthGuard)
  addTeams(@Param('id') id: string, @Body() addTeamsDto: AddTeamsToCompetitionDto) {
    return this.competitionsService.addTeams(+id, addTeamsDto);
  }

  @Get(':id/teams')
  getTeams(@Param('id') id: string) {
    return this.competitionsService.getTeams(+id);
  }

  @Delete(':id/teams/:teamId')
  // @UseGuards(JwtAuthGuard)
  removeTeam(@Param('id') id: string, @Param('teamId') teamId: string) {
    return this.competitionsService.removeTeam(+id, +teamId);
  }

  @Delete(':id')
  // @UseGuods(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.competitionsService.remove(+id);
  }

  @Post(':id/upload-logo')
  @UseInterceptors(FileInterceptor('logo', {
    storage: diskStorage({
      destination: './uploads/logo-competition',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        return cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png|gif|svg)$/)) {
        return cb(new Error('Apenas arquivos de imagem (jpg, jpeg, png, gif, svg) são permitidos!'), false);
      }
      cb(null, true);
    },
  }))
  async uploadLogo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const filePath = `/uploads/logo-competition/${file.filename}`;
    await this.competitionsService.update(+id, { logo_url: filePath });
    return {
      message: 'Logo da competição enviado com sucesso!',
      filePath: filePath,
    };
  }
} 