/* ── INFORME MENSUAL DE OBSERVACIONES (Sesión 6, paso 7 / 6e-2) ──

   Responde "¿qué nos dice, en conjunto, la evidencia de este niño durante este mes?" — DISTINTO
   del Registro Mensual (6e-1, que es cronológico y nunca sintetiza). El Informe SÍ sintetiza, por
   eso necesita: Borrador → revisión/edición de la maestra → Aprobación → snapshot congelado
   (versionado) — a diferencia del Registro, que es una vista viva que nunca se guarda.

   SIN IA real todavía (aprobado explícitamente por el usuario): las afirmaciones automáticas son
   PLANTILLAS ESTRUCTURALES Y CONSERVADORAS ("se documentaron N observaciones..."), nunca prosa
   interpretativa que finja una síntesis pedagógica que el sistema no puede producir de forma
   fiable sin un modelo de lenguaje real. Cuando exista IA real, la misma arquitectura (secciones +
   afirmaciones + observationIds) podrá producir síntesis auténtica — el modelo de datos ya está
   listo para eso, hoy solo cambia QUIÉN escribe el texto.

   Regla de oro repetida en cada función de este archivo: toda afirmación debe poder rastrearse a
   evidencia real (`observationIds`/`skillIds`/`childSkillEventIds`/`goalIds`) o quedar marcada
   `origen: 'maestra'` cuando la escribe la maestra a mano — nunca texto flotante sin fuente. */

import {
  FECHA_HOY,
  SKILLS_CATALOG,
  describirEstadoSkill,
  estadoRegistroObservacion,
  metasActivasDeNino,
  type EventoSkill,
  type Nino,
  type Observacion,
  type ObservacionSkill,
} from './seed-data';
import { MES_NOMBRE } from './curriculo';
import { enMes, habilidadesAceptadasDeObservacion, mesAnterior, observacionesAprobadasDelMes, pendientesDeRedaccionDelMes, prettyDominio } from './registro-mensual';

/* ── TIPOS ── */

/** `raiz_demo` = generada por la plantilla estructural de esta fase; `maestra` = escrita/editada a
 * mano — una afirmación `maestra` puede no tener `observationIds` si la maestra conscientemente la
 * agrega sin citar evidencia puntual (regla del usuario, punto 2). */
export type OrigenAssertion = 'raiz_demo' | 'maestra';

export interface InformeAssertion {
  id: string;
  texto: string;
  observationIds: string[];
  skillIds?: string[];
  childSkillEventIds?: string[];
  goalIds?: string[];
  origen: OrigenAssertion;
  /** La maestra reescribió el texto que RAÍZ propuso — ya no se regenera solo si se prepara otra
   * versión (se conserva su edición). */
  editadoManualmente?: boolean;
}

export interface SeccionInforme {
  /** Dominio real (`SkillCatalogEntry.dominio`) o `'otras'` — una observación sin skill aceptado
   * NUNCA inventa un dominio (regla del usuario, punto 18/3). */
  areaId: string;
  areaNombre: string;
  assertions: InformeAssertion[];
}

export interface ContenidoInformeMensual {
  ninoId: string;
  anio: number;
  mes: number;
  secciones: SeccionInforme[];
  /** Ausente = sin evidencia aprobada comparable en el mes anterior — la UI muestra la frase fija,
   * no se genera ninguna afirmación (nada que rastrear). */
  comparacionMesAnterior?: InformeAssertion;
  resumenMensual: InformeAssertion;
  focoParaContinuar: InformeAssertion[];
}

export type TipoReporte = 'monthly_observation_report';
export type AudienciaReporte = 'internal' | 'family';
export type EstadoReporte = 'borrador' | 'aprobado';

/** Genérico a propósito — mismo tipo servirá para el Reporte de Resultados (6f) y otros documentos
 * congelados/versionados futuros; hoy solo existe `tipo: 'monthly_observation_report'`. */
