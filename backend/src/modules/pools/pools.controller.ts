import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PoolsService } from './pools.service';
import { PoolsScoringService } from './pools-scoring.service';
import { PoolType, PoolStatus } from '../../entities/pool.entity';

@Controller('pools')
export class PoolsController {
  constructor(
    private readonly poolsService: PoolsService,
    private readonly poolsScoringService: PoolsScoringService,
  ) {}

  // Endpoints públicos (não requerem autenticação)
  @Get('public')
  async findPublicPools(@Query('status') status?: PoolStatus) {
    return this.poolsService.findAll({
      status: status || PoolStatus.OPEN,
      includeParticipants: true,
    });
  }

  @Get(':id/public')
  async findPublicPool(@Param('id', ParseIntPipe) id: number) {
    const pool = await this.poolsService.findOne(id);
    
    // Verificar se é público
    if (!pool.settings?.public) {
      throw new BadRequestException('Este bolão não é público');
    }

    return pool;
  }

  @Get(':id/ranking')
  async getPoolRanking(@Param('id', ParseIntPipe) id: number) {
    return this.poolsService.getPoolRanking(id);
  }

  @Get(':id/statistics')
  async getPoolStatistics(@Param('id', ParseIntPipe) id: number) {
    return this.poolsScoringService.getPoolStatistics(id);
  }

  // Endpoints protegidos (requerem autenticação)
  @UseGuards(JwtAuthGuard)
  @Post()
  async create(@Body() createPoolDto: any, @Request() req) {
    return this.poolsService.create(createPoolDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(@Request() req, @Query() filters: any) {
    // Admins podem ver todos os bolões, usuários comuns apenas os que participam
    if (req.user.is_admin) {
      return this.poolsService.findAll(filters);
    } else {
      return this.poolsService.findAll({
        ...filters,
        userId: req.user.id,
      });
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-pools')
  async findMyPools(@Request() req) {
    return this.poolsService.findAll({ userId: req.user.id });
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    const pool = await this.poolsService.findOne(id);
    
    // Verificar se o usuário tem acesso ao bolão
    if (!pool.settings?.public) {
      const isParticipant = pool.participants.some(p => p.user_id === req.user.id);
      const isCreator = pool.created_by === req.user.id;
      const isAdmin = req.user.is_admin;

      if (!isParticipant && !isCreator && !isAdmin) {
        throw new BadRequestException('Acesso negado a este bolão');
      }
    }

    return pool;
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePoolDto: any,
    @Request() req,
  ) {
    return this.poolsService.update(id, updatePoolDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.poolsService.delete(id, req.user.id);
    return { message: 'Bolão excluído com sucesso' };
  }

  // Gerenciamento de participação
  @UseGuards(JwtAuthGuard)
  @Post(':id/join')
  async joinPool(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.poolsService.joinPool(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/leave')
  async leavePool(@Param('id', ParseIntPipe) id: number, @Request() req) {
    await this.poolsService.leavePool(id, req.user.id);
    return { message: 'Saída do bolão realizada com sucesso' };
  }

  // Palpites
  @UseGuards(JwtAuthGuard)
  @Post(':id/predictions')
  async makePrediction(
    @Param('id', ParseIntPipe) poolId: number,
    @Body() predictionDto: {
      match_id: number;
      predicted_home_score: number;
      predicted_away_score: number;
    },
    @Request() req,
  ) {
    return this.poolsService.makePrediction(
      {
        pool_id: poolId,
        ...predictionDto,
      },
      req.user.id,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/my-predictions')
  async getMyPredictions(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.poolsService.getUserPredictions(id, req.user.id);
  }

  // Gerenciamento de status (apenas criador/admin)
  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  async publishPool(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.poolsService.publishPool(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/close')
  async closePool(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.poolsService.closePool(id, req.user.id);
  }

  // Atualização manual de pontuações (apenas admin)
  @UseGuards(JwtAuthGuard)
  @Post(':id/update-scoring')
  async updateScoring(@Param('id', ParseIntPipe) id: number, @Request() req) {
    if (!req.user.is_admin) {
      throw new BadRequestException('Apenas administradores podem atualizar pontuações manualmente');
    }
    
    await this.poolsScoringService.forceUpdatePool(id);
    return { message: 'Pontuações atualizadas com sucesso' };
  }

  // Endpoints para criação de bolões
  @UseGuards(JwtAuthGuard)
  @Get('rounds/:roundId/matches')
  async getRoundMatches(@Param('roundId', ParseIntPipe) roundId: number) {
    // Este endpoint seria implementado para ajudar na criação de bolões por rodada
    // Retornaria os jogos disponíveis da rodada especificada
    // Por enquanto, é um placeholder
    return { message: 'Endpoint para buscar jogos da rodada' };
  }
}