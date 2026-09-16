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
}

export const NINOS: Nino[] = [
  {
    id: 'luca',
    nombre: 'Luca',
    etapa: 'Preschool',
    edadTexto: '3 años 8 meses',
    colorTint: 'coral',
    metaActiva: { skillId: 'tijeras', nota: 'Tijeras' },
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
  | 'cierre';

export const BLOQUE_LABEL: Record<Bloque, string> = {
  circle: 'Circle Time',
  principal: 'Actividad principal',
  steam: 'STEAM',
  centros: 'Centros',
  lectura: 'Lectura',
  outdoor: 'Outdoor / Movimiento',
  prek: 'Trabajo Pre-K',
  cierre: 'Cierre / Reflexión',
};

/** Adaptación por una necesidad puntual de UN niño (capa B) — nunca implica Plan Individual. */
export interface AdaptacionIndividual {
  ninoId: string;
  necesidad: string;
  ajuste: string;
}

/** Niño cuya meta/skill activa se observa a propósito en ESTA actividad (capa C) — objetivo
 * individual: cómo esa misma experiencia grupal sirve a su meta puntual. */
export interface NinoFocoActividad {
  ninoId: string;
  meta: string;
  observar: string;
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
  /** Adaptación por ETAPA (capa A) — solo las actividades que lo ameritan la tienen. */
  diferenciacion?: Record<Etapa, string>;
  adaptacionesIndividuales?: AdaptacionIndividual[];
  ninosFoco?: NinoFocoActividad[];
  queObservar?: string;
  evidenciaPosible?: string;
  printable?: string;
  notas?: string;
}

export interface DiaPlan {
  dia: 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie';
  fecha: string; // ISO
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
      actividades: [
        {
          id: 'lun-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Canción "Cabeza, hombros"',
          objetivo: 'Introducir el vocabulario de partes del cuerpo con música y movimiento.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Ninguno (canción con gestos)', disponible: true }],
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
        },
        {
          id: 'lun-outdoor',
          bloque: 'outdoor',
          hora: '10:30',
          titulo: 'Circuito motor',
          objetivo: 'Practicar equilibrio y coordinación gruesa.',
          dominio: 'Motricidad gruesa',
          materiales: [{ nombre: 'Aros y conos', disponible: true }],
        },
        {
          id: 'lun-centros',
          bloque: 'centros',
          hora: '15:30',
          titulo: 'Centro de bloques + Ciencias',
          objetivo: 'Juego libre con materiales ya explorados en círculo.',
          dominio: 'Exploración y juego libre',
          materiales: [{ nombre: 'Bloques', disponible: true }, { nombre: 'Lupas', disponible: true }],
        },
      ],
    },
    {
      dia: 'Mar',
      fecha: '2026-09-15',
      actividades: [
        {
          id: 'mar-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — Mi cuerpo',
          objetivo: 'Repasar el vocabulario de la semana antes de la actividad principal.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Libro "Mi cuerpo y yo"', disponible: true }],
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
            },
            {
              ninoId: 'mateo',
              necesidad: 'Aún no se sostiene de pie por sí solo',
              ajuste: 'Explorar la silueta en el piso, boca abajo, con apoyo directo de la maestra.',
            },
          ],
          ninosFoco: [
            { ninoId: 'luca', meta: 'Tijeras', observar: 'Cortes consecutivos sin ayuda' },
            { ninoId: 'zayne', meta: 'Números 6–8', observar: 'Reconoce solo, sin contar con el dedo' },
          ],
          queObservar: 'Quién nombra la parte del cuerpo sin que se le pregunte, y quién necesita el modelo de la maestra.',
          evidenciaPosible: 'Foto de la silueta terminada + la frase textual que dijo el niño al pegar.',
        },
        {
          id: 'mar-outdoor',
          bloque: 'outdoor',
          hora: '10:30',
          titulo: 'Juego libre en patio',
          objetivo: 'Movimiento grueso y socialización libre.',
          dominio: 'Motricidad gruesa',
          materiales: [{ nombre: 'Patio/juegos exteriores', disponible: true }],
        },
        {
          id: 'mar-steam',
          bloque: 'steam',
          hora: '11:30',
          titulo: 'STEAM: espejos',
          objetivo: 'Explorar la simetría del propio rostro con espejos.',
          dominio: 'Pensamiento científico',
          materiales: [{ nombre: 'Espejos irrompibles', disponible: true }],
        },
        {
          id: 'mar-centros',
          bloque: 'centros',
          hora: '15:30',
          titulo: 'Centros: Ciencias + Bloques',
          objetivo: 'Profundizar en lo explorado en STEAM, en juego libre.',
          dominio: 'Exploración y juego libre',
          materiales: [{ nombre: 'Lupas', disponible: true }, { nombre: 'Bloques', disponible: true }],
        },
      ],
    },
    {
      dia: 'Mié',
      fecha: '2026-09-16',
      actividades: [
        {
          id: 'mie-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — ¿Qué hacen mis manos?',
          objetivo: 'Conectar partes del cuerpo con acciones que realizan.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Ninguno', disponible: true }],
        },
        {
          id: 'mie-steam',
          bloque: 'steam',
          hora: '9:50',
          titulo: 'STEAM: huellas de manos y pies',
          objetivo: 'Comparar tamaños y formas usando pintura no tóxica.',
          dominio: 'Pensamiento científico',
          materiales: [{ nombre: 'Pintura no tóxica', disponible: true }, { nombre: 'Papel', disponible: true }],
        },
        {
          id: 'mie-lectura',
          bloque: 'lectura',
          hora: '11:00',
          titulo: 'Cuento: "De pies a cabeza"',
          objetivo: 'Escuchar y anticipar partes del cuento con apoyo visual.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Libro ilustrado', disponible: true }],
        },
        {
          id: 'mie-prek',
          bloque: 'prek',
          hora: '13:30',
          titulo: 'Pre-K: escritura de partes del cuerpo',
          objetivo: 'Practicar trazo de letras copiando palabras cortas.',
          dominio: 'Preescritura',
          materiales: [{ nombre: 'Fichas de trazo', disponible: true }],
        },
      ],
    },
    {
      dia: 'Jue',
      fecha: '2026-09-17',
      actividades: [
        {
          id: 'jue-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — los 5 sentidos',
          objetivo: 'Introducir cada sentido con un objeto real.',
          dominio: 'Pensamiento científico',
          materiales: [{ nombre: 'Caja sensorial', disponible: true }],
        },
        {
          id: 'jue-principal',
          bloque: 'principal',
          hora: '9:50',
          titulo: 'Dramático: en el consultorio',
          objetivo: 'Practicar vocabulario del cuerpo a través del juego de roles.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Bata y estetoscopio de juguete', disponible: true }],
        },
        {
          id: 'jue-outdoor',
          bloque: 'outdoor',
          hora: '10:30',
          titulo: 'Carrera de obstáculos',
          objetivo: 'Coordinación gruesa y seguimiento de instrucciones.',
          dominio: 'Motricidad gruesa',
          materiales: [{ nombre: 'Conos', disponible: true }],
        },
      ],
    },
    {
      dia: 'Vie',
      fecha: '2026-09-18',
      actividades: [
        {
          id: 'vie-circle',
          bloque: 'circle',
          hora: '9:30',
          titulo: 'Circle Time — repaso de la semana',
          objetivo: 'Recordar en grupo el vocabulario aprendido.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Silueta de Lunes', disponible: true }],
        },
        {
          id: 'vie-centros',
          bloque: 'centros',
          hora: '9:50',
          titulo: 'Centro de matemáticas: contar partes del cuerpo',
          objetivo: 'Practicar conteo 6–8 con un contexto significativo.',
          dominio: 'Matemáticas tempranas',
          materiales: [{ nombre: 'Fichas de conteo', disponible: true }],
          ninosFoco: [{ ninoId: 'zayne', meta: 'Números 6–8', observar: 'Cuenta dedos y ojos de sus compañeros sin ayuda' }],
        },
        {
          id: 'vie-cierre',
          bloque: 'cierre',
          hora: '15:00',
          titulo: 'Cierre: mi parte favorita',
          objetivo: 'Reflexionar verbalmente sobre lo aprendido en la semana.',
          dominio: 'Lenguaje y vocabulario',
          materiales: [{ nombre: 'Ninguno', disponible: true }],
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
