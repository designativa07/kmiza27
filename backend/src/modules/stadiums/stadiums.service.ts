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

  async uploadImageToCloud(id: number, file: Express.Multer.File, namingStrategy: 'id' | 'name' | 'original' = 'name'): Promise<Stadium> {
    const stadium = await this.findOne(id);
    if (!file) {
      throw new Error('Nenhum arquivo de imagem enviado.');
    }

    const fileExtension = file.originalname.split('.').pop() || 'jpg';
    
    // Gerar nome do arquivo baseado na estratégia escolhida
    const fileName = this.generateFileName(stadium, file, namingStrategy, fileExtension);

    // Faz o upload para a pasta 'estadios'
    const imageUrl = await this.uploadCloudService.uploadFile(file, 'estadios', fileName);

    // Atualiza a entidade com a nova URL e salva
    stadium.image_url = imageUrl;
    return this.stadiumsRepository.save(stadium);
  }

  /**
   * Gera o nome do arquivo baseado na estratégia escolhida
   */
  private generateFileName(stadium: Stadium, file: Express.Multer.File, strategy: 'id' | 'name' | 'original', extension: string): string {
    switch (strategy) {
      case 'id':
        // Apenas ID: "78.jpg"
        return `${stadium.id}.${extension}`;
        
      case 'name':
        // ID + nome: "78-estadio-do-maracana.jpg"
        const stadiumSlug = this.createSlug(stadium.name);
        return `${stadium.id}-${stadiumSlug}.${extension}`;
        
      case 'original':
        // ID + nome original: "78-original-image-name.jpg"
        const originalSlug = this.createSlug(file.originalname.replace(/\.[^/.]+$/, "")); // Remove extensão
        return `${stadium.id}-${originalSlug}.${extension}`;
        
      default:
        return `${stadium.id}-${this.createSlug(stadium.name)}.${extension}`;
    }
  }

  /**
   * Converte o nome do estádio em um slug amigável para URLs/arquivos
   * Ex: "Estádio do Maracanã" -> "estadio-do-maracana"
   */
  private createSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD') // Decomposição de caracteres com acentos
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .trim()
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/-+/g, '-') // Remove hífens duplicados
      .substring(0, 50); // Limita a 50 caracteres
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