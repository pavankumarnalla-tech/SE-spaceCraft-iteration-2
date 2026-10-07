import type { SpacecraftState, Vector2D, MissionState } from './types';

export class Spacecraft {
  private state: SpacecraftState;
  private readonly defaultPosition: Vector2D;

  constructor(initialPosition: Vector2D = { x: 100, y: 250 }) {
    this.defaultPosition = { ...initialPosition };
    this.state = this.getInitialState();
  }

  public getInitialState(): SpacecraftState {
    return {
      position: { ...this.defaultPosition },
      velocity: { x: 0, y: 0 },
      heading: 0,
      speed: 0,
      maxSpeed: 4.5,
      fuel: 100,
      maxFuel: 100,
      power: 100,
      maxPower: 100,
      sensorRadius: 120,
      status: 'IDLE',
    };
  }

  public getState(): Readonly<SpacecraftState> {
    return this.state;
  }

  public setStatus(status: MissionState): void {
    this.state.status = status;
  }

  public reset(position?: Vector2D): void {
    if (position) {
      this.defaultPosition.x = position.x;
      this.defaultPosition.y = position.y;
    }
    this.state = this.getInitialState();
  }

  public updatePhysics(desiredVelocity: Vector2D, deltaTime: number, executingTask: boolean = false): void {
    if (this.state.status === 'IDLE' || this.state.status === 'MISSION_COMPLETED') {
      this.state.speed = 0;
      this.state.velocity = { x: 0, y: 0 };
      return;
    }

    if (this.state.fuel <= 0 || this.state.power <= 0) {
      return;
    }

    // Steering and velocity physics
    const steeringFactor = 0.08;
    this.state.velocity.x += (desiredVelocity.x - this.state.velocity.x) * steeringFactor;
    this.state.velocity.y += (desiredVelocity.y - this.state.velocity.y) * steeringFactor;

    const currentSpeed = Math.sqrt(
      this.state.velocity.x * this.state.velocity.x +
      this.state.velocity.y * this.state.velocity.y
    );

    if (currentSpeed > this.state.maxSpeed) {
      const scale = this.state.maxSpeed / currentSpeed;
      this.state.velocity.x *= scale;
      this.state.velocity.y *= scale;
      this.state.speed = this.state.maxSpeed;
    } else {
      this.state.speed = currentSpeed;
    }

    this.state.position.x += this.state.velocity.x * deltaTime * 60;
    this.state.position.y += this.state.velocity.y * deltaTime * 60;

    if (this.state.speed > 0.05) {
      this.state.heading = Math.atan2(this.state.velocity.y, this.state.velocity.x);
    }

    // Fuel consumption (movement based)
    const thrustUsage = (this.state.speed / this.state.maxSpeed) * 0.015 * deltaTime * 60;
    this.state.fuel = Math.max(0, this.state.fuel - thrustUsage);

    // Power consumption (Subsystem operations: sensors + navigation + propulsion + task payload)
    const baseSubsystemPowerLoad = 0.04 * deltaTime * 60; // Sensors & Navigation subsystem draw
    const propulsionPowerLoad = (this.state.speed / this.state.maxSpeed) * 0.08 * deltaTime * 60;
    const taskPowerLoad = executingTask ? 0.3 * deltaTime * 60 : 0;
    
    const totalPowerUsage = baseSubsystemPowerLoad + propulsionPowerLoad + taskPowerLoad;
    this.state.power = Math.max(0, this.state.power - totalPowerUsage);
  }
}
