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

export type Etapa = 'Infant' | 'Toddler' | 'Preschool' | 'Pre-K';
export type EstadoSkill = 'dominado' | 'en_desarrollo' | 'no_observado';

export interface Skill {
  id: string;
  nombre: string;
  estado: EstadoSkill;
  actualizado: string; // ISO
}

export interface Nino {
  id: string;
  nombre: string;
  etapa: Etapa;
  edadTexto: string; // "3 años 8 meses"
  colorTint: 'coral' | 'sage' | 'butter' | 'teal';
  skills: Skill[];
  /** Meta activa (si tiene foco hoy) — se muestra en Hoy/Niños foco. */
  metaActiva?: { skillId: string; nota: string };
  /** Asistencia PROGRAMADA (horario configurado) — de aquí se DERIVA si hoy le tocaba venir; la
   * presencia REAL de cada día vive aparte, en ASISTENCIA_HOY (regla del usuario, Sesión 5
   * ronda 3: nunca mezclar planificación con realidad). */
  diasAsistencia: DiaSemana[];
}

export const NINOS: Nino[] = [
  {
    id: 'luca',
    nombre: 'Luca',
    etapa: 'Preschool',
    edadTexto: '3 años 8 meses',
    colorTint: 'coral',
    metaActiva: { skillId: 'tijeras', nota: 'Tijeras' },
    diasAsistencia: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    skills: [
      { id: 'tijeras', nombre: 'Tijeras', estado: 'en_desarrollo', actualizado: '2026-09-08' },
      { id: 'numeros-1-8', nombre: 'Números 1–8', estado: 'dominado', actualizado: '2026-08-20' },
      { id: 'colores', nombre: 'Reconoce colores', estado: 'dominado', actualizado: '2026-08-15' },
      { id: 'nombre', nombre: 'Escritura de nombre', estado: 'no_observado', actualizado: '2026-07-01' },
    ],
  },
  {
    id: 'zayne',
    nombre: 'Zayne',
    etapa: 'Pre-K',
    edadTexto: '4 años 5 meses',
    colorTint: 'sage',
    metaActiva: { skillId: 'numeros-6-8', nota: 'Números 6–8' },
    diasAsistencia: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    skills: [
      { id: 'numeros-6-8', nombre: 'Conteo 6–8', estado: 'en_desarrollo', actualizado: '2026-09-09' },
      { id: 'rima', nombre: 'Identifica rimas', estado: 'dominado', actualizado: '2026-08-28' },
      { id: 'nombre-propio', nombre: 'Escritura de nombre', estado: 'dominado', actualizado: '2026-08-01' },
      { id: 'tijeras-z', nombre: 'Tijeras', estado: 'dominado', actualizado: '2026-07-20' },
    ],
  },
  {
    id: 'sofia',
    nombre: 'Sofía',
    etapa: 'Toddler',
    edadTexto: '2 años 1 mes',
    colorTint: 'butter',
    diasAsistencia: ['Lun', 'Mar', 'Jue'],
    skills: [
      { id: 'palabras', nombre: 'Vocabulario de 2 palabras', estado: 'en_desarrollo', actualizado: '2026-09-05' },
      { id: 'apilar', nombre: 'Apila 4+ bloques', estado: 'dominado', actualizado: '2026-08-22' },
    ],
  },
  {
    id: 'mateo',
    nombre: 'Mateo',
    etapa: 'Infant',
    edadTexto: '11 meses',
    colorTint: 'teal',
    diasAsistencia: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'],
    skills: [
      { id: 'gateo', nombre: 'Gateo cruzado', estado: 'dominado', actualizado: '2026-08-30' },
      { id: 'pinza', nombre: 'Agarre de pinza', estado: 'en_desarrollo', actualizado: '2026-09-10' },
    ],
  },
];

export const ETAPAS_ORDEN: Etapa[] = ['Infant', 'Toddler', 'Preschool', 'Pre-K'];

export const TINT_HEX: Record<Nino['colorTint'], string> = {
  teal: '#0D5C63',
  butter: '#B58A1E',
  coral: '#C85D48',
  sage: '#4F6249',
};

export function ninoPorId(id: string): Nino | undefined {
  return NINOS.find((n) => n.id === id);
}

export function ninosConFocoHoy(): Nino[] {
  return NINOS.filter((n) => n.metaActiva);
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
            Toddler: 'Imita 1-2 gestos de la canción.',
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
            Toddler: 'Se acuesta un momento breve con ayuda.',
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
            Toddler: 'Señala, imita el gesto, repite una palabra si puede.',
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
            Toddler: 'Pega piezas grandes de tela con pega-stick en su propia silueta.',
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
            Toddler: 'Imita 1-2 movimientos simples (saltar, estirar) junto a la maestra.',
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
            Toddler: 'Señala partes de su cara en el espejo cuando se le nombran.',
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
            Toddler: 'Señala el animal cuando se le pregunta "¿dónde está?".',
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
            Toddler: 'Hace su huella con ayuda directa de la maestra.',
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
            Toddler: 'Imita 1-2 movimientos del libro.',
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
            Toddler: 'Señala el ojo o la oreja cuando se le nombra.',
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
            Toddler: 'Imita "revisar" a un muñeco con el estetoscopio.',
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
            Toddler: 'Señala 1 palabra de la semana cuando se nombra.',
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
   NOTA: `EtapaAtendida` es un tipo PROPIO de esta pantalla, deliberadamente separado de `Etapa`
   (el que usan Nino/Actividad/diferenciacion en las 18 actividades ya aprobadas de la semana
   demo) para no romperlas con la división Toddler Jr/Sr. Se reconcilian cuando se construya
   Módulo Niños/Planeación (pasos 3 y 5 del orden acordado) — no antes. ── */

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

export type EtapaAtendida = 'Infant' | 'Toddler Jr' | 'Toddler Sr' | 'Preschool' | 'Pre-K';
export const ETAPAS_ATENDIDAS_ORDEN: EtapaAtendida[] = ['Infant', 'Toddler Jr', 'Toddler Sr', 'Preschool', 'Pre-K'];

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
  etapasAtendidas: EtapaAtendida[];
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
