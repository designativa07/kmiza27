import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  searchAll(@Query('q') query: string) {
    return this.searchService.searchAll(query);
  }
} 