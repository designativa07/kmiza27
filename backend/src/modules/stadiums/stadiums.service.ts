import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { Stadium } from '../../entities/stadium.entity';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';
import { UploadCloudService } from '../upload/upload-cloud.service';

export interface PaginatedStadiumsResult {
  data: Stadium[];
  total: number;
}

@Injectable()
export class StadiumsService {
  constructor(
    @InjectRepository(Stadium)
    private stadiumsRepository: Repository<Stadium>,
    private readonly uploadCloudService: UploadCloudService,
  ) {}

  async create(createStadiumDto: CreateStadiumDto): Promise<Stadium> {
    const stadium = this.stadiumsRepository.create(createStadiumDto);
    return this.stadiumsRepository.save(stadium);
  }

  async findAll(
    page: number = 1,
    limit: number = 20,
    search?: string,
  ): Promise<PaginatedStadiumsResult> {
    const queryBuilder = this.stadiumsRepository.createQueryBuilder('stadium')
      .orderBy('stadium.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      const searchTerm = search.trim();
      
      try {
        // Tenta usar UNACCENT para busca insensível a acentos e case
        queryBuilder.where(
          `UNACCENT(stadium.name) ILIKE UNACCENT(:searchTerm) OR 
           UNACCENT(stadium.city) ILIKE UNACCENT(:searchTerm) OR
           UNACCENT(stadium.state) ILIKE UNACCENT(:searchTerm) OR
           UNACCENT(stadium.country) ILIKE UNACCENT(:searchTerm)`,
          { searchTerm: `%${searchTerm}%` }
        );
      } catch (error) {
        // Fallback se a extensão UNACCENT não estiver disponível
        console.warn('Falha ao usar UNACCENT na busca de estádios. A busca não será insensível a acentos. Erro:', error.message);
        queryBuilder.where(
          `LOWER(stadium.name) LIKE LOWER(:searchTerm) OR 
           LOWER(stadium.city) LIKE LOWER(:searchTerm) OR
           LOWER(stadium.state) LIKE LOWER(:searchTerm) OR
           LOWER(stadium.country) LIKE LOWER(:searchTerm)`,
          { searchTerm: `%${searchTerm}%` }
        );
      }
    }

    const [data, total] = await queryBuilder.getManyAndCount();
    return { data, total };
  }

  async findOne(id: number): Promise<Stadium> {
    const stadium = await this.stadiumsRepository.findOne({ where: { id } });
    if (!stadium) {
      throw new NotFoundException(`Stadium with ID "${id}" not found`);
    }
    return stadium;
  }

  async uploadImageToCloud(id: number, file: Express.Multer.File): Promise<Stadium> {
    const stadium = await this.findOne(id);
    if (!file) {
      throw new Error('Nenhum arquivo de imagem enviado.');
    }

    // O nome do arquivo no bucket será 'id-do-estadio.extensao'
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${stadium.id}.${fileExtension}`;

    // Faz o upload para a pasta 'estadios'
    const imageUrl = await this.uploadCloudService.uploadFile(file, 'estadios', fileName);

    // Atualiza a entidade com a nova URL e salva
    stadium.image_url = imageUrl;
    return this.stadiumsRepository.save(stadium);
  }

  async update(id: number, updateStadiumDto: UpdateStadiumDto): Promise<Stadium> {
    const stadium = await this.findOne(id); // Reutiliza findOne para verificar existência
    this.stadiumsRepository.merge(stadium, updateStadiumDto);
    return this.stadiumsRepository.save(stadium);
  }

  async remove(id: number): Promise<void> {
    const result = await this.stadiumsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Stadium with ID "${id}" not found`);
    }
  }
} 