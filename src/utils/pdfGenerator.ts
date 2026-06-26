import { jsPDF } from 'jspdf';
import { Project, ProjectFollowUp, ProjectStage, STAGE_DETAILS } from '../types';

interface PDFReportData {
  projects: Project[];
  followUps: ProjectFollowUp[];
  involvedAreas: string[];
  teamRoster: string[];
  areaColors: Record<string, string>;
}

export function generatePDFReport({
  projects,
  followUps,
  involvedAreas,
  teamRoster,
  areaColors,
}: PDFReportData) {
  // Create jsPDF in A4, portrait, millimeters
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  let pageCount = 1;
  let currentY = 15;

  // Formatting helpers
  const formatCOP = (val: number) => {
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  const drawHeaderAndFooter = (pdfDoc: jsPDF, isNewPage: boolean = false) => {
    // Top colored indicator line - Elegant dark slate/blue header
    pdfDoc.setFillColor(30, 41, 59); // Dark Slate 800
    pdfDoc.rect(0, 0, pageWidth, 4, 'F');

    // Header Metadata
    pdfDoc.setFont('Helvetica', 'bold');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(100, 116, 139); // Slate 500
    pdfDoc.text('CONSULTORSALUD SAS © 2026', marginX, 10);
    
    pdfDoc.setFont('Helvetica', 'normal');
    pdfDoc.text('PROYECTOS Y SEGUIMIENTO CONTRACTUAL', pageWidth - marginX - 70, 10, { align: 'left' });

    // Header Separator line
    pdfDoc.setDrawColor(226, 232, 240); // Slate 200
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(marginX, 12, pageWidth - marginX, 12);

    // Footer
    pdfDoc.setFont('Helvetica', 'normal');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(148, 163, 184); // Slate 400
    pdfDoc.text('Reporte generado en simulación de operación activa. Bogotá D.C., Colombia.', marginX, pageHeight - 10);
    pdfDoc.text(`Pág. ${pageCount}`, pageWidth - marginX - 10, pageHeight - 10);
  };

  const handlePageBreak = (neededLines: number) => {
    if (currentY + neededLines > pageHeight - 18) {
      doc.addPage();
      pageCount++;
      currentY = 20;
      drawHeaderAndFooter(doc, true);
    }
  };

  // ----------------------------------------------------
  // DRAW PAGE 1 (Cover & Executive Summary)
  // ----------------------------------------------------
  drawHeaderAndFooter(doc, false);

  // Big brand title block
  currentY += 10;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'F');
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'D');

  // Title branding
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Slate 800
  doc.text('INFORME CONSOLIDADO EJECUTIVO', marginX + 6, currentY + 12);
  
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(115, 0, 0); // Elegant Burgundy #730000
  doc.text('SISTEMA DE GESTIÓN DE PORTAFOLIO Y SEGUIMIENTO CONTRACTUAL', marginX + 6, currentY + 20);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(`Fecha del Reporte de Simulación: 19 de Junio, 2026`, marginX + 6, currentY + 28);
  doc.text(`Consultor Líder Operativo: asistente.tecnologia@consultorsalud.com`, pageWidth - marginX - 110, currentY + 28);

  currentY += 45;

  // Executive KPI summary card block (Bento mockup in PDF)
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text('1. RESUMEN EJECUTIVO DE CARTERA', marginX, currentY);
  
  // Underline
  doc.setDrawColor(115, 0, 0); // Elegant Burgundy #730000
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 2, marginX + 45, currentY + 2);
  
  currentY += 8;

  // Calculate quick stats
  const totalProjects = projects.length;
  const activeProjectsCount = projects.filter(p => p.stage !== ProjectStage.COMPLETADO && p.stage !== ProjectStage.CANCELADO).length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget, 0);
  const finishedProjects = projects.filter(p => p.stage === ProjectStage.COMPLETADO).length;
  const blockedProjects = projects.filter(p => p.hasBlocker).length;
  const completedMilestones = projects.reduce((acc, p) => acc + p.milestones.filter(m => m.completed).length, 0);
  const totalMilestones = projects.reduce((acc, p) => acc + p.milestones.length, 0);

  // Bento stat squares - Beautiful white cards with subtle slate borders
  // Row 1 (Total & Active)
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240);
  doc.rect(marginX, currentY, 85, 24, 'D');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CARTERA TOTAL DE PROYECTOS', marginX + 5, currentY + 6);
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59);
  doc.text(`${totalProjects} Proyectos`, marginX + 5, currentY + 16);

  doc.rect(marginX + 95, currentY, 85, 24, 'D');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PROYECTOS EN OPERACIÓN ACTIVA', marginX + 100, currentY + 6);
  doc.setFontSize(18);
  doc.setTextColor(115, 0, 0); // Elegant brand Burgundy #730000 instead of vibrant red
  doc.text(`${activeProjectsCount} Activos`, marginX + 100, currentY + 16);

  currentY += 30;

  // Row 2 (Budget & Blockers)
  doc.rect(marginX, currentY, 85, 24, 'D');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('PRESUPUESTO AGREGADO CONTROLADO', marginX + 5, currentY + 6);
  doc.setFontSize(13);
  doc.setTextColor(5, 150, 105); // High contrast Emerald 700
  doc.text(formatCOP(totalBudget), marginX + 5, currentY + 15);

  doc.rect(marginX + 95, currentY, 85, 24, 'D');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('CRISIS, ALERTAS Y BLOQUEOS ACTIVOS', marginX + 100, currentY + 6);
  doc.setFontSize(14);
  // High contrast red for blockers or slate otherwise
  doc.setTextColor(blockedProjects > 0 ? 153 : 30, blockedProjects > 0 ? 27 : 41, blockedProjects > 0 ? 27 : 59); // Dark red #991B1B or Slate 800
  doc.text(`${blockedProjects} Bloqueados`, marginX + 100, currentY + 15);

  currentY += 32;

  // Breakdown of Projects by stage
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Distribución por Etapa Contractual', marginX, currentY);
  currentY += 6;

  const stageCounts = Object.values(ProjectStage).reduce((acc, stage) => {
    acc[stage] = projects.filter(p => p.stage === stage).length;
    return acc;
  }, {} as Record<ProjectStage, number>);

  // Simple clean table for Stage statistics
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 34, 'F');
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 34, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('ETAPA DE IMPLEMENTACIÓN', marginX + 4, currentY + 5);
  doc.text('DESCRIPCIÓN OPERATIVA', marginX + 55, currentY + 5);
  doc.text('CANTIDAD', marginX + 130, currentY + 5);
  doc.text('% PARTICIPACIÓN', marginX + 155, currentY + 5);

  doc.setDrawColor(226, 232, 240);
  doc.line(marginX, currentY + 8, pageWidth - marginX, currentY + 8);

  let innerY = currentY + 13;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);

  const stagesToPrint = [
    { s: ProjectStage.EJECUCION, name: 'En Ejecución', desc: 'Consultoría en marcha con entregas periódicas' },
    { s: ProjectStage.POR_INICIAR, name: 'Listo para Inicio', desc: 'Requisitos previos listos, pendiente de inicio oficial' },
    { s: ProjectStage.EVALUACION, name: 'Evaluación Técnica', desc: 'Análisis de viabilidad, negociación de alcances' },
    { s: ProjectStage.COMPLETADO, name: 'Completado', desc: 'Contrato liquidado a entera satisfacción' },
  ];

  stagesToPrint.forEach((item) => {
    const count = stageCounts[item.s] || 0;
    const percentage = totalProjects > 0 ? Math.round((count / totalProjects) * 100) : 0;
    
    // Draw tiny stage indicator badge color representing state
    const dStyle = STAGE_DETAILS[item.s];
    if (dStyle) {
      if (item.s === ProjectStage.EJECUCION) doc.setFillColor(16, 185, 129);
      else if (item.s === ProjectStage.POR_INICIAR) doc.setFillColor(245, 158, 11);
      else if (item.s === ProjectStage.COMPLETADO) doc.setFillColor(100, 116, 139);
      else doc.setFillColor(139, 92, 246);
      doc.rect(marginX + 4, innerY - 2.5, 2.5, 2.5, 'F');
    }

    doc.setFont('Helvetica', 'bold');
    doc.text(item.name, marginX + 8, innerY);
    doc.setFont('Helvetica', 'normal');
    doc.text(item.desc, marginX + 55, innerY);
    doc.setFont('Helvetica', 'bold');
    doc.text(`${count}`, marginX + 130, innerY);
    doc.text(`${percentage}%`, marginX + 155, innerY);
    
    innerY += 5.5;
  });

  currentY += 45;

  // Involved Areas of Consultorsalud
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text('Distribución Operacional de Profesionales por Área', marginX, currentY);
  currentY += 6;

  // Let's create a visual box
  doc.setFillColor(255, 255, 255);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 48, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 48, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('OFICINA / DEPARTAMENTO TÉCNICO', marginX + 4, currentY + 5);
  doc.text('PROYECTOS ASOCIADOS', marginX + 85, currentY + 5);
  doc.text('ESTADO DE EQUIPO', marginX + 130, currentY + 5);

  doc.line(marginX, currentY + 8, pageWidth - marginX, currentY + 8);

  innerY = currentY + 13;
  doc.setFont('Helvetica', 'normal');

  // Print first 5 key areas for spacing constraints
  const printedAreas = involvedAreas.slice(0, 6);
  printedAreas.forEach((area) => {
    const areaProjs = projects.filter(p => p.areas.includes(area));
    const activeCount = areaProjs.filter(p => p.stage === ProjectStage.EJECUCION).length;
    
    doc.setFont('Helvetica', 'bold');
    // Truncate name if too long
    const cleanArea = area.length > 36 ? area.substring(0, 34) + '...' : area;
    doc.text(cleanArea, marginX + 4, innerY);

    doc.setFont('Helvetica', 'normal');
    doc.text(`${areaProjs.length} (${activeCount} en Ejecución)`, marginX + 85, innerY);
    
    // Status color - Green for normal active, red/burgundy for blocker
    const hasActiveBlockerInArea = areaProjs.some(p => p.hasBlocker);
    if (hasActiveBlockerInArea) {
      doc.setFillColor(153, 27, 27); // Dark Red
      doc.circle(marginX + 132, innerY - 1, 1, 'F');
      doc.setTextColor(153, 27, 27);
      doc.text('Crítico & Con Bloqueos', marginX + 135, innerY);
    } else {
      doc.setFillColor(16, 185, 129); // Emerald Green
      doc.circle(marginX + 132, innerY - 1, 1, 'F');
      doc.setTextColor(71, 85, 105); // Slate 600
      doc.text('Activo & Monitoreado', marginX + 135, innerY);
    }

    innerY += 6;
  });

  // End of page 1 info
  currentY += 60;
  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(8.5);
  doc.setTextColor(148, 163, 184);
  doc.text('* En la siguiente página se detalla la cartera completa de auditoría con sus hitos contractualmente obligatorios.', marginX, currentY);

  // ----------------------------------------------------
  // DRAW PAGE 2 (Detailed Project Directory)
  // ----------------------------------------------------
  doc.addPage();
  pageCount++;
  currentY = 20;
  drawHeaderAndFooter(doc, true);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('2. CARTERA DETALLADA DE CONSULTORÍAS', marginX, currentY);

  // Underline
  doc.setDrawColor(115, 0, 0); // Elegant Burgundy
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 2, marginX + 65, currentY + 2);
  
  currentY += 10;

  // Generate directory
  projects.forEach((proj, idx) => {
    // Check space before printing a full project block. Needs ~42mm 
    handlePageBreak(42);

    // Card frame
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252); // White or slate shade
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'D');

    // Title line
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(30, 41, 59);
    
    // Truncate name
    const titleName = proj.name.length > 50 ? proj.name.substring(0, 48) + '...' : proj.name;
    doc.text(`${idx + 1}. ${titleName}`, marginX + 4, currentY + 6);

    // Entity & Leader
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Entidad/IPS: ${proj.entity}`, marginX + 4, currentY + 11);
    doc.text(`Líder Técnico: ${proj.leader}`, marginX + 4, currentY + 15);
    doc.text(`Presupuesto: ${formatCOP(proj.budget)}`, marginX + 4, currentY + 19);

    // Start & End
    doc.text(`Inicio Contractual: ${proj.startDate}`, marginX + 90, currentY + 11);
    doc.text(`Fecha Entrega: ${proj.dueDate}`, marginX + 90, currentY + 15);
    doc.text(`Involucrados: ${proj.areas.length} Áreas del equipo`, marginX + 90, currentY + 19);

    // Draw visual progress bar
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Avance: ${proj.progress}%`, marginX + 152, currentY + 11);

    // Bar background
    doc.setFillColor(226, 232, 240);
    doc.rect(marginX + 152, currentY + 13, 20, 3.5, 'F');
    // Progress fill
    doc.setFillColor(16, 185, 129); // Green
    doc.rect(marginX + 152, currentY + 13, (proj.progress / 100) * 20, 3.5, 'F');

    // Stage Badge tag - Dynamic, readable corporate coloring per stage
    const stageStr = STAGE_DETAILS[proj.stage]?.label || proj.stage;
    if (proj.stage === ProjectStage.EJECUCION) {
      doc.setFillColor(209, 250, 229); // Light green bg
      doc.setTextColor(6, 95, 70); // Deep forest green text
    } else if (proj.stage === ProjectStage.COMPLETADO) {
      doc.setFillColor(241, 245, 249); // Light gray slate bg
      doc.setTextColor(51, 65, 85); // Slate 700 text
    } else if (proj.stage === ProjectStage.POR_INICIAR) {
      doc.setFillColor(254, 243, 199); // Light amber bg
      doc.setTextColor(146, 64, 14); // Dark amber text
    } else if (proj.hasBlocker || proj.stage === ProjectStage.PAUSA) {
      doc.setFillColor(254, 226, 226); // Light rose/red bg
      doc.setTextColor(153, 27, 27); // Dark red text
    } else {
      doc.setFillColor(237, 233, 254); // Light purple bg
      doc.setTextColor(91, 33, 182); // Deep purple text
    }
    doc.rect(marginX + 152, currentY + 20, 22, 5, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(stageStr, marginX + 153.5, currentY + 23.5);

    // Blocker or milestone alert status line at the bottom of the card
    doc.setLineWidth(0.3);
    doc.line(marginX + 2, currentY + 27, pageWidth - marginX - 2, currentY + 27);

    // Draw alerts
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    if (proj.hasBlocker) {
      doc.setTextColor(153, 27, 27); // High contrast dark red danger
      doc.setFont('Helvetica', 'bold');
      const blockerText = proj.blockerDescription ? `BLOQUEO: ${proj.blockerDescription}` : 'BLOQUEADO: Esperando respuesta técnica';
      doc.text(blockerText.substring(0, 85), marginX + 4, currentY + 31.5);
    } else {
      const completedMiles = proj.milestones.filter(m => m.completed).length;
      doc.setTextColor(100, 116, 139);
      doc.text(`Hitos obligatorios: Completados ${completedMiles} de ${proj.milestones.length} obligaciones contractuales.`, marginX + 4, currentY + 31.5);
    }

    currentY += 40;
  });

  // ----------------------------------------------------
  // DRAW PAGE 3 (Follow-Up, Committee sessions)
  // ----------------------------------------------------
  // Check if we have follow-ups to print
  if (followUps.length > 0) {
    doc.addPage();
    pageCount++;
    currentY = 20;
    drawHeaderAndFooter(doc, true);

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('3. SEGUIMIENTOS Y COMITÉS REGISTRADOS', marginX, currentY);

    // Underline
    doc.setDrawColor(115, 0, 0); // Elegant burgundy
    doc.setLineWidth(0.8);
    doc.line(marginX, currentY + 2, marginX + 68, currentY + 2);
    
    currentY += 10;

    followUps.forEach((elem, index) => {
      handlePageBreak(40);

      // Box wrapper
      doc.setFillColor(255, 255, 255);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 32, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 32, 'D');

      // Top Header of box
      doc.setFillColor(248, 250, 252); // Soft light slate background
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 7.5, 'F');
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(`Sesión #${index + 1}: ${elem.type.replace('_', ' ')}`, marginX + 4, currentY + 5);
      
      doc.setFontSize(8);
      doc.setTextColor(115, 0, 0); // Elegant burgundy text for contrast instead of vibrant red on gray
      doc.text(`Ref. Proyecto: ${elem.projectName}`, marginX + 85, currentY + 5);
      doc.text(`Fecha Oficial: ${elem.date}`, pageWidth - marginX - 45, currentY + 5);

      doc.setLineWidth(0.4);
      doc.setDrawColor(203, 213, 225);
      doc.line(marginX, currentY + 7.5, pageWidth - marginX, currentY + 7.5);

      // Topics & Agreements
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Temas Principales Discutidos:', marginX + 4, currentY + 13);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      
      const topicText = elem.topics.length > 100 ? elem.topics.substring(0, 97) + '...' : elem.topics;
      doc.text(topicText, marginX + 4, currentY + 17, { maxWidth: 175 });

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(71, 85, 105);
      doc.text('Acuerdos de Ejecución Obligatoria:', marginX + 4, currentY + 23);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(15, 23, 42);

      const agreementText = elem.agreements.length > 100 ? elem.agreements.substring(0, 97) + '...' : elem.agreements;
      doc.text(agreementText, marginX + 4, currentY + 27, { maxWidth: 175 });

      currentY += 37;
    });
  }

  // Final document generation confirmation
  doc.save(`Consultorsalud_Reporte_Proyectos_2026.pdf`);
}

