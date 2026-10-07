import { useState, useEffect, useMemo } from 'react';
import { SimulationEngine } from './simulation/SimulationEngine';
import { SimulationCanvas } from './components/SimulationCanvas';
import { TelemetryPanel } from './components/TelemetryPanel';
import { PREDEFINED_DESTINATIONS, SCENARIOS, MISSION_TASKS } from './simulation/types';
import type { ScenarioType, TaskType } from './simulation/types';

type ViewState = 'HOME' | 'SETUP' | 'SIMULATION' | 'RESULT' | 'HISTORY';

interface CompletedMission {
  missionName: string;
  destination: string;
  scenarioName: string;
  missionTypeName: string;
  status: string;
  taskStatus: string;
  finalDistance: number;
  finalFuel: number;
  finalPower: number;
  missionDuration: number;
  obstacleAvoided: boolean;
}

export function App() {
  const engine = useMemo(() => new SimulationEngine(900, 500), []);
  const [view, setView] = useState<ViewState>('HOME');
  const [, setTick] = useState(0);

  const [setupName, setSetupName] = useState('Mission 01');
  const [setupDestId, setSetupDestId] = useState(PREDEFINED_DESTINATIONS[0].id);
  const [setupScenarioId, setSetupScenarioId] = useState<ScenarioType>('clear');
  const [setupTaskId, setSetupTaskId] = useState<TaskType>(MISSION_TASKS[0].id);
  
  const [completedMission, setCompletedMission] = useState<CompletedMission | null>(null);
  
  const [missionHistory, setMissionHistory] = useState<CompletedMission[]>(() => {
    try {
      const saved = localStorage.getItem('spacecraft_mission_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('spacecraft_mission_history', JSON.stringify(missionHistory));
    } catch {}
  }, [missionHistory]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (view === 'SIMULATION') {
      interval = setInterval(() => {
        setTick((t) => t + 1);
        const currentTelemetry = engine.getTelemetry();
        if (currentTelemetry.status === 'MISSION_COMPLETED') {
           const finalMission: CompletedMission = {
             missionName: currentTelemetry.missionName,
             destination: currentTelemetry.destinationName,
             scenarioName: currentTelemetry.scenarioName,
             missionTypeName: currentTelemetry.missionTypeName,
             status: currentTelemetry.status,
             taskStatus: currentTelemetry.taskStatus,
             finalDistance: currentTelemetry.distanceToTarget,
             finalFuel: currentTelemetry.fuel,
             finalPower: currentTelemetry.power,
             missionDuration: currentTelemetry.duration,
             obstacleAvoided: currentTelemetry.obstacleAvoided,
           };
           setCompletedMission(finalMission);
           setMissionHistory(prev => [finalMission, ...prev]);
           setTimeout(() => setView('RESULT'), 1000);
           clearInterval(interval);
        }
      }, 100);
    }
    return () => clearInterval(interval);
  }, [view, engine]);

  const telemetry = engine.getTelemetry();

  const handleStartMission = () => {
    const dest = PREDEFINED_DESTINATIONS.find(d => d.id === setupDestId) || PREDEFINED_DESTINATIONS[0];
    const task = MISSION_TASKS.find(t => t.id === setupTaskId) || MISSION_TASKS[0];
    engine.configureMission(setupName, dest, setupScenarioId, task);
    engine.startMission();
    setView('SIMULATION');
  };

  const handleResetInSimulation = () => {
    engine.resetMission();
    setView('SETUP');
  };

  const handleRunAnother = () => {
    engine.resetMission();
    setView('SETUP');
  };

  const handleGoHome = () => {
    engine.resetMission();
    setView('HOME');
  };

  const handleDestinationChange = (destId: string) => {
    setSetupDestId(destId);
    if (destId === 'lunar') setSetupTaskId('survey');
    else if (destId === 'orbital') setSetupTaskId('inspection');
    else if (destId === 'mars') setSetupTaskId('reconnaissance');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center p-8 font-sans text-slate-100">
      
      {/* Top Nav for History */}
      <div className="w-full max-w-6xl flex justify-end mb-4">
        {view !== 'SIMULATION' && (
          <button 
            onClick={() => setView(view === 'HISTORY' ? 'HOME' : 'HISTORY')}
            className="text-slate-400 hover:text-white transition-colors text-sm font-semibold uppercase tracking-wider"
          >
            {view === 'HISTORY' ? 'Back' : 'Mission History'}
          </button>
        )}
      </div>

      <div className="max-w-6xl w-full flex flex-col items-center">

        {view === 'HOME' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full max-w-2xl">
            <h1 className="text-5xl font-bold text-white mb-6">Autonomous Spacecraft</h1>
            <p className="text-xl text-slate-400 mb-12">Autonomous spacecraft navigation and obstacle avoidance simulation</p>
            <button
              onClick={() => setView('SETUP')}
              className="px-8 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-lg transition-colors shadow-lg"
            >
              Start New Mission
            </button>
          </div>
        )}

        {view === 'SETUP' && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] w-full max-w-lg mx-auto">
            <h2 className="text-4xl font-bold text-white mb-8">Mission Setup</h2>
            
            <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-8 flex flex-col gap-6 shadow-lg">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Mission Name</label>
                <input
                  type="text"
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Destination</label>
                <select
                  value={setupDestId}
                  onChange={(e) => handleDestinationChange(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                >
                  {PREDEFINED_DESTINATIONS.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Mission Task</label>
                <select
                  value={setupTaskId}
                  onChange={(e) => setSetupTaskId(e.target.value as TaskType)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                >
                  {MISSION_TASKS.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Scenario</label>
                <select
                  value={setupScenarioId}
                  onChange={(e) => setSetupScenarioId(e.target.value as ScenarioType)}
                  className="bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-blue-500"
                >
                  {SCENARIOS.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleStartMission}
                className="mt-4 px-6 py-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg transition-colors"
              >
                Start Mission
              </button>
            </div>
          </div>
        )}

        {view === 'SIMULATION' && (
          <div className="w-full flex flex-col gap-4">
            
            {/* System Subsystem Flow Relationship Indicator */}
            <div className="w-full bg-slate-900 border border-slate-700/80 rounded-xl p-3 px-6 flex items-center justify-between text-xs font-mono shadow-md text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-blue-400">SENSORS</span>
                <span className="text-slate-500 font-sans">──→</span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-blue-400">NAVIGATION</span>
                <span className="text-slate-500 font-sans">──→</span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-white">SPACECRAFT SOFTWARE</span>
                <span className="text-slate-500 font-sans">──→</span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-emerald-400">MISSION TASK</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-sans text-xs">Bus:</span>
                <span className="px-2.5 py-1 rounded bg-slate-800 border border-slate-700 font-bold text-emerald-400">POWER ({telemetry.power}%)</span>
              </div>
            </div>

            <div className="flex justify-end w-full">
              <button
                onClick={handleResetInSimulation}
                className="px-6 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors shadow-sm text-sm"
              >
                Reset Mission
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full">
              <div className="lg:col-span-3">
                <SimulationCanvas engine={engine} width={900} height={500} />
              </div>
              <div className="lg:col-span-1">
                <TelemetryPanel telemetry={telemetry} />
              </div>
            </div>

          </div>
        )}

        {view === 'RESULT' && completedMission && (
          <div className="flex flex-col items-center justify-center min-h-[60vh] text-center w-full max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold text-white mb-8">Mission Completed</h2>
            
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-left">
              
              {/* SECTION 1: MISSION SUMMARY */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-3.5 shadow-lg">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  MISSION SUMMARY
                </h3>

                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Mission Name</span>
                  <span className="text-white text-sm font-bold">{completedMission.missionName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Destination</span>
                  <span className="text-white text-sm font-bold">{completedMission.destination}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Mission Task</span>
                  <span className="text-white text-sm font-bold">{completedMission.missionTypeName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Scenario</span>
                  <span className="text-white text-sm font-bold">{completedMission.scenarioName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Final Status</span>
                  <span className="text-emerald-400 text-sm font-bold">
                    {completedMission.status === 'MISSION_COMPLETED' ? 'Mission Completed' : completedMission.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm font-semibold">Mission Duration</span>
                  <span className="text-white text-sm font-bold">{completedMission.missionDuration.toFixed(1)}s</span>
                </div>
              </div>

              {/* SECTION 2: SPACECRAFT SYSTEM RESULT */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 space-y-3.5 shadow-lg">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest border-b border-slate-800 pb-2">
                  SPACECRAFT SYSTEM RESULT
                </h3>

                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Sensors Subsystem</span>
                  <span className="text-blue-400 text-sm font-bold">Operational</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Navigation Subsystem</span>
                  <span className="text-emerald-400 text-sm font-bold">Completed</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Final Power</span>
                  <span className="text-white text-sm font-bold">{completedMission.finalPower}%</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Mission Task</span>
                  <span className="text-emerald-400 text-sm font-bold">{completedMission.taskStatus}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400 text-sm font-semibold">Final Distance</span>
                  <span className="text-white text-sm font-bold">{completedMission.finalDistance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-sm font-semibold">Final Fuel</span>
                  <span className="text-white text-sm font-bold">{completedMission.finalFuel}%</span>
                </div>
              </div>

            </div>

            {/* SECTION 3: MISSION EXECUTION LIFECYCLE SUMMARY */}
            <div className="w-full bg-slate-900 border border-slate-700 rounded-xl p-6 mb-8 text-left shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 border-b border-slate-800 pb-2">
                MISSION EXECUTION LIFECYCLE SUMMARY
              </h3>
              
              <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-2 text-slate-300">
                <span className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 font-bold text-slate-200">MISSION START</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 font-bold text-blue-400">SENSORS ACTIVE</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 font-bold text-blue-400">AUTONOMOUS NAVIGATION</span>
                {completedMission.obstacleAvoided && (
                  <>
                    <span className="text-slate-500">→</span>
                    <span className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 font-bold text-rose-400">OBSTACLE AVOIDED</span>
                  </>
                )}
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 font-bold text-amber-400">DESTINATION REACHED</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 font-bold text-emerald-400">MISSION TASK EXECUTED</span>
                <span className="text-slate-500">→</span>
                <span className="px-3 py-1.5 rounded bg-slate-800 border border-slate-700 font-bold text-emerald-400">MISSION COMPLETED</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleRunAnother}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors"
              >
                Run Another Mission
              </button>
              <button
                onClick={handleGoHome}
                className="px-6 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-semibold transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {view === 'HISTORY' && (
          <div className="w-full flex flex-col items-center">
            <h2 className="text-3xl font-bold text-white mb-8">Mission History</h2>
            {missionHistory.length === 0 ? (
              <p className="text-slate-400">No missions completed yet.</p>
            ) : (
              <div className="w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-lg">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50">
                      <th className="p-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Mission Name</th>
                      <th className="p-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Destination</th>
                      <th className="p-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Task</th>
                      <th className="p-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Duration</th>
                      <th className="p-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Fuel</th>
                      <th className="p-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Power</th>
                      <th className="p-4 text-sm font-semibold text-slate-300 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {missionHistory.map((mission, index) => (
                      <tr key={index} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-4 text-white font-medium">{mission.missionName}</td>
                        <td className="p-4 text-slate-300">{mission.destination}</td>
                        <td className="p-4 text-slate-300">{mission.missionTypeName}</td>
                        <td className="p-4 text-slate-300">{mission.missionDuration.toFixed(1)}s</td>
                        <td className="p-4 text-slate-300">{mission.finalFuel}%</td>
                        <td className="p-4 text-slate-300">{mission.finalPower}%</td>
                        <td className="p-4 text-emerald-400 font-medium">{mission.status === 'MISSION_COMPLETED' ? 'Completed' : mission.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
