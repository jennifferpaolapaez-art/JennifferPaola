/* ── PRIORIDADES, PLAN INDIVIDUAL ASISTIDO Y CICLO DE VIDA DE METAS (Sesión 6, paso 7 / 6d) ──

   Responde una pregunta: "con todo lo que RAÍZ sabe de este niño, ¿qué convendría trabajar ahora?".
   RAÍZ SUGIERE; la maestra decide. Nada de este módulo crea un Plan Individual, cambia un estado de
   habilidad ni mueve una meta por su cuenta — todo termina en una acción explícita de la maestra.

   ⚠️ TODO LO QUE ES REGLA AQUÍ ES DEMO. Las señales, los umbrales (0–1 / 2 / 3+), las semanas, las
   rutas (`RUTAS_DEMO`) y las metas escritas a mano NO son un criterio pedagógico oficial: son el
   andamio para probar el mecanismo hasta que exista el "Catálogo Pedagógico Oficial RAÍZ" (políticas
   reales por habilidad/progresión) y la IA real. "3 señales" NO significa "necesita Plan Individual"
   ni es un estándar — la maestra NUNCA ve un "nivel 3": solo lenguaje como "va dentro de lo
   esperado", "seguir observando" o "podría beneficiarse de apoyo intencional". Sin diagnóstico:
   nunca se nombra un trastorno, un retraso ni una condición. La IA no inventa prerrequisitos ni
   metas: solo se usan `RUTAS_DEMO` y el campo `prerrequisitos` del catálogo. ──
*/

import {
  FECHA_HOY,
  SKILLS_CATALOG,
  actividadYPlanPorId,
  edadEnMeses,
  evidenciaDeSkill,
  eventosDeSkill,
  leerPlaneaciones,
  metaEstaActiva,
  metasActivasDeNino,
  skillsConMetaTerminada,
  planActivoDeNino,
  type EstadoMetaIndividual,
  type EventoSkill,
  type EvidenciaDeSkill,
  type MetaIndividual,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type PlanIndividual,
  type Skill,
} from './seed-data';

/* ── utilidades de fecha (ISO, sin zona) ── */

function aFecha(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aFecha(hasta).getTime() - aFecha(desde).getTime()) / 86_400_000);
}

