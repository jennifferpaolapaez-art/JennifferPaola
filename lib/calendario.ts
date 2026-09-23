/* ── CALENDARIO PEDAGÓGICO REAL (Parte C de 4: A Currículo Anual → B Diseño del Mes → C Calendario
   Pedagógico Real → D Calendario → Planeación existente) ──

   Responde: "¿qué ocurre realmente cada día de este mes y cómo distribuimos el contenido de B?".
   Organiza días reales, cierres, eventos, subtemas y vocabulario — NO crea actividades detalladas
   (eso sigue siendo `Actividad`, en Planeación) y NO toca Planeación/Semana/Hoy todavía (llega en D).

   Decisiones ya documentadas en ESTADO.md antes de A:
   · `/hoy` NUNCA usa el contexto seleccionado — solo la fecha real.
   · Estado operativo del día SEPARADO de sus eventos, y de si genera actividad dirigida nueva.
   · Semanas que cruzan de mes componen días de dos `CalendarioMensual` vecinos sin duplicar — cada
     `DiaCalendario` pertenece a su mes real; la composición cruzada es trabajo de la Parte D. ── */

import {
  FECHA_HOY,
  leerNinos,
  leerProgramaConfig,
  MODO_PLANEACION_LABEL,
  type ConfigCierreMensualPrograma,
  type DiaSemanaCompleto,
  type ModoPlaneacion,
  type Nino,
  type ProgramaConfig,
} from './seed-data';
import { type DisenoMensual, type Subtema, type VocabularioItem } from './curriculo';

// `ModoPlaneacion`/`MODO_PLANEACION_LABEL` nacieron aquí en la Parte C pero se movieron a
// `seed-data.ts` en la Parte D (BloqueRutina.modosPermitidos los necesita, y calendario.ts ya
// importa de seed-data.ts — moverlos evita un import circular). Re-exportados tal cual para no
// romper nada que ya los importaba desde `@/lib/calendario`.
export type { ModoPlaneacion };
export { MODO_PLANEACION_LABEL };

/* ── ESTADO OPERATIVO vs EVENTOS (regla del usuario: nunca un solo campo resolviendo ambos) ── */

export type EstadoOperativoDia = 'abierto' | 'cerrado' | 'feriado' | 'dia_administrativo' | 'custom';

export const ESTADO_OPERATIVO_LABEL: Record<EstadoOperativoDia, string> = {
  abierto: 'Abierto',
  cerrado: 'Cerrado',
  feriado: 'Feriado',
  dia_administrativo: 'Día administrativo',
  custom: 'Personalizado',
};

/** Categorías de evento — CULTURAL / ESTACIONAL / CELEBRACIÓN / CUMPLEAÑOS / EVENTO DEL PROGRAMA /
 * PERSONALIZADO nunca se mezclan (regla del usuario, punto 8). Feriado/cierre es un ESTADO
 * operativo, no un evento — por eso no está en esta lista. */
export type TipoEvento = 'cumpleanos' | 'fecha_cultural' | 'estacion' | 'celebracion' | 'evento_programa' | 'personalizado';

export const TIPO_EVENTO_LABEL: Record<TipoEvento, string> = {
  cumpleanos: 'Cumpleaños',
  fecha_cultural: 'Fecha cultural',
  estacion: 'Estación',
  celebracion: 'Celebración / tradición',
  evento_programa: 'Evento del programa',
  personalizado: 'Personalizado',
};

/** Qué tanto peso le da la maestra a un evento aceptado desde una sugerencia (regla del usuario,
 * punto 9: Incluir / Solo mencionar / Mostrar en calendario / No incluir — este último nunca crea
 * un `EventoDia`). Eventos creados a mano en el día usan `'incluir'` por defecto. */
export type NivelEvento = 'incluir' | 'mencionar' | 'solo_calendario';

export interface EventoDia {
  id: string;
  tipo: TipoEvento;
  nombre: string;
  nivel: NivelEvento;
  origen: 'sugerido' | 'maestra';
  ninoId?: string;
  notas?: string;
}

/** Qué palabra de vocabulario de UN subtema (de B) se trabaja este día — SIEMPRE una referencia al
 * `VocabularioItem.id` original, nunca una copia del texto (regla del usuario, punto 12). */
