import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Project, ProjectStage, SystemNotification, ProjectFollowUp, STAGE_DETAILS, PREDEFINED_PEOPLE_BY_AREA } from './types';
import { INITIAL_PROJECTS, INITIAL_FOLLOWUPS } from './mockData';
import Dashboard from './components/Dashboard';
import ProjectList from './components/ProjectList';
import ProjectDetail from './components/ProjectDetail';
import ProjectForm from './components/ProjectForm';
import TrackingPanel from './components/TrackingPanel';
import NotificationPanel from './components/NotificationPanel';
import SettingsPanel from './components/SettingsPanel';
import { 
  Briefcase, 
  Layers, 
  BarChart4, 
  Bell, 
  PlusCircle, 
  FolderGit2, 
  HelpCircle,
  Menu,
  X,
  Compass,
  AlertCircle,
  ClipboardList,
  CheckCircle,
  Info,
  AlertTriangle,
  Sliders,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw
} from 'lucide-react';
import { generatePDFReport } from './utils/pdfGenerator';

export default function App() {
  // --- Persistent State Configuration ---
  const [isLocalMode, setIsLocalMode] = useState<boolean>(() => {
    // Default to false so the application always tries to connect securely to the database.
    const saved = localStorage.getItem('gestor_is_local_mode');
    return saved === 'true';
  });

  const [customDbUrl, setCustomDbUrl] = useState<string>(() => {
    // No hardcoded database credentials. This is more secure and prevents information leaks.
    return localStorage.getItem('gestor_database_url') || '';
  });

  const apiFetch = (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    const dbUrl = localStorage.getItem('gestor_database_url') || '';
    if (dbUrl) {
      headers.set('x-database-url', dbUrl);
    }
    return fetch(url, { ...options, headers });
  };

  const preventSyncRef = useRef(false);
  const [isSilentFetching, setIsSilentFetching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'dashboard' | 'projects' | 'new-project' | 'tracking' | 'settings'>('dashboard');
  const [dbError, setDbError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_projects');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    return INITIAL_PROJECTS;
  });

  const [followUps, setFollowUps] = useState<ProjectFollowUp[]>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_followups');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    return INITIAL_FOLLOWUPS;
  });

  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_read_notif_ids');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    return [];
  });

  // Flow and Notification Feedbacks states
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'info' | 'error' | 'warning' }[]>([]);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // --- Dynamic customizable areas and stages ---
  const [involvedAreas, setInvolvedAreas] = useState<string[]>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_involved_areas');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    return [
      'Consultoría Técnica y Auditoría',
      'TI y Salud Digital',
      'Jurídico y Regulación',
      'Financiera y Tarifas',
      'Comunicaciones y Eventos',
      'Formación y Capacitación',
      'Comercial y Mercadeo',
    ];
  });

  const [peopleByArea, setPeopleByArea] = useState<Record<string, string[]>>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_people_by_area');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    return PREDEFINED_PEOPLE_BY_AREA;
  });

  const [teamRoster, setTeamRoster] = useState<string[]>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_team_roster');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    const allNames = new Set<string>();
    Object.values(PREDEFINED_PEOPLE_BY_AREA).forEach(names => {
      names.forEach(name => allNames.add(name));
    });
    return Array.from(allNames);
  });

  const [areaColors, setAreaColors] = useState<Record<string, string>>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_area_colors');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    return {};
  });

  const [stageDetails, setStageDetails] = useState<Record<string, { label: string; color: string; bg: string; border: string; text: string; definition: string; keyDeliverables: string[]; typicalDuration: string }>>(() => {
    if (localStorage.getItem('gestor_is_local_mode') !== 'false') {
      const local = localStorage.getItem('gestor_stage_details');
      if (local) {
        try { return JSON.parse(local); } catch (e) {}
      }
    }
    return {
      'POR_PRESENTAR': {
        label: 'Por Presentar',
        color: 'bg-blue-500',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        definition: 'Formulación técnica, estructuración de la propuesta comercial de consultoría y estructuración de tarifas iniciales.',
        keyDeliverables: [
          'Estudio previo y diagnóstico de necesidades del cliente',
          'Estructura de costos, honorarios y modelo preliminar',
          'Propuesta técnica y económica formalizada'
        ],
        typicalDuration: '1 - 2 semanas'
      },
      'EVALUACION': {
        label: 'En Evaluación',
        color: 'bg-purple-500',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700',
        definition: 'Evaluación de convenios por comités de contratación, ajuste de copagos, reglamentos de firmas y mesas de concertación.',
        keyDeliverables: [
          'Mesas de concertación técnica',
          'Estudio de viabilidad jurídica y regulatoria del sector salud',
          'Aprobación de la junta directiva o comités delegados'
        ],
        typicalDuration: '2 - 3 semanas'
      },
      'POR_INICIAR': {
        label: 'Listo para Inicio',
        color: 'bg-amber-500',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        text: 'text-amber-700',
        definition: 'Suscripción de actas de inicio, legalización de pólizas de cumplimiento, entrega de anticipos y asignación de cronograma.',
        keyDeliverables: [
          'Firma de contrato judicial o acta administrativa de inicio',
          'Suscripción de garantías o pólizas de cumplimiento',
          'Asignación formal de la terna de consultores expertos'
        ],
        typicalDuration: '1 semana'
      },
      'EJECUCION': {
        label: 'En Ejecución',
        color: 'bg-emerald-500',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: 'text-emerald-700',
        definition: 'Fase central operativa de auditoría estructural, desarrollo de software, capacitaciones presenciales y mesas operativas.',
        keyDeliverables: [
          'Auditorías técnico-médicas recurrentes',
          'Capacitaciones y talleres presenciales/virtuales con firmas de asistencia',
          'Soportes de facturación de hitos intermedios'
        ],
        typicalDuration: '1 - 6 meses'
      },
      'PAUSA': {
        label: 'En Pausa / Bloqueado',
        color: 'bg-rose-500',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        text: 'text-rose-700',
        definition: 'Flujo detenido temporalmente por inconvenientes críticos externos, demoras en comités administrativos del cliente, o suspensiones pactadas.',
        keyDeliverables: [
          'Acta de suspensión temporal con firmas justificantes',
          'Plan de mitigación o desbloqueo del obstáculo operacional',
          'Revisiones extraordinarias semanales'
        ],
        typicalDuration: 'Frecuencia variable'
      },
      'COMPLETADO': {
        label: 'Finalizado',
        color: 'bg-slate-600',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        text: 'text-slate-700',
        definition: 'Cierre formal de consultoría. Radicación final de cuentas, transferencias de conocimiento y actas de liquidación.',
        keyDeliverables: [
          'Informe final ejecutivo encuadernado y digitalizado',
          'Acta de liquidación del contrato a mutuo acuerdo',
          'Encuesta de satisfacción de servicios del cliente'
        ],
        typicalDuration: 'Cierre inmediato'
      },
      'CANCELADO': {
        label: 'Cancelado',
        color: 'bg-slate-400',
        bg: 'bg-slate-50',
        border: 'border-slate-200',
        text: 'text-slate-500',
        definition: 'Terminación anticipada del proyecto por decisión mutua, cambios normativos de sanidad, o insolvencia de la entidad contratista.',
        keyDeliverables: [
          'Acta de rescisión anticipada detallada',
          'Relación de pagos proporcionales consolidados hasta la fecha',
          'Devolución de bases de datos seguras bajo confidencialidad'
        ],
        typicalDuration: 'Terminado'
      }
    };
  });

  // Fetch initial data or silent updates from DB
  const loadData = async (silent = false) => {
    if (isLocalMode) {
      if (!silent) setLoading(false);
      setIsSilentFetching(false);
      return;
    }
    try {
      if (silent) {
        setIsSilentFetching(true);
      } else {
        setLoading(true);
      }
      setDbError(null);
      const response = await apiFetch('/api/data');
      if (!response.ok) {
        // Try parsing error directly from /api/data body first
        try {
          const errData = await response.json();
          const specificError = errData.details || errData.error || errData.message;
          if (specificError) {
            setDbError(specificError);
            if (!silent) setLoading(false);
            setIsSilentFetching(false);
            return;
          }
        } catch (e) {}

        // Fallback to db-status if parsing /api/data fails
        try {
          const statusRes = await apiFetch('/api/db-status');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.error) {
              setDbError(statusData.error);
              if (!silent) setLoading(false);
              setIsSilentFetching(false);
              return;
            }
          }
        } catch (e) {}
        throw new Error('No se pudo establecer conexión con el servidor de bases de datos.');
      }
      const data = await response.json();
      
      preventSyncRef.current = true;
      
      if (data.projects) setProjects(data.projects);
      if (data.followUps) setFollowUps(data.followUps);
      
      const settings = data.settings || {};
      if (settings.involvedAreas) setInvolvedAreas(settings.involvedAreas);
      if (settings.peopleByArea) setPeopleByArea(settings.peopleByArea);
      if (settings.teamRoster) setTeamRoster(settings.teamRoster);
      if (settings.areaColors) setAreaColors(settings.areaColors);
      if (settings.stageDetails) setStageDetails(settings.stageDetails);
      if (settings.readNotifIds) setReadNotifIds(settings.readNotifIds);
      
      if (silent) {
        setIsSilentFetching(false);
      } else {
        setLoading(false);
      }
      
      // Release sync prevention after state changes have been batched and processed
      setTimeout(() => {
        preventSyncRef.current = false;
      }, 500);
    } catch (err: any) {
      console.error("Error loading database data:", err);
      if (!silent) {
        try {
          const statusRes = await apiFetch('/api/db-status');
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData.error) {
              setDbError(statusData.error);
              return;
            }
          }
        } catch (e) {}
        setDbError(err.message || String(err));
      } else {
        setIsSilentFetching(false);
      }
    }
  };

  // Fetch initial data on mount
  useEffect(() => {
    loadData();
  }, []);

  // Synchronize state when switching views / modules / windows to ensure real-time fresh data
  useEffect(() => {
    if (currentView) {
      loadData(true);
    }
  }, [currentView]);

  const handleBypassDb = () => {
    setIsLocalMode(true);
    localStorage.setItem('gestor_is_local_mode', 'true');
    // Guardar el estado actual en localStorage para no perder nada al iniciar modo local
    localStorage.setItem('gestor_projects', JSON.stringify(projects));
    localStorage.setItem('gestor_followups', JSON.stringify(followUps));
    localStorage.setItem('gestor_involved_areas', JSON.stringify(involvedAreas));
    localStorage.setItem('gestor_people_by_area', JSON.stringify(peopleByArea));
    localStorage.setItem('gestor_team_roster', JSON.stringify(teamRoster));
    localStorage.setItem('gestor_area_colors', JSON.stringify(areaColors));
    localStorage.setItem('gestor_stage_details', JSON.stringify(stageDetails));
    localStorage.setItem('gestor_read_notif_ids', JSON.stringify(readNotifIds));

    setDbError(null);
    setLoading(false);
    showToast("Trabajando en modo temporal de respaldo. Sus cambios se mantendrán de forma local en el navegador.", "warning");
  };

  const handleSwitchToDbMode = () => {
    setIsLocalMode(false);
    localStorage.setItem('gestor_is_local_mode', 'false');
    window.location.reload();
  };

  const handleRetryDb = () => {
    setLoading(true);
    setDbError(null);
    window.location.reload();
  };

  // Helper to save setting to DB
  const saveSettingToDb = (key: string, value: any) => {
    if (preventSyncRef.current) return;
    if (isLocalMode) {
      // In local mode, save directly to localStorage instead of fetch
      if (key === 'involvedAreas') localStorage.setItem('gestor_involved_areas', JSON.stringify(value));
      else if (key === 'peopleByArea') localStorage.setItem('gestor_people_by_area', JSON.stringify(value));
      else if (key === 'teamRoster') localStorage.setItem('gestor_team_roster', JSON.stringify(value));
      else if (key === 'areaColors') localStorage.setItem('gestor_area_colors', JSON.stringify(value));
      else if (key === 'stageDetails') localStorage.setItem('gestor_stage_details', JSON.stringify(value));
      else if (key === 'readNotifIds') localStorage.setItem('gestor_read_notif_ids', JSON.stringify(value));
      return;
    }
    apiFetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value })
    }).catch(err => console.error(`Error saving setting ${key} to DB:`, err));
  };

  // Synchronize state changes to Neon Database or localStorage when loaded
  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    if (isLocalMode) {
      localStorage.setItem('gestor_projects', JSON.stringify(projects));
      return;
    }
    apiFetch('/api/projects/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projects)
    }).catch(err => console.error("Error syncing projects to DB:", err));
  }, [projects, loading, isLocalMode]);

  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    if (isLocalMode) {
      localStorage.setItem('gestor_followups', JSON.stringify(followUps));
      return;
    }
    apiFetch('/api/followups/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(followUps)
    }).catch(err => console.error("Error syncing followups to DB:", err));
  }, [followUps, loading, isLocalMode]);

  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    saveSettingToDb('involvedAreas', involvedAreas);
  }, [involvedAreas, loading, isLocalMode]);

  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    saveSettingToDb('peopleByArea', peopleByArea);
  }, [peopleByArea, loading, isLocalMode]);

  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    saveSettingToDb('teamRoster', teamRoster);
  }, [teamRoster, loading, isLocalMode]);

  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    saveSettingToDb('areaColors', areaColors);
  }, [areaColors, loading, isLocalMode]);

  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    saveSettingToDb('stageDetails', stageDetails);
  }, [stageDetails, loading, isLocalMode]);

  useEffect(() => {
    if (loading || preventSyncRef.current) return;
    saveSettingToDb('readNotifIds', readNotifIds);
  }, [readNotifIds, loading, isLocalMode]);

  // Action handlers for Areas
  const handleAddArea = (areaName: string, colorKey?: string) => {
    const trimmed = areaName.trim();
    if (!trimmed) return;
    if (involvedAreas.includes(trimmed)) {
      showToast('Esta área ya existe en el sistema.', 'warning');
      return;
    }
    setInvolvedAreas([...involvedAreas, trimmed]);
    setPeopleByArea(prev => ({
      ...prev,
      [trimmed]: []
    }));

    if (colorKey) {
      setAreaColors(prev => {
        const copy = { ...prev, [trimmed]: colorKey };
        return copy;
      });
    }

    showToast(`Área "${trimmed}" agregada con éxito.`, 'success');
  };

  const handleUpdateArea = (oldName: string, newName: string) => {
    const trimmedNew = newName.trim();
    if (!trimmedNew) return;
    if (trimmedNew === oldName) return;
    if (involvedAreas.includes(trimmedNew)) {
      showToast('Ya existe otra área con ese nombre.', 'warning');
      return;
    }
    setInvolvedAreas(involvedAreas.map(a => a === oldName ? trimmedNew : a));
    
    // Auto-update participating projects!
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.areas.includes(oldName)) {
        return {
          ...p,
          areas: p.areas.map(a => a === oldName ? trimmedNew : a)
        };
      }
      return p;
    }));

    setPeopleByArea(prev => {
      const copy = { ...prev };
      if (copy[oldName]) {
        copy[trimmedNew] = copy[oldName];
        delete copy[oldName];
      } else {
        copy[trimmedNew] = [];
      }
      return copy;
    });

    // Update color assignment name
    setAreaColors(prev => {
      const copy = { ...prev };
      if (copy[oldName]) {
        copy[trimmedNew] = copy[oldName];
        delete copy[oldName];
      }
      return copy;
    });

    showToast(`Área actualizada a "${trimmedNew}" en la configuración y en los proyectos.`, 'success');
  };

  const handleDeleteArea = (areaName: string) => {
    setInvolvedAreas(involvedAreas.filter(a => a !== areaName));
    
    // Auto-remove from projects
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.areas.includes(areaName)) {
        return {
          ...p,
          areas: p.areas.filter(a => a !== areaName)
        };
      }
      return p;
    }));

    setPeopleByArea(prev => {
      const copy = { ...prev };
      delete copy[areaName];
      return copy;
    });

    // Delete color assignment
    setAreaColors(prev => {
      const copy = { ...prev };
      delete copy[areaName];
      return copy;
    });

    showToast(`Área "${areaName}" eliminada de forma permanente.`, 'info');
  };

  const handleUpdateAreaColor = (areaName: string, colorKey: string) => {
    setAreaColors(prev => {
      const copy = { ...prev, [areaName]: colorKey };
      return copy;
    });
    showToast(`Color del área "${areaName}" personalizado con éxito.`, 'success');
  };

  // Action handlers for Stages
  const handleAddStage = (key: string, stageInfo: any) => {
    const trimmedKey = key.trim().toUpperCase().replace(/\s+/g, '_');
    if (!trimmedKey) return;
    if (stageDetails[trimmedKey]) {
      showToast('Este identificador de etapa ya existe.', 'warning');
      return;
    }
    setStageDetails({
      ...stageDetails,
      [trimmedKey]: stageInfo
    });
    showToast(`Etapa "${stageInfo.label}" añadida con éxito.`, 'success');
  };

  const handleUpdateStage = (key: string, stageInfo: any, previousKey?: string) => {
    if (!previousKey || previousKey === key) {
      setStageDetails({
        ...stageDetails,
        [key]: stageInfo
      });
      showToast(`Etapa "${stageInfo.label}" actualizada con éxito.`, 'success');
    } else {
      const newKey = key.trim().toUpperCase().replace(/\s+/g, '_');
      const copy = { ...stageDetails };
      delete copy[previousKey];
      copy[newKey] = stageInfo;
      setStageDetails(copy);

      // Auto update projects' stages!
      setProjects(prevProjects => prevProjects.map(p => {
        if (p.stage === previousKey) {
          return {
            ...p,
            stage: newKey as any
          };
        }
        return p;
      }));
      showToast(`Etapa actualizada y proyectos migrados de la clave antigua.`, 'success');
    }
  };

  const handleDeleteStage = (key: string) => {
    if (Object.keys(stageDetails).length <= 1) {
      showToast('Debe haber al menos una etapa en el sistema.', 'error');
      return;
    }
    
    const copy = { ...stageDetails };
    delete copy[key];
    setStageDetails(copy);

    const firstRemainingStage = Object.keys(copy)[0];
    setProjects(prevProjects => prevProjects.map(p => {
      if (p.stage === key) {
        return {
          ...p,
          stage: firstRemainingStage as any
        };
      }
      return p;
    }));
    showToast(`Etapa eliminada. Proyectos migrados de forma segura a: ${copy[firstRemainingStage]?.label || firstRemainingStage}`, 'info');
  };

  // Navigation and Layout views state
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('consultorsalud_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedStageFilter, setSelectedStageFilter] = useState<string>('ALL');
  const [selectedAreaFilter, setSelectedAreaFilter] = useState<string>('ALL');
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [criticalAlertModalOpen, setCriticalAlertModalOpen] = useState(false);

  // Trigger modal on load/mount if there are active blockers
  useEffect(() => {
    const blockedProjects = projects.filter(p => p.hasBlocker);
    if (blockedProjects.length > 0) {
      setCriticalAlertModalOpen(true);
    }
  }, [projects]);

  const handleExportPDF = () => {
    try {
      generatePDFReport({
        projects,
        followUps,
        involvedAreas,
        teamRoster,
        areaColors,
      });
      showToast('Informe ejecutivo PDF exportado con éxito.', 'success');
    } catch (error) {
      console.error('Error al exportar el pdf', error);
      showToast('Error al exportar el informe en PDF.', 'error');
    }
  };

  // Synchronize sidebar preference
  useEffect(() => {
    localStorage.setItem('consultorsalud_sidebar_collapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // --- Dynamic System Alert / Notification Generator ---
  // Calculates real-time issues, overdue dates based on simulation day: June 19, 2026.
  const today = new Date('2026-06-19');

  const generatedNotifications: SystemNotification[] = [];

  projects.forEach(proj => {
    const isCompleted = proj.stage === ProjectStage.COMPLETADO || proj.stage === ProjectStage.CANCELADO;
    const dueDate = new Date(proj.dueDate);

    // 1. Check if dates of current stage is exceeded
    if (!isCompleted && dueDate < today) {
      const remainingDays = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      generatedNotifications.push({
        id: `overdue-${proj.id}`,
        projectId: proj.id,
        projectName: proj.name,
        type: 'OVERDUE',
        message: `La etapa actual ha superado su plazo límite previsto (${proj.dueDate}) por ${remainingDays} días. Requiere revisión urgente por el líder técnico ${proj.leader}.`,
        date: '2026-06-19',
        read: readNotifIds.includes(`overdue-${proj.id}`)
      });
    }

    // 2. Check if there are active blockers or inconvenientes detaining execution
    if (proj.hasBlocker) {
      generatedNotifications.push({
        id: `blocker-${proj.id}`,
        projectId: proj.id,
        projectName: proj.name,
        type: 'BLOCKER',
        message: proj.blockerDescription 
          ? `Operación Bloqueada: "${proj.blockerDescription}"`
          : `Se ha declarado un inconveniente que imposibilita continuar el flujo planeado del proyecto.`,
        date: '2026-06-19',
        read: readNotifIds.includes(`blocker-${proj.id}`)
      });
    }

    // 3. Highlight near overdue milestones (within next 7 days) if project is active
    if (!isCompleted) {
      proj.milestones.forEach(m => {
        if (!m.completed) {
          const milestoneDue = new Date(m.dueDate);
          const timeDiff = milestoneDue.getTime() - today.getTime();
          const daysDiff = Math.ceil(timeDiff / (1000 * 30 * 60 * 60 * 24)); // scale difference safely in days
          
          if (daysDiff >= 0 && daysDiff <= 5) {
            generatedNotifications.push({
              id: `milestone-${m.id}`,
              projectId: proj.id,
              projectName: proj.name,
              type: 'MILESTONE_URGENT',
              message: `Hito próximo a vencer: "${m.title}" vence en ${daysDiff} días (${m.dueDate}). Por favor, cargue soportes.`,
              date: '2026-06-19',
              read: readNotifIds.includes(`milestone-${m.id}`)
            });
          }
        }
      });
    }
  });

  const unreadCount = generatedNotifications.filter(n => !n.read).length;

  // --- Handlers for app operations ---

  // Select project detail shortcut
  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setCurrentView('projects');
    setMobileMenuOpen(false);
  };

  // Redirect and pre-filter by specific Stage
  const handleSelectStage = (stage: string) => {
    setSelectedStageFilter(stage);
    setSelectedProjectId(null); // Clear any active detail view
    setCurrentView('projects');
    setMobileMenuOpen(false);
  };

  // Archive a new Committee meeting minutes
  const handleAddFollowUp = (newFollowUp: ProjectFollowUp) => {
    setFollowUps([newFollowUp, ...followUps]);
    showToast(`Acta de Comité (${newFollowUp.type.replace('_', ' ')}) registrada correctamente.`, 'success');
  };

  // Toggle completion of a tracking agreement task
  const handleToggleFollowUpStatus = (followUpId: string) => {
    setFollowUps(followUps.map(f => {
      if (f.id === followUpId) {
        const nextStatus = f.status === 'COMPLETADO' ? 'PENDIENTE' : 'COMPLETADO';
        showToast(`Tarea de seguimiento marcada como ${nextStatus.toLowerCase()}.`, 'info');
        return {
          ...f,
          status: nextStatus
        };
      }
      return f;
    }));
  };

  // Add new project
  const handleAddProject = (newProject: Project) => {
    setProjects([newProject, ...projects]);
    setCurrentView('projects');
    showToast(`Proyecto "${newProject.name}" registrado con éxito en la cartera.`, 'success');
  };

  // Delete project
  const handleDeleteProject = (projectId: string) => {
    setProjectToDelete(projectId);
  };

  const handleConfirmDeleteProject = () => {
    if (!projectToDelete) return;
    const proj = projects.find(p => p.id === projectToDelete);
    if (!proj) return;

    setProjects(projects.filter(p => p.id !== projectToDelete));
    if (selectedProjectId === projectToDelete) {
      setSelectedProjectId(null);
    }
    showToast(`La consultoría de "${proj.entity}" ha sido eliminada permanentemente.`, 'error');
    setProjectToDelete(null);
  };

  // Update existing project properties (milestones toggle, notes, blockers, etc.)
  const handleUpdateProject = (updatedProj: Project) => {
    const original = projects.find(p => p.id === updatedProj.id);
    setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
    
    if (original) {
      if (original.stage !== updatedProj.stage) {
        showToast(`Proyecto de "${updatedProj.entity}" transicionado a: ${STAGE_DETAILS[updatedProj.stage]?.label || updatedProj.stage}`, 'success');
      } else if (original.hasBlocker !== updatedProj.hasBlocker) {
        if (updatedProj.hasBlocker) {
          showToast(`¡Alerta! Impedimento crítico declarado para "${updatedProj.entity}": ${updatedProj.blockerDescription}`, 'warning');
        } else {
          showToast(`¡Excelente! Impedimento resuelto en "${updatedProj.entity}". Se reanudan operaciones.`, 'success');
        }
      } else if (JSON.stringify(original.milestones) !== JSON.stringify(updatedProj.milestones)) {
        if (original.milestones.length < updatedProj.milestones.length) {
          showToast('Nuevo hito registrado en el cronograma.', 'success');
        } else if (original.milestones.length > updatedProj.milestones.length) {
          showToast('Hito eliminado del cronograma.', 'info');
        } else {
          showToast('Estado de hitos y porcentaje de avance actualizados.', 'success');
        }
      } else if (original.notes !== updatedProj.notes) {
        showToast('Borrador de notas de consultoría guardado.', 'success');
      } else if (original.progress !== updatedProj.progress) {
        showToast(`Avance ajustado manualmente al ${updatedProj.progress}%.`, 'info');
      }
    }
  };

  // Notifications read/dismiss
  const handleMarkAsRead = (notifId: string) => {
    if (!readNotifIds.includes(notifId)) {
      setReadNotifIds([...readNotifIds, notifId]);
    }
  };

  const handleMarkAllAsRead = () => {
    const unreadIds = generatedNotifications.filter(n => !n.read).map(n => n.id);
    setReadNotifIds([...readNotifIds, ...unreadIds]);
  };

  if (dbError) {
    const sanitizedDbError = typeof dbError === 'string' 
      ? dbError.replace(/(postgres|postgresql|mongodb|mysql):\/\/[^@\s]+@[^\s]+/gi, "$1://[CONFIDENTIAL]")
               .replace(/ep-[a-z0-9-]+-pooler\.[a-z0-9.-]+/gi, "[CONFIDENTIAL_HOST]")
               .replace(/neondb_owner/gi, "[CONFIDENTIAL_USER]")
      : String(dbError);

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans p-6">
        <div className="w-full max-w-xl bg-white rounded-xl shadow-md border border-red-100 overflow-hidden">
          <div className="bg-red-50 p-6 border-b border-red-100 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Error de conexión con el Servidor</h2>
              <p className="text-xs text-slate-500 mt-0.5">La conexión con el servidor no se pudo establecer correctamente.</p>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs text-slate-700 max-h-40 overflow-y-auto border border-slate-200">
              <p className="font-semibold text-slate-900 mb-1">Detalle del error:</p>
              {sanitizedDbError}
            </div>

            <div className="space-y-2 text-sm text-slate-600">
              <p className="font-semibold text-slate-700">¿Qué significa esto?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>El servidor de datos puede estar experimentando tráfico elevado o inactividad temporal.</li>
                <li>Por favor, reintente establecer la conexión.</li>
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={handleRetryDb}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4.89M9 11l3 3L22 4" />
                </svg>
                Reintentar Conexión
              </button>
              <button
                onClick={handleBypassDb}
                className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-all flex items-center justify-center cursor-pointer"
              >
                Ignorar y Continuar en Modo Temporal
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-600 animate-pulse">
            Cargando información del sistema...
          </p>
        </div>
      </div>
    );
  }

  const activeProjectDetailObj = selectedProjectId 
    ? projects.find(p => p.id === selectedProjectId) 
    : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col md:flex-row relative">
      
      {/* 1. SIDEBAR Navigation Center (Desktop view) */}
      <aside className={`hidden md:flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'} bg-white text-slate-800 shrink-0 border-r border-slate-200 justify-between transition-all duration-300 ease-in-out overflow-x-hidden`}>
        <div className="space-y-6 flex-1 py-6">
          {/* Brand header */}
          <div className={`flex items-center ${sidebarCollapsed ? 'flex-col gap-3 justify-center px-2' : 'justify-between px-6'} transition-all duration-300`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white shrink-0 font-bold text-xl shadow-sm">
                CS
              </div>
              {!sidebarCollapsed && (
                <div className="animate-fade-in whitespace-nowrap overflow-hidden">
                  <h2 className="font-bold text-slate-850 text-sm tracking-tight leading-none uppercase">
                    Consultorsalud
                  </h2>
                  <span className="text-[10px] text-slate-400 font-medium tracking-wide block mt-1">
                    Gestión de Proyectos
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={`p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-200 ${sidebarCollapsed ? 'mt-1' : ''}`}
              title={sidebarCollapsed ? "Expandir menú de navegación" : "Colapsar menú de navegación"}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4 shrink-0" />
              ) : (
                <ChevronLeft className="w-4 h-4 shrink-0" />
              )}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className={`${sidebarCollapsed ? 'px-2' : 'px-3'} space-y-1.5 pt-3`}>
            <button
              onClick={() => {
                setCurrentView('dashboard');
                setSelectedProjectId(null);
              }}
              title="Dashboard Analítico"
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} gap-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <BarChart4 className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Dashboard Analítico</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView('projects');
                setSelectedProjectId(null);
                setSelectedStageFilter('ALL'); // Reset stage filter on direct click
              }}
              title="Cartera de Proyectos"
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} gap-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                currentView === 'projects' && !selectedProjectId
                  ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <FolderGit2 className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Cartera de Proyectos</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView('tracking');
                setSelectedProjectId(null);
              }}
              title="Seguimientos y Comités"
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} gap-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                currentView === 'tracking'
                  ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <ClipboardList className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Seguimientos y Comités</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView('new-project');
                setSelectedProjectId(null);
              }}
              title="Registrar Consultoría"
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} gap-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                currentView === 'new-project'
                  ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <PlusCircle className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Registrar Consultoría</span>}
            </button>

            <button
              onClick={() => {
                setCurrentView('settings');
                setSelectedProjectId(null);
              }}
              title="Configuración"
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} gap-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-blue-50 text-blue-600 border border-blue-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
              }`}
            >
              <Sliders className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && <span>Configuración</span>}
            </button>

            <button
              onClick={handleExportPDF}
              title="Exportar Reporte en PDF"
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center px-0' : 'px-4'} gap-3 py-2.5 rounded-xl text-xs font-bold transition duration-200 cursor-pointer text-emerald-600 hover:bg-emerald-50 hover:text-emerald-800 font-semibold`}
            >
              <Download className="w-5 h-5 shrink-0 text-emerald-500" />
              {!sidebarCollapsed && <span>Exportar Reporte PDF</span>}
            </button>
          </nav>
        </div>

        {/* Corporate Metadata Footer */}
        <div className={`p-4 border-t border-slate-150 space-y-3 bg-slate-50 transition-all duration-300 ${sidebarCollapsed ? 'flex flex-col items-center' : ''}`}>
          {/* Notification Button shortcut */}
          <button 
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            title="Alertas Activas"
            className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center p-2.5' : 'justify-between p-2.5'} rounded-xl text-xs bg-white hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-xs`}
          >
            <div className="flex items-center gap-2">
              <div className="relative shrink-0">
                <Bell className="w-4 h-4 text-blue-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold font-mono">
                    {unreadCount}
                  </span>
                )}
              </div>
              {!sidebarCollapsed && <span className="font-semibold text-slate-600">Alertas Activas</span>}
            </div>
            {!sidebarCollapsed && (
              <span className="text-[10px] font-mono text-slate-600 bg-slate-200/55 px-2 py-0.5 rounded font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {!sidebarCollapsed && (
            <div className="text-center pt-1">
              <span className="text-[10px] text-slate-500 block font-semibold">Consultorsalud SAS © 2026</span>
              <span className="text-[9px] text-slate-400">Bogotá D.C., Colombia</span>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MOBILE Responsive Navigation and Header */}
      <div className="md:hidden bg-white text-slate-800 py-3 px-4 flex justify-between items-center z-40 border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-base">CS</div>
          <div>
            <h1 className="text-xs font-bold tracking-tight text-slate-800">Consultorsalud</h1>
            <span className="text-[8px] text-slate-400 font-semibold block">PROYECTOS</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Quick Notification Bell */}
          <button
            onClick={() => setShowNotificationPanel(!showNotificationPanel)}
            className="relative p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200"
          >
            <Bell className="w-5 h-5 text-blue-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-[8px] text-white rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold font-mono">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Hamburger Menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-slate-700" /> : <Menu className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>

      {/* 3. MOBILE Expanded Slidedown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 text-slate-800 p-4 space-y-2 flex flex-col absolute top-12 left-0 right-0 z-40 animate-fade-in shadow-md">
          <button
            onClick={() => {
              setCurrentView('dashboard');
              setSelectedProjectId(null);
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Dashboard de Control
          </button>

          <button
            onClick={() => {
              setCurrentView('projects');
              setSelectedProjectId(null);
              setSelectedStageFilter('ALL');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold ${currentView === 'projects' && !selectedProjectId ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Cartera de Proyectos
          </button>

          <button
            onClick={() => {
              setCurrentView('tracking');
              setSelectedProjectId(null);
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold ${currentView === 'tracking' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Módulos de Seguimiento
          </button>

          <button
            onClick={() => {
              setCurrentView('new-project');
              setSelectedProjectId(null);
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold ${currentView === 'new-project' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            Registrar Proyecto
          </button>

          <button
            onClick={() => {
              setCurrentView('settings');
              setSelectedProjectId(null);
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left py-2 px-3 rounded-lg text-xs font-bold ${currentView === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
          >
            ⚙️ Configuración del Sistema
          </button>

          <button
            onClick={() => {
              handleExportPDF();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg text-xs font-bold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 mt-1.5 border border-emerald-200/50"
          >
            <Download className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Descargar Reporte PDF</span>
          </button>
        </div>
      )}

      {/* 4. MAIN CANVAS CONTAINER */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {/* Dynamic Inner Layout Switcher with Framer Motion AnimatePresence */}
        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <Dashboard 
                projects={projects} 
                onSelectProject={handleSelectProject}
                onSelectStage={handleSelectStage}
                involvedAreas={involvedAreas}
                stageDetails={stageDetails}
                onExportPDF={handleExportPDF}
              />
            </motion.div>
          )}

          {currentView === 'projects' && (
            <motion.div
              key={activeProjectDetailObj ? `project-detail-${activeProjectDetailObj.id}` : "project-list"}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {activeProjectDetailObj ? (
                <ProjectDetail
                  project={activeProjectDetailObj}
                  onBackClick={() => setSelectedProjectId(null)}
                  onUpdateProject={handleUpdateProject}
                  involvedAreas={involvedAreas}
                  stageDetails={stageDetails}
                  peopleByArea={peopleByArea}
                  onSelectArea={(area) => {
                    setSelectedAreaFilter(area);
                    setSelectedProjectId(null);
                  }}
                />
              ) : (
                <ProjectList
                  projects={projects}
                  onSelectProject={handleSelectProject}
                  onDeleteProject={handleDeleteProject}
                  onAddProjectClick={() => setCurrentView('new-project')}
                  initialStageFilter={selectedStageFilter}
                  onStageFilterChange={setSelectedStageFilter}
                  initialAreaFilter={selectedAreaFilter}
                  onAreaFilterChange={setSelectedAreaFilter}
                  involvedAreas={involvedAreas}
                  stageDetails={stageDetails}
                />
              )}
            </motion.div>
          )}

          {currentView === 'tracking' && (
            <motion.div
              key="tracking"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <TrackingPanel
                projects={projects}
                followUps={followUps}
                onAddFollowUp={handleAddFollowUp}
                onToggleFollowUpStatus={handleToggleFollowUpStatus}
                onSelectProject={handleSelectProject}
                stageDetails={stageDetails}
              />
            </motion.div>
          )}

          {currentView === 'new-project' && (
            <motion.div
              key="new-project"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProjectForm
                onAddProject={handleAddProject}
                onCancel={() => {
                  setCurrentView('projects');
                  setSelectedStageFilter('ALL');
                }}
                involvedAreas={involvedAreas}
                stageDetails={stageDetails}
                peopleByArea={peopleByArea}
              />
            </motion.div>
          )}

          {currentView === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <SettingsPanel
                involvedAreas={involvedAreas}
                stageDetails={stageDetails}
                onAddArea={handleAddArea}
                onUpdateArea={handleUpdateArea}
                onDeleteArea={handleDeleteArea}
                onAddStage={handleAddStage}
                onUpdateStage={handleUpdateStage}
                onDeleteStage={handleDeleteStage}
                peopleByArea={peopleByArea}
                onSetPeopleByArea={setPeopleByArea}
                teamRoster={teamRoster}
                onSetTeamRoster={setTeamRoster}
                areaColors={areaColors}
                onUpdateAreaColor={handleUpdateAreaColor}
                customDbUrl={customDbUrl}
                onUpdateCustomDbUrl={(url) => {
                  localStorage.setItem('gestor_database_url', url);
                  setCustomDbUrl(url);
                  showToast('Enlace de conexión de Base de Datos actualizado.', 'success');
                  window.location.reload();
                }}
                isLocalMode={isLocalMode}
                onSwitchToDbMode={handleSwitchToDbMode}
                onBypassDb={handleBypassDb}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 5. RIGHT SLIDE-OUT PANEL FOR SYSTEM NOTIFICATIONS */}
      {showNotificationPanel && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex justify-end z-50">
          {/* Click outside backdrop to exit */}
          <div className="absolute inset-0" onClick={() => setShowNotificationPanel(false)}></div>
          
          <div className="relative h-full w-full max-w-md shrink-0 shadow-2xl flex flex-col justify-center animate-slide-in p-4">
            <NotificationPanel
              notifications={generatedNotifications}
              onMarkAsRead={handleMarkAsRead}
              onMarkAllAsRead={handleMarkAllAsRead}
              onSelectProject={handleSelectProject}
              onClose={() => setShowNotificationPanel(false)}
            />
          </div>
        </div>
      )}

      {/* 6. CORNER FLOATING INTERACTIVE TOASTS (Dynamic popups) */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        <AnimatePresence>
          {toasts.map(t => {
            let iconColor = 'text-blue-500 bg-blue-50';
            let progressColor = 'bg-blue-600';
            let icon = <Info className="w-4 h-4" />;
            
            if (t.type === 'success') {
              iconColor = 'text-emerald-600 bg-emerald-50';
              progressColor = 'bg-emerald-500';
              icon = <CheckCircle className="w-4 h-4" />;
            } else if (t.type === 'warning') {
              iconColor = 'text-amber-600 bg-amber-50';
              progressColor = 'bg-amber-550';
              icon = <AlertTriangle className="w-4 h-4 animate-bounce" />;
            } else if (t.type === 'error') {
              iconColor = 'text-red-600 bg-red-50';
              progressColor = 'bg-red-500';
              icon = <X className="w-4 h-4" />;
            }

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                className="pointer-events-auto bg-white border border-slate-200 shadow-xl rounded-2xl p-4 flex items-start gap-3 relative overflow-hidden text-xs"
              >
                <div className={`p-1.5 rounded-lg shrink-0 ${iconColor}`}>
                  {icon}
                </div>
                <div className="flex-1 min-w-0 pr-2">
                  <p className="font-bold text-slate-800 leading-normal">{t.message}</p>
                </div>
                <button 
                  onClick={() => setToasts(prev => prev.filter(item => item.id !== t.id))}
                  className="text-slate-400 hover:text-slate-600 rounded p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {/* Visual loading indicator */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 4, ease: 'linear' }}
                    className={`h-full ${progressColor}`}
                  ></motion.div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* 7. ELEGANT CUSTOM COOPERATIVE OVERLAY MODAL FOR PROJECTS DELETION */}
      <AnimatePresence>
        {projectToDelete && (() => {
          const targetProj = projects.find(p => p.id === projectToDelete);
          if (!targetProj) return null;

          return (
            <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProjectToDelete(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
              />

              {/* Modal Card */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative max-w-md w-full z-10 space-y-5"
              >
                <div className="flex gap-4 items-start">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl shrink-0">
                    <AlertTriangle className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-950">¿Confirmar Eliminación de Consultoría?</h3>
                    <p className="text-xs text-slate-500 font-medium">Esta acción no se puede deshacer y borrará toda la información asociada permanentemente.</p>
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-100 rounded-2xl space-y-2.5 text-xs">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-black uppercase text-slate-400 block tracking-wider">Proyecto Seleccionado</span>
                    <p className="font-extrabold text-slate-850 leading-tight">{targetProj.name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block">Entidad Contratante</span>
                      <span className="font-bold text-slate-700">{targetProj.entity}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 block">Hitos & Entregables</span>
                      <span className="font-bold text-slate-700">{targetProj.milestones.length} registrados</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setProjectToDelete(null)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                  >
                    Mantener Proyecto
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteProject}
                    className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-red-200 cursor-pointer"
                  >
                    Eliminar Permanentemente 
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* 4. MODAL: ALERTA DE INCONVENIENTE CRÍTICO DE ENTRADA */}
      {criticalAlertModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 flex-col">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-xl w-full p-6 space-y-5 flex flex-col relative"
          >
            {/* Upper Badge warning alert */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center shrink-0 border border-red-200">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black tracking-widest text-red-600 bg-red-50 px-2.5 py-0.5 rounded-lg uppercase leading-none">
                  Inconvenientes Críticos Activos
                </span>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Alerta: Proyectos con Bloqueos en Curso
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  Se han detectado consultorías detenidas por incidentes críticos. Le recomendamos revisarlas para mitigar riesgos.
                </p>
              </div>
            </div>

            {/* List of blocked projects */}
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {projects.filter(p => p.hasBlocker).map(proj => (
                <div 
                  key={proj.id}
                  className="bg-red-50/40 border border-red-150 rounded-2xl p-4 text-xs space-y-2 hover:bg-red-50/60 transition-colors"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">
                        Proyecto Bloqueado
                      </span>
                      <h4 className="font-extrabold text-slate-850 leading-tight font-sans">
                        {proj.name}
                      </h4>
                    </div>
                    <span className="shrink-0 text-[9px] font-mono font-bold text-red-700 bg-red-100/70 border border-red-200/50 px-2 py-0.5 rounded-lg">
                      {proj.leader}
                    </span>
                  </div>
                  <div className="text-[11px] leading-relaxed text-red-950 font-semibold bg-white/75 border border-red-200/40 p-2.5 rounded-xl flex items-start gap-2">
                    <span className="text-red-500 select-none">🚨</span>
                    <span>{proj.blockerDescription || 'Inconveniente operativo crítico reportado.'}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-3 border-t border-slate-150 justify-end">
              <button
                type="button"
                onClick={() => setCriticalAlertModalOpen(false)}
                className="px-4 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer active:scale-95"
              >
                Entendido, Continuar
              </button>
              <button
                type="button"
                onClick={() => {
                  setCriticalAlertModalOpen(false);
                  setCurrentView('tracking');
                  setSelectedProjectId(null);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-red-200 flex items-center justify-center gap-1 cursor-pointer active:scale-95"
              >
                <span>Auditar en Semáforo</span>
                <span>&rarr;</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
