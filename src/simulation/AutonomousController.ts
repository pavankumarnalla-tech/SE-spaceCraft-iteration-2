import type { SpacecraftState, Vector2D, Destination, MissionState, MissionTaskConfig, TaskStatus } from './types';
import type { SensorReading } from './Sensors';

export interface ControllerOutput {
  desiredVelocity: Vector2D;
  activeMode: MissionState;
  executingTask: boolean;
  taskStatus: TaskStatus;
  navDecision: string;
}

export class AutonomousController {
  private evasionStarted: boolean = false;
  private dangerDetectedTime: number = 0;
  private currentEvasionTarget: Vector2D | null = null;
  private taskProgressTimer: number = 0;
  private taskFinished: boolean = false;

  public reset(): void {
    this.evasionStarted = false;
    this.dangerDetectedTime = 0;
    this.currentEvasionTarget = null;
    this.taskProgressTimer = 0;
    this.taskFinished = false;
  }

  public computeControl(
    craftState: SpacecraftState,
    destination: Destination,
    sensorReading: SensorReading,
    taskConfig: MissionTaskConfig,
    deltaTime: number
  ): ControllerOutput {
    const craftPos = sensorReading.craftPosition;
    const destPos = sensorReading.targetPosition;
    const distToTarget = sensorReading.distanceToTarget;

    // 1. Mission Task Execution Subsystem Flow (Arrival & Task Execution)
    if (distToTarget <= destination.arrivalRadius || this.taskProgressTimer > 0) {
      if (!this.taskFinished) {
        this.taskProgressTimer += deltaTime;

        if (this.taskProgressTimer < taskConfig.durationSeconds) {
          return {
            desiredVelocity: { x: 0, y: 0 },
            activeMode: 'EXECUTING_TASK',
            executingTask: true,
            taskStatus: 'EXECUTING',
            navDecision: 'Executing mission task',
          };
        } else {
          this.taskFinished = true;
          return {
            desiredVelocity: { x: 0, y: 0 },
            activeMode: 'MISSION_COMPLETED',
            executingTask: false,
            taskStatus: 'COMPLETE',
            navDecision: 'Target reached',
          };
        }
      } else {
        return {
          desiredVelocity: { x: 0, y: 0 },
          activeMode: 'MISSION_COMPLETED',
          executingTask: false,
          taskStatus: 'COMPLETE',
          navDecision: 'Target reached',
        };
      }
    }

    // 2. Navigation Subsystem (Autonomous Path Planning & Fuel-Aware Evasion)
    const threat = sensorReading.threat;
    const criticalThreat = threat && (threat.inTrajectoryPath || threat.distance < threat.obstacle.hazardRadius + 30);

    if (criticalThreat) {
      if (!this.evasionStarted) {
        this.dangerDetectedTime += deltaTime;
        
        // Brief REPLANNING state to compute optimal fuel-aware vector
        if (this.dangerDetectedTime > 0.2) {
          this.evasionStarted = true;
          
          const obstacle = threat.obstacle;
          const obsToCraftX = craftPos.x - obstacle.position.x;
          const obsToCraftY = craftPos.y - obstacle.position.y;
          const obsDist = Math.sqrt(obsToCraftX * obsToCraftX + obsToCraftY * obsToCraftY);
          
          const clearanceRadius = obstacle.hazardRadius + 45;
          
          // Tangent options
          const perpX1 = -obsToCraftY / (obsDist || 1);
          const perpY1 = obsToCraftX / (obsDist || 1);
          
          const perpX2 = obsToCraftY / (obsDist || 1);
          const perpY2 = -obsToCraftX / (obsDist || 1);
          
          const t1X = obstacle.position.x + (obsToCraftX / (obsDist || 1)) * clearanceRadius + perpX1 * 50;
          const t1Y = obstacle.position.y + (obsToCraftY / (obsDist || 1)) * clearanceRadius + perpY1 * 50;
          
          const t2X = obstacle.position.x + (obsToCraftX / (obsDist || 1)) * clearanceRadius + perpX2 * 50;
          const t2Y = obstacle.position.y + (obsToCraftY / (obsDist || 1)) * clearanceRadius + perpY2 * 50;
          
          // Select fuel-optimal tangent vector closer to final destination
          const dist1 = Math.sqrt(Math.pow(t1X - destPos.x, 2) + Math.pow(t1Y - destPos.y, 2));
          const dist2 = Math.sqrt(Math.pow(t2X - destPos.x, 2) + Math.pow(t2Y - destPos.y, 2));
          
          if (dist1 < dist2) {
             this.currentEvasionTarget = { x: t1X, y: t1Y };
          } else {
             this.currentEvasionTarget = { x: t2X, y: t2Y };
          }
          
        } else {
          return {
            desiredVelocity: { x: craftState.velocity.x * 0.7, y: craftState.velocity.y * 0.7 },
            activeMode: 'REPLANNING',
            executingTask: false,
            taskStatus: 'WAITING',
            navDecision: 'Replanning path',
          };
        }
      }

      if (this.currentEvasionTarget) {
        const evDx = this.currentEvasionTarget.x - craftPos.x;
        const evDy = this.currentEvasionTarget.y - craftPos.y;
        const evDist = Math.sqrt(evDx * evDx + evDy * evDy);

        const evasiveVel: Vector2D = {
          x: (evDx / (evDist || 1)) * craftState.maxSpeed,
          y: (evDy / (evDist || 1)) * craftState.maxSpeed,
        };

        return {
          desiredVelocity: evasiveVel,
          activeMode: 'AVOIDING',
          executingTask: false,
          taskStatus: 'WAITING',
          navDecision: 'Avoiding obstacle',
        };
      }
    }

    // Threat cleared, reset evasion flags
    if (this.evasionStarted && !criticalThreat) {
      this.evasionStarted = false;
      this.dangerDetectedTime = 0;
      this.currentEvasionTarget = null;
    }

    // 3. Normal Target-directed Navigation
    let speed = craftState.maxSpeed;
    if (distToTarget < 150) {
      speed = Math.max(1.0, craftState.maxSpeed * (distToTarget / 150));
    }

    const dx = destPos.x - craftPos.x;
    const dy = destPos.y - craftPos.y;

    const finalTargetVel: Vector2D = {
      x: (dx / distToTarget) * speed,
      y: (dy / distToTarget) * speed,
    };

    return {
      desiredVelocity: finalTargetVel,
      activeMode: 'TRAVELLING',
      executingTask: false,
      taskStatus: 'WAITING',
      navDecision: 'Moving toward target',
    };
  }
}
