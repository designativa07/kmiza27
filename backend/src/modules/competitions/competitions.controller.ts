import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

import { CompetitionsService } from './competitions.service';
import { UploadService } from './upload.service';
import { TopScorer } from './competitions.service';
import { AddTeamsToCompetitionDto } from './dto/add-teams.dto';
import { CreateCompetitionDto } from './dto/create-competition.dto';
import { UpdateCompetitionDto } from './dto/update-competition.dto';
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Removido temporariamente

@Controller('competitions')
export class CompetitionsController {
  constructor(
    private readonly competitionsService: CompetitionsService,
    private readonly uploadService: UploadService
  ) {}

  @Post()
  // @UseGuards(JwtAuthGuard)
  create(@Body() createCompetitionDto: CreateCompetitionDto) {
    return this.competitionsService.create(createCompetitionDto);
  }

  @Get()
  findAll(@Query('active') active: boolean, @Query('category') category?: string) {
    return this.competitionsService.findAll(active, category);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.competitionsService.findBySlug(slug);
  }

  @Get('slug/:slug/teams')
  getTeamsBySlug(@Param('slug') slug:string) {
    return this.competitionsService.getTeamsByCompetitionSlug(slug);
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
      destination: (req, file, cb) => {
        // Caminho de upload desejado: img/logo-competition na raiz do backend
        const uploadPath = join(process.cwd(), 'img', 'logo-competition');

        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
            }
          cb(null, uploadPath);
      },
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
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }
    
    try {
      // O caminho público deve corresponder à forma como o diretório 'img' é servido estaticamente
      // Ex: /img/logo-competition/nome-do-arquivo.png
      const publicFilePath = `/img/logo-competition/${file.filename}`;
      
      await this.competitionsService.update(+id, { logo_url: publicFilePath });
      
      return {
        message: 'Logo da competição processada com sucesso!',
        filePath: publicFilePath,
        uploadLocation: file.destination,
        note: 'Upload realizado na pasta img/logo-competition.',
      };
    } catch (error) {
      console.error('Erro ao processar upload de logo:', error);
      throw new Error('Falha ao processar upload da logo da competição');
    }
  }
} 