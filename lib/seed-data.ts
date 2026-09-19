// DATOS SEMILLA — app interna de RAIZ. Nunca se enseña vacía (32-DEL-MVP-AL-PRODUCTO.md):
// nombres reales del mundo del avatar, actividades con contenido real, fechas plausibles.
// Message-match con los mockups ya mostrados en la landing (AppPorDentro): misma actividad
// "Collage del cuerpo", mismos niños foco (Luca/tijeras, Zayne/números).
// Persistencia: ninguna todavía — Supabase se conecta en la fase de servicios externos (51/62).
// Este archivo es la única fuente de verdad mientras tanto.
//
// MODELO PEDAGÓGICO (corregido tras feedback del usuario, Sesión 5): una planeación real de
// Early Childhood Education tiene VARIOS bloques de rutina cada día (no una sola actividad), y
// dentro de cada actividad existen 3 CAPAS distintas que nunca se mezclan:
//   (a) diferenciación por ETAPA (Infant/Toddler/Preschool/Pre-K) — universal, aplica a todo el
//       grupo por nivel de desarrollo.
//   (b) ADAPTACIONES INDIVIDUALES — ajustes que un niño puntual necesita por una condición o
//       preferencia (sensorial, motriz, de lenguaje...). NO implica que tenga un Plan Individual.
//   (c) NIÑOS FOCO — niños cuya meta/skill activa se observa a propósito en esa actividad. Un
//       niño foco puede no necesitar ninguna adaptación, y un niño con adaptación puede no ser
//       foco ese día. Son dos listas independientes, nunca la misma.
// Y 3 niveles de objetivo: el de la SEMANA (grupo), el de la ACTIVIDAD (skill/propósito), y el
// INDIVIDUAL (qué aprovecha cada niño puntual de esa misma experiencia — vive en ninosFoco y en
// adaptacionesIndividuales, no como un campo aparte).
//
// ARQUITECTURA DE DATOS (decidida con el usuario, Sesión 5 ronda 3 — arquitectura oficial de
// RAÍZ, documentada también en ESTADO.md):
//   1. `Actividad` = LA INSTANCIA programada de un día concreto, nunca una biblioteca reutilizable.
//      Una futura `activity_templates`/`activity_library` (NO construida) podría alimentar una
//      instancia; la instancia sigue siendo la fuente de verdad de lo que pasa ese día.
//   2. Contenido flexible (JSONB en el esquema real: guiaCircle/guiaOutdoor/guiaCentros/
//      guiaCierre/preparacion/queHace*) vs. HECHOS RELACIONALES (adaptacionesIndividuales,
//      ninosFoco, asistencia, printables) — el contenido JAMÁS esconde una llave relacional
//      (ninoId, skillId, printableId, observationId...); esas siempre viven en campos/tablas
//      estructurados.
//   3. `AdaptacionIndividual` y `NinoFocoActividad` son entidades relacionales completas (con
//      origen/alcance/referencias y skillId/estado respectivamente), nunca texto libre.
//   4. Asistencia REAL usa un ESTADO (sin_marcar/presente/ausente), nunca un boolean — y
//      "programado" NO es un valor de ese estado: se DERIVA del horario del niño
//      (`Nino.diasAsistencia`) comparado contra el día, nunca se guarda como presencia. En el
//      esquema real, `asistencia_diaria` tiene restricción única (ninoId, fecha).
//   5. El resultado de un niño foco NUNCA se duplica como texto: `NinoFocoActividad` solo guarda
//      un `estadoFoco` (pendiente/observado) y, cuando existe, una referencia `observationId` —
//      el contenido real de la observación vive únicamente en `observations`.
//   6. Los bloques del día se DERIVAN de `RUTINA_PROGRAMA` (la configuración del salón), no se
//      improvisan por día — ver esa sección más abajo.
//   7. `observations` acepta DOS caminos (dirigida/espontánea, ver sección al final del archivo):
//      la maestra puede observar sin saber cómo clasificar lo que vio — RAÍZ sugiere skills
//      DESPUÉS, nunca antes. La relación observación↔skill vive en `ObservacionSkill` (nunca un
//      `skill_id` único en la observación): cada relación tiene su propio `origen`
//      (raiz/maestra/observacion_dirigida) y `estado` (sugerido/aceptado/rechazado) — nunca dos
//      booleanos, para no confundir "no revisado" con "rechazado". `notaOriginal` nunca se
//      sobrescribe; el progreso de un skill (`Nino.skills[].estado`) NUNCA cambia solo por
//      acumular observaciones — sigue siendo una decisión humana explícita.

/** Reconciliado en Sesión 6, paso 3 (Módulo Niños) — antes era un tipo propio de Configuración
 * (`EtapaAtendida`) separado de este, para no romper las 18 actividades demo. Ahora que se
 * dividieron sus bloques de diferenciación en Toddler Jr/Sr, el tipo central ya soporta las 5
 * etapas y `EtapaAtendida` desaparece (Configuración reutiliza este mismo tipo). */
export type Etapa = 'Infant' | 'Toddler Jr' | 'Toddler Sr' | 'Preschool' | 'Pre-K';

/** Sesión 6, paso 4 (Perfil completo del niño) — separa DOS preguntas que antes vivían mezcladas
 * en un solo `EstadoSkill` de 3 valores: ¿QUÉ SABEMOS que el niño puede hacer? (estadoDesarrollo)
 * vs. ¿CUÁNTA EVIDENCIA tenemos para sostenerlo? (estadoEvidencia). Corrección explícita del
 * usuario — evita que RAÍZ confunda "no lo hemos observado" con "está en desarrollo". */
export type EstadoDesarrollo = 'desconocido' | 'en_desarrollo' | 'dominado';
export type EstadoEvidencia = 'no_observado' | 'insuficiente' | 'suficiente' | 'contradictoria';

export interface Skill {
  id: string;
  nombre: string;
  estadoDesarrollo: EstadoDesarrollo;
  estadoEvidencia: EstadoEvidencia;
  actualizado: string; // ISO
}

/** Traduce los dos ejes a UNA etiqueta/tono para mostrar (badges, listas) — nunca se muestran los
 * dos campos crudos por separado en la UI, pero la lógica interna sí los mantiene separados. */
export function etiquetaSkill(estadoDesarrollo: EstadoDesarrollo, estadoEvidencia: EstadoEvidencia): { label: string; tono: 'dominado' | 'en_desarrollo' | 'sin_evidencia' } {
  if (estadoDesarrollo === 'dominado') return { label: 'Dominado', tono: 'dominado' };
  if (estadoDesarrollo === 'en_desarrollo') return { label: 'En desarrollo', tono: 'en_desarrollo' };
  if (estadoEvidencia === 'insuficiente') return { label: 'Necesita más evidencia', tono: 'sin_evidencia' };
  if (estadoEvidencia === 'contradictoria') return { label: 'Evidencia contradictoria', tono: 'sin_evidencia' };
  return { label: 'Aún no observado', tono: 'sin_evidencia' };
}

/** De dónde nace una necesidad o un apoyo del niño — mismos 5 orígenes que ya aprobamos para
 * `AdaptacionIndividual`/`ObservacionSkill` (arquitectura del Perfil del niño v2). Hoy solo se
 * ejercita 'maestra' (la maestra la registra directo en el perfil); los demás quedan reservados
 * para cuando observaciones/evaluaciones/Plan Individual puedan generarlas automáticamente. */
export type OrigenNecesidadApoyo = 'maestra' | 'observacion' | 'evaluacion_raiz' | 'evaluacion_externa' | 'plan_individual';

/** NECESIDAD DEL NIÑO (capa permanente del perfil) — no vive solo como texto libre ni solo
 * dentro de una actividad puntual; `activity_child_adaptations` puede después enlazar aquí en
 * vez de reinventar el texto cada vez (arquitectura aprobada, Sesión 6). Nota sobre integridad
 * referencial: la arquitectura aprobada pide columnas FK excluyentes por tipo de origen — eso se
 * implementa al conectar Supabase (paso 8); mientras tanto, sin base de datos real detrás, un
 * campo `origenReferenciaId?` simple es suficiente y no se sobre-diseña antes de tiempo. */
export interface NecesidadNino {
  id: string;
  categoria: string;
  descripcion: string;
  estado: 'activa' | 'resuelta' | 'por_revisar';
  origen: OrigenNecesidadApoyo;
  origenReferenciaId?: string;
  teacherConfirmed: boolean;
  fechaCreacion: string;
}

/** APOYO/ESTRATEGIA que funciona para una necesidad — capa separada de la necesidad misma
 * (regla del usuario: "necesidad → apoyo → adaptación específica cuando una actividad lo
 * requiere"). */
export interface ApoyoNino {
  id: string;
  necesidadId?: string;
  estrategia: string;
  activa: boolean;
  origen: OrigenNecesidadApoyo;
  teacherConfirmed: boolean;
  /** Sesión 6 paso 5 — en qué CONTEXTOS de actividad este apoyo es relevante (ver
   * `ContextoActividad`). Reemplaza "categoría de necesidad == dominio de actividad" (regla del
   * usuario: esa igualdad es demasiado limitada — una necesidad sensorial puede ser relevante en
   * una actividad de motricidad fina si ambas comparten el contexto real, ej. contacto con pega). */
  contextosRelevantes?: ContextoActividad[];
}

/* ── EVALUACIONES (Sesión 6, paso 4 — Perfil completo del niño) ──
   Catálogo/plantillas de ESTE archivo son DATOS DE EJEMPLO para probar el mecanismo — el usuario
   confirmó explícitamente que el contenido pedagógico oficial (skills definitivos, rangos de
   edad, prerrequisitos, políticas de evidencia, Core Developmental Profile, tracks) se revisa en
   una ronda aparte más adelante. Lo que SÍ es definitivo aquí es la ARQUITECTURA: catálogo fijo y
   versionado + evaluación que se prellena con lo ya sabido + aprobación humana obligatoria. */

export type PoliticaRevision = 'una_vez_dominado' | 'seguimiento_periodico' | 'desarrollo_continuo';
export type EvidenciaRequerida = 'una_demostracion_clara' | 'multiples_contextos' | 'consistencia_repetida';

/** Base pedagógica ESTABLE — la IA nunca decide qué skills corresponden a una edad; siempre lee
 * de aquí. IDs estables entre versiones de plantilla. */
export interface SkillCatalogEntry {
  id: string;
  dominio: string;
  nombre: string;
  rangoEdadMesesMin: number;
  rangoEdadMesesMax: number;
  prerrequisitos: string[];
  politicaRevision: PoliticaRevision;
  evidenciaRequerida: EvidenciaRequerida;
  /** SOLO tiene sentido cuando `evidenciaRequerida === 'consistencia_repetida'` — nunca una regla
   * universal de "N observaciones" (corrección explícita del usuario). */
  vecesMinimas?: number;
  contextosRecomendados: string[];
}

/** Una versión de plantilla = una fila propia e INMUTABLE una vez usada por una evaluación real
 * (regla del usuario). Un cambio futuro crea v1.1/v2.0, nunca edita esta fila. `track: null` =
 * CORE obligatorio para esa banda de edad; con track, es opcional y solo aplica si el programa lo
 * activó en Configuración. */
export interface AssessmentTemplate {
  id: string;
  rangoEdadMesesMin: number;
  rangoEdadMesesMax: number;
  etapa: Etapa;
  track: TrackOpcional | null;
  version: string;
  vigente: boolean;
}

export interface AssessmentTemplateSkill {
  assessmentTemplateId: string;
  skillId: string;
  orden: number;
}

export type TipoEvaluacion = 'ingreso' | 'periodica';
export type EstadoEvaluacion = 'borrador' | 'aprobada';

/** UN resultado = un skill dentro de UNA evaluación — nunca se toca después de aprobada (queda
 * congelado, es historia). */
export interface ResultadoEvaluacion {
  id: string;
  skillId: string;
  assessmentTemplateId: string;
  estadoDesarrollo: EstadoDesarrollo;
  estadoEvidencia: EstadoEvidencia;
  /** RAÍZ lo prellenó a partir del estado ya conocido — no significa que lo inventó. */
  sugeridoPorRaiz: boolean;
  /** La maestra cambió el valor sugerido antes de aprobar. */
  editadoPorMaestra: boolean;
  /** Sesión 6, paso 4 ronda 2 — CAPA DE EXPERIENCIA, no cambia la arquitectura: cuando el skill
   * tiene una `PreguntaObservable` asociada, la maestra responde sobre una conducta concreta
   * (no directamente "Desconocido/En desarrollo/Dominado") y RAÍZ deriva `estadoDesarrollo`/
   * `estadoEvidencia` de esa respuesta. Guardamos QUÉ respondió (para poder mostrarlo de nuevo al
   * reabrir un borrador), no solo el estado derivado. Opcional — un skill sin pregunta observable
   * sigue editándose directo, como antes. */
  respuestaObservableIds?: string[];
}

/** UNA evaluación = snapshot fechado del perfil vivo (responde "cómo se genera una evaluación
 * periódica" de la arquitectura aprobada). Puede quedar en `borrador` indefinidamente — nunca
 * obliga a completarse de una sola vez (regla del usuario, Sesión 6 paso 4). */
export interface EvaluacionNino {
  id: string;
  tipo: TipoEvaluacion;
  fecha: string;
  estado: EstadoEvaluacion;
  aprobadaPor?: string;
  aprobadaEn?: string;
  edadAlMomentoMeses: number;
  etapaAlMomento: Etapa;
  resultados: ResultadoEvaluacion[];
}

export type TipoEvaluacionExterna = 'ASQ-3' | 'IFSP' | 'IEP' | 'speech_language' | 'OT' | 'PT' | 'otro';

/** Hallazgo puntual DENTRO de un documento externo — permite citar una recomendación concreta sin
 * convertir el documento completo en un resultado propio de RAÍZ (regla del usuario). */
export interface HallazgoEvaluacionExterna {
  id: string;
  area: string;
  resumen: string;
  recomendacion?: string;
  skillId?: string;
}

/** Evaluación o documento externo (ASQ-3, IEP, IFSP, speech/OT/PT...) — SEPARADA de las
 * evaluaciones propias de RAÍZ, nunca mezclada. RAÍZ no diagnostica; solo guarda lo
 * pedagógicamente relevante que la maestra decide registrar. Sin almacenamiento real todavía
 * (regla del usuario): no se adjunta el archivo original, solo metadatos + resumen. */
export interface EvaluacionExterna {
  id: string;
  tipo: TipoEvaluacionExterna;
  nombreInstrumento: string;
  fecha: string;
  profesionalOEntidad?: string;
  resumen?: string;
  recomendaciones?: string;
  permisoUsoPedagogico: boolean;
  hallazgos: HallazgoEvaluacionExterna[];
}

export type EstadoPlanIndividual = 'activo' | 'pausado' | 'cerrado' | 'archivado';
/** `alcanzado` se muestra como "Cumplida" (el id se conserva por compatibilidad con datos ya
 * guardados); `cerrada` = "Cerrada / no continuar" (Sesión 6 paso 7 / 6d). */
export type EstadoMetaIndividual = 'por_trabajar' | 'en_progreso' | 'casi' | 'alcanzado' | 'cerrada';

export const ESTADO_META_LABEL: Record<EstadoMetaIndividual, string> = {
  por_trabajar: 'Por trabajar',
  en_progreso: 'En progreso',
  casi: 'Casi lograda',
  alcanzado: 'Cumplida',
  cerrada: 'Cerrada / no continuar',
};

/** Una meta ACTIVA es la única que puede alimentar Planeación, Hoy y "niños foco". Cumplida y
 * Cerrada se conservan como historia pero nunca vuelven a personalizar una planeación. */
export function metaEstaActiva(m: { estado: EstadoMetaIndividual }): boolean {
  return m.estado === 'por_trabajar' || m.estado === 'en_progreso' || m.estado === 'casi';
}

/** Un cambio de estado de una meta — cada uno lo confirma la maestra (RAÍZ nunca mueve el estado
 * sola). `de === a` = "la revisé y la dejo como está" (queda registrado para no volver a avisar). */
export interface CambioEstadoMeta {
  fecha: string;
  de?: EstadoMetaIndividual;
  a: EstadoMetaIndividual;
  nota?: string;
  /** Observaciones aprobadas que la maestra tenía a la vista al decidir (trazabilidad). */
  observacionIds?: string[];
}

export type OrigenMeta = 'maestra' | 'raiz_sugerido_aprobado';

/** UNA meta dentro del Plan Individual — RAÍZ nunca la marca `alcanzado` sola (regla del
 * usuario); solo puede sugerir revisar cuando hay evidencia, la maestra decide. */
export interface MetaIndividual {
  id: string;
  skillId?: string;
  descripcion: string;
  estado: EstadoMetaIndividual;
  estrategias?: string;
  siguientePaso?: string;
  fechaActualizacion: string;
  /** 6d — ciclo de vida e historial. Todos opcionales: una meta guardada antes de 6d sigue leyéndose. */
  fechaCreacion?: string;
  historial?: CambioEstadoMeta[];
  fechaCumplimiento?: string;
  evidenciaCumplimientoIds?: string[];
  motivoCierre?: string;
  fechaCierre?: string;
  origen?: OrigenMeta;
  /** Nada de la meta sale hacia la familia sin que la maestra lo marque (reportes, 6f). */
  compartibleConFamilia?: boolean;
  fechaRevision?: string;
  /** Observaciones aprobadas que la maestra ya vio (al crear la meta o al revisarla) — sirve para
   * avisar SOLO de evidencia realmente nueva. Ausente en metas anteriores: se usa la fecha. */
  evidenciaVistaIds?: string[];
  /** Si continúa una meta de un plan anterior (archivado). */
  continuaDeMetaId?: string;
}

/** Plan Individual — OPCIONAL, vive dentro del perfil del niño. Una necesidad/adaptación o una
 * evaluación NUNCA lo crea automáticamente — la maestra decide. Desde 6d un niño puede tener
 * VARIOS planes (`Nino.planesIndividuales`): uno activo y los anteriores archivados por periodo;
 * empezar uno nuevo nunca sobrescribe el anterior. */
export interface PlanIndividual {
  id: string;
  fechaCreacion: string;
  estado: EstadoPlanIndividual;
  motivo?: string;
  /** Periodo que cubre (ISO). `fin` se completa al archivar (o es la fecha de revisión prevista). */
  periodo?: { inicio: string; fin?: string };
  archivadoEn?: string;
  metas: MetaIndividual[];
}

export interface Nino {
  id: string;
  nombre: string;
  etapa: Etapa;
  /** La edad SIEMPRE se calcula desde aquí (`calcularEdadTexto`) — nunca se guarda fija (regla
   * del usuario, Módulo Niños: "la edad exacta de cada niño siempre se calcula por DOB"). */
  fechaNacimiento: string; // ISO
  fechaIngreso: string; // ISO
  colorTint: 'coral' | 'sage' | 'butter' | 'teal';
  idiomas: string[];
  intereses: string[];
  fortalezas: string[];
  preferencias: string[];
  formasComunicacion?: string;
  /** "Cuéntame sobre este niño" — mismo patrón que `Observacion.notaOriginal`/
   * `redaccionProfesional`: la maestra escribe libre, RAÍZ puede organizar después, el original
   * NUNCA se sobrescribe. */
  notasIngresoOriginal?: string;
  notasIngresoResumen?: string;
  necesidades: NecesidadNino[];
  apoyos: ApoyoNino[];
  skills: Skill[];
  /** Meta activa (si tiene foco hoy) — se muestra en Hoy/Niños foco. */
  metaActiva?: { skillId: string; nota: string };
  /** Asistencia PROGRAMADA (horario configurado) — de aquí se DERIVA si hoy le tocaba venir; la
   * presencia REAL de cada día vive aparte, en ASISTENCIA_HOY (regla del usuario, Sesión 5
   * ronda 3: nunca mezclar planificación con realidad). */
  diasAsistencia: DiaSemana[];
  /** Evaluación de RAÍZ — historial completo, cada una es un snapshot congelado tras aprobar.
   * "Próxima evaluación" se calcula (ver `calcularFechaProximaEvaluacion`), no se guarda fija. */
  fechaUltimaEvaluacionAprobada?: string;
  evaluaciones: EvaluacionNino[];
  evaluacionesExternas: EvaluacionExterna[];
  /** Planes Individuales por periodo (6d). El campo singular `planIndividual` de datos guardados
   * antes de 6d se convierte al leer (`normalizarNino`) — nunca se pierde nada. */
  planesIndividuales?: PlanIndividual[];
}

/** Planes de un niño, del más reciente al más antiguo. */
export function planesDeNino(nino: Nino): PlanIndividual[] {
  return [...(nino.planesIndividuales ?? [])].sort((a, b) => b.fechaCreacion.localeCompare(a.fechaCreacion));
}

export function planActivoDeNino(nino: Nino): PlanIndividual | undefined {
  return planesDeNino(nino).find((p) => p.estado === 'activo');
}

/** Metas que hoy alimentan Planeación/Hoy/niños foco: solo las ACTIVAS del plan ACTIVO. */
export function metasActivasDeNino(nino: Nino): MetaIndividual[] {
  const plan = planActivoDeNino(nino);
  return plan ? plan.metas.filter(metaEstaActiva) : [];
}

/** Skills que YA tuvieron una meta Cumplida o Cerrada (en cualquier plan) y hoy no tienen una meta
 * activa: dejan de sugerirse solos como foco (regla del usuario, 6d — la maestra puede volver a
 * ponerlos a mano). */
export function skillsConMetaTerminada(nino: Nino): Set<string> {
  const activos = new Set(metasActivasDeNino(nino).map((m) => m.skillId).filter((s): s is string => !!s));
  const terminados = new Set<string>();
  for (const plan of nino.planesIndividuales ?? []) {
    for (const m of plan.metas) {
      if (m.skillId && (m.estado === 'alcanzado' || m.estado === 'cerrada') && !activos.has(m.skillId)) terminados.add(m.skillId);
    }
  }
  return terminados;
}

/** Bandas de edad por defecto para sugerir la etapa desde el DOB — punto de partida razonable
 * (0-12m Infant, 12-24m Toddler Jr, 24-36m Toddler Sr, 36-48m Preschool, 48m+ Pre-K), NO una
 * regla clínica cerrada; la maestra siempre puede anular la sugerencia al crear/editar un niño. */
export function edadEnMeses(fechaNacimiento: string, fechaReferencia: string = FECHA_HOY): number {
  const nacimiento = new Date(`${fechaNacimiento}T00:00:00`);
  const referencia = new Date(`${fechaReferencia}T00:00:00`);
  let meses = (referencia.getFullYear() - nacimiento.getFullYear()) * 12 + (referencia.getMonth() - nacimiento.getMonth());
  if (referencia.getDate() < nacimiento.getDate()) meses -= 1;
  return Math.max(0, meses);
}

export function etapaSugeridaPorEdad(meses: number): Etapa {
  if (meses < 12) return 'Infant';
  if (meses < 24) return 'Toddler Jr';
  if (meses < 36) return 'Toddler Sr';
  if (meses < 48) return 'Preschool';
  return 'Pre-K';
}

