import React, { useState } from 'react';
import { Project, ProjectStage, STAGE_DETAILS, INVOLVED_AREAS, PREDEFINED_PEOPLE_BY_AREA, getAreaStyle } from '../types';
import { generateAreaPDFReport, generateProjectPDF } from '../utils/pdfGenerator';
import { 
  TrendingUp, 
  Users, 
  Activity, 
  DollarSign, 
  AlertOctagon, 
  Clock, 
  CheckCircle2, 
  FolderGit2,
  Calendar,
  Layers,
  Sparkles,
  Download,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  ChevronRight,
  BookOpen,
  X,
  Plus
} from 'lucide-react';

const STAGE_EXTENDED_INFO: Record<
  ProjectStage,
  {
    definition: string;
    keyDeliverables: string[];
    typicalDuration: string;
  }
> = {
  [ProjectStage.POR_PRESENTAR]: {
    definition: 'Formulación técnica, estructuración de la propuesta comercial de consultoría y estructuración de tarifas iniciales.',
    keyDeliverables: [
      'Estudio previo y diagnóstico de necesidades del cliente',
      'Estructura de costos, honorarios y modelo preliminar',
      'Propuesta técnica y económica formalizada'
    ],
    typicalDuration: '1 - 2 semanas'
  },
  [ProjectStage.EVALUACION]: {
    definition: 'Evaluación de convenios por comités de contratación, ajuste de copagos, reglamentos de firmas y mesas de concertación.',
    keyDeliverables: [
      'Mesas de concertación técnica',
      'Estudio de viabilidad jurídica y regulatoria del sector salud',
      'Aprobación de la junta directiva o comités delegados'
    ],
    typicalDuration: '2 - 3 semanas'
  },
  [ProjectStage.POR_INICIAR]: {
    definition: 'Suscripción de actas de inicio, legalización de pólizas de cumplimiento, entrega de anticipos y asignación de cronograma.',
    keyDeliverables: [
      'Firma de contrato judicial o acta administrativa de inicio',
      'Suscripción de garantías o pólizas de cumplimiento',
      'Asignación formal de la terna de consultores expertos'
    ],
    typicalDuration: '1 semana'
  },
  [ProjectStage.EJECUCION]: {
    definition: 'Fase central operativa de auditoría estructural, desarrollo de software, capacitaciones presenciales y mesas operativas.',
    keyDeliverables: [
      'Auditorías técnico-médicas recurrentes',
      'Capacitaciones y talleres presenciales/virtuales con firmas de asistencia',
      'Soportes de facturación de hitos intermedios'
    ],
    typicalDuration: '1 - 6 meses'
  },
  [ProjectStage.PAUSA]: {
    definition: 'Flujo detenido temporalmente por inconvenientes críticos externos, demoras en comités administrativos del cliente, o suspensiones pactadas.',
    keyDeliverables: [
      'Acta de suspensión temporal con firmas justificantes',
      'Plan de mitigación o desbloqueo del obstáculo operacional',
      'Revisiones extraordinarias semanales'
    ],
    typicalDuration: 'Frecuencia variable'
  },
  [ProjectStage.COMPLETADO]: {
    definition: 'Cierre formal de consultoría. Radicación final de cuentas, transferencias de conocimiento y actas de liquidación.',
    keyDeliverables: [
      'Informe final ejecutivo encuadernado y digitalizado',
      'Acta de liquidación del contrato a mutuo acuerdo',
      'Encuesta de satisfacción de servicios del cliente'
    ],
    typicalDuration: 'Cierre inmediato'
  },
  [ProjectStage.CANCELADO]: {
    definition: 'Terminación anticipada del proyecto por decisión mutua, cambios normativos de sanidad, o insolvencia de la entidad contratista.',
    keyDeliverables: [
      'Acta de rescisión anticipada detallada',
      'Relación de pagos proporcionales consolidados hasta la fecha',
      'Devolución de bases de datos seguras bajo confidencialidad'
    ],
    typicalDuration: 'Terminado'
  }
};

interface DashboardProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onSelectStage: (stage: string) => void;
  involvedAreas?: string[];
  stageDetails?: Record<string, { label: string; color: string; bg: string; border: string; text: string; definition: string; keyDeliverables: string[]; typicalDuration: string }>;
  onExportPDF?: () => void;
}

