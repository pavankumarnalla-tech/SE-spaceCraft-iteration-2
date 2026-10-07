import type { DangerObstacle, Vector2D, SpacecraftState, Destination } from './types';

export interface DetectedThreat {
  obstacle: DangerObstacle;
  distance: number;
  inTrajectoryPath: boolean;
}

export interface SensorReading {
  craftPosition: Vector2D;
  targetPosition: Vector2D;
  distanceToTarget: number;
  velocity: Vector2D;
  speed: number;
  threat: DetectedThreat | null;
}

export class Sensors {
  public static readSensors(
    craftState: SpacecraftState,
    destination: Destination,
    obstacles: DangerObstacle[]
  ): SensorReading {
    const craftPos = craftState.position;
    const destPos = destination.position;

    const dx = destPos.x - craftPos.x;
    const dy = destPos.y - craftPos.y;
    const distanceToTarget = Math.sqrt(dx * dx + dy * dy);

    const threat = this.scanForDangers(
      craftPos,
      craftState.velocity,
      craftState.speed,
      craftState.sensorRadius,
      obstacles
    );

    return {
      craftPosition: { ...craftPos },
      targetPosition: { ...destPos },
      distanceToTarget: Number(distanceToTarget.toFixed(1)),
      velocity: { ...craftState.velocity },
      speed: craftState.speed,
      threat,
    };
  }

  private static scanForDangers(
    craftPos: Vector2D,
    craftVel: Vector2D,
    craftSpeed: number,
    sensorRadius: number,
    obstacles: DangerObstacle[]
  ): DetectedThreat | null {
    let closestThreat: DetectedThreat | null = null;
    let minThreatDist = Infinity;

    for (const obstacle of obstacles) {
      const dx = obstacle.position.x - craftPos.x;
      const dy = obstacle.position.y - craftPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= sensorRadius + obstacle.hazardRadius) {
        let inTrajectoryPath = false;
        
        if (craftSpeed > 0.1) {
          const vxNorm = craftVel.x / craftSpeed;
          const vyNorm = craftVel.y / craftSpeed;
          const dot = dx * vxNorm + dy * vyNorm;
          
          if (dot > 0) {
            const projX = craftPos.x + vxNorm * dot;
            const projY = craftPos.y + vyNorm * dot;
            
            const perpDist = Math.sqrt(
              Math.pow(obstacle.position.x - projX, 2) +
              Math.pow(obstacle.position.y - projY, 2)
            );

            if (perpDist < obstacle.hazardRadius + 20) {
              inTrajectoryPath = true;
            }
          }
        }

        if (inTrajectoryPath && distance < minThreatDist) {
          minThreatDist = distance;
          closestThreat = {
            obstacle,
            distance,
            inTrajectoryPath,
          };
        } else if (!closestThreat && distance < obstacle.hazardRadius + 20) {
          closestThreat = {
            obstacle,
            distance,
            inTrajectoryPath: false,
          };
        }
      }
    }
    
    return closestThreat;
  }
}
