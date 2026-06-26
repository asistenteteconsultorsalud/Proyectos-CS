import React, { useState } from 'react';
import { Project, ProjectFollowUp, ProjectStage, STAGE_DETAILS } from '../types';
import { 
  ClipboardList, 
  PlusCircle, 
  Calendar, 
  FileCheck2, 
  Briefcase, 
  User, 
  Compass, 
  FileCode2, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Building,
  HelpCircle,
  FolderSync,
  Tag
} from 'lucide-react';

interface TrackingPanelProps {
  projects: Project[];
  followUps: ProjectFollowUp[];
  onAddFollowUp: (newFollowUp: ProjectFollowUp) => void;
  onToggleFollowUpStatus: (id: string) => void;
  onSelectProject: (projectId: string) => void;
  stageDetails?: Record<string, { label: string; color: string; bg: string; border: string; text: string }>;
}

export default function TrackingPanel({
  projects,
  followUps,
  onAddFollowUp,
  onToggleFollowUpStatus,
  onSelectProject,
  stageDetails = STAGE_DETAILS as any
}: TrackingPanelProps) {
  
  const [activeTab, setActiveTab] = useState<'comites' | 'semaforo'>('comites');
  
  // New Follow-up Form state
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '',
    date: '2026-06-19',
    type: 'COMITE_SEMANAL' as ProjectFollowUp['type'],
    topics: '',
    agreements: '',
    nextCheckDate: '2026-06-26',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const today = new Date('2026-06-19');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.projectId) {
      setErrorMsg('Debe seleccionar un proyecto para vincular el comité de seguimiento.');
      return;
    }
    if (!formData.topics.trim()) {
      setErrorMsg('Por favor ingrese los temas tratados.');
      return;
    }
    if (!formData.agreements.trim()) {
      setErrorMsg('Por favor ingrese los compromisos acordados.');
      return;
    }

    setErrorMsg('');
    const targetProject = projects.find(p => p.id === formData.projectId);
    
    const newFollowUp: ProjectFollowUp = {
      id: `f-custom-${Date.now()}`,
      projectId: formData.projectId,
      projectName: targetProject ? targetProject.name : 'Proyecto Desconocido',
      date: formData.date,
      type: formData.type,
      topics: formData.topics.trim(),
      agreements: formData.agreements.trim(),
      nextCheckDate: formData.nextCheckDate,
      status: 'PENDIENTE'
    };

    onAddFollowUp(newFollowUp);
    
    setSuccessMsg('✓ Comité de seguimiento registrado con éxito.');
    setFormData(prev => ({
      ...prev,
      topics: '',
      agreements: '',
    }));

    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  // Status mapping
  const FOLLOWUP_TYPES = {
    COMITE_SEMANAL: { label: 'Comité Semanal', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
    REUNION_CLIENTE: { label: 'Reunión con Cliente', bg: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    CONTROL_PRESUPUESTO: { label: 'Auditoría Presupuestal', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
    AUDITORIA_INTERNA: { label: 'Validación Técnica Interna', bg: 'bg-purple-50 text-purple-700 border-purple-200' },
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      
      {/* Module Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-850 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" />
            Módulo de Seguimiento y Comités de Control
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Supervise la salud de los contratos de salud, registre actas de comités de seguimiento y realice auditorías de compromisos y alertas.
          </p>
        </div>
      </div>

      {/* Sub tabs Navigation */}
      <div className="flex border-b border-slate-200 gap-1 bg-white p-1 rounded-xl border max-w-md">
        <button
          onClick={() => setActiveTab('comites')}
          className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all ${
            activeTab === 'comites'
              ? 'bg-[#730000] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
          }`}
        >
          📝 Comités de Seguimiento ({followUps.length})
        </button>
        <button
          onClick={() => setActiveTab('semaforo')}
          className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all ${
            activeTab === 'semaforo'
              ? 'bg-[#730000] text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 font-semibold'
          }`}
        >
          🚥 Semáforo de Desviación Sólida
        </button>
      </div>

      {activeTab === 'comites' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Registered minutes (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <FileCheck2 className="w-5 h-5 text-emerald-600" />
                  Actas e Historial de Compromisos
                </h3>
                <p className="text-xs text-slate-500 font-medium">Reuniones técnicas periódicas y acuerdos radicados localmente</p>
              </div>

              {followUps.length > 0 ? (
                <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                  {followUps.map(f => {
                    const isCompleted = f.status === 'COMPLETADO';
                    const matchedProj = projects.find(p => p.id === f.projectId);
                    const typeInfo = FOLLOWUP_TYPES[f.type] || { label: f.type, bg: 'bg-slate-50 text-slate-700' };

                    return (
                      <div 
                        key={f.id}
                        className={`p-5 rounded-2xl border transition-all text-xs space-y-3.5 relative ${
                          isCompleted
                            ? 'bg-slate-50/50 border-slate-200 text-slate-500' 
                            : 'bg-white border-slate-250 hover:border-blue-300 shadow-sm'
                        }`}
                      >
                        {/* Row 1: Header */}
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold border ${typeInfo.bg}`}>
                              {typeInfo.label}
                            </span>
                            <span className="text-slate-400 font-mono text-[10px] font-semibold flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {f.date}
                            </span>
                          </div>

                          <button
                            onClick={() => onToggleFollowUpStatus(f.id)}
                            className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                            }`}
                          >
                            {isCompleted ? '✓ Completado' : '⏳ Marcar Completado'}
                          </button>
                        </div>

                        {/* Row 2: Title and navigation */}
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Proyecto de Consultoría</span>
                          <span 
                            onClick={() => onSelectProject(f.projectId)}
                            className="font-black text-slate-850 hover:text-blue-600 hover:underline cursor-pointer text-sm leading-snug line-clamp-1"
                          >
                            {f.projectName}
                          </span>
                          {matchedProj && (
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 italic">
                              <Building className="w-3.5 h-3.5 text-slate-350" />
                              Entidad: {matchedProj.entity} • Líder: {matchedProj.leader}
                            </span>
                          )}
                        </div>

                        {/* Row 3: Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px] leading-relaxed">
                          <div className="p-3 bg-slate-50/50 rounded-xl space-y-1">
                            <span className="font-extrabold text-[#730000] uppercase text-[9px] tracking-wider block">Temas Tratados</span>
                            <p className={isCompleted ? 'text-slate-500 line-through' : 'text-slate-700 font-medium'}>
                              {f.topics}
                            </p>
                          </div>

                          <div className="p-3 bg-emerald-50/10 rounded-xl space-y-1 border border-emerald-100/30">
                            <span className="font-extrabold text-emerald-800 uppercase text-[9px] tracking-wider block">Compromisos Acordados</span>
                            <p className={isCompleted ? 'text-slate-400 line-through' : 'text-emerald-950 font-bold'}>
                              {f.agreements}
                            </p>
                          </div>
                        </div>

                        {/* Row 4: Next checking date */}
                        <div className="pt-2 text-[10px] font-bold text-slate-400 border-t border-slate-50 flex justify-between items-center">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Próxima Revisión de Hitos: {f.nextCheckDate}
                          </span>
                          {!isCompleted && new Date(f.nextCheckDate) < today && (
                            <span className="text-red-650 bg-red-50 px-2 py-0.5 rounded animate-pulse uppercase tracking-wider text-[8px] font-black">
                              ⚠ Compromiso Vencido
                            </span>
                          )}
                        </div>

                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed border-slate-300 rounded-2xl bg-slate-50/50 space-y-3">
                  <ClipboardList className="w-12 h-12 text-slate-350 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">Sin comités registrados</p>
                  <p className="text-xs text-slate-450 max-w-sm mx-auto">Use el formulario a la derecha para archivar las actas de comités de seguimiento técnico del día.</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Register Follow-up (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <PlusCircle className="w-5 h-5 text-blue-600" />
                  Archivar Acta de Comité
                </h3>
                <p className="text-xs text-slate-500 font-medium">Registrar alineaciones técnicas, tareas de consultores y fechas límite</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Proyecto Asociado *</label>
                  <select
                    value={formData.projectId}
                    onChange={e => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold transition-all cursor-pointer"
                  >
                    <option value="" disabled>Seleccione un proyecto...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.entity})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha de Comité *</label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-semibold transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Categoría *</label>
                    <select
                      value={formData.type}
                      onChange={e => setFormData(prev => ({ ...prev, type: e.target.value as ProjectFollowUp['type'] }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold transition-all cursor-pointer"
                    >
                      {Object.keys(FOLLOWUP_TYPES).map(tk => (
                        <option key={tk} value={tk}>
                          {FOLLOWUP_TYPES[tk as ProjectFollowUp['type']].label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Detalle de Temas Tratados *</label>
                  <textarea
                    required
                    value={formData.topics}
                    onChange={e => setFormData(prev => ({ ...prev, topics: e.target.value }))}
                    placeholder="Escriba los puntos clave discutidos, retrasos explicados por el cliente o novedades normativas sanitarias discutidas en el comité..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder-slate-400 font-medium"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Compromisos / Plan de Trabajo Definido *</label>
                  <textarea
                    required
                    value={formData.agreements}
                    onChange={e => setFormData(prev => ({ ...prev, agreements: e.target.value }))}
                    placeholder="Escriba las tareas explícitas (e.g., 'Liliana radica informes de glosas', 'Alejandro pide token FHIR al proveedor alemán')..."
                    rows={3}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder-slate-400 font-bold text-slate-850"
                  ></textarea>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha Límite para estos Compromisos *</label>
                  <input
                    type="date"
                    required
                    value={formData.nextCheckDate}
                    onChange={e => setFormData(prev => ({ ...prev, nextCheckDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold transition-all"
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-50 border border-red-150 text-red-800 rounded-lg text-[11px] font-bold flex items-center gap-2 animate-fade-in">
                    <AlertTriangle className="w-4 h-4 text-red-650 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 bg-emerald-50 border border-emerald-150 text-emerald-800 rounded-lg text-[11px] font-bold animate-fade-in">
                    {successMsg}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black hover:shadow transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  Agregar Acta de Comité
                </button>

              </form>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'semaforo' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <FolderSync className="w-5 h-5 text-indigo-600 animate-spin-slow" />
                Semáforo Integrador de Desvío de Consultorías
              </h3>
              <p className="text-xs text-slate-500 font-medium">Estado de salud de cada contrato en base a bloqueos y vencimiento de cronogramas</p>
            </div>

            <div className="flex gap-4 text-xs font-bold leading-none">
              <span className="flex items-center gap-1.5 bg-red-50 text-red-700 border border-red-100 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                🔴 Crítico / Bloqueado
              </span>
              <span className="flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-100 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                🟡 Advertencia / Demorado
              </span>
              <span className="flex items-center gap-1.5 bg-green-50 text-green-700 border border-green-100 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase">
                🟢 Operación Sana
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {projects.map(proj => {
              const isCompleted = proj.stage === 'COMPLETADO' || proj.stage === 'CANCELADO';
              const isOverdue = !isCompleted && new Date(proj.dueDate) < today;
              const isBlocked = proj.hasBlocker;

              let health: 'CRITICO' | 'ADVERTENCIA' | 'SANO' = 'SANO';
              if (isBlocked) {
                health = 'CRITICO';
              } else if (isOverdue) {
                health = 'ADVERTENCIA';
              }

              const stageInfo = stageDetails[proj.stage] || { label: proj.stage, bg: 'bg-slate-50', text: 'text-slate-700' };

              return (
                <div 
                  key={proj.id}
                  className={`p-5 rounded-2xl border transition-all text-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    health === 'CRITICO'
                      ? 'bg-red-50/20 border-red-150 border-l-4 border-l-red-500'
                      : health === 'ADVERTENCIA'
                        ? 'bg-amber-50/20 border-amber-200 border-l-4 border-l-amber-500'
                        : 'bg-white border-slate-200 border-l-4 border-l-emerald-500 hover:border-slate-300 shadow-xs'
                  }`}
                >
                  {/* Left block info */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`w-3 h-3 rounded-full shrink-0 ${
                        health === 'CRITICO' ? 'bg-red-500 animate-pulse' : health === 'ADVERTENCIA' ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}></span>
                      
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        {proj.entity}
                      </span>
                      
                      <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-extrabold ${stageInfo.bg} ${stageInfo.text}`}>
                        {stageInfo.label}
                      </span>
                    </div>

                    <h4 className="text-sm font-black text-slate-850 leading-tight">
                      {proj.name}
                    </h4>

                    <div className="flex flex-wrap gap-4 text-[10px] text-slate-400 font-bold uppercase">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-650">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Líder: {proj.leader}
                      </span>
                      <span className="font-mono">
                        Limite Etapa: {proj.dueDate}
                      </span>
                    </div>
                  </div>

                  {/* Milestones count column */}
                  <div className="md:w-44 space-y-2 shrink-0">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      <span>Avance general</span>
                      <span>{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          health === 'CRITICO' ? 'bg-red-500' : health === 'ADVERTENCIA' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-semibold block">
                      {proj.milestones.filter(m => m.completed).length} de {proj.milestones.length} hitos completados
                    </span>
                  </div>

                  {/* Actions column */}
                  <div className="shrink-0 flex items-center gap-2">
                    {health === 'CRITICO' && (
                      <span className="px-2.5 py-1 bg-red-100/50 text-red-700 rounded-md font-bold text-[10px] leading-none uppercase">
                        Bloqueado
                      </span>
                    )}
                    {health === 'ADVERTENCIA' && (
                      <span className="px-2.5 py-1 bg-amber-100/50 text-amber-800 rounded-md font-bold text-[10px] leading-none uppercase">
                        Vencido
                      </span>
                    )}
                    <button
                      onClick={() => onSelectProject(proj.id)}
                      className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-850 font-black px-4 py-2 rounded-xl transition-all border border-slate-250 cursor-pointer active:scale-95"
                    >
                      Auditar &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
