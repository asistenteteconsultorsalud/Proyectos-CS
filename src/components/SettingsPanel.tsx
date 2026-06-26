import React, { useState } from 'react';
import { Layers, Sliders, Briefcase, Plus, Edit2, Trash2, Check, X, AlertTriangle, HelpCircle, Save, User, Database, Wifi, WifiOff, Activity, CheckCircle, AlertCircle, Terminal } from 'lucide-react';
import { getAreaStyle, AREA_COLOR_PRESETS, getDefaultPresetKey } from '../types';

interface StageData {
  label: string;
  color: string;
  bg: string;
  border: string;
  text: string;
  definition: string;
  keyDeliverables: string[];
  typicalDuration: string;
}

interface SettingsPanelProps {
  involvedAreas: string[];
  stageDetails: Record<string, StageData>;
  onAddArea: (areaName: string, colorKey?: string) => void;
  onUpdateArea: (oldName: string, newName: string) => void;
  onDeleteArea: (areaName: string) => void;
  onAddStage: (key: string, stageInfo: StageData) => void;
  onUpdateStage: (key: string, stageInfo: StageData, previousKey?: string) => void;
  onDeleteStage: (key: string) => void;
  peopleByArea: Record<string, string[]>;
  onSetPeopleByArea: (updated: Record<string, string[]>) => void;
  teamRoster: string[];
  onSetTeamRoster: (updated: string[]) => void;
  areaColors: Record<string, string>;
  onUpdateAreaColor: (areaName: string, colorKey: string) => void;
  customDbUrl: string;
  onUpdateCustomDbUrl: (url: string) => void;
  isLocalMode: boolean;
  onSwitchToDbMode: () => void;
  onBypassDb: () => void;
}

