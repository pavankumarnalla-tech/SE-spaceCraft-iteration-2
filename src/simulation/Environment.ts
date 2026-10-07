import { PREDEFINED_DESTINATIONS } from './types';
import type { Destination, DangerObstacle, ScenarioType } from './types';

export class Environment {
  private destination: Destination;
  private obstacles: DangerObstacle[] = [];
  private currentScenario: ScenarioType = 'clear';

  constructor(canvasWidth: number = 900, canvasHeight: number = 500) {
    this.destination = PREDEFINED_DESTINATIONS[0];
    this.setScenario('clear', canvasWidth, canvasHeight);
  }

  public getDestination(): Destination {
    return this.destination;
  }

  public setDestination(dest: Destination): void {
    this.destination = dest;
  }

  public getObstacles(): DangerObstacle[] {
    return this.obstacles;
  }

  public setScenario(scenario: ScenarioType, canvasWidth: number = 900, canvasHeight: number = 500): void {
    this.currentScenario = scenario;
    if (scenario === 'clear') {
      this.obstacles = [
        { position: { x: canvasWidth / 2, y: canvasHeight / 2 + 150 }, radius: 25, hazardRadius: 60 }
      ];
    } else if (scenario === 'multiple') {
      this.obstacles = [
        { position: { x: 350, y: 250 }, radius: 30, hazardRadius: 70 },
        { position: { x: 550, y: 150 }, radius: 35, hazardRadius: 80 },
        { position: { x: 650, y: 350 }, radius: 25, hazardRadius: 65 }
      ];
    } else if (scenario === 'dense') {
      this.obstacles = [
        { position: { x: 300, y: 200 }, radius: 30, hazardRadius: 70 },
        { position: { x: 350, y: 350 }, radius: 25, hazardRadius: 65 },
        { position: { x: 500, y: 250 }, radius: 40, hazardRadius: 85 },
        { position: { x: 650, y: 150 }, radius: 30, hazardRadius: 70 },
        { position: { x: 750, y: 280 }, radius: 35, hazardRadius: 75 }
      ];
    }
  }

  public getScenario(): ScenarioType {
    return this.currentScenario;
  }

  public reset(canvasWidth: number = 900, canvasHeight: number = 500): void {
    this.destination = PREDEFINED_DESTINATIONS[0];
    this.setScenario('clear', canvasWidth, canvasHeight);
  }
}
