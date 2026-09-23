/* ── REGISTRO MENSUAL DE OBSERVACIONES (Sesión 6, paso 7 / 6e-1) ──

   Responde "¿qué observamos exactamente de este niño durante este mes?" — vista DERIVADA de
   Observaciones, nunca un documento aparte que la maestra vuelva a escribir ni algo que se guarde
   o versione (eso es 6e-2, el Informe Mensual — un producto DISTINTO, ver ESTADO.md). Se calcula
   cada vez que se abre.

   Solo entran al Registro PRINCIPAL las observaciones con redacción profesional APROBADA (regla
   del usuario, Sesión 6 paso 7, reafirmada explícita para 6e-1): la nota cruda, lo pendiente de
   redactar y "No observado" quedan fuera, cada uno en su propia sección — nunca mezclados. */

import { SKILLS_CATALOG, estadoRegistroObservacion, type Observacion, type ObservacionSkill } from './seed-data';

function enMes(fecha: string, anio: number, mes: number): boolean {
  return fecha.startsWith(`${anio}-${String(mes).padStart(2, '0')}`);
}

/** Observaciones que SÍ cuentan como el Registro principal de este mes — orden cronológico
 * (regla del usuario: "no quiero síntesis todavía, es el registro de lo que realmente fue
 * documentado"). */
export function observacionesAprobadasDelMes(ninoId: string, anio: number, mes: number, observaciones: Observacion[]): Observacion[] {
  return observaciones
    .filter((o) => o.ninoId === ninoId && enMes(o.fecha, anio, mes) && estadoRegistroObservacion(o) === 'profesional_aprobada')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Sección aparte — NUNCA muestra `notaOriginal` (regla del usuario, punto 5). */
export function pendientesDeRedaccionDelMes(ninoId: string, anio: number, mes: number, observaciones: Observacion[]): Observacion[] {
  return observaciones
    .filter((o) => o.ninoId === ninoId && enMes(o.fecha, anio, mes) && estadoRegistroObservacion(o) === 'pendiente_redaccion')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Sección aparte — "No observado" nunca es evidencia ni observación pendiente (regla del
 * usuario, punto 6). */
export function oportunidadesSinEvidenciaDelMes(ninoId: string, anio: number, mes: number, observaciones: Observacion[]): Observacion[] {
  return observaciones
    .filter((o) => o.ninoId === ninoId && enMes(o.fecha, anio, mes) && estadoRegistroObservacion(o) === 'oportunidad_sin_evidencia')
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
}

export interface HabilidadAceptada {
  skillId: string;
  nombreSkill: string;
  dominio?: string;
}

/** Solo las relaciones ACEPTADAS — una sugerida-sin-revisar no es una "habilidad observada"
 * todavía (regla del usuario, punto 3: "habilidad(es) aceptada(s)"). */
export function habilidadesAceptadasDeObservacion(observacionId: string, relaciones: ObservacionSkill[]): HabilidadAceptada[] {
  return relaciones
    .filter((r) => r.observacionId === observacionId && r.estado === 'aceptado')
    .map((r) => ({ skillId: r.skillId, nombreSkill: r.nombreSkill, dominio: SKILLS_CATALOG.find((s) => s.id === r.skillId)?.dominio }));
}

export interface ResumenRegistroMes {
  totalAprobadas: number;
  diasDistintos: number;
  totalPendientes: number;
}

/** Solo conteos — nunca porcentajes, comparación con el mes anterior ni interpretación (regla del
 * usuario, punto 8: eso es 6e-2). */
export function resumenRegistroMes(aprobadas: Observacion[], pendientes: Observacion[]): ResumenRegistroMes {
  return { totalAprobadas: aprobadas.length, diasDistintos: new Set(aprobadas.map((o) => o.fecha)).size, totalPendientes: pendientes.length };
}

/** "motricidad_fina" → "Motricidad fina" — puramente de presentación (el dato en `SkillCatalogEntry`
 * sigue siendo el slug; no existe todavía un mapa de etiquetas de dominio en el resto de la app). */
export function prettyDominio(slug: string): string {
  const texto = slug.replace(/_/g, ' ');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

export interface OpcionFiltro {
  id: string;
  nombre: string;
}

/** Áreas/dominios presentes entre las observaciones aprobadas de este mes — solo para poblar el
 * filtro, nunca un cálculo de progreso. */
export function areasDelMes(aprobadas: Observacion[], relaciones: ObservacionSkill[]): OpcionFiltro[] {
  const mapa = new Map<string, string>();
  for (const o of aprobadas) {
    for (const h of habilidadesAceptadasDeObservacion(o.id, relaciones)) {
      if (h.dominio && !mapa.has(h.dominio)) mapa.set(h.dominio, prettyDominio(h.dominio));
    }
  }
  return Array.from(mapa, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function habilidadesDelMes(aprobadas: Observacion[], relaciones: ObservacionSkill[]): OpcionFiltro[] {
  const mapa = new Map<string, string>();
  for (const o of aprobadas) {
    for (const h of habilidadesAceptadasDeObservacion(o.id, relaciones)) {
      if (!mapa.has(h.skillId)) mapa.set(h.skillId, h.nombreSkill);
    }
  }
  return Array.from(mapa, ([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function mesAnterior(anio: number, mes: number): { anio: number; mes: number } {
  return mes === 1 ? { anio: anio - 1, mes: 12 } : { anio, mes: mes - 1 };
}

export function mesSiguiente(anio: number, mes: number): { anio: number; mes: number } {
  return mes === 12 ? { anio: anio + 1, mes: 1 } : { anio, mes: mes + 1 };
}