export interface FocoVocabularioDia {
  subtemaId: string;
  vocabularioId: string;
}

export interface DiaCalendario {
  fecha: string; // AAAA-MM-DD
  estado: EstadoOperativoDia;
  incluidoEnPlaneacion: boolean;
  modoPlaneacion: ModoPlaneacion;
  subtemaId?: string;
  vocabularioDelDia: FocoVocabularioDia[];
  eventos: EventoDia[];
  esCierreMensual?: boolean;
  notas?: string;
  /** Nunca se pisa al "Regenerar propuesta" (mismo patrón que `calcularPersonalizacionSemana` en
   * Planeación) — un día que la maestra tocó queda tal cual hasta que ella lo cambie de nuevo. */
  editadoManualmente?: boolean;
}

export interface CalendarioMensual {
  id: string;
  anio: number;
  mes: number;
  disenoMensualId: string;
  dias: DiaCalendario[];
  version: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

/* ── CONFIGURACIÓN DEL PROGRAMA que necesita el Calendario (reservada en `ProgramaConfig`,
   `seed-data.ts`, con su propio tipo de 7 días — `DiaSemana` existente es de 5 días y ya lo usa
   Planeación; ampliarlo rompería lo que ya funciona, así que el Calendario usa el suyo propio y la
   reconciliación real ocurre en la Parte D). ── */

export const DIAS_SEMANA_COMPLETOS: DiaSemanaCompleto[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const INDICE_DIA_SEMANA: Record<number, DiaSemanaCompleto> = { 0: 'Dom', 1: 'Lun', 2: 'Mar', 3: 'Mié', 4: 'Jue', 5: 'Vie', 6: 'Sáb' };

export const CHECKLIST_CIERRE_MENSUAL_DEMO: string[] = [
  'Organizar arte y trabajos de los niños',
  'Revisar observaciones pendientes',
  'Preparar el Registro Mensual',
  'Preparar el Informe Mensual',
  'Revisar el Plan Individual de cada niño',
  'Seleccionar evidencias del mes',
  'Organizar materiales',
  'Preparar el próximo mes',
];

const DIAS_APERTURA_DEFAULT: DiaSemanaCompleto[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

export function diasAperturaPrograma(config: ProgramaConfig = leerProgramaConfig()): DiaSemanaCompleto[] {
  return config.diasAperturaPrograma ?? DIAS_APERTURA_DEFAULT;
}

export function cierreMensualConfig(config: ProgramaConfig = leerProgramaConfig()): ConfigCierreMensualPrograma {
  return config.cierreMensualConfig ?? { activo: true, checklist: CHECKLIST_CIERRE_MENSUAL_DEMO };
}

/* ── PERSISTENCIA ── */

const CALENDARIOS_STORAGE_KEY = 'raiz_calendarios_mensuales';

export function leerCalendariosMensuales(): CalendarioMensual[] {
  if (typeof window === 'undefined') return [];
  try {
    const guardado = window.localStorage.getItem(CALENDARIOS_STORAGE_KEY);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado) as CalendarioMensual[];
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

export function guardarCalendariosMensuales(calendarios: CalendarioMensual[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CALENDARIOS_STORAGE_KEY, JSON.stringify(calendarios));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

export function calendarioDeMes(anio: number, mes: number, calendarios: CalendarioMensual[] = leerCalendariosMensuales()): CalendarioMensual | undefined {
  return calendarios.find((c) => c.anio === anio && c.mes === mes);
}

function tocar(cal: CalendarioMensual): CalendarioMensual {
  return { ...cal, version: cal.version + 1, fechaActualizacion: FECHA_HOY };
}

/* ── GENERAR EL CALENDARIO BASE (días reales del mes, según los días de apertura configurados) ── */

function ultimoDiaDelMes(anio: number, mes: number): number {
  return new Date(anio, mes, 0).getDate();
}

function fechaISO(anio: number, mes: number, dia: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

export function diaSemanaDe(fecha: string): DiaSemanaCompleto {
  return INDICE_DIA_SEMANA[new Date(`${fecha}T00:00:00`).getDay()];
}

/** Crea los `DiaCalendario` del mes: `abierto` los días de apertura configurados, `cerrado` el
 * resto — la maestra ajusta feriados/días admin/excepciones editando el día directamente, sin
 * necesitar un catálogo de vacaciones aparte todavía. Si el cierre de mes está activo, marca el
 * ÚLTIMO día de apertura del mes como `esCierreMensual` (abierto, rutina ligera — nunca "cerrado"). */
export function crearCalendarioBase(anio: number, mes: number, disenoMensualId: string, config: ProgramaConfig = leerProgramaConfig()): CalendarioMensual {
  const apertura = diasAperturaPrograma(config);
  const cierre = cierreMensualConfig(config);
  const totalDias = ultimoDiaDelMes(anio, mes);
  const dias: DiaCalendario[] = [];
  for (let d = 1; d <= totalDias; d++) {
    const fecha = fechaISO(anio, mes, d);
    const abierto = apertura.includes(diaSemanaDe(fecha));
    dias.push({
      fecha,
      estado: abierto ? 'abierto' : 'cerrado',
      incluidoEnPlaneacion: abierto,
      modoPlaneacion: 'normal',
      vocabularioDelDia: [],
      eventos: [],
    });
  }
  if (cierre.activo) {
    const ultimoAbierto = [...dias].reverse().find((d) => d.estado === 'abierto');
    if (ultimoAbierto) {
      ultimoAbierto.esCierreMensual = true;
      ultimoAbierto.modoPlaneacion = 'rutina_ligera';
    }
  }
  return {
    id: `calendario-${Date.now()}`,
    anio,
    mes,
    disenoMensualId,
    dias,
    version: 1,
    fechaCreacion: FECHA_HOY,
    fechaActualizacion: FECHA_HOY,
  };
}

export function diaDeCalendario(calendario: CalendarioMensual, fecha: string): DiaCalendario | undefined {
  return calendario.dias.find((d) => d.fecha === fecha);
}

/** Actualiza UN día — por defecto lo marca `editadoManualmente` (regla del usuario: "las ediciones
 * manuales son sagradas"). Pasar `manual:false` solo lo usa la propia `distribuirMes`. */
export function actualizarDia(calendario: CalendarioMensual, fecha: string, cambios: Partial<DiaCalendario>, manual = true): CalendarioMensual {
  return tocar({
    ...calendario,
    dias: calendario.dias.map((d) => (d.fecha === fecha ? { ...d, ...cambios, editadoManualmente: manual ? true : d.editadoManualmente } : d)),
  });
}

/** Los eventos son un eje independiente del subtema/vocabulario del día (regla del usuario, punto
 * 8) — agregar o quitar uno NUNCA marca `editadoManualmente`, o un cumpleaños aceptado desde
 * Sugerencias sacaría en silencio ese día del reparto de subtemas la próxima vez que se regenere. */
export function agregarEvento(calendario: CalendarioMensual, fecha: string, evento: Omit<EventoDia, 'id'>): CalendarioMensual {
  const dia = diaDeCalendario(calendario, fecha);
  if (!dia) return calendario;
  return actualizarDia(calendario, fecha, { eventos: [...dia.eventos, { ...evento, id: `evento-${Date.now()}-${Math.round(Math.random() * 1000)}` }] }, false);
}

export function quitarEvento(calendario: CalendarioMensual, fecha: string, eventoId: string): CalendarioMensual {
  const dia = diaDeCalendario(calendario, fecha);
  if (!dia) return calendario;
  return actualizarDia(calendario, fecha, { eventos: dia.eventos.filter((e) => e.id !== eventoId) }, false);
}

/* ── SUGERENCIAS PARA EL MES — cumpleaños (DOB real) + fechas de varias fuentes (DEMO) ──
   ⚠️ DEMO: sin perfiles reales de familias/staff todavía. Las 4 fuentes de `FuenteSugerenciaFecha`
   ya son el mapeo definitivo para cuando existan esos perfiles — no cambia la forma, solo de dónde
   se leen los datos:
     - `ubicacion`      → ubicación geográfica del programa (ciudad/país configurado).
     - `comunidad`      → culturas/comunidades que las FAMILIAS proporcionen explícitamente en su
                          perfil. HOY se simula filtrando el catálogo DEMO contra
                          `culturasRelacionadas` (las que la maestra ya escribió en el Diseño del
                          Mes, B) — nunca inferido del nombre/apellido de un niño ni de ningún otro
                          dato personal.
     - `equipo`         → culturas/tradiciones que el STAFF proporcione explícitamente en su
                          perfil (sin catálogo DEMO todavía — 0 entradas, ver `FECHAS_SUGERIDAS_DEMO`).
     - `programa`       → preferencias culturales / estacionales / de tradición que el programa
                          mismo configure (estaciones e "tradiciones del programa" del catálogo DEMO).
   Un quinto tipo de sugerencia, "evento personalizado" (`TipoEvento: 'personalizado'`), ya existe
   a nivel de `DiaCalendario.eventos` — lo agrega la maestra a mano, nunca es una sugerencia de
   RAÍZ. En ningún caso —ni hoy en DEMO ni en producción— una sugerencia sale de inferir cultura,
   idioma o tradición a partir del nombre o apellido de un niño o familia: siempre de un dato que
   la familia/staff/programa proporcionó explícitamente. */

export type FuenteSugerenciaFecha = 'ubicacion' | 'comunidad' | 'equipo' | 'programa';

export const FUENTE_SUGERENCIA_LABEL: Record<FuenteSugerenciaFecha, string> = {
  ubicacion: 'Por tu ubicación',
  comunidad: 'Por tu comunidad',
  equipo: 'De tu equipo',
  programa: 'Tradiciones del programa',
};

interface FechaSugeridaDemo {
  id: string;
  nombre: string;
  mesDia: string; // 'MM-DD'
  tipo: TipoEvento;
  fuente: FuenteSugerenciaFecha;
}

/** DEMO — nunca inventa biografías: son fechas cívicas/estacionales de dominio público (día de
 * independencia, inicio de estación) o ejemplos de tradición claramente editables, nunca hechos
 * sobre personas. Las estaciones están calculadas para el hemisferio norte (mismo aviso que las
 * culturas: sin ubicación geográfica real todavía, se documenta como pendiente para producción). */
const FECHAS_SUGERIDAS_DEMO: FechaSugeridaDemo[] = [
  { id: 'co-independencia', nombre: 'Independencia de Colombia', mesDia: '07-20', tipo: 'fecha_cultural', fuente: 'comunidad' },
  { id: 'ec-independencia', nombre: 'Primer Grito de Independencia de Ecuador', mesDia: '08-10', tipo: 'fecha_cultural', fuente: 'comunidad' },
  { id: 'mx-independencia', nombre: 'Independencia de México', mesDia: '09-16', tipo: 'fecha_cultural', fuente: 'comunidad' },
  { id: 'us-independencia', nombre: 'Independence Day (Estados Unidos)', mesDia: '07-04', tipo: 'fecha_cultural', fuente: 'ubicacion' },
  { id: 'otono-norte', nombre: 'Primer día de otoño (hemisferio norte)', mesDia: '09-22', tipo: 'estacion', fuente: 'programa' },
  { id: 'invierno-norte', nombre: 'Primer día de invierno (hemisferio norte)', mesDia: '12-21', tipo: 'estacion', fuente: 'programa' },
  { id: 'primavera-norte', nombre: 'Primer día de primavera (hemisferio norte)', mesDia: '03-20', tipo: 'estacion', fuente: 'programa' },
  { id: 'verano-norte', nombre: 'Primer día de verano (hemisferio norte)', mesDia: '06-21', tipo: 'estacion', fuente: 'programa' },
  { id: 'semana-lectura', nombre: 'Semana de la lectura (ejemplo — ajusta la fecha real de tu programa)', mesDia: '10-15', tipo: 'celebracion', fuente: 'programa' },
  { id: 'dia-familia', nombre: 'Día de la familia (ejemplo — ajusta la fecha real de tu programa)', mesDia: '11-14', tipo: 'evento_programa', fuente: 'programa' },
];

export interface SugerenciaFecha {
  id: string;
  nombre: string;
  fecha: string; // AAAA-MM-DD ya resuelta para el año del calendario
  tipo: TipoEvento;
  fuente: FuenteSugerenciaFecha;
}

export interface SugerenciaCumpleanos {
  id: string;
  ninoId: string;
  ninoNombre: string;
  fecha: string;
}

export interface SugerenciasDelMes {
  fechas: SugerenciaFecha[];
  cumpleanos: SugerenciaCumpleanos[];
}

/** Culturas de la fuente "comunidad": las que la maestra ya escribió en `culturasRelacionadas` del
 * Diseño del Mes (B) — nunca inferidas, nunca asumidas. */
function sugerenciasDeFechas(anio: number, mes: number, culturasRelacionadas: string[]): SugerenciaFecha[] {
  const mesStr = String(mes).padStart(2, '0');
  return FECHAS_SUGERIDAS_DEMO.filter((f) => f.mesDia.startsWith(`${mesStr}-`))
    .filter((f) => (f.fuente !== 'comunidad' ? true : culturasRelacionadas.some((c) => f.nombre.toLowerCase().includes(c.toLowerCase()))))
    .map((f) => ({ id: f.id, nombre: f.nombre, fecha: `${anio}-${f.mesDia}`, tipo: f.tipo, fuente: f.fuente }));
}

/** Cumpleaños reales, desde el DOB de los niños activos — solo se PROPONEN, nunca se agregan solos
 * (regla del usuario). */
function sugerenciasDeCumpleanos(anio: number, mes: number, ninos: Nino[] = leerNinos()): SugerenciaCumpleanos[] {
  return ninos
    .filter((n) => new Date(`${n.fechaNacimiento}T00:00:00`).getMonth() + 1 === mes)
    .map((n) => ({ id: `cumple-${n.id}`, ninoId: n.id, ninoNombre: n.nombre, fecha: `${anio}-${String(mes).padStart(2, '0')}-${n.fechaNacimiento.slice(8, 10)}` }));
}

export function sugerenciasDelMes(anio: number, mes: number, diseno: DisenoMensual | undefined): SugerenciasDelMes {
  return {
    fechas: sugerenciasDeFechas(anio, mes, (diseno?.culturasRelacionadas ?? []).map((c) => c.nombre)),
    cumpleanos: sugerenciasDeCumpleanos(anio, mes),
  };
}

/** Aplica una sugerencia de fecha ya decidida por la maestra — `nivel !== null` la agrega con ese
 * nivel; `nivel === null` es "No incluir" y nunca crea nada. */
export function aplicarSugerenciaFecha(calendario: CalendarioMensual, sugerencia: SugerenciaFecha, nivel: NivelEvento | null): CalendarioMensual {
  if (!nivel) return calendario;
  return agregarEvento(calendario, sugerencia.fecha, { tipo: sugerencia.tipo, nombre: sugerencia.nombre, nivel, origen: 'sugerido' });
}

export function aplicarSugerenciaCumpleanos(calendario: CalendarioMensual, sugerencia: SugerenciaCumpleanos, nivel: NivelEvento | null): CalendarioMensual {
  if (!nivel) return calendario;
  return agregarEvento(calendario, sugerencia.fecha, { tipo: 'cumpleanos', nombre: `Cumpleaños de ${sugerencia.ninoNombre}`, nivel, origen: 'sugerido', ninoId: sugerencia.ninoId });
}

/* ── DISTRIBUIR EL MES — propuesta, nunca "4 subtemas = 4 semanas" (regla del usuario) ── */

// DEMO — tope de días por subtema antes de considerar el resto "días sobrantes" a preguntar, en
// vez de estirar silenciosamente un subtema. No es criterio pedagógico oficial.
const TOPE_DIAS_POR_SUBTEMA_DEMO = 6;

export interface ResultadoDistribucion {
  calendario: CalendarioMensual;
  diasSobrantes: string[];
}

/** Solo toca días `abierto`, `incluidoEnPlaneacion`, `modoPlaneacion==='normal'` y SIN
 * `editadoManualmente` — nunca pisa lo que la maestra ya ajustó, nunca le quita el día a un cierre
 * de mes (que es `rutina_ligera`, no `normal`). Reparte los subtemas de B proporcional a esos días
 * reales, con un tope por subtema (DEMO) para no estirar uno solo — el resto queda como "días
 * sobrantes" para que la maestra decida, nunca un quinto subtema automático. */
export function distribuirMesConSubtemas(calendario: CalendarioMensual, diseno: DisenoMensual): ResultadoDistribucion {
  const subtemas = [...diseno.subtemas].sort((a, b) => a.orden - b.orden);
  const diasAsignables = calendario.dias.filter((d) => d.estado === 'abierto' && d.incluidoEnPlaneacion && d.modoPlaneacion === 'normal' && !d.editadoManualmente).map((d) => d.fecha);

  if (subtemas.length === 0 || diasAsignables.length === 0) return { calendario, diasSobrantes: diasAsignables };

  const base = Math.min(Math.floor(diasAsignables.length / subtemas.length), TOPE_DIAS_POR_SUBTEMA_DEMO);
  const restante = diasAsignables.length - base * subtemas.length;
  const conExtra = base < TOPE_DIAS_POR_SUBTEMA_DEMO ? Math.min(restante, subtemas.length) : 0;

  const asignacionPorSubtema: { subtema: Subtema; cantidad: number }[] = subtemas.map((s, i) => ({ subtema: s, cantidad: base + (i < conExtra ? 1 : 0) }));
  const totalAsignado = asignacionPorSubtema.reduce((acc, a) => acc + a.cantidad, 0);
  const diasSobrantes = diasAsignables.slice(totalAsignado);

  const asignacionPorFecha = new Map<string, Subtema>();
  let cursor = 0;
  for (const { subtema, cantidad } of asignacionPorSubtema) {
    for (let i = 0; i < cantidad; i++) {
      asignacionPorFecha.set(diasAsignables[cursor], subtema);
      cursor++;
    }
  }

  const dias = calendario.dias.map((d) => {
    const subtema = asignacionPorFecha.get(d.fecha);
    if (!subtema) return d;
    // Reparte el vocabulario del subtema entre SUS días asignados, cíclicamente — referencia al
    // VocabularioItem.id original, nunca copia el texto (regla del usuario).
    const diasDeEsteSubtema = diasAsignables.filter((f) => asignacionPorFecha.get(f)?.id === subtema.id);
    const idx = diasDeEsteSubtema.indexOf(d.fecha);
    const palabra: VocabularioItem | undefined = subtema.vocabulario[idx % Math.max(subtema.vocabulario.length, 1)];
    return {
      ...d,
      subtemaId: subtema.id,
      vocabularioDelDia: palabra ? [{ subtemaId: subtema.id, vocabularioId: palabra.id }] : [],
    };
  });

  return { calendario: tocar({ ...calendario, dias }), diasSobrantes };
}

export type AccionDiasSobrantes = 'continuar_ultimo' | 'integracion' | 'decidir_luego';

/** Las 4 opciones del usuario ante días sobrantes: "extender contenido actual" (continuar el
 * último subtema), "usar integración/proyecto", "decidirlo tú" (los deja sin subtema, editables a
 * mano), o "crear un nuevo subtema" — esa última NO se resuelve aquí: manda de vuelta al Diseño del
 * Mes (B), porque un subtema nuevo es contenido, no una decisión de calendario. */
export function resolverDiasSobrantes(calendario: CalendarioMensual, diseno: DisenoMensual, fechas: string[], accion: AccionDiasSobrantes): CalendarioMensual {
  if (accion === 'decidir_luego' || fechas.length === 0) return calendario;
  const ultimoSubtema = [...diseno.subtemas].sort((a, b) => a.orden - b.orden).at(-1);
  const dias = calendario.dias.map((d) => {
    if (!fechas.includes(d.fecha)) return d;
    if (accion === 'continuar_ultimo' && ultimoSubtema) return { ...d, subtemaId: ultimoSubtema.id };
    if (accion === 'integracion') return { ...d, notas: d.notas ? d.notas : 'Integración / repaso del mes' };
    return d;
  });
  return tocar({ ...calendario, dias });
}
