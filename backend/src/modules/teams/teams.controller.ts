import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamsService } from './teams.service';
import { Team } from '../../entities';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() createTeamDto: Partial<Team>) {
    return this.teamsService.create(createTeamDto);
  }

  @Post(':id/upload-escudo')
  @UseInterceptors(FileInterceptor('escudo'))
  async uploadEscudo(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const filePath = `/uploads/escudos/${file.filename}`;
    
    // Atualizar o time com o novo caminho do escudo
    await this.teamsService.update(+id, { logo_url: filePath });
    
    return {
      message: 'Escudo enviado com sucesso',
      filePath: filePath,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size
    };
  }

  @Get()
  findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(+id);
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.teamsService.findBySlug(slug);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTeamDto: Partial<Team>) {
    return this.teamsService.update(+id, updateTeamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.teamsService.remove(+id);
  }
} 