/** Texto de edad SIEMPRE calculado desde `fechaNacimiento` — nunca un valor guardado que se
 * vuelve obsoleto (regla del usuario). */
export function calcularEdadTexto(fechaNacimiento: string, fechaReferencia: string = FECHA_HOY): string {
  const meses = edadEnMeses(fechaNacimiento, fechaReferencia);
  const anios = Math.floor(meses / 12);
  const mesesRestantes = meses % 12;
  if (anios === 0) return `${meses} ${meses === 1 ? 'mes' : 'meses'}`;
  if (mesesRestantes === 0) return `${anios} ${anios === 1 ? 'año' : 'años'}`;
  return `${anios} ${anios === 1 ? 'año' : 'años'} ${mesesRestantes} ${mesesRestantes === 1 ? 'mes' : 'meses'}`;
}

/** Semilla — nunca se enseña vacía (32). `NINOS` (export activo, más abajo) lee de aquí por
 * defecto y de `localStorage` cuando la maestra ya creó/editó niños reales (Módulo Niños,
 * Sesión 6 paso 3). Fechas de nacimiento elegidas para que `calcularEdadTexto` reproduzca
 * exactamente el `edadTexto` que ya se había mostrado y aprobado en sesiones anteriores. */
const NINOS_SEMILLA: Nino[] = [
  {
    id: 'luca',
    nombre: 'Luca',
    etapa: 'Preschool',
    fechaNacimiento: '2023-01-15', // → "3 años 8 meses" al 2026-09-15
    fechaIngreso: '2025-08-18',
    colorTint: 'coral',
    idiomas: ['Español'],
    intereses: ['Dinosaurios', 'Construir con bloques'],
    fortalezas: ['Vocabulario amplio para su edad'],
    preferencias: ['Prefiere actividades con las manos antes que con lápiz'],
    formasComunicacion: 'Habla con oraciones completas en español.',
    notasIngresoOriginal: 'Luca es muy curioso y le encanta que le expliquen "por qué" de las cosas. Le cuesta un poco esperar su turno en grupo.',
    necesidades: [],
    apoyos: [],
    metaActiva: { skillId: 'tijeras', nota: 'Tijeras' },
    diasAsistencia: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    evaluaciones: [],
    evaluacionesExternas: [],
    skills: [
      { id: 'tijeras', nombre: 'Tijeras', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente', actualizado: '2026-09-08' },
      { id: 'numeros-1-8', nombre: 'Números 1–8', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente', actualizado: '2026-08-20' },
      { id: 'colores', nombre: 'Reconoce colores', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente', actualizado: '2026-08-15' },
      { id: 'nombre', nombre: 'Escritura de nombre', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado', actualizado: '2026-07-01' },
    ],
  },
  {
    id: 'zayne',
    nombre: 'Zayne',
    etapa: 'Pre-K',
    fechaNacimiento: '2022-04-15', // → "4 años 5 meses" al 2026-09-15
    fechaIngreso: '2024-09-02',
    colorTint: 'sage',
    idiomas: ['English', 'Español'],
    intereses: ['Números y patrones', 'Juegos de mesa'],
    fortalezas: ['Memoria para secuencias y rimas'],
    preferencias: ['Prefiere retos con un objetivo claro'],
    formasComunicacion: 'Bilingüe — cambia de idioma según con quién habla.',
    notasIngresoOriginal: 'Zayne pregunta mucho "cuántos faltan" — le gusta contar todo. Se frustra un poco si algo no sale a la primera.',
    necesidades: [],
    apoyos: [],
    metaActiva: { skillId: 'numeros-6-8', nota: 'Números 6–8' },
    diasAsistencia: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    evaluaciones: [],
    evaluacionesExternas: [],
    skills: [
      { id: 'numeros-6-8', nombre: 'Conteo 6–8', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente', actualizado: '2026-09-09' },
      { id: 'rima', nombre: 'Identifica rimas', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente', actualizado: '2026-08-28' },
      { id: 'nombre-propio', nombre: 'Escritura de nombre', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente', actualizado: '2026-08-01' },
      { id: 'tijeras', nombre: 'Tijeras', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente', actualizado: '2026-07-20' },
    ],
  },
  {
    id: 'sofia',
    nombre: 'Sofía',
    etapa: 'Toddler Sr',
    fechaNacimiento: '2024-08-15', // → "2 años 1 mes" al 2026-09-15
    fechaIngreso: '2026-02-10',
    colorTint: 'butter',
    idiomas: ['Español'],
    intereses: ['Bloques apilables', 'Canciones con gestos'],
    fortalezas: ['Persistente — repite una torre varias veces hasta lograrlo'],
    preferencias: ['Prefiere elegir entre 2 opciones en vez de responder abierto'],
    formasComunicacion: 'Lenguaje expresivo limitado — usa gestos y palabras sueltas.',
    notasIngresoOriginal: 'Sofía evita tocar texturas pegajosas (pega, pintura) — se pone tensa y aparta la mano. Prefiere señalar antes que hablar cuando algo es nuevo.',
    necesidades: [
      {
        id: 'need-sofia-sensorial',
        categoria: 'Sensorial',
        descripcion: 'Sensibilidad al contacto con texturas pegajosas (pega, pintura).',
        estado: 'activa',
        origen: 'maestra',
        teacherConfirmed: true,
        fechaCreacion: '2026-02-10',
      },
      {
        id: 'need-sofia-lenguaje',
        categoria: 'Lenguaje',
        descripcion: 'Lenguaje expresivo limitado — todavía no responde con oraciones.',
        estado: 'activa',
        origen: 'maestra',
        teacherConfirmed: true,
        fechaCreacion: '2026-02-10',
      },
    ],
    apoyos: [
      { id: 'apoyo-sofia-aplicador', necesidadId: 'need-sofia-sensorial', estrategia: 'Ofrecer un aplicador o guante en vez de contacto directo con pega/pintura.', activa: true, origen: 'maestra', teacherConfirmed: true, contextosRelevantes: ['contacto_sensorial', 'pega'] },
      { id: 'apoyo-sofia-opciones', necesidadId: 'need-sofia-lenguaje', estrategia: 'Permitir señalar o elegir entre dos imágenes en vez de exigir respuesta verbal.', activa: true, origen: 'maestra', teacherConfirmed: true },
    ],
    diasAsistencia: ['Lun', 'Mar', 'Jue'],
    fechaUltimaEvaluacionAprobada: '2026-02-12',
    evaluaciones: [
      {
        id: 'eval-sofia-ingreso',
        tipo: 'ingreso',
        fecha: '2026-02-10',
        estado: 'aprobada',
        aprobadaPor: 'maestra',
        aprobadaEn: '2026-02-12',
        edadAlMomentoMeses: 17,
        etapaAlMomento: 'Toddler Jr',
        resultados: [
          {
            id: 'res-sofia-ingreso-palabras',
            skillId: 'palabras',
            assessmentTemplateId: 'tpl-toddler-jr-core-v1',
            estadoDesarrollo: 'desconocido',
            estadoEvidencia: 'no_observado',
            sugeridoPorRaiz: false,
            editadoPorMaestra: true,
          },
          {
            id: 'res-sofia-ingreso-apilar',
            skillId: 'apilar',
            assessmentTemplateId: 'tpl-toddler-jr-core-v1',
            estadoDesarrollo: 'en_desarrollo',
            estadoEvidencia: 'suficiente',
            sugeridoPorRaiz: false,
            editadoPorMaestra: true,
          },
        ],
      },
    ],
    evaluacionesExternas: [
      {
        id: 'ext-sofia-speech',
        tipo: 'speech_language',
        nombreInstrumento: 'Evaluación de lenguaje (clínica privada)',
        fecha: '2026-01-15',
        profesionalOEntidad: 'Speech-Language Pathologist',
        resumen: 'Lenguaje expresivo por debajo de lo esperado para la edad; comprensión dentro de rango típico.',
        recomendaciones: 'Fomentar elección con apoyo visual; ampliar vocabulario con repetición en contexto natural.',
        permisoUsoPedagogico: true,
        hallazgos: [
          {
            id: 'hallazgo-sofia-lenguaje',
            area: 'Lenguaje expresivo',
            resumen: 'Usa menos de 10 palabras espontáneas de forma consistente.',
            recomendacion: 'Ofrecer opciones de 2 en vez de preguntas abiertas.',
            skillId: 'palabras',
          },
        ],
      },
    ],
    planesIndividuales: [
      {
        id: 'plan-sofia',
        fechaCreacion: '2026-02-12',
        estado: 'activo',
        motivo: 'Seguimiento de lenguaje expresivo tras evaluación externa.',
        periodo: { inicio: '2026-02-12' },
        metas: [
          {
            id: 'meta-sofia-vocabulario',
            skillId: 'palabras',
            descripcion: 'Ampliar vocabulario expresivo a 20+ palabras espontáneas.',
            estado: 'en_progreso',
            estrategias: 'Ofrecer 2 opciones con apoyo visual; celebrar cualquier intento verbal, no solo la palabra exacta.',
            siguientePaso: 'Observar en Circle Time y Centros durante 2 semanas antes de revisar el estado de la meta.',
            fechaActualizacion: '2026-08-01',
            fechaCreacion: '2026-02-12',
            origen: 'maestra',
            historial: [
              { fecha: '2026-02-12', a: 'por_trabajar', nota: 'Meta creada tras la evaluación de ingreso.' },
              { fecha: '2026-08-01', de: 'por_trabajar', a: 'en_progreso', nota: 'Empezó a decir palabras sueltas con más frecuencia.' },
            ],
          },
        ],
      },
    ],
    skills: [
      { id: 'palabras', nombre: 'Vocabulario de 2 palabras', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente', actualizado: '2026-09-05' },
      { id: 'apilar', nombre: 'Apila 4+ bloques', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente', actualizado: '2026-08-22' },
    ],
  },
  {
    id: 'mateo',
    nombre: 'Mateo',
    etapa: 'Infant',
    fechaNacimiento: '2025-10-15', // → "11 meses" al 2026-09-15
    fechaIngreso: '2026-01-12',
    colorTint: 'teal',
    idiomas: ['Español'],
    intereses: ['Objetos que suenan', 'Gatear detrás de pelotas'],
    fortalezas: ['Explora con las manos con mucha atención'],
    preferencias: ['Se calma mejor en brazos que en el piso cuando está nuevo el entorno'],
    formasComunicacion: 'Pre-verbal — balbuceo y señalar.',
    notasIngresoOriginal: 'Mateo todavía no se sienta con apoyo total ni se sostiene de pie por sí solo. Le gusta que le narren lo que está pasando mientras explora.',
    necesidades: [
      {
        id: 'need-mateo-postural',
        categoria: 'Motricidad gruesa',
        descripcion: 'Aún en desarrollo de sedestación independiente y bipedestación con apoyo.',
        estado: 'activa',
        origen: 'maestra',
        teacherConfirmed: true,
        fechaCreacion: '2026-01-12',
      },
    ],
    apoyos: [
      { id: 'apoyo-mateo-piso', necesidadId: 'need-mateo-postural', estrategia: 'Ofrecer apoyo directo o brazos de la maestra en actividades de piso, sin exigir sedestación sostenida.', activa: true, origen: 'maestra', teacherConfirmed: true, contextosRelevantes: ['movimiento', 'sentarse_quieto'] },
    ],
    diasAsistencia: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    evaluaciones: [],
    evaluacionesExternas: [],
    skills: [
      { id: 'gateo', nombre: 'Gateo cruzado', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente', actualizado: '2026-08-30' },
      { id: 'pinza', nombre: 'Agarre de pinza', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente', actualizado: '2026-09-10' },
    ],
  },
];

const NINOS_STORAGE_KEY = 'raiz_ninos';

/** Lee el roster real desde este dispositivo — localStorage mientras no exista Supabase (paso 8
 * del orden acordado), mismo patrón que `leerProgramaConfig`. Nunca lanza si el storage no está
 * disponible (SSR/modo privado). */
/** Datos guardados antes de 6d tenían `planIndividual` (un solo plan) — se convierte al leer a
 * `planesIndividuales[]` para no perder nada ni pedir borrar el almacenamiento (misma técnica que
 * la mini-migración de `evidencias[]`). */
type NinoLegado = Nino & { planIndividual?: PlanIndividual };
function normalizarNino(n: NinoLegado): Nino {
  const { planIndividual, ...resto } = n;
  if (planIndividual && !resto.planesIndividuales) {
    return { ...resto, planesIndividuales: [{ ...planIndividual, periodo: planIndividual.periodo ?? { inicio: planIndividual.fechaCreacion } }] };
  }
  return resto;
}

export function leerNinos(): Nino[] {
  if (typeof window === 'undefined') return NINOS_SEMILLA;
  try {
    const guardado = window.localStorage.getItem(NINOS_STORAGE_KEY);
    if (!guardado) return NINOS_SEMILLA;
    const parseado = (JSON.parse(guardado) as NinoLegado[]).map(normalizarNino);
    return Array.isArray(parseado) && parseado.length > 0 ? parseado : NINOS_SEMILLA;
  } catch {
    return NINOS_SEMILLA;
  }
}

export function guardarNinos(ninos: Nino[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(NINOS_STORAGE_KEY, JSON.stringify(ninos));
  } catch {
    // Almacenamiento no disponible (modo privado/cuota) — la sesión sigue funcionando en memoria.
  }
}

export function generarIdNino(): string {
  return `nino-${Date.now()}`;
}

/** Export activo para las pantallas que TODAVÍA no leen el roster dinámico (Hoy/Planeación/
 * Observar/Niños foco) — siguen apuntando a la semilla fija sin regresión. El roster editable de
 * verdad vive en `leerNinos()`; las pantallas de Módulo Niños (`/ninos`, `/ninos/[id]`,
 * `/ninos/nuevo`) ya lo usan. Reconciliar Hoy/Planeación/Observar con el roster dinámico es del
 * paso 5 ("Planeación con o sin niños"), donde de todas formas se reescribe esa lógica. */
export const NINOS: Nino[] = NINOS_SEMILLA;

export const ETAPAS_ORDEN: Etapa[] = ['Infant', 'Toddler Jr', 'Toddler Sr', 'Preschool', 'Pre-K'];

/* ── CATÁLOGO Y PLANTILLAS DE EJEMPLO (Sesión 6, paso 4) — el usuario confirmó explícitamente
   que este contenido es DEMO para probar el mecanismo, no el catálogo pedagógico oficial de
   RAÍZ (eso se revisa en una ronda aparte: skills definitivos, rangos, prerrequisitos, políticas
   de evidencia, Core Developmental Profile, tracks). ── */
export const SKILLS_CATALOG: SkillCatalogEntry[] = [
  { id: 'gateo', dominio: 'motricidad_gruesa', nombre: 'Gateo cruzado', rangoEdadMesesMin: 6, rangoEdadMesesMax: 12, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Piso libre', 'Outdoor'] },
  { id: 'pinza', dominio: 'motricidad_fina', nombre: 'Agarre de pinza', rangoEdadMesesMin: 8, rangoEdadMesesMax: 14, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Comidas'] },
  { id: 'balbuceo-comunicativo', dominio: 'comunicacion_lenguaje', nombre: 'Balbuceo comunicativo', rangoEdadMesesMin: 4, rangoEdadMesesMax: 12, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Circle Time', 'Juego libre'] },
  { id: 'apego-seguro', dominio: 'socioemocional', nombre: 'Busca a la maestra como base segura', rangoEdadMesesMin: 3, rangoEdadMesesMax: 12, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Transiciones', 'Llegada'] },

  { id: 'palabras', dominio: 'comunicacion_lenguaje', nombre: 'Vocabulario de 2 palabras', rangoEdadMesesMin: 12, rangoEdadMesesMax: 36, prerrequisitos: ['balbuceo-comunicativo'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Circle Time', 'Centros'] },
  { id: 'apilar', dominio: 'motricidad_fina', nombre: 'Apila 4+ bloques', rangoEdadMesesMin: 12, rangoEdadMesesMax: 30, prerrequisitos: ['pinza'], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Centros'] },
  { id: 'camina-independiente', dominio: 'motricidad_gruesa', nombre: 'Camina independientemente', rangoEdadMesesMin: 10, rangoEdadMesesMax: 18, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Outdoor'] },
  { id: 'juego-paralelo', dominio: 'interaccion_social', nombre: 'Juego paralelo junto a otro niño', rangoEdadMesesMin: 18, rangoEdadMesesMax: 30, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Outdoor'] },
  { id: 'sigue-instrucciones-simples', dominio: 'comunicacion_lenguaje', nombre: 'Sigue instrucciones de 1 paso', rangoEdadMesesMin: 24, rangoEdadMesesMax: 36, prerrequisitos: ['palabras'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Transiciones', 'Circle Time'] },
  { id: 'autonomia-alimentacion', dominio: 'autonomia', nombre: 'Come solo con cuchara', rangoEdadMesesMin: 18, rangoEdadMesesMax: 36, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Comidas'] },

  { id: 'tijeras', dominio: 'motricidad_fina', nombre: 'Uso de tijeras', rangoEdadMesesMin: 36, rangoEdadMesesMax: 60, prerrequisitos: ['pinza'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'consistencia_repetida', vecesMinimas: 3, contextosRecomendados: ['Actividad principal', 'Centros'] },
  { id: 'numeros-1-8', dominio: 'pre_math', nombre: 'Reconoce números 1–8', rangoEdadMesesMin: 36, rangoEdadMesesMax: 48, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Centros', 'Circle Time'] },
  // Sesión 6 paso 4 ronda 2 — reemplazan a 'numeros-1-8' en la plantilla Preschool: el usuario
  // pidió NO mezclar secuencia verbal + reconocimiento de numerales + correspondencia 1:1 como
  // si fueran un solo skill. 'numeros-1-8' queda arriba sin usarse en ninguna plantilla (no se
  // borra para no romper el historial de Luca, que ya tiene un resultado con ese id).
  { id: 'conteo-verbal-secuencia', dominio: 'pre_math', nombre: 'Conteo verbal en secuencia', rangoEdadMesesMin: 30, rangoEdadMesesMax: 54, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Circle Time'] },
  { id: 'reconocimiento-numerales', dominio: 'pre_math', nombre: 'Reconocimiento de numerales', rangoEdadMesesMin: 36, rangoEdadMesesMax: 54, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Circle Time'] },
  { id: 'correspondencia-uno-a-uno', dominio: 'pre_math', nombre: 'Correspondencia uno a uno al contar objetos', rangoEdadMesesMin: 36, rangoEdadMesesMax: 54, prerrequisitos: ['conteo-verbal-secuencia'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Comidas'] },
  { id: 'colores', dominio: 'cognicion', nombre: 'Reconoce colores', rangoEdadMesesMin: 30, rangoEdadMesesMax: 42, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Cualquier actividad'] },
  { id: 'nombre', dominio: 'pre_literacy', nombre: 'Escritura de su nombre', rangoEdadMesesMin: 42, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Pre-K Table', 'Centros'] },
  { id: 'juego-cooperativo', dominio: 'interaccion_social', nombre: 'Juego cooperativo con un rol compartido', rangoEdadMesesMin: 36, rangoEdadMesesMax: 54, prerrequisitos: ['juego-paralelo'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Outdoor'] },

  { id: 'numeros-6-8', dominio: 'pre_math', nombre: 'Conteo 6–8', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: ['numeros-1-8'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Circle Time'] },
  { id: 'rima', dominio: 'pre_literacy', nombre: 'Identifica rimas', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Circle Time'] },
  { id: 'nombre-propio', dominio: 'pre_literacy', nombre: 'Escritura de nombre propio', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: ['nombre'], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Pre-K Table'] },

  { id: 'reconocimiento-letras', dominio: 'pre_literacy', nombre: 'Reconoce letras de su nombre', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Pre-K Table', 'Circle Time'] },
  { id: 'conteo-cantidades', dominio: 'pre_math', nombre: 'Asocia cantidad con número', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: ['numeros-6-8'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros'] },
  // Sesión 6 paso 4 ronda 2b — skill nuevo, ligado al track opcional 'pre_literacy' (no al CORE
  // de Preschool): reconocer el alfabeto mayúsculo fuera de secuencia es una expectativa de
  // alfabetización temprana más fuerte que la que trae por defecto un programa play-based, así
  // que solo aparece en la evaluación si el programa activó ese track (mismo patrón que
  // 'reconocimiento-letras' con el track de Pre-K). Reconocer/nombrar letras vs recitar el
  // abecedario en secuencia vs asociar letra-sonido quedan como distinciones futuras — la demo
  // arranca solo con reconocimiento visual fuera de orden.
  { id: 'reconocimiento-letras-mayusculas', dominio: 'pre_literacy', nombre: 'Reconoce letras mayúsculas fuera de orden', rangoEdadMesesMin: 36, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Pre-K Table', 'Circle Time', 'Centros'] },

  { id: 'resolucion-problemas', dominio: 'cognicion', nombre: 'Resolución de problemas', rangoEdadMesesMin: 24, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'desarrollo_continuo', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'STEAM'] },
  { id: 'interaccion-social', dominio: 'interaccion_social', nombre: 'Interacción con pares', rangoEdadMesesMin: 18, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'desarrollo_continuo', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Outdoor'] },
  { id: 'regulacion-emocional', dominio: 'socioemocional', nombre: 'Regulación emocional', rangoEdadMesesMin: 12, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'desarrollo_continuo', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Cualquier momento'] },
  { id: 'comunicacion-necesidades', dominio: 'comunicacion_lenguaje', nombre: 'Comunicación de necesidades', rangoEdadMesesMin: 12, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'desarrollo_continuo', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Cualquier momento'] },
];

/** Cada versión = fila propia (INMUTABLE tras el primer uso). `track: null` = CORE obligatorio;
 * con track, solo aplica si `programs.tracks_activos` lo incluye. */
export const ASSESSMENT_TEMPLATES: AssessmentTemplate[] = [
  { id: 'tpl-infant-core-v1', rangoEdadMesesMin: 0, rangoEdadMesesMax: 12, etapa: 'Infant', track: null, version: '1.0', vigente: true },
  { id: 'tpl-toddler-jr-core-v1', rangoEdadMesesMin: 12, rangoEdadMesesMax: 24, etapa: 'Toddler Jr', track: null, version: '1.0', vigente: true },
  { id: 'tpl-toddler-sr-core-v1', rangoEdadMesesMin: 24, rangoEdadMesesMax: 36, etapa: 'Toddler Sr', track: null, version: '1.0', vigente: true },
  { id: 'tpl-preschool-core-v1', rangoEdadMesesMin: 36, rangoEdadMesesMax: 48, etapa: 'Preschool', track: null, version: '1.0', vigente: true },
  { id: 'tpl-prek-core-v1', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, etapa: 'Pre-K', track: null, version: '1.0', vigente: true },
  { id: 'tpl-prek-kinder-readiness-v1', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, etapa: 'Pre-K', track: 'kindergarten_readiness', version: '1.0', vigente: true },
  { id: 'tpl-preschool-pre-literacy-v1', rangoEdadMesesMin: 36, rangoEdadMesesMax: 48, etapa: 'Preschool', track: 'pre_literacy', version: '1.0', vigente: true },
];

export const ASSESSMENT_TEMPLATE_SKILLS: AssessmentTemplateSkill[] = [
  { assessmentTemplateId: 'tpl-infant-core-v1', skillId: 'gateo', orden: 1 },
  { assessmentTemplateId: 'tpl-infant-core-v1', skillId: 'pinza', orden: 2 },
  { assessmentTemplateId: 'tpl-infant-core-v1', skillId: 'balbuceo-comunicativo', orden: 3 },
  { assessmentTemplateId: 'tpl-infant-core-v1', skillId: 'apego-seguro', orden: 4 },

  { assessmentTemplateId: 'tpl-toddler-jr-core-v1', skillId: 'camina-independiente', orden: 1 },
  { assessmentTemplateId: 'tpl-toddler-jr-core-v1', skillId: 'palabras', orden: 2 },
  { assessmentTemplateId: 'tpl-toddler-jr-core-v1', skillId: 'apilar', orden: 3 },
  { assessmentTemplateId: 'tpl-toddler-jr-core-v1', skillId: 'juego-paralelo', orden: 4 },

  { assessmentTemplateId: 'tpl-toddler-sr-core-v1', skillId: 'palabras', orden: 1 },
  { assessmentTemplateId: 'tpl-toddler-sr-core-v1', skillId: 'apilar', orden: 2 },
  { assessmentTemplateId: 'tpl-toddler-sr-core-v1', skillId: 'sigue-instrucciones-simples', orden: 3 },
  { assessmentTemplateId: 'tpl-toddler-sr-core-v1', skillId: 'autonomia-alimentacion', orden: 4 },

  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'tijeras', orden: 1 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'conteo-verbal-secuencia', orden: 2 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'reconocimiento-numerales', orden: 3 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'correspondencia-uno-a-uno', orden: 4 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'colores', orden: 5 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'nombre', orden: 6 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'juego-cooperativo', orden: 7 },

  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'numeros-6-8', orden: 1 },
  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'rima', orden: 2 },
  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'nombre-propio', orden: 3 },
  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'tijeras', orden: 4 },

  { assessmentTemplateId: 'tpl-prek-kinder-readiness-v1', skillId: 'reconocimiento-letras', orden: 1 },
  { assessmentTemplateId: 'tpl-prek-kinder-readiness-v1', skillId: 'conteo-cantidades', orden: 2 },

  { assessmentTemplateId: 'tpl-preschool-pre-literacy-v1', skillId: 'reconocimiento-letras-mayusculas', orden: 1 },
];

/* ── PREGUNTAS OBSERVABLES (Sesión 6, paso 4, ronda 2) — CAPA DE EXPERIENCIA sobre la
   arquitectura ya aprobada, no la reemplaza: `ResultadoEvaluacion` sigue guardando exactamente
   `estadoDesarrollo`/`estadoEvidencia`. Lo que cambia es CÓMO llega la maestra a esos dos
   valores — respondiendo sobre una conducta observable concreta, no eligiendo directo entre
   "Desconocido/En desarrollo/Dominado". RAÍZ deriva el estado desde la respuesta; la maestra
   puede revisarlo/corregirlo. Inspirado en el ENFOQUE de sistemas profesionales (evaluación
   auténtica, indicadores observables, progresión) — contenido propio, no copiado. Datos DEMO
   para probar la experiencia, no el catálogo pedagógico oficial (igual que `SKILLS_CATALOG`).

   ⚠️ LOS UMBRALES SON ILUSTRATIVOS, NO POLÍTICA PEDAGÓGICA OFICIAL. Cada `minimoSeleccionado` de
   `UmbralConteo` y cada mapeo opción→estado de `OpcionObservable` en `PREGUNTAS_OBSERVABLES_DEMO`
   es un número/decisión que este agente eligió SOLO para demostrar que el mecanismo (radio
   progresivo, selección múltiple con conteo, progresión por niveles) deriva correctamente
   `estadoDesarrollo`/`estadoEvidencia`. Ninguno viene de un instrumento validado ni fue revisado
   pedagógicamente. Antes de usar esto con familias reales, el catálogo completo — preguntas,
   opciones, umbrales, y cada skill/rango/track nuevo que se agregue después (letras, colores,
   etc.) — pasa por una ronda de revisión pedagógica dedicada y aparte de esta. */

export type TipoRespuestaObservable = 'seleccion_unica' | 'seleccion_multiple';

/** Una opción de respuesta de selección única — ordenada de la conducta más temprana a la más
 * avanzada. Cada opción declara directamente el estado que implica; RAÍZ nunca improvisa esa
 * traducción en tiempo de ejecución. */
export interface OpcionObservable {
  id: string;
  texto: string;
  estadoDesarrollo: EstadoDesarrollo;
  estadoEvidencia: EstadoEvidencia;
}

/** Para preguntas de selección MÚLTIPLE (ej. "¿cuáles números reconoce?") — el estado se deriva
 * de CUÁNTAS opciones se marcaron, evaluado de mayor a menor umbral. ⚠️ Los valores de
 * `minimoSeleccionado` que se definan en `PREGUNTAS_OBSERVABLES_DEMO` son ilustrativos (demo), no
 * una regla pedagógica validada — ver el aviso completo arriba de `PREGUNTAS_OBSERVABLES_DEMO`. */
export interface UmbralConteo {
  minimoSeleccionado: number;
  estadoDesarrollo: EstadoDesarrollo;
  estadoEvidencia: EstadoEvidencia;
}

export interface PreguntaObservable {
  id: string;
  skillId: string;
  texto: string;
  tipoRespuesta: TipoRespuestaObservable;
  /** Selección única: opciones progresivas, cada una con su estado. Siempre incluye una opción
   * "Aún no observado" — nunca fuerza a la maestra a inventar una respuesta. */
  opciones?: OpcionObservable[];
  /** Selección múltiple: universo de opciones marcables + umbrales de derivación por conteo. */
  opcionesMultiples?: { id: string; texto: string }[];
  umbrales?: UmbralConteo[];
}

export const PREGUNTAS_OBSERVABLES_DEMO: PreguntaObservable[] = [
  {
    id: 'preg-tijeras',
    skillId: 'tijeras',
    texto: '¿Qué has observado cuando usa tijeras?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'abre_cierra_ayuda', texto: 'Abre y cierra con ayuda', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'pequenos_recortes', texto: 'Realiza pequeños recortes', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'cortes_consecutivos', texto: 'Realiza cortes consecutivos', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'intenta_linea', texto: 'Intenta seguir una línea', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'sigue_linea', texto: 'Sigue una línea sencilla', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-juego-cooperativo',
    skillId: 'juego-cooperativo',
    texto: 'Durante el juego con otros niños, ¿qué suele hacer?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'cerca_propios_materiales', texto: 'Juega cerca de otros, pero con sus propios materiales', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'se_une_brevemente', texto: 'Se une brevemente a otros', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'comparte_materiales', texto: 'Comparte materiales o actividad', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'mantiene_turnos', texto: 'Mantiene juego común y acepta turnos/ideas', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'roles_compartidos', texto: 'Participa en juego imaginativo con roles compartidos', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-conteo-verbal',
    skillId: 'conteo-verbal-secuencia',
    texto: '¿Hasta dónde cuenta verbalmente en secuencia?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: '1-3', texto: '1–3', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: '1-5', texto: '1–5', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: '1-10', texto: '1–10', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
      { id: 'mas-10', texto: 'Más de 10', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-correspondencia',
    skillId: 'correspondencia-uno-a-uno',
    texto: 'Cuando cuenta objetos, ¿usa una palabra-número por cada objeto?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'todavia_no', texto: 'Todavía no', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'a_veces_apoyo', texto: 'A veces, con apoyo', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'si_consistente', texto: 'Sí, consistentemente', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-reconocimiento-numerales',
    skillId: 'reconocimiento-numerales',
    texto: 'Cuando ve los números fuera de orden, ¿cuáles reconoce de manera independiente?',
    tipoRespuesta: 'seleccion_multiple',
    opcionesMultiples: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'].map((n) => ({ id: n, texto: n })),
    umbrales: [
      { minimoSeleccionado: 8, estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
      { minimoSeleccionado: 4, estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { minimoSeleccionado: 1, estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { minimoSeleccionado: 0, estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
    ],
  },
  // Sesión 6 paso 4 ronda 2b — 3 casos nuevos pedidos por el usuario para terminar de validar el
  // mecanismo antes de declarar la experiencia definitiva: seleccion_multiple sobre una lista
  // abierta (colores), seleccion_multiple sobre una grilla completa (letras A-Z), y
  // seleccion_unica como progresión de 8 niveles (nombre propio).
  {
    id: 'preg-colores',
    skillId: 'colores',
    texto: '¿Qué colores reconoce o nombra de manera independiente?',
    // Nota de catálogo: por ahora una sola pregunta mezcla "reconoce/señala cuando se le pide"
    // y "nombra sin ayuda" — la estructura (PreguntaObservable por skillId) ya permite separarlas
    // como dos skills con su propia pregunta el día que el catálogo oficial lo requiera; no se
    // construyen dos cuestionarios completos todavía porque esta demo no lo necesita.
    tipoRespuesta: 'seleccion_multiple',
    opcionesMultiples: ['Rojo', 'Azul', 'Amarillo', 'Verde', 'Naranja', 'Morado', 'Rosa', 'Marrón', 'Negro', 'Blanco', 'Gris'].map((c) => ({ id: c.toLowerCase(), texto: c })),
    umbrales: [
      { minimoSeleccionado: 8, estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
      { minimoSeleccionado: 4, estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { minimoSeleccionado: 1, estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { minimoSeleccionado: 0, estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
    ],
  },
  {
    id: 'preg-letras-mayusculas',
    skillId: 'reconocimiento-letras-mayusculas',
    texto: '¿Qué letras mayúsculas reconoce de manera independiente cuando aparecen fuera de orden?',
    // Nota de catálogo: recitar el abecedario en secuencia, reconocer mayúsculas, reconocer
    // minúsculas y asociar letra-sonido son 4 conductas distintas — esta demo arranca solo con
    // "reconoce mayúsculas fuera de orden"; las otras 3 quedan reservadas para cuando el catálogo
    // oficial las necesite (misma nota que en colores).
    tipoRespuesta: 'seleccion_multiple',
    opcionesMultiples: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((l) => ({ id: l, texto: l })),
    umbrales: [
      { minimoSeleccionado: 20, estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
      { minimoSeleccionado: 10, estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { minimoSeleccionado: 1, estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { minimoSeleccionado: 0, estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
    ],
  },
  {
    id: 'preg-nombre',
    skillId: 'nombre',
    texto: '¿Qué has observado con su nombre?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'reconoce_escrito', texto: 'Reconoce su nombre escrito', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'identifica_algunas_letras', texto: 'Identifica algunas letras de su nombre', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'traza_con_modelo', texto: 'Traza su nombre con modelo', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'copia_algunas_letras', texto: 'Copia algunas letras', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'copia_con_modelo', texto: 'Copia su nombre mirando un modelo', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'escribe_algunas_memoria', texto: 'Escribe algunas letras de memoria', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'escribe_independiente', texto: 'Escribe su nombre independientemente', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },

  // Sesión 6 paso 4 ronda 3 — REGLA DEL USUARIO: la misma familia visual (pregunta observable +
  // radios/casillas compactos + "Aún no observado" siempre disponible + estado_desarrollo/
  // estado_evidencia como resultado SECUNDARIO derivado, nunca como botones grandes principales)
  // aplica a TODAS las edades, no solo Preschool/Pre-K — el contenido cambia por etapa, la
  // experiencia no. Cubre los 4 skills CORE de Infant y los 4 de Toddler Sr para que las
  // evaluaciones de Mateo (~11 meses) y Sofía (Toddler Sr) usen la misma experiencia de punta a
  // punta, sin caer de vuelta en el selector grande. Sigue siendo contenido DEMO.
  {
    id: 'preg-gateo',
    skillId: 'gateo',
    texto: '¿Qué has observado cuando se desplaza por el piso?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'se_arrastra', texto: 'Se arrastra o repta para moverse', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'gatea_mismo_lado', texto: 'Gatea moviendo brazo y pierna del mismo lado', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'gatea_cruzado_intenta', texto: 'Gatea cruzado (brazo y pierna opuestos), pero pierde el patrón seguido', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'gatea_cruzado_sostenido', texto: 'Gatea cruzado de forma sostenida y coordinada', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-pinza',
    skillId: 'pinza',
    texto: '¿Cómo toma objetos pequeños?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'agarre_palmar', texto: 'Los toma con toda la mano (agarre palmar)', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'agarre_rastrillo', texto: 'Los rastrilla con los dedos hacia la palma', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'pinza_inferior', texto: 'Usa el pulgar y el índice, aunque de forma torpe', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'pinza_superior', texto: 'Toma objetos pequeños con precisión, con la punta de los dedos', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-balbuceo',
    skillId: 'balbuceo-comunicativo',
    texto: '¿Qué sonidos o balbuceos has escuchado?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'vocaliza_sueltos', texto: 'Vocaliza sonidos sueltos (ej. "ahh", "ehh")', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'balbucea_repetido', texto: 'Balbucea sílabas repetidas (ej. "ba-ba-ba")', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'balbucea_variado', texto: 'Balbucea combinando distintas sílabas, imitando la entonación del habla', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'balbuceo_intencional', texto: 'Balbucea mirando o señalando, como si buscara comunicar algo', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-apego',
    skillId: 'apego-seguro',
    texto: '¿Cómo se comporta con la maestra cuando algo lo inquieta?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'se_calma_en_brazos', texto: 'Se calma al tomarlo en brazos, tras un momento de angustia', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'busca_maestra', texto: 'Busca activamente a la maestra cuando se siente inseguro', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'base_segura', texto: 'Usa a la maestra como base segura — se aleja a explorar y regresa a revisar', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'explora_con_confianza', texto: 'Explora con confianza sabiendo que puede volver a la maestra en cualquier momento', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-palabras',
    skillId: 'palabras',
    texto: '¿Cómo se comunica verbalmente?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'palabras_sueltas', texto: 'Usa palabras sueltas (1 palabra por vez)', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'combina_2', texto: 'Combina 2 palabras (ej. "más leche")', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'combina_2_frecuente', texto: 'Combina 2–3 palabras con frecuencia', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'frases_cortas', texto: 'Forma frases cortas de 3 o más palabras', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-apilar',
    skillId: 'apilar',
    texto: '¿Cuántos bloques apila?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'apila_2', texto: 'Apila 2 bloques', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'apila_3', texto: 'Apila 3 bloques', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'apila_4', texto: 'Apila 4 bloques', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
      { id: 'apila_5_mas', texto: 'Apila 5 o más bloques con control', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-instrucciones',
    skillId: 'sigue-instrucciones-simples',
    texto: 'Cuando le das una instrucción sencilla, ¿qué hace?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'con_gesto', texto: 'La sigue solo si va acompañada de un gesto o señal', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'a_veces_sin_gesto', texto: 'A veces la sigue sin gesto, sin ser consistente', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'un_paso_consistente', texto: 'Sigue instrucciones de 1 paso de forma consistente', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
      { id: 'dos_pasos', texto: 'Sigue instrucciones de 2 pasos relacionados (ej. "recoge el bloque y dámelo")', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
  {
    id: 'preg-alimentacion',
    skillId: 'autonomia-alimentacion',
    texto: '¿Cómo come con cuchara?',
    tipoRespuesta: 'seleccion_unica',
    opciones: [
      { id: 'no_observado', texto: 'Aún no observado', estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' },
      { id: 'sostiene_ayuda', texto: 'Sostiene la cuchara pero necesita ayuda para llevarla a la boca', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' },
      { id: 'come_con_derrames', texto: 'Se lleva comida a la boca solo, con derrames frecuentes', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'come_pocos_derrames', texto: 'Come solo con pocos derrames', estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' },
      { id: 'come_consistente', texto: 'Come solo de forma consistente, sin ayuda', estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' },
    ],
  },
];

export function preguntaObservablePorSkill(skillId: string): PreguntaObservable | undefined {
  return PREGUNTAS_OBSERVABLES_DEMO.find((p) => p.skillId === skillId);
}

/** Deriva el estado desde cuántas opciones se marcaron — evalúa el umbral más alto que aplique. */
export function derivarEstadoDesdeConteo(pregunta: PreguntaObservable, seleccionadas: string[]): { estadoDesarrollo: EstadoDesarrollo; estadoEvidencia: EstadoEvidencia } {
  const umbrales = [...(pregunta.umbrales ?? [])].sort((a, b) => b.minimoSeleccionado - a.minimoSeleccionado);
  const match = umbrales.find((u) => seleccionadas.length >= u.minimoSeleccionado) ?? umbrales[umbrales.length - 1];
  return { estadoDesarrollo: match.estadoDesarrollo, estadoEvidencia: match.estadoEvidencia };
}

/** Plantillas CORE + tracks que apliquen para una etapa, dado lo que el programa activó en
 * Configuración — nunca decidido por la IA en el momento. */
export function plantillasAplicables(etapa: Etapa, tracksActivos: TrackOpcional[]): AssessmentTemplate[] {
  return ASSESSMENT_TEMPLATES.filter((t) => t.vigente && t.etapa === etapa && (t.track === null || tracksActivos.includes(t.track)));
}

/** Genera el BORRADOR de una evaluación: prellena cada skill con el estado ya conocido
 * (`sugeridoPorRaiz=true`) o, si nunca se ha observado, lo deja explícito como desconocido/no
 * observado — nunca inventa. La maestra puede guardar el borrador incompleto y volver después
 * (regla del usuario, Sesión 6 paso 4). */
export function generarBorradorEvaluacion(nino: Nino, tipo: TipoEvaluacion, tracksActivos: TrackOpcional[]): EvaluacionNino {
  const edadMeses = edadEnMeses(nino.fechaNacimiento);
  const plantillas = plantillasAplicables(nino.etapa, tracksActivos);
  const resultados: ResultadoEvaluacion[] = [];
  const vistos = new Set<string>();
  for (const plantilla of plantillas) {
    const skillsPlantilla = ASSESSMENT_TEMPLATE_SKILLS.filter((s) => s.assessmentTemplateId === plantilla.id).sort((a, b) => a.orden - b.orden);
    for (const ts of skillsPlantilla) {
      if (vistos.has(ts.skillId)) continue;
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
    tipo,
    fecha: FECHA_HOY,
    estado: 'borrador',
    edadAlMomentoMeses: edadMeses,
    etapaAlMomento: nino.etapa,
    resultados,
  };
}

/** Aprueba una evaluación: congela el snapshot (nunca se vuelve a tocar) y SOLO entonces
 * actualiza el perfil vivo (`nino.skills`) — nunca antes, nunca automáticamente (regla del
 * usuario: RAÍZ no marca skills como logrados sin aprobación humana). */
export function aprobarEvaluacion(nino: Nino, evaluacion: EvaluacionNino, aprobadaPor: string = 'maestra'): Nino {
  const evaluacionAprobada: EvaluacionNino = { ...evaluacion, estado: 'aprobada', aprobadaPor, aprobadaEn: FECHA_HOY };
  const skillsActualizados = [...nino.skills];
  for (const r of evaluacion.resultados) {
    const catalogo = SKILLS_CATALOG.find((c) => c.id === r.skillId);
    const nuevoSkill: Skill = {
      id: r.skillId,
      nombre: catalogo?.nombre ?? r.skillId,
      estadoDesarrollo: r.estadoDesarrollo,
      estadoEvidencia: r.estadoEvidencia,
      actualizado: FECHA_HOY,
    };
    const idx = skillsActualizados.findIndex((s) => s.id === r.skillId);
    if (idx >= 0) skillsActualizados[idx] = nuevoSkill;
    else skillsActualizados.push(nuevoSkill);
  }
  return {
    ...nino,
    skills: skillsActualizados,
    evaluaciones: [...nino.evaluaciones.filter((e) => e.id !== evaluacion.id), evaluacionAprobada],
    fechaUltimaEvaluacionAprobada: FECHA_HOY,
  };
}

/** "Última evaluación aprobada + frecuencia → próxima revisión" — regla técnica ya aprobada
 * (nunca configurable, evita exponerle a la maestra una decisión que no necesita tomar). */
export function calcularFechaProximaEvaluacion(nino: Nino, frecuencia: FrecuenciaEvaluacion, mesesPersonalizados?: number): string {
  const referencia = nino.fechaUltimaEvaluacionAprobada ?? nino.fechaIngreso;
  const meses = frecuencia === 'trimestral' ? 3 : frecuencia === 'semestral' ? 6 : frecuencia === 'anual' ? 12 : (mesesPersonalizados ?? 3);
  const d = new Date(`${referencia}T00:00:00`);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

export const TINT_HEX: Record<Nino['colorTint'], string> = {
  teal: '#0D5C63',
  butter: '#B58A1E',
  coral: '#C85D48',
  sage: '#4F6249',
};

export function ninoPorId(id: string, ninos: Nino[] = NINOS): Nino | undefined {
  return ninos.find((n) => n.id === id);
}

export function ninosConFocoHoy(ninos: Nino[] = NINOS): Nino[] {
  return ninos.filter((n) => n.metaActiva);
}

export type DiaSemana = 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie';

/* ── RUTINA DIARIA — los bloques que la maestra configura para su salón (regla del usuario:
   "estos bloques deben ser configurables, porque no todas las maestras tienen la misma rutina").
   Este catálogo es la CONFIGURACIÓN; qué bloques aparecen cada día y con qué actividad vive en
   PLANEACION_SEMANA_3 abajo — un día puede usar unos bloques y no otros. ── */
export type Bloque =
  | 'circle'
  | 'principal'
  | 'steam'
  | 'centros'
  | 'lectura'
  | 'outdoor'
  | 'prek'
  | 'cierre'
  | 'musica'
  | 'transicion'
  | 'custom';

export const BLOQUE_LABEL: Record<Bloque, string> = {
  circle: 'Circle Time',
  principal: 'Actividad principal',
  steam: 'STEAM',
  centros: 'Centros',
  lectura: 'Lectura',
  outdoor: 'Outdoor / Movimiento',
  prek: 'Trabajo Pre-K',
  cierre: 'Cierre / Reflexión',
  musica: 'Música / Movimiento',
  transicion: 'Transición',
  custom: 'Personalizado',
};

/** RUTINA CONFIGURADA DEL PROGRAMA — regla del usuario (Sesión 5 ronda 3): un día NUNCA improvisa
 * qué bloques trae, los HEREDA de esta configuración. Formaliza el patrón real que ya vive en
 * PLANEACION_SEMANA_3 (cada bloque, con qué días y a qué hora aproximada ocurre). Cuando exista
 * una pantalla de configuración de rutina, la maestra edita esta lista y los días futuros se
 * validan/generan a partir de ella — hoy la usa `bloquesConfiguradosParaDia` como fuente de qué
 * bloques le tocan a cada día de la semana. */
export interface BloqueRutina {
  bloque: Bloque;
  /** Solo se usa cuando `bloque === 'custom'`. */
  nombrePersonalizado?: string;
  horaAproximada: string;
  duracionMin: number;
  orden: number;
  dias: DiaSemana[];
  activo: boolean;
}

export const RUTINA_PROGRAMA: BloqueRutina[] = [
  { bloque: 'circle', horaAproximada: '9:30', duracionMin: 15, orden: 1, dias: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'], activo: true },
  { bloque: 'principal', horaAproximada: '9:50', duracionMin: 40, orden: 2, dias: ['Lun', 'Mar', 'Jue'], activo: true },
  { bloque: 'steam', horaAproximada: '9:50', duracionMin: 40, orden: 2, dias: ['Mié'], activo: true },
  { bloque: 'centros', horaAproximada: '9:50', duracionMin: 40, orden: 2, dias: ['Vie'], activo: true },
  { bloque: 'outdoor', horaAproximada: '10:30', duracionMin: 30, orden: 3, dias: ['Lun', 'Mar', 'Jue'], activo: true },
  { bloque: 'lectura', horaAproximada: '11:00', duracionMin: 20, orden: 3, dias: ['Mié'], activo: true },
  { bloque: 'steam', horaAproximada: '11:30', duracionMin: 30, orden: 4, dias: ['Mar'], activo: true },
  { bloque: 'prek', horaAproximada: '13:30', duracionMin: 30, orden: 4, dias: ['Mié'], activo: true },
  { bloque: 'centros', horaAproximada: '15:30', duracionMin: 45, orden: 5, dias: ['Lun', 'Mar'], activo: true },
  { bloque: 'cierre', horaAproximada: '15:00', duracionMin: 15, orden: 6, dias: ['Vie'], activo: true },
];

/** Los bloques activos que le tocan a un día de la semana según la rutina configurada, en orden. */
export function bloquesConfiguradosParaDia(dia: DiaSemana, rutina: BloqueRutina[] = RUTINA_PROGRAMA): BloqueRutina[] {
  return rutina.filter((b) => b.activo && b.dias.includes(dia)).sort((a, b) => a.orden - b.orden);
}

/** De dónde salió una adaptación individual — para que RAÍZ sepa no solo QUÉ se hizo, sino POR
 * QUÉ se sugirió (regla del usuario, Sesión 5 ronda 3). */
export type OrigenAdaptacion = 'necesidad_registrada' | 'plan_individual' | 'observacion' | 'recomendacion_raiz';

/** Sesión 6 paso 5 — CONTEXTOS/DEMANDAS reales de una actividad (materiales, sentidos,
 * movimiento, participación esperada) — tags controlados y fijos, NUNCA texto libre. Reemplaza
 * "categoría de necesidad == dominio de actividad" como regla de relevancia (corrección explícita
 * del usuario: esa igualdad era demasiado limitada — ej. una necesidad SENSORIAL sigue siendo
 * relevante en una actividad de MOTRICIDAD FINA si ambas comparten el contexto real "pega"). Lista
 * corta a propósito; se ampliará solo si hace falta, nunca se vuelve texto libre ni la decide la
 * IA en tiempo de ejecución. */
export type ContextoActividad =
  | 'contacto_sensorial'
  | 'motricidad_fina'
  | 'tijeras'
  | 'pega'
  | 'movimiento'
  | 'respuesta_verbal'
  | 'sentarse_quieto'
  | 'participacion_grupal';

/** Adaptación por una necesidad puntual de UN niño (capa B) — nunca implica Plan Individual.
 * Entidad relacional completa: `necesidad`/`ajuste` son el snapshot histórico de lo que se usó
 * ESE día; las referencias (`childNeedId`/`childSupportId`/`individualGoalId`/`planId`/
 * `observationId`) enlazan a la fuente estructurada cuando existe — ninguna es obligatoria (regla
 * del usuario: "no todos son obligatorios"). `origenCalculo` distingue lo que RAÍZ calculó y
 * guardó (`raiz_sugerido`) de lo escrito a mano (`maestra_manual` o sin marcar, contenido
 * histórico) — sin este campo, ambos se tratan igual (contenido ya aceptado). */
export interface AdaptacionIndividual {
  ninoId: string;
  necesidad: string;
  ajuste: string;
  origen: OrigenAdaptacion;
  /** Si esta adaptación aplica solo a esta actividad puntual o es una adaptación general del
   * niño que se está reutilizando aquí (capa B nunca implica Plan Individual, pero sí puede ser
   * una adaptación permanente que se repite en varias actividades). */
  alcance: 'solo_esta_actividad' | 'general_del_nino';
  childNeedId?: string;
  childSupportId?: string;
  individualGoalId?: string;
  planId?: string;
  observationId?: string;
  origenCalculo?: 'raiz_sugerido' | 'maestra_manual';
}

/** Niño cuya meta/skill activa se observa a propósito en ESTA actividad (capa C) — objetivo
 * individual: cómo esa misma experiencia grupal sirve a su meta puntual. El RESULTADO de la
 * observación nunca se duplica aquí como texto (regla del usuario, Sesión 5 ronda 3): solo se
 * guarda un estado (`pendiente`/`observado`) y, cuando existe, la referencia `observationId` — el
 * contenido real vive únicamente en `observations`. */
export interface NinoFocoActividad {
  ninoId: string;
  meta: string;
  observar: string;
  /** Enlaza con el skill/meta real del niño (`Nino.skills[].id`) cuando ya existe como skill
   * formal; algunos focos observan un dominio que aún no se ha formalizado como skill. */
  skillId?: string;
  /** Meta de Plan Individual que motivó este foco, cuando aplica — prioridad 1 sobre un simple
   * skill en desarrollo (regla del usuario, Sesión 6 paso 5). */
  individualGoalId?: string;
  estadoFoco: 'pendiente' | 'observado';
  observationId?: string;
  origenCalculo?: 'raiz_sugerido' | 'maestra_manual';
}

/* ── GUÍAS ESPECÍFICAS POR TIPO DE BLOQUE (corrección del usuario, Sesión 5 — ronda 2):
   "NO todos necesitan exactamente los mismos campos... RAÍZ debe entender el tipo de bloque."
   Circle Time, Outdoor y Centros tienen una función pedagógica propia que NO cabe en los campos
   genéricos de preparación/qué-hace-la-maestra (esos SÍ le quedan bien a Actividad Principal,
   STEAM y Trabajo Pre-K — se reutilizan ahí). Cada bloque solo llena el campo `guia*` que le
   corresponde; nunca los tres a la vez. ── */

/** Circle Time: rutina breve que se repite (saludo/fecha/clima/conteo/abecedario — 3-5 min) +
 * el FOCO específico de ese día (tema/palabras/muestra/preguntas/libro/letra/canción — 5-7 min),
 * nunca los dos con la misma profundidad todos los días. */
export interface GuiaCircleTime {
  duracion: string; // "10–15 min"
  rutinaDiaria: { icono: string; titulo: string; texto: string }[];
  focoDeHoy: {
    tema: string;
    palabrasDelDia: string[];
    muestra: string;
    preguntas: string[];
    libro?: string;
    letra?: string;
    cancion?: string;
  };
  cierre: string;
}

/** Outdoor/Movimiento: una invitación intencional breve conectada al tema, seguida de juego
 * libre — RAIZ nunca convierte este bloque en otra clase académica. */
export interface GuiaOutdoor {
  movimientoIntencional: { duracion: string; invitacion: string; ideas: string[]; cancion?: string };
  juegoLibre: string;
  preguntaInformal?: string;
  quePriorizar: string;
}

/** Un centro disponible hoy — Centros muestra varios a la vez, cada uno con su propia
 * provocación (nunca "juego libre" a secas). */
export interface CentroDisponible {
  nombre: string;
  material: string;
  provocacion: string;
  intencion: string;
  pregunta?: string;
}

/** Cierre/Reflexión: cierra el aprendizaje del día sin volverlo académico. */
export interface GuiaCierre {
  recuerda: string;
  pregunta: string;
  vocabulario: string;
  cancionOMovimiento?: string;
  puenteManana?: string;
}

/** Imprimible RESERVADO — la entidad existe en el modelo para que una actividad pueda
 * enlazarlos, pero NO se genera ningún archivo real todavía (regla del usuario, Sesión 5 ronda
 * 3: "no construyas printables reales"). Reemplaza el campo `printable?: string` que no se
 * renderizaba en ninguna pantalla. */
export interface Printable {
  id: string;
  titulo: string;
  tipo: 'ficha_individual' | 'ficha_grupal' | 'guia_para_casa';
}

export interface Actividad {
  id: string;
  bloque: Bloque;
  hora: string; // "9:50"
  titulo: string;
  /** Objetivo DE LA ACTIVIDAD (nivel 2 de 3) — qué skill o propósito tiene esta experiencia. */
  objetivo: string;
  dominio: string;
  materiales: { nombre: string; disponible: boolean }[];
  preparacion?: string;
  queHaceMaestra?: string;
  queHacenNinos?: string;
  preguntasGuia?: string[];
  /** Por qué esta experiencia se conecta con el tema/objetivo de la semana. */
  conexionTema?: string;
  /** Adaptación por ETAPA (capa A) — solo las actividades que lo ameritan la tienen. */
  diferenciacion?: Record<Etapa, string>;
  /** Sesión 6 paso 5 — CONTEXTOS/DEMANDAS reales de esta actividad (ver `ContextoActividad`), y
   * skills reales que esta actividad trabaja de verdad (`SkillCatalogEntry.id`) — la base para
   * calcular Capas B/C desde el perfil real del niño, en vez de solo comparar dominio. Opcional:
   * una actividad sin tags simplemente nunca genera candidatos automáticos (default seguro, sin
   * falsos positivos) — no hace falta taggear todo el catálogo de una vez. */
  contextos?: ContextoActividad[];
  skillsRelacionados?: string[];
  adaptacionesIndividuales?: AdaptacionIndividual[];
  ninosFoco?: NinoFocoActividad[];
  queObservar?: string;
  evidenciaPosible?: string;
  /** Reservado — ver `Printable`. Ninguna actividad de esta demo lo puebla todavía. */
  printablesDisponibles?: Printable[];
  notas?: string;
  /** Guías específicas — solo UNA se llena, según `bloque`. */
  guiaCircle?: GuiaCircleTime;
  guiaOutdoor?: GuiaOutdoor;
  guiaCentros?: CentroDisponible[];
  guiaCierre?: GuiaCierre;
}

export interface DiaPlan {
  dia: DiaSemana;
  fecha: string; // ISO
  /** Tema/foco del día (primera clase) — antes vivía escondido dentro de guiaCircle.focoDeHoy;
   * ahora es un hecho estructurado del día (regla del usuario: nunca esconder relaciones/hechos
   * dentro del contenido flexible). */
  temaDia: string;
  focoDia: string;
  actividades: Actividad[];
}

export interface PlaneacionSemanal {
  numero: number;
  /** Objetivo DE LA SEMANA (nivel 1 de 3) — qué se desarrolla con el grupo esta semana. */
  temaMensual: string;
  subtemaSemanal: string;
  vocabulario: string[];
  objetivosGenerales: string[];
  dominiosPrincipales: string[];
  dias: DiaPlan[];
  /** Sesión 6 paso 5 — pertenece a ESTA semana, no a un interruptor global (regla del usuario:
   * una maestra puede personalizar unas semanas y no otras). Apagado por defecto: la planeación
   * grupal (Capa A) funciona igual sin esto. Cuando se prende, `calcularPersonalizacionSemana()`
   * corre UNA vez y guarda su resultado dentro de `dias[].actividades[]` — nunca se recalcula
   * solo al abrir la pantalla (regla del usuario: "personalización sugerida ≠ cambio eterno en
   * vivo"); solo un "Actualizar personalización" explícito vuelve a correrlo. */
  personalizacionActiva: boolean;
  personalizacionActualizadaEn?: string;
}

export const PLANEACION_SEMANA_3: PlaneacionSemanal = {
  numero: 3,
  personalizacionActiva: true,
  personalizacionActualizadaEn: '2026-09-10',
  temaMensual: 'Mi cuerpo y mis sentidos',
  subtemaSemanal: 'Las partes de mi cuerpo',
  vocabulario: ['cabeza', 'brazos', 'piernas', 'dedos', 'sentir'],
  objetivosGenerales: [
    'Identificar y nombrar las partes principales del cuerpo',
    'Practicar motricidad fina con herramientas (tijeras, pega)',
    'Ampliar vocabulario descriptivo sobre sí mismos',
  ],
  dominiosPrincipales: ['Motricidad fina', 'Lenguaje y vocabulario', 'Identidad y autoconocimiento'],
  dias: [
    {
      dia: 'Lun',
      fecha: '2026-09-14',
      temaDia: 'Empezamos a conocer nuestro cuerpo',
      focoDia: 'Introducimos el tema de la semana con la canción del cuerpo.',
      actividades: [
        {
          id: 'lun-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — Empezamos a conocer nuestro cuerpo',
          objetivo: 'Rutina breve del día + introducir el tema de la semana con la canción del cuerpo.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Ninguno (canción con gestos)', disponible: true }],
          guiaCircle: {
            duracion: '10–15 min',
            rutinaDiaria: [
              { icono: '👋', titulo: 'Saludo', texto: 'Cantar la canción de buenos días configurada por la maestra.' },
              { icono: '📅', titulo: 'Hoy', texto: '"Today is Monday / Hoy es lunes."' },
              { icono: '☀️', titulo: 'Clima', texto: 'Mirar por la ventana y elegir el clima juntos.' },
              { icono: '🔢', titulo: 'Conteo', texto: 'Contar del 1 al 10 en grupo.' },
            ],
            focoDeHoy: {
              tema: 'Empezamos una semana nueva: vamos a conocer las partes de nuestro cuerpo.',
              palabrasDelDia: ['BODY / CUERPO'],
              muestra: 'Canta "Head, Shoulders, Knees and Toes" señalando cada parte mientras cantas.',
              preguntas: ['What is this?" (señalando la cabeza)', 'Can you touch your shoulders?'],
              cancion: '"Head, Shoulders, Knees and Toes"',
            },
            cierre: 'Tenemos un cuerpo increíble — esta semana lo vamos a descubrir juntos.',
          },
          diferenciacion: {
            Infant: 'Escucha la canción y observa los gestos, con apoyo para tocarse partes del cuerpo.',
            'Toddler Jr': 'Imita 1-2 gestos de la canción.',
            'Toddler Sr': 'Imita 1-2 gestos de la canción.',
            Preschool: 'Sigue la canción completa y nombra 1 parte del cuerpo.',
            'Pre-K': 'Propone otra parte del cuerpo para agregar a la canción.',
          },
        },
        {
          id: 'lun-principal',
          bloque: 'principal',
          hora: '9:50',
          titulo: 'Dibujo de mi silueta',
          objetivo: 'Que cada niño reconozca el contorno de su propio cuerpo.',
          dominio: 'Identidad y autoconocimiento',
          materiales: [
            { nombre: 'Papel craft grande', disponible: true },
            { nombre: 'Crayones', disponible: true },
          ],
          preparacion: 'Cortar un pliego de papel craft por niño; tener crayones a la mano.',
          queHaceMaestra: 'Ayuda a cada niño a acostarse sobre el papel y traza su silueta, nombrando las partes que delinea.',
          queHacenNinos: 'Se acuestan sobre el papel y luego observan su silueta, señalando partes que reconocen.',
          preguntasGuia: ['¿Qué ves en tu silueta?', '¿Eres más grande o más chico que tu silueta?'],
          conexionTema: 'Primer contacto con el propio contorno — mañana esta misma silueta se llena de textura en Collage del cuerpo.',
          diferenciacion: {
            Infant: 'Se recuesta con apoyo mientras la maestra traza, sin expectativa de quedarse quieto.',
            'Toddler Jr': 'Se acuesta un momento breve con ayuda.',
            'Toddler Sr': 'Se acuesta un momento breve con ayuda.',
            Preschool: 'Se mantiene quieto mientras lo trazan y nombra 2 partes al verse.',
            'Pre-K': 'Ayuda a trazar la silueta de un compañero.',
          },
          adaptacionesIndividuales: [
            {
              ninoId: 'mateo',
              necesidad: 'Aún no se acuesta boca arriba largo rato sin apoyo',
              ajuste: 'Trazar solo el contorno de sus manos y pies en vez del cuerpo completo.',
              origen: 'necesidad_registrada',
              alcance: 'solo_esta_actividad',
            },
          ],
          ninosFoco: [
            { ninoId: 'luca', meta: 'Reconocimiento corporal', observar: 'Nombra al menos 2 partes al ver su silueta.', estadoFoco: 'pendiente' },
          ],
          queObservar: 'Quién reconoce su silueta como "yo" y quién la ve como un dibujo cualquiera.',
        },
        {
          id: 'lun-outdoor',
          bloque: 'outdoor',
          hora: '10:30',
          titulo: 'Circuito motor',
          objetivo: 'Practicar equilibrio y coordinación gruesa con todo el cuerpo.',
          dominio: 'Motricidad gruesa',
          materiales: [{ nombre: 'Aros y conos', disponible: true }],
          guiaOutdoor: {
            movimientoIntencional: {
              duracion: '5 min',
              invitacion: 'Vamos a mover todo nuestro cuerpo en el circuito.',
              ideas: ['Saltar dentro de los aros', 'Caminar sobre la línea de conos', 'Gatear bajo el túnel', 'Correr hasta la meta'],
            },
            juegoLibre: 'Después del circuito, tiempo abierto de juego en el patio.',
            preguntaInformal: '"What did your body do today?"',
            quePriorizar: 'Coordinación y equilibrio, con la confianza de "puedo hacerlo con mi cuerpo".',
          },
        },
        {
          id: 'lun-centros',
          bloque: 'centros',
          hora: '15:30',
          titulo: 'Centro de bloques + Ciencias',
          objetivo: 'Explorar tamaño y comparación con el propio cuerpo, en juego libre.',
          dominio: 'Exploración y juego libre',
          materiales: [{ nombre: 'Bloques', disponible: true }, { nombre: 'Lupas', disponible: true }],
          guiaCentros: [
            {
              nombre: 'Ciencias',
              material: 'Lupas',
              provocacion: 'Explorar texturas de hojas y objetos del salón con lupa.',
              intencion: 'Observación sensorial.',
              pregunta: 'What do you see?',
            },
            {
              nombre: 'Bloques',
              material: 'Bloques',
              provocacion: 'Construir torres tan altas como ellos mismos.',
              intencion: 'Comparación de tamaño con el propio cuerpo.',
              pregunta: 'Is your tower taller than you?',
            },
          ],
        },
      ],
    },
    {
      dia: 'Mar',
      fecha: '2026-09-15',
      temaDia: 'Mi cuerpo: cabeza y manos',
      focoDia: 'Cabeza y manos — las mismas dos palabras se practican en Circle Time y en Collage del cuerpo.',
      actividades: [
        {
          id: 'mar-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — Mi cuerpo',
          objetivo: 'Rutina breve del día + foco en "cabeza" y "mano" antes de la actividad principal.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Libro "Mi cuerpo y yo"', disponible: true }],
          conexionTema: 'Introduce las 2 palabras que Collage del cuerpo (actividad principal) va a poner en práctica con las manos.',
          guiaCircle: {
            duracion: '10–15 min',
            rutinaDiaria: [
              { icono: '👋', titulo: 'Saludo', texto: 'Cantar la canción de buenos días configurada por la maestra.' },
              { icono: '📅', titulo: 'Hoy', texto: '"Today is Tuesday / Hoy es martes."' },
              { icono: '☀️', titulo: 'Clima', texto: 'Mirar por la ventana y elegir el clima juntos.' },
              { icono: '🔢', titulo: 'Conteo', texto: 'Contar del 1 al 10 en grupo.' },
            ],
            focoDeHoy: {
              tema: 'Hoy vamos a descubrir diferentes partes de nuestro cuerpo.',
              palabrasDelDia: ['HEAD / CABEZA', 'HAND / MANO'],
              muestra: 'Señala tu cabeza y tus manos. Invita a los niños a encontrarlas en su propio cuerpo.',
              preguntas: ['Where is your head?', 'Can you show me your hands?', 'What can your hands do?'],
              libro: '"Mi cuerpo y yo" — picture walk breve por las páginas de cabeza y manos.',
              letra: 'H — "Today we are noticing H. Head starts with H."',
              cancion: '"Head, Shoulders, Knees and Toes"',
            },
            cierre: 'Antes de levantarnos, toca tu cabeza, tus manos y tus piernas. Transición a Collage del cuerpo.',
          },
          diferenciacion: {
            Infant: 'Escucha la canción, observa las imágenes, toca o señala partes del cuerpo con ayuda.',
            'Toddler Jr': 'Señala, imita el gesto, repite una palabra si puede.',
            'Toddler Sr': 'Señala, imita el gesto, repite una palabra si puede.',
            Preschool: 'Nombra la parte del cuerpo, responde preguntas simples, participa en la canción.',
            'Pre-K': 'Describe con una frase corta y relaciona la letra H con "head".',
          },
          adaptacionesIndividuales: [
            {
              ninoId: 'sofia',
              necesidad: 'Lenguaje expresivo limitado',
              ajuste: 'Permitir señalar o elegir entre dos imágenes en vez de responder con palabras.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
            },
            {
              ninoId: 'mateo',
              necesidad: 'Aún no se sienta con apoyo total',
              ajuste: 'Participar en brazos de la maestra o en el piso, con apoyo directo.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
            },
          ],
          ninosFoco: [
            { ninoId: 'sofia', meta: 'Vocabulario de 2 palabras', observar: 'Observa si Sofía señala HEAD cuando la nombras.', skillId: 'palabras', estadoFoco: 'pendiente' },
            { ninoId: 'luca', meta: 'Reconocimiento corporal', observar: 'Observa si Luca responde a una pregunta simple sobre su cuerpo.', estadoFoco: 'pendiente' },
          ],
        },
        {
          id: 'mar-principal',
          bloque: 'principal',
          hora: '9:50',
          titulo: 'Collage del cuerpo',
          objetivo: 'Que cada niño identifique y represente las partes principales de su cuerpo en una silueta propia.',
          dominio: 'Motricidad fina',
          materiales: [
            { nombre: 'Telas de colores', disponible: true },
            { nombre: 'Pega-stick', disponible: true },
            { nombre: 'Tijeras de punta roma', disponible: true },
            { nombre: 'Papel craft grande', disponible: false },
          ],
          preparacion: 'Trazar una silueta por niño en papel craft antes de que lleguen; cortar telas en tiras.',
          queHaceMaestra: 'Nombra cada parte del cuerpo en voz alta mientras circula, y pregunta "¿qué parte pegaste aquí?".',
          queHacenNinos: 'Pegan y recortan telas sobre su silueta, nombrando la parte del cuerpo que cubren.',
          preguntasGuia: ['¿Qué parte del cuerpo estás cubriendo?', '¿Para qué usamos esa parte?', '¿Qué falta en tu silueta?'],
          diferenciacion: {
            Infant: 'Explora texturas de tela sobre una silueta grande, con apoyo, sin necesidad de pegar.',
            'Toddler Jr': 'Pega piezas grandes de tela con pega-stick en su propia silueta.',
            'Toddler Sr': 'Pega piezas grandes de tela con pega-stick en su propia silueta.',
            Preschool: 'Nombra cada parte del cuerpo mientras pega y recorta con tijeras.',
            'Pre-K': 'Escribe el nombre de 3 partes del cuerpo junto a su silueta.',
          },
          // Sesión 6 paso 5: contextos/skills reales de esta actividad — base para que RAÍZ
          // calcule Capas B/C desde el perfil real de cualquier niño (no solo estos 2 ejemplos
          // ya escritos a mano).
          contextos: ['pega', 'tijeras', 'motricidad_fina', 'contacto_sensorial'],
          skillsRelacionados: ['tijeras'],
          adaptacionesIndividuales: [
            {
              ninoId: 'sofia',
              necesidad: 'Sensibilidad sensorial (evita tocar texturas pegajosas)',
              ajuste: 'Ofrecerle un aplicador de pega en vez de pega-stick directo en la mano.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
              origenCalculo: 'maestra_manual',
            },
            {
              ninoId: 'mateo',
              necesidad: 'Aún no se sostiene de pie por sí solo',
              ajuste: 'Explorar la silueta en el piso, boca abajo, con apoyo directo de la maestra.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
              origenCalculo: 'maestra_manual',
            },
          ],
          ninosFoco: [
            { ninoId: 'luca', meta: 'Tijeras', observar: 'Cortes consecutivos sin ayuda', skillId: 'tijeras', estadoFoco: 'pendiente', origenCalculo: 'maestra_manual' },
            { ninoId: 'zayne', meta: 'Números 6–8', observar: 'Reconoce solo, sin contar con el dedo', skillId: 'numeros-6-8', estadoFoco: 'pendiente', origenCalculo: 'maestra_manual' },
          ],
          queObservar: 'Quién nombra la parte del cuerpo sin que se le pregunte, y quién necesita el modelo de la maestra.',
          evidenciaPosible: 'Foto de la silueta terminada + la frase textual que dijo el niño al pegar.',
        },
        {
          id: 'mar-outdoor',
          bloque: 'outdoor',
          hora: '10:30',
          titulo: 'Movimiento intencional + juego libre',
          objetivo: 'Descubrir lo que puede hacer el cuerpo en movimiento, después juego libre.',
          dominio: 'Motricidad gruesa',
          materiales: [{ nombre: 'Patio/juegos exteriores', disponible: true }],
          conexionTema: 'Lleva "Mi cuerpo" del salón al patio: hoy el cuerpo se explora en movimiento, no solo en la silueta.',
          guiaOutdoor: {
            movimientoIntencional: {
              duracion: '5 min',
              invitacion: 'Vamos a descubrir lo que puede hacer nuestro cuerpo.',
              ideas: ['Caminar rápido y lento', 'Saltar', 'Estirar los brazos', 'Tocar las rodillas', 'Contar 5 pasos'],
              cancion: '"Head, Shoulders, Knees and Toes" (versión en movimiento)',
            },
            juegoLibre: 'Después de la invitación, tiempo abierto de juego libre en el patio.',
            preguntaInformal: '"What can your legs do?"',
            quePriorizar: 'Movimiento, exploración, juego, socialización y aire libre — nunca un worksheet al aire libre.',
          },
          diferenciacion: {
            Infant: 'Explora el pasto/superficie con apoyo, gateo o pasos asistidos.',
            'Toddler Jr': 'Imita 1-2 movimientos simples (saltar, estirar) junto a la maestra.',
            'Toddler Sr': 'Imita 1-2 movimientos simples (saltar, estirar) junto a la maestra.',
            Preschool: 'Sigue la secuencia completa de movimientos y los nombra.',
            'Pre-K': 'Propone un movimiento nuevo para que el grupo lo imite.',
          },
          queObservar: 'Quién sigue la invitación de movimiento y quién prefiere el juego libre desde el inicio — ambos son válidos.',
        },
        {
          id: 'mar-steam',
          bloque: 'steam',
          hora: '11:30',
          titulo: 'STEAM: espejos',
          objetivo: 'Explorar la simetría del propio rostro con espejos.',
          dominio: 'Pensamiento científico',
          materiales: [{ nombre: 'Espejos irrompibles', disponible: true }],
          preparacion: 'Colocar espejos irrompibles a distintas alturas alrededor de un tapete.',
          queHaceMaestra: 'Modela mirándose al espejo y nombrando partes de su cara; hace una pregunta abierta.',
          queHacenNinos: 'Se miran al espejo, mueven la cara y el cuerpo, y comparan lo que ven.',
          preguntasGuia: ['What do you notice?', 'Are both sides of your face the same?', 'What happens when you move the mirror?'],
          conexionTema: 'Extiende "Mi cuerpo" de cabeza y manos (Circle Time) a la cara, con exploración científica propia.',
          diferenciacion: {
            Infant: 'Explora su reflejo con la maestra cerca; mira y toca el espejo.',
            'Toddler Jr': 'Señala partes de su cara en el espejo cuando se le nombran.',
            'Toddler Sr': 'Señala partes de su cara en el espejo cuando se le nombran.',
            Preschool: 'Nombra lo que ve y compara ambos lados de su cara.',
            'Pre-K': 'Describe la simetría de su cara con una frase completa.',
          },
          adaptacionesIndividuales: [
            {
              ninoId: 'mateo',
              necesidad: 'Aún no se sostiene sentado frente al espejo',
              ajuste: 'Sostenerlo en brazos frente al espejo, a su altura.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
            },
          ],
          ninosFoco: [
            { ninoId: 'zayne', meta: 'Vocabulario descriptivo', observar: 'Usa una palabra propia para describir lo que ve en el espejo.', estadoFoco: 'pendiente' },
          ],
          queObservar: 'Quién nombra partes de su cara sin ayuda y quién solo explora la textura del espejo.',
        },
        {
          id: 'mar-centros',
          bloque: 'centros',
          hora: '15:30',
          titulo: 'Centros: Ciencias + Bloques',
          objetivo: 'Profundizar en lo explorado en STEAM, en juego libre por estaciones.',
          dominio: 'Exploración y juego libre',
          materiales: [{ nombre: 'Lupas', disponible: true }, { nombre: 'Bloques', disponible: true }],
          guiaCentros: [
            {
              nombre: 'Science',
              material: 'Espejos irrompibles',
              provocacion: 'Coloca espejos a diferentes alturas para que los niños observen su rostro y cuerpo.',
              intencion: 'Autoconocimiento + observación.',
              pregunta: 'What do you notice?',
            },
            {
              nombre: 'Blocks',
              material: 'Bloques + figuras humanas del inventario',
              provocacion: 'Construir una casa o espacio para las personas.',
              intencion: 'Representación espacial + juego simbólico.',
              pregunta: 'Where will the people sleep?',
            },
          ],
        },
      ],
    },
    {
      dia: 'Mié',
      fecha: '2026-09-16',
      temaDia: 'De pies a cabeza',
      focoDia: 'La palabra "pies" y el libro que leemos completo más tarde en Lectura.',
      actividades: [
        {
          id: 'mie-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — El libro de hoy',
          objetivo: 'Rutina breve del día + presentar el libro y la palabra "pies" antes de leerlo.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Libro "De pies a cabeza"', disponible: true }],
          guiaCircle: {
            duracion: '10–15 min',
            rutinaDiaria: [
              { icono: '👋', titulo: 'Saludo', texto: 'Cantar la canción de buenos días configurada por la maestra.' },
              { icono: '📅', titulo: 'Hoy', texto: '"Today is Wednesday / Hoy es miércoles."' },
              { icono: '☀️', titulo: 'Clima', texto: 'Mirar por la ventana y elegir el clima juntos.' },
              { icono: '🔢', titulo: 'Conteo', texto: 'Contar del 1 al 10 en grupo.' },
            ],
            focoDeHoy: {
              tema: 'Hoy conocemos un libro sobre todo lo que puede hacer nuestro cuerpo.',
              palabrasDelDia: ['FEET / PIES'],
              muestra: 'Muestra la portada del libro y pregunta qué animales creen que van a aparecer.',
              preguntas: ['What can your feet do?', 'Can you jump like the frog?'],
              libro: '"De pies a cabeza" — lo leemos completo en la Lectura de las 11:00.',
              cancion: '"Head, Shoulders, Knees and Toes"',
            },
            cierre: 'Guardamos las palabras de hoy para el cuento que viene más tarde.',
          },
          diferenciacion: {
            Infant: 'Observa las ilustraciones grandes del libro mientras la maestra las muestra.',
            'Toddler Jr': 'Señala el animal cuando se le pregunta "¿dónde está?".',
            'Toddler Sr': 'Señala el animal cuando se le pregunta "¿dónde está?".',
            Preschool: 'Responde qué puede hacer con sus pies.',
            'Pre-K': 'Anticipa qué animal viene después según la pista de la maestra.',
          },
        },
        {
          id: 'mie-steam',
          bloque: 'steam',
          hora: '9:50',
          titulo: 'STEAM: huellas de manos y pies',
          objetivo: 'Comparar tamaños y formas del propio cuerpo usando pintura no tóxica.',
          dominio: 'Pensamiento científico',
          materiales: [{ nombre: 'Pintura no tóxica', disponible: true }, { nombre: 'Papel', disponible: true }],
          preparacion: 'Preparar pintura no tóxica en bandejas poco profundas y papel grande en el piso o mesa.',
          queHaceMaestra: 'Modela haciendo la huella de su mano y pregunta qué diferencias hay con la de un niño.',
          queHacenNinos: 'Hacen su huella de mano y de pie, y las comparan entre sí.',
          preguntasGuia: ['Whose hand is bigger?', 'How many fingers do you have?', 'Is your foot the same size as mine?'],
          conexionTema: 'Compara tamaños del propio cuerpo — profundiza "mi cuerpo es mío y es distinto al de otros".',
          diferenciacion: {
            Infant: 'Explora la textura de la pintura con apoyo, sin expectativa de huella limpia.',
            'Toddler Jr': 'Hace su huella con ayuda directa de la maestra.',
            'Toddler Sr': 'Hace su huella con ayuda directa de la maestra.',
            Preschool: 'Hace su huella y nombra qué parte usó.',
            'Pre-K': 'Compara su huella con la de un compañero y describe la diferencia.',
          },
          adaptacionesIndividuales: [
            {
              ninoId: 'sofia',
              necesidad: 'Sensibilidad sensorial con pintura',
              ajuste: 'Usar un guante fino o un pincel en vez de contacto directo con la pintura.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
            },
          ],
          ninosFoco: [
            { ninoId: 'zayne', meta: 'Conteo 6–8', observar: 'Cuenta los dedos de su propia huella sin ayuda.', skillId: 'numeros-6-8', estadoFoco: 'pendiente' },
          ],
          queObservar: 'Quién compara tamaños por iniciativa propia y quién necesita la pregunta guía.',
        },
        {
          id: 'mie-lectura',
          bloque: 'lectura',
          hora: '11:00',
          titulo: 'Cuento: "De pies a cabeza"',
          objetivo: 'Escuchar y anticipar partes del cuento con apoyo visual, imitando cada acción.',
          dominio: 'Lenguaje y vocabulario',
          // Sesión 6 paso 5 — sin adaptaciones/focos escritos a mano todavía: caso de prueba para
          // demostrar que la personalización calculada agrega a un niño real (Mateo) desde su
          // apoyo registrado, sin que nadie lo haya anotado aquí antes.
          contextos: ['movimiento', 'sentarse_quieto'],
          materiales: [{ nombre: 'Libro ilustrado', disponible: true }],
          preparacion: 'Elegir las páginas con acciones fáciles de imitar (girar, saltar, aplaudir).',
          queHaceMaestra: 'Lee el cuento en voz alta, invitando a los niños a imitar cada acción del libro.',
          queHacenNinos: 'Escuchan e imitan los movimientos que hace cada animal del cuento.',
          preguntasGuia: ['What can you do like this animal?'],
          diferenciacion: {
            Infant: 'Observa las ilustraciones e imita gestos simples con ayuda.',
            'Toddler Jr': 'Imita 1-2 movimientos del libro.',
            'Toddler Sr': 'Imita 1-2 movimientos del libro.',
            Preschool: 'Imita todos los movimientos e identifica al animal.',
            'Pre-K': 'Describe qué parte del cuerpo usa cada animal para moverse.',
          },
        },
        {
          id: 'mie-prek',
          bloque: 'prek',
          hora: '13:30',
          titulo: 'Pre-K: escritura de partes del cuerpo',
          objetivo: 'Practicar trazo de letras copiando las palabras de la semana.',
          dominio: 'Preescritura',
          materiales: [{ nombre: 'Fichas de trazo', disponible: true }],
          preparacion: 'Imprimir fichas con las palabras HEAD / HAND / FEET en letra punteada.',
          queHaceMaestra: 'Modela trazando la primera letra de cada palabra despacio, nombrándola.',
          queHacenNinos: 'Practican el trazo sobre las letras punteadas de su ficha.',
          preguntasGuia: ['¿Qué letra empieza "head"?'],
          ninosFoco: [
            { ninoId: 'zayne', meta: 'Escritura de nombre', observar: 'Sostiene el lápiz con pinza madura mientras traza.', skillId: 'nombre-propio', estadoFoco: 'pendiente' },
          ],
          queObservar: 'Agarre del lápiz y reconocimiento de la primera letra de cada palabra.',
        },
      ],
    },
    {
      dia: 'Jue',
      fecha: '2026-09-17',
      temaDia: 'Mis 5 sentidos',
      focoDia: 'Ojos y orejas — los 5 sentidos con los que exploramos el mundo.',
      actividades: [
        {
          id: 'jue-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — Mis 5 sentidos',
          objetivo: 'Rutina breve del día + contar los 5 sentidos con los que exploramos el cuerpo.',
          dominio: 'Pensamiento científico',
          materiales: [{ nombre: 'Caja sensorial', disponible: true }],
          guiaCircle: {
            duracion: '10–15 min',
            rutinaDiaria: [
              { icono: '👋', titulo: 'Saludo', texto: 'Cantar la canción de buenos días configurada por la maestra.' },
              { icono: '📅', titulo: 'Hoy', texto: '"Today is Thursday / Hoy es jueves."' },
              { icono: '☀️', titulo: 'Clima', texto: 'Mirar por la ventana y elegir el clima juntos.' },
              { icono: '🔢', titulo: 'Conteo', texto: 'Contar del 1 al 10 en grupo.' },
            ],
            focoDeHoy: {
              tema: 'Con nuestro cuerpo sentimos el mundo — hoy contamos los 5 sentidos.',
              palabrasDelDia: ['EYES / OJOS', 'EARS / OREJAS'],
              muestra: 'Saca un objeto de la caja sensorial y pregunta con qué sentido lo notamos primero.',
              preguntas: ['What do your eyes see?', 'What do your ears hear?'],
              cancion: '"Head, Shoulders, Knees and Toes"',
            },
            cierre: 'Tenemos 5 sentidos para explorar el mundo — hoy en el juego dramático los vamos a usar.',
          },
          diferenciacion: {
            Infant: 'Explora el objeto sensorial con la maestra, tocándolo y mirándolo.',
            'Toddler Jr': 'Señala el ojo o la oreja cuando se le nombra.',
            'Toddler Sr': 'Señala el ojo o la oreja cuando se le nombra.',
            Preschool: 'Cuenta hasta 5 mientras nombra cada sentido.',
            'Pre-K': 'Asocia cada sentido con un ejemplo propio ("veo con mis ojos el libro").',
          },
        },
        {
          id: 'jue-principal',
          bloque: 'principal',
          hora: '9:50',
          titulo: 'Dramático: en el consultorio',
          objetivo: 'Practicar vocabulario del cuerpo a través del juego de roles.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Bata y estetoscopio de juguete', disponible: true }],
          preparacion: 'Colocar la bata, el estetoscopio de juguete y una camilla improvisada en el rincón dramático.',
          queHaceMaestra: 'Modela un breve diálogo doctor-paciente, nombrando partes del cuerpo mientras "revisa".',
          queHacenNinos: 'Juegan a ser doctor y paciente, revisando partes del cuerpo del "paciente".',
          preguntasGuia: ['Where does it hurt?', 'What can the doctor check?'],
          diferenciacion: {
            Infant: 'Observa el juego y sostiene el estetoscopio con apoyo.',
            'Toddler Jr': 'Imita "revisar" a un muñeco con el estetoscopio.',
            'Toddler Sr': 'Imita "revisar" a un muñeco con el estetoscopio.',
            Preschool: 'Juega el rol de doctor o paciente y nombra una parte del cuerpo.',
            'Pre-K': 'Sostiene un diálogo corto de 2-3 turnos en el rol.',
          },
          ninosFoco: [
            { ninoId: 'sofia', meta: 'Vocabulario de 2 palabras', observar: 'Nombra una parte del cuerpo durante el juego.', skillId: 'palabras', estadoFoco: 'pendiente' },
          ],
          queObservar: 'Quién sostiene el rol más allá de un turno y quién necesita que la maestra lo guíe.',
        },
        {
          id: 'jue-outdoor',
          bloque: 'outdoor',
          hora: '10:30',
          titulo: 'Carrera de obstáculos',
          objetivo: 'Coordinación gruesa y seguimiento de instrucciones con todo el cuerpo.',
          dominio: 'Motricidad gruesa',
          materiales: [{ nombre: 'Conos', disponible: true }],
          guiaOutdoor: {
            movimientoIntencional: {
              duracion: '5 min',
              invitacion: 'Vamos a usar todo nuestro cuerpo para pasar los obstáculos.',
              ideas: ['Saltar los conos', 'Pasar por el túnel', 'Caminar en equilibrio sobre la línea', 'Correr a la meta'],
            },
            juegoLibre: 'Después de la carrera, tiempo abierto de juego en el patio.',
            preguntaInformal: '"Which part of your body worked the hardest?"',
            quePriorizar: 'Seguimiento de instrucciones y coordinación — no convertirlo en competencia.',
          },
        },
      ],
    },
    {
      dia: 'Vie',
      fecha: '2026-09-18',
      temaDia: 'Repaso de la semana',
      focoDia: 'Repasamos cabeza, mano y pies antes de contar partes del cuerpo de un amigo en Centros.',
      actividades: [
        {
          id: 'vie-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — repaso de la semana',
          objetivo: 'Rutina breve del día + repasar en grupo todo el vocabulario de la semana.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Silueta de Lunes', disponible: true }],
          guiaCircle: {
            duracion: '10–15 min',
            rutinaDiaria: [
              { icono: '👋', titulo: 'Saludo', texto: 'Cantar la canción de buenos días configurada por la maestra.' },
              { icono: '📅', titulo: 'Hoy', texto: '"Today is Friday / Hoy es viernes."' },
              { icono: '☀️', titulo: 'Clima', texto: 'Mirar por la ventana y elegir el clima juntos.' },
              { icono: '🔢', titulo: 'Conteo', texto: 'Contar del 1 al 10 en grupo.' },
            ],
            focoDeHoy: {
              tema: 'Repasamos todo lo que aprendimos esta semana sobre nuestro cuerpo.',
              palabrasDelDia: ['HEAD / CABEZA', 'HAND / MANO', 'FEET / PIES'],
              muestra: 'Muestra la silueta del lunes y pregunta qué partes reconocen ahora que no reconocían antes.',
              preguntas: ['What did we learn this week?', 'Which word is your favorite?'],
              cancion: '"Head, Shoulders, Knees and Toes" — todos juntos, una última vez.',
            },
            cierre: 'Esta semana nuestro cuerpo nos enseñó mucho — hoy en Centros contamos partes del cuerpo de un amigo.',
          },
          diferenciacion: {
            Infant: 'Observa la silueta y las imágenes de la semana con apoyo.',
            'Toddler Jr': 'Señala 1 palabra de la semana cuando se nombra.',
            'Toddler Sr': 'Señala 1 palabra de la semana cuando se nombra.',
            Preschool: 'Nombra 2-3 palabras de la semana sin ayuda.',
            'Pre-K': 'Cuenta qué fue lo que más le gustó aprender, con una frase.',
          },
        },
        {
          id: 'vie-centros',
          bloque: 'centros',
          hora: '9:50',
          titulo: 'Centro de matemáticas: contar partes del cuerpo',
          objetivo: 'Practicar conteo 6–8 con un contexto significativo, contando entre compañeros.',
          dominio: 'Matemáticas tempranas',
          // Sesión 6 paso 5 — el skill real que se trabaja aquí (no solo el dominio) es contar
          // 1 a 1: caso de prueba para que Luca aparezca agregado automáticamente junto a Zayne
          // (que ya estaba escrito a mano), sin duplicar ni tocar la entrada de Zayne.
          skillsRelacionados: ['correspondencia-uno-a-uno'],
          materiales: [{ nombre: 'Fichas de conteo', disponible: true }],
          guiaCentros: [
            {
              nombre: 'Matemáticas',
              material: 'Fichas de conteo',
              provocacion: 'Contar partes del cuerpo de un compañero (ojos, orejas, manos, dedos).',
              intencion: 'Conteo con un contexto significativo, no abstracto.',
              pregunta: 'How many eyes does your friend have?',
            },
          ],
          ninosFoco: [
            { ninoId: 'zayne', meta: 'Números 6–8', observar: 'Cuenta dedos y ojos de sus compañeros sin ayuda.', skillId: 'numeros-6-8', estadoFoco: 'pendiente', origenCalculo: 'maestra_manual' },
          ],
        },
        {
          id: 'vie-cierre',
          bloque: 'cierre',
          hora: '15:00',
          titulo: 'Cierre: mi parte favorita',
          objetivo: 'Reflexionar verbalmente sobre lo aprendido en la semana, sin volverlo académico.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Ninguno', disponible: true }],
          guiaCierre: {
            recuerda: 'Esta semana aprendimos las partes de nuestro cuerpo: cabeza, manos, pies, cara.',
            pregunta: '"What was your favorite part of your body to learn about?"',
            vocabulario: 'Repetimos juntos: head, hand, feet.',
            cancionOMovimiento: '"Head, Shoulders, Knees and Toes" — despacio, una última vez.',
            puenteManana: 'La próxima semana vamos a descubrir lo que sentimos con nuestros 5 sentidos.',
          },
        },
      ],
    },
  ],
};

export function actividadPorId(id: string, plan: PlaneacionSemanal = PLANEACION_SEMANA_3): { actividad: Actividad; dia: DiaPlan; plan: PlaneacionSemanal } | undefined {
  for (const dia of plan.dias) {
    const actividad = dia.actividades.find((a) => a.id === id);
    if (actividad) return { actividad, dia, plan };
  }
  return undefined;
}

/** La actividad "actual" de hoy — para el mockup fijo, mediodía-mañana del martes (fecha
 * de referencia de esta demo: 2026-09-15). En producción esto se calcula con la hora real. */
export function actividadActualHoy(plan: PlaneacionSemanal = PLANEACION_SEMANA_3): { actividad: Actividad; dia: DiaPlan; plan: PlaneacionSemanal } | undefined {
  return actividadPorId('mar-principal', plan);
}

export function diaPorFecha(fecha: string, plan: PlaneacionSemanal = PLANEACION_SEMANA_3): DiaPlan | undefined {
  return plan.dias.find((d) => d.fecha === fecha);
}

/* ── PERSONALIZACIÓN DE PLANEACIÓN (Sesión 6 paso 5) — CONECTA la planeación ya aprobada con el
   perfil real del niño (Módulo Niños). No reemplaza nada de lo anterior: Capa A (diferenciación
   por etapa) sigue igual y siempre visible; esto solo calcula candidatos para Capas B/C cuando la
   maestra prende `personalizacionActiva` en ESA semana. Reglas del usuario (Sesión 6 paso 5):
   contexto real (no dominio) para adaptaciones, skill real de la actividad (no dominio) para
   niño foco, tope ~2 focos automáticos por actividad, asistencia PROGRAMADA como filtro, y el
   resultado se GUARDA — nunca se recalcula solo al abrir la pantalla. */

/** Capa B calculada: un apoyo activo del niño es relevante si comparte al menos un contexto real
 * con la actividad (regla del usuario: nunca "categoría de necesidad == dominio"). */
function apoyosRelevantesParaActividad(nino: Nino, actividad: Actividad): ApoyoNino[] {
  if (!actividad.contextos || actividad.contextos.length === 0) return [];
  return nino.apoyos.filter((a) => a.activa && a.contextosRelevantes?.some((c) => actividad.contextos!.includes(c)));
}

type CandidatoFoco = { prioridad: 1 | 2 | 3; skillId: string; individualGoalId?: string; meta: string; observar: string };

/** Capa C calculada: solo cuando el skill pertenece a `actividad.skillsRelacionados` (regla del
 * usuario: nunca solo por dominio). Prioridad 1 = meta activa de Plan Individual sobre ese skill;
 * prioridad 2 = skill en desarrollo; prioridad 3 = sin evidencia suficiente todavía (oportunidad
 * real de observar en ESTA experiencia). */
function candidatoFocoParaActividad(nino: Nino, actividad: Actividad): CandidatoFoco | null {
  if (!actividad.skillsRelacionados || actividad.skillsRelacionados.length === 0) return null;
  // Solo metas ACTIVAS del plan ACTIVO (6d): Cumplida y Cerrada nunca vuelven a personalizar.
  const metaPlan = metasActivasDeNino(nino).find((m) => m.skillId && actividad.skillsRelacionados!.includes(m.skillId));
  if (metaPlan) {
    return { prioridad: 1, skillId: metaPlan.skillId!, individualGoalId: metaPlan.id, meta: metaPlan.descripcion, observar: metaPlan.siguientePaso ?? metaPlan.descripcion };
  }
  const edadMeses = edadEnMeses(nino.fechaNacimiento);
  // Un skill con meta Cumplida/Cerrada tampoco se sugiere solo por seguir "en desarrollo" (6d).
  const skillsTerminados = skillsConMetaTerminada(nino);
  for (const skillId of actividad.skillsRelacionados) {
    if (skillsTerminados.has(skillId)) continue;
    const catalogo = SKILLS_CATALOG.find((s) => s.id === skillId);
    // Nunca sugerir un skill fuera del rango de edad del catálogo (ej. "tijeras" 36-60m no aplica
    // a un bebé de 11 meses) — sin esto, "sin dato todavía" se confundía con "no le corresponde
    // observarlo aquí". Skill sin entrada en el catálogo: no se filtra por edad (no hay con qué).
    if (catalogo && (edadMeses < catalogo.rangoEdadMesesMin || edadMeses > catalogo.rangoEdadMesesMax)) continue;
    const skill = nino.skills.find((s) => s.id === skillId);
    const nombreSkill = catalogo?.nombre ?? skillId;
    if (skill?.estadoDesarrollo === 'en_desarrollo') {
      return { prioridad: 2, skillId, meta: nombreSkill, observar: `Oportunidad de avanzar "${nombreSkill}" en esta experiencia.` };
    }
    if (!skill || skill.estadoEvidencia === 'no_observado' || skill.estadoEvidencia === 'insuficiente') {
      return { prioridad: 3, skillId, meta: nombreSkill, observar: `Todavía falta evidencia de "${nombreSkill}" — esta experiencia es una oportunidad para observarlo.` };
    }
  }
  return null;
}

/** Corre UNA vez (al prender personalización o al pulsar "Actualizar personalización") y devuelve
 * una COPIA de la semana con Capas B/C fusionadas: lo escrito a mano (`maestra_manual` o sin
 * marcar) se conserva intacto; lo calculado se agrega con `origenCalculo: 'raiz_sugerido'` solo
 * para niños que no estuvieran ya cubiertos en esa actividad, filtrando por asistencia programada
 * y respetando el tope de ~2 focos automáticos por actividad. Nunca se llama en cada render —
 * quien la llama decide cuándo "vale" el cálculo (regla del usuario: sugerencia, no cambio eterno
 * en vivo). */
export function calcularPersonalizacionSemana(plan: PlaneacionSemanal, ninos: Nino[]): PlaneacionSemanal {
  const dias = plan.dias.map((dia) => {
    const ninosDeHoy = ninos.filter((n) => n.diasAsistencia.includes(dia.dia));
    const actividades = dia.actividades.map((actividad) => {
      const adaptacionesExistentes = actividad.adaptacionesIndividuales ?? [];
      const focosExistentes = actividad.ninosFoco ?? [];
      const idsYaAdaptados = new Set(adaptacionesExistentes.map((a) => a.ninoId));
      const idsYaFoco = new Set(focosExistentes.map((f) => f.ninoId));

      const adaptacionesNuevas: AdaptacionIndividual[] = [];
      for (const nino of ninosDeHoy) {
        if (idsYaAdaptados.has(nino.id)) continue;
        const apoyos = apoyosRelevantesParaActividad(nino, actividad);
        if (apoyos.length === 0) continue;
        const apoyo = apoyos[0];
        const necesidad = nino.necesidades.find((nn) => nn.id === apoyo.necesidadId);
        adaptacionesNuevas.push({
          ninoId: nino.id,
          necesidad: necesidad?.descripcion ?? 'Necesidad registrada en su perfil',
          ajuste: apoyo.estrategia,
          origen: 'necesidad_registrada',
          alcance: 'general_del_nino',
          childNeedId: necesidad?.id,
          childSupportId: apoyo.id,
          origenCalculo: 'raiz_sugerido',
        });
      }

      const candidatosFoco: (CandidatoFoco & { ninoId: string })[] = [];
      for (const nino of ninosDeHoy) {
        if (idsYaFoco.has(nino.id)) continue;
        const candidato = candidatoFocoParaActividad(nino, actividad);
        if (candidato) candidatosFoco.push({ ninoId: nino.id, ...candidato });
      }
      candidatosFoco.sort((a, b) => a.prioridad - b.prioridad);
      const TOPE_FOCOS_AUTOMATICOS = 2;
      const focosNuevos: NinoFocoActividad[] = candidatosFoco.slice(0, TOPE_FOCOS_AUTOMATICOS).map((c) => ({
        ninoId: c.ninoId,
        meta: c.meta,
        observar: c.observar,
        skillId: c.skillId,
        individualGoalId: c.individualGoalId,
        estadoFoco: 'pendiente',
        origenCalculo: 'raiz_sugerido',
      }));

      if (adaptacionesNuevas.length === 0 && focosNuevos.length === 0) return actividad;
      return {
        ...actividad,
        adaptacionesIndividuales: [...adaptacionesExistentes, ...adaptacionesNuevas],
        ninosFoco: [...focosExistentes, ...focosNuevos],
      };
    });
    return { ...dia, actividades };
  });
  return { ...plan, dias, personalizacionActiva: true, personalizacionActualizadaEn: FECHA_HOY };
}

const PLANEACION_STORAGE_KEY = 'raiz_planeaciones';

/** Roster de semanas — hoy solo existe la Semana 3, pero se guarda como lista para no rehacer
 * esto cuando haya más. Mismo patrón de `leerNinos()`/`leerProgramaConfig()`: localStorage con
 * semilla de respaldo, nunca lanza en SSR/modo privado. */
export function leerPlaneaciones(): PlaneacionSemanal[] {
  if (typeof window === 'undefined') return [PLANEACION_SEMANA_3];
  try {
    const guardado = window.localStorage.getItem(PLANEACION_STORAGE_KEY);
    if (!guardado) return [PLANEACION_SEMANA_3];
    const parseado = JSON.parse(guardado) as PlaneacionSemanal[];
    return Array.isArray(parseado) && parseado.length > 0 ? parseado : [PLANEACION_SEMANA_3];
  } catch {
    return [PLANEACION_SEMANA_3];
  }
}

export function guardarPlaneaciones(planes: PlaneacionSemanal[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PLANEACION_STORAGE_KEY, JSON.stringify(planes));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

export function planeacionPorNumero(numero: number, planes: PlaneacionSemanal[] = leerPlaneaciones()): PlaneacionSemanal {
  return planes.find((p) => p.numero === numero) ?? PLANEACION_SEMANA_3;
}

export function guardarUnaPlaneacion(planActualizado: PlaneacionSemanal): void {
  const planes = leerPlaneaciones();
  const actualizados = planes.some((p) => p.numero === planActualizado.numero)
    ? planes.map((p) => (p.numero === planActualizado.numero ? planActualizado : p))
    : [...planes, planActualizado];
  guardarPlaneaciones(actualizados);
}

/** Fecha de referencia de esta demo — en producción se calcula con la fecha real. */
export const FECHA_HOY = '2026-09-15';

/* ── ASISTENCIA — dos conceptos separados (regla del usuario, Sesión 5 ronda 3): la asistencia
   PROGRAMADA se deriva del horario del niño (`Nino.diasAsistencia`, arriba) y nunca se guarda
   como presencia; la presencia REAL del día vive aquí, en `ASISTENCIA_HOY`, con un estado que
   nunca incluye "programado" como valor. En el esquema real, `asistencia_diaria` tiene
   restricción única (ninoId, fecha) — un solo registro de presencia por niño por día. ── */
export type EstadoAsistencia = 'sin_marcar' | 'presente' | 'ausente';

export interface AsistenciaDia {
  ninoId: string;
  fecha: string;
  estado: EstadoAsistencia;
}

/** Presencia real del día de referencia — Luca y Zayne ya marcados presentes, Sofía marcada
 * ausente (aunque su horario la programaba para hoy — así se ve la diferencia entre programado
 * y real), Mateo todavía sin marcar. */
export const ASISTENCIA_HOY: AsistenciaDia[] = [
  { ninoId: 'luca', fecha: FECHA_HOY, estado: 'presente' },
  { ninoId: 'zayne', fecha: FECHA_HOY, estado: 'presente' },
  { ninoId: 'sofia', fecha: FECHA_HOY, estado: 'ausente' },
  { ninoId: 'mateo', fecha: FECHA_HOY, estado: 'sin_marcar' },
];

/** Si el horario del niño lo programaba para el día de esta fecha — NUNCA se guarda como un
 * valor de `estado`, se deriva comparando `diasAsistencia` contra el día de la semana. */
export function estaProgramadoEnFecha(ninoId: string, fecha: string): boolean {
  const nino = ninoPorId(ninoId);
  const dia = diaPorFecha(fecha);
  return !!(nino && dia && nino.diasAsistencia.includes(dia.dia));
}

/** Presencia real registrada para un niño en una fecha — 'sin_marcar' si todavía no se marca. */
export function estadoAsistencia(ninoId: string, fecha: string): EstadoAsistencia {
  return ASISTENCIA_HOY.find((a) => a.ninoId === ninoId && a.fecha === fecha)?.estado ?? 'sin_marcar';
}

/** La actividad más representativa de un día, para la Vista rápida de la semana (NUNCA "la
 * planeación completa" — regla del usuario: la vista rápida es un resumen, no reemplaza los
 * bloques diarios). Prioriza la actividad principal; si el día no tiene, cae al primer bloque. */
export function actividadDestacada(dia: DiaPlan): Actividad {
  return dia.actividades.find((a) => a.bloque === 'principal') ?? dia.actividades[0];
}

/** Texto corto de foco para la Vista rápida: el primer niño foco de la actividad destacada, o
 * el dominio de esa actividad si nadie tiene foco ese día. */
export function focoTextoDestacado(actividad: Actividad): string {
  const primerFoco = actividad.ninosFoco?.[0];
  if (primerFoco) {
    const nino = ninoPorId(primerFoco.ninoId);
    return `Foco: ${nino?.nombre ?? ''} — ${primerFoco.meta}`;
  }
  return `Foco: ${actividad.dominio}`;
}

/* ── OBSERVACIONES — 3ra función núcleo del MVP. Regla dura del usuario (Sesión 5, ronda 4):
   "la maestra puede observar sin saber cómo clasificar lo que vio. RAÍZ ayuda a organizarlo
   después." Dos caminos, un mismo historial, nunca 1 observación = 1 skill obligatorio:
     (a) DIRIGIDA — nace de tocar una habilidad ya sugerida (o una micro-observación de opciones
         rápidas, ej. Tijeras) — el skill queda aceptado de una vez, sin paso de sugerencia
         (origen='observacion_dirigida', estado='aceptado'). EXCEPCIÓN (Sesión 6 paso 6, regla del
         usuario): si la opción elegida NO representa evidencia real (ej. "No observado"), no se
         crea ninguna fila de `ObservacionSkill` — la observación igual se guarda (la oportunidad
         quedó registrada), pero nada cuenta como evidencia del skill.
     (b) ESPONTÁNEA — la maestra escribe/dicta libremente SIN elegir ningún skill antes. RAÍZ
         analiza la nota y SUGIERE posibles skills; la maestra acepta/rechaza/agrega, o guarda
         sin clasificar. Una observación válida puede tener 0, 1 o varios skills relacionados.
         Regla del usuario (Sesión 6 paso 6): una sugerencia que la maestra NO tocó se guarda tal
         cual — `estado: 'sugerido'` — el análisis simulado/IA NUNCA se auto-acepta.
   Regla dura en las DOS: guardar una observación jamás toca `Nino.skills` — eso sigue
   requiriendo una acción explícita y separada de la maestra (mismas reglas que evaluaciones). ── */
export type OrigenObservacion = 'dirigida' | 'espontanea';
export type FuenteObservacion = 'texto' | 'voz' | 'seleccion_rapida';

/** Autoría — reservado desde ahora aunque hoy solo exista una maestra por programa (regla del
 * usuario, Sesión 6 paso 6: "quiero que la arquitectura permita saber quién registró cada
 * observación" antes de que exista auth real con varias educadoras). */
export const STAFF_ACTUAL_ID = 'staff-principal';

export interface Observacion {
  id: string;
  ninoId: string;
  /** Opcional — una observación espontánea puede surgir fuera de cualquier actividad programada. */
  actividadId?: string;
  fecha: string;
  origen: OrigenObservacion;
  fuente: FuenteObservacion;
  /** Exactamente lo que escribió/dictó/eligió la maestra — NUNCA se sobrescribe. */
  notaOriginal: string;
  /** Versión objetiva/profesional que RAÍZ propondría — campo aparte, reservado: el análisis
   * real de IA se conecta en la fase de servicios externos (`30-INTEGRACION-IA.md`), no aquí. */
  redaccionProfesional?: string;
  /** Si nació de tocar un skill puntual (observación dirigida). */
  triggeredBySkillId?: string;
  /** Quién la registró — ver `STAFF_ACTUAL_ID`. */
  autorId: string;
  /** Una observación puede tener VARIAS evidencias (Sesión 6 paso 7 / 6c, mini-migración pedida
   * por el usuario). La entidad es EVIDENCIA en general, no "foto" — hoy solo `foto` es real. */
  evidencias?: Evidencia[];
  /** Idioma en que está escrita `redaccionProfesional` (código, ej. 'es') — para saber después
   * si un documento en otro idioma necesitaría traducción real (llega con IA). */
  idiomaRedaccion?: string;
  /** Palabras REALMENTE dichas por el niño y documentadas — nunca reconstruidas por RAÍZ. Si más
   * adelante RAÍZ detecta una posible cita, la maestra debe confirmarla antes de usarla en el
   * Álbum (regla del usuario). Reservado, sin interfaz todavía. */
  citasDelNino?: string[];
  /** "No observado" (micro-observación sin evidencia): hubo una OPORTUNIDAD de observar, no una
   * observación. Nunca cuenta como evidencia, nunca entra como observación profesional al Registro/
   * Informe, nunca se interpreta como dificultad, y NO es lo mismo que "pendiente de redacción"
   * (regla del usuario, Sesión 6 paso 7). */
  oportunidadSinEvidencia?: boolean;
}

/** Reservado para cuando existan más formas de evidencia — hoy solo `foto` tiene UI real. */
export type TipoEvidencia = 'foto' | 'trabajo_nino' | 'audio' | 'video' | 'documento';

/** Solo metadata (nombre del archivo) — nunca la URL temporal del navegador (se pierde igual al
 * recargar) ni se simula almacenamiento real todavía (regla del usuario, mismo patrón que
 * evaluaciones externas: "no fingir almacenamiento real"). `compartibleConFamilia` arranca en
 * `false`: nada sale a un reporte para familia sin que la maestra lo marque. */
export interface Evidencia {
  id: string;
  tipo: TipoEvidencia;
  nombreArchivo: string;
  compartibleConFamilia: boolean;
}

/** Los tres estados conceptuales distintos de un registro (regla del usuario, Sesión 6 paso 7):
 * A. observación profesional aprobada → alimenta Registro/Informe/evaluaciones/reportes;
 * B. nota sin redacción profesional aprobada → "pendiente de redacción" (nunca entra la nota cruda);
 * C. oportunidad "No observado" → sin evidencia, no es una observación pendiente. */
export type EstadoRegistroObservacion = 'profesional_aprobada' | 'pendiente_redaccion' | 'oportunidad_sin_evidencia';

export function estadoRegistroObservacion(o: Observacion): EstadoRegistroObservacion {
  if (o.oportunidadSinEvidencia) return 'oportunidad_sin_evidencia';
  return o.redaccionProfesional && o.redaccionProfesional.trim() ? 'profesional_aprobada' : 'pendiente_redaccion';
}

/** Distingue sin ambigüedad "RAÍZ lo sugirió y aún no se revisó" de "RAÍZ lo sugirió y se
 * rechazó" (corrección del usuario, Sesión 5 ronda 4) — nunca dos booleanos independientes. */
export type OrigenRelacionSkill = 'raiz' | 'maestra' | 'observacion_dirigida';
export type EstadoRelacionSkill = 'sugerido' | 'aceptado' | 'rechazado';

/** Relación entre UNA observación y UN skill — una observación puede tener cero, una o varias
 * filas de estas. El fragmento de evidencia vive aquí (por relación), no en la nota completa. */
export interface ObservacionSkill {
  observacionId: string;
  skillId: string;
  nombreSkill: string;
  origen: OrigenRelacionSkill;
  estado: EstadoRelacionSkill;
  evidenciaTextual?: string;
}

/** Una opción de micro-observación — `esEvidencia: false` (ej. "No observado") registra que hubo
 * una OPORTUNIDAD de observar, pero NUNCA cuenta como evidencia del skill (regla del usuario,
 * Sesión 6 paso 6: "no observado" no es evidencia de que el niño puede o no puede hacerlo). */
export interface OpcionRapida {
  id: string;
  texto: string;
  esEvidencia: boolean;
  /** Predicado objetivo para la redacción automática ("siguió una línea recta…"); si falta se
   * usa "realizó <texto>". */
  frase?: string;
}

/** Micro-observación de opciones rápidas (observación DIRIGIDA, fuente `seleccion_rapida`) — hoy
 * solo Tijeras tiene un set definido; el resto de habilidades cae a nota libre en ese mismo paso. */
export const OPCIONES_RAPIDAS_POR_SKILL: Record<string, OpcionRapida[]> = {
  tijeras: [
    { id: 'pequenos-recortes', texto: 'Pequeños recortes', esEvidencia: true, frase: 'realizó pequeños recortes' },
    { id: 'cortes-consecutivos', texto: 'Cortes consecutivos sin ayuda', esEvidencia: true, frase: 'realizó cortes consecutivos sin ayuda' },
    { id: 'linea-con-ayuda', texto: 'Línea recta con ayuda', esEvidencia: true, frase: 'siguió una línea recta con ayuda' },
    { id: 'linea-independiente', texto: 'Línea recta independiente', esEvidencia: true, frase: 'siguió una línea recta de forma independiente' },
    { id: 'no-observado', texto: 'No observado', esEvidencia: false },
  ],
};

interface PistaSkillDemo {
  skillId: string;
  nombre: string;
  palabrasClave: string[];
}

/** Catálogo de palabras clave para la SIMULACIÓN LOCAL del análisis de RAÍZ sobre observaciones
 * espontáneas — NO es IA real (eso llega con el servicio de IA en la fase de servicios externos).
 * Sirve solo para demostrar la experiencia con reglas simples y controladas: una nota que no
 * calce con ninguna palabra clave cae directo en "sin sugerencias", con la opción de guardar sin
 * clasificar. Incluye dominios que un niño puntual puede no tener todavía en su catálogo de
 * skills — RAÍZ puede proponer EMPEZAR a seguir un área nueva, no solo las ya trackeadas. */
const CATALOGO_SUGERENCIAS_DEMO: PistaSkillDemo[] = [
  { skillId: 'pinza', nombre: 'Agarre de pinza', palabrasClave: ['pinza', 'índice y pulgar', 'índice', 'pulgar'] },
  { skillId: 'tijeras', nombre: 'Tijeras', palabrasClave: ['tijera', 'recort'] },
  { skillId: 'numeros-6-8', nombre: 'Conteo 6–8', palabrasClave: ['contó', 'contando', 'número', 'conteo'] },
  { skillId: 'palabras', nombre: 'Vocabulario de 2 palabras', palabrasClave: ['palabra', 'dijo', 'nombró', 'vocabulario'] },
  { skillId: 'resolucion-problemas', nombre: 'Resolución de problemas', palabrasClave: ['resolv', 'solución', 'construyó', 'torre'] },
  { skillId: 'colores', nombre: 'Reconoce colores', palabrasClave: ['color', 'amarillo', 'azul', 'rojo', 'verde', 'morado', 'rosa', 'marrón', 'negro', 'blanco', 'gris', 'naranja'] },
  { skillId: 'interaccion-social', nombre: 'Interacción con pares', palabrasClave: ['compañer', 'amigo', 'junto a', 'otro niño'] },
  { skillId: 'regulacion-emocional', nombre: 'Regulación emocional', palabrasClave: ['gritó', 'lloró', 'molestó', 'enojó', 'frustr'] },
  { skillId: 'comunicacion-necesidades', nombre: 'Comunicación de necesidades', palabrasClave: ['pidió', 'quería', 'señaló que'] },
];

/** Simulación local (reglas simples por palabra clave) de lo que el análisis real de RAÍZ haría
 * sobre una nota espontánea — NUNCA IA real todavía (ver comentario de `CATALOGO_SUGERENCIAS_DEMO`
 * arriba). Devuelve como máximo una sugerencia por dominio, con el fragmento de la nota que la
 * disparó como evidencia. */
export function analizarNotaSimulado(nota: string): { skillId: string; nombre: string; evidenciaTextual: string }[] {
  const oraciones = nota.split(/(?<=[.!?])\s+/).filter(Boolean);
  const notaMin = nota.toLowerCase();
  const encontradas: { skillId: string; nombre: string; evidenciaTextual: string }[] = [];
  for (const pista of CATALOGO_SUGERENCIAS_DEMO) {
    const clave = pista.palabrasClave.find((p) => notaMin.includes(p));
    if (!clave) continue;
    const oracion = oraciones.find((o) => o.toLowerCase().includes(clave)) ?? nota;
    encontradas.push({ skillId: pista.skillId, nombre: pista.nombre, evidenciaTextual: oracion.trim() });
  }
  return encontradas;
}

/* ── REDACCIÓN PROFESIONAL SIMULADA (Sesión 6, paso 6b) — "RAÍZ organizó tu observación": la
   maestra puede escribir como habla; RAÍZ propone una versión objetiva, la maestra la revisa
   antes de guardar. NUNCA IA real todavía — reglas controladas y explícitas, igual que
   `analizarNotaSimulado`. `notaOriginal` JAMÁS se toca; esto solo genera lo que se OFRECE como
   `redaccionProfesional`, y la maestra decide si lo usa, lo edita, o no lo usa todavía (regla del
   usuario: "mantener mi nota" no convierte la nota subjetiva en redacción profesional — la deja
   pendiente). Regla de oro: describe hechos observables (qué hizo/dijo/se vio-escuchó), nunca
   sentimientos o intenciones inferidas; nunca inventa un hecho que la maestra no describió. */

/** Etiquetas de juicio — se ELIMINAN por completo de la redacción, nunca se reformulan en otra
 * frase ("mostró comportamiento grosero" sigue siendo un juicio, no un hecho). */
const ETIQUETAS_SUBJETIVAS_DEMO = [
  'grosero', 'grosera', 'malcriado', 'malcriada', 'terco', 'terca',
  'agresivo', 'agresiva', 'llorón', 'llorona', 'perezoso', 'perezosa', 'malo', 'mala',
];

/** Generalizaciones sin un hecho puntual documentado ("grita mucho", "siempre se pelea") — se
 * excluyen igual que las etiquetas: no hay un momento concreto que describir, y repetirlas como
 * si fueran un hecho de HOY sería tan impreciso como la etiqueta misma (regla del usuario: "no se
 * transforma en algo más específico que lo realmente dicho" — la respuesta correcta es omitir, no
 * inventar el momento exacto). */
const GENERALIZACIONES_SIN_INSTANCIA_DEMO: RegExp[] = [
  /\bgrita\s+mucho\b/i, /\bllora\s+mucho\b/i, /\bpega\s+mucho\b/i, /\bmuerde\s+mucho\b/i,
  /\bsiempre\s+(se\s+)?\w+/i, /\btodo\s+el\s+tiempo\b/i, /\bnunca\s+\w+/i,
];

/** Frases de conflicto AMBIGUAS — no describen qué pasó, así que nunca se convierten en "empujó"/
 * "mordió"/etc. por sí solas. Se excluyen de la redacción por defecto; la pantalla puede ofrecer
 * (sin obligar) una aclaración de opción múltiple — si la maestra la responde, ESE hecho concreto
 * sí se incluye. Nunca se inventa la respuesta. */
interface FraseAmbiguaDemo {
  patron: RegExp;
  pregunta: string;
  opciones: string[];
}
const FRASES_AMBIGUAS_DEMO: FraseAmbiguaDemo[] = [
  {
    patron: /se\s+pele[oó]|se\s+pelearon|hubo\s+un\s+conflicto|tuvieron\s+un\s+problema/i,
    pregunta: '¿Qué observaste exactamente durante el conflicto?',
    opciones: ['Gritó', 'Empujó', 'Mordió', 'Quitó un objeto', 'Lloró'],
  },
];

const FRASE_POR_OPCION_ACLARACION: Record<string, string> = {
  Gritó: 'gritó durante una interacción con un compañero',
  Empujó: 'empujó a un compañero',
  Mordió: 'mordió a un compañero',
  'Quitó un objeto': 'quitó un objeto a un compañero',
  Lloró: 'lloró durante una interacción con un compañero',
};

const NUMEROS_TEXTO_DEMO: Record<string, string> = { '1': 'un', '2': 'dos', '3': 'tres', '4': 'cuatro', '5': 'cinco', '6': 'seis', '7': 'siete', '8': 'ocho', '9': 'nueve', '10': 'diez' };
function numeroATexto(valor: string): string {
  return NUMEROS_TEXTO_DEMO[valor.trim()] ?? valor.trim();
}

/** Reemplaza cualquier OTRO nombre del roster (nunca el niño observado) por "un compañero" — la
 * regla se define aquí, no acoplada a `/observar`, para poder reutilizarse después en reportes/
 * evaluaciones narrativas/My Learning Journey (regla del usuario, Sesión 6 paso 6b). Como hoy no
 * guardamos género estructurado, usa siempre la forma neutra "un compañero" — no inventa género.
 * `notaOriginal` nunca pasa por aquí; esto solo transforma lo que se OFRECE como redacción. */
export function anonimizarNombresDeOtros(texto: string, ninoObservadoId: string, ninos: Nino[]): string {
  let resultado = texto;
  for (const n of ninos) {
    if (n.id === ninoObservadoId) continue;
    const patronNombre = new RegExp(`\\b${n.nombre}\\b`, 'gi');
    resultado = resultado.replace(patronNombre, 'un compañero');
  }
  return resultado;
}

interface HechoDetectado {
  indice: number;
  texto: string;
}

/** Reglas de hecho observable — controladas y explícitas (ninguna IA real). Cada regla busca un
 * patrón concreto y produce SOLO la frase correspondiente a lo que la maestra escribió; lo que no
 * calza con ninguna regla y no es etiqueta/generalización/ambigüedad simplemente no entra a la
 * redacción (nunca se inventa para "completar" — la nota original queda igual de completa). */
function detectarHechos(textoAnonimizado: string): HechoDetectado[] {
  const hechos: HechoDetectado[] = [];
  const reglas: { patron: RegExp; frase: (m: RegExpMatchArray) => string }[] = [
    { patron: /jug[oó]\s+con\s+bloques/i, frase: () => 'jugó con bloques' },
    { patron: /se\s+(?:lo|los|la|las)\s+meti[oó]\s+a\s+la\s+boca/i, frase: () => 'se llevó los bloques a la boca' },
    { patron: /(?:hizo\s+una\s+pila\s+(?:de|con)\s+(\d+)\s+bloques|apil[oó]\s+(\d+)\s+bloques)/i, frase: (m) => `apiló ${numeroATexto(m[1] || m[2])} bloques` },
    { patron: /cont[oó]\s+([\d]+(?:[,\s]+[\d]+)*)/i, frase: (m) => `contó "${m[1].trim().replace(/[,\s]+/g, ', ')}" mientras los colocaba` },
    { patron: /dijo\s+(amarillo|azul|rojo|verde|morado|rosa|marrón|negro|blanco|gris|naranja)/i, frase: (m) => `nombró el color ${m[1].toLowerCase()}` },
    { patron: /se\s+fue\s+a\s+jugar\s+con\s+(un\s+compañero|una\s+compañera|[a-záéíóúñ]+)/i, frase: (m) => `se fue a jugar con ${m[1].toLowerCase()}` },
  ];
  for (const regla of reglas) {
    const match = textoAnonimizado.match(regla.patron);
    if (match && match.index !== undefined) {
      hechos.push({ indice: match.index, texto: regla.frase(match) });
    }
  }
  return hechos.sort((a, b) => a.indice - b.indice);
}

export interface RedaccionSugerida {
  texto: string;
  /** Partes de la nota que NO entraron a la redacción, con el motivo — transparencia (regla del
   * usuario: nunca ocultar por qué algo no aparece como hecho profesional). */
  excluidas: { fragmento: string; motivo: string }[];
  /** Si hay algo ambiguo que la maestra PUEDE aclarar (nunca obligatorio) — ver `FRASES_AMBIGUAS_DEMO`. */
  aclaracionDisponible?: { fragmento: string; pregunta: string; opciones: string[] };
}

/** Genera la redacción profesional SUGERIDA (nunca definitiva hasta que la maestra la confirme).
 * `respuestaAclaracion` es la opción que la maestra ya eligió, si la pidió — permite regenerar
 * incluyendo ese hecho concreto sin re-preguntar. */
export function generarRedaccionProfesionalSimulada(
  notaOriginal: string,
  ninoObservadoId: string,
  ninos: Nino[],
  respuestaAclaracion?: string
): RedaccionSugerida {
  const nino = ninos.find((n) => n.id === ninoObservadoId);
  const nombreNino = nino?.nombre ?? 'El niño';
  const anonimizado = anonimizarNombresDeOtros(notaOriginal, ninoObservadoId, ninos);

  const excluidas: RedaccionSugerida['excluidas'] = [];
  for (const etiqueta of ETIQUETAS_SUBJETIVAS_DEMO) {
    if (new RegExp(`\\b${etiqueta}\\b`, 'i').test(anonimizado)) {
      excluidas.push({ fragmento: etiqueta, motivo: 'juicio, no hecho observable' });
    }
  }
  for (const patron of GENERALIZACIONES_SIN_INSTANCIA_DEMO) {
    const m = anonimizado.match(patron);
    if (m) excluidas.push({ fragmento: m[0], motivo: 'generalización sin un momento concreto' });
  }

  let aclaracionDisponible: RedaccionSugerida['aclaracionDisponible'];
  const hechos = detectarHechos(anonimizado);
  for (const fa of FRASES_AMBIGUAS_DEMO) {
    const m = anonimizado.match(fa.patron);
    if (!m || m.index === undefined) continue;
    if (respuestaAclaracion && FRASE_POR_OPCION_ACLARACION[respuestaAclaracion]) {
      hechos.push({ indice: m.index, texto: FRASE_POR_OPCION_ACLARACION[respuestaAclaracion] });
    } else {
      excluidas.push({ fragmento: m[0], motivo: 'no describe qué ocurrió exactamente' });
      aclaracionDisponible = { fragmento: m[0], pregunta: fa.pregunta, opciones: fa.opciones };
    }
  }
  hechos.sort((a, b) => a.indice - b.indice);

  if (hechos.length === 0) {
    return { texto: '', excluidas, aclaracionDisponible };
  }
  return { texto: unirHechosEnParrafo(hechos, nombreNino), excluidas, aclaracionDisponible };
}

/** Agrupa los hechos en oraciones de hasta 3 (con "y" antes del último de cada grupo) en vez de
 * una sola oración larga con comas — más legible y más cercano a cómo se redacta un reporte real. */
function unirHechosEnParrafo(hechos: HechoDetectado[], nombreNino: string): string {
  const TAMANO_GRUPO = 3;
  const oraciones: string[] = [];
  for (let i = 0; i < hechos.length; i += TAMANO_GRUPO) {
    const grupo = hechos.slice(i, i + TAMANO_GRUPO).map((h) => h.texto);
    if (grupo.length === 1) {
      oraciones.push(grupo[0]);
    } else {
      const ultimo = grupo[grupo.length - 1];
      const resto = grupo.slice(0, -1).join(', ');
      oraciones.push(`${resto} y ${ultimo}`);
    }
  }
  const primera = `${nombreNino} ${oraciones[0]}.`;
  const siguientes = oraciones.slice(1).map((o) => `${o.charAt(0).toUpperCase()}${o.slice(1)}.`);
  return [primera, ...siguientes].join(' ');
}

/** Camino dirigido de opciones rápidas (Sesión 6 paso 6b, regla del usuario: "no hace falta
 * obligar a pasar por un proceso largo de reformulación" cuando la opción YA es objetiva) — RAÍZ
 * genera una redacción simple de una frase, sin paso de confirmación aparte. */
export function generarRedaccionMicroObservacion(nombreNino: string, nombreSkill: string, opcion: OpcionRapida): string {
  const predicado = opcion.frase ?? `realizó ${opcion.texto.toLowerCase()}`;
  return `${nombreNino} ${predicado} durante la actividad relacionada con ${nombreSkill.toLowerCase()}.`;
}

/** Cambia el estado de UNA fila de skill de una observación YA GUARDADA (Aceptar/Rechazar desde
 * el detalle) — regla del usuario: "no quiero que una sugerencia quede eternamente pendiente
 * porque la maestra salió de la pantalla anterior". No toca `Nino.skills`. */
export function actualizarEstadoObservacionSkill(observacionId: string, skillId: string, nuevoEstado: EstadoRelacionSkill): ObservacionSkill[] {
  const actualizados = leerObservacionSkills().map((s) =>
    s.observacionId === observacionId && s.skillId === skillId ? { ...s, estado: nuevoEstado } : s
  );
  guardarObservacionSkills(actualizados);
  return actualizados;
}

/* ── CONFIGURACIÓN DEL PROGRAMA — Sesión 6, paso 2 del núcleo funcional. Es la raíz de todo lo
   demás (rutina, evaluaciones, tracks, planeación con/sin niños): sin esto no existe un "salón"
   al que amarrar niños. Persistencia: localStorage por ahora (`raiz_programa_config`) — Supabase
   llega en el paso 8 del orden acordado con el usuario, después de que el núcleo esté sólido.
   NOTA: reutiliza el tipo `Etapa` central (ya reconciliado en Módulo Niños, paso 3) — antes de
   esa reconciliación esta pantalla tenía su propio `EtapaAtendida`, ya no existe. ── */

export type TipoPrograma =
  | 'Home Daycare / Family Child Care'
  | 'Preschool'
  | 'Pre-K'
  | 'Child Care Center'
  | 'Otro';

export type Metodologia =
  | 'Montessori'
  | 'Montessori híbrido'
  | 'Reggio Emilia'
  | 'Play-based'
  | 'School Readiness / Academic'
  | 'Emergent Curriculum'
  | 'Otra';

export const METODOLOGIAS: Metodologia[] = [
  'Montessori', 'Montessori híbrido', 'Reggio Emilia', 'Play-based',
  'School Readiness / Academic', 'Emergent Curriculum', 'Otra',
];

/** Idiomas sugeridos para el multi-selector de "idiomas de enseñanza" — la maestra puede agregar
 * otros con texto libre (regla del usuario: "bilingüe" NO es un idioma, es 2+ idiomas juntos). */
export const IDIOMAS_ENSENANZA_SUGERIDOS = ['English', 'Español'];

export const PRIORIDADES_PEDAGOGICAS_SUGERIDAS = [
  'Desarrollo socioemocional', 'Lenguaje y comunicación', 'Motricidad fina', 'Motricidad gruesa',
  'Autonomía', 'Vocabulario bilingüe', 'Juego y exploración', 'Pre-literacy', 'Pre-math',
  'School Readiness', 'Kindergarten Readiness', 'STEM/STEAM',
];

/** Tracks opcionales — entidades CONTROLADAS por RAÍZ (ligadas a `assessment_templates.track`),
 * nunca texto libre de la maestra (regla del usuario, arquitectura del Perfil del niño v2). */
export type TrackOpcional = 'kindergarten_readiness' | 'school_readiness' | 'pre_literacy' | 'pre_math' | 'bilingual_language_focus';

export const TRACK_LABEL: Record<TrackOpcional, string> = {
  kindergarten_readiness: 'Kindergarten Readiness',
  school_readiness: 'School Readiness',
  pre_literacy: 'Pre-literacy',
  pre_math: 'Pre-math',
  bilingual_language_focus: 'Bilingual / Language Focus',
};

export type FrecuenciaEvaluacion = 'trimestral' | 'semestral' | 'anual' | 'personalizada';
export const FRECUENCIA_EVALUACION_LABEL: Record<FrecuenciaEvaluacion, string> = {
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  personalizada: 'Personalizada',
};

export type PracticaAEvitar = 'comida_sensorial' | 'glitter' | 'worksheets' | 'pantallas' | 'otro';
export const PRACTICA_A_EVITAR_LABEL: Record<PracticaAEvitar, string> = {
  comida_sensorial: 'Comida para actividades sensoriales',
  glitter: 'Glitter',
  worksheets: 'Worksheets',
  pantallas: 'Pantallas',
  otro: 'Otro',
};

export interface ProgramaConfig {
  nombrePrograma: string;
  tipoPrograma: TipoPrograma;
  metodologias: Metodologia[];
  metodologiaDescripcionAdicional?: string;
  etapasAtendidas: Etapa[];
  idiomasEnsenanza: string[];
  idiomaSalidaDefault: string;
  prioridadesPedagogicas: string[];
  tracksActivos: TrackOpcional[];
  frecuenciaEvaluacion: FrecuenciaEvaluacion;
  frecuenciaEvaluacionMesesPersonalizada?: number;
  practicasAEvitar: PracticaAEvitar[];
  preferenciasGeneralesTexto?: string;
  rutinaBloques: BloqueRutina[];
}

export const PROGRAMA_CONFIG_DEFAULT: ProgramaConfig = {
  nombrePrograma: 'Mi salón',
  tipoPrograma: 'Home Daycare / Family Child Care',
  metodologias: [],
  etapasAtendidas: [],
  idiomasEnsenanza: [],
  idiomaSalidaDefault: 'Español',
  prioridadesPedagogicas: [],
  tracksActivos: [],
  frecuenciaEvaluacion: 'trimestral',
  practicasAEvitar: [],
  rutinaBloques: RUTINA_PROGRAMA,
};

const PROGRAMA_CONFIG_STORAGE_KEY = 'raiz_programa_config';

/** Lee la configuración guardada en este dispositivo — sin Supabase todavía (paso 8 del orden
 * acordado), localStorage es la persistencia interina, igual que ya hace `/paywall` con las
 * respuestas del onboarding. Nunca lanza si el storage no está disponible (SSR/privado). */
export function leerProgramaConfig(): ProgramaConfig {
  if (typeof window === 'undefined') return PROGRAMA_CONFIG_DEFAULT;
  try {
    const guardado = window.localStorage.getItem(PROGRAMA_CONFIG_STORAGE_KEY);
    if (!guardado) return PROGRAMA_CONFIG_DEFAULT;
    return { ...PROGRAMA_CONFIG_DEFAULT, ...JSON.parse(guardado) } as ProgramaConfig;
  } catch {
    return PROGRAMA_CONFIG_DEFAULT;
  }
}

export function guardarProgramaConfig(config: ProgramaConfig): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROGRAMA_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch {
    // Almacenamiento no disponible (modo privado/cuota) — la sesión sigue funcionando en memoria.
  }
}

/* ── PERSISTENCIA DE OBSERVACIONES (Sesión 6, paso 6) — hasta ahora `Observacion`/
   `ObservacionSkill` (Sesión 5 ronda 4) existían solo como tipos; `/observar` las construía en
   memoria y las perdía al salir. Mismo patrón que `leerNinos()`/`leerPlaneaciones()`: localStorage
   con semilla de respaldo. Los 4 registros DEMO de abajo (`OBSERVACIONES_SEMILLA`) son SOLO para
   probar el historial — una cuenta real sin observaciones propias nunca las ve (la semilla es el
   valor por defecto SOLO cuando localStorage está vacío); cuando se conecte Supabase (paso 8), la
   separación semilla/datos reales de la maestra debe quedar igual de clara. ── */

export const OBSERVACIONES_SEMILLA: Observacion[] = [
  {
    id: 'obs-seed-luca-tijeras',
    ninoId: 'luca',
    fecha: '2026-09-08',
    origen: 'dirigida',
    fuente: 'seleccion_rapida',
    notaOriginal: 'Cortes consecutivos sin ayuda',
    redaccionProfesional: 'Luca realizó cortes consecutivos sin ayuda durante la actividad relacionada con tijeras.',
    idiomaRedaccion: 'es',
    triggeredBySkillId: 'tijeras',
    autorId: STAFF_ACTUAL_ID,
  },
  {
    id: 'obs-seed-sofia-espontanea',
    ninoId: 'sofia',
    fecha: '2026-09-05',
    origen: 'espontanea',
    fuente: 'texto',
    notaOriginal: 'Sofía señaló la imagen de "more" cuando quería más bloques, y después dijo "más" con claridad. Se quedó jugando junto a Luca un buen rato, mirando lo que él construía.',
    // Ejemplo poblado de la mejora de Sesión 6 paso 6b: redacción ya confirmada, con "Luca"
    // anonimizado a "un compañero" — así el detalle muestra "Ver nota original" desde el primer
    // vistazo, sin que el usuario tenga que generar una nueva para verlo.
    redaccionProfesional: 'Sofía señaló una imagen para pedir más bloques y después dijo "más" con claridad. Jugó junto a un compañero, observando lo que él construía.',
    idiomaRedaccion: 'es',
    autorId: STAFF_ACTUAL_ID,
  },
  {
    id: 'obs-seed-mateo-sin-clasificar',
    ninoId: 'mateo',
    fecha: '2026-09-11',
    origen: 'espontanea',
    fuente: 'texto',
    notaOriginal: 'Mateo se quedó mirando fijamente el móvil de colores por varios minutos, muy concentrado, sin que nadie le llamara la atención hacia él.',
    autorId: STAFF_ACTUAL_ID,
  },
  {
    id: 'obs-seed-zayne-no-observado',
    ninoId: 'zayne',
    fecha: '2026-09-12',
    origen: 'dirigida',
    fuente: 'seleccion_rapida',
    notaOriginal: 'No observado',
    triggeredBySkillId: 'tijeras',
    oportunidadSinEvidencia: true,
    autorId: STAFF_ACTUAL_ID,
  },
];

export const OBSERVACION_SKILLS_SEMILLA: ObservacionSkill[] = [
  { observacionId: 'obs-seed-luca-tijeras', skillId: 'tijeras', nombreSkill: 'Uso de tijeras', origen: 'observacion_dirigida', estado: 'aceptado' },
  { observacionId: 'obs-seed-sofia-espontanea', skillId: 'palabras', nombreSkill: 'Vocabulario de 2 palabras', origen: 'raiz', estado: 'aceptado', evidenciaTextual: 'después dijo "más" con claridad' },
  { observacionId: 'obs-seed-sofia-espontanea', skillId: 'interaccion-social', nombreSkill: 'Interacción con pares', origen: 'raiz', estado: 'sugerido', evidenciaTextual: 'se quedó jugando junto a Luca un buen rato' },
  // obs-seed-mateo-sin-clasificar: a propósito sin ninguna fila — "Guardar sin clasificar".
  // obs-seed-zayne-no-observado: a propósito sin ninguna fila — "No observado" nunca es evidencia.
];

const OBSERVACIONES_STORAGE_KEY = 'raiz_observaciones';
const OBSERVACION_SKILLS_STORAGE_KEY = 'raiz_observacion_skills';

/** Datos guardados antes de la mini-migración (Sesión 6 paso 7 / 6c) tenían `evidencia` (una sola,
 * sin id) — se convierten al leer para no perder nada ni exigir borrar el almacenamiento. */
type ObservacionLegada = Observacion & { evidencia?: { tipo: TipoEvidencia; nombreArchivo: string } };
function normalizarObservacion(o: ObservacionLegada): Observacion {
  const { evidencia, ...resto } = o;
  if (evidencia && !resto.evidencias) {
    return { ...resto, evidencias: [{ id: `ev-${resto.id}-1`, tipo: evidencia.tipo, nombreArchivo: evidencia.nombreArchivo, compartibleConFamilia: false }] };
  }
  return resto;
}

export function leerObservaciones(): Observacion[] {
  if (typeof window === 'undefined') return OBSERVACIONES_SEMILLA;
  try {
    const guardado = window.localStorage.getItem(OBSERVACIONES_STORAGE_KEY);
    if (!guardado) return OBSERVACIONES_SEMILLA;
    const parseado = JSON.parse(guardado) as ObservacionLegada[];
    return Array.isArray(parseado) ? parseado.map(normalizarObservacion) : OBSERVACIONES_SEMILLA;
  } catch {
    return OBSERVACIONES_SEMILLA;
  }
}

export function guardarObservaciones(observaciones: Observacion[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OBSERVACIONES_STORAGE_KEY, JSON.stringify(observaciones));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

export function leerObservacionSkills(): ObservacionSkill[] {
  if (typeof window === 'undefined') return OBSERVACION_SKILLS_SEMILLA;
  try {
    const guardado = window.localStorage.getItem(OBSERVACION_SKILLS_STORAGE_KEY);
    if (!guardado) return OBSERVACION_SKILLS_SEMILLA;
    const parseado = JSON.parse(guardado) as ObservacionSkill[];
    return Array.isArray(parseado) ? parseado : OBSERVACION_SKILLS_SEMILLA;
  } catch {
    return OBSERVACION_SKILLS_SEMILLA;
  }
}

export function guardarObservacionSkills(skills: ObservacionSkill[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(OBSERVACION_SKILLS_STORAGE_KEY, JSON.stringify(skills));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

/** Guarda UNA observación nueva (+ sus filas de skill, si las hay) al final de lo ya persistido —
 * nunca sobrescribe el historial existente. Devuelve las listas actualizadas para que la pantalla
 * refresque su estado sin tener que releer el storage. */
export function agregarObservacion(observacion: Observacion, skills: ObservacionSkill[]): { observaciones: Observacion[]; observacionSkills: ObservacionSkill[] } {
  const observaciones = [...leerObservaciones(), observacion];
  const observacionSkills = [...leerObservacionSkills(), ...skills];
  guardarObservaciones(observaciones);
  guardarObservacionSkills(observacionSkills);
  return { observaciones, observacionSkills };
}

/** Historial de UN niño — misma información que el historial general, filtrada por `ninoId`
 * (regla del usuario: "no es otro dataset, es la misma información filtrada"), más reciente primero. */
export function observacionesDeNino(ninoId: string, observaciones: Observacion[] = leerObservaciones()): Observacion[] {
  return observaciones.filter((o) => o.ninoId === ninoId).sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function skillsDeObservacion(observacionId: string, skills: ObservacionSkill[] = leerObservacionSkills()): ObservacionSkill[] {
  return skills.filter((s) => s.observacionId === observacionId);
}

/** Busca una actividad por id en CUALQUIERA de las semanas persistidas (hoy solo existe la
 * Semana 3, pero esto no debería tener que rehacerse cuando haya más) — usado para resolver el
 * contexto de una observación nacida desde una actividad, y para cerrar el ciclo de vuelta hacia
 * la Planeación (ver `marcarNinoFocoObservado`). */
export function actividadYPlanPorId(actividadId: string): { actividad: Actividad; dia: DiaPlan; plan: PlaneacionSemanal } | undefined {
  for (const plan of leerPlaneaciones()) {
    const encontrado = actividadPorId(actividadId, plan);
    if (encontrado) return encontrado;
  }
  return undefined;
}

/** Cierra el ciclo Planeación → Observación (regla del usuario, Sesión 6 paso 5/6): cuando una
 * observación nace de un niño foco real de una actividad, ese foco queda marcado "observado" y
 * enlazado a la observación — sin esto, la observación quedaría aislada del historial de foco que
 * ya construimos. No toca `estadoDesarrollo`/`estadoEvidencia` de ningún skill — solo el estado
 * del foco puntual de esa actividad. */
export function marcarNinoFocoObservado(actividadId: string, ninoId: string, observationId: string): void {
  const encontrado = actividadYPlanPorId(actividadId);
  if (!encontrado) return;
  const { plan } = encontrado;
  const actualizado: PlaneacionSemanal = {
    ...plan,
    dias: plan.dias.map((dia) => ({
      ...dia,
      actividades: dia.actividades.map((act) => {
        if (act.id !== actividadId || !act.ninosFoco) return act;
        return {
          ...act,
          ninosFoco: act.ninosFoco.map((f) => (f.ninoId === ninoId ? { ...f, estadoFoco: 'observado' as const, observationId } : f)),
        };
      }),
    })),
  };
  guardarUnaPlaneacion(actualizado);
}

/* ── PROGRESO VIVO + HISTORIAL DE SKILLS (Sesión 6, paso 7 / 6c) ──
   Progreso es una VISTA VIVA calculada al abrir — nunca se guarda ni se congela (los snapshots
   son los reportes, 6e/6f). Lo único que se persiste es `child_skill_events`: el HISTORIAL de
   cambios de estado de cada skill, escrito SOLO cuando un humano aprueba un cambio (aprobar una
   evaluación, o "Revisar habilidad"). Una observación NUNCA escribe aquí ni cambia `Nino.skills`
   — solo agrega evidencia (regla del usuario). Sin porcentajes: dar una falsa precisión no ayuda. */

export type FuenteEventoSkill = 'evaluacion' | 'revision_maestra';

export interface EstadosSkill {
  estadoDesarrollo: EstadoDesarrollo;
  estadoEvidencia: EstadoEvidencia;
}

export interface EventoSkill {
  id: string;
  ninoId: string;
  skillId: string;
  nombreSkill: string;
  fecha: string;
  /** Ausente = primer registro del skill (punto de partida). */
  anterior?: EstadosSkill;
  nuevo: EstadosSkill;
  fuente: FuenteEventoSkill;
  evaluacionId?: string;
  /** Observaciones que la maestra tenía a la vista al revisar (trazabilidad). */
  observacionIds?: string[];
  nota?: string;
  /** Siempre true: el historial solo registra cambios que un humano aprobó. */
  confirmadoPorMaestra: true;
}

/** DEMO — historial ilustrativo para que la línea de tiempo no se vea vacía (mismo aviso que el
 * resto de la semilla: una cuenta real nunca lo recibe). Coherente con el estado actual y con las
 * observaciones/evaluaciones semilla. */
export const EVENTOS_SKILL_SEMILLA: EventoSkill[] = [
  { id: 'evt-seed-luca-tijeras-1', ninoId: 'luca', skillId: 'tijeras', nombreSkill: 'Tijeras', fecha: '2026-05-12', nuevo: { estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' }, fuente: 'revision_maestra', nota: 'Punto de partida', confirmadoPorMaestra: true },
  { id: 'evt-seed-luca-tijeras-2', ninoId: 'luca', skillId: 'tijeras', nombreSkill: 'Tijeras', fecha: '2026-06-24', anterior: { estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' }, nuevo: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' }, fuente: 'revision_maestra', confirmadoPorMaestra: true },
  { id: 'evt-seed-luca-tijeras-3', ninoId: 'luca', skillId: 'tijeras', nombreSkill: 'Tijeras', fecha: '2026-09-08', anterior: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' }, nuevo: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, fuente: 'revision_maestra', observacionIds: ['obs-seed-luca-tijeras'], confirmadoPorMaestra: true },
  { id: 'evt-seed-luca-numeros-1', ninoId: 'luca', skillId: 'numeros-1-8', nombreSkill: 'Números 1–8', fecha: '2026-06-02', nuevo: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, fuente: 'revision_maestra', nota: 'Punto de partida', confirmadoPorMaestra: true },
  { id: 'evt-seed-luca-numeros-2', ninoId: 'luca', skillId: 'numeros-1-8', nombreSkill: 'Números 1–8', fecha: '2026-08-20', anterior: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, nuevo: { estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' }, fuente: 'revision_maestra', confirmadoPorMaestra: true },
  { id: 'evt-seed-sofia-palabras-1', ninoId: 'sofia', skillId: 'palabras', nombreSkill: 'Vocabulario de 2 palabras', fecha: '2026-02-12', nuevo: { estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' }, fuente: 'evaluacion', evaluacionId: 'eval-sofia-ingreso', nota: 'Evaluación de ingreso', confirmadoPorMaestra: true },
  { id: 'evt-seed-sofia-palabras-2', ninoId: 'sofia', skillId: 'palabras', nombreSkill: 'Vocabulario de 2 palabras', fecha: '2026-09-05', anterior: { estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' }, nuevo: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, fuente: 'revision_maestra', observacionIds: ['obs-seed-sofia-espontanea'], confirmadoPorMaestra: true },
  { id: 'evt-seed-sofia-apilar-1', ninoId: 'sofia', skillId: 'apilar', nombreSkill: 'Apila 4+ bloques', fecha: '2026-02-12', nuevo: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, fuente: 'evaluacion', evaluacionId: 'eval-sofia-ingreso', nota: 'Evaluación de ingreso', confirmadoPorMaestra: true },
  { id: 'evt-seed-sofia-apilar-2', ninoId: 'sofia', skillId: 'apilar', nombreSkill: 'Apila 4+ bloques', fecha: '2026-08-22', anterior: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, nuevo: { estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' }, fuente: 'revision_maestra', confirmadoPorMaestra: true },
  { id: 'evt-seed-mateo-gateo-1', ninoId: 'mateo', skillId: 'gateo', nombreSkill: 'Gateo cruzado', fecha: '2026-06-15', nuevo: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, fuente: 'revision_maestra', nota: 'Punto de partida', confirmadoPorMaestra: true },
  { id: 'evt-seed-mateo-gateo-2', ninoId: 'mateo', skillId: 'gateo', nombreSkill: 'Gateo cruzado', fecha: '2026-08-30', anterior: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' }, nuevo: { estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' }, fuente: 'revision_maestra', confirmadoPorMaestra: true },
];

const EVENTOS_SKILL_STORAGE_KEY = 'raiz_skill_events';

export function leerEventosSkill(): EventoSkill[] {
  if (typeof window === 'undefined') return EVENTOS_SKILL_SEMILLA;
  try {
    const guardado = window.localStorage.getItem(EVENTOS_SKILL_STORAGE_KEY);
    if (!guardado) return EVENTOS_SKILL_SEMILLA;
    const parseado = JSON.parse(guardado) as EventoSkill[];
    return Array.isArray(parseado) ? parseado : EVENTOS_SKILL_SEMILLA;
  } catch {
    return EVENTOS_SKILL_SEMILLA;
  }
}

export function guardarEventosSkill(eventos: EventoSkill[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(EVENTOS_SKILL_STORAGE_KEY, JSON.stringify(eventos));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

/** Agrega eventos al final del historial ya persistido — nunca sobrescribe. */
export function agregarEventosSkill(nuevos: EventoSkill[]): EventoSkill[] {
  if (nuevos.length === 0) return leerEventosSkill();
  const todos = [...leerEventosSkill(), ...nuevos];
  guardarEventosSkill(todos);
  return todos;
}

/** Línea de tiempo de UN skill de UN niño, del más antiguo al más reciente. */
export function eventosDeSkill(ninoId: string, skillId: string, eventos: EventoSkill[] = leerEventosSkill()): EventoSkill[] {
  return eventos.filter((e) => e.ninoId === ninoId && e.skillId === skillId).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Eventos que produce aprobar una evaluación: solo los skills cuyo estado realmente cambió (o que
 * aparecen por primera vez) — un resultado idéntico al vivo no genera ruido en el historial. Se
 * calcula con el niño ANTES de aprobar (`aprobarEvaluacion` sobrescribe `nino.skills`). */
export function eventosDeAprobacion(ninoAntes: Nino, evaluacion: EvaluacionNino): EventoSkill[] {
  const eventos: EventoSkill[] = [];
  for (const r of evaluacion.resultados) {
    const previo = ninoAntes.skills.find((s) => s.id === r.skillId);
    if (previo && previo.estadoDesarrollo === r.estadoDesarrollo && previo.estadoEvidencia === r.estadoEvidencia) continue;
    const catalogo = SKILLS_CATALOG.find((c) => c.id === r.skillId);
    eventos.push({
      id: `evt-${Date.now()}-${r.skillId}`,
      ninoId: ninoAntes.id,
      skillId: r.skillId,
      nombreSkill: previo?.nombre ?? catalogo?.nombre ?? r.skillId,
      fecha: FECHA_HOY,
      anterior: previo ? { estadoDesarrollo: previo.estadoDesarrollo, estadoEvidencia: previo.estadoEvidencia } : undefined,
      nuevo: { estadoDesarrollo: r.estadoDesarrollo, estadoEvidencia: r.estadoEvidencia },
      fuente: 'evaluacion',
      evaluacionId: evaluacion.id,
      nota: evaluacion.tipo === 'ingreso' ? 'Evaluación de ingreso' : 'Evaluación periódica',
      confirmadoPorMaestra: true,
    });
  }
  return eventos;
}

/** "Revisar habilidad": la maestra decide un nuevo estado tras ver la evidencia — es el ÚNICO
 * camino (además de aprobar una evaluación) que cambia `Nino.skills`. Devuelve el niño
 * actualizado y el evento a registrar; quien llama persiste ambos. */
export function revisarHabilidad(
  nino: Nino,
  skillId: string,
  nuevo: EstadosSkill,
  opciones: { observacionIds?: string[]; nota?: string } = {}
): { nino: Nino; evento: EventoSkill } {
  const previo = nino.skills.find((s) => s.id === skillId);
  const catalogo = SKILLS_CATALOG.find((c) => c.id === skillId);
  const nombre = previo?.nombre ?? catalogo?.nombre ?? skillId;
  const skillActualizado: Skill = { id: skillId, nombre, estadoDesarrollo: nuevo.estadoDesarrollo, estadoEvidencia: nuevo.estadoEvidencia, actualizado: FECHA_HOY };
  const skills = previo ? nino.skills.map((s) => (s.id === skillId ? skillActualizado : s)) : [...nino.skills, skillActualizado];
  const evento: EventoSkill = {
    id: `evt-${Date.now()}-${skillId}`,
    ninoId: nino.id,
    skillId,
    nombreSkill: nombre,
    fecha: FECHA_HOY,
    anterior: previo ? { estadoDesarrollo: previo.estadoDesarrollo, estadoEvidencia: previo.estadoEvidencia } : undefined,
    nuevo,
    fuente: 'revision_maestra',
    observacionIds: opciones.observacionIds,
    nota: opciones.nota?.trim() || undefined,
    confirmadoPorMaestra: true,
  };
  return { nino: { ...nino, skills }, evento };
}

/** Descripción en palabras que conserva AMBOS ejes (la etiqueta corta de `etiquetaSkill` los
 * colapsa) — para el historial, donde "en desarrollo con poca evidencia" y "en desarrollo con
 * evidencia suficiente" son momentos distintos de la evolución. */
export function describirEstadoSkill(e: EstadosSkill): string {
  if (e.estadoDesarrollo === 'desconocido' || e.estadoEvidencia === 'no_observado') return 'Aún no observado';
  const base = e.estadoDesarrollo === 'dominado' ? 'Dominado' : 'En desarrollo';
  if (e.estadoEvidencia === 'insuficiente') return `${base} · con poca evidencia`;
  if (e.estadoEvidencia === 'contradictoria') return `${base} · evidencia contradictoria`;
  return e.estadoDesarrollo === 'dominado' ? base : `${base} · con evidencia suficiente`;
}

export type GrupoProgreso = 'consolidado' | 'en_desarrollo' | 'necesita_evidencia' | 'sin_observar';

export const GRUPO_PROGRESO_LABEL: Record<GrupoProgreso, string> = {
  consolidado: 'Fortalezas / consolidado',
  en_desarrollo: 'En desarrollo',
  necesita_evidencia: 'Necesita más evidencia',
  sin_observar: 'Aún no observado',
};

/** Agrupa un skill por lo que la maestra necesita entender, no por un número. Precedencia: sin
 * dato → evidencia débil/contradictoria → consolidado → en desarrollo. */
export function grupoProgreso(estados: EstadosSkill): GrupoProgreso {
  if (estados.estadoDesarrollo === 'desconocido' || estados.estadoEvidencia === 'no_observado') return 'sin_observar';
  if (estados.estadoEvidencia === 'insuficiente' || estados.estadoEvidencia === 'contradictoria') return 'necesita_evidencia';
  if (estados.estadoDesarrollo === 'dominado') return 'consolidado';
  return 'en_desarrollo';
}

/** Skills de la(s) plantilla(s) de la etapa actual que el niño todavía no tiene registrados —
 * "aún no observado" con sentido de edad (nunca se muestra lo que aún no le corresponde). */
export function skillsEsperadosSinEstado(nino: Nino, tracksActivos: TrackOpcional[]): { id: string; nombre: string }[] {
  const edadMeses = edadEnMeses(nino.fechaNacimiento);
  const ids = new Set<string>();
  for (const plantilla of plantillasAplicables(nino.etapa, tracksActivos)) {
    for (const ts of ASSESSMENT_TEMPLATE_SKILLS.filter((s) => s.assessmentTemplateId === plantilla.id)) ids.add(ts.skillId);
  }
  const resultado: { id: string; nombre: string }[] = [];
  for (const id of ids) {
    if (nino.skills.some((s) => s.id === id)) continue;
    const catalogo = SKILLS_CATALOG.find((c) => c.id === id);
    if (!catalogo || edadMeses < catalogo.rangoEdadMesesMin) continue;
    resultado.push({ id, nombre: catalogo.nombre });
  }
  return resultado;
}

export interface EvidenciaDeSkill {
  observacion: Observacion;
  relacion: ObservacionSkill;
}

function observacionesConSkillAceptado(ninoId: string, skillId: string, observaciones: Observacion[], relaciones: ObservacionSkill[]): EvidenciaDeSkill[] {
  const resultado: EvidenciaDeSkill[] = [];
  for (const o of observaciones) {
    if (o.ninoId !== ninoId) continue;
    const relacion = relaciones.find((r) => r.observacionId === o.id && r.skillId === skillId && r.estado === 'aceptado');
    if (relacion) resultado.push({ observacion: o, relacion });
  }
  return resultado.sort((a, b) => b.observacion.fecha.localeCompare(a.observacion.fecha));
}

/** EVIDENCIA PEDAGÓGICA VÁLIDA: observaciones con este skill ACEPTADO **y** redacción profesional
 * aprobada (regla del usuario, Sesión 6 paso 7). Es lo único que cuenta para "nueva evidencia para
 * revisar" y lo que consumirán después evaluación, prioridades y Plan Individual — por eso este es
 * el default seguro. (`sugerido`/`rechazado` nunca cuentan; las oportunidades "No observado" van
 * aparte; las notas pendientes de redacción van en `pendientesRedaccionDeSkill`.) */
export function evidenciaDeSkill(ninoId: string, skillId: string, observaciones: Observacion[], relaciones: ObservacionSkill[]): EvidenciaDeSkill[] {
  return observacionesConSkillAceptado(ninoId, skillId, observaciones, relaciones).filter((e) => estadoRegistroObservacion(e.observacion) === 'profesional_aprobada');
}

/** Notas con este skill aceptado que TODAVÍA no tienen redacción profesional aprobada: visibles
 * (para que no se pierdan) pero NO cuentan como evidencia, no disparan "nueva evidencia para
 * revisar" y no alimentan nada más hasta que la maestra apruebe la redacción. */
export function pendientesRedaccionDeSkill(ninoId: string, skillId: string, observaciones: Observacion[], relaciones: ObservacionSkill[]): EvidenciaDeSkill[] {
  return observacionesConSkillAceptado(ninoId, skillId, observaciones, relaciones).filter((e) => estadoRegistroObservacion(e.observacion) === 'pendiente_redaccion');
}

/** Aprueba la redacción profesional de una observación YA guardada (estaba pendiente): a partir de
 * ese momento pasa a contar como evidencia utilizable. La `notaOriginal` no se toca. */
export function aprobarRedaccionObservacion(observacionId: string, redaccion: string, idioma: string = 'es'): Observacion[] {
  const texto = redaccion.trim();
  const actualizadas = leerObservaciones().map((o) =>
    o.id === observacionId && texto ? { ...o, redaccionProfesional: texto, idiomaRedaccion: idioma } : o
  );
  guardarObservaciones(actualizadas);
  return actualizadas;
}

export function oportunidadesSinEvidenciaDeSkill(ninoId: string, skillId: string, observaciones: Observacion[]): Observacion[] {
  return observaciones
    .filter((o) => o.ninoId === ninoId && o.oportunidadSinEvidencia && o.triggeredBySkillId === skillId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export function sugeridasSinRevisarDeSkill(ninoId: string, skillId: string, observaciones: Observacion[], relaciones: ObservacionSkill[]): number {
  const idsDelNino = new Set(observaciones.filter((o) => o.ninoId === ninoId).map((o) => o.id));
  return relaciones.filter((r) => idsDelNino.has(r.observacionId) && r.skillId === skillId && r.estado === 'sugerido').length;
}

/** "Hay nueva evidencia para revisar esta habilidad": observaciones VÁLIDAS (skill aceptado + redacción
 * profesional aprobada — las pendientes de redacción NO disparan este aviso) posteriores al último cambio aprobado (o a la fecha del estado vivo si nunca hubo eventos). Solo
 * avisa — cambiar el estado sigue siendo una acción explícita de la maestra. */
export function evidenciaNuevaParaRevisar(
  ninoId: string,
  skill: { id: string; actualizado?: string },
  observaciones: Observacion[],
  relaciones: ObservacionSkill[],
  eventos: EventoSkill[]
): EvidenciaDeSkill[] {
  const ultimoEvento = eventosDeSkill(ninoId, skill.id, eventos).slice(-1)[0];
  const fechaBase = ultimoEvento?.fecha ?? skill.actualizado ?? '0000-00-00';
  return evidenciaDeSkill(ninoId, skill.id, observaciones, relaciones).filter((e) => e.observacion.fecha > fechaBase);
}

/** Frase corta en palabras (sin porcentajes) sobre cómo va el niño — describe lo registrado, no
 * diagnostica ni compara con una norma. */
export function resumenProgresoTexto(nombre: string, conteo: Record<GrupoProgreso, number>, conNuevaEvidencia: number): string {
  const partes: string[] = [];
  if (conteo.consolidado > 0) partes.push(`${conteo.consolidado} ${conteo.consolidado === 1 ? 'habilidad consolidada' : 'habilidades consolidadas'}`);
  if (conteo.en_desarrollo > 0) partes.push(`${conteo.en_desarrollo} en desarrollo`);
  if (conteo.necesita_evidencia > 0) partes.push(`${conteo.necesita_evidencia} que necesita${conteo.necesita_evidencia === 1 ? '' : 'n'} más evidencia`);
  if (conteo.sin_observar > 0) partes.push(`${conteo.sin_observar} aún sin observar`);
  if (partes.length === 0) return `Todavía no hay habilidades registradas para ${nombre}.`;
  const base = `${nombre} tiene ${partes.join(', ').replace(/, ([^,]*)$/, ' y $1')}.`;
  return conNuevaEvidencia > 0 ? `${base} Hay nueva evidencia para revisar en ${conNuevaEvidencia}.` : base;
}
