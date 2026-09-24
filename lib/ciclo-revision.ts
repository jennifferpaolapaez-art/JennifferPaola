/* ── CICLO DE REVISIÓN PERIÓDICA (Sesión 6, paso 7 / 6f) ──

   Orquesta lo que YA existe — evaluación, historial de habilidades, Plan Individual, propuesta
   multi-área, `ChildReport` — en un solo flujo con ancla explícita: Evaluación periódica → revisión
   de Plan Individual → nuevas prioridades → Reporte de Resultados del periodo → cierre. Casi nada
   de la lógica pedagógica es nueva aquí: este archivo decide CUÁNDO y CON QUÉ DATOS se llama a lo
   que ya estaba construido, y guarda el ancla (`CicloRevisionPeriodica`) para que el proceso —que
   puede tomar varios días de trabajo de la maestra— se pueda reanudar exactamente donde quedó.

   Regla de oro (igual que 6e-2): sin IA real, afirmaciones estructurales y conservadoras, siempre
   citando su evidencia. RAÍZ nunca decide sola: aprobar la evaluación, cerrar/continuar una meta,
   crear un Plan nuevo y aprobar el Reporte son SIEMPRE acciones explícitas de la maestra. */

import {
  FECHA_HOY,
  SKILLS_CATALOG,
  ASSESSMENT_TEMPLATE_SKILLS,
  describirEstadoSkill,
  edadEnMeses,
  estadoRegistroObservacion,
  frecuenciaEvaluacionEfectiva,
  generarIdNino,
  metaEstaActiva,
  metasActivasDeNino,
  plantillasAplicables,
  type EstadosSkill,
  type EventoSkill,
  type EvaluacionNino,
  type FrecuenciaEvaluacion,
  type MetaIndividual,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type PlanIndividual,
  type ProgramaConfig,
  type ResultadoEvaluacion,
  type TrackOpcional,
} from './seed-data';
import { habilidadesAceptadasDeObservacion, prettyDominio } from './registro-mensual';
import { fechaCorta } from './prioridades';
import { type ChildReport, type InformeAssertion, guardarUnChildReport, leerChildReports } from './informe-mensual';

/* ── EL ANCLA DEL CICLO ── */

export type EstadoCiclo = 'en_progreso' | 'cerrado';
export type DecisionSiguientePlan = 'no_necesita' | 'sigue_observando' | 'plan_nuevo';

export interface CicloRevisionPeriodica {
  id: string;
  ninoId: string;
  /** Fecha PEDAGÓGICA de inicio del periodo — el cierre del ciclo anterior, o el punto de partida
   * si es el primero (ver `fechaReferenciaProximoCiclo`). */
  periodoInicio: string;
  /** Fecha PEDAGÓGICA de cierre del periodo — SIEMPRE la fecha en que se aprobó la evaluación de
   * ESTE ciclo (`evaluacionActual.aprobadaEn`), nunca la fecha en que se terminó de tramitar el
   * resto del flujo (eso es `cerradoEn`). La próxima evaluación se calcula desde aquí, nunca desde
   * `cerradoEn` (regla del usuario, 6f corrección 1). Ausente hasta que se aprueba la evaluación. */
  periodoFin?: string;
  /** Evaluación (de ingreso o periódica) que cerró el ciclo ANTERIOR — referencia, no se toca. */
  evaluacionAnteriorId?: string;
  /** Evaluación periódica de ESTE ciclo — se llena al generar el borrador (Paso 2). */
  evaluacionActualId?: string;
  /** Cache derivada de `revisionMetasCompleta()` — se recalcula y persiste cada vez que se toca una
   * meta desde este ciclo; la fuente de verdad real siempre es el historial de las metas (nunca al
   * revés), así que nunca puede desincronizarse en silencio. */
  revisionMetasCompletada: boolean;
  decisionSiguientePlan?: DecisionSiguientePlan;
  planNuevoId?: string;
  reporteResultadosId?: string;
  estado: EstadoCiclo;
  creadoEn: string;
  cerradoEn?: string;
}

/** Los 9 pasos del flujo (Paso 1 = crear/reanudar, ya resuelto por `cicloEnProgresoDeNino` antes de
 * llegar aquí) — SIEMPRE derivado de los campos del ciclo, nunca guardado aparte, para que no pueda
 * desincronizarse de lo que realmente pasó. */
export type PasoCiclo = 'preparar_evaluacion' | 'revisar_evaluacion' | 'revisar_metas' | 'nuevas_prioridades' | 'preparar_reporte' | 'revisar_reporte' | 'cerrar' | 'cerrado';

const CICLOS_STORAGE_KEY = 'raiz_ciclos_revision';

