import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { MatchSimulationService } from './match-simulation.service';
import { MatchVisualSimulationService } from './match-visual-simulation.service';

@Controller('match-simulation')
export class MatchSimulationController {
  constructor(
    private readonly matchSimulationService: MatchSimulationService,
    private readonly matchVisualSimulationService: MatchVisualSimulationService,
  ) {}

  @Post(':matchId')
  async simulateMatch(@Param('matchId') matchId: string, @Body() body: any) {
    const { userTeamData, machineTeamData } = body;
    return this.matchSimulationService.simulateMatch(
      matchId,
      userTeamData,
      machineTeamData,
    );
  }

  @Post(':matchId/visual-timeline')
  async getVisualSimulationTimeline(
    @Param('matchId') matchId: string,
    @Body() body: any,
  ) {
    const { userTeamData, machineTeamData } = body;
    // NOTA: A simulação visual não deve ter efeitos colaterais (como salvar no banco) por enquanto.
    // Ela apenas GERA a timeline. A simulação principal ainda é a canônica.
    return this.matchVisualSimulationService.generateVisualSimulationTimeline(
      userTeamData,
      machineTeamData,
    );
  }
}
