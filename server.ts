import express from "express";
import path from "path";
import pg from "pg";
import dotenv from "dotenv";
import { INITIAL_PROJECTS, INITIAL_FOLLOWUPS } from './src/mockData';

dotenv.config();

// Lazy-initialize connection pool so that DATABASE_URL is read at runtime
const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let lastUsedDatabaseUrl: string | null = null;

function getPool(): pg.Pool {
  let currentEnvUrl = (process.env.DATABASE_URL || "").trim();
  
  // Clean potential enclosing double or single quotes from manual copy-paste in Vercel settings
  if (currentEnvUrl.startsWith('"') && currentEnvUrl.endsWith('"')) {
    currentEnvUrl = currentEnvUrl.slice(1, -1).trim();
  }
  if (currentEnvUrl.startsWith("'") && currentEnvUrl.endsWith("'")) {
    currentEnvUrl = currentEnvUrl.slice(1, -1).trim();
  }
  
  if (poolInstance && lastUsedDatabaseUrl !== currentEnvUrl) {
    console.log("DATABASE_URL changed or initialized. Recreating connection pool...");
    poolInstance.end().catch(err => console.error("Error closing old pool:", err));
    poolInstance = null;
  }

  if (!poolInstance) {
    if (!currentEnvUrl) {
      throw new Error("DATABASE_URL variable is empty or not defined. Please verify your Vercel project Environment Variables configuration.");
    }
    
    let sanitizedUrl = currentEnvUrl;
    try {
      const parsedUrl = new URL(sanitizedUrl);
      parsedUrl.searchParams.delete("channel_binding");
      if (!parsedUrl.searchParams.has("sslmode")) {
        parsedUrl.searchParams.set("sslmode", "require");
      }
      sanitizedUrl = parsedUrl.toString();
    } catch (err) {
      console.warn("Could not parse DATABASE_URL with standard URL parser, falling back to regex cleanup", err);
      sanitizedUrl = sanitizedUrl.replace(/([?&])channel_binding=[^&]*/g, "");
      sanitizedUrl = sanitizedUrl.replace(/\?&/g, "?").replace(/&&/g, "&").replace(/\?$/g, "").replace(/&$/g, "");
    }
    
    poolInstance = new Pool({
      connectionString: sanitizedUrl,
      ssl: { rejectUnauthorized: false },
      max: 4,                      // Keep connection count low for Serverless / FaaS environments
      idleTimeoutMillis: 8000,     // Close idle clients fast to prevent connection leaks
      connectionTimeoutMillis: 12000, // Wait up to 12s for Neon database cold-start wakeup
    });
    lastUsedDatabaseUrl = currentEnvUrl;
  }
  return poolInstance;
}

// Track the latest DB connection status/error to report to the frontend
let dbConnectionStatus: { connected: boolean; error: string | null } = {
  connected: false,
  error: null,
};

// Use Proxy to delegate all Pool queries dynamically to the active poolInstance
const pool = new Proxy({} as pg.Pool, {
  get(target, prop, receiver) {
    const activePool = getPool();
    const value = Reflect.get(activePool, prop);
    if (typeof value === "function") {
      return value.bind(activePool);
    }
    return value;
  }
});

// Helper to initialize database tables
const SEED_INVOLVED_AREAS = [
  'Consultoría Técnica y Auditoría',
  'TI y Salud Digital',
  'Jurídico y Regulación',
  'Financiera y Tarifas',
  'Comunicaciones y Eventos',
  'Formación y Capacitación',
  'Comercial y Mercadeo',
];

const SEED_AREA_COLORS: Record<string, string> = {
  'Consultoría Técnica y Auditoría': 'indigo',
  'TI y Salud Digital': 'teal',
  'Jurídico y Regulación': 'amber',
  'Financiera y Tarifas': 'emerald',
  'Comunicaciones y Eventos': 'purple',
  'Formación y Capacitación': 'rose',
  'Comercial y Mercadeo': 'sky',
};

