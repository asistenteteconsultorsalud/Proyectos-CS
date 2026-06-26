// Types for the Consultorsalud Project Management Application

export enum ProjectStage {
  POR_PRESENTAR = 'POR_PRESENTAR',
  EVALUACION = 'EVALUACION',
  POR_INICIAR = 'POR_INICIAR',
  EJECUCION = 'EJECUCION',
  PAUSA = 'PAUSA',
  COMPLETADO = 'COMPLETADO',
  CANCELADO = 'CANCELADO',
}

export interface Milestone {
  id: string;
  title: string;
  dueDate: string; // YYYY-MM-DD
  completed: boolean;
  area?: string; // Opt organizational area
  assignedPerson?: string; // Opt assigned person from that area
}

export interface ProjectIssue {
  id: string;
  date: string;
  description: string;
  resolved: boolean;
}

export interface Project {
  id: string;
  name: string;
  entity: string; // Client / Insurer / IPS / Govt
  description: string;
  leader: string;
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD (End date of current stage or overall project)
  budget: number; // In COP
  stage: ProjectStage;
  areas: string[]; // List of areas involved
  progress: number; // 0 - 100
  hasBlocker: boolean;
  blockerDescription?: string;
  milestones: Milestone[];
  issues: ProjectIssue[];
  areaAssignments?: Record<string, string[]>;
  notes?: string;
}

export interface ProjectFollowUp {
  id: string;
  projectId: string;
  projectName: string;
  date: string; // YYYY-MM-DD
  type: 'COMITE_SEMANAL' | 'REUNION_CLIENTE' | 'CONTROL_PRESUPUESTO' | 'AUDITORIA_INTERNA';
  topics: string;
  agreements: string;
  nextCheckDate: string;
  status: 'PENDIENTE' | 'ARCHIVADO' | 'COMPLETADO';
}

export interface SystemNotification {
  id: string;
  projectId: string;
  projectName: string;
  type: 'OVERDUE' | 'BLOCKER' | 'MILESTONE_URGENT';
  message: string;
  date: string;
  read: boolean;
}

export const INVOLVED_AREAS = [
  'Consultoría Técnica y Auditoría',
  'TI y Salud Digital',
  'Jurídico y Regulación',
  'Financiera y Tarifas',
  'Comunicaciones y Eventos',
  'Formación y Capacitación',
  'Comercial y Mercadeo',
];

export const PREDEFINED_PEOPLE_BY_AREA: Record<string, string[]> = {
  'Consultoría Técnica y Auditoría': [
    'Dr. Jaime Delgado',
    'Dra. Carolina Méndez',
    'Ing. Roberto Solano',
    'Dra. Patricia Restrepo'
  ],
  'TI y Salud Digital': [
    'Ing. Sandra Alzate',
    'Ing. Carlos Pérez',
    'Ing. Alejandro Torres',
    'Ing. Natalia Castro'
  ],
  'Jurídico y Regulación': [
    'Abg. Felipe Morales',
    'Abg. Diana Quintero',
    'Abg. Sergio Hoyos'
  ],
  'Financiera y Tarifas': [
    'Eco. Martha Lucía Gómez',
    'Cont. Alberto Ortiz',
    'Eco. Javier Cardona'
  ],
  'Comunicaciones y Eventos': [
    'Com. Sofía Bermúdez',
    'Dis. Daniel Giraldo',
    'Com. Juliana Franco'
  ],
  'Formación y Capacitación': [
    'Prof. Jorge Eduardo Ríos',
    'Dra. Claudia Patricia Marín',
    'Lic. Rodrigo Henao'
  ],
  'Comercial y Mercadeo': [
    'Esp. Camila Restrepo',
    'Merc. Juan Camilo Zuluaga',
    'Esp. Natalia Bedoya'
  ],
};

export interface AreaStyle {
  bg: string;
  text: string;
  border: string;
  circleBg: string;
}