export interface ChildReport {
  id: string;
  ninoId: string;
  tipo: TipoReporte;
  audiencia: AudienciaReporte;
  periodoInicio: string; // ISO, primer día del mes
  periodoFin: string; // ISO, último día del mes
  idioma: string;
  estado: EstadoReporte;
  version: number;
  reemplazaReportId?: string;
  creadoEn: string;
  aprobadoEn?: string;
  /** Firma determinística de la evidencia usada — ver `fingerprintEvidenciaDelMes`. Se recalcula al
   * reabrir un informe aprobado; si difiere, hay evidencia nueva y se avisa (nunca se aplica sola). */
  fingerprintEvidencia: string;
  contenidoSnapshot: ContenidoInformeMensual;
}

/* ── PERSISTENCIA ── */

const INFORMES_STORAGE_KEY = 'raiz_informes_mensuales';

export function leerInformesMensuales(): ChildReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const guardado = window.localStorage.getItem(INFORMES_STORAGE_KEY);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado) as ChildReport[];
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

export function guardarInformesMensuales(informes: ChildReport[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(INFORMES_STORAGE_KEY, JSON.stringify(informes));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

export function guardarUnInforme(informe: ChildReport): void {
  const informes = leerInformesMensuales();
  const actualizados = informes.some((i) => i.id === informe.id) ? informes.map((i) => (i.id === informe.id ? informe : i)) : [...informes, informe];
  guardarInformesMensuales(actualizados);
}

/** El informe VIGENTE (mayor `version`) de un niño para un periodo — nunca hay que adivinar cuál es
 * el "actual" entre varias versiones archivadas. */
export function informeVigente(ninoId: string, anio: number, mes: number, informes: ChildReport[] = leerInformesMensuales()): ChildReport | undefined {
  const delPeriodo = informes.filter((i) => i.ninoId === ninoId && enMes(i.periodoInicio, anio, mes));
  if (delPeriodo.length === 0) return undefined;
  return delPeriodo.reduce((a, b) => (b.version > a.version ? b : a));
}

/** Historial completo (todas las versiones) de un periodo, más reciente primero — para cuando la
 * maestra quiera ver qué cambió entre versiones (no hay UI todavía, pero el dato no se pierde). */
export function historialInforme(ninoId: string, anio: number, mes: number, informes: ChildReport[] = leerInformesMensuales()): ChildReport[] {
  return informes.filter((i) => i.ninoId === ninoId && enMes(i.periodoInicio, anio, mes)).sort((a, b) => b.version - a.version);
}

function primerYUltimoDiaDelMes(anio: number, mes: number): { inicio: string; fin: string } {
  const mesStr = String(mes).padStart(2, '0');
  const ultimo = new Date(anio, mes, 0).getDate();
  return { inicio: `${anio}-${mesStr}-01`, fin: `${anio}-${mesStr}-${String(ultimo).padStart(2, '0')}` };
}

/* ── FINGERPRINT DE EVIDENCIA (punto 4 — considera TODO lo que puede cambiar el contenido, no solo
   el texto de la observación) ── */

function fingerprintObservacionParaInforme(o: Observacion, relaciones: ObservacionSkill[]): string {
  const skillsAceptados = relaciones
    .filter((r) => r.observacionId === o.id && r.estado === 'aceptado')
    .map((r) => r.skillId)
    .sort()
    .join(',');
  const evidenciaIds = (o.evidencias ?? [])
    .map((e) => e.id)
    .sort()
    .join(',');
  // Incluye el estado de aprobación explícitamente: una observación que pasa de pendiente a
  // aprobada (o viceversa, si se revirtiera) cambia el fingerprint aunque el resto sea igual.
  return [o.id, estadoRegistroObservacion(o), o.redaccionProfesional ?? '', skillsAceptados, evidenciaIds].join('::');
}

/** Firma determinística de TODA la evidencia aprobada del mes — si un skill pasa de "sugerido" a
 * "aceptado" en una observación YA aprobada, esta firma cambia (aunque el texto de la observación
 * sea idéntico), porque esa observación puede pasar de "Otras observaciones" a un área real. */
export function fingerprintEvidenciaDelMes(ninoId: string, anio: number, mes: number, observaciones: Observacion[], relaciones: ObservacionSkill[]): string {
  const aprobadas = observacionesAprobadasDelMes(ninoId, anio, mes, observaciones);
  return aprobadas
    .map((o) => fingerprintObservacionParaInforme(o, relaciones))
    .sort()
    .join('|');
}

/* ── GENERAR EL BORRADOR — plantillas estructurales, sin IA real ── */

let contadorId = 0;
function idAssertion(prefijo: string): string {
  contadorId += 1;
  return `${prefijo}-${FECHA_HOY}-${contadorId}-${Math.round(Math.random() * 10000)}`;
}

function areaDeObservacion(o: Observacion, relaciones: ObservacionSkill[]): { id: string; nombre: string; skillIds: string[] } {
  const habilidades = habilidadesAceptadasDeObservacion(o.id, relaciones);
  const conDominio = habilidades.find((h) => h.dominio);
  if (conDominio?.dominio) {
    return { id: conDominio.dominio, nombre: prettyDominio(conDominio.dominio), skillIds: habilidades.filter((h) => h.dominio === conDominio.dominio).map((h) => h.skillId) };
  }
  // Sin skill aceptado, o el skill aceptado no tiene dominio en el catálogo: "Otras observaciones"
  // — NUNCA se inventa un área (regla del usuario, punto 18).
  return { id: 'otras', nombre: 'Otras observaciones', skillIds: habilidades.map((h) => h.skillId) };
}

function generarSecciones(mes: number, aprobadas: Observacion[], relaciones: ObservacionSkill[]): SeccionInforme[] {
  const mapa = new Map<string, { nombre: string; observationIds: string[]; skillIds: Set<string> }>();
  for (const o of aprobadas) {
    const area = areaDeObservacion(o, relaciones);
    const entrada = mapa.get(area.id) ?? { nombre: area.nombre, observationIds: [], skillIds: new Set<string>() };
    entrada.observationIds.push(o.id);
    area.skillIds.forEach((s) => entrada.skillIds.add(s));
    mapa.set(area.id, entrada);
  }
  return Array.from(mapa, ([id, e]) => {
    const n = e.observationIds.length;
    // Plantilla ESTRUCTURAL Y CONSERVADORA (aprobado explícitamente por el usuario, D.2): describe
    // cuánta evidencia hay, nunca inventa una síntesis pedagógica sin IA real. El contenido
    // pedagógico real vive en las observaciones citadas ("Ver observaciones").
    const texto = `Durante ${MES_NOMBRE[mes]} se document${n === 1 ? 'ó' : 'aron'} ${n} ${n === 1 ? 'observación aprobada' : 'observaciones aprobadas'} relacionada${n === 1 ? '' : 's'} con esta área.`;
    return {
      areaId: id,
      areaNombre: e.nombre,
      assertions: [{ id: idAssertion('assert'), texto, observationIds: e.observationIds, skillIds: Array.from(e.skillIds), origen: 'raiz_demo' as const }],
    };
  }).sort((a, b) => a.areaNombre.localeCompare(b.areaNombre));
}

/** Comparación con el mes anterior — NUNCA infiere progreso/independencia de la sola cantidad de
 * observaciones (regla del usuario, ajuste 1: "más observaciones ≠ más progreso, puede significar
 * solo que se documentó más"). Solo dos resultados posibles cuando hay evidencia en ambos meses:
 * (a) existe una señal REAL confirmada (`EventoSkill` con `anterior` fechado en el mes actual,
 * ligado a un skill que aparece en la evidencia de este mes) → se cita objetivamente ese cambio de
 * estado; (b) no existe esa señal → frase neutral honesta, nunca "continúa similar" inferido de la
 * ausencia de cambio. */
function generarComparacion(
  ninoId: string,
  anio: number,
  mes: number,
  secciones: SeccionInforme[],
  observaciones: Observacion[],
  eventosSkill: EventoSkill[]
): InformeAssertion | undefined {
  const anterior = mesAnterior(anio, mes);
  const aprobadasAnterior = observacionesAprobadasDelMes(ninoId, anterior.anio, anterior.mes, observaciones);
  if (aprobadasAnterior.length === 0) return undefined; // sin evidencia comparable — la UI muestra la frase fija, sin assertion

  const observationIdsActual = secciones.flatMap((s) => s.assertions.flatMap((a) => a.observationIds));
  const skillIdsActual = new Set(secciones.flatMap((s) => s.assertions.flatMap((a) => a.skillIds ?? [])));
  const observationIdsTodos = [...new Set([...observationIdsActual, ...aprobadasAnterior.map((o) => o.id)])];

  const eventosConfirmadosEsteMes = eventosSkill.filter((e) => e.ninoId === ninoId && e.anterior && skillIdsActual.has(e.skillId) && enMes(e.fecha, anio, mes));

  if (eventosConfirmadosEsteMes.length > 0) {
    const frases = eventosConfirmadosEsteMes.map((e) => `${e.nombreSkill}: de "${describirEstadoSkill(e.anterior!)}" a "${describirEstadoSkill(e.nuevo)}"`);
    const observacionesDeEventos = eventosConfirmadosEsteMes.flatMap((e) => e.observacionIds ?? []);
    return {
      id: idAssertion('comparacion'),
      texto: `Se confirmó un cambio de estado durante ${MES_NOMBRE[mes]}: ${frases.join('; ')}.`,
      observationIds: [...new Set([...observationIdsTodos, ...observacionesDeEventos])],
      skillIds: eventosConfirmadosEsteMes.map((e) => e.skillId),
      childSkillEventIds: eventosConfirmadosEsteMes.map((e) => e.id),
      origen: 'raiz_demo',
    };
  }

  return {
    id: idAssertion('comparacion'),
    texto: 'Hay evidencia aprobada en ambos meses, pero esta versión DEMO no interpreta cambios de desempeño automáticamente.',
    observationIds: observationIdsTodos,
    origen: 'raiz_demo',
  };
}

function generarResumen(mes: number, secciones: SeccionInforme[], totalAprobadas: number): InformeAssertion {
  const observationIds = [...new Set(secciones.flatMap((s) => s.assertions.flatMap((a) => a.observationIds)))];
  const skillIds = [...new Set(secciones.flatMap((s) => s.assertions.flatMap((a) => a.skillIds ?? [])))];
  const texto =
    totalAprobadas > 0
      ? `Este informe reúne ${totalAprobadas} ${totalAprobadas === 1 ? 'observación aprobada' : 'observaciones aprobadas'} de ${MES_NOMBRE[mes]}, distribuidas en ${secciones.length} ${secciones.length === 1 ? 'área' : 'áreas'}.`
      : `Este mes hay evidencia limitada para elaborar una síntesis amplia. El informe refleja únicamente las observaciones aprobadas disponibles.`;
  return { id: idAssertion('resumen'), texto, observationIds, skillIds, origen: 'raiz_demo' };
}

/** Foco para continuar observando — NUNCA nace de "edad esperada + skill sin estado" (regla del
 * usuario, ajuste 3: eso convertiría ausencia de evidencia en aparente preocupación clínica).
 * Se deriva SOLO de: (A) dominios que este niño en particular YA sigue (`nino.skills`, decisión
 * humana previa, nunca la lista genérica por edad) con poca cobertura este mes — foco GENERAL del
 * área, nunca inventa una habilidad puntual; (B) metas activas de su Plan Individual con evidencia
 * este mes — cita la meta real; (C) observaciones pendientes de redactar este mes. */
function generarFoco(nino: Nino, anio: number, mes: number, secciones: SeccionInforme[], pendientes: Observacion[], observaciones: Observacion[], relaciones: ObservacionSkill[]): InformeAssertion[] {
  const foco: InformeAssertion[] = [];

  const dominiosDelNino = new Set(nino.skills.map((s) => SKILLS_CATALOG.find((c) => c.id === s.id)?.dominio).filter((d): d is string => !!d));
  const candidatosPocaCobertura: { dominioId: string; cobertura: number; observationIds: string[] }[] = [];
  for (const dominioId of dominiosDelNino) {
    const seccion = secciones.find((s) => s.areaId === dominioId);
    const observationIds = seccion ? seccion.assertions.flatMap((a) => a.observationIds) : [];
    if (observationIds.length <= 1) candidatosPocaCobertura.push({ dominioId, cobertura: observationIds.length, observationIds });
  }
  candidatosPocaCobertura
    .sort((a, b) => a.cobertura - b.cobertura)
    .slice(0, 3)
    .forEach(({ dominioId, observationIds }) => {
      foco.push({ id: idAssertion('foco'), texto: `Buscar más oportunidades de observación en ${prettyDominio(dominioId)}.`, observationIds, origen: 'raiz_demo' });
    });

  for (const meta of metasActivasDeNino(nino)) {
    if (!meta.skillId) continue;
    const evidenciaEsteMes = observacionesAprobadasDelMes(nino.id, anio, mes, observaciones).filter((o) => habilidadesAceptadasDeObservacion(o.id, relaciones).some((h) => h.skillId === meta.skillId));
    if (evidenciaEsteMes.length > 0) {
      foco.push({
        id: idAssertion('foco'),
        texto: `Continuar observando "${meta.descripcion}" — relacionado con una meta activa de su Plan Individual.`,
        observationIds: evidenciaEsteMes.map((o) => o.id),
        skillIds: [meta.skillId],
        goalIds: [meta.id],
        origen: 'raiz_demo',
      });
    }
  }

  if (pendientes.length > 0) {
    foco.push({
      id: idAssertion('foco'),
      texto: `Hay ${pendientes.length} ${pendientes.length === 1 ? 'observación pendiente' : 'observaciones pendientes'} de redacción este mes — aprobarla${pendientes.length === 1 ? '' : 's'} permitiría incluirla${pendientes.length === 1 ? '' : 's'} en el análisis.`,
      observationIds: pendientes.map((o) => o.id),
      origen: 'raiz_demo',
    });
  }

  return foco;
}

export function generarContenidoInforme(nino: Nino, anio: number, mes: number, observaciones: Observacion[], relaciones: ObservacionSkill[], eventosSkill: EventoSkill[]): ContenidoInformeMensual {
  const aprobadas = observacionesAprobadasDelMes(nino.id, anio, mes, observaciones);
  const pendientes = pendientesDeRedaccionDelMes(nino.id, anio, mes, observaciones);
  const secciones = generarSecciones(mes, aprobadas, relaciones);
  return {
    ninoId: nino.id,
    anio,
    mes,
    secciones,
    comparacionMesAnterior: generarComparacion(nino.id, anio, mes, secciones, observaciones, eventosSkill),
    resumenMensual: generarResumen(mes, secciones, aprobadas.length),
    focoParaContinuar: generarFoco(nino, anio, mes, secciones, pendientes, observaciones, relaciones),
  };
}

/* ── CICLO DE VIDA DEL INFORME ── */

/** Crea el PRIMER borrador de un periodo — nunca se llama si ya existe un informe para ese periodo
 * (eso sería sobrescribir edición humana en silencio); la pantalla debe comprobar `informeVigente`
 * antes de ofrecer este botón. */
export function prepararInformeBorrador(nino: Nino, anio: number, mes: number, observaciones: Observacion[], relaciones: ObservacionSkill[], eventosSkill: EventoSkill[], idioma = 'es'): ChildReport {
  const { inicio, fin } = primerYUltimoDiaDelMes(anio, mes);
  return {
    id: `informe-${nino.id}-${anio}-${String(mes).padStart(2, '0')}-${Date.now()}`,
    ninoId: nino.id,
    tipo: 'monthly_observation_report',
    audiencia: 'internal',
    periodoInicio: inicio,
    periodoFin: fin,
    idioma,
    estado: 'borrador',
    version: 1,
    creadoEn: FECHA_HOY,
    fingerprintEvidencia: fingerprintEvidenciaDelMes(nino.id, anio, mes, observaciones, relaciones),
    contenidoSnapshot: generarContenidoInforme(nino, anio, mes, observaciones, relaciones, eventosSkill),
  };
}

/** Guarda ediciones de la maestra sobre un borrador YA existente — nunca cambia `estado`, `version`
 * ni `id`. */
export function guardarEdicionBorrador(informe: ChildReport, contenidoEditado: ContenidoInformeMensual): ChildReport {
  const actualizado: ChildReport = { ...informe, contenidoSnapshot: contenidoEditado };
  guardarUnInforme(actualizado);
  return actualizado;
}

/** Aprueba un borrador — congela el snapshot y recalcula el fingerprint EN ESTE MOMENTO (la última
 * evidencia disponible al aprobar, no la que había al crear el borrador). A partir de aquí el
 * informe nunca vuelve a cambiar solo. */
export function aprobarInforme(informe: ChildReport, observaciones: Observacion[], relaciones: ObservacionSkill[]): ChildReport {
  const actualizado: ChildReport = {
    ...informe,
    estado: 'aprobado',
    aprobadoEn: FECHA_HOY,
    fingerprintEvidencia: fingerprintEvidenciaDelMes(informe.ninoId, informe.contenidoSnapshot.anio, informe.contenidoSnapshot.mes, observaciones, relaciones),
  };
  guardarUnInforme(actualizado);
  return actualizado;
}

/** ¿La evidencia cambió después de aprobar? Nunca se aplica sola — la pantalla ofrece "Crear nueva
 * versión" o "Mantener versión actual". */
export function hayEvidenciaNuevaTrasAprobar(informe: ChildReport, observaciones: Observacion[], relaciones: ObservacionSkill[]): boolean {
  if (informe.estado !== 'aprobado') return false;
  const actual = fingerprintEvidenciaDelMes(informe.ninoId, informe.contenidoSnapshot.anio, informe.contenidoSnapshot.mes, observaciones, relaciones);
  return actual !== informe.fingerprintEvidencia;
}

/** Crea una nueva VERSIÓN a partir de un informe aprobado — nunca sobrescribe al anterior (queda en
 * el historial vía `reemplazaReportId`). La nueva versión nace en `borrador`: la maestra la revisa
 * antes de volver a aprobar, nunca se auto-aprueba. */
export function crearNuevaVersionInforme(anterior: ChildReport, nino: Nino, observaciones: Observacion[], relaciones: ObservacionSkill[], eventosSkill: EventoSkill[]): ChildReport {
  const nueva: ChildReport = {
    id: `informe-${nino.id}-${anterior.contenidoSnapshot.anio}-${String(anterior.contenidoSnapshot.mes).padStart(2, '0')}-${Date.now()}`,
    ninoId: nino.id,
    tipo: anterior.tipo,
    audiencia: anterior.audiencia,
    periodoInicio: anterior.periodoInicio,
    periodoFin: anterior.periodoFin,
    idioma: anterior.idioma,
    estado: 'borrador',
    version: anterior.version + 1,
    reemplazaReportId: anterior.id,
    creadoEn: FECHA_HOY,
    fingerprintEvidencia: fingerprintEvidenciaDelMes(nino.id, anterior.contenidoSnapshot.anio, anterior.contenidoSnapshot.mes, observaciones, relaciones),
    contenidoSnapshot: generarContenidoInforme(nino, anterior.contenidoSnapshot.anio, anterior.contenidoSnapshot.mes, observaciones, relaciones, eventosSkill),
  };
  guardarUnInforme(nueva);
  return nueva;
}
