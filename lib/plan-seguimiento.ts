/* ── SEGUIMIENTO MENSUAL DEL PLAN INDIVIDUAL (Sesión 6, paso 7 / 6d ampliación) ──

   Separa DOS cosas que el usuario pidió no confundir:
   · CHECKPOINT del mes (`CheckpointMeta`, en seed-data.ts) — evidencia de progreso: sin evidencia /
     Aún no (NY) / Emergente (E) / Adquirido (A). Es un registro por mes.
   · CICLO DE VIDA de la meta (`MetaIndividual.estado`, en prioridades.ts) — decisión pedagógica de
     la maestra: Por trabajar / En progreso / Casi lograda / Cumplida / Cerrada.
   Un checkpoint en Adquirido puede SUGERIR revisar el estado de la meta; nunca lo cambia solo.

   ⚠️ DEMO: `sugerirCheckpoint` solo sugiere Emergente/Adquirido, y SOLO cuando la meta apunta a un
   paso de `RUTAS_DEMO` con señales reconocibles en la redacción profesional aprobada de ese mes.
   NUNCA sugiere "Aún no" — corrección explícita del usuario: sin evidencia no es lo mismo que "lo
   intentó y todavía no puede", y sin una regla controlada capaz de distinguir eso, RAÍZ prefiere no
   sugerir nada y dejar que la maestra decida. Esto es andamio de demo, no el Catálogo Oficial. ── */

import {
  FECHA_HOY,
  SKILLS_CATALOG,
  evidenciaDeSkill,
  metaEstaActiva,
  type EstadoCheckpoint,
  type CheckpointMeta,
  type MetaIndividual,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type PlanIndividual,
  type ProgramaConfig,
} from './seed-data';
import { RUTAS_DEMO, actualizarMeta, areaDeDominio, type PasoRutaDemo } from './prioridades';

/* ── MESES DEL PLAN ── */

function mesDe(iso: string): string {
  return iso.slice(0, 7);
}

/** Fecha de inicio + frecuencia de evaluación configurada = fecha PREVISTA de revisión (precisión
 * del usuario: nunca asumir "trimestral = 3 columnas de mes", siempre inicio + frecuencia). */
