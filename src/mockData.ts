import { Project, ProjectStage, ProjectFollowUp } from './types';

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-upc-2026',
    name: 'Auditoría de Suficiencia de la UPC 2026',
    entity: 'ACEMI (Gremio de EPS Contributivas)',
    description: 'Estudio técnico-financiero detallado para sustentar el cálculo y análisis de suficiencia de la Unidad de Pago por Capitación (UPC) ante el Ministerio de Salud, evaluando las desviaciones de siniestralidad de las EPS afiliadas.',
    leader: 'Dra. Liliana Cadena',
    startDate: '2026-05-10',
    dueDate: '2026-06-15', // Exceeded with respect to today (June 19, 2026) -> Trigger Overdue alert
    budget: 120000000,
    stage: ProjectStage.EJECUCION,
    areas: ['Consultoría Técnica y Auditoría', 'Financiera y Tarifas', 'Jurídico y Regulación'],
    areaAssignments: {
      'Consultoría Técnica y Auditoría': ['Dra. Liliana Cadena', 'Dr. Mateo Rivera'],
      'Financiera y Tarifas': ['Ing. Camilo Torres'],
      'Jurídico y Regulación': ['Dra. Sandra Martínez']
    },
    progress: 75,
    hasBlocker: false,
    milestones: [
      { id: 'm1-upc', title: 'Definición de muestra y solicitud de bases de datos de EPS', dueDate: '2026-05-15', completed: true },
      { id: 'm2-upc', title: 'Consolidación de base de datos RIPS nacional', dueDate: '2026-05-25', completed: true },
      { id: 'm3-upc', title: 'Análisis actuarial de suficiencia por grupos etarios', dueDate: '2026-06-05', completed: true },
      { id: 'm4-upc', title: 'Borrador de informe final para comité técnico', dueDate: '2026-06-12', completed: true },
      { id: 'm5-upc', title: 'Radicación del estudio definitivo ante Minsalud', dueDate: '2026-06-15', completed: false },
    ],
    issues: [
      { id: 'iss-1-upc', date: '2026-06-13', description: 'El Ministerio de Salud modificó la estructura del anexo de RIPS, exigiendo reprocesar las muestras de los últimos dos periodos.', resolved: false }
    ],
    notes: 'Requiere estricto seguimiento de la mesa regulatoria. El retraso presiona la agenda regulatoria del país.'
  },
  {
    id: 'proj-interop-cali',
    name: 'Implementación de Interoperabilidad de Historia Clínica',
    entity: 'Clínica de Occidente de Cali',
    description: 'Asesoría jurídica y técnica especializada para realizar el acoplamiento normativo y tecnológico del core hospitalario con el Sistema de Interoperabilidad de Historia Clínica del Valle del Cauca, según Ley 2015 de 2020.',
    leader: 'Ing. Alejandro Vargas',
    startDate: '2026-06-01',
    dueDate: '2026-07-28', // Upcoming
    budget: 85000000,
    stage: ProjectStage.EJECUCION,
    areas: ['TI y Salud Digital', 'Consultoría Técnica y Auditoría', 'Jurídico y Regulación'],
    areaAssignments: {
      'TI y Salud Digital': ['Ing. Alejandro Vargas', 'Dr. David Restrepo'],
      'Consultoría Técnica y Auditoría': ['Enf. Patricia Jaramillo'],
      'Jurídico y Regulación': ['Dra. Sandra Martínez']
    },
    progress: 40,
    hasBlocker: true, // Trigger Blocker Alert!
    blockerDescription: 'El proveedor tecnológico extranjero del HIS de la clínica presenta demoras injustificadas en la habilitación del servicio web (SOAP/REST) bajo estándar HL7-FHIR.',
    milestones: [
      { id: 'm1-int', title: 'Diagnóstico jurídico y técnico de madurez digital', dueDate: '2026-06-10', completed: true },
      { id: 'm2-int', title: 'Capacitación al equipo de sistemas en guías Minsalud', dueDate: '2026-06-20', completed: true },
      { id: 'm3-int', title: 'Mapeo de datos asistenciales clínicos a estructura FHIR', dueDate: '2026-07-05', completed: false },
      { id: 'm4-int', title: 'Liberación de pruebas de interoperabilidad integradas', dueDate: '2026-07-20', completed: false },
    ],
    issues: [
      { id: 'iss-1-int', date: '2026-06-14', description: 'Falta de respuesta formal de soporte del HIS internacional.', resolved: false }
    ],
    notes: 'Se escaló la situación con la gerencia general de la Clínica para presionar contractualmente al proveedor de TI.'
  },
  {
    id: 'proj-reforma-compensar',
    name: 'Estrategia de Canastas y Tarifas de Transición (Reforma)',
    entity: 'EPS Compensar',
    description: 'Modelación financiera y jurídica para reestructurar los contratos capitados e integrales de la EPS en su transición voluntaria hacia Gestora de Salud y Vida, articulando las Redes Integradas e Integrales de Servicios de Salud (RIISS).',
    leader: 'Dra. Martha Inés Gómez',
    startDate: '2026-06-10',
    dueDate: '2026-06-25',
    budget: 95000000,
    stage: ProjectStage.POR_PRESENTAR,
    areas: ['Financiera y Tarifas', 'Jurídico y Regulación', 'Comercial y Mercadeo'],
    areaAssignments: {
      'Financiera y Tarifas': ['Dra. Martha Inés Gómez', 'Ing. Nelson Ruiz'],
      'Jurídico y Regulación': ['Dra. Sandra Martínez'],
      'Comercial y Mercadeo': ['Oscar Delgado']
    },
    progress: 90,
    hasBlocker: false,
    milestones: [
      { id: 'm1-ref', title: 'Estructuración legal de contratos según decretos transitorios', dueDate: '2026-06-14', completed: true },
      { id: 'm2-ref', title: 'Simulación financiera de tarifas fijas por portafolio de baja complejidad', dueDate: '2026-06-18', completed: true },
      { id: 'm3-ref', title: 'Diseño comercial del portafolio unificado para IPS aliadas', dueDate: '2026-06-22', completed: true },
      { id: 'm4-ref', title: 'Presentación formal de la propuesta comercial modificada', dueDate: '2026-06-25', completed: false }
    ],
    issues: [],
    notes: 'Es de vital importancia que el documento técnico esté listo antes de la próxima reunión extraordinaria de socios.'
  },
  {
    id: 'proj-congreso-riesgo',
    name: 'X Congreso Nacional de Gestión del Riesgo en Salud',
    entity: 'Evento Sectorial Consultorsalud',
    description: 'Planeación integral, marketing analítico, gestión de auspiciadores de la industria farmacéutica y tecnologías en salud, y conformación de la agenda de expertos del principal evento nacional de aseguramiento.',
    leader: 'Lic. Juan Camilo Bermúdez',
    startDate: '2026-07-01',
    dueDate: '2026-09-15',
    budget: 180000000,
    stage: ProjectStage.POR_INICIAR,
    areas: ['Comunicaciones y Eventos', 'Comercial y Mercadeo', 'Formación y Capacitación'],
    areaAssignments: {
      'Comunicaciones y Eventos': ['Lic. Juan Camilo Bermúdez', 'Adriana Salazar'],
      'Comercial y Mercadeo': ['Oscar Delgado'],
      'Formación y Capacitación': ['Prof. Clara Inés']
    },
    progress: 15,
    hasBlocker: false,
    milestones: [
      { id: 'm1-cg', title: 'Separación locación física y hotel sede del congreso', dueDate: '2026-07-10', completed: true },
      { id: 'm2-cg', title: 'Cierre de portafolio comercial de patrocinios principales', dueDate: '2026-08-01', completed: false },
      { id: 'm3-cg', title: 'Confirmación de panelistas internacionales del Minsalud y OPS', dueDate: '2026-08-15', completed: false },
      { id: 'm4-cg', title: 'Lanzamiento de la preventa de boletería digital', dueDate: '2026-08-20', completed: false },
    ],
    issues: [],
    notes: 'Este año el foco del evento académico es el futuro operacional de las EPS y el nuevo rol de la ADRES.'
  },
  {
    id: 'proj-diplomado-huila',
    name: 'Diplomado E-Learning de Auditoría de Cuentas Médicas',
    entity: 'ESE Hospital Universitario Hernando Moncaleano Perdomo (Neiva)',
    description: 'Estructuración y ejecución de un programa intensivo de formación continua de 120 horas lectivas para 120 funcionarios de facturación, auditoría concurrente y recuperación de cartera del hospital público del Huila.',
    leader: 'Dr. Gabriel Suárez',
    startDate: '2026-04-10',
    dueDate: '2026-06-20',
    budget: 55000000,
    stage: ProjectStage.EVALUACION,
    areas: ['Formación y Capacitación', 'Consultoría Técnica y Auditoría'],
    areaAssignments: {
      'Formación y Capacitación': ['Dr. Gabriel Suárez', 'Laura Mendoza'],
      'Consultoría Técnica y Auditoría': ['Dr. Mateo Rivera']
    },
    progress: 95,
    hasBlocker: false,
    milestones: [
      { id: 'm1-dip', title: 'Validación de malla académica frente a Circulares Supersalud', dueDate: '2026-04-15', completed: true },
      { id: 'm2-dip', title: 'Cargue de contenidos virtuales e instrucción interactiva', dueDate: '2026-04-30', completed: true },
      { id: 'm3-dip', title: 'Desarrollo de los 4 módulos temáticos virtuales', dueDate: '2026-05-30', completed: true },
      { id: 'm4-dip', title: 'Evaluaciones y carga de proyecto final de auditoría programada', dueDate: '2026-06-15', completed: true },
      { id: 'm5-dip', title: 'Cierre administrative, actas de grado y entrega de certificaciones', dueDate: '2026-06-20', completed: false },
    ],
    issues: [],
    notes: 'Proyecto exitoso con alta tasa de retención (92%). Interés de la ESE por cotizar un Diplomado complementario en Ley 100 vs. Reforma.'
  },
  {
    id: 'proj-auditoria-glosas-bolivar',
    name: 'Saneamiento y Auditoría Extrema de Cartera y Glosas',
    entity: 'ESE Hospital Local Turbaco (Bolívar)',
    description: 'Auditoría exhaustiva sobre cuentas médicas glosadas acumuladas por EPS liquidadas y vigentes desde 2023, con radicación de recursos jurídicos de cobro coactivo bajo normatividad Supersalud.',
    leader: 'Dra. Liliana Cadena',
    startDate: '2026-03-01',
    dueDate: '2026-05-30', // Overdue and Finished or Paused? Let's make it PAUSA to demonstrate delayed/paused project with past due date.
    budget: 72000000,
    stage: ProjectStage.PAUSA,
    areas: ['Consultoría Técnica y Auditoría', 'Financiera y Tarifas', 'Jurídico y Regulación'],
    areaAssignments: {
      'Consultoría Técnica y Auditoría': ['Dra. Liliana Cadena', 'Dr. Mateo Rivera'],
      'Financiera y Tarifas': ['Ing. Camilo Torres'],
      'Jurídico y Regulación': ['Dra. Sandra Martínez']
    },
    progress: 60,
    hasBlocker: true,
    blockerDescription: 'La EPS destinataria de las glosas entró en un proceso de intervención forzosa por la Superintendencia de Salud, suspendiendo temporalmente las mesas de conciliación de cartera.',
    milestones: [
      { id: 'm1-glo', title: 'Análisis de base original de facturas vs glosas de EPS', dueDate: '2026-03-15', completed: true },
      { id: 'm2-glo', title: 'Depuración técnica y recopilación de soportes clínicos', dueDate: '2026-04-15', completed: true },
      { id: 'm3-glo', title: 'Citación formal para mesas de conciliación obligatoria', dueDate: '2026-05-10', completed: false },
    ],
    issues: [
      { id: 'iss-1-glo', date: '2026-05-12', description: 'Resolución de intervención de la EPS suspende flujos de mesas de trabajo.', resolved: false }
    ],
    notes: 'Estamos preparando el recurso administrativo ante el Agente Interventor para que se catalogue la deuda como prioritaria en la masa liquidatoria.'
  }
];

