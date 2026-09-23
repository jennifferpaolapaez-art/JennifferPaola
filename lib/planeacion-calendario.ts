/* ── PARTE D — CALENDARIO → PLANEACIÓN ──

   Conecta el Calendario Pedagógico Real (Parte C, ya aprobado) con la Planeación semanal que ya
   existía (Sesión 5) — SIN reconstruirla. Materializa el ESQUELETO de una semana (bloques de
   rutina configurados, por día, según su modo de planeación) UNA sola vez; de ahí en adelante la
   maestra trabaja sobre esa Planeación como siempre. El Calendario nunca la vuelve a tocar solo —
   solo detecta cambios y los muestra como aviso, nunca los aplica en silencio.

   D NO genera contenido pedagógico (título/objetivo/materiales/pasos) ni actividades con IA — eso
   sigue siendo trabajo de la maestra o de una fase posterior. D solo conecta estructura:
   Calendario → semana → días → bloques (vacíos, marcados `contenidoPendiente`).

   Límite conocido y documentado a propósito (no oculto): `DiaPlan.dia` sigue siendo `DiaSemana`
   (Lun–Vie, 5 valores) — ampliarlo a los 7 días de `DiaSemanaCompleto` tocaría
   `Nino.diasAsistencia` y toda la personalización ya construida en Sesión 6. Un programa que abre
   sábado/domingo puede tener esos días `abierto` en el Calendario; D los deja fuera de la
   Planeación materializada y los reporta en `origenCalendario.diasFueraDeAlcance` en vez de
   forzarlos o fallar en silencio. */

import {
  FECHA_HOY,
  bloquesPermitidosEnModo,
  BLOQUE_LABEL,
  guardarUnaPlaneacion,
  leerPlaneaciones,
  leerProgramaConfig,
  planeacionPorWeekKey,
  type Actividad,
  type DiaPlan,
  type DiaSemana,
  type FingerprintDia,
  type InicioSemana,
  type ModoPlaneacion,
  type OrigenCalendarioDia,
  type PlaneacionSemanal,
  type ProgramaConfig,
} from './seed-data';
import {
  calendarioDeMes,
  diaDeCalendario,
  diaSemanaDe,
  leerCalendariosMensuales,
  type CalendarioMensual,
  type DiaCalendario,
} from './calendario';
import { disenoDeMes, leerDisenosMensuales, type DisenoMensual } from './curriculo';

/* ── FECHAS — mismos patrones de `lib/calendario.ts` (componentes locales, nunca `toISOString`,
   para no desfasar por huso horario). ── */

