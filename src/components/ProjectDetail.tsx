import React, { useState } from 'react';
import { Project, ProjectStage, STAGE_DETAILS, INVOLVED_AREAS, Milestone, getAreaStyle, PREDEFINED_PEOPLE_BY_AREA } from '../types';
import { generateProjectPDF } from '../utils/pdfGenerator';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  Undo2, 
  Plus, 
  Trash2, 
  AlertTriangle,
  FolderLock,
  PlusCircle,
  FilePlus2,
  Building,
  CheckCircle2,
  Tag,
  X,
  Download
} from 'lucide-react';

interface ProjectDetailProps {
  project: Project;
  onBackClick: () => void;
  onUpdateProject: (updatedProj: Project) => void;
  involvedAreas?: string[];
  stageDetails?: Record<string, { label: string; color: string; bg: string; border: string; text: string }>;
  onSelectArea?: (area: string) => void;
  peopleByArea?: Record<string, string[]>;
}

export default function ProjectDetail({ 
  project, 
  onBackClick, 
  onUpdateProject,
  involvedAreas = INVOLVED_AREAS,
  stageDetails = STAGE_DETAILS as any,
  onSelectArea,
  peopleByArea = PREDEFINED_PEOPLE_BY_AREA
}: ProjectDetailProps) {
  // Local sub-states for adding milestones / issues / notes
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDueDate, setNewMilestoneDueDate] = useState('');
  const [newMilestoneArea, setNewMilestoneArea] = useState('');
  const [newMilestonePerson, setNewMilestonePerson] = useState('');
  const [issueDescription, setIssueDescription] = useState('');
  const [showSavedAlert, setShowSavedAlert] = useState(false);
  const [detailPersonInputs, setDetailPersonInputs] = useState<Record<string, string>>({});
  const [showEmbeddedReport, setShowEmbeddedReport] = useState(false);

  const handleDetailAddPerson = (area: string) => {
    const name = (detailPersonInputs[area] || '').trim();
    if (!name) return;

    const currentAssignments = project.areaAssignments || {};
    const currentPersons = currentAssignments[area] || [];

    if (currentPersons.includes(name)) return;

    const updatedAssignments = {
      ...currentAssignments,
      [area]: [...currentPersons, name]
    };

    onUpdateProject({
      ...project,
      areaAssignments: updatedAssignments
    });

    setDetailPersonInputs(prev => ({
      ...prev,
      [area]: ''
    }));
  };

  const handleDetailRemovePerson = (area: string, personToRemove: string) => {
    const currentAssignments = project.areaAssignments || {};
    const currentPersons = currentAssignments[area] || [];

    const updatedAssignments = {
      ...currentAssignments,
      [area]: currentPersons.filter(p => p !== personToRemove)
    };

    onUpdateProject({
      ...project,
      areaAssignments: updatedAssignments
    });
  };

  // Editing direct Notes state
  const [notesText, setNotesText] = useState(project.notes || '');

  const today = new Date('2026-06-19'); // Today reference
  const isCompleted = project.stage === 'COMPLETADO' || project.stage === 'CANCELADO';
  const isOverdue = !isCompleted && new Date(project.dueDate) < today;

  const formatCOP = (val: number) => {
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  // 1. Toggle completion of milestones
  const handleToggleMilestone = (milestoneId: string) => {
    const updatedMilestones = project.milestones.map(m => {
      if (m.id === milestoneId) {
        return { ...m, completed: !m.completed };
      }
      return m;
    });

    // Recalculate average progress based on completed milestones
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const computedProgress = updatedMilestones.length > 0
      ? Math.round((completedCount / updatedMilestones.length) * 100)
      : project.progress;

    onUpdateProject({
      ...project,
      milestones: updatedMilestones,
      progress: computedProgress
    });
  };

  // 2. Add structural milestone
  const handleAddMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim()) return;

    const newM: Milestone = {
      id: `m-custom-${Date.now()}`,
      title: newMilestoneTitle,
      dueDate: newMilestoneDueDate || '2026-07-01',
      completed: false,
      area: newMilestoneArea || undefined,
      assignedPerson: newMilestonePerson || undefined
    };

    const updatedMilestones = [...project.milestones, newM];
    
    // Recalculate progress with the new denominator
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const finalProg = Math.min(100, Math.round((completedCount / updatedMilestones.length) * 100));

    onUpdateProject({
      ...project,
      milestones: updatedMilestones,
      progress: finalProg
    });

    setNewMilestoneTitle('');
    setNewMilestoneDueDate('');
    setNewMilestoneArea('');
    setNewMilestonePerson('');
  };

  // 3. Delete milestone
  const handleDeleteMilestone = (milestoneId: string) => {
    const updatedMilestones = project.milestones.filter(m => m.id !== milestoneId);
    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const finalProg = updatedMilestones.length > 0 
      ? Math.min(100, Math.round((completedCount / updatedMilestones.length) * 100))
      : 0;

    onUpdateProject({
      ...project,
      milestones: updatedMilestones,
      progress: finalProg
    });
  };

  // 4. Update Project Stage
  const handleStageChange = (newStage: string) => {
    onUpdateProject({
      ...project,
      stage: newStage as any,
      // If completed, set progress to 100
      progress: newStage === 'COMPLETADO' ? 100 : project.progress
    });
  };

  // 5. Blocker Toggle / Issue Logging
  const handleToggleBlocker = (blockFlag: boolean, blockDesc?: string) => {
    onUpdateProject({
      ...project,
      hasBlocker: blockFlag,
      blockerDescription: blockFlag ? (blockDesc || 'Problema técnico-operacional sin especificar') : undefined,
      stage: blockFlag ? 'PAUSA' as any : project.stage
    });
  };

  // 6. Add Custom Recorded Issue
  const handleAddIssue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;

    const newIssue = {
      id: `iss-${Date.now()}`,
      date: '2026-06-19',
      description: issueDescription,
      resolved: false
    };

    onUpdateProject({
      ...project,
      issues: [...project.issues, newIssue],
      hasBlocker: true,
      blockerDescription: issueDescription,
      stage: ProjectStage.PAUSA
    });

    setIssueDescription('');
  };

  // 7. Toggle Issue Resolution
  const handleToggleIssueResolve = (issueId: string) => {
    const updatedIssues = project.issues.map(iss => {
      if (iss.id === issueId) {
        return { ...iss, resolved: !iss.resolved };
      }
      return iss;
    });

    const activeIssuesLeft = updatedIssues.some(iss => !iss.resolved);

    onUpdateProject({
      ...project,
      issues: updatedIssues,
      hasBlocker: activeIssuesLeft,
      blockerDescription: activeIssuesLeft ? updatedIssues.find(iss => !iss.resolved)?.description : undefined,
    });
  };

  // Save general Notes
  const handleSaveNotes = () => {
    onUpdateProject({
      ...project,
      notes: notesText
    });
    setShowSavedAlert(true);
    setTimeout(() => {
      setShowSavedAlert(false);
    }, 3000);
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {/* Return Navigation and Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-250">
        <button
          onClick={onBackClick}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors py-2 px-4 rounded-xl hover:bg-slate-100 border border-slate-200 self-start cursor-pointer bg-white shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a la cartera
        </button>

        <div className="flex gap-2 flex-wrap sm:justify-end items-center">
          <button
            type="button"
            onClick={() => {
              try {
                generateProjectPDF(project);
              } catch (e) {
                console.error("Error generating single project PDF", e);
              }
            }}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Descargar PDF</span>
          </button>

          <span className="text-xs font-black text-slate-400 self-center uppercase mr-1 hidden md:inline tracking-wider">Transicionar etapa:</span>
          <select
            value={project.stage}
            onChange={(e) => handleStageChange(e.target.value)}
            className="bg-white border border-slate-205 hover:border-slate-350 text-xs text-slate-800 font-bold px-3 py-2.5 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all cursor-pointer shadow-xs"
          >
            {Object.keys(stageDetails).map(stKey => (
              <option key={stKey} value={stKey}>
                Cambiar a: {stageDetails[stKey].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Grid: Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left column: detailed Project Data (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm relative overflow-hidden">
            
            {/* Urgency indicators on top cards */}
            {project.stage === 'COMPLETADO' || project.progress === 100 ? (
              <div className="px-5 py-3 bg-emerald-500/10 border-b border-emerald-200 text-emerald-800 text-xs font-semibold rounded-t-2xl -mx-6 -mt-6 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-650 shrink-0" />
                  <span>Este proyecto de consultoría se encuentra <b>completamente finalizado y liquidado</b>.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmbeddedReport(!showEmbeddedReport)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1 rounded-xl transition-all text-[10px] shrink-0 active:scale-95 cursor-pointer"
                >
                  {showEmbeddedReport ? "Ocultar Informe de Cierre" : "📋 Ver Acta de Liquidación Contractual"}
                </button>
              </div>
            ) : project.hasBlocker ? (
              <div className="px-5 py-3 bg-red-500/10 border-b border-red-200 text-red-700 text-xs font-semibold rounded-t-2xl -mx-6 -mt-6 mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-650 animate-bounce shrink-0" />
                <span>Este proyecto tiene un <b>bloqueo activo</b>. Las operaciones de la consultoría están suspendidas temporalmente.</span>
              </div>
            ) : isOverdue ? (
              <div className="px-5 py-3 bg-amber-400/10 border-b border-amber-200 text-amber-800 text-xs font-semibold rounded-t-2xl -mx-6 -mt-6 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Alerta: La <b>fecha límite programada ({project.dueDate})</b> ya expiró sin cerrar la etapa actual.</span>
              </div>
            ) : null}

            {showEmbeddedReport && (() => {
              const start = new Date(project.startDate);
              const end = new Date(project.dueDate);
              const elapsedSime = Math.abs(end.getTime() - start.getTime());
              const totalDurationDays = Math.ceil(elapsedSime / (1000 * 60 * 60 * 24)) || 120;
              const totalMilestones = project.milestones.length;
              const compMilestones = project.milestones.filter(m => m.completed).length;
              const totalIssues = project.issues.length;
              const resolvedIssues = project.issues.filter(i => i.resolved).length;

              return (
                <div className="bg-slate-50 border border-emerald-500/25 p-5 rounded-2xl space-y-4 text-xs animate-fade-in mb-4">
                  <div className="pb-3 border-b border-slate-200">
                    <span className="text-[9px] uppercase font-black text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full inline-block tracking-wider mb-1">
                      Acta e Informe Ejecutivo de Liquidación y Entrega
                    </span>
                    <h4 className="text-sm font-black text-slate-800">
                      DIAGNÓSTICO FINAL DE GESTIÓN Y TIEMPOS DE PROCESO
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl space-y-1">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Duración Contractual Estipulada</span>
                      <span className="text-xl font-bold text-slate-800 font-mono">{totalDurationDays} Días</span>
                      <p className="text-[9px] text-slate-500 leading-normal">Lapso de tiempo registrado en cronograma base desde el {project.startDate} al {project.dueDate}.</p>
                    </div>

                    <div className="p-3 bg-white border border-slate-200/60 rounded-xl space-y-1">
                      <span className="text-[9px] font-black text-slate-400 block uppercase">Frecuencia Media de Entregas</span>
                      <span className="text-xl font-bold text-slate-800 font-mono">
                        {totalMilestones > 0 ? (totalDurationDays / totalMilestones).toFixed(1) : '0'} Días / Hito
                      </span>
                      <p className="text-[9px] text-slate-500 leading-normal">Frecuencia de consolidación y aprobación de hitos técnicos ante comités.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-white border border-slate-200/60 rounded-xl space-y-1.5">
                    <span className="text-[9px] font-black text-slate-400 block uppercase font-sans">Desempeño Operativo</span>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-500">Hitos Consolidados:</span>
                      <span className="font-bold text-emerald-750">{compMilestones} de {totalMilestones} (100%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                      <span className="font-semibold text-slate-500">Incidentes Técnicos Solventados:</span>
                      <span className="font-semibold text-slate-700">{resolvedIssues} de {totalIssues} resueltos</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-100">
                      <span className="font-semibold text-slate-500">Desviación del Cronograma:</span>
                      <span className="font-semibold text-slate-800 font-mono">0.0% (Terminado a tiempo)</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-slate-400 block uppercase inline-block">¿Qué pasó con este Proyecto? (Resumen Técnico)</span>
                    <p className="bg-white/80 p-3 rounded-xl border border-slate-200/40 text-slate-700 leading-relaxed font-semibold">
                      El proyecto culminó formalmente de manera satisfactoria. La mesa técnica interviniente (coordinada por <b className="text-slate-900">{project.leader}</b>) logró solventar con éxito los requerimientos exigidos por la entidad <b className="text-slate-900">{project.entity}</b>. Se consolidaron el 100% de los entregables y comités previstos, certificando el cumplimiento operacional y financiero contractual.
                    </p>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-1.5 px-4 rounded-xl transition-all text-[11px] cursor-pointer shadow-xs active:scale-95"
                    >
                      🖨️ Descargar/Imprimir Acta PDF
                    </button>
                  </div>
                </div>
              );
            })()}

            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-blue-600 text-xs font-black uppercase tracking-wider">
                <Building className="w-4 h-4 text-blue-500" />
                <span>{project.entity}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-snug">
                {project.name}
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed font-medium">
                {project.description}
              </p>
            </div>

            {/* Involving Areas Pills */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Áreas Organizacionales Intervinientes (haga clic para filtrar proyectos en esta área)</span>
              <div className="flex flex-wrap gap-1.5">
                {project.areas.map(area => {
                  const style = getAreaStyle(area);
                  return (
                    <button 
                      key={area}
                      onClick={() => onSelectArea?.(area)}
                      title={`Filtrar proyectos en el área: ${area}`}
                      className={`${style.bg} ${style.text} ${style.border} border rounded-lg px-3 py-1.5 text-xs font-extrabold shadow-sm active:scale-95 transition-all cursor-pointer flex items-center gap-2`}
                    >
                      <span className={`w-2 h-2 rounded-full ${style.circleBg} animate-pulse`} />
                      {area}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct metadata row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 text-xs pt-4 mt-6 rounded-2xl">
              <div className="space-y-1">
                <span className="text-slate-400 font-black block uppercase text-[9px] tracking-wider">Líder Técnico</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  {project.leader}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-black block uppercase text-[9px] tracking-wider">Monto del Presupuesto</span>
                <span className="font-extrabold text-slate-900 font-mono text-xs">
                  {formatCOP(project.budget)}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-black block uppercase text-[9px] tracking-wider">Fecha Inicio</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-450" />
                  {project.startDate}
                </span>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 font-black block uppercase text-[9px] tracking-wider">Fecha Fin Etapa</span>
                <span className={`font-black flex items-center gap-1.5 ${isOverdue ? 'text-amber-700' : 'text-slate-850'}`}>
                  <Clock className="w-3.5 h-3.5" />
                  {project.dueDate}
                </span>
              </div>
            </div>

            {/* Project progress control bar */}
            <div className="space-y-3 pt-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-bold block uppercase tracking-wider text-[10px]">Porcentaje de Avance Físico</span>
                <span className="font-black text-slate-900 font-mono text-sm leading-none">{project.progress}%</span>
              </div>
              <div className="relative w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${project.hasBlocker ? 'bg-red-500' : 'bg-emerald-500'}`}
                  style={{ width: `${project.progress}%` }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={project.progress}
                onChange={(e) => {
                  onUpdateProject({
                    ...project,
                    progress: parseInt(e.target.value)
                  });
                }}
                className="w-full accent-blue-600 cursor-pointer h-1.5 bg-slate-100 rounded-lg mt-1"
                title="Ajustar progreso manualmente"
              />
              <span className="block text-[10px] text-slate-400 font-medium text-right">Desplazar la barra para corregir el progreso de forma manual</span>
            </div>
            
          </div>

          {/* Project Blockers Management (New Issue Log & Active Block togglers) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                  Gestión de Inconvenientes y Alertas
                </h3>
                <p className="text-xs text-slate-550 font-medium">Log de trabas operacionales que detienen la continuidad del proyecto</p>
              </div>

              {/* Status block button */}
              <button
                type="button"
                onClick={() => handleToggleBlocker(!project.hasBlocker, 'El proyecto presenta un inconveniente crítico que requiere atención.')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                  project.hasBlocker 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                    : 'bg-red-50 border border-red-200 text-red-700 hover:bg-red-100'
                }`}
              >
                {project.hasBlocker ? '🔓 Desbloquear Proyecto' : '🔒 Declarar Bloqueado'}
              </button>
            </div>

            {project.hasBlocker && (
              <div className="p-4 bg-red-50 border border-red-150 text-slate-700 rounded-xl space-y-1 text-xs">
                <span className="font-extrabold text-red-800 uppercase text-[9px] tracking-wider block">Descripción del Bloqueo Actual</span>
                <p className="font-bold">"{project.blockerDescription}"</p>
              </div>
            )}

            {/* List of custom reported issues */}
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Historial de Alertas Registradas</span>
              
              {project.issues && project.issues.length > 0 ? (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {project.issues.map(iss => (
                    <div 
                      key={iss.id}
                      className={`p-3.5 border rounded-xl text-xs flex items-start justify-between gap-4 transition-colors ${
                        iss.resolved 
                          ? 'bg-slate-50/50 border-slate-200' 
                          : 'bg-red-50/30 border-red-150'
                      }`}
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-extrabold ${iss.resolved ? 'bg-slate-200 text-slate-500' : 'bg-red-100 text-red-800'}`}>
                            {iss.resolved ? 'Resuelto' : 'Abierto'}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px] font-medium">{iss.date}</span>
                        </div>
                        <p className={`text-slate-700 ${iss.resolved ? 'line-through text-slate-400' : 'font-semibold'}`}>{iss.description}</p>
                      </div>

                      <button
                        onClick={() => handleToggleIssueResolve(iss.id)}
                        className={`text-xs font-bold py-1 px-3 rounded-lg transition-all bg-white border border-slate-200 hover:bg-slate-50 cursor-pointer ${
                          iss.resolved ? 'text-slate-500' : 'text-emerald-750 hover:text-emerald-800'
                        }`}
                      >
                        {iss.resolved ? 'Reabrir' : 'Marcar Resuelto'}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic font-medium">No hay alertas ni inconvenientes históricos reportados en esta consultoría.</p>
              )}
            </div>

              {/* Form to submit a new issue */}
              <form onSubmit={handleAddIssue} className="pt-2 space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Registrar Nueva Alerta / Impedimento</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={issueDescription}
                    onChange={e => setIssueDescription(e.target.value)}
                    placeholder="Detallar inconveniente tecnológico, normativo, de firmas..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500 focus:bg-white font-medium transition-all placeholder-slate-400"
                  />
                  <button
                    type="submit"
                    className="bg-red-650 hover:bg-red-700 text-white rounded-xl px-4 py-2 text-xs font-bold shrink-0 inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar Alerta
                  </button>
                </div>
              </form>
            </div>

            {/* Real-time Personnel/Team Member assignments card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
              <div className="pb-3 border-b border-slate-100">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <User className="w-5 h-5 text-blue-600 shrink-0" />
                  Asignación de Personal por Área
                </h3>
                <p className="text-xs text-slate-500 font-medium mt-1">Gestione en tiempo real los consultores y profesionales dedicados a cada una de las áreas operativas de esta consultoría.</p>
              </div>

              <div className="space-y-4">
                {project.areas.map(area => {
                  const currentAssignments = project.areaAssignments || {};
                  const list = currentAssignments[area] || [];

                  return (
                    <div key={area} className="p-4 border border-slate-200 rounded-xl bg-slate-50/50 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                        <span className="text-[10px] uppercase font-black text-blue-800 tracking-wider">
                          {area}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          {list.length} {list.length === 1 ? 'asignado' : 'asignados'}
                        </span>
                      </div>

                      {/* Persons pills display */}
                      <div className="flex flex-wrap gap-1.5 min-h-[28px] items-center">
                        {list.length === 0 ? (
                          <span className="text-[10px] text-slate-400 italic font-medium">Ningún consultor asignado</span>
                        ) : (
                          list.map(person => (
                            <span
                              key={person}
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-705 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs hover:border-red-350 transition-colors group cursor-pointer"
                              onClick={() => handleDetailRemovePerson(area, person)}
                              title="Remover asignación"
                            >
                              {person}
                              <X className="w-2.5 h-2.5 text-slate-400 group-hover:text-red-500 transition-colors" />
                            </span>
                          ))
                        )}
                      </div>

                      {/* Quick select dropdown within detail */}
                      <div className="flex gap-1.5 pt-2 border-t border-slate-200/50">
                        <select
                          value={detailPersonInputs[area] || ''}
                          onChange={e => setDetailPersonInputs(prev => ({ ...prev, [area]: e.target.value }))}
                          className="flex-1 bg-white border border-slate-250 rounded-lg px-2.5 py-1 text-[11px] text-slate-850 focus:outline-none focus:border-blue-500 font-bold transition-all"
                        >
                          <option value="">-- Seleccionar consultor --</option>
                          {(peopleByArea[area] || []).map(p => {
                            const isAssigned = list.includes(p);
                            return (
                              <option key={p} value={p} disabled={isAssigned}>
                                {p} {isAssigned ? '(Asignado)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleDetailAddPerson(area)}
                          className="px-3 py-1 bg-blue-650 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition shrink-0"
                        >
                          Asignar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right column: Interactive Milestones Checklist (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-5 shadow-sm">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                Hitos y Entregables de Etapa
              </h3>
              <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">Haz clic en los hilos para completar tareas; el progreso general se adaptará automáticamente.</p>
            </div>

            {/* Milestones list */}
            {project.milestones && project.milestones.length > 0 ? (
              <div className="space-y-2.5">
                {project.milestones.map((m, idx) => {
                  const mOverdue = !m.completed && new Date(m.dueDate) < today;

                  return (
                    <div 
                      key={m.id}
                      className={`p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 transition-all ${
                        m.completed 
                          ? 'bg-slate-50/50 border-slate-200 text-slate-400' 
                          : mOverdue
                            ? 'bg-red-50/40 border-red-200'
                            : 'bg-white border-slate-250/80 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2.5 flex-1 cursor-pointer" onClick={() => handleToggleMilestone(m.id)}>
                        <input
                          type="checkbox"
                          checked={m.completed}
                          onChange={() => {}} // Swallowed, parent onClick handles beautifully
                          className="mt-0.5 rounded accent-emerald-500 shrink-0 cursor-pointer"
                        />
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className={`font-bold text-slate-800 ${m.completed ? 'line-through text-slate-400 font-normal' : ''}`}>
                              {m.title}
                            </p>
                            {m.area && (() => {
                              const style = getAreaStyle(m.area);
                              const assignments = project.areaAssignments || {};
                              const people = assignments[m.area] || [];
                              const peopleStr = people.length > 0 ? ` [Responsables: ${people.join(', ')}]` : '';
                              return (
                                <span 
                                  title={`Área: ${m.area}${peopleStr}`}
                                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-[9px] font-extrabold uppercase tracking-wider ${style.bg} ${style.text} ${style.border}`}
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${style.circleBg}`} />
                                  {m.area}
                                  {people.length > 0 && (
                                    <span className="text-[8px] font-bold border-l border-current/30 pl-1.5 ml-1.5 text-slate-600">
                                      {people.join(', ')}
                                    </span>
                                  )}
                                </span>
                              );
                            })()}
                            {m.assignedPerson && (
                              <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wider">
                                <User className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                                {m.assignedPerson}
                              </span>
                            )}
                          </div>
                          <span className={`block font-mono text-[10px] uppercase font-bold ${mOverdue ? 'text-red-650' : 'text-slate-400'}`}>
                            Límite: {m.dueDate} {mOverdue && '(Vencido)'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMilestone(m.id);
                        }}
                        className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                        title="Eliminar este hito"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 border border-dashed border-slate-300 rounded-xl text-slate-400 text-xs font-semibold bg-slate-50/50">
                Usa el formulario inferior para agregar los entregables claves requeridos en el cronograma.
              </div>
            )}

            {/* Milestone insert form */}
            <form onSubmit={handleAddMilestone} className="pt-4 border-t border-slate-150 space-y-3.5 text-xs">
              <span className="font-extrabold text-slate-400 uppercase tracking-wider block text-[10px]">Añadir Entregable / Hito</span>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5">Nombre del Hito</label>
                  <input
                    type="text"
                    required
                    value={newMilestoneTitle}
                    onChange={e => setNewMilestoneTitle(e.target.value)}
                    placeholder="Ej. Radicar factura de cobro con soportes"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all placeholder-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5">Fecha de Vencimiento del Hito</label>
                  <input
                    type="date"
                    required
                    value={newMilestoneDueDate}
                    onChange={e => setNewMilestoneDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5">Área Organizacional Asignada</label>
                  <select
                    value={newMilestoneArea}
                    onChange={e => {
                      setNewMilestoneArea(e.target.value);
                      setNewMilestonePerson(''); // Reset assigned person when area changes
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
                  >
                    <option value="">-- Sin área específica / General --</option>
                    {project.areas.map(area => (
                      <option key={area} value={area}>
                        {area}
                      </option>
                    ))}
                  </select>
                </div>

                {newMilestoneArea && (
                  <div className="animate-fade-in">
                    <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5">Consultor Responsable ({newMilestoneArea})</label>
                    <select
                      value={newMilestonePerson}
                      onChange={e => setNewMilestonePerson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all font-bold"
                    >
                      <option value="">-- Sin consultor específico / General --</option>
                      {(peopleByArea[newMilestoneArea] || []).map(person => (
                        <option key={person} value={person}>
                          {person}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <PlusCircle className="w-4 h-4" />
                  Agregar Hito Operativo
                </button>
              </div>
            </form>
          </div>

          {/* Internal text notes block */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm text-xs">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                <Tag className="w-4.5 h-4.5 text-slate-600" />
                Notas Estructurales del Proyecto
              </h3>
              <p className="text-xs text-slate-450 font-medium">Alineaciones de comités, actas físicas, o advertencias confidenciales</p>
            </div>

            <textarea
              value={notesText}
              onChange={e => setNotesText(e.target.value)}
              placeholder="Registrar detalles de negociaciones especiales de copagos o tarifas..."
              rows={4}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all resize-none placeholder-slate-400"
            ></textarea>

            {showSavedAlert && (
              <div className="text-[11px] font-bold text-center text-emerald-700 bg-emerald-50 border border-emerald-150 py-2 rounded-lg animate-fade-in">
                ✓ Notas del proyecto guardadas exitosamente en local
              </div>
            )}

            <button
              type="button"
              onClick={handleSaveNotes}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-xl py-2.5 text-xs font-bold hover:shadow transition-all text-center cursor-pointer active:scale-95"
            >
              Guardar Notas del Proyecto
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
