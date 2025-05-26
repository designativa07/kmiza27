import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  BadRequestException,
  Get,
  Param,
  Res
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import * as path from 'path';

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post('escudo')
  @UseInterceptors(FileInterceptor('escudo'))
  async uploadEscudo(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo foi enviado');
    }

    const filePath = `/uploads/escudos/${file.filename}`;
    
    return {
      message: 'Escudo enviado com sucesso',
      filePath: filePath,
      originalName: file.originalname,
      filename: file.filename,
      size: file.size
    };
  }

  @Get('escudos/:filename')
  async getEscudo(@Param('filename') filename: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'uploads', 'escudos', filename);
    return res.sendFile(filePath);
  }
} 