export const INITIAL_FOLLOWUPS: ProjectFollowUp[] = [
  {
    id: 'f-1',
    projectId: 'proj-upc-2026',
    projectName: 'Auditoría de Suficiencia de la UPC 2026',
    date: '2026-06-12',
    type: 'COMITE_SEMANAL',
    topics: 'Alineación de bases de datos de RIPS del nuevo anexo exigido por el Ministerio de Salud.',
    agreements: 'Se delegó a la Dra. Liliana Cadena presentar una matriz comparativa del nuevo anexo y solicitar prórroga de 10 días a la mesa técnica de Minsalud.',
    nextCheckDate: '2026-06-19',
    status: 'COMPLETADO'
  },
  {
    id: 'f-2',
    projectId: 'proj-interop-cali',
    projectName: 'Implementación de Interoperabilidad de Historia Clínica',
    date: '2026-06-15',
    type: 'REUNION_CLIENTE',
    topics: 'Revisión técnica de HL7-FHIR con el director de sistemas de la Clínica de Occidente.',
    agreements: 'Gestionar una llamada tripartita con el proveedor técnico internacional del core hospitalario para evaluar la viabilidad de la API.',
    nextCheckDate: '2026-06-22',
    status: 'PENDIENTE'
  },
  {
    id: 'f-3',
    projectId: 'proj-auditoria-glosas-bolivar',
    projectName: 'Saneamiento y Auditoría Extrema de Cartera y Glosas',
    date: '2026-06-18',
    type: 'AUDITORIA_INTERNA',
    topics: 'Evaluación del riesgo de insolvencia de la EPS intervenida y cálculo de valor neto recuperable.',
    agreements: 'Radicar memorial formal de acreencias ante el liquidador designado para asegurar prelación en el pago.',
    nextCheckDate: '2026-06-25',
    status: 'PENDIENTE'
  }
];