export function generateProjectPDF(project: Project, followUps: ProjectFollowUp[] = []) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  let pageCount = 1;
  let currentY = 15;
  const today = new Date('2026-06-19');

  const formatCOP = (val: number) => {
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  const drawHeaderAndFooter = (pdfDoc: jsPDF) => {
    // Top colored indicator line
    pdfDoc.setFillColor(115, 0, 0); // Burgundy Red #730000
    pdfDoc.rect(0, 0, pageWidth, 4, 'F');

    // Header Metadata
    pdfDoc.setFont('Helvetica', 'bold');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(100, 116, 139); // Slate 500
    pdfDoc.text('CONSULTORSALUD SAS © 2026', marginX, 10);
    
    pdfDoc.setFont('Helvetica', 'normal');
    pdfDoc.text('REPORTE EJECUTIVO DE PROYECTO', pageWidth - marginX - 60, 10, { align: 'left' });

    // Header Separator line
    pdfDoc.setDrawColor(226, 232, 240); // Slate 200
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(marginX, 12, pageWidth - marginX, 12);

    // Footer
    pdfDoc.setFont('Helvetica', 'normal');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(148, 163, 184); // Slate 400
    pdfDoc.text('Informe individual de consultoría e hitos sectoriales.', marginX, pageHeight - 10);
    pdfDoc.text(`Pág. ${pageCount}`, pageWidth - marginX - 10, pageHeight - 10);
  };

  const handlePageBreak = (neededLines: number) => {
    if (currentY + neededLines > pageHeight - 18) {
      doc.addPage();
      pageCount++;
      currentY = 20;
      drawHeaderAndFooter(doc);
    }
  };

  drawHeaderAndFooter(doc);
  
  // Executive Title
  currentY += 10;
  doc.setFillColor(248, 250, 252); // Slate 50
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'F');
  doc.setDrawColor(226, 232, 240); // Slate 200
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(project.name.toUpperCase(), marginX + 6, currentY + 10);
  
  doc.setFontSize(10);
  doc.setTextColor(115, 0, 0); // Burgundy #730000
  doc.text(`ENTIDAD CONTRATANTE: ${project.entity.toUpperCase()}`, marginX + 6, currentY + 18);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Líder Técnico Asignado: ${project.leader}`, marginX + 6, currentY + 26);
  doc.text(`Estado del Proyecto: ${project.stage.replace('_', ' ')} (${project.progress}% de avance)`, marginX + 6, currentY + 31);

  currentY += 45;

  // Project KPIs Section
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. INFORMACIÓN COMPLEMENTARIA Y CRONOGRAMA', marginX, currentY);
  
  doc.setDrawColor(115, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);
  
  currentY += 6;

  // Render KPI boxes
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, 56, 18, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PRESUPUESTO CONTRACTUAL', marginX + 4, currentY + 5);
  doc.setFontSize(11);
  doc.setTextColor(115, 0, 0);
  doc.text(formatCOP(project.budget), marginX + 4, currentY + 12);

  doc.setFillColor(241, 245, 249);
  doc.rect(marginX + 62, currentY, 56, 18, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('FECHA CONSTITUCIÓN / FINAL', marginX + 66, currentY + 5);
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(`${project.startDate} / ${project.dueDate}`, marginX + 66, currentY + 12);

  doc.setFillColor(241, 245, 249);
  doc.rect(marginX + 124, currentY, 56, 18, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('INCIDENTES Y BLOQUEOS', marginX + 128, currentY + 5);
  doc.setFontSize(9);
  if (project.hasBlocker) {
    doc.setTextColor(220, 38, 38);
  } else {
    doc.setTextColor(100, 116, 139);
  }
  doc.text(project.hasBlocker ? '⚠️ BLOQUEO ACTIVO' : '✓ SIN ALERTAS', marginX + 128, currentY + 12);

  currentY += 26;

  // Description / Notes
  handlePageBreak(30);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('DESCRIPCIÓN DEL PROYECTO', marginX, currentY);
  currentY += 4;
  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const descLines = doc.splitTextToSize(project.description || 'No hay descripción registrada.', pageWidth - (marginX * 2));
  doc.text(descLines, marginX, currentY);
  currentY += (descLines.length * 4) + 6;

  if (project.notes) {
    handlePageBreak(30);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('NOTAS Y BITÁCORA INTERNA DE LA CONSULTORÍA', marginX, currentY);
    currentY += 4;
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const notesLines = doc.splitTextToSize(project.notes, pageWidth - (marginX * 2));
    doc.text(notesLines, marginX, currentY);
    currentY += (notesLines.length * 4) + 6;
  }

  // Milestones / Deliverables
  handlePageBreak(40);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. HITOS OBLIGATORIOS Y COMPROMISOS', marginX, currentY);
  
  doc.setDrawColor(115, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);
  
  currentY += 8;

  if (project.milestones.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('FECHA LÍMITE', marginX + 2, currentY);
    doc.text('ENTREGABLE / HITOS', marginX + 32, currentY);
    doc.text('ÁREA / RESPONSABLE', marginX + 115, currentY);
    doc.text('ESTADO', marginX + 165, currentY);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY + 2.5, pageWidth - marginX, currentY + 2.5);
    currentY += 6.5;

    project.milestones.forEach((m, idx) => {
      handlePageBreak(12);
      
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(m.dueDate, marginX + 2, currentY);
      
      doc.setFont('Helvetica', 'normal');
      const titleLines = doc.splitTextToSize(m.title, 75);
      doc.text(titleLines, marginX + 32, currentY);

      const areaResponsible = `${m.area || 'General'}${m.assignedPerson ? ` (${m.assignedPerson})` : ''}`;
      const resLines = doc.splitTextToSize(areaResponsible, 45);
      doc.text(resLines, marginX + 115, currentY);

      doc.setFont('Helvetica', 'bold');
      if (m.completed) {
        doc.setTextColor(16, 185, 129); // Green
        doc.text('COMPLETADO ✓', marginX + 165, currentY);
      } else {
        const isOverdueMilestone = new Date(m.dueDate) < today;
        if (isOverdueMilestone) {
          doc.setTextColor(220, 38, 38); // Red
          doc.text('VENCIDO ⚠️', marginX + 165, currentY);
        } else {
          doc.setTextColor(217, 119, 6); // Amber
          doc.text('PENDIENTE ⏳', marginX + 165, currentY);
        }
      }

      const rowsCount = Math.max(titleLines.length, resLines.length);
      currentY += (rowsCount * 3.5) + 3;

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.25);
      doc.line(marginX, currentY - 1.5, pageWidth - marginX, currentY - 1.5);
    });
    currentY += 4;
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text('No hay hitos programados en este proyecto.', marginX, currentY);
    currentY += 8;
  }

  // Issues and Incidentes Log
  if (project.issues && project.issues.length > 0) {
    handlePageBreak(40);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('3. REGISTRO DE INCIDENTES Y BLOQUEOS', marginX, currentY);
    
    doc.setDrawColor(115, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);
    
    currentY += 8;

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('FECHA', marginX + 2, currentY);
    doc.text('DESCRIPCIÓN DEL INCIDENTE', marginX + 32, currentY);
    doc.text('ESTADO OPERATIVO', marginX + 155, currentY);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY + 2.5, pageWidth - marginX, currentY + 2.5);
    currentY += 6.5;

    project.issues.forEach(iss => {
      handlePageBreak(12);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(iss.date, marginX + 2, currentY);

      doc.setFont('Helvetica', 'normal');
      const descLines = doc.splitTextToSize(iss.description, 115);
      doc.text(descLines, marginX + 32, currentY);

      doc.setFont('Helvetica', 'bold');
      if (iss.resolved) {
        doc.setTextColor(16, 185, 129);
        doc.text('SOLUCIONADO ✓', marginX + 155, currentY);
      } else {
        doc.setTextColor(220, 38, 38);
        doc.text('ACTIVO BLOQUEADO ⚠️', marginX + 155, currentY);
      }

      currentY += (descLines.length * 3.5) + 3;

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.25);
      doc.line(marginX, currentY - 1.5, pageWidth - marginX, currentY - 1.5);
    });
    currentY += 4;
  }

  // Linked meetings
  const linkedMeetings = followUps.filter(f => f.projectId === project.id);
  if (linkedMeetings.length > 0) {
    handlePageBreak(40);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('4. REUNIONES DE SEGUIMIENTO Y ACTAS DE COMITÉ', marginX, currentY);
    
    doc.setDrawColor(115, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);
    
    currentY += 8;

    linkedMeetings.forEach((meeting, ind) => {
      handlePageBreak(25);
      doc.setFillColor(248, 250, 252);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 22, 'F');
      doc.setDrawColor(226, 232, 240);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 22, 'D');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`Comité #${ind+1}: ${meeting.type.replace('_', ' ')}`, marginX + 4, currentY + 5);
      doc.setFontSize(8);
      doc.setTextColor(115, 0, 0);
      doc.text(`Fecha: ${meeting.date}`, pageWidth - marginX - 35, currentY + 5);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const topWords = `Temas: ${meeting.topics.length > 80 ? meeting.topics.substring(0, 77) + '...' : meeting.topics}`;
      const agrWords = `Acuerdos: ${meeting.agreements.length > 80 ? meeting.agreements.substring(0, 77) + '...' : meeting.agreements}`;
      
      doc.text(doc.splitTextToSize(topWords, 172), marginX + 4, currentY + 11);
      doc.text(doc.splitTextToSize(agrWords, 172), marginX + 4, currentY + 17);

      currentY += 26;
    });
  }

  doc.save(`Acta_Individual_${project.entity.replace(/\s+/g, '_')}_2026.pdf`);
}