export function fechaRevisionPrevistaPorDefecto(fechaInicio: string, config: ProgramaConfig): string {
  const meses =
    config.frecuenciaEvaluacion === 'trimestral' ? 3 : config.frecuenciaEvaluacion === 'semestral' ? 6 : config.frecuenciaEvaluacion === 'anual' ? 12 : (config.frecuenciaEvaluacionMesesPersonalizada ?? 3);
  const d = new Date(`${fechaInicio}T00:00:00`);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

/** Meses calendario (AAAA-MM) que cubre el plan — de su inicio a su fin real (si ya se archivó) o a
 * su fecha de revisión prevista (topada a hoy, para no proyectar años de meses futuros si el plan
 * quedó vencido sin revisarse). Los meses futuros dentro de ese rango SÍ se listan — la pantalla los
 * muestra atenuados, nunca como "olvidados". */
export function mesesDelPlan(plan: PlanIndividual): string[] {
  const inicio = plan.periodo?.inicio ?? plan.fechaCreacion;
  const fin = plan.periodo?.fin ?? (plan.fechaRevisionPrevista && plan.fechaRevisionPrevista > FECHA_HOY ? plan.fechaRevisionPrevista : FECHA_HOY);
  const finReal = fin < inicio ? inicio : fin;
  const meses: string[] = [];
  const cursor = new Date(`${inicio}T00:00:00`);
  cursor.setDate(1);
  const limite = new Date(`${finReal}T00:00:00`);
  limite.setDate(1);
  while (cursor <= limite) {
    meses.push(`${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return meses;
}

export function esMesFuturo(mes: string): boolean {
  return mes > FECHA_HOY.slice(0, 7);
}

export function mesActualStr(): string {
  return FECHA_HOY.slice(0, 7);
}

const FORMATO_MES_LARGO = new Intl.DateTimeFormat('es', { month: 'long', year: 'numeric' });
const FORMATO_MES_CORTO = new Intl.DateTimeFormat('es', { month: 'short' });

export function nombreMesLargo(mes: string): string {
  const texto = FORMATO_MES_LARGO.format(new Date(`${mes}-01T00:00:00`));
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export function nombreMesCorto(mes: string): string {
  return FORMATO_MES_CORTO.format(new Date(`${mes}-01T00:00:00`)).replace('.', '');
}

/* ── DESDE CUÁNDO Y HASTA CUÁNDO APLICA UNA META ── (precisión del usuario: una meta creada a
   mitad del periodo no debe verse "olvidada" en los meses previos — no existía todavía). */

export type AplicacionMes = 'no_aplica_antes' | 'no_aplica_despues' | 'aplica';

export function aplicacionDeMetaEnMes(meta: MetaIndividual, mes: string): AplicacionMes {
  const mesInicio = mesDe(meta.fechaCreacion ?? meta.fechaActualizacion);
  if (mes < mesInicio) return 'no_aplica_antes';
  const fechaFin = meta.fechaCumplimiento ?? meta.fechaCierre;
  if (fechaFin && mes > mesDe(fechaFin)) return 'no_aplica_despues';
  return 'aplica';
}

export function checkpointDeMes(meta: MetaIndividual, mes: string): CheckpointMeta | undefined {
  return meta.checkpoints?.find((c) => c.mes === mes);
}

/* ── SUGERENCIA DE CHECKPOINT (DEMO) ── */

export interface SugerenciaCheckpoint {
  /** `null` = RAÍZ no sugiere nada (sin ruta, sin criterio reconocible, o evidencia ambigua) —
   * la maestra decide viendo la evidencia. Nunca es `'aun_no'` (ver aviso del archivo). */
  sugerido: EstadoCheckpoint | null;
  observacionIds: string[];
}

/** Usa SOLO evidencia profesional aprobada de ese mes, ligada a la habilidad de la meta. */
export function sugerirCheckpoint(nino: Nino, meta: MetaIndividual, mes: string, observaciones: Observacion[], relaciones: ObservacionSkill[]): SugerenciaCheckpoint {
  if (!meta.skillId) return { sugerido: null, observacionIds: [] };
  const evidenciaMes = evidenciaDeSkill(nino.id, meta.skillId, observaciones, relaciones).filter((e) => mesDe(e.observacion.fecha) === mes);
  const ids = evidenciaMes.map((e) => e.observacion.id);
  if (evidenciaMes.length === 0) return { sugerido: 'sin_evidencia', observacionIds: [] };

  const ruta = RUTAS_DEMO[meta.skillId];
  if (!ruta || !meta.rutaPasoId) return { sugerido: null, observacionIds: ids };
  const idxObjetivo = ruta.pasos.findIndex((paso) => paso.id === meta.rutaPasoId);
  const textos = evidenciaMes.map((e) => (e.observacion.redaccionProfesional ?? '').toLowerCase());
  let mejor = -1;
  ruta.pasos.forEach((paso, i) => {
    if (textos.some((t) => paso.senales.some((s) => t.includes(s)))) mejor = Math.max(mejor, i);
  });
  if (mejor < 0) return { sugerido: null, observacionIds: ids }; // hay evidencia pero no coincide con ninguna señal conocida de la ruta

  if (mejor >= idxObjetivo) {
    const catalogo = SKILLS_CATALOG.find((c) => c.id === meta.skillId);
    if (catalogo?.evidenciaRequerida === 'consistencia_repetida' && evidenciaMes.length < (catalogo.vecesMinimas ?? 3)) {
      return { sugerido: 'emergente', observacionIds: ids };
    }
    return { sugerido: 'adquirido', observacionIds: ids };
  }
  return { sugerido: 'emergente', observacionIds: ids };
}

/** Confirma (o reemplaza) el checkpoint de un mes — SIEMPRE una acción explícita de la maestra.
 * Marca esa evidencia como "vista" para que el aviso de ciclo de vida no vuelva a contarla aparte. */
export function confirmarCheckpoint(
  nino: Nino,
  planId: string,
  metaId: string,
  mes: string,
  estado: EstadoCheckpoint,
  opciones: { sugeridoPorRaiz?: EstadoCheckpoint | null; observacionIds?: string[]; nota?: string } = {}
): Nino {
  const observacionIds = opciones.observacionIds ?? [];
  return actualizarMeta(nino, planId, metaId, (m) => {
    const checkpoints = (m.checkpoints ?? []).filter((c) => c.mes !== mes);
    checkpoints.push({
      mes,
      estado,
      sugeridoPorRaiz: opciones.sugeridoPorRaiz ?? undefined,
      observacionIds: observacionIds.length ? observacionIds : undefined,
      nota: opciones.nota?.trim() || undefined,
      confirmadoEn: FECHA_HOY,
    });
    checkpoints.sort((a, b) => a.mes.localeCompare(b.mes));
    return { ...m, checkpoints, evidenciaVistaIds: Array.from(new Set([...(m.evidenciaVistaIds ?? []), ...observacionIds])) };
  });
}

/** "Esta meta muestra evidencia consistente de adquisición. ¿Quieres marcarla Cumplida?" — SOLO una
 * sugerencia (regla del usuario, punto 10): el checkpoint es evidencia de progreso, el estado de la
 * meta sigue siendo una decisión de la maestra. */
export function sugiereMarcarCumplida(meta: MetaIndividual): boolean {
  if (!metaEstaActiva(meta)) return false;
  const ordenados = [...(meta.checkpoints ?? [])].sort((a, b) => a.mes.localeCompare(b.mes));
  return ordenados[ordenados.length - 1]?.estado === 'adquirido';
}

/* ── AGRUPAR METAS POR ÁREA ── */

export interface GrupoAreaMetas {
  areaId: string;
  area: string;
  metas: MetaIndividual[];
}

export function agruparMetasPorArea(metas: MetaIndividual[]): GrupoAreaMetas[] {
  const grupos = new Map<string, MetaIndividual[]>();
  for (const m of metas) {
    const areaId = m.areaId ?? (m.skillId ? SKILLS_CATALOG.find((c) => c.id === m.skillId)?.dominio : undefined) ?? 'sin-area';
    const arr = grupos.get(areaId) ?? [];
    arr.push(m);
    grupos.set(areaId, arr);
  }
  return Array.from(grupos.entries()).map(([areaId, metas]) => ({
    areaId,
    area: areaId === 'sin-area' ? 'Sin área' : areaDeDominio(areaId),
    metas,
  }));
}

/** Metas ACTIVAS de un niño (de cualquier área) que aplican en un mes dado — usado por la Revisión
 * Mensual para no listar metas que todavía no existían o que ya se cerraron antes de ese mes. */
export function metasParaRevisionDelMes(metas: MetaIndividual[], mes: string): MetaIndividual[] {
  return metas.filter((m) => metaEstaActiva(m) && aplicacionDeMetaEnMes(m, mes) === 'aplica');
}