// Map of standard tailwind colors accessible by user
const PRESET_COLORS = [
  { name: 'Azul (Corporativo)', key: 'blue', color: 'bg-blue-500', bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { name: 'Esmeralda (Progreso)', key: 'emerald', color: 'bg-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { name: 'Violeta / Morado (Evaluación)', key: 'purple', color: 'bg-purple-500', bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { name: 'Ambar / Amarillo (Inicio)', key: 'amber', color: 'bg-amber-500', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { name: 'Fucsia / Rojo (Pausa)', key: 'rose', color: 'bg-rose-500', bg: 'bg-rose-50', border: 'border-rose-200', text: 'text-rose-700' },
  { name: 'Slate / Gris (Completado)', key: 'slate', color: 'bg-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', text: 'text-slate-700' },
  { name: 'Gris Claro (Cancelado)', key: 'gray', color: 'bg-slate-400', bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-500' },
];

export default function SettingsPanel({
  involvedAreas,
  stageDetails,
  onAddArea,
  onUpdateArea,
  onDeleteArea,
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  peopleByArea,
  onSetPeopleByArea,
  teamRoster,
  onSetTeamRoster,
  areaColors,
  onUpdateAreaColor,
  customDbUrl,
  onUpdateCustomDbUrl,
  isLocalMode,
  onSwitchToDbMode,
  onBypassDb,
}: SettingsPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'areas' | 'etapas' | 'conexion'>('areas');

  // --- Connection Test States ---
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testError, setTestError] = useState<string | null>(null);
  const [testDetails, setTestDetails] = useState<any>(null);

  const handleTestConnection = async (urlToTest: string) => {
    setTestStatus('testing');
    setTestError(null);
    setTestDetails(null);
    try {
      const headers: Record<string, string> = {};
      const trimmedUrl = (urlToTest || '').trim();
      if (trimmedUrl) {
        headers['x-database-url'] = trimmedUrl;
      }
      const res = await fetch('/api/test-db', { headers });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: El servidor no pudo procesar la solicitud de diagnóstico.`);
      }
      const data = await res.json();
      if (data.status === 'Success') {
        setTestStatus('success');
        setTestDetails(data.debugInfo);
      } else {
        setTestStatus('failed');
        setTestError(data.debugInfo?.connect_error || 'No se pudo establecer conexión con la base de datos de Neon.');
        setTestDetails(data.debugInfo);
      }
    } catch (err: any) {
      setTestStatus('failed');
      setTestError(err.message || String(err));
    }
  };

  // --- Area form states ---
  const [newAreaName, setNewAreaName] = useState('');
  const [selectedNewAreaColorKey, setSelectedNewAreaColorKey] = useState('blue');
  const [editingAreaName, setEditingAreaName] = useState<string | null>(null);
  const [editedAreaName, setEditedAreaName] = useState('');

  // --- Team and Assignment states & handlers ---
  const [newMemberName, setNewMemberName] = useState('');
  const [selectedMemberForArea, setSelectedMemberForArea] = useState<Record<string, string>>({});

  const handleAddMemberToRoster = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (teamRoster.includes(trimmed)) {
      alert("Este consultor/miembro ya está registrado en el equipo de trabajo.");
      return;
    }
    onSetTeamRoster([...teamRoster, trimmed]);
    setNewMemberName('');
  };

  const handleDeleteMemberFromRoster = (name: string) => {
    if (window.confirm(`¿Está seguro de eliminar a "${name}" del equipo de trabajo? Se desvinculará automáticamente de todas las áreas y proyectos asignados.`)) {
      // Remove from roster
      onSetTeamRoster(teamRoster.filter(m => m !== name));
      
      // Remove from all areas (peopleByArea)
      const updatedPeopleByArea = { ...peopleByArea };
      Object.keys(updatedPeopleByArea).forEach(area => {
        updatedPeopleByArea[area] = (updatedPeopleByArea[area] || []).filter(person => person !== name);
      });
      onSetPeopleByArea(updatedPeopleByArea);
    }
  };

  const handleAssignMemberToArea = (area: string, name: string) => {
    if (!name) return;
    const currentList = peopleByArea[area] || [];
    if (currentList.includes(name)) return;
    const updated = {
      ...peopleByArea,
      [area]: [...currentList, name]
    };
    onSetPeopleByArea(updated);
    
    // Reset selection input
    setSelectedMemberForArea(prev => ({ ...prev, [area]: '' }));
  };

  const handleUnassignMemberFromArea = (area: string, name: string) => {
    const currentList = peopleByArea[area] || [];
    const updated = {
      ...peopleByArea,
      [area]: currentList.filter(p => p !== name)
    };
    onSetPeopleByArea(updated);
  };

  // --- Stage form states ---
  const [editingStageKey, setEditingStageKey] = useState<string | null>(null);
  const [isCreatingStage, setIsCreatingStage] = useState(false);

  // Stage Fields
  const [stageKey, setStageKey] = useState('');
  const [stageForm, setStageForm] = useState({
    label: '',
    colorPreset: 'blue',
    definition: '',
    deliverableInput: '',
    typicalDuration: '1 - 2 semanas'
  });
  const [stageDeliverables, setStageDeliverables] = useState<string[]>([]);

  // Start adding a new stage
  const handleStartCreateStage = () => {
    setIsCreatingStage(true);
    setEditingStageKey(null);
    setStageKey('');
    setStageForm({
      label: '',
      colorPreset: 'blue',
      definition: '',
      deliverableInput: '',
      typicalDuration: '1 - 2 semanas'
    });
    setStageDeliverables([]);
  };

  // Start editing an existing stage
  const handleStartEditStage = (key: string) => {
    const s = stageDetails[key];
    if (!s) return;

    // Find closest color preset
    const preset = PRESET_COLORS.find(p => p.color === s.color) || PRESET_COLORS[0];

    setIsCreatingStage(false);
    setEditingStageKey(key);
    setStageKey(key);
    setStageForm({
      label: s.label,
      colorPreset: preset.key,
      definition: s.definition || '',
      deliverableInput: '',
      typicalDuration: s.typicalDuration || '1 - 2 semanas'
    });
    setStageDeliverables(s.keyDeliverables || []);
  };

  const handleAddDeliverable = () => {
    const trimmed = stageForm.deliverableInput.trim();
    if (!trimmed) return;
    if (stageDeliverables.includes(trimmed)) return;
    setStageDeliverables([...stageDeliverables, trimmed]);
    setStageForm(prev => ({ ...prev, deliverableInput: '' }));
  };

  const handleRemoveDeliverable = (item: string) => {
    setStageDeliverables(stageDeliverables.filter(d => d !== item));
  };

  const handleSaveStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stageKey.trim()) return;

    const preset = PRESET_COLORS.find(p => p.key === stageForm.colorPreset) || PRESET_COLORS[0];
    
    const stageData: StageData = {
      label: stageForm.label.trim() || stageKey,
      color: preset.color,
      bg: preset.bg,
      border: preset.border,
      text: preset.text,
      definition: stageForm.definition.trim(),
      keyDeliverables: stageDeliverables,
      typicalDuration: stageForm.typicalDuration.trim()
    };

    if (isCreatingStage) {
      onAddStage(stageKey.toUpperCase().replace(/\s+/g, '_'), stageData);
      setIsCreatingStage(false);
    } else if (editingStageKey) {
      onUpdateStage(stageKey.toUpperCase().replace(/\s+/g, '_'), stageData, editingStageKey);
      setEditingStageKey(null);
    }
  };

  const handleKeyPressAddDeliverable = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddDeliverable();
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-205">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sliders className="w-5.5 h-5.5 text-blue-600" />
            Configuración Core de Flujo de Trabajo
          </h2>
          <p className="text-xs text-slate-500 font-medium">Añada, modifique y elimine las etapas de consultoría y las áreas del equipo técnico técnico de Consultorsalud</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap bg-slate-200/50 p-1.5 rounded-2xl border border-slate-200 text-xs gap-1">
          <button
            onClick={() => { setActiveSubTab('areas'); setEditingStageKey(null); setIsCreatingStage(false); }}
            className={`px-4 py-2 rounded-xl font-semibold cursor-pointer transition-all ${
              activeSubTab === 'areas' ? 'bg-white text-blue-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Sedes / Áreas Técnicas
          </button>
          <button
            onClick={() => { setActiveSubTab('etapas'); setEditingAreaName(null); }}
            className={`px-4 py-2 rounded-xl font-semibold cursor-pointer transition-all ${
              activeSubTab === 'etapas' ? 'bg-white text-blue-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Etapas del Contrato
          </button>
          <button
            onClick={() => { setActiveSubTab('conexion'); setEditingAreaName(null); setEditingStageKey(null); setIsCreatingStage(false); }}
            className={`px-4 py-2 rounded-xl font-semibold cursor-pointer transition-all ${
              activeSubTab === 'conexion' ? 'bg-white text-blue-600 shadow-xs font-black' : 'text-slate-600 hover:text-slate-950'
            }`}
          >
            Base de Datos (Neon / Vercel)
          </button>
        </div>
      </div>

      {/* --- SUBTAB: AREAS --- */}
      {activeSubTab === 'areas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: current areas and assignments (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-850 flex items-center gap-1.5 uppercase tracking-wide">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  Áreas Técnicas y Personal Asignado ({involvedAreas.length})
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">Distribución Interna</span>
              </div>

              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {involvedAreas.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center font-medium">No hay áreas técnicas registradas. Cree una nueva área a la derecha.</p>
                ) : (
                  involvedAreas.map((area) => (
                    <div key={area} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-200/60 hover:bg-slate-50 transition-all">
                      {editingAreaName === area ? (
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-blue-400 shadow-sm">
                          <div className="flex gap-2 items-center">
                            <span className="text-[11px] font-black text-slate-500 uppercase shrink-0">Nombre:</span>
                            <input
                              type="text"
                              value={editedAreaName}
                              onChange={(e) => setEditedAreaName(e.target.value)}
                              className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-855 focus:border-blue-500 focus:outline-none font-bold"
                            />
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
                            <span className="text-[11px] font-black text-slate-500 uppercase">Elegir Color:</span>
                            <div className="flex items-center gap-1 bg-slate-50 p-1 px-2 rounded-xl border border-slate-200">
                              {Object.keys(AREA_COLOR_PRESETS).map((presetKey) => {
                                const preset = AREA_COLOR_PRESETS[presetKey];
                                const isCurrent = (areaColors[area] || getDefaultPresetKey(area)) === presetKey;
                                return (
                                  <button
                                    key={presetKey}
                                    type="button"
                                    onClick={() => onUpdateAreaColor(area, presetKey)}
                                    className={`w-3.5 h-3.5 rounded-full ${preset.circleBg} hover:scale-125 transition-transform cursor-pointer relative ${
                                      isCurrent ? 'ring-2 ring-offset-1 ring-slate-800 scale-110' : 'opacity-65 hover:opacity-100'
                                    }`}
                                    title={`Color ${presetKey}`}
                                  />
                                );
                              })}
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingAreaName(null)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1"
                            >
                              <X className="w-3 h-3" />
                              <span>Cancelar</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateArea(area, editedAreaName);
                                setEditingAreaName(null);
                              }}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3 h-3" />
                              <span>Guardar Cambios</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`w-3.5 h-3.5 rounded-full ${getAreaStyle(area).circleBg} shadow-inner`}></span>
                              <span className={`text-xs font-black uppercase tracking-wide px-2.5 py-1 rounded-xl border ${getAreaStyle(area).bg} ${getAreaStyle(area).text} ${getAreaStyle(area).border}`}>
                                {area}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-1 ml-auto sm:ml-0">
                              <button
                                onClick={() => {
                                  setEditingAreaName(area);
                                  setEditedAreaName(area);
                                }}
                                className="p-1 px-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                                <span>Renombrar</span>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`¿Está seguro que desea eliminar el área "${area}"? Se desvinculará de todos los proyectos activos.`)) {
                                    onDeleteArea(area);
                                  }
                                }}
                                className="p-1 px-2 text-slate-450 hover:text-red-650 hover:bg-red-50 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                          </div>

                          {/* Staff lists for the area */}
                          <div className="space-y-2">
                            <div className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Equipo asignado al área:</div>
                            <div className="flex flex-wrap gap-1.5">
                              {(!peopleByArea[area] || peopleByArea[area].length === 0) ? (
                                <span className="text-[11px] text-slate-450 italic">No hay personal asignado a esta área de respuesta aún.</span>
                              ) : (
                                peopleByArea[area].map((name) => (
                                  <span 
                                    key={name} 
                                    className="inline-flex items-center gap-1.5 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50/30 text-slate-700 hover:text-red-700 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all group"
                                  >
                                    <User className="w-3 h-3 text-slate-400 group-hover:text-red-400" />
                                    <span>{name}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleUnassignMemberFromArea(area, name)}
                                      className="text-slate-400 hover:text-red-650 transition-colors cursor-pointer"
                                      title={`Desasignar ${name}`}
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>

                            {/* Assign Member to area */}
                            <div className="pt-2.5 mt-2 border-t border-slate-200/50 flex flex-wrap gap-2 items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500">¿Asignar un consultor a esta área?</span>
                              <div className="flex gap-2 items-center">
                                <select
                                  value={selectedMemberForArea[area] || ''}
                                  onChange={(e) => setSelectedMemberForArea(prev => ({ ...prev, [area]: e.target.value }))}
                                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-[11px] text-slate-800 focus:outline-none focus:border-blue-500 font-semibold"
                                >
                                  <option value="">-- Seleccionar Persona --</option>
                                  {teamRoster
                                    .filter(member => !(peopleByArea[area] || []).includes(member))
                                    .map(member => (
                                      <option key={member} value={member}>{member}</option>
                                    ))
                                  }
                                </select>
                                <button
                                  type="button"
                                  onClick={() => handleAssignMemberToArea(area, selectedMemberForArea[area])}
                                  disabled={!selectedMemberForArea[area]}
                                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
                                >
                                  Asignar Staff
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right: add area & global work team roster (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
             {/* Box A: Add area */}
             <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
               <div className="pb-2 border-b border-slate-100">
                 <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Añadir Nueva Área</h3>
                 <p className="text-[10px] text-slate-400 mt-1">Nombre el nuevo departamento técnico consultor.</p>
               </div>
 
               <div className="space-y-4 text-xs">
                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Nombre de la Nueva Oficina *</label>
                   <input
                     type="text"
                     placeholder="Ej. Comercial y Mercadeo, etc."
                     value={newAreaName}
                     onChange={(e) => setNewAreaName(e.target.value)}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-855 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
                   />
                 </div>

                 <div>
                   <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Asignar Color Distinctivo *</label>
                   <div className="flex flex-wrap items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-250">
                     {Object.keys(AREA_COLOR_PRESETS).map((key) => {
                       const preset = AREA_COLOR_PRESETS[key];
                       const isSelected = selectedNewAreaColorKey === key;
                       return (
                         <button
                           key={key}
                           type="button"
                           onClick={() => setSelectedNewAreaColorKey(key)}
                           className={`w-4 h-4 rounded-full ${preset.circleBg} hover:scale-110 active:scale-95 transition-all cursor-pointer relative ${
                             isSelected ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : 'opacity-70 hover:opacity-100'
                           }`}
                           title={`Color ${key}`}
                         />
                       );
                     })}
                   </div>
                 </div>
 
                 <button
                   onClick={() => {
                     onAddArea(newAreaName, selectedNewAreaColorKey);
                     setNewAreaName('');
                   }}
                   className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-1.5 cursor-pointer"
                 >
                   <Plus className="w-3.5 h-3.5" />
                   Registrar Área
                 </button>
               </div>
             </div>

            {/* Box B: Master Work Team Roster */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="pb-2 border-b border-slate-100">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-750 uppercase tracking-wider flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-500" />
                    Equipo de Trabajo ({teamRoster.length})
                  </h3>
                  <span className="text-[9px] font-black bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase">Global</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Lista unificada de consultores registrables en hitos y áreas.</p>
              </div>

              {/* Add member form */}
              <form onSubmit={handleAddMemberToRoster} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre Completo del Personal *</label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Ej. Dr. Mario Moreno"
                      value={newMemberName}
                      onChange={(e) => setNewMemberName(e.target.value)}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-855 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-3 bg-slate-800 hover:bg-black text-white text-xs font-black rounded-xl transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              </form>

              {/* Scrollable list */}
              <div className="border border-slate-100 rounded-xl divide-y divide-slate-100 overflow-hidden">
                <div className="max-h-[260px] overflow-y-auto divide-y divide-slate-100">
                  {teamRoster.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-slate-400 italic">No hay miembros registrados en el equipo.</div>
                  ) : (
                    teamRoster.map((member) => (
                      <div key={member} className="px-3 py-2 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-2">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-750">{member}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteMemberFromRoster(member)}
                          className="p-1 text-slate-400 hover:text-red-650 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          title="Eliminar del Equipo"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SUBTAB: ETAPAS --- */}
      {activeSubTab === 'etapas' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Stage view (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-850 flex items-center gap-1.5 uppercase tracking-wide">
                <Layers className="w-4 h-4 text-purple-600 animate-pulse" />
                Etapas Contractuales del Flujo ({Object.keys(stageDetails).length})
              </h3>
              <button
                onClick={handleStartCreateStage}
                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-black rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                Crear Etapa
              </button>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {Object.keys(stageDetails).map((key) => {
                const s = stageDetails[key];
                const isActiveEditingThis = editingStageKey === key;
                return (
                  <div
                    key={key}
                    onClick={() => handleStartEditStage(key)}
                    className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all space-y-2 ${
                      isActiveEditingThis 
                        ? 'border-blue-500 bg-blue-50/20 scale-[1.01]' 
                        : 'border-slate-200 bg-slate-50/40 hover:bg-slate-50 hover:border-slate-350'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black font-mono text-slate-400 block tracking-widest leading-none">
                          {key}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold ${s.bg} ${s.text}`}>
                            {s.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditStage(key);
                          }}
                          className="p-1 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Está seguro que desea eliminar la etapa "${s.label}" (${key})? Los proyectos asociados se migrarán a otra etapa vigente.`)) {
                              onDeleteStage(key);
                              if (editingStageKey === key) setEditingStageKey(null);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-500 font-medium line-clamp-2 pr-4">{s.definition}</p>
                    
                    <div className="flex justify-between items-center text-[9px] font-semibold text-slate-400 border-t border-slate-100 pt-1.5 uppercase">
                      <span>Entregables: {s.keyDeliverables?.length || 0}</span>
                      <span>Duración: {s.typicalDuration}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right edit form (6 cols) */}
          <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
            {!isCreatingStage && !editingStageKey ? (
              <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-300 space-y-3">
                <HelpCircle className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">Seleccione una etapa para ver/editar</p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">O haga clic en el botón superior para crear una nueva etapa personalizada en el flujo de gestión.</p>
                <button
                  type="button"
                  onClick={handleStartCreateStage}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer transition-all text-xs"
                >
                  Registar Etapa Nueva del Negocio
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveStage} className="space-y-4 text-xs font-sans">
                <div className="pb-2 border-b border-slate-100 flex justify-between items-center bg-slate-50 -mx-6 -mt-6 p-6 rounded-t-2xl">
                  <div>
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest leading-none">
                      {isCreatingStage ? 'Crear Nueva Etapa Contractual' : `Modificar Etapa: ${editingStageKey}`}
                    </h3>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">Configure etiquetas, duraciones estimadas y los hitos estructurales</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setIsCreatingStage(false); setEditingStageKey(null); }}
                    className="p-1 hover:bg-slate-200 rounded-full"
                  >
                    <X className="w-4.5 h-4.5 text-slate-400 hover:text-slate-700" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">ID Único (Mayúsculas) *</label>
                    <input
                      type="text"
                      placeholder="Ej. CIERRE_FINANCIERO"
                      required
                      disabled={!isCreatingStage}
                      value={stageKey}
                      onChange={(e) => setStageKey(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      className="w-full bg-slate-100 disabled:opacity-60 border border-slate-200 rounded-xl px-3 py-2 font-mono text-slate-800 focus:outline-none placeholder-slate-400 font-black"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Nombre / Etiqueta *</label>
                    <input
                      type="text"
                      placeholder="Ej. Conciliación y Liquidación"
                      required
                      value={stageForm.label}
                      onChange={(e) => setStageForm({ ...stageForm, label: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-850 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Preajuste de Color Visual</label>
                    <select
                      value={stageForm.colorPreset}
                      onChange={(e) => setStageForm({ ...stageForm, colorPreset: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold cursor-pointer"
                    >
                      {PRESET_COLORS.map(p => (
                        <option key={p.key} value={p.key}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Duración Típica o Frecuencia</label>
                    <input
                      type="text"
                      placeholder="Ej. 1 - 2 semanas"
                      required
                      value={stageForm.typicalDuration}
                      onChange={(e) => setStageForm({ ...stageForm, typicalDuration: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-semibold text-slate-850 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Definición o Propósito de la Etapa *</label>
                  <textarea
                    rows={2}
                    placeholder="Sintetice qué busca esta etapa respecto a los contratos de Consultorsalud..."
                    required
                    value={stageForm.definition}
                    onChange={(e) => setStageForm({ ...stageForm, definition: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none font-medium text-[11px]"
                  ></textarea>
                </div>

                {/* Array list deliverables */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-0.5">Definir Entregables e Hitos Core</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ej. Formular acta de liquidación jurídica"
                      value={stageForm.deliverableInput}
                      onChange={(e) => setStageForm({ ...stageForm, deliverableInput: e.target.value })}
                      onKeyDown={handleKeyPressAddDeliverable}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-850 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddDeliverable}
                      className="px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center cursor-pointer text-xs"
                    >
                      Agregar
                    </button>
                  </div>

                  {/* List items deliverables */}
                  <div className="max-h-24 overflow-y-auto space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    {stageDeliverables.length > 0 ? (
                      stageDeliverables.map((item) => (
                        <div key={item} className="flex justify-between items-center text-[10px] bg-white px-2 py-1 rounded border border-slate-200 shadow-3xs">
                          <span className="text-slate-700 font-medium truncate max-w-[200px]">{item}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(item)}
                            className="text-slate-450 hover:text-red-650"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-slate-400 italic text-center py-1">Sin entregables registrados para la etapa todavía.</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => { setIsCreatingStage(false); setEditingStageKey(null); }}
                    className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold transition-all text-[11px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black transition-all shadow-md shadow-blue-100 text-[11px]"
                  >
                    Guardar Configuración de Etapa
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'conexion' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="text-sm font-black text-slate-850 flex items-center gap-1.5 uppercase tracking-wide">
              <Database className="w-4 h-4 text-blue-600" />
              Configuración de Conexión de Base de Datos
            </h3>
            <span className="text-[10px] text-slate-400 font-bold">Neon PostgreSQL</span>
          </div>

          {/* Current Mode Banner */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
            isLocalMode 
              ? 'bg-amber-50/50 border-amber-150 text-amber-800' 
              : 'bg-emerald-50/50 border-emerald-150 text-emerald-800'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isLocalMode ? (
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-700">
                    <WifiOff className="w-4 h-4" />
                    Modo Local Offline (Base de datos desactivada)
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-700">
                    <Wifi className="w-4 h-4 animate-pulse" />
                    Modo Sincronizado Cloud (Base de datos activa)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isLocalMode 
                  ? 'La aplicación se ejecuta de manera local de forma predeterminada. Los proyectos y seguimientos se guardan de forma instantánea y segura únicamente en la memoria de este navegador web.'
                  : 'Los datos de la aplicación se leen y escriben en tiempo real de forma segura en tu base de datos de Neon Cloud.'
                }
              </p>
            </div>
            
            <div>
              {isLocalMode ? (
                <button
                  type="button"
                  onClick={onSwitchToDbMode}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm shadow-emerald-100 shrink-0"
                >
                  Activar Sincronización DB
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onBypassDb}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-black uppercase tracking-wider transition-all shadow-sm shadow-amber-100 shrink-0"
                >
                  Desactivar y Usar Modo Local
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-5">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Enlace de Conexión Personalizado</h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  ¿Quieres conectar la aplicación con otra base de datos de Neon o Vercel? 
                  Pega tu enlace de conexión. Se guardará localmente en tu navegador y se utilizará para comunicarse con la base de datos de Neon.
                </p>
              </div>

              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newUrl = formData.get('dbUrl') as string;
                onUpdateCustomDbUrl(newUrl);
                // Automatically run test on save
                handleTestConnection(newUrl);
              }} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-600 uppercase">DATABASE_URL (Connection String)</label>
                  <input
                    type="text"
                    name="dbUrl"
                    defaultValue={customDbUrl}
                    placeholder="postgresql://neondb_owner:password@ep-host..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-850 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    Guardar y Probar Conexión
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementsByName('dbUrl')[0] as HTMLInputElement;
                      handleTestConnection(input?.value || customDbUrl);
                    }}
                    disabled={testStatus === 'testing'}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                  >
                    Solo Probar
                  </button>
                  {customDbUrl && (
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateCustomDbUrl('');
                        const input = document.getElementsByName('dbUrl')[0] as HTMLInputElement;
                        if (input) input.value = '';
                        setTestStatus('idle');
                        setTestError(null);
                        setTestDetails(null);
                      }}
                      className="px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg text-xs font-bold transition-all"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </form>

              {/* Dynamic Connection Diagnostics Result Panel */}
              {testStatus !== 'idle' && (
                <div className="p-4 rounded-xl border bg-slate-50 border-slate-200 space-y-3 transition-all animate-fadeIn">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-150">
                    <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      Diagnóstico de Conexión
                    </span>
                    {testStatus === 'testing' && (
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold animate-pulse">
                        Verificando...
                      </span>
                    )}
                    {testStatus === 'success' && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check className="w-3 h-3" /> Conectado
                      </span>
                    )}
                    {testStatus === 'failed' && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <X className="w-3 h-3" /> Error de Conexión
                      </span>
                    )}
                  </div>

                  {testStatus === 'testing' && (
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Intentando establecer una conexión de socket TCP/IP con el servidor de Neon PostgreSQL, enviando credenciales de autenticación y solicitando versión de software...
                    </p>
                  )}

                  {testStatus === 'success' && (
                    <div className="space-y-2">
                      <p className="text-xs text-emerald-800 font-medium">
                        ¡Enlace verificado con éxito! La aplicación puede conectarse a tu base de datos de Neon.
                      </p>
                      {testDetails?.db_version && (
                        <div className="bg-slate-900 text-slate-300 p-2.5 rounded-lg text-[10px] font-mono leading-relaxed flex items-start gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{testDetails.db_version}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {testStatus === 'failed' && (
                    <div className="space-y-3">
                      <div className="bg-rose-50/50 border border-rose-100 rounded-lg p-3 text-xs text-rose-900 space-y-1">
                        <div className="font-bold flex items-center gap-1 text-rose-800">
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          Detalles del Error Capturado:
                        </div>
                        <p className="font-mono text-[11px] bg-white border border-rose-150 p-2 rounded text-rose-700 break-all select-all select-text font-medium leading-normal max-h-48 overflow-y-auto">
                          {testError}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(testError || '');
                            alert('Detalles del error copiados al portapapeles.');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-250 rounded text-[10px] font-bold text-slate-600 transition-all"
                        >
                          Copiar Error para Soporte
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementsByName('dbUrl')[0] as HTMLInputElement;
                            handleTestConnection(input?.value || customDbUrl);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[10px] font-bold text-blue-700 transition-all rounded"
                        >
                          Reintentar Diagnóstico
                        </button>
                      </div>

                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        💡 <strong>Consejo:</strong> Si obtienes un error como <i>"password authentication failed"</i> o <i>"ETIMEDOUT"</i>, verifica cuidadosamente que la contraseña o el host en el enlace DATABASE_URL sean válidos y no contengan comillas ni espacios innecesarios.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>


            <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs">
              <h4 className="font-black text-slate-800 uppercase tracking-wide text-[10px] flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-amber-500" />
                ¿Cómo solucionar la conexión en Vercel permanentemente?
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Si deseas que la conexión funcione automáticamente en Vercel sin tener que pegar la URL en esta página cada vez, sigue estos sencillos pasos:
              </p>
              <ol className="list-decimal list-inside space-y-2 text-slate-600 font-medium">
                <li>
                  Inicia sesión en tu cuenta de <strong className="text-slate-800">Vercel</strong> y ve al Dashboard de tu proyecto.
                </li>
                <li>
                  Navega a la pestaña de <strong className="text-slate-800">Settings</strong> (Configuración) y selecciona <strong className="text-slate-800">Environment Variables</strong> (Variables de Entorno).
                </li>
                <li>
                  Agrega una nueva variable con el nombre:
                  <div className="my-1 font-mono bg-slate-200 text-slate-800 px-2 py-1 rounded inline-block select-all font-bold">DATABASE_URL</div>
                </li>
                <li>
                  Pega el enlace de conexión de tu base de datos de Neon en el campo de valor.
                  <span className="block text-[10px] text-amber-600 mt-1 font-semibold">⚠️ Asegúrate de incluir el usuario, contraseña, servidor y el nombre de la base de datos correctamente.</span>
                </li>
                <li>
                  Presiona el botón <strong className="text-slate-800">Save</strong> (Guardar).
                </li>
                <li>
                  Finalmente, ve a la pestaña de <strong className="text-slate-800">Deployments</strong>, selecciona tu despliegue más reciente y haz clic en <strong className="text-slate-800">Redeploy</strong> (Redesplegar) para que los cambios surtan efecto.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