export const AREA_COLOR_PRESETS: Record<string, AreaStyle> = {
  blue: { bg: 'bg-blue-50/70', text: 'text-blue-700 hover:text-blue-900', border: 'border-blue-200/70', circleBg: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-50/70', text: 'text-indigo-700 hover:text-indigo-900', border: 'border-indigo-200/70', circleBg: 'bg-indigo-500' },
  teal: { bg: 'bg-teal-50/70', text: 'text-teal-700 hover:text-teal-900', border: 'border-teal-200/70', circleBg: 'bg-teal-500' },
  amber: { bg: 'bg-amber-50/70', text: 'text-amber-800 hover:text-amber-900', border: 'border-amber-200/70', circleBg: 'bg-amber-500' },
  emerald: { bg: 'bg-emerald-50/70', text: 'text-emerald-700 hover:text-emerald-950', border: 'border-emerald-200/70', circleBg: 'bg-emerald-500' },
  purple: { bg: 'bg-purple-50/70', text: 'text-purple-700 hover:text-purple-900', border: 'border-purple-200/70', circleBg: 'bg-purple-500' },
  rose: { bg: 'bg-rose-50/70', text: 'text-rose-700 hover:text-rose-900', border: 'border-rose-200/70', circleBg: 'bg-rose-500' },
  sky: { bg: 'bg-sky-50/70', text: 'text-sky-700 hover:text-sky-900', border: 'border-sky-200/70', circleBg: 'bg-sky-500' },
  orange: { bg: 'bg-orange-50/70', text: 'text-orange-700 hover:text-orange-900', border: 'border-orange-200/70', circleBg: 'bg-orange-500' },
  fuchsia: { bg: 'bg-fuchsia-50/70', text: 'text-fuchsia-700 hover:text-fuchsia-900', border: 'border-fuchsia-200/70', circleBg: 'bg-fuchsia-500' },
  violet: { bg: 'bg-violet-50/70', text: 'text-violet-700 hover:text-violet-900', border: 'border-violet-200/70', circleBg: 'bg-violet-500' },
  cyan: { bg: 'bg-cyan-50/70', text: 'text-cyan-700 hover:text-cyan-900', border: 'border-cyan-200/70', circleBg: 'bg-cyan-500' },
  slate: { bg: 'bg-slate-50/70', text: 'text-slate-700 hover:text-slate-950', border: 'border-slate-200/70', circleBg: 'bg-slate-500' },
};

export function getDefaultPresetKey(areaName: string): string {
  const name = (areaName || '').trim();
  // Standard mappings based on name match
  if (name.includes('Técnica') || name.includes('Auditoría') || name.includes('Tecnica')) {
    return 'indigo';
  }
  if (name.includes('TI') || name.includes('Digital') || name.includes('Salud')) {
    return 'teal';
  }
  if (name.includes('Jurídico') || name.includes('Regulación') || name.includes('Juridico') || name.includes('Regulacion')) {
    return 'amber';
  }
  if (name.includes('Financiera') || name.includes('Tarifas') || name.includes('Finanzas')) {
    return 'emerald';
  }
  if (name.includes('Comunicaciones') || name.includes('Eventos') || name.includes('Comu')) {
    return 'purple';
  }
  if (name.includes('Capacitación') || name.includes('Formación') || name.includes('Capacitacion') || name.includes('Formacion')) {
    return 'rose';
  }
  if (name.includes('Comercial') || name.includes('Mercadeo') || name.includes('Ventas')) {
    return 'sky';
  }

  // Fallback hash generator using consistent presets
  const presetKeys = Object.keys(AREA_COLOR_PRESETS);
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % presetKeys.length;
  return presetKeys[index];
}

export function getAreaStyle(areaName: string): AreaStyle {
  const name = (areaName || '').trim();

  // Try reading custom user area color assignment from localStorage
  try {
    const savedColorsJson = typeof window !== 'undefined' ? localStorage.getItem('consultorsalud_area_colors') : null;
    if (savedColorsJson) {
      const savedColors = JSON.parse(savedColorsJson);
      const presetKey = savedColors[name];
      if (presetKey && AREA_COLOR_PRESETS[presetKey]) {
        return AREA_COLOR_PRESETS[presetKey];
      }
    }
  } catch (e) {
    console.error('Error reading consultorsalud_area_colors', e);
  }

  const defaultKey = getDefaultPresetKey(name);
  return AREA_COLOR_PRESETS[defaultKey] || AREA_COLOR_PRESETS.blue;
}

export const STAGE_DETAILS: Record<
  ProjectStage,
  { label: string; color: string; bg: string; border: string; text: string }
> = {
  [ProjectStage.POR_PRESENTAR]: {
    label: 'Por Presentar',
    color: 'bg-blue-500',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
  },
  [ProjectStage.EVALUACION]: {
    label: 'En Evaluación',
    color: 'bg-purple-500',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
  },
  [ProjectStage.POR_INICIAR]: {
    label: 'Listo para Inicio',
    color: 'bg-amber-500',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
  },
  [ProjectStage.EJECUCION]: {
    label: 'En Ejecución',
    color: 'bg-emerald-500',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    text: 'text-emerald-700',
  },
  [ProjectStage.PAUSA]: {
    label: 'En Pausa / Bloqueado',
    color: 'bg-rose-500',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    text: 'text-rose-700',
  },
  [ProjectStage.COMPLETADO]: {
    label: 'Finalizado',
    color: 'bg-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    text: 'text-slate-700',
  },
  [ProjectStage.CANCELADO]: {
    label: 'Cancelado',
    color: 'bg-slate-400',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    text: 'text-slate-500',
  },
};
