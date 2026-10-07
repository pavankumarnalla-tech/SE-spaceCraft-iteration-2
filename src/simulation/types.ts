export type MissionState =
  | 'IDLE'
  | 'TRAVELLING'
  | 'REPLANNING'
  | 'AVOIDING'
  | 'ARRIVED'
  | 'EXECUTING_TASK'
  | 'TASK_COMPLETED'
  | 'MISSION_COMPLETED';

export type TaskType = 'survey' | 'inspection' | 'reconnaissance';

export interface MissionTaskConfig {
  id: TaskType;
  name: string;
  durationSeconds: number;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface SpacecraftState {
  position: Vector2D;
  velocity: Vector2D;
  heading: number;
  speed: number;
  maxSpeed: number;
  fuel: number;
  maxFuel: number;
  power: number;
  maxPower: number;
  sensorRadius: number;
  status: MissionState;
}

export interface Destination {
  id: string;
  name: string;
  position: Vector2D;
  arrivalRadius: number;
}

export interface DangerObstacle {
  position: Vector2D;
  radius: number;
  hazardRadius: number;
}

export type ScenarioType = 'clear' | 'multiple' | 'dense';

export type SensorStatus = 'READY' | 'ACTIVE';
export type NavStatus = 'READY' | 'ACTIVE' | 'COMPLETE';
export type PowerStatus = 'NORMAL' | 'LOW';
export type TaskStatus = 'READY' | 'WAITING' | 'EXECUTING' | 'COMPLETE';

export interface SubsystemStatus {
  sensors: SensorStatus;
  navigation: NavStatus;
  power: PowerStatus;
  missionTask: TaskStatus;
}

export interface TelemetryFrame {
  missionName: string;
  destinationName: string;
  scenarioName: string;
  missionTypeName: string;
  position: Vector2D;
  speed: number;
  distanceToTarget: number;
  fuel: number;
  power: number;
  status: MissionState;
  taskStatus: TaskStatus;
  subsystems: SubsystemStatus;
  duration: number;
  obstacleDetected: boolean;
  navDecision: string;
  powerConsumption: 'IDLE' | 'ACTIVE';
}

export const PREDEFINED_DESTINATIONS: Destination[] = [
  { id: 'lunar', name: 'Lunar Station', position: { x: 800, y: 250 }, arrivalRadius: 30 },
  { id: 'mars', name: 'Mars Outpost', position: { x: 850, y: 150 }, arrivalRadius: 30 },
  { id: 'orbital', name: 'Orbital Station', position: { x: 750, y: 350 }, arrivalRadius: 30 }
];

export const SCENARIOS: { id: ScenarioType; name: string }[] = [
  { id: 'clear', name: 'Clear Route' },
  { id: 'multiple', name: 'Multiple Obstacles' },
  { id: 'dense', name: 'Dense Obstacle Field' }
];

export const MISSION_TASKS: MissionTaskConfig[] = [
  { id: 'survey', name: 'Lunar Survey', durationSeconds: 2.5 },
  { id: 'inspection', name: 'Orbital Inspection', durationSeconds: 2.5 },
  { id: 'reconnaissance', name: 'Mars Reconnaissance', durationSeconds: 2.5 }
];