export function sumarDias(iso: string, dias: number): string {
  const d = aFecha(iso);
  d.setDate(d.getDate() + dias);
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mes}-${dia}`;
}

const FORMATO_FECHA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });
const FORMATO_MES = new Intl.DateTimeFormat('es', { month: 'short', year: 'numeric' });

export function fechaCorta(iso: string): string {
  return FORMATO_FECHA.format(aFecha(iso));
}

export function mesAnio(iso: string): string {
  return FORMATO_MES.format(aFecha(iso));
}

/** "sep 2026 – dic 2026" o "sep 2026 – actual". */
export function periodoTexto(plan: PlanIndividual): string {
  const inicio = plan.periodo?.inicio ?? plan.fechaCreacion;
  const fin = plan.periodo?.fin;
  return `${mesAnio(inicio)} – ${fin ? mesAnio(fin) : 'actual'}`;
}

/* ── etiquetas de área ── */

const DOMINIO_LABEL: Record<string, string> = {
  motricidad_fina: 'Motricidad fina',
  motricidad_gruesa: 'Motricidad gruesa',
  comunicacion_lenguaje: 'Lenguaje y comunicación',
  socioemocional: 'Desarrollo socioemocional',
  interaccion_social: 'Interacción social',
  autonomia: 'Autonomía',
  pre_math: 'Pre-math',
  pre_literacy: 'Pre-literacy',
  cognicion: 'Cognición',
};

export function areaDeDominio(dominio: string): string {
  return DOMINIO_LABEL[dominio] ?? dominio.replace(/_/g, ' ');
}

/* ── RUTAS DEMO ESCRITAS A MANO (solo tijeras y escribir el nombre — ver aviso de arriba) ──
   Una ruta es una progresión CONTROLADA: raíces relevantes, pasos observables en orden, y lo que la
   maestra puede hacer dentro de su rutina. Cualquier habilidad sin ruta aquí NO recibe raíces
   inventadas ni una propuesta de meta: RAÍZ dice honestamente que aún no hay ruta definida. */

interface PasoRutaDemo {
  id: string;
  /** Palabras (en minúsculas) que, si aparecen en una redacción profesional APROBADA, indican que el
   * niño ya muestra este paso. */
  senales: string[];
  /** Cómo se dice que ya lo hace ("hace cortes consecutivos"). */
  logrado: string;
  /** Cómo se dice qué sigue ("Seguir una línea recta al cortar"). */
  proximo: string;
  /** Meta observable cuando este paso es el siguiente. `{nombre}` se reemplaza por el niño. */
  meta: string;
}

interface RaizRutaDemo {
  /** Skill del catálogo si existe (para leer su estado real); sin id = raíz sin registro en el catálogo. */
  skillId?: string;
  nombre: string;
}

interface RutaDemo {
  skillId: string;
  raices: RaizRutaDemo[];
  pasos: PasoRutaDemo[];
  estrategias: string[];
  oportunidades: string[];
  queObservar: string[];
  semanasRevision: number;
}

export const RUTAS_DEMO: Record<string, RutaDemo> = {
  tijeras: {
    skillId: 'tijeras',
    raices: [
      { skillId: 'pinza', nombre: 'Agarre de pinza (dedos índice y pulgar)' },
      { nombre: 'Fuerza y coordinación de las manos para abrir y cerrar' },
    ],
    pasos: [
      { id: 'abre-cierra', senales: ['abre y cierra', 'abrir y cerrar'], logrado: 'abre y cierra las tijeras', proximo: 'Abrir y cerrar las tijeras con control', meta: '{nombre} abre y cierra las tijeras con control, sin ayuda del adulto.' },
      { id: 'pequenos-recortes', senales: ['pequeños recortes', 'pequeño recorte'], logrado: 'hace pequeños recortes', proximo: 'Hacer pequeños recortes', meta: '{nombre} realiza pequeños recortes con las tijeras de forma independiente.' },
      { id: 'cortes-consecutivos', senales: ['cortes consecutivos'], logrado: 'hace cortes consecutivos', proximo: 'Hacer cortes consecutivos', meta: '{nombre} realiza cortes consecutivos sin ayuda.' },
      { id: 'linea-recta', senales: ['línea recta', 'siguió una línea', 'sigue una línea'], logrado: 'sigue una línea recta al cortar', proximo: 'Seguir una línea recta al cortar', meta: '{nombre} sigue una línea recta con las tijeras con poco o ningún apoyo del adulto.' },
      { id: 'forma-simple', senales: ['contorno', 'forma simple'], logrado: 'corta por el contorno de una forma simple', proximo: 'Cortar por el contorno de una forma simple', meta: '{nombre} corta por el contorno de una forma simple.' },
    ],
    estrategias: [
      'Ofrecer tiras de papel con una línea gruesa marcada para seguir con las tijeras.',
      'Usar tijeras del tamaño de su mano y papel de peso medio; el adulto guía solo si lo pide.',
      'Celebrar el intento y el esfuerzo, no la perfección del corte.',
    ],
    oportunidades: ['Arte y collage con papel', 'Centros de mesa con tiras de papel para cortar', 'Actividad principal cuando incluya recortar'],
    queObservar: [
      'Si sostiene el papel con la mano que no corta.',
      'Si sigue la línea sin ayuda en distintos momentos, no solo en uno.',
      'Cuándo lo intenta por iniciativa propia.',
    ],
    semanasRevision: 6,
  },
  nombre: {
    skillId: 'nombre',
    raices: [
      { skillId: 'reconocimiento-letras', nombre: 'Reconoce las letras de su nombre' },
      { nombre: 'Trazos básicos (líneas y círculos)' },
    ],
    pasos: [
      { id: 'reconoce', senales: ['reconoce su nombre', 'reconoció su nombre'], logrado: 'reconoce su nombre escrito', proximo: 'Reconocer su nombre escrito entre otros', meta: '{nombre} reconoce su nombre escrito entre otros nombres.' },
      { id: 'copia-letras', senales: ['copia', 'copió'], logrado: 'copia algunas letras de su nombre', proximo: 'Copiar las letras de su nombre', meta: '{nombre} copia las letras de su nombre con un modelo a la vista.' },
      { id: 'con-modelo', senales: ['con modelo', 'con un modelo'], logrado: 'escribe su nombre con un modelo a la vista', proximo: 'Escribir su nombre con un modelo a la vista', meta: '{nombre} escribe su nombre completo con un modelo a la vista.' },
      { id: 'sin-modelo', senales: ['sin modelo', 'sin ayuda'], logrado: 'escribe su nombre sin modelo', proximo: 'Escribir su nombre sin modelo', meta: '{nombre} escribe su nombre completo sin modelo.' },
    ],
    estrategias: [
      'Ofrecer su nombre en una tarjeta para copiar o trazar con el dedo antes de escribirlo.',
      'Escribirlo en distintos materiales (arena, pintura, tiza) para que la práctica no sea siempre lápiz.',
      'Reconocer cada letra que logra, no solo el nombre completo.',
    ],
    oportunidades: ['Mesa de Pre-K al llegar (firmar su trabajo)', 'Centros de escritura con materiales sensoriales', 'Rotular sus propias creaciones'],
    queObservar: [
      'Cuáles letras escribe con más seguridad.',
      'Si necesita el modelo a la vista o lo hace de memoria.',
      'Si lo intenta por su cuenta al firmar su trabajo.',
    ],
    semanasRevision: 6,
  },
};

/* ── CONTEXTO DE UNA OBSERVACIÓN ── */

const CONTEXTO_GENERAL = 'Sin actividad asociada';

/** El "contexto" de una observación es el bloque de la actividad donde nació (Circle Time, Centros…).
 * Sin actividad asociada, todas caen en un solo contexto general. */
export function contextoDeObservacion(o: Observacion): string {
  if (!o.actividadId) return CONTEXTO_GENERAL;
  const encontrada = actividadYPlanPorId(o.actividadId);
  return encontrada ? encontrada.actividad.bloque : CONTEXTO_GENERAL;
}

/* ── SEÑALES Y PRIORIDADES ── */

export type NivelPrioridad = 'esperado' | 'seguir_observando' | 'apoyo_intencional';
export type TipoSenal = 'edad' | 'tiempo' | 'contexto' | 'raiz' | 'documentado' | 'evaluacion';

export interface SenalPrioridad {
  tipo: TipoSenal;
  texto: string;
  observacionIds?: string[];
}

export type SituacionRaiz = 'dominada' | 'en_desarrollo' | 'sin_registro';

export interface RaizEvaluada {
  skillId?: string;
  nombre: string;
  situacion: SituacionRaiz;
  relevante: boolean;
  nota: string;
}

/** Foto de lo que RAÍZ sabía cuando la maestra tomó una decisión — sirve para detectar información
 * MATERIALMENTE nueva después (nueva evaluación aprobada, cambio de estado, evidencia nueva). */
export interface HuellaInformacion {
  evaluacionesAprobadas: number;
  estado: string;
  /** observacionId → contexto donde nació (para distinguir evidencia nueva y contextos nuevos). */
  evidencia: Record<string, string>;
}

export interface PrioridadSugerida {
  skillId: string;
  nombreSkill: string;
  dominio: string;
  area: string;
  nivel: NivelPrioridad;
  senales: SenalPrioridad[];
  puntoActual: string;
  proximoPaso: string;
  /** Frases del "¿por qué?" — una por señal, en lenguaje simple. */
  porQue: string[];
  oportunidades: string[];
  observacionIds: string[];
  huella: HuellaInformacion;
  hayRuta: boolean;
  /** Índice del paso de la ruta ya visible en la evidencia (−1 = ninguno) — para la propuesta. */
  pasoActual: number;
}

function totalEvidencia(evidencia: EvidenciaDeSkill[]): string {
  const contextos = new Set(evidencia.map((e) => contextoDeObservacion(e.observacion)));
  return `${evidencia.length} ${evidencia.length === 1 ? 'observación aprobada' : 'observaciones aprobadas'} en ${contextos.size} ${contextos.size === 1 ? 'contexto' : 'contextos'}`;
}

function pasoActualEnRuta(ruta: RutaDemo | undefined, evidencia: EvidenciaDeSkill[]): number {
  if (!ruta) return -1;
  const textos = evidencia.map((e) => (e.observacion.redaccionProfesional ?? '').toLowerCase());
  let mejor = -1;
  ruta.pasos.forEach((paso, i) => {
    if (textos.some((t) => paso.senales.some((s) => t.includes(s)))) mejor = Math.max(mejor, i);
  });
  return mejor;
}

/** Evalúa las raíces de una habilidad: relevantes SOLO cuando hay evidencia de que siguen en
 * desarrollo — el primer prerrequisito no dominado NO se vuelve meta automáticamente. */
export function evaluarRaices(nino: Nino, skillId: string): RaizEvaluada[] {
  const ruta = RUTAS_DEMO[skillId];
  const catalogo = SKILLS_CATALOG.find((c) => c.id === skillId);
  const fuente: RaizRutaDemo[] = ruta
    ? ruta.raices
    : (catalogo?.prerrequisitos ?? []).map((id) => ({ skillId: id, nombre: SKILLS_CATALOG.find((c) => c.id === id)?.nombre ?? id }));
  return fuente.map((r): RaizEvaluada => {
    const skill = r.skillId ? nino.skills.find((s) => s.id === r.skillId) : undefined;
    if (!skill || skill.estadoDesarrollo === 'desconocido' || skill.estadoEvidencia === 'no_observado') {
      return { skillId: r.skillId, nombre: r.nombre, situacion: 'sin_registro', relevante: false, nota: 'Sin registro en su perfil — conviene observarla antes de decidir algo sobre ella.' };
    }
    if (skill.estadoDesarrollo === 'dominado') {
      return { skillId: r.skillId, nombre: r.nombre, situacion: 'dominada', relevante: false, nota: 'Ya la tiene consolidada — es una base con la que cuenta.' };
    }
    return { skillId: r.skillId, nombre: r.nombre, situacion: 'en_desarrollo', relevante: true, nota: 'Sigue en desarrollo — puede convenir fortalecerla a la par.' };
  });
}

function huellaActual(nino: Nino, skill: Skill, evidencia: EvidenciaDeSkill[]): HuellaInformacion {
  return {
    evaluacionesAprobadas: nino.evaluaciones.filter((e) => e.estado === 'aprobada').length,
    estado: `${skill.estadoDesarrollo}|${skill.estadoEvidencia}`,
    evidencia: Object.fromEntries(evidencia.map((e) => [e.observacion.id, contextoDeObservacion(e.observacion)])),
  };
}

export interface ContextoDatos {
  observaciones: Observacion[];
  relaciones: ObservacionSkill[];
  eventos: EventoSkill[];
}

// DEMO — umbrales de las señales. No son criterio pedagógico oficial.
const SEMANAS_SIN_CAMBIO_DEMO = 6;
const DIAS_EVALUACION_RECIENTE_DEMO = 90;

function actividadesDeLaSemana(skillId: string): string[] {
  const resultado: string[] = [];
  for (const plan of leerPlaneaciones()) {
    for (const dia of plan.dias) {
      for (const a of dia.actividades) {
        if (a.skillsRelacionados?.includes(skillId)) resultado.push(`${dia.dia} — ${a.titulo}`);
      }
    }
  }
  return resultado.slice(0, 2);
}

/** Calcula las señales de UNA habilidad en desarrollo. Todas usan solo información válida:
 * edad, estado actual, evidencia PROFESIONAL aprobada, tiempo, contextos, raíces, evaluaciones y lo
 * ya documentado en el perfil. */
export function calcularPrioridadDeSkill(nino: Nino, skill: Skill, datos: ContextoDatos): PrioridadSugerida {
  const catalogo = SKILLS_CATALOG.find((c) => c.id === skill.id);
  const ruta = RUTAS_DEMO[skill.id];
  const evidencia = evidenciaDeSkill(nino.id, skill.id, datos.observaciones, datos.relaciones);
  const senales: SenalPrioridad[] = [];

  // 1. Edad — solo si ya pasó la mitad de la banda en que suele desarrollarse. Sola NUNCA sube el nivel.
  if (catalogo) {
    const meses = edadEnMeses(nino.fechaNacimiento);
    const mitad = catalogo.rangoEdadMesesMin + (catalogo.rangoEdadMesesMax - catalogo.rangoEdadMesesMin) / 2;
    if (meses >= mitad) senales.push({ tipo: 'edad', texto: 'Ya está en la segunda mitad de la edad en la que suele desarrollarse esta habilidad.' });
  }

  // 2. Tiempo — desde cuándo está "en desarrollo" sin cambiar de estado.
  const eventos = eventosDeSkill(nino.id, skill.id, datos.eventos);
  const entrada = [...eventos].reverse().find((e) => e.nuevo.estadoDesarrollo === 'en_desarrollo' && e.anterior?.estadoDesarrollo !== 'en_desarrollo');
  const desde = entrada?.fecha ?? skill.actualizado;
  const semanas = Math.floor(diasEntre(desde, FECHA_HOY) / 7);
  if (semanas >= SEMANAS_SIN_CAMBIO_DEMO) {
    senales.push({ tipo: 'tiempo', texto: `Lleva ${semanas} semanas en desarrollo sin cambiar de estado.` });
  }

  // 3. Contextos — la evidencia aprobada existe pero viene de un solo lugar/momento.
  if (evidencia.length > 0 && catalogo && catalogo.evidenciaRequerida !== 'una_demostracion_clara') {
    const contextos = Array.from(new Set(evidencia.map((e) => contextoDeObservacion(e.observacion))));
    if (contextos.length < 2) {
      senales.push({
        tipo: 'contexto',
        texto: 'La evidencia aprobada viene de un solo momento; esta habilidad se confirma viéndola en más de un contexto.',
        observacionIds: evidencia.map((e) => e.observacion.id),
      });
    }
  }

  // 4. Raíz relevante rezagada (con evidencia de que sigue en desarrollo).
  const raices = evaluarRaices(nino, skill.id);
  const rezagada = raices.find((r) => r.relevante);
  if (rezagada) senales.push({ tipo: 'raiz', texto: `Una habilidad que la sostiene (${rezagada.nombre.toLowerCase()}) sigue en desarrollo.` });

  // 5. Ya documentado en su perfil — meta de foco, evaluación externa, necesidad o apoyo relacionado.
  const documentado: string[] = [];
  const externa = nino.evaluacionesExternas.find((e) => e.permisoUsoPedagogico && e.hallazgos.some((h) => h.skillId === skill.id));
  if (externa) documentado.push(`aparece en una evaluación externa (${externa.nombreInstrumento})`);
  const area = catalogo ? areaDeDominio(catalogo.dominio).toLowerCase() : '';
  const necesidad = area ? nino.necesidades.find((n) => n.estado === 'activa' && (area.includes(n.categoria.toLowerCase()) || n.categoria.toLowerCase().includes(area))) : undefined;
  if (necesidad) documentado.push(`hay una necesidad registrada de ${necesidad.categoria.toLowerCase()}`);
  if (documentado.length > 0) senales.push({ tipo: 'documentado', texto: `Ya está documentado: ${documentado.join(' y ')}.` });

  // 6. Evaluación reciente — UNA señal más, nunca suficiente por sí sola (regla del usuario).
  const ultimaEval = nino.evaluaciones
    .filter((e) => e.estado === 'aprobada')
    .sort((a, b) => b.fecha.localeCompare(a.fecha))[0];
  const resultadoEval = ultimaEval?.resultados.find((r) => r.skillId === skill.id);
  if (ultimaEval && resultadoEval?.estadoDesarrollo === 'en_desarrollo' && diasEntre(ultimaEval.fecha, FECHA_HOY) <= DIAS_EVALUACION_RECIENTE_DEMO) {
    senales.push({ tipo: 'evaluacion', texto: 'En su última evaluación aprobada esta habilidad quedó en desarrollo.' });
  }

  // DEMO: 0–1 señales = va dentro de lo esperado; 2 = seguir observando; 3+ (con al menos una de
  // tiempo o contexto) = podría beneficiarse de apoyo intencional. NO es criterio pedagógico oficial.
  const distintas = new Set(senales.map((s) => s.tipo)).size;
  const conTiempoOContexto = senales.some((s) => s.tipo === 'tiempo' || s.tipo === 'contexto');
  const nivel: NivelPrioridad = distintas >= 3 && conTiempoOContexto ? 'apoyo_intencional' : distintas >= 2 ? 'seguir_observando' : 'esperado';

  // Punto actual y próximo paso — de la ruta demo si existe, si no de la evidencia y el catálogo.
  const pasoActual = pasoActualEnRuta(ruta, evidencia);
  let puntoActual: string;
  let proximoPaso: string;
  if (ruta && pasoActual >= 0) {
    puntoActual = `Según la evidencia aprobada, ${nino.nombre} ${ruta.pasos[pasoActual].logrado} (${totalEvidencia(evidencia)}).`;
    proximoPaso = ruta.pasos[pasoActual + 1]?.proximo ?? 'Consolidar lo que ya hace en distintos momentos.';
  } else if (evidencia.length > 0) {
    const ultima = evidencia[0].observacion;
    puntoActual = `Última observación aprobada (${fechaCorta(ultima.fecha)}): ${ultima.redaccionProfesional}`;
    proximoPaso = `Seguir observándola en ${(catalogo?.contextosRecomendados ?? ['distintos momentos']).join(' o ').toLowerCase()}.`;
  } else {
    puntoActual = 'Todavía no hay observaciones aprobadas de esta habilidad.';
    proximoPaso = `Observarla en ${(catalogo?.contextosRecomendados ?? ['distintos momentos']).join(' o ').toLowerCase()} para saber en qué punto está.`;
  }

  const oportunidades = ruta
    ? ruta.oportunidades
    : (catalogo?.contextosRecomendados ?? []).map((c) => `En ${c}`);
  const enSemana = actividadesDeLaSemana(skill.id);

  return {
    skillId: skill.id,
    nombreSkill: skill.nombre,
    dominio: catalogo?.dominio ?? '',
    area: catalogo ? areaDeDominio(catalogo.dominio) : skill.nombre,
    nivel,
    senales,
    puntoActual,
    proximoPaso,
    porQue: senales.map((s) => s.texto),
    oportunidades: [...oportunidades, ...enSemana.map((a) => `En tu planeación de esta semana: ${a}`)],
    observacionIds: evidencia.map((e) => e.observacion.id),
    huella: huellaActual(nino, skill, evidencia),
    hayRuta: !!ruta,
    pasoActual,
  };
}

/** Habilidades candidatas: solo las que están "en desarrollo" y no tienen ya una meta activa ni una
 * meta Cumplida/Cerrada (esas ya tienen su propio camino). "En desarrollo" por sí solo NO es una
 * necesidad — pasa por las señales de arriba. */
function skillsCandidatas(nino: Nino): Skill[] {
  const conMeta = new Set(metasActivasDeNino(nino).map((m) => m.skillId).filter((s): s is string => !!s));
  const terminadas = skillsConMetaTerminada(nino);
  return nino.skills.filter((s) => s.estadoDesarrollo === 'en_desarrollo' && !conMeta.has(s.id) && !terminadas.has(s.id));
}

/* ── DECISIONES DE LA MAESTRA ── */

export type TipoDecisionPrioridad = 'aceptada' | 'seguir_observando' | 'no_priorizar' | 'cambiada' | 'retirada';

export interface DecisionPrioridad {
  id: string;
  ninoId: string;
  skillId: string;
  decision: TipoDecisionPrioridad;
  fecha: string;
  /** Solo `seguir_observando`/`cambiada`: hasta cuándo RAÍZ no vuelve a insistir por fecha. */
  revisarDespues?: string;
  huella: HuellaInformacion;
  nota?: string;
  /** Si la maestra cambió la prioridad por otra habilidad. */
  reemplazadaPorSkillId?: string;
}

const DECISIONES_STORAGE_KEY = 'raiz_prioridades_decisiones';
// DEMO — cuánto callar tras "seguir observando".
const SEMANAS_CALLAR_SEGUIR_OBSERVANDO_DEMO = 4;

export function leerDecisionesPrioridad(): DecisionPrioridad[] {
  if (typeof window === 'undefined') return [];
  try {
    const guardado = window.localStorage.getItem(DECISIONES_STORAGE_KEY);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado) as DecisionPrioridad[];
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

export function guardarDecisionesPrioridad(decisiones: DecisionPrioridad[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DECISIONES_STORAGE_KEY, JSON.stringify(decisiones));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

/** Agrega una decisión al final (nunca sobrescribe el historial) y devuelve todas. */
export function registrarDecisionPrioridad(
  prioridad: PrioridadSugerida,
  ninoId: string,
  decision: TipoDecisionPrioridad,
  opciones: { nota?: string; reemplazadaPorSkillId?: string } = {}
): DecisionPrioridad[] {
  const nueva: DecisionPrioridad = {
    id: `dec-${Date.now()}-${prioridad.skillId}`,
    ninoId,
    skillId: prioridad.skillId,
    decision,
    fecha: FECHA_HOY,
    revisarDespues: decision === 'seguir_observando' || decision === 'cambiada' ? sumarDias(FECHA_HOY, SEMANAS_CALLAR_SEGUIR_OBSERVANDO_DEMO * 7) : undefined,
    huella: prioridad.huella,
    nota: opciones.nota,
    reemplazadaPorSkillId: opciones.reemplazadaPorSkillId,
  };
  const todas = [...leerDecisionesPrioridad(), nueva];
  guardarDecisionesPrioridad(todas);
  return todas;
}

export function ultimaDecision(decisiones: DecisionPrioridad[], ninoId: string, skillId: string): DecisionPrioridad | undefined {
  return decisiones.filter((d) => d.ninoId === ninoId && d.skillId === skillId).slice(-1)[0];
}

/** ¿Apareció información MATERIALMENTE nueva desde una decisión? DEMO:
 * · siempre: una evaluación aprobada nueva, o un cambio de estado de la habilidad;
 * · `estricto` (no priorizar): además, al menos 2 observaciones aprobadas nuevas en 2+ contextos distintos;
 * · normal (seguir observando): además, 1 observación nueva en un contexto que antes no había, o 2+ nuevas. */
export function hayInformacionNueva(guardada: HuellaInformacion, actual: HuellaInformacion, estricto: boolean): boolean {
  if (actual.evaluacionesAprobadas > guardada.evaluacionesAprobadas) return true;
  if (actual.estado !== guardada.estado) return true;
  const nuevas = Object.keys(actual.evidencia).filter((id) => !(id in guardada.evidencia));
  if (nuevas.length === 0) return false;
  const contextosDeNuevas = new Set(nuevas.map((id) => actual.evidencia[id]));
  const contextosAntes = new Set(Object.values(guardada.evidencia));
  if (estricto) return nuevas.length >= 2 && contextosDeNuevas.size >= 2;
  return nuevas.length >= 2 || Array.from(contextosDeNuevas).some((c) => !contextosAntes.has(c));
}

export type MotivoReabrir = 'informacion_nueva' | 'paso_el_tiempo';

export interface PrioridadReabrir extends PrioridadSugerida {
  motivoReabrir: MotivoReabrir;
}

export interface PrioridadAceptada extends PrioridadSugerida {
  decision: DecisionPrioridad;
}

export interface PrioridadesDelNino {
  /** Máximo 2: la primera es la PRINCIPAL; la segunda, "también conviene observar". */
  sugeridas: PrioridadSugerida[];
  /** Ya decididas antes pero con información nueva (o tiempo cumplido): se muestran discretas. */
  reabrir: PrioridadReabrir[];
  aceptadas: PrioridadAceptada[];
  /** Habilidades en desarrollo que la maestra puede elegir manualmente con "Cambiar prioridad". */
  alternativas: PrioridadSugerida[];
  /** Cuántas prioridades están calladas por una decisión previa (para el enlace "decisiones anteriores"). */
  silenciadas: PrioridadSugerida[];
}

const RANGO_NIVEL: Record<NivelPrioridad, number> = { apoyo_intencional: 2, seguir_observando: 1, esperado: 0 };

export const MAX_PRIORIDADES_SUGERIDAS = 2;

/** "¿Qué convendría trabajar ahora?" — se CALCULA al abrir Progreso (nunca se guarda); solo las
 * decisiones de la maestra se persisten. */
export function calcularPrioridadesDelNino(nino: Nino, datos: ContextoDatos, decisiones: DecisionPrioridad[]): PrioridadesDelNino {
  const todas = skillsCandidatas(nino).map((s) => calcularPrioridadDeSkill(nino, s, datos));
  const sugeribles: PrioridadSugerida[] = [];
  const reabrir: PrioridadReabrir[] = [];
  const aceptadas: PrioridadAceptada[] = [];
  const silenciadas: PrioridadSugerida[] = [];

  for (const p of todas) {
    const d = ultimaDecision(decisiones, nino.id, p.skillId);
    if (d?.decision === 'aceptada') {
      aceptadas.push({ ...p, decision: d });
      continue;
    }
    if (p.nivel === 'esperado') continue; // desarrollo esperado: sin tarjeta, sin insistir.
    if (!d) {
      sugeribles.push(p);
      continue;
    }
    const estricto = d.decision === 'no_priorizar' || d.decision === 'retirada';
    if (hayInformacionNueva(d.huella, p.huella, estricto)) {
      reabrir.push({ ...p, motivoReabrir: 'informacion_nueva' });
    } else if (!estricto && d.revisarDespues && FECHA_HOY >= d.revisarDespues) {
      reabrir.push({ ...p, motivoReabrir: 'paso_el_tiempo' });
    } else {
      silenciadas.push(p);
    }
  }

  sugeribles.sort((a, b) => RANGO_NIVEL[b.nivel] - RANGO_NIVEL[a.nivel] || b.senales.length - a.senales.length);
  const alternativas = todas.filter((p) => ultimaDecision(decisiones, nino.id, p.skillId)?.decision !== 'aceptada');
  return {
    sugeridas: sugeribles.slice(0, MAX_PRIORIDADES_SUGERIDAS),
    reabrir: reabrir.slice(0, MAX_PRIORIDADES_SUGERIDAS),
    aceptadas,
    alternativas,
    silenciadas,
  };
}

/* ── PROPUESTA DE PLAN INDIVIDUAL ── */

export interface BorradorPlan {
  skillId: string;
  area: string;
  puntoActual: string;
  metaSugerida: string;
  criterioDeLogro: string;
  porQueEstaMeta: string;
  raices: RaizEvaluada[];
  estrategias: string[];
  oportunidades: string[];
  queObservar: string[];
  evidencia: { observacionId: string; fecha: string; texto: string }[];
  fechaRevision: string;
}

/** ¿Hay información suficiente para JUSTIFICAR una propuesta? Debe existir: un área prioritaria,
 * un punto actual determinable en una ruta definida, una meta observable, un porqué y evidencia
 * aprobada. Una evaluación por sí sola no alcanza — el resultado de una evaluación NUNCA es un
 * Plan Individual automático (regla del usuario). Y nunca se crea nada solo. */
export function puedeSugerirPlan(prioridad: PrioridadSugerida, nino: Nino): { ok: boolean; motivo?: string } {
  if (metasActivasDeNino(nino).some((m) => m.skillId === prioridad.skillId)) return { ok: false, motivo: 'Ya tiene una meta activa en esta área.' };
  if (!prioridad.hayRuta) return { ok: false, motivo: 'Todavía no hay una ruta definida para esta habilidad, así que RAÍZ no propone una meta. Puedes crear tu propia meta.' };
  if (prioridad.pasoActual < 0 || prioridad.observacionIds.length === 0) return { ok: false, motivo: 'Todavía falta evidencia aprobada para saber en qué punto está.' };
  if (prioridad.nivel !== 'apoyo_intencional') return { ok: false, motivo: 'Por ahora conviene seguir observando antes de proponer un plan.' };
  return { ok: true };
}

export function construirBorradorPlan(nino: Nino, prioridad: PrioridadSugerida, datos: ContextoDatos): BorradorPlan | null {
  if (!puedeSugerirPlan(prioridad, nino).ok) return null;
  const ruta = RUTAS_DEMO[prioridad.skillId];
  const catalogo = SKILLS_CATALOG.find((c) => c.id === prioridad.skillId);
  const siguiente = ruta.pasos[prioridad.pasoActual + 1] ?? ruta.pasos[prioridad.pasoActual];
  const raices = evaluarRaices(nino, prioridad.skillId);
  const evidencia = evidenciaDeSkill(nino.id, prioridad.skillId, datos.observaciones, datos.relaciones);
  const rezagadas = raices.filter((r) => r.relevante);

  let criterio = 'Observado en distintos momentos, no solo en uno.';
  if (catalogo?.evidenciaRequerida === 'consistencia_repetida') criterio = `Observado al menos ${catalogo.vecesMinimas ?? 3} veces en momentos distintos.`;
  else if (catalogo?.evidenciaRequerida === 'una_demostracion_clara') criterio = 'Una demostración clara es suficiente.';

  const porQue = [
    `Ya ${ruta.pasos[prioridad.pasoActual].logrado}, y el siguiente paso natural es "${siguiente.proximo.toLowerCase()}".`,
    ...prioridad.porQue,
    rezagadas.length > 0 ? `Antes de insistir, conviene tener presente su raíz: ${rezagadas.map((r) => r.nombre.toLowerCase()).join(' y ')}.` : null,
  ].filter((x): x is string => !!x);

  return {
    skillId: prioridad.skillId,
    area: prioridad.area,
    puntoActual: prioridad.puntoActual,
    metaSugerida: siguiente.meta.replace('{nombre}', nino.nombre),
    criterioDeLogro: criterio,
    porQueEstaMeta: porQue.join(' '),
    raices,
    estrategias: ruta.estrategias,
    oportunidades: prioridad.oportunidades,
    queObservar: ruta.queObservar,
    evidencia: evidencia.map((e) => ({ observacionId: e.observacion.id, fecha: e.observacion.fecha, texto: e.observacion.redaccionProfesional ?? '' })),
    fechaRevision: sumarDias(FECHA_HOY, ruta.semanasRevision * 7),
  };
}

export interface EdicionesBorrador {
  meta: string;
  estrategias: string;
  siguientePaso: string;
  fechaRevision: string;
}

/** Aprobación explícita de la maestra: crea la meta (y el plan si no hay uno activo). Devuelve el
 * niño actualizado; quien llama lo persiste. Nunca se llama solo. */
export function crearPlanDesdeBorrador(nino: Nino, borrador: BorradorPlan, ediciones: EdicionesBorrador): Nino {
  const meta: MetaIndividual = {
    id: `meta-${Date.now()}`,
    skillId: borrador.skillId,
    descripcion: ediciones.meta.trim() || borrador.metaSugerida,
    estado: 'por_trabajar',
    estrategias: ediciones.estrategias.trim() || undefined,
    siguientePaso: ediciones.siguientePaso.trim() || undefined,
    fechaActualizacion: FECHA_HOY,
    fechaCreacion: FECHA_HOY,
    fechaRevision: ediciones.fechaRevision || borrador.fechaRevision,
    origen: 'raiz_sugerido_aprobado',
    compartibleConFamilia: false,
    evidenciaVistaIds: borrador.evidencia.map((e) => e.observacionId),
    historial: [{ fecha: FECHA_HOY, a: 'por_trabajar', nota: 'Meta creada a partir de una propuesta de RAÍZ que la maestra aprobó.', observacionIds: borrador.evidencia.map((e) => e.observacionId) }],
  };
  return agregarMetaAlPlanActivo(nino, meta, `Prioridad: ${borrador.area.toLowerCase()}`);
}

/** Agrega una meta al plan activo; si no hay uno, crea un plan nuevo (con periodo que empieza hoy). */
export function agregarMetaAlPlanActivo(nino: Nino, meta: MetaIndividual, motivoPlanNuevo?: string): Nino {
  const activo = planActivoDeNino(nino);
  if (activo) {
    return { ...nino, planesIndividuales: (nino.planesIndividuales ?? []).map((p) => (p.id === activo.id ? { ...p, metas: [...p.metas, meta] } : p)) };
  }
  const plan: PlanIndividual = {
    id: `plan-${Date.now()}`,
    fechaCreacion: FECHA_HOY,
    estado: 'activo',
    motivo: motivoPlanNuevo,
    periodo: { inicio: FECHA_HOY },
    metas: [meta],
  };
  return { ...nino, planesIndividuales: [...(nino.planesIndividuales ?? []), plan] };
}

export function crearPlanVacio(nino: Nino, motivo?: string): Nino {
  const plan: PlanIndividual = { id: `plan-${Date.now()}`, fechaCreacion: FECHA_HOY, estado: 'activo', motivo: motivo?.trim() || undefined, periodo: { inicio: FECHA_HOY }, metas: [] };
  return { ...nino, planesIndividuales: [...(nino.planesIndividuales ?? []), plan] };
}

export function crearMetaManual(descripcion: string, skillId?: string): MetaIndividual {
  return {
    id: `meta-${Date.now()}`,
    skillId,
    descripcion: descripcion.trim(),
    estado: 'por_trabajar',
    fechaActualizacion: FECHA_HOY,
    fechaCreacion: FECHA_HOY,
    origen: 'maestra',
    compartibleConFamilia: false,
    historial: [{ fecha: FECHA_HOY, a: 'por_trabajar', nota: 'Meta creada por la maestra.' }],
  };
}

/** Archiva el plan activo (NUNCA lo sobrescribe ni lo borra) y empieza uno nuevo. Las metas
 * elegidas para continuar se copian al plan nuevo con un enlace al original; el resto queda solo
 * en el plan archivado, tal como estaba. */
export function archivarPlanYEmpezarNuevo(nino: Nino, opciones: { motivo?: string; continuarMetaIds: string[] }): Nino {
  const activo = planActivoDeNino(nino);
  if (!activo) return nino;
  const ahora = Date.now();
  const continuadas: MetaIndividual[] = activo.metas
    .filter((m) => opciones.continuarMetaIds.includes(m.id) && metaEstaActiva(m))
    .map((m, i) => ({
      ...m,
      id: `meta-${ahora}-${i}`,
      continuaDeMetaId: m.id,
      fechaCreacion: FECHA_HOY,
      fechaActualizacion: FECHA_HOY,
      historial: [{ fecha: FECHA_HOY, a: m.estado, nota: `Continúa del plan anterior (${periodoTexto(activo)}).` }],
    }));
  const planes = (nino.planesIndividuales ?? []).map((p): PlanIndividual =>
    p.id === activo.id ? { ...p, estado: 'archivado', archivadoEn: FECHA_HOY, periodo: { inicio: p.periodo?.inicio ?? p.fechaCreacion, fin: FECHA_HOY } } : p
  );
  const nuevo: PlanIndividual = {
    id: `plan-${ahora}`,
    fechaCreacion: FECHA_HOY,
    estado: 'activo',
    motivo: opciones.motivo?.trim() || undefined,
    periodo: { inicio: FECHA_HOY },
    metas: continuadas,
  };
  return { ...nino, planesIndividuales: [...planes, nuevo] };
}

/* ── CICLO DE VIDA DE UNA META ── */

/** Evidencia profesional aprobada de la habilidad de la meta que la maestra todavía no ha visto
 * (ni al crear la meta ni en una revisión). Solo AVISA: nunca cambia el estado. Para metas
 * anteriores a 6d (sin ids vistos) se usa la fecha de la última actualización. */
export function evidenciaNuevaParaMeta(nino: Nino, meta: MetaIndividual, observaciones: Observacion[], relaciones: ObservacionSkill[]): EvidenciaDeSkill[] {
  if (!meta.skillId || !metaEstaActiva(meta)) return [];
  const evidencia = evidenciaDeSkill(nino.id, meta.skillId, observaciones, relaciones);
  if (meta.evidenciaVistaIds) return evidencia.filter((e) => !meta.evidenciaVistaIds!.includes(e.observacion.id));
  return evidencia.filter((e) => e.observacion.fecha > meta.fechaActualizacion);
}

function actualizarMeta(nino: Nino, planId: string, metaId: string, cambio: (m: MetaIndividual) => MetaIndividual): Nino {
  return {
    ...nino,
    planesIndividuales: (nino.planesIndividuales ?? []).map((p) => (p.id === planId ? { ...p, metas: p.metas.map((m) => (m.id === metaId ? cambio(m) : m)) } : p)),
  };
}

/** Cambio de estado CONFIRMADO por la maestra. Registra el cambio en el historial de la meta y
 * marca como "vista" la evidencia que tenía delante. Cumplida guarda fecha y evidencia; Cerrada
 * guarda motivo y fecha; ambas dejan de alimentar Planeación (ver `metaEstaActiva`) y, si el niño
 * tenía ese foco en su perfil, se lo quitan. Nada se borra. */
export function cambiarEstadoMeta(
  nino: Nino,
  planId: string,
  metaId: string,
  nuevo: EstadoMetaIndividual,
  opciones: { nota?: string; observacionIds?: string[]; motivoCierre?: string } = {}
): Nino {
  const observacionIds = opciones.observacionIds ?? [];
  return actualizarMeta(nino, planId, metaId, (m) => {
    const base: MetaIndividual = {
      ...m,
      estado: nuevo,
      fechaActualizacion: FECHA_HOY,
      historial: [...(m.historial ?? []), { fecha: FECHA_HOY, de: m.estado, a: nuevo, nota: opciones.nota?.trim() || undefined, observacionIds: observacionIds.length ? observacionIds : undefined }],
      evidenciaVistaIds: Array.from(new Set([...(m.evidenciaVistaIds ?? []), ...observacionIds])),
    };
    if (nuevo === 'alcanzado') return { ...base, fechaCumplimiento: FECHA_HOY, evidenciaCumplimientoIds: observacionIds, motivoCierre: undefined, fechaCierre: undefined };
    if (nuevo === 'cerrada') return { ...base, fechaCierre: FECHA_HOY, motivoCierre: opciones.motivoCierre?.trim() || undefined, fechaCumplimiento: undefined, evidenciaCumplimientoIds: undefined };
    return { ...base, fechaCumplimiento: undefined, evidenciaCumplimientoIds: undefined, fechaCierre: undefined, motivoCierre: undefined };
  });
}

/** "La revisé y la dejo como está": queda en el historial (de === a) y la evidencia vista deja de avisar. */
export function mantenerMetaComoEsta(nino: Nino, planId: string, metaId: string, observacionIds: string[], nota?: string): Nino {
  return actualizarMeta(nino, planId, metaId, (m) => ({
    ...m,
    historial: [...(m.historial ?? []), { fecha: FECHA_HOY, de: m.estado, a: m.estado, nota: nota?.trim() || 'Revisada — se deja como está.', observacionIds: observacionIds.length ? observacionIds : undefined }],
    evidenciaVistaIds: Array.from(new Set([...(m.evidenciaVistaIds ?? []), ...observacionIds])),
  }));
}

/** Todas las metas del niño con su plan (activas, cumplidas, cerradas, de planes archivados) —
 * el historial completo, para "Logros" y para el reporte de resultados de 6f. */
export function metasConPlan(nino: Nino): { plan: PlanIndividual; meta: MetaIndividual }[] {
  const resultado: { plan: PlanIndividual; meta: MetaIndividual }[] = [];
  for (const plan of nino.planesIndividuales ?? []) for (const meta of plan.metas) resultado.push({ plan, meta });
  return resultado;
}