export function generateAreaPDFReport(areaName: string, projects: Project[]) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 15;
  let pageCount = 1;
  let currentY = 15;
  const today = new Date('2026-06-19');

  const formatCOP = (val: number) => {
    return `$${val.toLocaleString('es-CO')} COP`;
  };

  const drawHeaderAndFooter = (pdfDoc: jsPDF) => {
    pdfDoc.setFillColor(30, 41, 59); // Dark blue / Slate 800
    pdfDoc.rect(0, 0, pageWidth, 4, 'F');

    pdfDoc.setFont('Helvetica', 'bold');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(100, 116, 139);
    pdfDoc.text('CONSULTORSALUD SAS © 2026', marginX, 10);
    
    pdfDoc.setFont('Helvetica', 'normal');
    pdfDoc.text('INFORME DIAGNÓSTICO TÉCNICO DE ÁREA', pageWidth - marginX - 65, 10, { align: 'left' });

    pdfDoc.setDrawColor(226, 232, 240);
    pdfDoc.setLineWidth(0.5);
    pdfDoc.line(marginX, 12, pageWidth - marginX, 12);

    pdfDoc.setFont('Helvetica', 'normal');
    pdfDoc.setFontSize(8);
    pdfDoc.setTextColor(148, 163, 184);
    pdfDoc.text(`Panel de control unificado - Departamento Técnico Consultorsalud.`, marginX, pageHeight - 10);
    pdfDoc.text(`Pág. ${pageCount}`, pageWidth - marginX - 10, pageHeight - 10);
  };

  const handlePageBreak = (neededLines: number) => {
    if (currentY + neededLines > pageHeight - 18) {
      doc.addPage();
      pageCount++;
      currentY = 20;
      drawHeaderAndFooter(doc);
    }
  };

  drawHeaderAndFooter(doc);

  // Big Area Header Box
  currentY += 10;
  doc.setFillColor(248, 250, 252);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(marginX, currentY, pageWidth - (marginX * 2), 35, 'D');

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(areaName.toUpperCase(), marginX + 6, currentY + 11);

  doc.setFontSize(9);
  doc.setTextColor(115, 0, 0); // Burgundy color
  doc.text(`INFORME CONSOLIDADO DE GESTIÓN, HITOS Y ESPECIALISTAS`, marginX + 6, currentY + 18);

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Área de especialidad técnica consultora activa de Consultorsalud.`, marginX + 6, currentY + 26);
  doc.text(`Fecha del Reporte Base: 19 de Junio, 2026`, marginX + 6, currentY + 31);

  currentY += 45;

  // Filter projects associated to this area
  const linkedProjects = projects.filter(p => p.areas.includes(areaName));
  const totalAreaProjects = linkedProjects.length;
  const aggBudget = linkedProjects.reduce((sum, p) => sum + p.budget, 0);
  
  // Calculate average progress
  const avgProgress = totalAreaProjects > 0
    ? Math.round(linkedProjects.reduce((sum, p) => sum + p.progress, 0) / totalAreaProjects)
    : 0;

  // Extract milestones specific to this area in these projects
  const areaMilestones = linkedProjects.flatMap(p => 
    p.milestones.map(m => ({ ...m, project: p }))
  ).filter(m => m.area === areaName);

  // Stats Layout
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('1. MÉTRICAS OPERATIVAS DE ÁREA', marginX, currentY);

  doc.setDrawColor(115, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);

  currentY += 8;

  // Rect stats
  doc.setFillColor(241, 245, 249);
  doc.rect(marginX, currentY, 56, 18, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PROYECTOS VINCULADOS', marginX + 4, currentY + 5);
  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59);
  doc.text(`${totalAreaProjects} Proyectos`, marginX + 4, currentY + 12);

  doc.setFillColor(241, 245, 249);
  doc.rect(marginX + 62, currentY, 56, 18, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('PRESUPUESTO BAJO OPERACIÓN', marginX + 66, currentY + 5);
  doc.setFontSize(9);
  doc.setTextColor(115, 0, 0);
  doc.text(formatCOP(aggBudget), marginX + 66, currentY + 12);

  doc.setFillColor(241, 245, 249);
  doc.rect(marginX + 124, currentY, 56, 18, 'F');
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('AVANCE PROMEDIO PROYECTOS', marginX + 128, currentY + 5);
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  doc.text(`${avgProgress}% Completado`, marginX + 128, currentY + 12);

  currentY += 26;

  // Specialists list
  const specialists = [
    'Dr. Jaime Delgado', 'Dra. Carolina Méndez', 'Ing. Roberto Solano', 'Dra. Patricia Restrepo',
    'Ing. Sandra Alzate', 'Ing. Carlos Pérez', 'Ing. Alejandro Torres', 'Ing. Natalia Castro',
    'Abg. Felipe Morales', 'Abg. Diana Quintero', 'Abg. Sergio Hoyos', 'Eco. Martha Lucía Gómez'
  ].filter(person => {
    // Basic match mapping to simplify finding who belongs to each pre-defined area
    const mapping: Record<string, string[]> = {
      'Consultoría Técnica y Auditoría': ['Dr. Jaime Delgado', 'Dra. Carolina Méndez', 'Ing. Roberto Solano', 'Dra. Patricia Restrepo'],
      'TI y Salud Digital': ['Ing. Sandra Alzate', 'Ing. Carlos Pérez', 'Ing. Alejandro Torres', 'Ing. Natalia Castro'],
      'Jurídico y Regulación': ['Abg. Felipe Morales', 'Abg. Diana Quintero', 'Abg. Sergio Hoyos'],
      'Financiera y Tarifas': ['Eco. Martha Lucía Gómez']
    };
    return (mapping[areaName] || []).includes(person);
  });

  handlePageBreak(35);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PLANTA DE ESPECIALISTAS Y PROFESIONALES', marginX, currentY);
  
  doc.setDrawColor(115, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);
  
  currentY += 8;

  if (specialists.length > 0) {
    specialists.forEach((person) => {
      handlePageBreak(12);
      doc.setFillColor(255, 255, 255);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 10, 'F');
      doc.setDrawColor(241, 245, 249);
      doc.rect(marginX, currentY, pageWidth - (marginX * 2), 10, 'D');

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(30, 41, 59);
      doc.text(`• ${person}`, marginX + 4, currentY + 6.5);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Especialista Consolidado Sectorial', pageWidth - marginX - 60, currentY + 6.5);
      
      currentY += 12;
    });
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay especialistas fijos registrados en el área actual.', marginX, currentY);
    currentY += 12;
  }

  // Project Detail tables
  handlePageBreak(40);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('3. DESGLOSE DE PROYECTOS EN COMISIÓN', marginX, currentY);
  
  doc.setDrawColor(115, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);
  
  currentY += 8;

  if (linkedProjects.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('ENTIDAD', marginX + 2, currentY);
    doc.text('NOMBRE DEL PROYECTO', marginX + 32, currentY);
    doc.text('LÍDER TÉCNICO', marginX + 112, currentY);
    doc.text('PRESUPUESTO', marginX + 147, currentY);
    doc.text('AVANCE', marginX + 180, currentY);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY + 2.5, pageWidth - marginX, currentY + 2.5);
    currentY += 6.5;

    linkedProjects.forEach(p => {
      handlePageBreak(12);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(115, 0, 0);
      doc.text(p.entity, marginX + 2, currentY);

      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const nameLines = doc.splitTextToSize(p.name, 75);
      doc.text(nameLines, marginX + 32, currentY);

      doc.text(p.leader, marginX + 112, currentY);
      doc.text(formatCOP(p.budget), marginX + 147, currentY);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`${p.progress}%`, marginX + 180, currentY);

      currentY += (nameLines.length * 3.5) + 3;

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.25);
      doc.line(marginX, currentY - 1.5, pageWidth - marginX, currentY - 1.5);
    });
    currentY += 4;
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay proyectos vinculados a esta especialidad técnica.', marginX, currentY);
    currentY += 8;
  }

  // Area Milestones
  handlePageBreak(40);
  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('4. DIAGNÓSTICO EN DETALLE DE HITOS DEL ÁREA', marginX, currentY);
  
  doc.setDrawColor(115, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(marginX, currentY + 1.5, marginX + 45, currentY + 1.5);
  
  currentY += 8;

  if (areaMilestones.length > 0) {
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('PROYECTO', marginX + 2, currentY);
    doc.text('TÍTULO DEL HITO / REQUERIMIENTO', marginX + 37, currentY);
    doc.text('FECHA LÍMITE', marginX + 122, currentY);
    doc.text('RESPONSABLE', marginX + 152, currentY);
    doc.text('ESTADO', marginX + 180, currentY);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(marginX, currentY + 2.5, pageWidth - marginX, currentY + 2.5);
    currentY += 6.5;

    areaMilestones.forEach(m => {
      handlePageBreak(12);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text(m.project.entity, marginX + 2, currentY);

      doc.setFont('Helvetica', 'normal');
      const titleLines = doc.splitTextToSize(m.title, 82);
      doc.text(titleLines, marginX + 37, currentY);

      doc.text(m.dueDate, marginX + 122, currentY);
      doc.text(m.assignedPerson || 'Área General', marginX + 152, currentY);

      doc.setFont('Helvetica', 'bold');
      if (m.completed) {
        doc.setTextColor(16, 185, 129);
        doc.text('✓ HECHO', marginX + 180, currentY);
      } else {
        if (new Date(m.dueDate) < today) {
          doc.setTextColor(220, 38, 38);
          doc.text('⚠️ EXPIRADO', marginX + 180, currentY);
        } else {
          doc.setTextColor(217, 119, 6);
          doc.text('⏳ EN COLA', marginX + 180, currentY);
        }
      }

      currentY += (titleLines.length * 3.5) + 3;

      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.25);
      doc.line(marginX, currentY - 1.5, pageWidth - marginX, currentY - 1.5);
    });
  } else {
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay hitos técnicos específicos registrados para esta área.', marginX, currentY);
  }

  doc.save(`Diagnostico_Area_${areaName.replace(/\s+/g, '_')}_2026.pdf`);
}

