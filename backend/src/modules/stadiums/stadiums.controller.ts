import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, ParseIntPipe, UseInterceptors, UploadedFile, Query } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StadiumsService, PaginatedStadiumsResult } from './stadiums.service';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';

@Controller('stadiums')
export class StadiumsController {
  constructor(private readonly stadiumsService: StadiumsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createStadiumDto: CreateStadiumDto) {
    return this.stadiumsService.create(createStadiumDto);
  }

  @Get()
  findAll(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ): Promise<PaginatedStadiumsResult> {
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    return this.stadiumsService.findAll(pageNumber, limitNumber, search);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stadiumsService.findOne(id);
  }

  @Post(':id/upload-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new Error('Nenhum arquivo foi enviado');
    }
    // Chama o serviço para fazer o upload e atualizar a entidade
    return this.stadiumsService.uploadImageToCloud(id, file);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateStadiumDto: UpdateStadiumDto) {
    return this.stadiumsService.update(id, updateStadiumDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.stadiumsService.remove(id);
  }
} 