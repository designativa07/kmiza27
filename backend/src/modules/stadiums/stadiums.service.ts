import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stadium } from '../../entities/stadium.entity';
import { CreateStadiumDto } from './dto/create-stadium.dto';
import { UpdateStadiumDto } from './dto/update-stadium.dto';

@Injectable()
export class StadiumsService {
  constructor(
    @InjectRepository(Stadium)
    private stadiumsRepository: Repository<Stadium>,
  ) {}

  async create(createStadiumDto: CreateStadiumDto): Promise<Stadium> {
    const stadium = this.stadiumsRepository.create(createStadiumDto);
    return this.stadiumsRepository.save(stadium);
  }

  async findAll(): Promise<Stadium[]> {
    return this.stadiumsRepository.find({
      order: { name: 'ASC' }, // Ordenar por nome para facilitar a busca
    });
  }

  async findOne(id: number): Promise<Stadium> {
    const stadium = await this.stadiumsRepository.findOne({ where: { id } });
    if (!stadium) {
      throw new NotFoundException(`Stadium with ID "${id}" not found`);
    }
    return stadium;
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