export default function Dashboard({ 
  projects, 
  onSelectProject, 
  onSelectStage,
  involvedAreas = INVOLVED_AREAS,
  stageDetails = STAGE_DETAILS as any,
  onExportPDF
}: DashboardProps) {
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [hoveredArea, setHoveredArea] = useState<string | null>(null);
  const [selectedAreaModal, setSelectedAreaModal] = useState<string | null>(null);
  const [selectedClosureReportId, setSelectedClosureReportId] = useState<string | null>(null);
  const [milestonesFilter, setMilestonesFilter] = useState<'ALL' | 'COMPLETED' | 'PENDING'>('ALL');
  const [timelineProjectFilter, setTimelineProjectFilter] = useState<string>('ALL');
  const [timelineAreaFilter, setTimelineAreaFilter] = useState<string>('ALL');
  const [timelineDateSearch, setTimelineDateSearch] = useState<string>('');
  const [selectedHeatmapYear, setSelectedHeatmapYear] = useState<number>(2026);
  const [selectedHeatmapDay, setSelectedHeatmapDay] = useState<{ month: number; day: number; year: number } | null>(null);

  // 1. Calculate General KPI Metrics
  const totalProjects = projects.length;
  
  // Find active stages based on anything that of status other than completed/canceled or just check what stages are declared
  const activeStages = Object.keys(stageDetails).filter(key => key !== 'COMPLETADO' && key !== 'CANCELADO');
  
  const activeProjectsCount = projects.filter(p => activeStages.includes(p.stage)).length;
  
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  
  const blockedProjects = projects.filter(p => p.hasBlocker);
  const blockedProjectsCount = blockedProjects.length;

  const today = new Date('2026-06-19'); // Consistent reference date
  
  const overdueProjects = projects.filter(p => {
    if (p.stage === 'COMPLETADO' || p.stage === 'CANCELADO') return false;
    const dueDate = new Date(p.dueDate);
    return dueDate < today;
  });
  const overdueProjectsCount = overdueProjects.length;

  // 2. Stages Statistics
  const stageCounts = Object.keys(stageDetails).reduce((acc, stageKey) => {
    const list = projects.filter(p => p.stage === stageKey);
    const count = list.length;
    const progressSum = list.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = count > 0 ? Math.round(progressSum / count) : 0;
    const budgetSum = list.reduce((sum, p) => sum + p.budget, 0);
    
    acc[stageKey] = {
      count,
      avgProgress,
      budgetSum,
      percentage: totalProjects > 0 ? (count / totalProjects) * 100 : 0
    };
    return acc;
  }, {} as Record<string, { count: number; avgProgress: number; budgetSum: number; percentage: number }>);

  // 3. Areas Statistics (A project can have multiple areas)
  const areaCounts = involvedAreas.reduce((acc, area) => {
    const list = projects.filter(p => p.areas.includes(area));
    const count = list.length;
    const progressSum = list.reduce((sum, p) => sum + p.progress, 0);
    const avgProgress = count > 0 ? Math.round(progressSum / count) : 0;
    
    // Sum milestones & completed milestones across projects in this area
    const totalMilestones = list.reduce((sum, p) => sum + p.milestones.length, 0);
    const completedMilestones = list.reduce((sum, p) => sum + p.milestones.filter(m => m.completed).length, 0);
    const activeCount = list.filter(p => activeStages.includes(p.stage)).length;
    
    acc[area] = {
      count,
      activeCount,
      avgProgress,
      totalMilestones,
      completedMilestones,
    };
    return acc;
  }, {} as Record<string, { count: number; activeCount: number; avgProgress: number; totalMilestones: number; completedMilestones: number }>);

  // Formatting currency in COP (Millions or standard readable)
  const formatCOP = (val: number) => {
    if (val >= 1000000) {
      return `$${(val / 1000000).toFixed(1)}M COP`;
    }
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  const formatFullCOP = (val: number) => {
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  // Flat timeline map representing milestones of different projects. Sorted chronologically.
  const allTimelineMilestones = projects.flatMap(proj => 
    proj.milestones.map(m => ({
      ...m,
      project: proj,
    }))
  ).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const filteredTimeline = allTimelineMilestones.filter(m => {
    // 1. Status Filter
    if (milestonesFilter === 'COMPLETED' && !m.completed) return false;
    if (milestonesFilter === 'PENDING' && m.completed) return false;

    // 2. Project Filter
    if (timelineProjectFilter !== 'ALL' && m.project.id !== timelineProjectFilter) return false;

    // 3. Area Filter
    if (timelineAreaFilter !== 'ALL' && m.area !== timelineAreaFilter) return false;

    // 4. Date / Search Text Filter
    if (timelineDateSearch.trim()) {
      const searchLower = timelineDateSearch.toLowerCase().trim();
      const inTitle = (m.title || '').toLowerCase().includes(searchLower);
      const inEntity = (m.project.entity || '').toLowerCase().includes(searchLower);
      const inProjectName = (m.project.name || '').toLowerCase().includes(searchLower);
      const inDate = (m.dueDate || '').includes(searchLower);
      if (!inTitle && !inEntity && !inProjectName && !inDate) return false;
    }

    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome / Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between bg-white rounded-2xl p-6 md:p-8 text-slate-900 shadow-sm relative overflow-hidden border border-slate-200">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="absolute left-1/3 bottom-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mb-20"></div>
        
        <div className="relative z-10 space-y-2.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100">
            <Sparkles className="w-3 h-3 text-blue-500" />
            Panel Ejecutivo - Bento Grid Theme
          </span>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-850 font-sans">
            Dashboard de Proyectos Consultorsalud
          </h1>
          <p className="text-slate-500 text-xs md:text-sm max-w-2xl font-medium leading-relaxed">
            Monitoreo en tiempo real de consultorías activas, asignaciones financieras por áreas, riesgos e hitos contractuales del sector salud colombiano.
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 relative z-10 flex flex-col items-start md:items-end gap-2 text-left md:text-right bg-slate-50 p-4 rounded-xl border border-slate-200">
          <div>
            <span className="text-slate-450 text-[10px] uppercase tracking-wider font-bold block">Fecha del Reporte</span>
            <span className="text-blue-600 font-bold flex items-center gap-1 text-xs justify-end">
              <Calendar className="w-4 h-4 text-blue-500" />
              19 de Junio, 2026
            </span>
            <span className="text-slate-400 text-[10px] block mt-0.5">Simulación de operación activa</span>
          </div>
          {onExportPDF && (
            <button
              onClick={onExportPDF}
              className="mt-1 w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 shadow-sm shadow-blue-100 cursor-pointer active:scale-95"
              title="Descargar reporte completo en PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar PDF</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards Row (Top Row of Bento) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total & Active Projects */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md relative group overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Proyectos Activos</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-blue-600 tracking-tight">{activeProjectsCount}</span>
              <span className="text-[10px] text-green-600 font-bold bg-green-50 border border-green-150 px-1.5 py-0.5 rounded">+{totalProjects - activeProjectsCount} cerrados</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 text-[11px] text-slate-500 font-medium font-sans">
            <span>Cartera total: <b>{totalProjects}</b></span>
            <FolderGit2 className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Card 2: Monitored Budget */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md relative group overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Presupuesto Registrado</span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-black text-slate-800 tracking-tight font-mono">{formatCOP(totalBudget)}</span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 text-[11px] text-slate-500 font-medium">
            <span>Control consolidado 2026</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Card 3: Overdue Stages */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md relative group overflow-hidden flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Retrasos Operativos</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black tracking-tight ${overdueProjectsCount > 0 ? 'text-amber-600' : 'text-slate-850'}`}>{overdueProjectsCount}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${overdueProjectsCount > 0 ? 'bg-amber-50 border border-amber-200 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                {overdueProjectsCount > 0 ? 'Demorado' : 'Al Día'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50 text-[11px] text-slate-500 font-medium">
            <span>Etapas fuera de fecha</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
        </div>

        {/* Card 4: Blocked / Active Blockers */}
        <div className={`rounded-2xl p-5 border shadow-sm transition-all duration-300 hover:shadow-md relative group overflow-hidden flex flex-col justify-between min-h-[140px] ${blockedProjectsCount > 0 ? 'bg-red-50 border-red-150' : 'bg-white border-slate-200'}`}>
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Inconvenientes activos</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black tracking-tight ${blockedProjectsCount > 0 ? 'text-red-650' : 'text-slate-800'}`}>{blockedProjectsCount}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${blockedProjectsCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {blockedProjectsCount > 0 ? `${blockedProjectsCount} Críticos` : 'Cero bloqueos'}
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-100 text-[11px] text-slate-500 font-medium">
            <span>Riesgos de operación</span>
            <AlertOctagon className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Stage Distribution & Progress (7 cols) */}
        <div className="lg:col-span-12 xl:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="flex justify-between items-center pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black uppercase text-slate-400 tracking-wider">Distribución Física por Etapa</h3>
              <p className="text-xs text-slate-500">Volumen de proyectos activos y avance porcentual promedio por etapa.</p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-[#730000] px-3 py-1 rounded-full border border-blue-150">
              {totalProjects} Totales
            </span>
          </div>

          {/* Custom Interactive SVG/CSS Distribution Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.keys(stageDetails).map((stageKey) => {
              const stage = stageKey;
              const stats = stageCounts[stage];
              const details = stageDetails[stage];
              const stageProjects = projects.filter(p => p.stage === stage);
              
              if (!stats || stats.count === 0) return null;

              return (
                <div 
                  key={stage} 
                  onClick={() => onSelectStage(stage)}
                  className={`p-4 rounded-xl border transition-all duration-200 cursor-pointer relative overflow-visible group ${
                    hoveredStage === stage 
                      ? 'bg-blue-50/20 border-blue-200 scale-[1.01] shadow-xs' 
                      : 'bg-slate-50/40 border-slate-150'
                  }`}
                  onMouseEnter={() => setHoveredStage(stage)}
                  onMouseLeave={() => setHoveredStage(null)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${details.color}`}></span>
                      <span className="font-bold text-xs text-slate-800 line-clamp-1">{details.label}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded">
                        {stats.count}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 mt-3.5">
                    <div>
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Avance promedio</span>
                        <span className="font-semibold text-slate-700">{stats.avgProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-200/50 rounded-full h-1 mt-1 overflow-hidden">
                        <div 
                           className={`h-full ${details.color} rounded-full transition-all duration-500`}
                          style={{ width: `${stats.avgProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100/30">
                      <span>Presupuesto total:</span>
                      <span className="font-bold text-slate-900 font-mono">{formatCOP(stats.budgetSum)}</span>
                    </div>
                  </div>

                  {/* High quality hover popover tooltip */}
                  {hoveredStage === stage && (
                    <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 text-white rounded-2xl p-4.5 shadow-2xl z-40 animate-fade-in pointer-events-none text-xs border border-slate-800 space-y-3 max-w-sm sm:max-w-md">
                      <div className="space-y-1">
                        <span className="text-[9px] uppercase font-black text-slate-350 tracking-wider block">Propósito de la Etapa</span>
                        <p className="text-[10px] leading-relaxed text-slate-205 font-medium">
                          {details.definition || 'Sin descripción o propósito detallado.'}
                        </p>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-slate-800">
                        <span className="text-[9px] uppercase font-black text-emerald-400 tracking-wider block">Hitos & Entregables Clave</span>
                        <ul className="space-y-0.5 text-[10px] text-slate-300">
                          {details.keyDeliverables && details.keyDeliverables.length > 0 ? (
                            details.keyDeliverables.map((item, index) => (
                              <li key={index} className="flex items-start gap-1">
                                <span className="text-emerald-400 mt-0.5 font-bold">•</span>
                                <span>{item}</span>
                              </li>
                            ))
                          ) : (
                            <li className="text-slate-500 italic">No hay entregables configurados para esta etapa.</li>
                          )}
                        </ul>
                      </div>

                      <div className="space-y-1 pt-1.5 border-t border-slate-800">
                        <span className="text-[9px] uppercase font-black text-amber-400 tracking-wider block">Proyectos Activos ({stageProjects.length})</span>
                        <div className="max-h-20 overflow-y-auto space-y-1.5 pr-1 font-sans">
                          {stageProjects.length > 0 ? (
                            stageProjects.map(p => (
                              <div key={p.id} className="text-[10px] bg-slate-850 p-1.5 rounded text-slate-200 font-bold leading-normal">
                                {p.name} <span className="text-slate-400 font-normal">({p.entity})</span>
                              </div>
                            ))
                          ) : (
                            <span className="text-slate-500 italic">Sin proyectos en curso en esta etapa.</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[8px] font-black text-slate-450 uppercase tracking-wider">
                        <span>Duración: {details.typicalDuration || 'Variable'}</span>
                        <span className="text-teal-400 font-extrabold animate-pulse">Clic para filtrar proyecto &rarr;</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Key Alerts, Risks & Quick Actions (5 cols) */}
        <div className="lg:col-span-12 xl:col-span-4 flex flex-col gap-4">
          
          {/* Box 1: Alert Warnings and Blockers */}
          <div className="bg-red-50/50 rounded-2xl border border-red-150 p-5 shadow-sm flex-1 space-y-4">
            <div className="pb-3 border-b border-red-150">
              <h3 className="text-sm font-bold text-red-800 flex items-center gap-1.5">
                <AlertOctagon className="w-4.5 h-4.5 text-red-650 animate-pulse" />
                Alertas Activas y Críticas
              </h3>
              <p className="text-xs text-slate-500">Desviaciones de cronograma e impedimentos operacionales</p>
            </div>

            {/* List of Critical Items */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {overdueProjects.map(proj => (
                <div 
                  key={`overdue-${proj.id}`}
                  onClick={() => onSelectProject(proj.id)}
                  className="p-3 bg-white border border-amber-200 border-l-4 border-l-amber-500 rounded-xl text-xs space-y-1 cursor-pointer hover:bg-slate-50 transition-all shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-amber-800 uppercase tracking-widest text-[8px] bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100 flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      ETAPA VENCIDA
                    </span>
                    <span className="text-slate-400 font-mono text-[9px]">
                      Límite: {proj.dueDate}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-1">{proj.name}</h4>
                  <p className="text-slate-500 text-[10px]">Líder: {proj.leader} • Avance actual: {proj.progress}%</p>
                </div>
              ))}

              {blockedProjects.map(proj => (
                <div 
                  key={`blocked-${proj.id}`}
                  onClick={() => onSelectProject(proj.id)}
                  className="p-3 bg-white border border-red-150 border-l-4 border-l-red-500 rounded-xl text-xs space-y-1 cursor-pointer hover:bg-slate-50 transition-all shadow-xs"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-black text-red-700 uppercase tracking-widest text-[8px] bg-red-50 px-1.5 py-0.5 rounded border border-red-150 flex items-center gap-0.5">
                      <AlertOctagon className="w-2.5 h-2.5" />
                      BLOQUEADO
                    </span>
                    <span className="text-slate-400 font-mono text-[9px]">
                      Pausado
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 line-clamp-1">{proj.name}</h4>
                  <p className="text-red-700 text-[10px] font-medium italic">"{proj.blockerDescription}"</p>
                </div>
              ))}

              {overdueProjectsCount === 0 && blockedProjectsCount === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center text-slate-400 space-y-2 bg-white rounded-xl border border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                  <p className="text-xs font-semibold text-slate-700">¡Todo al día!</p>
                  <p className="text-[10px]">No hay alertas de fechas vencidas ni bloqueos operacionales en este momento.</p>
                </div>
              )}

              {/* Informes de Proyectos Finalizados */}
              <div className="pt-4 border-t border-slate-200/80 mt-4">
                <span className="text-[10px] uppercase font-black text-slate-450 tracking-wider block mb-2">📋 Acta e Informes de Cierre Contractual</span>
                {projects.filter(p => p.stage === ProjectStage.COMPLETADO || p.progress === 100).length > 0 ? (
                  <div className="space-y-2 max-h-[180px] overflow-y-auto pr-1">
                    {projects.filter(p => p.stage === ProjectStage.COMPLETADO || p.progress === 100).map(proj => (
                      <div 
                        key={`completed-${proj.id}`}
                        onClick={() => setSelectedClosureReportId(proj.id)}
                        className="p-3 bg-white border border-emerald-200 hover:border-emerald-400 border-l-4 border-l-emerald-500 rounded-xl text-xs space-y-1 cursor-pointer hover:bg-slate-50/80 transition-all shadow-xs group"
                      >
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="font-mono text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1 py-0.5 rounded uppercase">
                            ✓ liquidación y cierre
                          </span>
                          <span className="text-[#730000] font-black text-[9px] group-hover:underline flex items-center gap-0.5">
                            Ver reporte &rarr;
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-800 line-clamp-1">{proj.name}</h4>
                        <p className="text-[10px] text-slate-450 font-medium">Entidad: {proj.entity} • Líder: {proj.leader}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-450 italic bg-white/50 p-3 rounded-lg border border-slate-100 text-center">
                    No se registran proyectos liquidados o finalizados en el sistema.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Box 2: Visual Area Progress & Tasks (No budgets, only tasks, milestones, and progress) */}
          <div className="bg-white rounded-xl border border-slate-150 p-6 space-y-4">
            <div className="pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-5 h-5 text-[#730000]" />
                Progreso por Áreas
              </h3>
              <p className="text-xs text-slate-500">Avance consolidado e hitos completados de los equipos técnicos</p>
            </div>

            <div className="space-y-4">
              {INVOLVED_AREAS.map(area => {
                const stats = areaCounts[area];
                if (stats.count === 0) return null;

                return (
                  <div 
                    key={area} 
                    className="space-y-1.5 text-xs relative group cursor-pointer p-2.5 -m-2 rounded-xl border border-transparent hover:border-slate-150 hover:bg-slate-50/70 transition-all"
                    onClick={() => setSelectedAreaModal(area)}
                    title={`Click para ver proyectos, hitos y equipo de: ${area}`}
                    onMouseEnter={() => setHoveredArea(area)}
                    onMouseLeave={() => setHoveredArea(null)}
                  >
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="font-bold line-clamp-1 max-w-[200px] text-slate-800">{area}</span>
                      <span className="font-extrabold text-blue-600 font-mono">{stats.avgProgress}%</span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-full bg-blue-600 rounded-full transition-all duration-500"
                          style={{ width: `${stats.avgProgress}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold whitespace-nowrap bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded">
                        🎯 Hitos: {stats.completedMilestones}/{stats.totalMilestones}
                      </span>
                    </div>

                    {/* High quality hover popover tooltip for areas */}
                    {hoveredArea === area && (
                      <div className="absolute right-0 top-full mt-2 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl z-40 animate-fade-in pointer-events-none text-xs border border-slate-800 space-y-3 w-80 sm:w-96 font-sans">
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase font-black text-slate-350 tracking-wider block">Área de Consultoría</span>
                          <span className="text-[11px] font-black leading-tight block text-white">{area}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-2 border-t border-slate-800">
                          <div className="bg-slate-850 p-2 rounded border border-slate-800/50">
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-bold">Proyectos</span>
                            <span className="text-xs font-black text-white">{stats.count} vinculados</span>
                          </div>
                          <div className="bg-slate-850 p-2 rounded border border-slate-800/50">
                            <span className="text-slate-400 block text-[8px] uppercase tracking-wider font-bold">Hitos Totales</span>
                            <span className="text-xs font-black text-emerald-400">{stats.completedMilestones} de {stats.totalMilestones} ok</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-800">
                          <span className="text-[9px] uppercase font-black text-amber-400 tracking-wider block">Participación en Proyectos</span>
                          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 text-[10px]">
                            {projects.filter(p => p.areas.includes(area)).map(p => {
                              const totalH = p.milestones.length;
                              const compH = p.milestones.filter(m => m.completed).length;
                              return (
                                <div key={p.id} className="p-2 bg-slate-850 rounded border border-slate-800">
                                  <div className="flex justify-between items-center font-bold">
                                    <span className="text-slate-200 font-bold truncate max-w-[150px]">{p.entity}</span>
                                    <span className="text-emerald-400 font-mono text-[9px]">{p.progress}%</span>
                                  </div>
                                  <p className="text-slate-400 text-[9px] truncate">{p.name}</p>
                                  <div className="w-full bg-slate-800 rounded-full h-1 mt-1 overflow-hidden">
                                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${p.progress}%` }}></div>
                                  </div>
                                  <p className="text-[8px] text-slate-500 font-semibold mt-1">Hitos de área: {compH} de {totalH} completados</p>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="text-[8px] text-right font-bold text-slate-500 uppercase tracking-widest pt-1">
                          • Diagnóstico en tiempo real y progreso •
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION: CHRONOLOGICAL MILESTONES DASHBOARD & VISUAL TIMELINE */}
      <div className="bg-white rounded-xl border border-slate-150 p-6 space-y-4">
        <div className="pb-3 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#730000]" />
              Línea de Tiempo Operativa y Calendario de Hitos
            </h3>
            <p className="text-xs text-slate-500">
              Historial cronológico de entregas y compromisos activos a lo largo de las consultorías.
            </p>
          </div>
          
          {/* Timeline filter controls */}
          <div className="flex gap-1.5 bg-slate-50 border border-slate-205 p-1 rounded-xl shrink-0 self-start md:self-center">
            {(['ALL', 'COMPLETED', 'PENDING'] as const).map(option => (
              <button
                key={option}
                type="button"
                onClick={() => setMilestonesFilter(option)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  milestonesFilter === option
                    ? 'bg-[#730000] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {option === 'ALL' ? 'Todos' : option === 'COMPLETED' ? 'Completados ✓' : 'Pendientes ⏳'}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="bg-slate-50/50 rounded-xl p-3 border border-slate-150/80 flex flex-col md:flex-row items-center gap-4 text-xs">
          <div className="flex flex-col gap-1 w-full md:w-auto grow">
            <label className="text-[9px] font-black uppercase text-slate-400">Filtrar por Proyecto:</label>
            <select
              value={timelineProjectFilter}
              onChange={(e) => setTimelineProjectFilter(e.target.value)}
              className="bg-white border border-slate-205 hover:border-[#730000] text-xs text-slate-800 font-bold px-3 py-2 rounded-xl focus:outline-none transition-all cursor-pointer shadow-xs w-full"
            >
              <option value="ALL">🔍 Todos los Proyectos ({projects.length})</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>
                  {p.entity} - {p.name.length > 35 ? p.name.substring(0, 32) + '...' : p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full md:w-auto grow">
            <label className="text-[9px] font-black uppercase text-slate-400">Filtrar por Área Técnica:</label>
            <select
              value={timelineAreaFilter}
              onChange={(e) => setTimelineAreaFilter(e.target.value)}
              className="bg-white border border-slate-205 hover:border-[#730000] text-xs text-slate-800 font-bold px-3 py-2 rounded-xl focus:outline-none transition-all cursor-pointer shadow-xs w-full"
            >
              <option value="ALL">🛠️ Todas las Áreas ({involvedAreas.length})</option>
              {involvedAreas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1 w-full md:w-64 shrink-0">
            <label className="text-[9px] font-black uppercase text-slate-400 font-sans">Búsqueda / Mes o Término</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar hito o filtrar por término..."
                value={timelineDateSearch}
                onChange={(e) => setTimelineDateSearch(e.target.value)}
                className="bg-white border border-slate-205 hover:border-[#730000] text-xs text-slate-850 px-3 py-2 rounded-xl focus:outline-none transition-all w-full pr-8 font-medium"
              />
            </div>
          </div>
        </div>

        {/* HEATMAP PANEL */}
        <div className="bg-slate-50/40 rounded-2xl border border-slate-200/60 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2.5 text-[9px] font-black uppercase rounded-full bg-[#730000]/10 text-[#730000] tracking-wider shrink-0">
                MAPA DE CALOR
              </span>
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                Densidad de Avance y Cumplimiento
              </h4>
            </div>

            {/* Year selector */}
            <div className="flex items-center gap-1.5 self-end">
              <span className="text-[10px] text-slate-450 font-bold">Año Calendario:</span>
              <select
                value={selectedHeatmapYear}
                onChange={(e) => {
                  setSelectedHeatmapYear(Number(e.target.value));
                  setSelectedHeatmapDay(null); // Clear selected day details
                }}
                className="bg-white border border-slate-250 text-[10px] text-slate-800 font-black px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
              >
                {[2025, 2026, 2027].map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Scrolling Grid Wrapper */}
          <div className="w-full overflow-x-auto index-scroll pb-1">
            <div className="min-w-[680px] space-y-1">
              {/* Day numbers column headers */}
              <div className="flex items-center text-[8px] font-bold text-slate-400 h-4 pl-20">
                {Array.from({ length: 31 }, (_, i) => (
                  <div key={i} className="w-4.5 text-center shrink-0">
                    {i + 1}
                  </div>
                ))}
              </div>

              {/* Grid rows */}
              {Array.from({ length: 12 }, (_, monthIdx) => {
                const monthName = [
                  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
                ][monthIdx];

                const daysInMonth = new Date(selectedHeatmapYear, monthIdx + 1, 0).getDate();

                return (
                  <div key={monthIdx} className="flex items-center h-5">
                    {/* Month header label */}
                    <div className="w-20 text-[10px] font-bold text-slate-600 truncate pr-2">
                      {monthName}
                    </div>

                    {/* Cells for each of the 31 days */}
                    <div className="flex items-center">
                      {Array.from({ length: 31 }, (_, dayIdx) => {
                        const dayNum = dayIdx + 1;
                        const isValidDay = dayNum <= daysInMonth;

                        if (!isValidDay) {
                          return (
                            <div
                              key={dayIdx}
                              className="w-4.5 h-4.5 mx-[0.5px] rounded bg-slate-100/30 border border-transparent scale-95 cursor-not-allowed opacity-30"
                            />
                          );
                        }

                        // Extract achievements/deliverables due on this year, month, day
                        const dayMilestones = filteredTimeline.filter(m => {
                          try {
                            const d = new Date(m.dueDate);
                            return (
                              d.getFullYear() === selectedHeatmapYear &&
                              d.getMonth() === monthIdx &&
                              d.getDate() === dayNum
                            );
                          } catch (e) {
                            return false;
                          }
                        });

                        const totalHitos = dayMilestones.length;
                        const compHitos = dayMilestones.filter(m => m.completed).length;
                        const hasPending = dayMilestones.some(m => !m.completed);

                        // Heat styling classes based on count of completed milestones & pending status
                        let cellBg = 'bg-slate-100 hover:bg-slate-200 border-transparent';
                        if (totalHitos > 0) {
                          if (compHitos === 0 && hasPending) {
                            cellBg = 'bg-amber-100 border border-amber-250 hover:bg-amber-150 text-amber-900';
                          } else if (compHitos === 1) {
                            cellBg = 'bg-red-100 border border-red-200 hover:bg-red-200 text-red-900';
                          } else if (compHitos === 2) {
                            cellBg = 'bg-red-300 border border-red-400 hover:bg-red-400 text-white';
                          } else if (compHitos >= 3) {
                            cellBg = 'bg-[#730000] border border-[#730000] hover:bg-[#8e0303] text-white font-bold';
                          }
                        }

                        const isCurrentlySelected = 
                          selectedHeatmapDay?.day === dayNum && 
                          selectedHeatmapDay?.month === monthIdx && 
                          selectedHeatmapDay?.year === selectedHeatmapYear;

                        return (
                          <button
                            key={dayIdx}
                            type="button"
                            onClick={() => {
                              setSelectedHeatmapDay({
                                day: dayNum,
                                month: monthIdx,
                                year: selectedHeatmapYear
                              });
                            }}
                            title={`${dayNum} de ${monthName}, ${selectedHeatmapYear}: ${compHitos} completados / ${totalHitos} totales`}
                            className={`w-4.5 h-4.5 mx-[0.5px] rounded text-[8px] flex items-center justify-center transition-all focus:outline-none cursor-pointer hover:scale-105 active:scale-95 ${cellBg} ${
                              isCurrentlySelected ? 'ring-2 ring-blue-500 ring-offset-1 scale-110 animate-ping-limited' : ''
                            }`}
                          >
                            {compHitos > 0 ? compHitos : ''}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Color legend scale description */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-semibold font-sans">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-bold text-slate-450 uppercase text-[9px]">Intensidad:</span>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-slate-100 rounded inline-block border border-slate-200" />
                <span>Sin hitos</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-amber-100 rounded inline-block border border-amber-250" />
                <span>Hitos Pendientes</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-100 rounded inline-block border border-red-200" />
                <span>1 Completado ✓</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-red-300 rounded inline-block border border-red-400" />
                <span>2 Completados ✓</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-3 h-3 bg-[#730000] rounded inline-block border border-[#730000]" />
                <span>3+ Completados ✓</span>
              </div>
            </div>

            <div className="text-[9px] font-black text-[#730000] uppercase tracking-wider">
              {filteredTimeline.filter(m => m.completed).length} de {filteredTimeline.length} Hitos Consolidados
            </div>
          </div>

          {/* Interactivity Details box */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
            {selectedHeatmapDay ? (() => {
              const monthName = [
                'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
              ][selectedHeatmapDay.month];

              const dayMilestones = filteredTimeline.filter(m => {
                try {
                  const d = new Date(m.dueDate);
                  return (
                    d.getFullYear() === selectedHeatmapDay.year &&
                    d.getMonth() === selectedHeatmapDay.month &&
                    d.getDate() === selectedHeatmapDay.day
                  );
                } catch (e) {
                  return false;
                }
              });

              return (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                    <span className="font-bold text-slate-800">
                      📍 Compromisos del {selectedHeatmapDay.day} de {monthName}, {selectedHeatmapDay.year}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedHeatmapDay(null)}
                      className="text-[10px] text-slate-400 hover:text-red-650 font-black cursor-pointer uppercase tracking-wider"
                    >
                      Cerrar detalle ✕
                    </button>
                  </div>

                  {dayMilestones.length > 0 ? (
                    <div className="space-y-2 max-h-48 overflow-y-auto index-scroll pr-1">
                      {dayMilestones.map((m, index) => (
                        <div key={index} className="p-2 border border-slate-100 rounded-lg space-y-1 bg-slate-50/50 hover:bg-slate-50 transition-all text-xs">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="text-[10px] font-black text-[#730000] uppercase truncate max-w-[200px]">
                              {m.project.entity} &rarr;
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              m.completed
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-250'
                                : 'bg-amber-50 text-amber-700 border border-amber-250'
                            }`}>
                              {m.completed ? 'COMPLETADO ✓' : 'PENDIENTE ⏳'}
                            </span>
                          </div>
                          <p className="font-bold text-slate-800 text-xs">{m.title}</p>
                          {m.area && (
                            <span className="text-[10px] text-slate-450 block font-medium">
                              Área Técnica: <span className="font-bold text-slate-600">{m.area}</span> {m.assignedPerson ? `• Asignado: ${m.assignedPerson}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-450 italic py-1">
                      No hay hitos programados para este día. Utiliza los filtros de arriba para explorar otros periodos o áreas.
                    </p>
                  )}
                </div>
              );
            })() : (
              <div className="flex items-center gap-2 text-[10px] text-slate-450 font-semibold font-sans">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse shrink-0" />
                <span><b>Tip de navegación:</b> Haz clic sobre cualquier casilla de color para desglosar inmediatamente los entregables, líderes técnicos y estados de avance de esa fecha. El mapa responde automáticamente a los selectores de proyecto y área superiores.</span>
              </div>
            )}
          </div>
        </div>

        {/* Timeline representation */}
        {filteredTimeline.length > 0 ? (
          <div className="relative border-l border-slate-200 ml-4 pl-6 space-y-6 pt-2 pb-2 max-h-96 overflow-y-auto index-scroll pr-2">
            {filteredTimeline.map((item, index) => {
              const itemDate = new Date(item.dueDate);
              const isOverdueMilestone = !item.completed && itemDate < new Date('2026-06-19');
              return (
                <div key={`${item.id}-${index}`} className="relative group/timeline animate-fade-in text-xs">
                  {/* Circle locator icon */}
                  <span className={`absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border-2 flex items-center justify-center transition-all ${
                    item.completed
                      ? 'bg-emerald-500 border-white text-white shadow-xs text-[8px] font-bold'
                      : isOverdueMilestone
                        ? 'bg-red-500 border-white text-white shadow-xs animate-pulse text-[8px] font-bold'
                        : 'bg-amber-400 border-white text-white shadow-xs text-[8px] font-bold'
                  }`}>
                    {item.completed ? '✓' : '!'}
                  </span>

                  {/* Body card */}
                  <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-150/70 hover:border-slate-300 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Due Date badge */}
                        <span className="font-mono text-[10px] font-bold bg-[#730000]/5 text-[#730000] border border-[#730000]/10 px-2 py-0.5 rounded">
                          📅 {item.dueDate}
                        </span>
                        
                        {/* Associated Project Entity label */}
                        <button
                          type="button"
                          onClick={() => onSelectProject(item.project.id)}
                          className="font-black text-slate-700 hover:text-[#730000] hover:underline cursor-pointer tracking-tight"
                        >
                          {item.project.entity} &rarr;
                        </button>
                        
                        {/* Area style badge if available */}
                        {item.area && (
                          <span className="text-[9px] bg-[#730000]/5 text-[#730000] border border-[#730000]/15 font-bold px-1.5 py-0.5 rounded">
                            {item.area}
                          </span>
                        )}
                      </div>

                      {/* Title of Milestone */}
                      <p className="font-bold text-slate-800 text-sm leading-snug">
                        {item.title}
                      </p>
                      
                      {/* Project name description link */}
                      <p className="text-[10px] text-slate-450 font-medium">
                        Proyecto: <span className="font-bold text-slate-700">{item.project.name}</span> • Liderado por: <span className="font-semibold text-slate-600">{item.project.leader}</span>
                      </p>
                    </div>

                    {/* Right side status badge */}
                    <div className="flex items-center gap-2 self-start md:self-center">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                        item.completed
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-250'
                          : isOverdueMilestone
                            ? 'bg-red-50 text-red-700 border-red-250 animate-pulse'
                            : 'bg-amber-50 text-amber-700 border-amber-250'
                      }`}>
                        {item.completed ? 'Completado ✓' : isOverdueMilestone ? 'Fecha Expirada ⚠️' : 'Pendiente ⏳'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-400 bg-slate-50/50 rounded-xl border border-slate-150">
            <Calendar className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-xs text-slate-600">No se encontraron hitos en esta categoría</p>
            <p className="text-[10px]">No hay registros para el filtro seleccionado actualmente.</p>
          </div>
        )}
      </div>

      {/* Grid: Project Leads & Budgets Table */}
      <div className="bg-white rounded-xl border border-slate-150 p-6">
        <div className="pb-4 border-b border-slate-100 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Participación por Directores de Proyecto</h3>
            <p className="text-xs text-slate-500">Distribución de liderazgo técnico y montos contractuales</p>
          </div>
          <span className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 py-1.5 px-3 rounded-lg font-medium inline-block text-center border border-slate-250 cursor-default">
            Total Contractual: <span className="font-bold text-slate-900">{formatFullCOP(totalBudget)}</span>
          </span>
        </div>

        {/* Detailed Leader Grid */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-medium">
                <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Líder Técnico</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Proyectos Encargados</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Presupuesto Total Asociado</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[10px]">Progreso Promedio</th>
                <th className="py-3 px-4 uppercase tracking-wider text-[10px] text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(new Set(projects.map(p => p.leader))).map(leaderName => {
                const leaderProjects = projects.filter(p => p.leader === leaderName);
                const count = leaderProjects.length;
                const totalBudgetSum = leaderProjects.reduce((sum, p) => sum + p.budget, 0);
                const avgProgress = Math.round(leaderProjects.reduce((sum, p) => sum + p.progress, 0) / count);

                return (
                  <tr key={leaderName} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{leaderName}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex gap-1 items-center flex-wrap">
                        {leaderProjects.map((p, i) => (
                          <span 
                            key={p.id} 
                            onClick={() => onSelectProject(p.id)}
                            className="bg-[#730000]/5 text-[#730000] border border-[#730000]/10 text-[10px] px-2 py-0.5 rounded cursor-pointer hover:bg-[#730000]/10 transition-all font-medium"
                            title={p.name}
                          >
                            {p.entity}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono">
                      {formatFullCOP(totalBudgetSum)}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${avgProgress}%` }}></div>
                        </div>
                        <span className="font-semibold text-slate-700">{avgProgress}%</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {leaderProjects.length === 1 ? (
                        <button 
                          onClick={() => onSelectProject(leaderProjects[0].id)}
                          className="text-[#730000] font-semibold hover:underline"
                        >
                          Ver único
                        </button>
                      ) : (
                        <span className="text-slate-400 font-normal italic">Múltiples</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* POPUP MODAL: TECHNICAL AREA DETAILS DIAGNOSTICS */}
      {selectedAreaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-205 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col animate-scale-up">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50 rounded-t-2xl">
              <div className="space-y-1">
                <span className="text-[9px] uppercase font-black text-[#730000] tracking-widest block">Área de Consultoría y Mesa Técnica</span>
                <h4 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#730000]" />
                  {selectedAreaModal}
                </h4>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedAreaModal(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Roster & Content */}
            <div className="p-6 space-y-6">
              {/* Row 1: Team & Staff */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">🤝 Especialistas y Profesionales Integrantes</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {(PREDEFINED_PEOPLE_BY_AREA[selectedAreaModal] || []).map((person, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100/80 rounded-xl hover:border-slate-205 transition-all text-xs font-medium text-slate-800">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-650 flex items-center justify-center font-bold text-[10px] border border-slate-300 shrink-0">
                        {person.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{person}</p>
                        <p className="text-[9px] text-slate-450 uppercase font-black">Especialista de Área</p>
                      </div>
                    </div>
                  ))}
                  {(!PREDEFINED_PEOPLE_BY_AREA[selectedAreaModal] || PREDEFINED_PEOPLE_BY_AREA[selectedAreaModal].length === 0) && (
                    <p className="text-xs text-slate-450 italic">No hay especialistas asignados permanente actualmente.</p>
                  )}
                </div>
              </div>

              {/* Row 2: Projects under this area */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">💼 Proyectos Vinculados Operacionalmente</span>
                <div className="space-y-2">
                  {projects.filter(p => p.areas.includes(selectedAreaModal)).map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => {
                        onSelectProject(p.id);
                        setSelectedAreaModal(null);
                      }}
                      className="p-3.5 bg-white border border-slate-150 hover:border-[#730000] hover:bg-slate-50/45 rounded-xl transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-extrabold text-[#730000] text-[10px] uppercase">{p.entity}</span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${
                            p.stage === 'COMPLETADO' ? 'bg-emerald-50 text-emerald-800' : 'bg-[#730000]/5 text-[#730000]'
                          }`}>
                            {STAGE_DETAILS[p.stage]?.label || p.stage}
                          </span>
                        </div>
                        <h5 className="font-black text-slate-900 text-xs leading-snug">{p.name}</h5>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-550 block font-semibold">Avance: {p.progress}%</span>
                          <div className="w-20 bg-slate-100 rounded-full h-1 mt-0.5 overflow-hidden">
                            <div className="h-full bg-[#730000] rounded-full" style={{ width: `${p.progress}%` }}></div>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                  {projects.filter(p => p.areas.includes(selectedAreaModal)).length === 0 && (
                    <p className="text-xs text-slate-450 italic">No hay proyectos asignados en esta sección actualmente.</p>
                  )}
                </div>
              </div>

              {/* Row 3: Milestones in Projects linked for this area */}
              <div className="space-y-3">
                <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">🎯 Diagnóstico General de Entregables (Hitos)</span>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-1.5">
                  {projects.filter(p => p.areas.includes(selectedAreaModal)).flatMap(p => 
                    p.milestones.map(m => ({ ...m, proj: p }))
                  ).map((m, index) => (
                    <div key={`${m.id}-${index}`} className="p-2 border border-slate-100 bg-slate-50/30 rounded-lg flex items-center justify-between text-[11px] font-sans">
                      <div className="space-y-0.5 max-w-[80%]">
                        <p className={m.completed ? 'line-through text-slate-400 font-medium' : 'font-bold text-slate-700'}>
                          {m.title}
                        </p>
                        <p className="text-[9px] text-slate-450 font-medium">Asociado a: {m.proj.entity} • Límite entrega: {m.dueDate}</p>
                      </div>
                      <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-widest shrink-0 ${
                        m.completed ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'
                      }`}>
                        {m.completed ? 'Completo ✓' : 'Pendiente'}
                      </span>
                    </div>
                  ))}
                  {projects.filter(p => p.areas.includes(selectedAreaModal)).reduce((acc, p) => acc + p.milestones.length, 0) === 0 && (
                    <p className="text-xs text-slate-450 italic text-center py-2">No hay hitos programados para los proyectos vinculados de esta sección.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between items-center rounded-b-2xl">
              <button 
                type="button"
                onClick={() => {
                  try {
                    generateAreaPDFReport(selectedAreaModal, projects);
                  } catch (e) {
                    console.error("Error exporting area report", e);
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Exportar Informe de Área (PDF)</span>
              </button>
              <button 
                type="button"
                onClick={() => setSelectedAreaModal(null)}
                className="bg-[#730000] hover:bg-[#590000] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              >
                Cerrar Panel Técnico
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POPUP MODAL: COMPLETED PROJECT CLOSURE REPORT & ACTA DE LIQUIDACIÓN */}
      {selectedClosureReportId && (() => {
        const p = projects.find(proj => proj.id === selectedClosureReportId);
        if (!p) return null;

        // Date & duration calculations
        const start = new Date(p.startDate);
        const end = new Date(p.dueDate);
        const elapsedSime = Math.abs(end.getTime() - start.getTime());
        const totalDurationDays = Math.ceil(elapsedSime / (1000 * 60 * 60 * 24)) || 120;
        const totalMilestones = p.milestones.length;
        const compMilestones = p.milestones.filter(m => m.completed).length;
        const totalIssues = p.issues.length;
        const resolvedIssues = p.issues.filter(i => i.resolved).length;

        return (
          <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-fade-in">
            <div className="bg-white rounded-2xl border border-slate-205 shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto flex flex-col animate-scale-up">
              
              {/* Document Header banner */}
              <div className="p-6 border-b border-slate-200 bg-slate-50 rounded-t-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 w-32 h-32 bg-[#730000]/5 rounded-full blur-2xl"></div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-1">
                    <span className="text-[9px] uppercase font-black text-emerald-700 bg-emerald-50 border border-emerald-150 px-2 py-0.5 rounded-full inline-block tracking-widest mb-1 shadow-sm">
                      Acta de Liquidación Operativa y Cierre ✓
                    </span>
                    <p className="text-xs text-slate-450 font-bold">REGISTRO CONTRACTUAL COLOMBIA</p>
                    <h4 className="text-xl font-black text-slate-900 tracking-tight">{p.entity}</h4>
                    <p className="text-xs text-slate-500 font-medium">Informe consolidado de finalización y entrega.</p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => setSelectedClosureReportId(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-6 space-y-6 text-xs text-slate-700 font-sans leading-relaxed">
                
                {/* Visual Metadata Panel */}
                <div className="bg-slate-50 grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 border border-slate-150 rounded-xl">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-black uppercase">Proyecto</span>
                    <span className="font-bold text-slate-900 line-clamp-1">{p.name}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-black uppercase">Líder de Mesa</span>
                    <span className="font-bold text-slate-900">{p.leader}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-black uppercase">Presupuesto Ejecutado</span>
                    <span className="font-bold text-[#730000] font-mono">{formatFullCOP(p.budget)}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-black uppercase">Fecha Constitución</span>
                    <span className="font-bold text-slate-800">{p.startDate}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-black uppercase">Fecha Cierre Oficial</span>
                    <span className="font-bold text-slate-800">{p.dueDate}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-black uppercase">Hitos Entregados</span>
                    <span className="font-black text-emerald-600">{compMilestones} de {totalMilestones} (100%)</span>
                  </div>
                </div>

                {/* 1. ¿Qué pasó con este Proyecto? Dynamic summary */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">📋 Resumen Ejecutivo ("¿Qué pasó con este Proyecto?")</span>
                  <p className="bg-emerald-50/20 border border-emerald-150/40 p-4 rounded-xl leading-relaxed text-slate-750 font-medium font-sans">
                    El proyecto con la entidad <b className="text-slate-900">{p.entity}</b> ha terminado formalmente con todos sus compromisos y metas técnicas sectoriales. Bajo la dirección experta de <b className="text-slate-900">{p.leader}</b>, el equipo interviniente cerró y consolidó satisfactoriamente los <b className="text-[#730000] font-bold">{totalMilestones} hitos</b> contractuales previstos. 
                    {totalIssues > 0 ? (
                      <span> Se reaccionó eficazmente para resolver {totalIssues} incidentes operativos críticos, logrando solventar y levantar los bloqueos oportunamente.</span>
                    ) : (
                      <span> No se reportaron inconvenientes ni bloqueos operativos de consideración durante el desarrollo normal de las mesas técnicas.</span>
                    )}
                     El proyecto ha culminado al 100% su transferencia y se encuentra listo para archivar.
                  </p>
                </div>

                {/* 2. Tiempos de Proceso Analytics */}
                <div className="space-y-3">
                  <span className="text-[10px] font-black uppercase text-slate-450 tracking-wider block">⏱️ Análisis de Tiempos y Duración de Procesos</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black">Duración del Cronograma Contractual</p>
                      <p className="text-xl font-black text-slate-800 font-mono">{totalDurationDays} Días Calendario</p>
                      <p className="text-[10px] text-slate-450">Tiempo total desde la fecha de inicio hasta el cierre definitivo.</p>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                      <p className="text-[10px] text-slate-400 uppercase font-black">Frecuencia Media de Entregas</p>
                      <p className="text-xl font-black text-slate-800 font-mono">
                        {totalMilestones > 0 ? (totalDurationDays / totalMilestones).toFixed(1) : '0'} Días / Hito
                      </p>
                      <p className="text-[10px] text-slate-450">Velocidad promedio de formalización y sustentación ante el cliente.</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                    <p className="text-[10px] text-slate-400 uppercase font-black font-sans">Métricas de Control de Desviación</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-medium text-slate-500">Incidentes Críticos Reportados:</span>
                      <span className="font-bold text-slate-850">{totalIssues}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/40">
                      <span className="font-medium text-slate-500">Incidentes Resueltos:</span>
                      <span className="font-bold text-emerald-600">{resolvedIssues} ({totalIssues > 0 ? Math.round((resolvedIssues/totalIssues)*100) : 100}%)</span>
                    </div>
                    <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/40">
                      <span className="font-medium text-slate-500">Margen de Desviación sobre Límite:</span>
                      <span className="font-semibold text-slate-800 font-mono">0.0% (Cierre puntual en fecha contractual)</span>
                    </div>
                  </div>
                </div>

                {/* Warning official stamp */}
                <div className="text-[9px] text-center text-slate-400 font-black tracking-widest pt-3 uppercase border-t border-slate-200/65">
                  • COLOMBIA CONSULTORSALUD • PORTAFOLIO DE ADJUDICACIÓN DE CONSULTORÍAS •
                </div>
              </div>

              {/* Action buttons */}
              <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-between gap-2 rounded-b-2xl">
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => window.print()}
                    className="bg-white border hover:bg-slate-50 border-slate-250 text-slate-800 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    🖨️ Imprimir Acta
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      try {
                        generateProjectPDF(p);
                      } catch (err) {
                        console.error(err);
                      }
                    }}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 inline-flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedClosureReportId(null)}
                  className="bg-[#730000] hover:bg-[#590000] text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
                >
                  Cerrar Acta de Liquidación
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
