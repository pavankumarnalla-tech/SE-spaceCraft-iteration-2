import { Spacecraft } from './Spacecraft';
import { AutonomousController } from './AutonomousController';
import { Environment } from './Environment';
import { Sensors } from './Sensors';
import { MISSION_TASKS } from './types';
import type { TelemetryFrame, Destination, ScenarioType, MissionTaskConfig, SubsystemStatus, SensorStatus, NavStatus, PowerStatus, TaskStatus } from './types';

export class SimulationEngine {
  public spacecraft: Spacecraft;
  public environment: Environment;
  public controller: AutonomousController;

  private isRunning: boolean = false;
  private missionName: string = 'Mission 01';
  private missionTask: MissionTaskConfig = MISSION_TASKS[0];
  private startTime: number = 0;
  private endTime: number = 0;
  private currentDuration: number = 0;
  private currentTaskStatus: TaskStatus = 'READY';
  private currentNavDecision: string = 'Moving toward target';
  private currentThreatDetected: boolean = false;
  private obstacleAvoidedDuringRun: boolean = false;

  constructor(width: number = 900, height: number = 500) {
    this.spacecraft = new Spacecraft({ x: 100, y: height / 2 });
    this.environment = new Environment(width, height);
    this.controller = new AutonomousController();
  }

  public configureMission(
    name: string,
    dest: Destination,
    scenario: ScenarioType,
    task: MissionTaskConfig,
    canvasWidth: number = 900,
    canvasHeight: number = 500
  ): void {
    this.missionName = name;
    this.missionTask = task;
    this.environment.setDestination(dest);
    this.environment.setScenario(scenario, canvasWidth, canvasHeight);
  }

  public startMission(): void {
    if (this.spacecraft.getState().status === 'IDLE') {
      this.spacecraft.setStatus('TRAVELLING');
      this.isRunning = true;
      this.startTime = Date.now();
      this.endTime = 0;
      this.currentDuration = 0;
      this.currentTaskStatus = 'WAITING';
      this.currentNavDecision = 'Moving toward target';
      this.obstacleAvoidedDuringRun = false;
    }
  }

  public resetMission(width: number = 900, height: number = 500): void {
    this.isRunning = false;
    this.startTime = 0;
    this.endTime = 0;
    this.currentDuration = 0;
    this.currentTaskStatus = 'READY';
    this.currentNavDecision = 'Moving toward target';
    this.currentThreatDetected = false;
    this.obstacleAvoidedDuringRun = false;
    this.spacecraft.reset({ x: 100, y: height / 2 });
    this.environment.reset(width, height);
    this.controller.reset();
  }

  public update(deltaTimeSeconds: number): void {
    if (!this.isRunning) return;

    this.currentDuration = (Date.now() - this.startTime) / 1000;

    const craftState = this.spacecraft.getState();
    const destination = this.environment.getDestination();
    const obstacles = this.environment.getObstacles();

    // 1. Sensor Subsystem collects environmental metrics
    const sensorReading = Sensors.readSensors(craftState, destination, obstacles);
    this.currentThreatDetected = !!(sensorReading.threat && (sensorReading.threat.inTrajectoryPath || sensorReading.threat.distance < sensorReading.threat.obstacle.hazardRadius + 30));

    // 2. Navigation Subsystem computes steering vector and task execution state
    const controlOutput = this.controller.computeControl(
      craftState,
      destination,
      sensorReading,
      this.missionTask,
      deltaTimeSeconds
    );

    if (controlOutput.activeMode === 'AVOIDING') {
      this.obstacleAvoidedDuringRun = true;
    }

    this.currentTaskStatus = controlOutput.taskStatus;
    this.currentNavDecision = controlOutput.navDecision;

    // 3. Spacecraft Physics & Power Subsystem update
    if (controlOutput.activeMode === 'MISSION_COMPLETED') {
      this.spacecraft.setStatus('MISSION_COMPLETED');
      this.spacecraft.updatePhysics({ x: 0, y: 0 }, deltaTimeSeconds, false);
      this.isRunning = false;
      this.endTime = Date.now();
      this.currentDuration = (this.endTime - this.startTime) / 1000;
    } else {
      this.spacecraft.setStatus(controlOutput.activeMode);
      this.spacecraft.updatePhysics(controlOutput.desiredVelocity, deltaTimeSeconds, controlOutput.executingTask);
    }
  }

  public getTelemetry(): TelemetryFrame & { obstacleAvoided: boolean } {
    const craftState = this.spacecraft.getState();
    const dest = this.environment.getDestination();
    
    const scenarioId = this.environment.getScenario();
    let scenarioName = 'Clear Route';
    if (scenarioId === 'multiple') scenarioName = 'Multiple Obstacles';
    if (scenarioId === 'dense') scenarioName = 'Dense Obstacle Field';

    const dx = dest.position.x - craftState.position.x;
    const dy = dest.position.y - craftState.position.y;
    const distToTarget = Math.sqrt(dx * dx + dy * dy);

    // Subsystem Status Monitoring
    const sensorStatus: SensorStatus = craftState.status === 'IDLE' ? 'READY' : 'ACTIVE';
    
    let navStatus: NavStatus = 'ACTIVE';
    if (craftState.status === 'IDLE') navStatus = 'READY';
    if (craftState.status === 'MISSION_COMPLETED' || craftState.status === 'EXECUTING_TASK') navStatus = 'COMPLETE';

    const powerStatus: PowerStatus = craftState.power > 20 ? 'NORMAL' : 'LOW';

    const subsystems: SubsystemStatus = {
      sensors: sensorStatus,
      navigation: navStatus,
      power: powerStatus,
      missionTask: this.currentTaskStatus,
    };

    return {
      missionName: this.missionName,
      destinationName: dest.name,
      scenarioName: scenarioName,
      missionTypeName: this.missionTask.name,
      position: { ...craftState.position },
      speed: Number(craftState.speed.toFixed(2)),
      distanceToTarget: Number(distToTarget.toFixed(1)),
      fuel: Number(craftState.fuel.toFixed(1)),
      power: Number(craftState.power.toFixed(1)),
      status: craftState.status,
      taskStatus: this.currentTaskStatus,
      subsystems,
      duration: this.currentDuration,
      obstacleDetected: this.currentThreatDetected,
      navDecision: this.currentNavDecision,
      powerConsumption: this.isRunning ? 'ACTIVE' : 'IDLE',
      obstacleAvoided: this.obstacleAvoidedDuringRun,
    };
  }
}