export function leerCiclosRevision(): CicloRevisionPeriodica[] {
  if (typeof window === 'undefined') return [];
  try {
    const guardado = window.localStorage.getItem(CICLOS_STORAGE_KEY);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado) as CicloRevisionPeriodica[];
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

export function guardarCiclosRevision(ciclos: CicloRevisionPeriodica[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CICLOS_STORAGE_KEY, JSON.stringify(ciclos));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

export function guardarUnCiclo(ciclo: CicloRevisionPeriodica): CicloRevisionPeriodica {
  const ciclos = leerCiclosRevision();
  const actualizados = ciclos.some((c) => c.id === ciclo.id) ? ciclos.map((c) => (c.id === ciclo.id ? ciclo : c)) : [...ciclos, ciclo];
  guardarCiclosRevision(actualizados);
  return ciclo;
}

export function ciclosDeNino(ninoId: string, ciclos: CicloRevisionPeriodica[] = leerCiclosRevision()): CicloRevisionPeriodica[] {
  return ciclos.filter((c) => c.ninoId === ninoId).sort((a, b) => a.creadoEn.localeCompare(b.creadoEn));
}

export function cicloPorId(id: string, ciclos: CicloRevisionPeriodica[] = leerCiclosRevision()): CicloRevisionPeriodica | undefined {
  return ciclos.find((c) => c.id === id);
}

/** El ciclo `en_progreso` de este niño, si existe — antes de ofrecer "Preparar evaluación" hay que
 * comprobar esto: si ya hay uno, se reanuda, nunca se empieza otro (regla del usuario, validación 2). */
export function cicloEnProgresoDeNino(ninoId: string, ciclos: CicloRevisionPeriodica[] = leerCiclosRevision()): CicloRevisionPeriodica | undefined {
  return ciclosDeNino(ninoId, ciclos).find((c) => c.estado === 'en_progreso');
}

export function ultimoCicloCerradoDeNino(ninoId: string, ciclos: CicloRevisionPeriodica[] = leerCiclosRevision()): CicloRevisionPeriodica | undefined {
  const cerrados = ciclosDeNino(ninoId, ciclos).filter((c) => c.estado === 'cerrado' && c.periodoFin);
  if (cerrados.length === 0) return undefined;
  return cerrados.reduce((a, b) => (b.periodoFin! > a.periodoFin! ? b : a));
}

/* ── QUÉ EVALUACIÓN DEFINE EL PERIODO (6f corrección 2 y 3) ── */

export function ultimaEvaluacionIngresoAprobada(nino: Nino): EvaluacionNino | undefined {
  return nino.evaluaciones.find((e) => e.tipo === 'ingreso' && e.estado === 'aprobada');
}

/** Referencia PEDAGÓGICA para calcular la próxima revisión formal — NUNCA la última evaluación
 * aprobada genérica (eso incluiría una evaluación fuera de ciclo y movería la fecha en silencio,
 * justo lo que el usuario pidió evitar). Orden: (1) `periodoFin` del último ciclo CERRADO; si no
 * hay (2) la evaluación de INGRESO aprobada; si no hay (3) `fechaIngreso`. */
export function fechaReferenciaProximoCiclo(nino: Nino, ciclos: CicloRevisionPeriodica[] = leerCiclosRevision()): string {
  const ultimoCerrado = ultimoCicloCerradoDeNino(nino.id, ciclos);
  if (ultimoCerrado?.periodoFin) return ultimoCerrado.periodoFin;
  const ingreso = ultimaEvaluacionIngresoAprobada(nino);
  if (ingreso) return ingreso.aprobadaEn ?? ingreso.fecha;
  return nino.fechaIngreso;
}

/** La fecha formal de la próxima revisión periódica — mostrar SIEMPRE en tono neutro ("Revisión
 * prevista desde el 15 de septiembre" / "Revisión disponible"), nunca como alerta (regla del
 * usuario, 6f punto 5). */
export function calcularProximaRevisionFormal(nino: Nino, config: ProgramaConfig, ciclos: CicloRevisionPeriodica[] = leerCiclosRevision()): string {
  const { frecuencia, meses } = frecuenciaEvaluacionEfectiva(nino, config);
  const referencia = fechaReferenciaProximoCiclo(nino, ciclos);
  const d = new Date(`${referencia}T00:00:00`);
  const mesesSumar = frecuencia === 'trimestral' ? 3 : frecuencia === 'semestral' ? 6 : frecuencia === 'anual' ? 12 : (meses ?? 3);
  d.setMonth(d.getMonth() + mesesSumar);
  return d.toISOString().slice(0, 10);
}

/* ── CREAR / AVANZAR EL CICLO ── */

/** Crea un ciclo nuevo — solo llamar si `cicloEnProgresoDeNino` devolvió `undefined`. */
export function crearCiclo(nino: Nino, ciclos: CicloRevisionPeriodica[] = leerCiclosRevision()): CicloRevisionPeriodica {
  const anterior = ultimoCicloCerradoDeNino(nino.id, ciclos);
  const nuevo: CicloRevisionPeriodica = {
    id: `ciclo-${nino.id}-${Date.now()}`,
    ninoId: nino.id,
    periodoInicio: fechaReferenciaProximoCiclo(nino, ciclos),
    evaluacionAnteriorId: anterior?.evaluacionActualId,
    revisionMetasCompletada: false,
    estado: 'en_progreso',
    creadoEn: FECHA_HOY,
  };
  guardarUnCiclo(nuevo);
  return nuevo;
}

export function marcarEvaluacionActual(ciclo: CicloRevisionPeriodica, evaluacionId: string): CicloRevisionPeriodica {
  return guardarUnCiclo({ ...ciclo, evaluacionActualId: evaluacionId });
}

/** Se llama al aprobar la evaluación de este ciclo — fija `periodoFin` en la fecha PEDAGÓGICA
 * (aprobación de la evaluación), no en la fecha en que se termine el resto del trámite. */
export function marcarPeriodoFin(ciclo: CicloRevisionPeriodica, fechaAprobacion: string): CicloRevisionPeriodica {
  return guardarUnCiclo({ ...ciclo, periodoFin: fechaAprobacion });
}

/** Una meta cuenta como "revisada en este ciclo" si tiene una entrada de historial marcada con este
 * `cicloRevisionId` — nunca por fecha sola (6f corrección 2). Sin Plan activo, no hay nada que
 * revisar: `true` de inmediato (validación 8). */
export function revisionMetasCompleta(nino: Nino, cicloId: string): boolean {
  const plan = (nino.planesIndividuales ?? []).find((p) => p.estado === 'activo');
  if (!plan) return true;
  const activas = plan.metas.filter(metaEstaActiva);
  if (activas.length === 0) return true;
  return activas.every((m) => (m.historial ?? []).some((h) => h.cicloRevisionId === cicloId));
}

/** Recalcula y persiste el cache — llamar después de cualquier acción sobre una meta hecha desde
 * este ciclo (confirmar cambio o "dejar como está"). */
export function refrescarRevisionMetas(ciclo: CicloRevisionPeriodica, nino: Nino): CicloRevisionPeriodica {
  return guardarUnCiclo({ ...ciclo, revisionMetasCompletada: revisionMetasCompleta(nino, ciclo.id) });
}

export function marcarDecisionPlan(ciclo: CicloRevisionPeriodica, decision: DecisionSiguientePlan, planNuevoId?: string): CicloRevisionPeriodica {
  return guardarUnCiclo({ ...ciclo, decisionSiguientePlan: decision, planNuevoId });
}

export function marcarReporte(ciclo: CicloRevisionPeriodica, reporteId: string): CicloRevisionPeriodica {
  return guardarUnCiclo({ ...ciclo, reporteResultadosId: reporteId });
}

/** Cierra el ciclo — el trámite administrativo termina AQUÍ (`cerradoEn`), pero el periodo
 * pedagógico ya había cerrado antes, en `periodoFin` (6f corrección 1). Nada del ciclo se modifica
 * después de esto: el siguiente ciclo nace como un objeto nuevo. */
export function cerrarCiclo(ciclo: CicloRevisionPeriodica): CicloRevisionPeriodica {
  return guardarUnCiclo({ ...ciclo, estado: 'cerrado', cerradoEn: FECHA_HOY });
}

/** El plan (activo o archivado) que tiene al menos una meta revisada en ESTE ciclo — nunca se
 * asume "el plan activo ahora mismo", porque para cuando se genera el Reporte (Paso 5-6) el Plan de
 * este periodo puede ya estar archivado si la maestra decidió empezar uno nuevo en el Paso 4 (6f
 * corrección/punto 7: el Reporte describe el periodo que TERMINA, nunca lee el Plan nuevo). */
export function planDelCiclo(nino: Nino, cicloId: string): PlanIndividual | undefined {
  return (nino.planesIndividuales ?? []).find((p) => p.metas.some((m) => (m.historial ?? []).some((h) => h.cicloRevisionId === cicloId)));
}

export function pasoActualDeCiclo(ciclo: CicloRevisionPeriodica, nino: Nino): PasoCiclo {
  if (ciclo.estado === 'cerrado') return 'cerrado';
  if (!ciclo.evaluacionActualId) return 'preparar_evaluacion';
  const evaluacion = nino.evaluaciones.find((e) => e.id === ciclo.evaluacionActualId);
  if (!evaluacion || evaluacion.estado !== 'aprobada') return 'revisar_evaluacion';
  // Se deriva EN VIVO, nunca del cache — un niño sin Plan activo (o con todas sus metas ya
  // revisadas) debe poder avanzar aunque el cache todavía no se haya refrescado (ver
  // `revisionMetasCompleta`, punto 2 de la corrección del usuario).
  if (!revisionMetasCompleta(nino, ciclo.id)) return 'revisar_metas';
  if (!ciclo.decisionSiguientePlan) return 'nuevas_prioridades';
  if (!ciclo.reporteResultadosId) return 'preparar_reporte';
  const reporte = leerChildReports().find((r) => r.id === ciclo.reporteResultadosId);
  if (!reporte || reporte.estado !== 'aprobado') return 'revisar_reporte';
  return 'cerrar';
}

/* ── FILTRO DE SKILLS PARA LA EVALUACIÓN PERIÓDICA (6f punto 3 / corrección 3) ── */

/** Skills que entran al borrador de la evaluación periódica — nunca "todo el catálogo aplicable"
 * (eso es lo que hace `generarBorradorEvaluacion` para la de ingreso, y ahí SÍ tiene sentido: es la
 * primera vez). Entra por CUALQUIERA de: nueva por edad/etapa actual; estado actual En desarrollo;
 * evidencia profesional aprobada nueva desde la referencia; `politicaRevision` de seguimiento
 * periódico o continuo; ligada a una meta activa; marcada a mano por la maestra
 * (`Skill.marcadaParaSeguimiento`); o evidencia `contradictoria` (esto es lo único que puede volver
 * a traer una `una_vez_dominado` ya dominada — nunca la degrada sola, solo la vuelve a poner sobre
 * la mesa). */
export function skillsParaRevisionPeriodica(nino: Nino, tracksActivos: TrackOpcional[], fechaReferencia: string, observaciones: Observacion[], relaciones: ObservacionSkill[]): Set<string> {
  const plantillas = plantillasAplicables(nino.etapa, tracksActivos);
  const skillIdsAplicables = new Set(ASSESSMENT_TEMPLATE_SKILLS.filter((ts) => plantillas.some((p) => p.id === ts.assessmentTemplateId)).map((ts) => ts.skillId));
  const skillIdsConMetaActiva = new Set(metasActivasDeNino(nino).map((m) => m.skillId).filter((x): x is string => !!x));
  const observacionesAprobadasNinoDesde = observaciones.filter((o) => o.ninoId === nino.id && o.fecha > fechaReferencia && estadoRegistroObservacion(o) === 'profesional_aprobada');
  const skillIdsConEvidenciaNueva = new Set(observacionesAprobadasNinoDesde.flatMap((o) => habilidadesAceptadasDeObservacion(o.id, relaciones).map((h) => h.skillId)));

  const resultado = new Set<string>();
  for (const skillId of skillIdsAplicables) {
    const catalogo = SKILLS_CATALOG.find((c) => c.id === skillId);
    const actual = nino.skills.find((s) => s.id === skillId);
    const nuevaPorEdad = !actual;
    const enDesarrollo = actual?.estadoDesarrollo === 'en_desarrollo';
    const evidenciaContradictoria = actual?.estadoEvidencia === 'contradictoria';
    const seguimientoPolitica = catalogo?.politicaRevision === 'seguimiento_periodico' || catalogo?.politicaRevision === 'desarrollo_continuo';
    const ligadaAMeta = skillIdsConMetaActiva.has(skillId);
    const marcadaAMano = !!actual?.marcadaParaSeguimiento;
    const evidenciaNueva = skillIdsConEvidenciaNueva.has(skillId);
    if (nuevaPorEdad || enDesarrollo || evidenciaContradictoria || seguimientoPolitica || ligadaAMeta || marcadaAMano || evidenciaNueva) {
      resultado.add(skillId);
    }
    // Dominada + `una_vez_dominado` sin evidencia contradictoria: NO entra — es exactamente el
    // caso que ninguna de las condiciones de arriba cubre, así que queda excluida sin necesitar
    // una regla de exclusión explícita.
  }
  return resultado;
}

/** Como `generarBorradorEvaluacion`, pero restringido al set filtrado — y estampa `cicloRevisionId`
 * para que esta evaluación quede ligada inequívocamente al ciclo que la generó (6f corrección 2). */
export function generarBorradorEvaluacionPeriodica(
  nino: Nino,
  tracksActivos: TrackOpcional[],
  cicloId: string,
  fechaReferencia: string,
  observaciones: Observacion[],
  relaciones: ObservacionSkill[]
): EvaluacionNino {
  const edadMeses = edadEnMeses(nino.fechaNacimiento);
  const skillIds = skillsParaRevisionPeriodica(nino, tracksActivos, fechaReferencia, observaciones, relaciones);
  const plantillas = plantillasAplicables(nino.etapa, tracksActivos);
  const resultados: ResultadoEvaluacion[] = [];
  const vistos = new Set<string>();
  for (const plantilla of plantillas) {
    const skillsPlantilla = ASSESSMENT_TEMPLATE_SKILLS.filter((s) => s.assessmentTemplateId === plantilla.id).sort((a, b) => a.orden - b.orden);
    for (const ts of skillsPlantilla) {
      if (vistos.has(ts.skillId) || !skillIds.has(ts.skillId)) continue;
      vistos.add(ts.skillId);
      const actual = nino.skills.find((s) => s.id === ts.skillId);
      resultados.push({
        id: `res-${generarIdNino()}-${ts.skillId}`,
        skillId: ts.skillId,
        assessmentTemplateId: plantilla.id,
        estadoDesarrollo: actual?.estadoDesarrollo ?? 'desconocido',
        estadoEvidencia: actual?.estadoEvidencia ?? 'no_observado',
        sugeridoPorRaiz: !!actual,
        editadoPorMaestra: false,
      });
    }
  }
  return {
    id: `eval-${generarIdNino()}`,
    tipo: 'periodica',
    fecha: FECHA_HOY,
    estado: 'borrador',
    edadAlMomentoMeses: edadMeses,
    etapaAlMomento: nino.etapa,
    resultados,
    cicloRevisionId: cicloId,
  };
}

/* ── REPORTE DE RESULTADOS DEL PERIODO ── */

export interface ContenidoReporteResultados {
  ninoId: string;
  cicloRevisionId: string;
  periodoInicio: string;
  periodoFin: string;
  edadAlFinalMeses: number;
  fortalezas: InformeAssertion[];
  cambiosConfirmados: InformeAssertion[];
  areasEnDesarrollo: InformeAssertion[];
  metasCumplidas: InformeAssertion[];
  metasQueContinuan: InformeAssertion[];
  metasCerradas: InformeAssertion[];
  resumenPeriodo: InformeAssertion;
  proximosPasos: InformeAssertion[];
}

let contadorId = 0;
function idAssertion(prefijo: string): string {
  contadorId += 1;
  return `${prefijo}-${FECHA_HOY}-${contadorId}-${Math.round(Math.random() * 10000)}`;
}

function observacionesAprobadasEnRango(ninoId: string, desde: string, hasta: string, observaciones: Observacion[]): Observacion[] {
  return observaciones.filter((o) => o.ninoId === ninoId && o.fecha >= desde && o.fecha <= hasta && estadoRegistroObservacion(o) === 'profesional_aprobada');
}

function areaDeObservacion(o: Observacion, relaciones: ObservacionSkill[]): { id: string; nombre: string; skillIds: string[] } {
  const habilidades = habilidadesAceptadasDeObservacion(o.id, relaciones);
  const conDominio = habilidades.find((h) => h.dominio);
  if (conDominio?.dominio) {
    return { id: conDominio.dominio, nombre: prettyDominio(conDominio.dominio), skillIds: habilidades.filter((h) => h.dominio === conDominio.dominio).map((h) => h.skillId) };
  }
  return { id: 'otras', nombre: 'Otras observaciones', skillIds: habilidades.map((h) => h.skillId) };
}

function generarAreasEnDesarrollo(periodoInicio: string, periodoFin: string, aprobadas: Observacion[], relaciones: ObservacionSkill[]): InformeAssertion[] {
  const mapa = new Map<string, { nombre: string; observationIds: string[]; skillIds: Set<string> }>();
  for (const o of aprobadas) {
    const area = areaDeObservacion(o, relaciones);
    const entrada = mapa.get(area.id) ?? { nombre: area.nombre, observationIds: [], skillIds: new Set<string>() };
    entrada.observationIds.push(o.id);
    area.skillIds.forEach((s) => entrada.skillIds.add(s));
    mapa.set(area.id, entrada);
  }
  return Array.from(mapa.values())
    .sort((a, b) => a.nombre.localeCompare(b.nombre))
    .map((e) => ({
      id: idAssertion('area'),
      texto: `Durante este periodo se document${e.observationIds.length === 1 ? 'ó' : 'aron'} ${e.observationIds.length} ${e.observationIds.length === 1 ? 'observación aprobada' : 'observaciones aprobadas'} relacionada${e.observationIds.length === 1 ? '' : 's'} con ${e.nombre}.`,
      observationIds: e.observationIds,
      skillIds: Array.from(e.skillIds),
      origen: 'raiz_demo' as const,
    }));
}

/** SOLO cita cambios de estado REALMENTE confirmados (`EventoSkill.anterior` presente, fechado
 * dentro del periodo) — nunca infiere un cambio de la sola presencia de observaciones nuevas (6f
 * punto 4, misma regla que 6e-2 ajuste 1). */
function generarCambiosConfirmados(ninoId: string, periodoInicio: string, periodoFin: string, eventosSkill: EventoSkill[]): InformeAssertion[] {
  const eventos = eventosSkill.filter((e) => e.ninoId === ninoId && e.anterior && e.fecha >= periodoInicio && e.fecha <= periodoFin);
  return eventos.map((e) => ({
    id: idAssertion('cambio'),
    texto: `${e.nombreSkill}: de "${describirEstadoSkill(e.anterior!)}" a "${describirEstadoSkill(e.nuevo)}".`,
    observationIds: e.observacionIds ?? [],
    skillIds: [e.skillId],
    childSkillEventIds: [e.id],
    origen: 'raiz_demo' as const,
  }));
}

/** Fortalezas — únicamente skills con un cambio CONFIRMADO hacia "dominado" dentro del periodo
 * (nunca una lista inventada de "cosas que le van bien"). Reutiliza los mismos eventos que
 * `generarCambiosConfirmados`, filtrados. */
function generarFortalezas(cambios: InformeAssertion[], eventosSkill: EventoSkill[]): InformeAssertion[] {
  const idsDominado = new Set(eventosSkill.filter((e) => e.nuevo.estadoDesarrollo === 'dominado').map((e) => e.id));
  return cambios
    .filter((c) => (c.childSkillEventIds ?? []).some((id) => idsDominado.has(id)))
    .map((c) => ({ ...c, id: idAssertion('fortaleza'), texto: `Se confirmó la adquisición de: ${c.texto.split(':')[0]}.` }));
}

function generarMetasDelPeriodo(plan: PlanIndividual | undefined, cicloId: string, ninoNuevosPlanes: PlanIndividual[]): { cumplidas: InformeAssertion[]; continuan: InformeAssertion[]; cerradas: InformeAssertion[] } {
  if (!plan) return { cumplidas: [], continuan: [], cerradas: [] };
  const revisadasEnCiclo = plan.metas.filter((m) => (m.historial ?? []).some((h) => h.cicloRevisionId === cicloId));
  const cumplidas: InformeAssertion[] = [];
  const continuan: InformeAssertion[] = [];
  const cerradas: InformeAssertion[] = [];
  for (const m of revisadasEnCiclo.length > 0 ? revisadasEnCiclo : plan.metas) {
    if (m.estado === 'alcanzado') {
      cumplidas.push({
        id: idAssertion('meta'),
        texto: `Meta cumplida: "${m.descripcion}"${m.fechaCumplimiento ? ` (${fechaCorta(m.fechaCumplimiento)})` : ''}.`,
        observationIds: m.evidenciaCumplimientoIds ?? [],
        goalIds: [m.id],
        checkpointIds: (m.checkpoints ?? []).map((cp) => `${m.id}#${cp.mes}`),
        origen: 'raiz_demo',
      });
    } else if (m.estado === 'cerrada') {
      cerradas.push({
        id: idAssertion('meta'),
        texto: `Meta cerrada: "${m.descripcion}"${m.motivoCierre ? ` — ${m.motivoCierre}` : ''}.`,
        observationIds: [],
        goalIds: [m.id],
        origen: 'raiz_demo',
      });
    } else if (metaEstaActiva(m)) {
      const continuaEnPlanNuevo = ninoNuevosPlanes.some((p) => p.metas.some((mn) => mn.continuaDeMetaId === m.id));
      continuan.push({
        id: idAssertion('meta'),
        texto: continuaEnPlanNuevo ? `"${m.descripcion}" continuará siendo trabajada durante el próximo periodo.` : `"${m.descripcion}" sigue en curso.`,
        observationIds: [],
        goalIds: [m.id],
        origen: 'raiz_demo',
      });
    }
  }
  return { cumplidas, continuan, cerradas };
}

function generarResumenPeriodo(cambios: InformeAssertion[], cumplidas: InformeAssertion[], totalAprobadas: number): InformeAssertion {
  const partes: string[] = [];
  partes.push(`${totalAprobadas} ${totalAprobadas === 1 ? 'observación aprobada' : 'observaciones aprobadas'}`);
  if (cambios.length > 0) partes.push(`${cambios.length} ${cambios.length === 1 ? 'cambio confirmado de habilidad' : 'cambios confirmados de habilidad'}`);
  if (cumplidas.length > 0) partes.push(`${cumplidas.length} ${cumplidas.length === 1 ? 'meta cumplida' : 'metas cumplidas'}`);
  const texto = totalAprobadas === 0 && cambios.length === 0 && cumplidas.length === 0
    ? 'Este periodo tiene evidencia limitada para elaborar una síntesis amplia. El reporte refleja únicamente lo que está documentado y aprobado.'
    : `Durante este periodo se registraron ${partes.join(', ')}.`;
  return {
    id: idAssertion('resumen'),
    texto,
    observationIds: [...new Set([...cambios.flatMap((c) => c.observationIds), ...cumplidas.flatMap((c) => c.observationIds)])],
    skillIds: [...new Set(cambios.flatMap((c) => c.skillIds ?? []))],
    childSkillEventIds: cambios.flatMap((c) => c.childSkillEventIds ?? []),
    goalIds: cumplidas.flatMap((c) => c.goalIds ?? []),
    origen: 'raiz_demo',
  };
}

function generarProximosPasos(continuan: InformeAssertion[], decision: DecisionSiguientePlan | undefined, pendientes: Observacion[]): InformeAssertion[] {
  const pasos: InformeAssertion[] = [...continuan.map((c) => ({ ...c, id: idAssertion('paso') }))];
  if (decision === 'no_necesita') {
    pasos.push({ id: idAssertion('paso'), texto: 'Por ahora no se identificó la necesidad de un nuevo Plan Individual.', observationIds: [], origen: 'raiz_demo' });
  } else if (decision === 'sigue_observando') {
    pasos.push({ id: idAssertion('paso'), texto: 'Se seguirá observando antes de decidir si se necesita un Plan Individual.', observationIds: [], origen: 'raiz_demo' });
  }
  if (pendientes.length > 0) {
    pasos.push({
      id: idAssertion('paso'),
      texto: `Hay ${pendientes.length} ${pendientes.length === 1 ? 'observación pendiente' : 'observaciones pendientes'} de redacción de este periodo.`,
      observationIds: pendientes.map((o) => o.id),
      origen: 'raiz_demo',
    });
  }
  return pasos;
}

export function generarContenidoReporteResultados(
  nino: Nino,
  ciclo: CicloRevisionPeriodica,
  observaciones: Observacion[],
  relaciones: ObservacionSkill[],
  eventosSkill: EventoSkill[]
): ContenidoReporteResultados {
  if (!ciclo.periodoFin) throw new Error('El ciclo todavía no tiene periodoFin — la evaluación de este ciclo debe estar aprobada primero.');
  const { periodoInicio, periodoFin } = ciclo;
  const aprobadas = observacionesAprobadasEnRango(nino.id, periodoInicio, periodoFin, observaciones);
  const pendientes = observaciones.filter((o) => o.ninoId === nino.id && o.fecha >= periodoInicio && o.fecha <= periodoFin && estadoRegistroObservacion(o) === 'pendiente_redaccion');
  const cambiosConfirmados = generarCambiosConfirmados(nino.id, periodoInicio, periodoFin, eventosSkill);
  const areasEnDesarrollo = generarAreasEnDesarrollo(periodoInicio, periodoFin, aprobadas, relaciones);
  const plan = planDelCiclo(nino, ciclo.id);
  const { cumplidas, continuan, cerradas } = generarMetasDelPeriodo(plan, ciclo.id, nino.planesIndividuales ?? []);
  const fortalezas = generarFortalezas(cambiosConfirmados, eventosSkill);
  return {
    ninoId: nino.id,
    cicloRevisionId: ciclo.id,
    periodoInicio,
    periodoFin,
    edadAlFinalMeses: edadEnMeses(nino.fechaNacimiento, periodoFin),
    fortalezas,
    cambiosConfirmados,
    areasEnDesarrollo,
    metasCumplidas: cumplidas,
    metasQueContinuan: continuan,
    metasCerradas: cerradas,
    resumenPeriodo: generarResumenPeriodo(cambiosConfirmados, cumplidas, aprobadas.length),
    proximosPasos: generarProximosPasos(continuan, ciclo.decisionSiguientePlan, pendientes),
  };
}

/** Reporte para FAMILIA (10) — quita todo lo que no sea evidencia aprobada/compartible: metas sin
 * `compartibleConFamilia===true`, y (estructuralmente, ya garantizado arriba) nunca incluye notas
 * crudas, observaciones pendientes ni decisiones internas de prioridad, porque el contenido se
 * construyó SOLO a partir de observaciones aprobadas y metas con id — nunca leyó esas fuentes. */
export function filtrarParaFamilia(contenido: ContenidoReporteResultados, nino: Nino): ContenidoReporteResultados {
  const compartibles = new Set(
    (nino.planesIndividuales ?? []).flatMap((p) => p.metas).filter((m) => m.compartibleConFamilia).map((m) => m.id)
  );
  const soloCompartibles = (lista: InformeAssertion[]) => lista.filter((a) => !a.goalIds || a.goalIds.length === 0 || a.goalIds.every((id) => compartibles.has(id)));
  return {
    ...contenido,
    metasCumplidas: soloCompartibles(contenido.metasCumplidas),
    metasQueContinuan: soloCompartibles(contenido.metasQueContinuan),
    metasCerradas: soloCompartibles(contenido.metasCerradas),
    proximosPasos: soloCompartibles(contenido.proximosPasos),
  };
}

/* ── CICLO DE VIDA DEL REPORTE (mismo patrón que 6e-2: borrador → edición → aprobación → versión) ── */

export function reporteResultadosDeCiclo(cicloId: string, reportes: ChildReport<unknown>[] = leerChildReports()): ChildReport<ContenidoReporteResultados> | undefined {
  const delCiclo = reportes.filter((r): r is ChildReport<ContenidoReporteResultados> => r.tipo === 'period_results_report' && r.cicloRevisionId === cicloId);
  if (delCiclo.length === 0) return undefined;
  return delCiclo.reduce((a, b) => (b.version > a.version ? b : a));
}

function fingerprintReporteResultados(ninoId: string, periodoInicio: string, periodoFin: string, observaciones: Observacion[], relaciones: ObservacionSkill[], eventosSkill: EventoSkill[]): string {
  const aprobadas = observacionesAprobadasEnRango(ninoId, periodoInicio, periodoFin, observaciones);
  const firmaObs = aprobadas
    .map((o) => {
      const skills = relaciones.filter((r) => r.observacionId === o.id && r.estado === 'aceptado').map((r) => r.skillId).sort().join(',');
      return `${o.id}::${o.redaccionProfesional ?? ''}::${skills}`;
    })
    .sort()
    .join('|');
  const firmaEventos = eventosSkill.filter((e) => e.ninoId === ninoId && e.fecha >= periodoInicio && e.fecha <= periodoFin).map((e) => e.id).sort().join(',');
  return `${firmaObs}##${firmaEventos}`;
}

export function prepararReporteResultadosBorrador(
  nino: Nino,
  ciclo: CicloRevisionPeriodica,
  observaciones: Observacion[],
  relaciones: ObservacionSkill[],
  eventosSkill: EventoSkill[],
  audiencia: 'internal' | 'family' = 'family',
  idioma = 'es'
): ChildReport<ContenidoReporteResultados> {
  if (!ciclo.periodoFin) throw new Error('El ciclo todavía no tiene periodoFin.');
  let contenido = generarContenidoReporteResultados(nino, ciclo, observaciones, relaciones, eventosSkill);
  if (audiencia === 'family') contenido = filtrarParaFamilia(contenido, nino);
  return {
    id: `reporte-${nino.id}-${ciclo.id}-${Date.now()}`,
    ninoId: nino.id,
    tipo: 'period_results_report',
    audiencia,
    periodoInicio: ciclo.periodoInicio,
    periodoFin: ciclo.periodoFin,
    idioma,
    estado: 'borrador',
    version: 1,
    creadoEn: FECHA_HOY,
    cicloRevisionId: ciclo.id,
    fingerprintEvidencia: fingerprintReporteResultados(nino.id, ciclo.periodoInicio, ciclo.periodoFin, observaciones, relaciones, eventosSkill),
    contenidoSnapshot: contenido,
  };
}

export function guardarEdicionReporteResultados(reporte: ChildReport<ContenidoReporteResultados>, contenidoEditado: ContenidoReporteResultados): ChildReport<ContenidoReporteResultados> {
  const actualizado: ChildReport<ContenidoReporteResultados> = { ...reporte, contenidoSnapshot: contenidoEditado };
  guardarUnChildReport(actualizado);
  return actualizado;
}

export function aprobarReporteResultados(
  reporte: ChildReport<ContenidoReporteResultados>,
  nino: Nino,
  observaciones: Observacion[],
  relaciones: ObservacionSkill[],
  eventosSkill: EventoSkill[]
): ChildReport<ContenidoReporteResultados> {
  const actualizado: ChildReport<ContenidoReporteResultados> = {
    ...reporte,
    estado: 'aprobado',
    aprobadoEn: FECHA_HOY,
    fingerprintEvidencia: fingerprintReporteResultados(nino.id, reporte.periodoInicio, reporte.periodoFin, observaciones, relaciones, eventosSkill),
  };
  guardarUnChildReport(actualizado);
  return actualizado;
}

export function crearNuevaVersionReporte(
  anterior: ChildReport<ContenidoReporteResultados>,
  nino: Nino,
  ciclo: CicloRevisionPeriodica,
  observaciones: Observacion[],
  relaciones: ObservacionSkill[],
  eventosSkill: EventoSkill[]
): ChildReport<ContenidoReporteResultados> {
  let contenido = generarContenidoReporteResultados(nino, ciclo, observaciones, relaciones, eventosSkill);
  if (anterior.audiencia === 'family') contenido = filtrarParaFamilia(contenido, nino);
  const nueva: ChildReport<ContenidoReporteResultados> = {
    id: `reporte-${nino.id}-${ciclo.id}-${Date.now()}`,
    ninoId: nino.id,
    tipo: 'period_results_report',
    audiencia: anterior.audiencia,
    periodoInicio: anterior.periodoInicio,
    periodoFin: anterior.periodoFin,
    idioma: anterior.idioma,
    estado: 'borrador',
    version: anterior.version + 1,
    reemplazaReportId: anterior.id,
    creadoEn: FECHA_HOY,
    cicloRevisionId: ciclo.id,
    fingerprintEvidencia: fingerprintReporteResultados(nino.id, ciclo.periodoInicio, ciclo.periodoFin!, observaciones, relaciones, eventosSkill),
    contenidoSnapshot: contenido,
  };
  guardarUnChildReport(nueva);
  return nueva;
}

export function hayEvidenciaNuevaReporte(reporte: ChildReport<ContenidoReporteResultados>, nino: Nino, observaciones: Observacion[], relaciones: ObservacionSkill[], eventosSkill: EventoSkill[]): boolean {
  if (reporte.estado !== 'aprobado') return false;
  return fingerprintReporteResultados(nino.id, reporte.periodoInicio, reporte.periodoFin, observaciones, relaciones, eventosSkill) !== reporte.fingerprintEvidencia;
}
