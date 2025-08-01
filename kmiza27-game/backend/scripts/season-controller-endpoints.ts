
  // ===== SISTEMA DE TEMPORADAS =====
  
  @Get('season/status')
  async getSeasonStatus() {
    try {
      const seasonStatus = await this.competitionsService.getSeasonStatus();
      return {
        success: true,
        data: seasonStatus,
        message: 'Status da temporada carregado com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao carregar status da temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('season/end')
  async endSeason() {
    try {
      const result = await this.competitionsService.endSeason();
      return {
        success: true,
        data: result,
        message: 'Temporada finalizada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao finalizar temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post('season/start')
  async startNewSeason() {
    try {
      const result = await this.competitionsService.startNewSeason();
      return {
        success: true,
        data: result,
        message: 'Nova temporada iniciada com sucesso!'
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: error.message || 'Erro ao iniciar nova temporada',
          error: error.message
        },
        HttpStatus.BAD_REQUEST
      );
    }
  }