function sumarDias(fecha: string, dias: number): string {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** El primer día de la SEMANA CALENDARIO que contiene `fecha`, según `inicioSemana` — identidad
 * estable de una semana (regla del usuario: nunca "primer día abierto", eso varía por programa). */
export function inicioDeSemanaCalendario(fecha: string, inicioSemana: InicioSemana = 'lunes'): string {
  const dow = new Date(`${fecha}T00:00:00`).getDay(); // 0=Dom..6=Sáb
  const offset = inicioSemana === 'lunes' ? (dow + 6) % 7 : dow;
  return sumarDias(fecha, -offset);
}

export function finDeSemanaCalendario(weekKey: string): string {
  return sumarDias(weekKey, 6);
}

const MAPA_A_DIA_SEMANA: Partial<Record<string, DiaSemana>> = { Lun: 'Lun', Mar: 'Mar', Mié: 'Mié', Jue: 'Jue', Vie: 'Vie' };

function diaCalendarioDeFecha(fecha: string, calendarios: CalendarioMensual[]): DiaCalendario | undefined {
  const [anioStr, mesStr] = fecha.split('-');
  const cal = calendarioDeMes(Number(anioStr), Number(mesStr), calendarios);
  return cal ? diaDeCalendario(cal, fecha) : undefined;
}

function calendarioMensualDeFecha(fecha: string, calendarios: CalendarioMensual[]): CalendarioMensual | undefined {
  const [anioStr, mesStr] = fecha.split('-');
  return calendarioDeMes(Number(anioStr), Number(mesStr), calendarios);
}

/* ── FINGERPRINT — firma determinística de un `DiaCalendario`, suficiente para comparar
   estructura (regla del usuario: "no hace falta hash criptográfico"). ── */

export function fingerprintDiaCalendario(dia: DiaCalendario): FingerprintDia {
  const vocab = dia.vocabularioDelDia.map((v) => v.vocabularioId).slice().sort().join(',');
  const eventos = dia.eventos.map((e) => `${e.tipo}:${e.nombre}`).slice().sort().join('|');
  return [dia.estado, dia.incluidoEnPlaneacion ? '1' : '0', dia.modoPlaneacion, dia.subtemaId ?? '', vocab, eventos, dia.esCierreMensual ? '1' : '0'].join('::');
}

/* ── ESQUELETO DE UN DÍA — los bloques de rutina configurados, filtrados por el modo de
   planeación del día (regla del usuario, punto 5/6: D materializa la ESTRUCTURA de la rutina, no
   un `actividades: []` vacío; qué bloque aplica en qué modo lo decide `ProgramaConfig`, nunca un
   booleano fijo en código). ── */

function construirActividadesEsqueleto(fecha: string, diaSemana: DiaSemana, modo: ModoPlaneacion, config: ProgramaConfig): Actividad[] {
  const bloques = bloquesPermitidosEnModo(config.rutinaBloques, modo).filter((b) => b.dias.includes(diaSemana));
  return bloques.map((b, i) => ({
    id: `${fecha}-${b.bloque}-${i}`,
    bloque: b.bloque,
    hora: b.horaAproximada,
    titulo: b.nombrePersonalizado ?? BLOQUE_LABEL[b.bloque],
    objetivo: '',
    dominio: '',
    materiales: [],
    contenidoPendiente: true,
  }));
}

function construirOrigenDia(cal: CalendarioMensual, diaCal: DiaCalendario): OrigenCalendarioDia {
  return {
    calendarioMensualId: cal.id,
    subtemaId: diaCal.subtemaId,
    vocabularioIds: diaCal.vocabularioDelDia.map((v) => v.vocabularioId),
    modoPlaneacion: diaCal.modoPlaneacion,
    esCierreMensual: !!diaCal.esCierreMensual,
    eventos: diaCal.eventos.map((e) => ({ tipo: e.tipo, nombre: e.nombre })),
    fingerprint: fingerprintDiaCalendario(diaCal),
  };
}

function construirDiaPlanDesdeCalendario(fecha: string, calendarios: CalendarioMensual[], disenos: DisenoMensual[], config: ProgramaConfig): { dia?: DiaPlan; fueraDeAlcance?: string } {
  const cal = calendarioMensualDeFecha(fecha, calendarios);
  const diaCal = cal ? diaDeCalendario(cal, fecha) : undefined;
  if (!cal || !diaCal || diaCal.estado !== 'abierto' || !diaCal.incluidoEnPlaneacion) return {};

  const diaSemanaCompleto = diaSemanaDe(fecha);
  const diaSemana = MAPA_A_DIA_SEMANA[diaSemanaCompleto];
  if (!diaSemana) return { fueraDeAlcance: fecha }; // sábado/domingo — ver límite documentado arriba

  const diseno = disenoDeMes(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)), disenos);
  const subtema = diaCal.subtemaId ? diseno?.subtemas.find((s) => s.id === diaCal.subtemaId) : undefined;

  return {
    dia: {
      dia: diaSemana,
      fecha,
      temaDia: subtema?.nombre ?? '',
      focoDia: subtema?.enfoque ?? '',
      actividades: construirActividadesEsqueleto(fecha, diaSemana, diaCal.modoPlaneacion, config),
      origenCalendario: construirOrigenDia(cal, diaCal),
    },
  };
}

/* ── MATERIALIZAR — crea la Planeación UNA vez a partir del Calendario. Nunca sobrescribe una ya
   existente para el mismo `weekKey` (regla del usuario, punto O: evitar duplicados) — quien llama
   debe usar `buscarOMaterializarSemana` para ese caso. ── */

export interface ResultadoMaterializacion {
  plan: PlaneacionSemanal;
  diasFueraDeAlcance: string[];
}

