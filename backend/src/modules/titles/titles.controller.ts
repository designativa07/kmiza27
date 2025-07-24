import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TitlesService } from './titles.service';
import { Title } from '../../entities/title.entity';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UploadCloudService } from '../upload/upload-cloud.service';

@Controller('titles')
export class TitlesController {
  constructor(
    private readonly titlesService: TitlesService,
    private readonly uploadCloudService: UploadCloudService,
  ) {}

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('teamId') teamId?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const teamIdNum = teamId ? parseInt(teamId) : undefined;

    return await this.titlesService.findAll(pageNum, limitNum, search, teamIdNum);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.titlesService.findOne(parseInt(id));
  }

  @Get('team/:teamId')
  async findByTeam(@Param('teamId') teamId: string) {
    return await this.titlesService.findByTeam(parseInt(teamId));
  }

  @Get('stats/overview')
  async getStats() {
    return await this.titlesService.getStats();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() titleData: Partial<Title>) {
    return await this.titlesService.create(titleData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() titleData: Partial<Title>) {
    return await this.titlesService.update(parseInt(id), titleData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.titlesService.remove(parseInt(id));
  }

  @Put('display-order')
  @UseGuards(JwtAuthGuard)
  async updateDisplayOrder(@Body() titles: { id: number; display_order: number }[]) {
    return await this.titlesService.updateDisplayOrder(titles);
  }

  @Post(':id/upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }

    const titleId = parseInt(id);
    const title = await this.titlesService.findOne(titleId);
    
    if (!title) {
      throw new Error('Título não encontrado');
    }

    // Gerar nome do arquivo baseado no título
    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    const fileName = `trofeu-${title.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.${fileExtension}`;

    // Fazer upload para a pasta 'trofeus'
    const imageUrl = await this.uploadCloudService.uploadFile(file, 'trofeus', fileName);

    // Atualizar o título com a nova URL da imagem
    const updatedTitle = await this.titlesService.update(titleId, { image_url: imageUrl });

    return {
      message: 'Imagem do troféu enviada com sucesso',
      title: updatedTitle,
      imageUrl: imageUrl
    };
  }
} 