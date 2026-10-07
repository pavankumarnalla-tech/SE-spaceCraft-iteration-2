import React from 'react';
import type { TelemetryFrame } from '../simulation/types';

interface TelemetryPanelProps {
  telemetry: TelemetryFrame;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry }) => {
  const getStatusText = () => {
    switch (telemetry.status) {
      case 'IDLE': return 'Ready';
      case 'TRAVELLING': return 'Travelling';
      case 'REPLANNING': return 'Replanning Route';
      case 'AVOIDING': return 'Avoiding Obstacle';
      case 'ARRIVED': return 'Arrived at Destination';
      case 'EXECUTING_TASK': return 'Executing Mission Task';
      case 'TASK_COMPLETED': return 'Task Completed';
      case 'MISSION_COMPLETED': return 'Mission Completed';
      default: return 'Unknown';
    }
  };

  const formattedPos = `(${Math.round(telemetry.position.x)}, ${Math.round(telemetry.position.y)})`;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-lg text-slate-100 flex flex-col gap-4 text-xs font-sans">
      
      {/* SECTION 1: MISSION & TELEMETRY SUMMARY */}
      <div className="space-y-2 pb-3 border-b border-slate-800">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MISSION</div>
        <div className="text-sm font-bold text-white">{telemetry.missionName}</div>
        <div className="text-xs text-slate-300 font-medium">{telemetry.destinationName} • {telemetry.missionTypeName}</div>

        <div className="pt-2">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STATUS</div>
          <div className="text-sm font-bold text-emerald-400">{getStatusText()}</div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <div className="text-[10px] text-slate-400 font-semibold">Distance</div>
            <div className="text-xs font-bold text-white">{telemetry.distanceToTarget} km</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold">Velocity</div>
            <div className="text-xs font-bold text-white">{telemetry.speed} km/s</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold">Fuel</div>
            <div className="text-xs font-bold text-white">{telemetry.fuel}%</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-semibold">Power</div>
            <div className="text-xs font-bold text-white">{telemetry.power}%</div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SENSORS SUBSYSTEM */}
      <div className="space-y-1.5 pb-3 border-b border-slate-800">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SENSORS</span>
          <span className="text-[10px] font-bold text-blue-400">Status: {telemetry.subsystems.sensors}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <span className="text-[10px] text-slate-400">Position</span>
            <div className="text-xs font-semibold text-slate-200">{formattedPos}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Target Distance</span>
            <div className="text-xs font-semibold text-slate-200">{telemetry.distanceToTarget} km</div>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400">Obstacle Detection</span>
          <div className={`text-xs font-bold ${telemetry.obstacleDetected ? 'text-rose-400' : 'text-emerald-400'}`}>
            {telemetry.obstacleDetected ? 'DETECTED' : 'CLEAR'}
          </div>
        </div>
      </div>

      {/* SECTION 3: NAVIGATION SUBSYSTEM */}
      <div className="space-y-1.5 pb-3 border-b border-slate-800">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NAVIGATION</span>
          <span className="text-[10px] font-bold text-blue-400">Status: {telemetry.subsystems.navigation}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <span className="text-[10px] text-slate-400">Mode</span>
            <div className="text-xs font-semibold text-slate-200">{telemetry.status}</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Target</span>
            <div className="text-xs font-semibold text-slate-200">{telemetry.destinationName}</div>
          </div>
        </div>
        <div>
          <span className="text-[10px] text-slate-400">Decision</span>
          <div className="text-xs font-semibold text-amber-300">{telemetry.navDecision}</div>
        </div>
      </div>

      {/* SECTION 4: POWER SUBSYSTEM */}
      <div className="space-y-1.5 pb-3 border-b border-slate-800">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">POWER</span>
          <span className="text-[10px] font-bold text-emerald-400">Status: {telemetry.subsystems.power}</span>
        </div>
        <div className="grid grid-cols-2 gap-1">
          <div>
            <span className="text-[10px] text-slate-400">Remaining</span>
            <div className="text-xs font-bold text-white">{telemetry.power}%</div>
          </div>
          <div>
            <span className="text-[10px] text-slate-400">Consumption</span>
            <div className="text-xs font-semibold text-slate-200">{telemetry.powerConsumption}</div>
          </div>
        </div>
      </div>

      {/* SECTION 5: MISSION TASK SUBSYSTEM */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">MISSION TASK</span>
          <span className={`text-[10px] font-bold ${telemetry.taskStatus === 'EXECUTING' ? 'text-yellow-400 animate-pulse' : telemetry.taskStatus === 'COMPLETE' ? 'text-emerald-400' : 'text-slate-400'}`}>
            {telemetry.taskStatus}
          </span>
        </div>
        <div className="text-xs font-bold text-white">{telemetry.missionTypeName}</div>
      </div>

    </div>
  );
};