export function materializarSemanaDesdeCalendario(
  fechaDeReferencia: string,
  opciones?: { config?: ProgramaConfig; calendarios?: CalendarioMensual[]; disenos?: DisenoMensual[] }
): ResultadoMaterializacion {
  const config = opciones?.config ?? leerProgramaConfig();
  const calendarios = opciones?.calendarios ?? leerCalendariosMensuales();
  const disenos = opciones?.disenos ?? leerDisenosMensuales();
  const inicioSemana = config.inicioSemana ?? 'lunes';
  const weekKey = inicioDeSemanaCalendario(fechaDeReferencia, inicioSemana);
  const rangoFin = finDeSemanaCalendario(weekKey);

  const dias: DiaPlan[] = [];
  const diasFueraDeAlcance: string[] = [];
  for (let i = 0; i <= 6; i++) {
    const fecha = sumarDias(weekKey, i);
    const { dia, fueraDeAlcance } = construirDiaPlanDesdeCalendario(fecha, calendarios, disenos, config);
    if (dia) dias.push(dia);
    if (fueraDeAlcance) diasFueraDeAlcance.push(fueraDeAlcance);
  }

  // Resumen de semana (temaMensual/subtemaSemanal): solo se rellena cuando es inequívoco — nunca
  // se inventa un tema cuando los días de la semana tocan más de un subtema distinto. El
  // vocabulario de texto libre (legado) se deja vacío a propósito: el vocabulario real vive por
  // referencia en `origenCalendario.vocabularioIds` de cada día, nunca copiado aquí como texto.
  const subtemasUnicos = new Set(dias.map((d) => d.origenCalendario?.subtemaId).filter(Boolean));
  const subtemaComun = subtemasUnicos.size === 1 ? dias.find((d) => d.origenCalendario?.subtemaId)?.temaDia : undefined;

  const plan: PlaneacionSemanal = {
    id: `plan-${weekKey}-${Date.now()}`,
    weekKey,
    rangoInicio: weekKey,
    rangoFin,
    origenCalendario: { weekKey, materializadaEn: FECHA_HOY, diasFueraDeAlcance: diasFueraDeAlcance.length > 0 ? diasFueraDeAlcance : undefined },
    temaMensual: '',
    subtemaSemanal: subtemaComun ?? '',
    vocabulario: [],
    objetivosGenerales: [],
    dominiosPrincipales: [],
    dias,
    personalizacionActiva: false,
  };
  return { plan, diasFueraDeAlcance };
}

/** Punto de entrada para la UI — nunca crea dos veces la misma semana calendario (busca primero
 * por `weekKey`, regla del usuario punto O). */
export function buscarOMaterializarSemana(fechaDeReferencia: string): { plan: PlaneacionSemanal; creada: boolean } {
  const config = leerProgramaConfig();
  const weekKey = inicioDeSemanaCalendario(fechaDeReferencia, config.inicioSemana ?? 'lunes');
  const existente = planeacionPorWeekKey(weekKey);
  if (existente) return { plan: existente, creada: false };
  const { plan } = materializarSemanaDesdeCalendario(fechaDeReferencia, { config });
  guardarUnaPlaneacion(plan);
  return { plan, creada: true };
}

/* ── DETECCIÓN DE CAMBIOS — nunca sincroniza sola; solo compara y reporta (regla del usuario:
   "no quiero regeneración silenciosa"). ── */

export type TipoConflictoDia = 'sin_cambios' | 'cambio_estructural' | 'ahora_cerrado' | 'dia_nuevo_disponible';

export interface ConflictoDia {
  fecha: string;
  tipo: TipoConflictoDia;
  /** Si el `DiaPlan` ya tiene contenido pedagógico real (no solo el esqueleto de rutina) — la
   * maestra escribió algo, o hay adaptaciones/notas/foco. Nunca se borra solo (regla del usuario,
   * punto 4). */
  hayTrabajoReal: boolean;
}

/** Un bloque con contenido más allá del esqueleto — regla del usuario, punto 4: "Calendario nunca
 * destruye trabajo humano existente". */
export function hayTrabajoReal(dia: DiaPlan): boolean {
  return dia.actividades.some(
    (a) => a.contenidoPendiente !== true || !!a.notas?.trim() || (a.adaptacionesIndividuales?.length ?? 0) > 0 || (a.ninosFoco?.length ?? 0) > 0
  );
}

/** Compara cada `DiaPlan` materializado contra el `DiaCalendario` actual (por fingerprint) y
 * detecta días nuevos que el Calendario ya tiene abiertos pero la Planeación no conoce todavía.
 * Solo lee y compara — nunca modifica el plan. */
