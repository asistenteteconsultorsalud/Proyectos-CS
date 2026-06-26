import React, { useState, useEffect, useMemo } from 'react';
import { Project, ProjectStage, STAGE_DETAILS, INVOLVED_AREAS, getAreaStyle } from '../types';
import { 
  PlusCircle, 
  Search, 
  User, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  TrendingUp, 
  Trash2, 
  ChevronRight, 
  SlidersHorizontal,
  BookmarkPlus,
  Building2,
} from 'lucide-react';

interface ProjectListProps {
  projects: Project[];
  onSelectProject: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
  onAddProjectClick: () => void;
  initialStageFilter?: string;
  onStageFilterChange?: (stage: string) => void;
  initialAreaFilter?: string;
  onAreaFilterChange?: (area: string) => void;
  involvedAreas?: string[];
  stageDetails?: Record<string, { label: string; color: string; bg: string; border: string; text: string }>;
}

export default function ProjectList({ 
  projects, 
  onSelectProject, 
  onDeleteProject, 
  onAddProjectClick,
  initialStageFilter = 'ALL',
  onStageFilterChange,
  initialAreaFilter = 'ALL',
  onAreaFilterChange,
  involvedAreas = INVOLVED_AREAS,
  stageDetails = STAGE_DETAILS as any
}: ProjectListProps) {
  // Filters & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStage, setSelectedStage] = useState<string>(initialStageFilter);
  const [selectedArea, setSelectedArea] = useState<string>(initialAreaFilter);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL'); // ALL, OK, BLOCKED, OVERDUE
  const [selectedPerson, setSelectedPerson] = useState<string>('ALL');
  const [hoveredQuickPeek, setHoveredQuickPeek] = useState<string | null>(null);

  // Extract all unique people currently assigned within the projects database
  const allAssignedPeople = useMemo(() => {
    const list = new Set<string>();
    projects.forEach(p => {
      if (p.areaAssignments) {
        Object.values(p.areaAssignments).forEach(arr => {
          arr.forEach(person => {
            if (person.trim()) {
              list.add(person.trim());
            }
          });
        });
      }
    });
    return Array.from(list).sort();
  }, [projects]);

  // Sycnronize external pre-filters (e.g. from Dashboard stage click)
  useEffect(() => {
    setSelectedStage(initialStageFilter);
  }, [initialStageFilter]);

  useEffect(() => {
    setSelectedArea(initialAreaFilter);
  }, [initialAreaFilter]);

  const handleStageChange = (newStage: string) => {
    setSelectedStage(newStage);
    if (onStageFilterChange) {
      onStageFilterChange(newStage);
    }
  };

  const handleAreaChange = (newArea: string) => {
    setSelectedArea(newArea);
    if (onAreaFilterChange) {
      onAreaFilterChange(newArea);
    }
  };

  // Reference today date
  const today = new Date('2026-06-19');

  // Filter projects based on conditions
  const filteredProjects = projects.filter(proj => {
    // 1. Search Query Match
    const matchesSearch = 
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.leader.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.description.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Stage Match
    const matchesStage = selectedStage === 'ALL' || proj.stage === selectedStage;

    // 3. Area Match
    const matchesArea = selectedArea === 'ALL' || proj.areas.includes(selectedArea);

    // 3.5. Person Match
    let matchesPerson = true;
    if (selectedPerson !== 'ALL') {
      matchesPerson = false;
      if (proj.areaAssignments) {
        matchesPerson = Object.values(proj.areaAssignments).some(arr => 
          arr.some(p => p.trim().toLowerCase() === selectedPerson.toLowerCase())
        );
      }
    }

    // 4. Status Match
    let matchesStatus = true;
    if (selectedStatus === 'BLOCKED') {
      matchesStatus = proj.hasBlocker;
    } else if (selectedStatus === 'OVERDUE') {
      const isCompleted = proj.stage === ProjectStage.COMPLETADO || proj.stage === ProjectStage.CANCELADO;
      matchesStatus = !isCompleted && new Date(proj.dueDate) < today;
    } else if (selectedStatus === 'OK') {
      const isCompleted = proj.stage === ProjectStage.COMPLETADO || proj.stage === ProjectStage.CANCELADO;
      const isOverdue = !isCompleted && new Date(proj.dueDate) < today;
      matchesStatus = !proj.hasBlocker && !isOverdue;
    }

    return matchesSearch && matchesStage && matchesArea && matchesPerson && matchesStatus;
  });

  // Calculate stats for current filtering
  const formatCOP = (val: number) => {
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* List Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Listado Maestro de Proyectos</h2>
          <p className="text-xs text-slate-500 font-medium">Agrega, filtra, edita y supervisa los proyectos activos y programados.</p>
        </div>

        <button
          onClick={onAddProjectClick}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-sm text-xs md:text-sm active:scale-95"
        >
          <PlusCircle className="w-4.5 h-4.5" />
          Registrar Nuevo Proyecto
        </button>
      </div>

      {/* Filter Toolbar - Bento Panel style */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-slate-700 text-xs font-bold pb-2 border-b border-slate-100 font-sans">
          <SlidersHorizontal className="w-4 h-4 text-blue-600" />
          <span className="tracking-tight uppercase text-slate-500 text-[10px] font-black">Filtros avanzados de búsqueda</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search Box */}
          <div className="relative">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Buscar texto</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Proyecto, entidad, líder..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-medium"
              />
            </div>
          </div>

          {/* Stage Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Filtrar por Etapa</label>
            <select
              value={selectedStage}
              onChange={e => handleStageChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
            >
              <option value="ALL">Todas las Etapas</option>
              {Object.keys(stageDetails).map(stageKey => (
                <option key={stageKey} value={stageKey}>
                  {stageDetails[stageKey].label}
                </option>
              ))}
            </select>
          </div>

          {/* Area Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-405 uppercase mb-1.5">Área de Intervención</label>
            <select
              value={selectedArea}
              onChange={e => handleAreaChange(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
            >
              <option value="ALL">Todas las Áreas</option>
              {involvedAreas.map(area => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>

          {/* Assigned Personnel Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Consultor Asignado</label>
            <select
              value={selectedPerson}
              onChange={e => setSelectedPerson(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
            >
              <option value="ALL">Todos los Consultores</option>
              {allAssignedPeople.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Status Filter */}
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5">Estado de Alertas</label>
            <select
              value={selectedStatus}
              onChange={e => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-medium transition-all"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="OK">Al Día (Sin alertas)</option>
              <option value="BLOCKED">Exclusivo Bloqueados</option>
              <option value="OVERDUE">Exclusivo Fechas Vencidas</option>
            </select>
          </div>
        </div>

        {/* Selected parameters and count */}
        <div className="flex justify-between items-center text-xs text-slate-500 pt-3 border-t border-slate-100 font-semibold font-sans">
          <span>Se encontraron <span className="font-bold text-slate-800">{filteredProjects.length}</span> proyectos que coinciden</span>
          {(searchQuery || selectedStage !== 'ALL' || selectedArea !== 'ALL' || selectedStatus !== 'ALL' || selectedPerson !== 'ALL') && (
            <button
              onClick={() => {
                setSearchQuery('');
                handleStageChange('ALL');
                handleAreaChange('ALL');
                setSelectedStatus('ALL');
                setSelectedPerson('ALL');
              }}
              className="text-blue-600 hover:text-blue-700 hover:underline font-bold"
            >
              Restablecer filtros
            </button>
          )}
        </div>
      </div>

      {/* Grid of Project Cards */}
      {filteredProjects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map(proj => {
            const stageMeta = stageDetails[proj.stage] || { label: proj.stage, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
            const isCompleted = proj.stage === 'COMPLETADO' || proj.stage === 'CANCELADO';
            const isOverdue = !isCompleted && new Date(proj.dueDate) < today;

            return (
              <div
                key={proj.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-blue-300 shadow-sm transition-all duration-300 flex flex-col hover:shadow-md relative overflow-hidden group"
              >
                {/* Visual block line indicators */}
                {proj.hasBlocker ? (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500"></div>
                ) : isOverdue ? (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
                ) : (
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100 group-hover:bg-blue-500 transition-colors"></div>
                )}

                {/* Card Header information */}
                <div className="p-6 flex-1 space-y-4">
                  <div className="flex justify-between items-start gap-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${stageMeta.bg} ${stageMeta.text} ${stageMeta.border}`}>
                      {stageMeta.label}
                    </span>
                    
                    {/* Urgency Badge Indicators */}
                    <div className="flex gap-1.5">
                      {proj.hasBlocker && (
                        <span className="bg-red-50 border border-red-200 text-red-700 text-[9px] px-2 py-0.5 rounded font-black flex items-center gap-1" title="Inconveniente crítico activo">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                          BLOQUEADO
                        </span>
                      )}
                      {isOverdue && (
                        <span className="bg-amber-50 border border-amber-200 text-amber-850 text-[9px] px-2 py-0.5 rounded font-black flex items-center gap-1" title="Hito vencido según cronograma">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                          EXPIRADO
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-slate-400 font-bold text-[9px] uppercase tracking-wider">
                      <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="line-clamp-1">{proj.entity}</span>
                    </div>
                    <h3 
                      onClick={() => onSelectProject(proj.id)}
                      className="text-base font-black text-slate-850 group-hover:text-blue-600 transition-colors cursor-pointer line-clamp-1 font-sans"
                    >
                      {proj.name}
                    </h3>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 md:h-10 font-medium">
                      {proj.description}
                    </p>
                  </div>

                  {/* Areas and assigned personnel list */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block">Áreas y Personal de Trabajo:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {proj.areas.map(areaName => {
                        const assignments = proj.areaAssignments || {};
                        const assignedPeople = assignments[areaName] || [];
                        const style = getAreaStyle(areaName);

                        return (
                          <div 
                            key={areaName} 
                            className={`${style.bg} ${style.border} border rounded-lg px-2.5 py-1 text-[10px] flex flex-col justify-center`}
                          >
                            <span className="font-extrabold text-slate-850 leading-tight block">{areaName}</span>
                            {assignedPeople.length > 0 ? (
                              <span className="text-[9px] text-slate-600 font-bold leading-normal text-ellipsis overflow-hidden max-w-[130px]" title={assignedPeople.join(', ')}>
                                {assignedPeople.join(', ')}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-400 italic">Sin asignar</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational indicators Row */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-slate-100 text-xs">
                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        Líder Encargado
                      </span>
                      <p className="font-bold text-slate-850 line-clamp-1">{proj.leader}</p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Fin Etapa
                      </span>
                      <p className={`font-bold font-mono ${isOverdue ? 'text-amber-700' : 'text-slate-850'}`}>
                        {proj.dueDate}
                      </p>
                    </div>

                    <div className="space-y-0.5 col-span-2">
                      <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-slate-400" />
                        Presupuesto del Proyecto / Consultoría
                      </span>
                      <p className="font-black text-slate-900 font-mono text-[13px] leading-none pt-0.5">
                        {formatCOP(proj.budget)}
                      </p>
                    </div>
                  </div>

                  {/* Scope percentage bar */}
                  <div className="space-y-1.5 pt-0.5">
                    <div className="flex justify-between items-center text-xs font-semibold">
                      <span className="text-slate-450 text-[11px] flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
                        Progreso General
                      </span>
                      <span className="font-black text-slate-900 font-mono">{proj.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${proj.hasBlocker ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${proj.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="bg-slate-50/50 px-6 py-3 border-t border-slate-100 flex justify-between items-center relative overflow-visible">
                  <button 
                    onClick={() => onDeleteProject(proj.id)}
                    className="text-slate-400 hover:text-red-600 transition-colors py-1.5 px-2 hover:bg-red-50 rounded-lg text-xs font-bold flex items-center gap-1"
                    title="Eliminar este proyecto de la cartera"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Eliminar</span>
                  </button>

                  <div className="flex items-center gap-2 relative">
                    <button 
                      onMouseEnter={() => setHoveredQuickPeek(proj.id)}
                      onMouseLeave={() => setHoveredQuickPeek(null)}
                      className="text-slate-500 hover:text-slate-800 py-1.5 px-2.5 bg-slate-200/50 hover:bg-slate-200/75 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all"
                    >
                      <span>🔍 Ver Hitos</span>
                    </button>

                    {hoveredQuickPeek === proj.id && (
                      <div className="absolute right-0 bottom-full mb-2 bg-slate-900 text-white rounded-2xl p-4 shadow-2xl z-50 animate-fade-in pointer-events-none text-xs border border-slate-800 space-y-3 w-72 sm:w-80 font-sans">
                        <div>
                          <span className="text-[9px] uppercase font-black text-slate-350 tracking-wider block">Vista Rápida de Hitos</span>
                          <span className="text-[11px] font-black text-slate-100 leading-tight block">{proj.name}</span>
                          <span className="text-[9px] font-bold text-slate-400">Progreso actual: {proj.progress}%</span>
                        </div>
                        
                        <div className="pt-2 border-t border-slate-800 space-y-1">
                          <span className="text-[9px] uppercase font-black text-emerald-400 tracking-wider block">Entregables & Tareas ({proj.milestones.length})</span>
                          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                            {proj.milestones.map((m, index) => (
                              <div key={m.id} className="flex justify-between items-center text-[10px] bg-slate-850 p-2 rounded border border-slate-800">
                                <span className={m.completed ? 'line-through text-slate-500 font-medium font-sans' : 'text-slate-200 font-bold font-sans'}>
                                  {index + 1}. {m.title}
                                </span>
                                <span className={m.completed ? 'text-emerald-400 text-[9px] font-extrabold font-mono bg-emerald-950/40 px-1 border border-transparent rounded' : 'text-amber-400 text-[9px] font-extrabold font-mono bg-amber-950/40 px-1 rounded'}>
                                  {m.completed ? 'COMPLETO ✓' : 'PENDIENTE'}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {proj.hasBlocker && (
                          <div className="bg-red-950/40 p-2 rounded border border-red-900/60 text-[10px] text-red-200">
                            <span className="font-extrabold uppercase tracking-widest text-[8px] text-red-400 block mb-0.5">⚠️ IMPEDIMENTO CRÍTICO</span>
                            "{proj.blockerDescription}"
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-[8px] font-black text-slate-500 uppercase tracking-wider">
                          <span>Áreas: {proj.areas.length} asignadas</span>
                          <span className="text-teal-400 font-extrabold">Gestionar para editar &rarr;</span>
                        </div>
                      </div>
                    )}

                    <button 
                      onClick={() => onSelectProject(proj.id)}
                      className="text-blue-600 hover:text-blue-800 py-1.5 px-3 hover:bg-slate-100 rounded-lg font-black text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Gestionar</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-xl mx-auto space-y-4 shadow-sm animate-fade-in">
          <div className="p-4 bg-slate-50 rounded-full inline-block text-slate-400 border border-slate-100">
            <BookmarkPlus className="w-10 h-10 text-slate-500" />
          </div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">No se encontraron proyectos</h3>
          <p className="text-xs text-slate-500 font-medium">
            Intenta cambiar los términos de búsqueda o filtros seleccionados en la barra de herramientas avanzada para visualizar otros resultados.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedStage('ALL');
              setSelectedArea('ALL');
              setSelectedStatus('ALL');
            }}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-all shadow-sm"
          >
            Limpiar filtros
          </button>
        </div>
      )}
    </div>
  );
}
