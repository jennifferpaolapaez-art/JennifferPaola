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

export type EstadoPlanIndividual = 'activo' | 'pausado' | 'cerrado';
export type EstadoMetaIndividual = 'por_trabajar' | 'en_progreso' | 'casi' | 'alcanzado';

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
}

/** Plan Individual — OPCIONAL, vive dentro del perfil del niño (nunca un módulo aparte que
 * aparece después). Una necesidad/adaptación NUNCA lo crea automáticamente — la maestra decide
 * cuándo. Simplificación de esta ronda: un plan activo a la vez por niño (el historial de planes
 * cerrados queda para una ronda futura si hace falta). */
export interface PlanIndividual {
  id: string;
  fechaCreacion: string;
  estado: EstadoPlanIndividual;
  motivo?: string;
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
  planIndividual?: PlanIndividual;
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
      { id: 'apoyo-sofia-aplicador', necesidadId: 'need-sofia-sensorial', estrategia: 'Ofrecer un aplicador o guante en vez de contacto directo con pega/pintura.', activa: true, origen: 'maestra', teacherConfirmed: true },
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
    planIndividual: {
      id: 'plan-sofia',
      fechaCreacion: '2026-02-12',
      estado: 'activo',
      motivo: 'Seguimiento de lenguaje expresivo tras evaluación externa.',
      metas: [
        {
          id: 'meta-sofia-vocabulario',
          skillId: 'palabras',
          descripcion: 'Ampliar vocabulario expresivo a 20+ palabras espontáneas.',
          estado: 'en_progreso',
          estrategias: 'Ofrecer 2 opciones con apoyo visual; celebrar cualquier intento verbal, no solo la palabra exacta.',
          siguientePaso: 'Observar en Circle Time y Centros durante 2 semanas antes de revisar el estado de la meta.',
          fechaActualizacion: '2026-08-01',
        },
      ],
    },
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
      { id: 'apoyo-mateo-piso', necesidadId: 'need-mateo-postural', estrategia: 'Ofrecer apoyo directo o brazos de la maestra en actividades de piso, sin exigir sedestación sostenida.', activa: true, origen: 'maestra', teacherConfirmed: true },
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
export function leerNinos(): Nino[] {
  if (typeof window === 'undefined') return NINOS_SEMILLA;
  try {
    const guardado = window.localStorage.getItem(NINOS_STORAGE_KEY);
    if (!guardado) return NINOS_SEMILLA;
    const parseado = JSON.parse(guardado) as Nino[];
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
  { id: 'colores', dominio: 'cognicion', nombre: 'Reconoce colores', rangoEdadMesesMin: 30, rangoEdadMesesMax: 42, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Cualquier actividad'] },
  { id: 'nombre', dominio: 'pre_literacy', nombre: 'Escritura de su nombre', rangoEdadMesesMin: 42, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Pre-K Table', 'Centros'] },
  { id: 'juego-cooperativo', dominio: 'interaccion_social', nombre: 'Juego cooperativo con un rol compartido', rangoEdadMesesMin: 36, rangoEdadMesesMax: 54, prerrequisitos: ['juego-paralelo'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Outdoor'] },

  { id: 'numeros-6-8', dominio: 'pre_math', nombre: 'Conteo 6–8', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: ['numeros-1-8'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros', 'Circle Time'] },
  { id: 'rima', dominio: 'pre_literacy', nombre: 'Identifica rimas', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Circle Time'] },
  { id: 'nombre-propio', dominio: 'pre_literacy', nombre: 'Escritura de nombre propio', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: ['nombre'], politicaRevision: 'una_vez_dominado', evidenciaRequerida: 'una_demostracion_clara', contextosRecomendados: ['Pre-K Table'] },

  { id: 'reconocimiento-letras', dominio: 'pre_literacy', nombre: 'Reconoce letras de su nombre', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: [], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Pre-K Table', 'Circle Time'] },
  { id: 'conteo-cantidades', dominio: 'pre_math', nombre: 'Asocia cantidad con número', rangoEdadMesesMin: 48, rangoEdadMesesMax: 60, prerrequisitos: ['numeros-6-8'], politicaRevision: 'seguimiento_periodico', evidenciaRequerida: 'multiples_contextos', contextosRecomendados: ['Centros'] },

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
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'numeros-1-8', orden: 2 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'colores', orden: 3 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'nombre', orden: 4 },
  { assessmentTemplateId: 'tpl-preschool-core-v1', skillId: 'juego-cooperativo', orden: 5 },

  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'numeros-6-8', orden: 1 },
  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'rima', orden: 2 },
  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'nombre-propio', orden: 3 },
  { assessmentTemplateId: 'tpl-prek-core-v1', skillId: 'tijeras', orden: 4 },

  { assessmentTemplateId: 'tpl-prek-kinder-readiness-v1', skillId: 'reconocimiento-letras', orden: 1 },
  { assessmentTemplateId: 'tpl-prek-kinder-readiness-v1', skillId: 'conteo-cantidades', orden: 2 },
];

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

/** Adaptación por una necesidad puntual de UN niño (capa B) — nunca implica Plan Individual.
 * Entidad relacional completa: `necesidad`/`ajuste` son el snapshot histórico de lo que se usó
 * ESE día; las referencias (`childNeedId`/`individualGoalId`/`planId`/`observationId`) enlazan a
 * la fuente estructurada cuando existe — ninguna es obligatoria (regla del usuario: "no todos son
 * obligatorios"). */
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
  individualGoalId?: string;
  planId?: string;
  observationId?: string;
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
  estadoFoco: 'pendiente' | 'observado';
  observationId?: string;
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
}

export const PLANEACION_SEMANA_3: PlaneacionSemanal = {
  numero: 3,
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
          adaptacionesIndividuales: [
            {
              ninoId: 'sofia',
              necesidad: 'Sensibilidad sensorial (evita tocar texturas pegajosas)',
              ajuste: 'Ofrecerle un aplicador de pega en vez de pega-stick directo en la mano.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
            },
            {
              ninoId: 'mateo',
              necesidad: 'Aún no se sostiene de pie por sí solo',
              ajuste: 'Explorar la silueta en el piso, boca abajo, con apoyo directo de la maestra.',
              origen: 'necesidad_registrada',
              alcance: 'general_del_nino',
            },
          ],
          ninosFoco: [
            { ninoId: 'luca', meta: 'Tijeras', observar: 'Cortes consecutivos sin ayuda', skillId: 'tijeras', estadoFoco: 'pendiente' },
            { ninoId: 'zayne', meta: 'Números 6–8', observar: 'Reconoce solo, sin contar con el dedo', skillId: 'numeros-6-8', estadoFoco: 'pendiente' },
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
            { ninoId: 'zayne', meta: 'Números 6–8', observar: 'Cuenta dedos y ojos de sus compañeros sin ayuda.', skillId: 'numeros-6-8', estadoFoco: 'pendiente' },
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

export function actividadPorId(id: string): { actividad: Actividad; dia: DiaPlan } | undefined {
  for (const dia of PLANEACION_SEMANA_3.dias) {
    const actividad = dia.actividades.find((a) => a.id === id);
    if (actividad) return { actividad, dia };
  }
  return undefined;
}

/** La actividad "actual" de hoy — para el mockup fijo, mediodía-mañana del martes (fecha
 * de referencia de esta demo: 2026-09-15). En producción esto se calcula con la hora real. */
export function actividadActualHoy(): { actividad: Actividad; dia: DiaPlan } | undefined {
  return actividadPorId('mar-principal');
}

export function diaPorFecha(fecha: string): DiaPlan | undefined {
  return PLANEACION_SEMANA_3.dias.find((d) => d.fecha === fecha);
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
         (origen='observacion_dirigida', estado='aceptado').
     (b) ESPONTÁNEA — la maestra escribe/dicta libremente SIN elegir ningún skill antes. RAÍZ
         analiza la nota y SUGIERE posibles skills; la maestra acepta/rechaza/agrega, o guarda
         sin clasificar. Una observación válida puede tener 0, 1 o varios skills relacionados. ── */
export type OrigenObservacion = 'dirigida' | 'espontanea';
export type FuenteObservacion = 'texto' | 'voz' | 'seleccion_rapida';

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

/** Micro-observación de opciones rápidas (observación DIRIGIDA, fuente `seleccion_rapida`) — hoy
 * solo Tijeras tiene un set definido; el resto de habilidades cae a nota libre en ese mismo paso. */
export const OPCIONES_RAPIDAS_POR_SKILL: Record<string, string[]> = {
  tijeras: ['Pequeños recortes', 'Cortes consecutivos sin ayuda', 'Línea recta con ayuda', 'Línea recta independiente', 'No observado'],
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