const SEED_PEOPLE_BY_AREA: Record<string, string[]> = {
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

const SEED_STAGE_DETAILS = {
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

async function initDb() {
  try {
    const currentUrl = process.env.DATABASE_URL || "";
    console.log("Initializing database tables if not exist using URL:", currentUrl ? "Configured" : "Not configured");
    if (!currentUrl) {
      throw new Error("DATABASE_URL is not defined in the environment variables.");
    }
    
    // Simple query to verify connection
    await pool.query("SELECT 1");
    dbConnectionStatus.connected = true;
    dbConnectionStatus.error = null;

    // 1. Create areas table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS areas (
        name VARCHAR(255) PRIMARY KEY,
        color VARCHAR(100) NOT NULL DEFAULT 'blue'
      );
    `);

    // 2. Create personnel (personal) table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS personnel (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        area_name VARCHAR(255) REFERENCES areas(name) ON DELETE CASCADE,
        UNIQUE(name, area_name)
      );
    `);

    // 3. Create stages (etapas) table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS stages (
        id VARCHAR(50) PRIMARY KEY,
        label VARCHAR(100) NOT NULL,
        color VARCHAR(100) NOT NULL,
        bg VARCHAR(100) NOT NULL,
        border VARCHAR(100) NOT NULL,
        text_color VARCHAR(100) NOT NULL,
        definition TEXT NOT NULL,
        key_deliverables JSONB NOT NULL,
        typical_duration VARCHAR(100) NOT NULL
      );
    `);
    
    // 4. Create projects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(100) PRIMARY KEY,
        name TEXT NOT NULL,
        entity TEXT NOT NULL,
        description TEXT,
        leader TEXT,
        start_date VARCHAR(10),
        due_date VARCHAR(10),
        budget NUMERIC,
        stage VARCHAR(50),
        areas JSONB,
        area_assignments JSONB,
        progress INTEGER,
        has_blocker BOOLEAN,
        blocker_description TEXT,
        milestones JSONB,
        issues JSONB,
        notes TEXT
      );
    `);

    // 5. Create followups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS followups (
        id VARCHAR(100) PRIMARY KEY,
        project_id VARCHAR(100),
        project_name TEXT,
        date VARCHAR(10),
        type VARCHAR(100),
        topics TEXT,
        agreements TEXT,
        next_check_date VARCHAR(10),
        status VARCHAR(50)
      );
    `);

    // 6. Create settings table (keeps general/misc settings like readNotifIds)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB
      );
    `);

    console.log("Database tables verified successfully.");

    // Seeding Areas
    const areaCountRes = await pool.query('SELECT COUNT(*) FROM areas');
    if (parseInt(areaCountRes.rows[0].count, 10) === 0) {
      console.log("Seeding initial areas...");
      for (const name of SEED_INVOLVED_AREAS) {
        const color = SEED_AREA_COLORS[name] || 'blue';
        await pool.query("INSERT INTO areas (name, color) VALUES ($1, $2)", [name, color]);
      }
    }

    // Seeding Personnel (Personal)
    const personnelCountRes = await pool.query('SELECT COUNT(*) FROM personnel');
    if (parseInt(personnelCountRes.rows[0].count, 10) === 0) {
      console.log("Seeding initial personnel...");
      for (const [area, people] of Object.entries(SEED_PEOPLE_BY_AREA)) {
        for (const name of people) {
          await pool.query("INSERT INTO personnel (name, area_name) VALUES ($1, $2)", [name, area]);
        }
      }
    }

    // Seeding Stages (Etapas)
    const stagesCountRes = await pool.query('SELECT COUNT(*) FROM stages');
    if (parseInt(stagesCountRes.rows[0].count, 10) === 0) {
      console.log("Seeding initial stages...");
      for (const [id, s] of Object.entries(SEED_STAGE_DETAILS)) {
        await pool.query(`
          INSERT INTO stages (id, label, color, bg, border, text_color, definition, key_deliverables, typical_duration)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          id, s.label, s.color, s.bg, s.border, s.text, s.definition, JSON.stringify(s.keyDeliverables), s.typicalDuration
        ]);
      }
    }
    
    // Seed projects
    const countRes = await pool.query('SELECT COUNT(*) FROM projects');
    const count = parseInt(countRes.rows[0].count, 10);
    if (count === 0) {
      console.log('Seeding initial projects to Neon Database...');
      for (const p of INITIAL_PROJECTS) {
        await pool.query(`
          INSERT INTO projects (
            id, name, entity, description, leader, start_date, due_date, budget, stage, 
            areas, area_assignments, progress, has_blocker, blocker_description, milestones, issues, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          p.id, p.name, p.entity, p.description, p.leader, p.startDate, p.dueDate, p.budget, p.stage,
          JSON.stringify(p.areas), JSON.stringify(p.areaAssignments || {}), p.progress, p.hasBlocker, p.blockerDescription || '',
          JSON.stringify(p.milestones), JSON.stringify(p.issues), p.notes || ''
        ]);
      }
    }

    // Seed followups
    const fCountRes = await pool.query('SELECT COUNT(*) FROM followups');
    const fCount = parseInt(fCountRes.rows[0].count, 10);
    if (fCount === 0) {
      console.log('Seeding initial followups to Neon Database...');
      for (const f of INITIAL_FOLLOWUPS) {
        await pool.query(`
          INSERT INTO followups (
            id, project_id, project_name, date, type, topics, agreements, next_check_date, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          f.id, f.projectId, f.projectName, f.date, f.type, f.topics, f.agreements, f.nextCheckDate, f.status
        ]);
      }
    }
    
    console.log("Seeding process completed.");
  } catch (error: any) {
    console.error("Error initializing database or seeding:", error);
    dbConnectionStatus.connected = false;
    dbConnectionStatus.error = error.message || String(error);
    throw error;
  }
}

// Map db row to Project type
function dbToProject(row: any) {
  return {
    id: row.id,
    name: row.name,
    entity: row.entity,
    description: row.description || '',
    leader: row.leader || '',
    startDate: row.start_date || '',
    dueDate: row.due_date || '',
    budget: Number(row.budget) || 0,
    stage: row.stage,
    areas: row.areas || [],
    areaAssignments: row.area_assignments || {},
    progress: row.progress || 0,
    hasBlocker: !!row.has_blocker,
    blockerDescription: row.blocker_description || '',
    milestones: row.milestones || [],
    issues: row.issues || [],
    notes: row.notes || '',
  };
}

// Map db row to FollowUp type
function dbToFollowUp(row: any) {
  return {
    id: row.id,
    projectId: row.project_id || '',
    projectName: row.project_name || '',
    date: row.date || '',
    type: row.type,
    topics: row.topics || '',
    agreements: row.agreements || '',
    nextCheckDate: row.next_check_date || '',
    status: row.status,
  };
}

const app = express();

app.use(express.json({ limit: '10mb' }));

app.get("/api/test-db", async (req, res) => {
  const currentEnvUrl = (process.env.DATABASE_URL || "").trim();
  let status = "Not tested";
  let debugInfo: any = {
    exists: !!currentEnvUrl,
    length: currentEnvUrl.length,
    node_env: process.env.NODE_ENV,
    is_vercel: !!process.env.VERCEL,
  };

  if (currentEnvUrl) {
    try {
      const parsed = new URL(currentEnvUrl);
      parsed.password = "****";
      debugInfo.parsed_preview = parsed.toString();
    } catch (e: any) {
      debugInfo.parse_error = e.message;
      debugInfo.raw_preview = currentEnvUrl.substring(0, 15) + "..." + currentEnvUrl.substring(Math.max(0, currentEnvUrl.length - 15));
    }

    let sanitizedUrl = currentEnvUrl;
    try {
      const parsedUrl = new URL(sanitizedUrl);
      parsedUrl.searchParams.delete("channel_binding");
      if (!parsedUrl.searchParams.has("sslmode")) {
        parsedUrl.searchParams.set("sslmode", "require");
      }
      sanitizedUrl = parsedUrl.toString();
      debugInfo.sanitized_preview = sanitizedUrl.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
    } catch (err: any) {
      debugInfo.sanitizing_error = err.message;
    }

    const client = new pg.Client({
      connectionString: sanitizedUrl,
      ssl: { rejectUnauthorized: false },
    });

    try {
      await client.connect();
      const dbRes = await client.query("SELECT version()");
      status = "Success";
      debugInfo.db_version = dbRes.rows[0]?.version;
      await client.end();
    } catch (connectErr: any) {
      status = "Failed";
      debugInfo.connect_error = connectErr.message || String(connectErr);
      debugInfo.connect_error_stack = connectErr.stack;
      try {
        await client.end();
      } catch (e) {}
    }
  }

  res.json({
    status,
    debugInfo
  });
});

// Middleware to ensure DB is initialized lazily
let dbInitialized = false;
let dbInitializationPromise: Promise<void> | null = null;

async function ensureDb() {
  if (dbInitialized) return;
  if (!dbInitializationPromise) {
    dbInitializationPromise = initDb().then(() => {
      dbInitialized = true;
    }).catch(err => {
      dbInitializationPromise = null; // retry on next request if it failed
      throw err;
    });
  }
  await dbInitializationPromise;
}

// Ensure database is initialized before any API request is handled (except db-status)
app.use("/api", async (req, res, next) => {
  // Allow checking connection status even if DB is failing to initialize
  if (req.path === "/db-status" || req.url.endsWith("/db-status") || req.path === "/test-db" || req.url.endsWith("/test-db")) {
    return next();
  }
  try {
    await ensureDb();
    next();
  } catch (err: any) {
    console.error("Database initialization failed:", err);
    res.status(500).json({ error: "Database initialization failed", details: err.message });
  }
});

  // --- API Endpoints ---

  // Get database connection status
  app.get("/api/db-status", (req, res) => {
    res.json(dbConnectionStatus);
  });

  // Get full combined data
  app.get("/api/data", async (req, res) => {
    try {
      const projRes = await pool.query("SELECT * FROM projects ORDER BY due_date ASC");
      const projects = projRes.rows.map(dbToProject);

      const fRes = await pool.query("SELECT * FROM followups ORDER BY date DESC");
      const followUps = fRes.rows.map(dbToFollowUp);

      // Fetch dynamic configurations from relational tables
      const areasRes = await pool.query("SELECT * FROM areas ORDER BY name ASC");
      const personnelRes = await pool.query("SELECT * FROM personnel ORDER BY name ASC");
      const stagesRes = await pool.query("SELECT * FROM stages");
      const setRes = await pool.query("SELECT * FROM settings");

      const involvedAreas = areasRes.rows.map(row => row.name);
      const areaColors: Record<string, string> = {};
      areasRes.rows.forEach(row => {
        areaColors[row.name] = row.color;
      });

      const peopleByArea: Record<string, string[]> = {};
      // Initialize all areas in peopleByArea to an empty array so all exist
      involvedAreas.forEach(area => {
        peopleByArea[area] = [];
      });
      personnelRes.rows.forEach(row => {
        if (row.area_name) {
          if (!peopleByArea[row.area_name]) {
            peopleByArea[row.area_name] = [];
          }
          peopleByArea[row.area_name].push(row.name);
        }
      });

      // teamRoster is the unique list of all personnel names
      const teamRoster = Array.from(new Set(personnelRes.rows.map(row => row.name)));

      const stageDetails: Record<string, any> = {};
      stagesRes.rows.forEach(row => {
        stageDetails[row.id] = {
          label: row.label,
          color: row.color,
          bg: row.bg,
          border: row.border,
          text: row.text_color,
          definition: row.definition,
          keyDeliverables: row.key_deliverables,
          typicalDuration: row.typical_duration
        };
      });

      // Merge and construct full settings object
      const settings: Record<string, any> = {
        involvedAreas,
        areaColors,
        peopleByArea,
        teamRoster,
        stageDetails
      };
      setRes.rows.forEach(row => {
        settings[row.key] = row.value;
      });

      res.json({
        projects,
        followUps,
        settings,
      });
    } catch (err: any) {
      console.error("Error fetching api data:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Save/Update single project
  app.post("/api/projects", async (req, res) => {
    const p = req.body;
    try {
      await pool.query(`
        INSERT INTO projects (
          id, name, entity, description, leader, start_date, due_date, budget, stage, 
          areas, area_assignments, progress, has_blocker, blocker_description, milestones, issues, notes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          entity = EXCLUDED.entity,
          description = EXCLUDED.description,
          leader = EXCLUDED.leader,
          start_date = EXCLUDED.start_date,
          due_date = EXCLUDED.due_date,
          budget = EXCLUDED.budget,
          stage = EXCLUDED.stage,
          areas = EXCLUDED.areas,
          area_assignments = EXCLUDED.area_assignments,
          progress = EXCLUDED.progress,
          has_blocker = EXCLUDED.has_blocker,
          blocker_description = EXCLUDED.blocker_description,
          milestones = EXCLUDED.milestones,
          issues = EXCLUDED.issues,
          notes = EXCLUDED.notes
      `, [
        p.id, p.name, p.entity, p.description, p.leader, p.startDate, p.dueDate, p.budget, p.stage,
        JSON.stringify(p.areas), JSON.stringify(p.areaAssignments || {}), p.progress, p.hasBlocker, p.blockerDescription || '',
        JSON.stringify(p.milestones), JSON.stringify(p.issues), p.notes || ''
      ]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error saving project:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Bulk sync all projects (atomic)
  app.post("/api/projects/sync", async (req, res) => {
    const projects = req.body;
    try {
      await pool.query("BEGIN");
      await pool.query("DELETE FROM projects");
      for (const p of projects) {
        await pool.query(`
          INSERT INTO projects (
            id, name, entity, description, leader, start_date, due_date, budget, stage, 
            areas, area_assignments, progress, has_blocker, blocker_description, milestones, issues, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        `, [
          p.id, p.name, p.entity, p.description, p.leader, p.startDate, p.dueDate, p.budget, p.stage,
          JSON.stringify(p.areas), JSON.stringify(p.areaAssignments || {}), p.progress, p.hasBlocker, p.blockerDescription || '',
          JSON.stringify(p.milestones), JSON.stringify(p.issues), p.notes || ''
        ]);
      }
      await pool.query("COMMIT");
      res.json({ success: true });
    } catch (err: any) {
      await pool.query("ROLLBACK");
      console.error("Error syncing projects:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Delete project
  app.delete("/api/projects/:id", async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM projects WHERE id = $1", [id]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error deleting project:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Save/Update single followup
  app.post("/api/followups", async (req, res) => {
    const f = req.body;
    try {
      await pool.query(`
        INSERT INTO followups (
          id, project_id, project_name, date, type, topics, agreements, next_check_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          project_id = EXCLUDED.project_id,
          project_name = EXCLUDED.project_name,
          date = EXCLUDED.date,
          type = EXCLUDED.type,
          topics = EXCLUDED.topics,
          agreements = EXCLUDED.agreements,
          next_check_date = EXCLUDED.next_check_date,
          status = EXCLUDED.status
      `, [
        f.id, f.projectId, f.projectName, f.date, f.type, f.topics, f.agreements, f.nextCheckDate, f.status
      ]);
      res.json({ success: true });
    } catch (err: any) {
      console.error("Error saving followup:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Bulk sync all followups (atomic)
  app.post("/api/followups/sync", async (req, res) => {
    const followUps = req.body;
    try {
      await pool.query("BEGIN");
      await pool.query("DELETE FROM followups");
      for (const f of followUps) {
        await pool.query(`
          INSERT INTO followups (
            id, project_id, project_name, date, type, topics, agreements, next_check_date, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [
          f.id, f.projectId, f.projectName, f.date, f.type, f.topics, f.agreements, f.nextCheckDate, f.status
        ]);
      }
      await pool.query("COMMIT");
      res.json({ success: true });
    } catch (err: any) {
      await pool.query("ROLLBACK");
      console.error("Error syncing followups:", err);
      res.status(500).json({ error: err.message });
    }
  });

  // Save setting
  app.post("/api/settings", async (req, res) => {
    const { key, value } = req.body;
    try {
      if (key === 'involvedAreas') {
        const currentAreas = value as string[];
        // Delete areas not in currentAreas
        if (currentAreas.length > 0) {
          await pool.query("DELETE FROM areas WHERE NOT (name = ANY($1))", [currentAreas]);
        } else {
          await pool.query("DELETE FROM areas");
        }
        // Insert new areas with default colors
        for (const area of currentAreas) {
          await pool.query("INSERT INTO areas (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [area]);
        }
      } else if (key === 'areaColors') {
        const colors = value as Record<string, string>;
        for (const [area, color] of Object.entries(colors)) {
          await pool.query(`
            INSERT INTO areas (name, color) VALUES ($1, $2)
            ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color
          `, [area, color]);
        }
      } else if (key === 'peopleByArea') {
        const peopleByArea = value as Record<string, string[]>;
        await pool.query("BEGIN");
        // Clear all personnel with a linked area to rebuild
        await pool.query("DELETE FROM personnel WHERE area_name IS NOT NULL");
        for (const [area, people] of Object.entries(peopleByArea)) {
          // Verify area exists in database
          await pool.query("INSERT INTO areas (name) VALUES ($1) ON CONFLICT (name) DO NOTHING", [area]);
          for (const name of people) {
            await pool.query(`
              INSERT INTO personnel (name, area_name) VALUES ($1, $2)
              ON CONFLICT (name, area_name) DO NOTHING
            `, [name, area]);
          }
        }
        await pool.query("COMMIT");
      } else if (key === 'teamRoster') {
        const roster = value as string[];
        // Delete any personnel who are no longer in the roster
        if (roster.length > 0) {
          await pool.query("DELETE FROM personnel WHERE NOT (name = ANY($1))", [roster]);
        } else {
          await pool.query("DELETE FROM personnel");
        }
        // Insert any new roster members who aren't in the table yet
        for (const name of roster) {
          const check = await pool.query("SELECT COUNT(*) FROM personnel WHERE name = $1", [name]);
          if (parseInt(check.rows[0].count, 10) === 0) {
            await pool.query("INSERT INTO personnel (name, area_name) VALUES ($1, NULL)", [name]);
          }
        }
      } else if (key === 'stageDetails') {
        const stages = value as Record<string, any>;
        await pool.query("BEGIN");
        const stageIds = Object.keys(stages);
        if (stageIds.length > 0) {
          await pool.query("DELETE FROM stages WHERE NOT (id = ANY($1))", [stageIds]);
        } else {
          await pool.query("DELETE FROM stages");
        }
        for (const [id, s] of Object.entries(stages)) {
          await pool.query(`
            INSERT INTO stages (id, label, color, bg, border, text_color, definition, key_deliverables, typical_duration)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            ON CONFLICT (id) DO UPDATE SET
              label = EXCLUDED.label,
              color = EXCLUDED.color,
              bg = EXCLUDED.bg,
              border = EXCLUDED.border,
              text_color = EXCLUDED.text_color,
              definition = EXCLUDED.definition,
              key_deliverables = EXCLUDED.key_deliverables,
              typical_duration = EXCLUDED.typical_duration
          `, [
            id, s.label, s.color, s.bg, s.border, s.text, s.definition, JSON.stringify(s.keyDeliverables), s.typicalDuration
          ]);
        }
        await pool.query("COMMIT");
      } else {
        // Fallback for general settings like readNotifIds
        await pool.query(`
          INSERT INTO settings (key, value) VALUES ($1, $2)
          ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [key, JSON.stringify(value)]);
      }
      res.json({ success: true });
    } catch (err: any) {
      console.error(`Error saving setting ${key}:`, err);
      res.status(500).json({ error: err.message });
    }
  });

  // Vite middleware and listener setup (only if NOT on Vercel)
  if (!process.env.VERCEL) {
    (async () => {
      try {
        if (process.env.NODE_ENV !== "production") {
          const { createServer: createViteServer } = await import("vite");
          const vite = await createViteServer({
            server: { middlewareMode: true },
            appType: "spa",
          });
          app.use(vite.middlewares);
        } else {
          const distPath = path.join(process.cwd(), 'dist');
          app.use(express.static(distPath));
          app.get('*', (req, res) => {
            res.sendFile(path.join(distPath, 'index.html'));
          });
        }

        const PORT = 3000;
        app.listen(PORT, "0.0.0.0", () => {
          console.log(`Server running on http://0.0.0.0:${PORT}`);
        });
      } catch (err) {
        console.error("Error during server startup:", err);
      }
    })();
  }

export default app;