export function detectarConflictos(plan: PlaneacionSemanal, calendarios: CalendarioMensual[] = leerCalendariosMensuales()): ConflictoDia[] {
  if (!plan.rangoInicio || !plan.rangoFin) return []; // plan legado sin Calendario detrás — nada que sincronizar
  const conflictos: ConflictoDia[] = [];

  for (const dia of plan.dias) {
    if (!dia.origenCalendario) continue;
    const diaCalActual = diaCalendarioDeFecha(dia.fecha, calendarios);
    const trabajo = hayTrabajoReal(dia);
    // Firma "ausente" estable cuando el `DiaCalendario` ya no existe (mes borrado, etc.) — nunca
    // vacía, para no confundirla con un fingerprint real que coincida por casualidad.
    const fingerprintActual = diaCalActual ? fingerprintDiaCalendario(diaCalActual) : '::ausente::';
    // Ya reconocido: la maestra ya vio este cambio y eligió "actualizar" (que refresca
    // `origenCalendario.fingerprint` al valor actual) — no se vuelve a mostrar como conflicto
    // nuevo hasta que el Calendario cambie OTRA vez de verdad.
    if (fingerprintActual === dia.origenCalendario.fingerprint) continue;
    if (!diaCalActual || diaCalActual.estado !== 'abierto' || !diaCalActual.incluidoEnPlaneacion) {
      conflictos.push({ fecha: dia.fecha, tipo: 'ahora_cerrado', hayTrabajoReal: trabajo });
      continue;
    }
    conflictos.push({ fecha: dia.fecha, tipo: 'cambio_estructural', hayTrabajoReal: trabajo });
  }

  const fechasYaEnPlan = new Set(plan.dias.map((d) => d.fecha));
  for (let i = 0; i <= 6; i++) {
    const fecha = sumarDias(plan.rangoInicio, i);
    if (fechasYaEnPlan.has(fecha)) continue;
    const diaCalActual = diaCalendarioDeFecha(fecha, calendarios);
    if (diaCalActual && diaCalActual.estado === 'abierto' && diaCalActual.incluidoEnPlaneacion && MAPA_A_DIA_SEMANA[diaSemanaDe(fecha)]) {
      conflictos.push({ fecha, tipo: 'dia_nuevo_disponible', hayTrabajoReal: false });
    }
  }
  return conflictos;
}

/* ── RESOLUCIÓN — siempre explícita, nunca automática. ── */

export type AccionConflictoDia = 'mantener' | 'actualizar' | 'quitar_dia' | 'agregar_dia';

/** Aplica UNA decisión de la maestra sobre UN día en conflicto.
 * - `mantener`: no toca nada — ignora el cambio detectado en este ciclo.
 * - `actualizar`: refresca `temaDia`/`focoDia`/`origenCalendario` desde el Calendario actual
 *   (incluido si ahora figura cerrado) — `actividades[]` NUNCA se toca, se conserva tal cual
 *   (regla del usuario, punto 4 y J).
 * - `quitar_dia`: elimina el `DiaPlan` de la semana — la UI debe pedir confirmación extra si
 *   `hayTrabajoReal` era `true` (regla del usuario: "quitarlo debe requerir confirmación").
 * - `agregar_dia`: crea un `DiaPlan` nuevo (esqueleto) para una fecha que el Calendario ya tiene
 *   abierta pero que todavía no existía en esta Planeación. */
export function resolverConflictoDia(
  plan: PlaneacionSemanal,
  fecha: string,
  accion: AccionConflictoDia,
  opciones?: { calendarios?: CalendarioMensual[]; disenos?: DisenoMensual[]; config?: ProgramaConfig }
): PlaneacionSemanal {
  const calendarios = opciones?.calendarios ?? leerCalendariosMensuales();
  const disenos = opciones?.disenos ?? leerDisenosMensuales();
  const config = opciones?.config ?? leerProgramaConfig();

  if (accion === 'mantener') return plan;

  if (accion === 'quitar_dia') {
    return { ...plan, dias: plan.dias.filter((d) => d.fecha !== fecha) };
  }

  if (accion === 'agregar_dia') {
    if (plan.dias.some((d) => d.fecha === fecha)) return plan;
    const { dia } = construirDiaPlanDesdeCalendario(fecha, calendarios, disenos, config);
    if (!dia) return plan;
    return { ...plan, dias: [...plan.dias, dia].sort((a, b) => a.fecha.localeCompare(b.fecha)) };
  }

  // 'actualizar' — refresca metadata/contexto, conserva actividades[] intacto siempre.
  const diaCalActual = diaCalendarioDeFecha(fecha, calendarios);
  return {
    ...plan,
    dias: plan.dias.map((d) => {
      if (d.fecha !== fecha) return d;
      const cal = calendarioMensualDeFecha(fecha, calendarios);
      if (!diaCalActual || !cal) return d; // ya no hay Calendario para esa fecha — se deja el último estado conocido
      const diseno = disenoDeMes(Number(fecha.slice(0, 4)), Number(fecha.slice(5, 7)), disenos);
      const subtema = diaCalActual.subtemaId ? diseno?.subtemas.find((s) => s.id === diaCalActual.subtemaId) : undefined;
      return {
        ...d,
        temaDia: subtema?.nombre ?? d.temaDia,
        focoDia: subtema?.enfoque ?? d.focoDia,
        origenCalendario: construirOrigenDia(cal, diaCalActual),
      };
    }),
  };
}
