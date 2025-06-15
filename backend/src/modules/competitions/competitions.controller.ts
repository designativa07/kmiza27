import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { tmpdir } from 'os';

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
  findAll(@Query('active') active: boolean) {
    return this.competitionsService.findAll(active);
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
      destination: (req, file, cb) => {
        try {
          // Verificar se /img existe e tem permissão, senão usar tmpdir
          const preferredPath = '/img/logo-competition';
          const fallbackPath = join(tmpdir(), 'futepedia-uploads', 'logo-competition');
          
          let uploadPath = fallbackPath;
          
          // Tentar usar /img se existir
          if (existsSync('/img')) {
            try {
              // Tentar criar o subdiretório logo-competition
              if (!existsSync(preferredPath)) {
                mkdirSync(preferredPath, { recursive: true });
              }
              uploadPath = preferredPath;
              console.log('✅ Usando /img/logo-competition para upload');
            } catch (error) {
              console.log('⚠️ Não foi possível usar /img, usando tmpdir');
              // Criar diretório fallback
              if (!existsSync(fallbackPath)) {
                mkdirSync(fallbackPath, { recursive: true });
              }
            }
          } else {
            // Criar diretório fallback
            if (!existsSync(fallbackPath)) {
              mkdirSync(fallbackPath, { recursive: true });
            }
          }
          
          cb(null, uploadPath);
        } catch (error) {
          console.error('Erro ao obter diretório de upload:', error);
          cb(error, '');
        }
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
      // Determinar se o arquivo foi salvo em /img ou tmpdir
      const isUsingImgDir = file.destination?.includes('/img');
      const isProduction = process.env.NODE_ENV === 'production';
      
      let publicFilePath: string;
      
      if (isUsingImgDir) {
        // Se salvou em /img, usar URL real
        publicFilePath = `/logo-competition/${file.filename}`;
      } else if (isProduction) {
        // Se não conseguiu usar /img em produção, usar placeholder
        publicFilePath = 'https://via.placeholder.com/100x100/4F46E5/FFFFFF?text=LOGO';
      } else {
        // Desenvolvimento local
        publicFilePath = `/logo-competition/${file.filename}`;
      }
      
      await this.competitionsService.update(+id, { logo_url: publicFilePath });
      
      return {
        message: 'Logo da competição processado com sucesso!',
        filePath: publicFilePath,
        uploadLocation: file.destination,
        environment: isProduction ? 'production' : 'development',
        usingImgDirectory: isUsingImgDir,
        note: isUsingImgDir 
          ? 'Upload realizado em /img/logo-competition' 
          : isProduction 
            ? 'Usando placeholder. Crie o diretório /img com permissões para uploads reais.'
            : 'Upload local realizado com sucesso.'
      };
    } catch (error) {
      console.error('Erro ao processar upload de logo:', error);
      throw new Error('Falha ao processar upload da logo da competição');
    }
  }
} 