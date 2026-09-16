// DATOS SEMILLA — app interna de RAIZ. Nunca se enseña vacía (32-DEL-MVP-AL-PRODUCTO.md):
// nombres reales del mundo del avatar, actividades con contenido real, fechas plausibles.
// Message-match con los mockups ya mostrados en la landing (AppPorDentro): misma actividad
// "Collage del cuerpo", mismos niños foco (Luca/tijeras, Zayne/números).
// Persistencia: ninguna todavía — Supabase se conecta en la fase de servicios externos (51/62).
// Este archivo es la única fuente de verdad mientras tanto.

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

export interface ActividadDia {
  titulo: string;
  momento: string; // "Círculo"
  tema: string; // "Mi cuerpo"
  diferenciacion: Record<Etapa, string>;
  materiales: { nombre: string; disponible: boolean }[];
}

export interface DiaSemana {
  dia: 'Lun' | 'Mar' | 'Mié' | 'Jue' | 'Vie';
  fecha: string; // ISO
  titulo: string;
  focoTexto: string;
  hoy?: boolean;
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

export const ACTIVIDAD_HOY: ActividadDia = {
  titulo: 'Collage del cuerpo',
  momento: 'Círculo',
  tema: 'Mi cuerpo',
  diferenciacion: {
    Infant: 'Explora texturas de tela sobre una silueta grande, con apoyo.',
    Toddler: 'Pega piezas grandes de tela con pega-stick en su propia silueta.',
    Preschool: 'Nombra cada parte del cuerpo mientras pega y recorta con tijeras.',
    'Pre-K': 'Escribe el nombre de 3 partes del cuerpo junto a su silueta.',
  },
  materiales: [
    { nombre: 'Telas de colores', disponible: true },
    { nombre: 'Pega-stick', disponible: true },
    { nombre: 'Tijeras de punta roma', disponible: true },
    { nombre: 'Papel craft grande', disponible: false },
  ],
};

export const SEMANA: DiaSemana[] = [
  { dia: 'Lun', fecha: '2026-09-15', titulo: 'Círculo: cuerpo', focoTexto: 'Foco: Luca — tijeras', hoy: true },
  { dia: 'Mar', fecha: '2026-09-16', titulo: 'Body collage', focoTexto: 'Foco: identidad' },
  { dia: 'Mié', fecha: '2026-09-17', titulo: 'STEAM: espejos', focoTexto: 'Foco: Zayne — números' },
  { dia: 'Jue', fecha: '2026-09-18', titulo: 'Dramático: doctor', focoTexto: 'Foco: lenguaje' },
  { dia: 'Vie', fecha: '2026-09-19', titulo: 'Centro de matemáticas', focoTexto: 'Foco: Zayne — 6-8' },
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
