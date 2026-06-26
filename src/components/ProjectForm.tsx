import React, { useState } from 'react';
import { Project, ProjectStage, STAGE_DETAILS, INVOLVED_AREAS, Milestone, getAreaStyle, PREDEFINED_PEOPLE_BY_AREA } from '../types';
import { 
  X, 
  Save, 
  HelpCircle, 
  FolderGit, 
  DollarSign, 
  User, 
  Calendar,
  Building,
  FilePlus,
  Compass,
  ListPlus,
  XCircle,
  AlertCircle
} from 'lucide-react';

interface ProjectFormProps {
  onAddProject: (newProject: Project) => void;
  onCancel: () => void;
  involvedAreas?: string[];
  stageDetails?: Record<string, { label: string; color: string; bg: string; border: string; text: string }>;
  peopleByArea?: Record<string, string[]>;
}

export default function ProjectForm({ 
  onAddProject, 
  onCancel,
  involvedAreas = INVOLVED_AREAS,
  stageDetails = STAGE_DETAILS as any,
  peopleByArea = PREDEFINED_PEOPLE_BY_AREA
}: ProjectFormProps) {
  // Form variables
  const [formData, setFormData] = useState({
    name: '',
    entity: '',
    description: '',
    leader: '',
    startDate: '2026-06-19',
    dueDate: '2026-07-15',
    budget: '',
    stage: Object.keys(stageDetails)[0] || 'POR_PRESENTAR',
    notes: ''
  });

  // Selected areas
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);
  const [areaAssignments, setAreaAssignments] = useState<Record<string, string[]>>({});
  const [personInputs, setPersonInputs] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState('');
  
  // Custom initial startup milestone
  const [initialMilestoneTitle, setInitialMilestoneTitle] = useState('');
  const [initialMilestoneDue, setInitialMilestoneDue] = useState('');
  const [initialMilestoneArea, setInitialMilestoneArea] = useState('');
  const [initialMilestonePerson, setInitialMilestonePerson] = useState('');

  const handleAreaToggle = (area: string) => {
    if (selectedAreas.includes(area)) {
      setSelectedAreas(selectedAreas.filter(a => a !== area));
    } else {
      setSelectedAreas([...selectedAreas, area]);
      if (!areaAssignments[area]) {
        setAreaAssignments(prev => ({ ...prev, [area]: [] }));
      }
    }
  };

  const handleAddPerson = (area: string) => {
    const name = (personInputs[area] || '').trim();
    if (!name) return;
    
    const current = areaAssignments[area] || [];
    if (current.includes(name)) {
      return;
    }
    
    setAreaAssignments(prev => ({
      ...prev,
      [area]: [...current, name]
    }));
    
    setPersonInputs(prev => ({
      ...prev,
      [area]: ''
    }));
  };

  const handleRemovePerson = (area: string, personToRemove: string) => {
    setAreaAssignments(prev => ({
      ...prev,
      [area]: (prev[area] || []).filter(p => p !== personToRemove)
    }));
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Custom non-blocking inline validations
    if (!formData.name.trim()) {
      setErrorMsg('Por favor ingresa un nombre comercial para el proyecto.');
      return;
    }
    if (!formData.entity.trim()) {
      setErrorMsg('Por favor ingresa el nombre de la Entidad Cliente.');
      return;
    }
    if (!formData.leader.trim()) {
      setErrorMsg('Por favor ingresa el nombre del líder técnico encargado.');
      return;
    }
    if (selectedAreas.length === 0) {
      setErrorMsg('Debe seleccionar al menos un área involucrada para el proyecto.');
      return;
    }

    setErrorMsg('');
    const parsedBudget = parseFloat(formData.budget) || 0;

    // Build Milestones list
    const initialMilestones: Milestone[] = [
      {
        id: `m-init-${Date.now()}`,
        title: initialMilestoneTitle.trim() || 'Sustentar propuesta y firmar acta de inicio',
        dueDate: initialMilestoneDue || formData.dueDate,
        completed: false,
        area: initialMilestoneArea || undefined,
        assignedPerson: initialMilestonePerson || undefined
      }
    ];

    const createdProject: Project = {
      id: `proj-${Date.now()}`,
      name: formData.name.trim(),
      entity: formData.entity.trim(),
      description: formData.description.trim(),
      leader: formData.leader.trim(),
      startDate: formData.startDate,
      dueDate: formData.dueDate,
      budget: parsedBudget,
      stage: formData.stage,
      areas: selectedAreas,
      areaAssignments: areaAssignments,
      progress: 0,
      hasBlocker: false,
      milestones: initialMilestones,
      issues: [],
      notes: formData.notes.trim()
    };

    onAddProject(createdProject);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-fade-in max-w-4xl mx-auto font-sans">
      {/* Form Header */}
      <div className="bg-slate-50 px-6 py-5 flex justify-between items-center border-b border-slate-200">
        <div className="space-y-0.5">
          <h2 className="text-base font-black text-slate-900 tracking-tight uppercase">Registrar Nuevo Proyecto</h2>
          <p className="text-xs text-slate-500 font-medium">Asigne consultores, montos de facturación, áreas de trabajo y el cronograma de entregas.</p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="p-2 rounded-xl bg-white hover:bg-slate-150 text-slate-500 font-bold text-xs transition border border-slate-200 hover:border-slate-300 inline-flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
        >
          <X className="w-4 h-4" />
          <span>Cancelar</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 text-xs">
        
        {/* Section 1: Project Metadata */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 text-sm font-bold">
            <FolderGit className="w-4 h-4 text-blue-600" />
            <h3 className="tracking-tight font-black uppercase text-slate-700 text-xs">1. Datos Generales de la Consultoría</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Nombre del Proyecto *</label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleFormChange}
                placeholder="Ej. Auditoría de Cuentas Médicas Hospital de Neiva"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Entidad Cliente / Prestadora *</label>
              <div className="relative">
                <Building className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="entity"
                  required
                  value={formData.entity}
                  onChange={handleFormChange}
                  placeholder="Ej. EPS Convenio, Clínicas del Café, Minsalud..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400 font-semibold"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Descripción del Alcance contractual *</label>
              <textarea
                name="description"
                required
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Sintetice brevemente los entregables de consultoría, reglamentos normativos a revisar y metas del proyecto."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder-slate-400 font-medium"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Section 2: Financial and Allocation */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 text-sm font-bold">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <h3 className="tracking-tight font-black uppercase text-slate-700 text-xs">2. Asignación Financiera y Cronograma</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Monto Presupuesto (COP) *</label>
              <input
                type="number"
                name="budget"
                required
                value={formData.budget}
                onChange={handleFormChange}
                placeholder="Presupuesto en pesos"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400 font-mono font-black"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Líder Técnico Encargado *</label>
              <div className="relative">
                <User className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="leader"
                  required
                  value={formData.leader}
                  onChange={handleFormChange}
                  placeholder="Director de proyecto..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all placeholder-slate-400 font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha de Inicio *</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-semibold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-wider">Fecha Límite Evaluada *</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  name="dueDate"
                  required
                  value={formData.dueDate}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Project State & Teams */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Column A: Areas selection */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 text-sm font-bold">
              <Compass className="w-4 h-4 text-blue-600" />
              <h3 className="tracking-tight font-black uppercase text-slate-700 text-xs">3. Áreas que Intervienen *</h3>
            </div>
            
            <p className="text-[11px] text-slate-500 font-medium">Selecciona los departamentos internos que operarán activamente este proyecto:</p>
            
            <div className="space-y-1.5 max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {involvedAreas.map(area => (
                <label 
                  key={area} 
                  className="flex items-center gap-2.5 py-1.5 px-2 rounded-lg hover:bg-slate-100/75 cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={selectedAreas.includes(area)}
                    onChange={() => handleAreaToggle(area)}
                    className="rounded accent-blue-600 cursor-pointer"
                  />
                  <span className="text-slate-700 font-bold">{area}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Column B: Primary Stage and Initial delivery */}
          <div className="space-y-4">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 text-sm font-bold">
              <ListPlus className="w-4 h-4 text-blue-600" />
              <h3 className="tracking-tight font-black uppercase text-slate-700 text-xs">4. Etapa y Arranque Operativo</h3>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5 tracking-wider">Etapa Inicial del Proyecto</label>
                <select
                  name="stage"
                  value={formData.stage}
                  onChange={handleFormChange}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white font-bold transition-all cursor-pointer"
                >
                  {Object.keys(stageDetails).map(sk => (
                    <option key={sk} value={sk}>
                      {stageDetails[sk].label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-450 uppercase mb-1.5 tracking-wider">Primer Hito / Entregable Clave</label>
                <input
                  type="text"
                  placeholder="Ej. Firmar acuerdo legal confidencial"
                  value={initialMilestoneTitle}
                  onChange={e => setInitialMilestoneTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all placeholder-slate-400 mb-2 font-semibold"
                />
                
                <label className="block text-[9px] font-black text-slate-450 uppercase mb-1.5 tracking-wider">Límite para este primer hito</label>
                <input
                  type="date"
                  value={initialMilestoneDue}
                  onChange={e => setInitialMilestoneDue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-all font-semibold"
                />

                <label className="block text-[9px] font-black text-slate-450 uppercase mb-1.5 tracking-wider mt-2">Área para este primer hito</label>
                <select
                  value={initialMilestoneArea}
                  onChange={e => {
                    setInitialMilestoneArea(e.target.value);
                    setInitialMilestonePerson('');
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 transition-all font-bold"
                >
                  <option value="">-- Sin área específica / General --</option>
                  {selectedAreas.map(area => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>

                {initialMilestoneArea && (
                  <div className="animate-fade-in">
                    <label className="block text-[9px] font-black text-slate-450 uppercase mb-1.5 tracking-wider mt-2">Consultor responsable para este primer hito</label>
                    <select
                      value={initialMilestonePerson}
                      onChange={e => setInitialMilestonePerson(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-850 focus:outline-none focus:border-blue-500 transition-all font-bold"
                    >
                      <option value="">-- Sin consultor específico asignado --</option>
                      {(peopleByArea[initialMilestoneArea] || []).map(person => (
                        <option key={person} value={person}>
                          {person}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3.5: Staffing assignments per area */}
        {selectedAreas.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-100 animate-fade-in">
            <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 text-slate-800 text-sm font-bold">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="tracking-tight font-black uppercase text-slate-700 text-xs">3.5 Asignación de Personal por Área</h3>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">
              Escribe y agrega los nombres de los consultores o responsables dedicados a cada una de las áreas seleccionadas:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedAreas.map(area => {
                const persons = areaAssignments[area] || [];
                const style = getAreaStyle(area);
                return (
                  <div key={area} className={`${style.bg} ${style.border} border rounded-xl p-3.5 space-y-2.5 flex flex-col justify-between shadow-xs transition-all`}>
                    <div>
                      <span className={`text-[10px] uppercase font-black ${style.text} tracking-wider block mb-1.5 leading-snug flex items-center gap-1.5`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${style.circleBg}`} />
                        {area}
                      </span>
                      {/* Person tags list */}
                      <div className="flex flex-wrap gap-1.5 min-h-[32px] items-center">
                        {persons.length === 0 ? (
                          <span className="text-[10px] text-slate-450 font-medium italic">Sin personal asignado</span>
                        ) : (
                          persons.map(p => (
                            <span 
                              key={p} 
                              className="inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-700 rounded-md px-2 py-0.5 text-[10px] font-bold shadow-xs hover:border-red-500 transition-colors group cursor-pointer"
                              onClick={() => handleRemovePerson(area, p)}
                              title="Remover asignación"
                            >
                              {p}
                              <X className="w-2.5 h-2.5 text-slate-400 group-hover:text-red-500 transition-colors" />
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                    {/* Select to quick add predefined person */}
                    <div className="flex gap-1.5 pt-2 border-t border-slate-200/50">
                      <select
                        value={personInputs[area] || ''}
                        onChange={e => setPersonInputs(prev => ({ ...prev, [area]: e.target.value }))}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] text-slate-850 focus:outline-none focus:border-blue-500 font-bold transition-all"
                      >
                        <option value="">-- Seleccionar consultor --</option>
                        {(peopleByArea[area] || []).map(p => {
                          const isAssigned = (areaAssignments[area] || []).includes(p);
                          return (
                            <option key={p} value={p} disabled={isAssigned}>
                              {p} {isAssigned ? '(Asignado)' : ''}
                            </option>
                          );
                        })}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAddPerson(area)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-[11px] font-bold rounded-lg transition shrink-0"
                      >
                        Asignar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 4: Initial private notes */}
        <div className="space-y-2 pt-2">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Observaciones y Comentarios Iniciales</label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleFormChange}
            rows={2}
            placeholder="Registre de manera opcional consideraciones tarifarias especiales o metas de cofinanciación..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 focus:bg-white transition-all resize-none placeholder-slate-400 font-medium"
          ></textarea>
        </div>

        {/* Inline Custom Error alert */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-150 text-red-800 rounded-xl flex items-center gap-2 animate-fade-in text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-red-650 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-all cursor-pointer active:scale-95"
          >
            Cancelar
          </button>

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 px-6 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Guardar Proyecto</span>
          </button>
        </div>
      </form>
    </div>
  );
}
