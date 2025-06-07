import { Controller, Get, Post, Body, Patch, Param, Delete, UseInterceptors, UploadedFile, HttpException, HttpStatus, UsePipes, ValidationPipe, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TeamsService } from './teams.service';
import { Team } from '../../entities';
import { PlayerTeamHistory } from '../../entities/player-team-history.entity';

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
  async remove(@Param('id') id: string) {
    try {
      await this.teamsService.remove(+id);
      return { message: 'Time excluído com sucesso' };
    } catch (error) {
      if (error.message.includes('Não é possível excluir')) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException('Erro interno do servidor', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post(':teamId/add-player')
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async addPlayerToTeam( @Param('teamId') teamId: string,
    @Body('player_id') playerId: string,
    @Body('start_date') startDate: string,
    @Body('jersey_number') jerseyNumber?: string,
    @Body('role') role?: string,
  ): Promise<PlayerTeamHistory> {
    return this.teamsService.addPlayerToTeam(
      +teamId,
      +playerId,
      new Date(startDate),
      jerseyNumber,
      role,
    );
  }

  @Patch(':teamId/players/:historyId/remove')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async removePlayerFromTeam(
    @Param('teamId') teamId: string,
    @Param('historyId') historyId: string,
    @Body('end_date') endDate: string,
  ): Promise<PlayerTeamHistory> {
    return this.teamsService.removePlayerFromTeam(+historyId, +teamId, new Date(endDate));
  }

  @Get(':teamId/players-history')
  async getTeamPlayersHistory(@Param('teamId') teamId: string): Promise<PlayerTeamHistory[]> {
    return this.teamsService.getTeamPlayersHistory(+teamId);
  }
} 