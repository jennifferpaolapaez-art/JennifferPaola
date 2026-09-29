/* ── CATÁLOGO PEDAGÓGICO OFICIAL RAÍZ (Sesión 6+ — preparación para producción) ──

   SLICE DE VALIDACIÓN, NO catálogo publicado: 6 habilidades elegidas para probar que la
   arquitectura completa funciona (Catálogo → Planeación base → Personalización → Observación →
   Evidencia/Progreso → Andamiaje → siguiente Planeación → Evaluación periódica) antes de llenar
   contenido real. Todo el texto pedagógico de este archivo es BORRADOR EDITORIAL RAÍZ — necesita
   revisión pedagógica del usuario antes de considerarse oficial (`CATALOGO_VERSION_DEMO.esDemo`).

   ADITIVO por diseño: no borra ni reemplaza `SKILLS_CATALOG`/`RUTAS_DEMO`/`PREGUNTAS_OBSERVABLES_DEMO`
   de `seed-data.ts`/`prioridades.ts` — los complementa para estas 6 skills y deja el resto del
   catálogo legado intacto. `RUTAS_DEMO` deja de ser la fuente para las 6 migradas mediante el
   adaptador `comoRutaDemo()` (ver `lib/prioridades.ts`), no porque se haya borrado.

   Principio de producto (aprobado por el usuario, ver ESTADO.md): estudiamos fuentes serias (CDC,
   Head Start, marcos de desarrollo infantil) para no dejar huecos de cobertura — nunca para copiar
   sus checklists/evaluaciones. Todo el contenido pedagógico de abajo es redacción propia de RAÍZ;
   cuando algo se apoya en una fuente externa, la procedencia queda en `FUENTES_LINK` (interna,
   nunca visible en la experiencia diaria de la maestra). */

import type { Bloque, EvidenciaRequerida, PoliticaRevision, TrackOpcional } from './seed-data';
import { evidenciaDeSkill, type EvidenciaDeSkill, type Nino, type ObservacionSkill, type Observacion } from './seed-data';

/* ── VERSIONADO ── */

export type EstadoCatalogVersion = 'borrador' | 'publicada' | 'retirada';

export interface CatalogVersion {
  id: string;
  nombre: string;
  version: string;
  estado: EstadoCatalogVersion;
  publicadoEn: string;
  /** Nunca ausente en esta fase — todo lo que vive en este archivo es slice de validación, no
   * contenido pedagógico revisado y aprobado para publicarse como oficial. */
  esDemo: boolean;
  notas?: string;
}

/** La única versión que existe hoy — slice de 6 skills. Una evaluación/reporte que la cite queda
 * fija a ESTA versión para siempre (ver `EvaluacionNino.cicloRevisionId`-style anclaje: aquí sería
 * `catalogVersionId`, reservado para cuando el resto del código empiece a citarlo). */
export const CATALOGO_VERSION_DEMO: CatalogVersion = {
  id: 'catalogo-demo-0',
  nombre: 'Catálogo RAÍZ — slice de validación',
  version: '0.1.0',
  estado: 'borrador',
  publicadoEn: '2026-09-27',
  esDemo: true,
  notas:
    'Slice de 6 habilidades (pinza, tijeras, palabras, interaccion-social, autonomia-alimentacion, ' +
    'nombre-propio) para validar la arquitectura del Catálogo Oficial. NO es contenido pedagógico ' +
    'oficial publicado — pendiente de revisión pedagógica del usuario.',
};

/* ── TEXTO LOCALIZADO — nunca "Blocks / Bloques" como un solo string (regla del usuario) ── */

export interface TextoLocalizado {
  es: string;
  /** Ausente = todavía sin traducir — nunca se finge una traducción. */
  en?: string;
}

/** Idioma pedido → `es` (idioma editorial base del catálogo) → lo que exista. Nunca lanza. */
export function textoLocalizado(t: TextoLocalizado, idioma: string): string {
  if (idioma === 'en' && t.en) return t.en;
  return t.es || t.en || '';
}

/* ── DOMINIOS — mismos slugs que `SKILLS_CATALOG` (Sesión 6 paso 4) para que `prettyDominio()` y
   toda agrupación existente sigan funcionando sin cambios. Subáreas = dominios hijos vía
   `parentId`, solo si algún día hacen falta — hoy ninguno los necesita. ── */

export interface Dominio {
  id: string;
  nombre: TextoLocalizado;
  parentId?: string;
}

export const DOMINIOS_OFICIALES: Dominio[] = [
  { id: 'motricidad_fina', nombre: { es: 'Motricidad fina', en: 'Fine Motor' } },
  { id: 'comunicacion_lenguaje', nombre: { es: 'Comunicación y lenguaje', en: 'Communication & Language' } },
  { id: 'interaccion_social', nombre: { es: 'Interacción social', en: 'Social Interaction' } },
  { id: 'autonomia', nombre: { es: 'Autonomía', en: 'Self-Help / Autonomy' } },
  { id: 'pre_literacy', nombre: { es: 'Pre-literacidad', en: 'Pre-Literacy' } },
];

/* ── FUENTES — procedencia interna, nunca visible en la experiencia diaria (regla del usuario,
   punto 10 de la decisión de andamiaje / punto 17 de esta especificación) ── */

export type TipoFuente = 'developmental_milestone_monitoring' | 'observational_practice_framework' | 'contenido_propio_raiz';

export interface SourceReference {
  id: string;
  nombre: string;
  organizacion?: string;
  framework?: string;
  versionFecha?: string;
  tipoReferencia: TipoFuente;
  notasUso?: string;
}

export const FUENTES_OFICIALES: SourceReference[] = [
  {
    id: 'src-cdc-milestones',
    nombre: 'Learn the Signs. Act Early.',
    organizacion: 'CDC',
    framework: 'Developmental Milestones',
    tipoReferencia: 'developmental_milestone_monitoring',
    notasUso: 'Consultado para revisar cobertura de hitos por edad — nunca copiado; el texto y los indicadores de RAÍZ son redacción propia.',
  },
  {
    id: 'src-headstart-elof',
    nombre: 'Early Learning Outcomes Framework',
    organizacion: 'Head Start / Office of Head Start (ECLKC)',
    framework: 'ELOF',
    tipoReferencia: 'observational_practice_framework',
    notasUso: 'Consultado para revisar cobertura de dominios de aprendizaje temprano y prácticas de observación — nunca copiado.',
  },
];

export type CampoConFuente = 'edadReferencia' | 'cobertura_dominio' | 'indicador' | 'general';

/** Trazabilidad a nivel de CAMPO (punto 17 del usuario: "la skill puede ser RAÍZ, pero su edad de
 * referencia proviene del CDC") — una sola tabla, sin agregar un campo de fuente a cada entidad. */
export interface SourceLink {
  sourceId: string;
  targetType: 'skill' | 'indicador' | 'dominio';
  targetId: string;
  campo: CampoConFuente;
  edadReferenciaMeses?: { min?: number; max?: number };
  nota?: string;
}

export const FUENTES_LINK: SourceLink[] = [
  { sourceId: 'src-cdc-milestones', targetType: 'skill', targetId: 'pinza', campo: 'edadReferencia', edadReferenciaMeses: { min: 9, max: 15 }, nota: 'Rango de referencia consultado para no dejar un hueco de cobertura en motricidad fina temprana.' },
  { sourceId: 'src-cdc-milestones', targetType: 'skill', targetId: 'palabras', campo: 'edadReferencia', edadReferenciaMeses: { min: 15, max: 30 } },
  { sourceId: 'src-headstart-elof', targetType: 'dominio', targetId: 'interaccion_social', campo: 'cobertura_dominio', nota: 'Cobertura del dominio revisada contra ELOF (Social and Emotional Development) — redacción propia.' },
  { sourceId: 'src-headstart-elof', targetType: 'dominio', targetId: 'pre_literacy', campo: 'cobertura_dominio' },
];

/* ── VOCABULARIOS ── */

/** Tipo de apoyo — SIN jerarquía entre valores (regla del usuario: "no asumir que visual < verbal
 * < físico sea una jerarquía universal"). */
export type TipoApoyo = 'modelado' | 'gesto' | 'pista_verbal' | 'apoyo_visual' | 'adaptacion_ambiente_material' | 'apoyo_fisico' | 'otro';

export const TIPO_APOYO_LABEL: Record<TipoApoyo, TextoLocalizado> = {
  modelado: { es: 'Modelado', en: 'Modeling' },
  gesto: { es: 'Gesto', en: 'Gesture' },
  pista_verbal: { es: 'Pista verbal', en: 'Verbal cue' },
  apoyo_visual: { es: 'Apoyo visual', en: 'Visual support' },
  adaptacion_ambiente_material: { es: 'Adaptación de ambiente o material', en: 'Environment/material adaptation' },
  apoyo_fisico: { es: 'Apoyo físico', en: 'Physical support' },
  otro: { es: 'Otro', en: 'Other' },
};

/** Grado de independencia — eje SEPARADO del tipo de apoyo (regla del usuario, punto 3). Reservado:
 * hoy nada lo escribe todavía (ni Observaciones ni ObservacionSkill) — ver "NO construido" abajo. */
export type GradoIndependencia = 'independiente' | 'con_apoyo' | 'apoyo_significativo' | 'no_determinado';

/* ── INDICADORES Y PREGUNTAS — entidades DISTINTAS, nunca fusionadas ni derivadas una de otra
   (regla del usuario, precisión 1). Las preguntas observables siguen viviendo en
   `PREGUNTAS_OBSERVABLES_DEMO` de `seed-data.ts` (mismo mecanismo, sin duplicar el tipo) — aquí
   solo se agregan las de las 6 skills que todavía no la tenían. ── */

export interface IndicadorObservable {
  id: string;
  skillId: string;
  texto: TextoLocalizado;
  /** REGLA TRANSVERSAL (guardrail del usuario): `alcance` es SOLO peso/orientación de la
   * evidencia — "parcial" pesa menos, "fuerte" pesa más. NINGUNO de los dos valores es un estado
   * automático, ni "emergente/adquirido", ni un puntaje, ni dominio. La maestra SIEMPRE confirma
   * el estado final; ver `evidenciaSuficientePara()`, que nunca escribe nada, solo sugiere. */
  alcance: 'parcial' | 'fuerte';
  /** Orden sugerido dentro de la skill — reemplaza los "pasos" de `RUTAS_DEMO`, sin volverlo una
   * secuencia obligatoria (es solo UN posible orden, ver `SkillRelation` para relaciones reales). */
  orden: number;
}

/* ── RELACIONES ENTRE SKILLS — progresión ≠ prerrequisito (regla del usuario, precisión 2). Unión
   discriminada: TypeScript exige `justificacion` en tiempo de compilación para cualquier relación
   `prerrequisito` — es estructuralmente imposible crear una sin justificar la dependencia real.

   REGLA TRANSVERSAL (guardrail del usuario) — ser CONSERVADOR: nunca agregar una relación solo
   porque dos skills comparten dominio. `relacionada` = hay una conexión útil de observar, SIN
   dependencia. `prerrequisito` exige una justificación pedagógica FUERTE (no "normalmente aparece
   antes"). `posible_siguiente` debe representar una progresión REAL, nunca "otra habilidad más
   avanzada" inventada solo para llenar la relación — si no hay una progresión genuina, la relación
   correcta es `relacionada` o simplemente no crear ninguna. ── */

export type SkillRelation =
  | { tipo: 'posible_siguiente'; desdeSkillId: string; haciaSkillId: string; nota?: string }
  | { tipo: 'relacionada'; desdeSkillId: string; haciaSkillId: string; nota?: string }
  | { tipo: 'prerrequisito'; desdeSkillId: string; haciaSkillId: string; justificacion: string; nota?: string };

/* ── OPORTUNIDADES DE OBSERVACIÓN — conectadas a los bloques/rutina YA configurables (`Bloque` de
   `seed-data.ts`), nunca una lista hardcodeada aparte (regla del usuario, punto 11). ── */

export interface OportunidadObservacion {
  skillId: string;
  bloque?: Bloque;
  /** Momento que no corresponde a ningún `Bloque` configurado todavía (ej. "transiciones",
   * "comidas" si el programa no los modela como bloque de rutina). */
  momento?: TextoLocalizado;
  nota?: TextoLocalizado;
}

/* ── ANDAMIAJES — sugerencias GENÉRICAS del catálogo. Un `ApoyoNino` específico SIEMPRE pesa más
   (regla del usuario, punto 12 — ver `prioridadAndamiaje()` abajo). ── */

export interface Andamiaje {
  id: string;
  skillId: string;
  tipoApoyo: TipoApoyo;
  texto: TextoLocalizado;
  aplicaCuando?: TextoLocalizado;
}

export interface SenalReducirApoyo {
  id: string;
  skillId: string;
  texto: TextoLocalizado;
  andamiajeId?: string;
}

/* ── EVIDENCIA — declarativa, nunca un motor clínico (regla del usuario, punto 14/L). Ninguna
   política aquí cambia un estado sola: `evidenciaSuficientePara()` solo devuelve una SUGERENCIA
   para que la maestra confirme, igual que ya hace `sugiereMarcarCumplida` en `plan-seguimiento.ts`. ── */

export interface PoliticaEvidenciaOficial {
  /** Mismo vocabulario que `SkillCatalogEntry.evidenciaRequerida` ya usa — no se inventa uno nuevo. */
  perfil: EvidenciaRequerida;
  /** Si `consistencia_repetida`, cuántas veces (mismo campo que `vecesMinimas` de hoy). */
  vecesMinimas?: number;
  /** Cuánto pesa una demostración CON apoyo como evidencia — nunca un cambio de estado (regla del
   * usuario: "el apoyo y el grado de independencia se registran como contexto de evidencia... nunca
   * auto-adquisición"). `con_apoyo_evidencia_parcial` = pesa menos que independiente, pero SIGUE
   * siendo evidencia real, nunca "cuenta como [estado]" — la maestra decide qué significa. */
  consideraApoyo: 'independiente_requerido' | 'con_apoyo_evidencia_parcial' | 'indiferente';
  orientacion?: TextoLocalizado;
}

/* ── LA SKILL OFICIAL — identidad + contenido en un solo registro (en este slice no hace falta
   separar `Skill`/`SkillRevision` en dos tablas: solo hay una versión de catálogo). `vigenteDesde`
   ancla cada skill a `CatalogVersion` para que una evaluación histórica pueda decir "esto se generó
   con la versión X" sin que una actualización futura la altere (punto 16 del usuario). ── */

export type EstadoSkillOficial = 'activa' | 'deprecada' | 'reemplazada';

export interface SkillOficial {
  id: string;
  dominioId: string;
  estado: EstadoSkillOficial;
  vigenteDesde: string; // CatalogVersion.id
  nombre: TextoLocalizado;
  descripcion?: TextoLocalizado;
  /** REGLA TRANSVERSAL (guardrail del usuario) — es una VENTANA DE RELEVANCIA, no un límite
   * rígido: sirve para priorizar, ordenar y sugerir qué revisar. NUNCA sirve para ocultar
   * rígidamente, diagnosticar, etiquetar retraso ni cambiar un estado. Una skill con historia,
   * evidencia, meta o selección manual de la maestra SIGUE VISIBLE aunque esté fuera de este rango
   * (confirmado por diseño: `skillsParaRevisionPeriodica()` en `lib/ciclo-revision.ts` nunca usa
   * este campo para EXCLUIR — solo lo consulta `comoSkillCatalogEntry()` como referencia). Separado
   * a propósito de cualquier `edadReferenciaMeses` de una fuente externa (ver `FUENTES_LINK`,
   * guardrail H) — "nueva por edad" significa SOLO "puede ser relevante observar/revisar aquí",
   * nunca "debería dominarla ya" ni "aún no = retraso" (guardrail 1). */
  rangoEdadRaiz: { min: number; max: number };
  politicaRevision: PoliticaRevision;
  politicaEvidencia: PoliticaEvidenciaOficial;
  /** Ausente = CORE. Un track AGREGA la skill a su selección — nunca la duplica (guardrail,
   * validación 12): la misma skill puede listar varios tracks sin copiarse. */
  trackIds?: TrackOpcional[];
  notaContexto?: TextoLocalizado;
}

/* ── LAS 6 SKILLS DEL SLICE (borrador editorial RAÍZ — pendiente de revisión pedagógica) ── */

export const SKILLS_OFICIALES: SkillOficial[] = [
  {
    id: 'pinza',
    dominioId: 'motricidad_fina',
    estado: 'activa',
    vigenteDesde: CATALOGO_VERSION_DEMO.id,
    nombre: { es: 'Agarre de pinza', en: 'Pincer grasp' },
    descripcion: { es: 'Usa el dedo índice y el pulgar para tomar objetos pequeños.' },
    rangoEdadRaiz: { min: 8, max: 14 },
    politicaRevision: 'seguimiento_periodico',
    politicaEvidencia: { perfil: 'multiples_contextos', consideraApoyo: 'indiferente', orientacion: { es: 'Se observa de manera consistente en más de una oportunidad natural — una sola demostración aislada no es dominio.' } },
  },
  {
    id: 'tijeras',
    dominioId: 'motricidad_fina',
    estado: 'activa',
    vigenteDesde: CATALOGO_VERSION_DEMO.id,
    nombre: { es: 'Uso de tijeras', en: 'Scissor use' },
    descripcion: { es: 'Sostiene y controla las tijeras con una mano para cortar papel de forma intencional.' },
    rangoEdadRaiz: { min: 36, max: 60 },
    politicaRevision: 'seguimiento_periodico',
    politicaEvidencia: { perfil: 'consistencia_repetida', vecesMinimas: 3, consideraApoyo: 'con_apoyo_evidencia_parcial', orientacion: { es: 'Repetido en distintos momentos antes de considerarse consistente — un solo corte no basta. Con apoyo cuenta como evidencia parcial, nunca como un estado nuevo por sí sola.' } },
  },
  {
    id: 'palabras',
    dominioId: 'comunicacion_lenguaje',
    estado: 'activa',
    vigenteDesde: CATALOGO_VERSION_DEMO.id,
    nombre: { es: 'Vocabulario de 2 palabras', en: '2-word vocabulary' },
    descripcion: { es: 'Combina dos palabras con intención comunicativa clara, más allá de una palabra suelta.' },
    rangoEdadRaiz: { min: 18, max: 36 },
    politicaRevision: 'seguimiento_periodico',
    politicaEvidencia: { perfil: 'multiples_contextos', consideraApoyo: 'indiferente', orientacion: { es: 'Distintos contextos y personas — no solo con la maestra, no solo en un tipo de juego. Cada niño desarrolla el lenguaje a su propio ritmo; uso funcional/comunicativo, nunca repetición obligatoria.' } },
  },
  {
    id: 'interaccion-social',
    dominioId: 'interaccion_social',
    estado: 'activa',
    vigenteDesde: CATALOGO_VERSION_DEMO.id,
    nombre: { es: 'Interacción con pares', en: 'Peer interaction' },
    descripcion: { es: 'Se relaciona con otros niños de forma cada vez más recíproca durante el juego.' },
    rangoEdadRaiz: { min: 18, max: 60 },
    politicaRevision: 'desarrollo_continuo',
    politicaEvidencia: { perfil: 'multiples_contextos', consideraApoyo: 'indiferente', orientacion: { es: 'El desarrollo social sigue moviéndose siempre — no hay un punto final de "dominado".' } },
    notaContexto: { es: 'Las formas de iniciar/mantener interacción varían por familia y cultura — nunca interpretar como aislamiento por sí solo un estilo distinto de interacción (regla del usuario, punto 19 de la especificación técnica).' },
  },
  {
    id: 'autonomia-alimentacion',
    dominioId: 'autonomia',
    estado: 'activa',
    vigenteDesde: CATALOGO_VERSION_DEMO.id,
    nombre: { es: 'Come solo con cuchara', en: 'Self-feeding with a spoon' },
    descripcion: { es: 'Lleva comida a la boca con cuchara de forma independiente durante la comida.' },
    rangoEdadRaiz: { min: 18, max: 36 },
    politicaRevision: 'una_vez_dominado',
    politicaEvidencia: { perfil: 'multiples_contextos', consideraApoyo: 'independiente_requerido', orientacion: { es: 'Evidencia funcional consistente en más de una oportunidad natural/comida — la autonomía funcional importa más que la perfección del movimiento.' } },
  },
  {
    id: 'nombre-propio',
    dominioId: 'pre_literacy',
    estado: 'activa',
    vigenteDesde: CATALOGO_VERSION_DEMO.id,
    nombre: { es: 'Escritura de nombre propio', en: 'Writing own name' },
    descripcion: { es: 'Escribe su nombre de forma reconocible, cada vez con menos apoyo de un modelo.' },
    rangoEdadRaiz: { min: 48, max: 60 },
    politicaRevision: 'una_vez_dominado',
    politicaEvidencia: { perfil: 'una_demostracion_clara', consideraApoyo: 'con_apoyo_evidencia_parcial', orientacion: { es: 'El apoyo (copiar un modelo) y la independencia se registran como contexto de la evidencia — ninguno cambia el estado por sí solo, la maestra confirma. Independencia puede ser evidencia fuerte, pero nunca una adquisición automática.' } },
    // Agregada a un track sin duplicar la skill (validación 12): hoy sigue siendo CORE en las
    // plantillas legado de evaluación (Sesión 6 paso 4) — este trackId es metadata adicional del
    // catálogo, no mueve su pertenencia legado.
    trackIds: ['kindergarten_readiness'],
  },
];

export function skillOficialPorId(id: string): SkillOficial | undefined {
  return SKILLS_OFICIALES.find((s) => s.id === id);
}

export function skillsOficialesDeTrack(track: TrackOpcional): SkillOficial[] {
  return SKILLS_OFICIALES.filter((s) => s.trackIds?.includes(track));
}

/* ── INDICADORES DE LAS 6 SKILLS (borrador editorial) ── */

export const INDICADORES_OFICIALES: IndicadorObservable[] = [
  { id: 'ind-pinza-1', skillId: 'pinza', texto: { es: 'Toma un objeto pequeño (una pasa, un cereal) usando el índice y el pulgar.' }, alcance: 'fuerte', orden: 1 },
  { id: 'ind-pinza-2', skillId: 'pinza', texto: { es: 'Suelta el objeto de forma intencional dentro de un recipiente.' }, alcance: 'parcial', orden: 2 },

  { id: 'ind-tijeras-1', skillId: 'tijeras', texto: { es: 'Abre y cierra las tijeras con ayuda de un adulto.' }, alcance: 'parcial', orden: 1 },
  { id: 'ind-tijeras-2', skillId: 'tijeras', texto: { es: 'Realiza pequeños recortes sin seguir una línea.' }, alcance: 'parcial', orden: 2 },
  { id: 'ind-tijeras-3', skillId: 'tijeras', texto: { es: 'Realiza cortes consecutivos sin ayuda.' }, alcance: 'fuerte', orden: 3 },
  { id: 'ind-tijeras-4', skillId: 'tijeras', texto: { es: 'Sigue una línea recta marcada al cortar.' }, alcance: 'fuerte', orden: 4 },

  { id: 'ind-palabras-1', skillId: 'palabras', texto: { es: 'Combina dos palabras con intención comunicativa ("más agua", "no quiero").' }, alcance: 'fuerte', orden: 1 },
  { id: 'ind-palabras-2', skillId: 'palabras', texto: { es: 'Usa la combinación en más de un contexto durante la semana.' }, alcance: 'fuerte', orden: 2 },

  { id: 'ind-social-1', skillId: 'interaccion-social', texto: { es: 'Permanece o interactúa cerca de otro niño durante el juego.' }, alcance: 'parcial', orden: 1 },
  { id: 'ind-social-2', skillId: 'interaccion-social', texto: { es: 'Inicia o responde a una interacción de otro niño.' }, alcance: 'parcial', orden: 2 },
  { id: 'ind-social-3', skillId: 'interaccion-social', texto: { es: 'Participa en una actividad compartida con otro niño.' }, alcance: 'fuerte', orden: 3 },
  { id: 'ind-social-4', skillId: 'interaccion-social', texto: { es: 'Sostiene breves intercambios o turnos apropiados a su etapa de desarrollo.' }, alcance: 'fuerte', orden: 4 },

  { id: 'ind-autonomia-1', skillId: 'autonomia-alimentacion', texto: { es: 'Sostiene la cuchara y se lleva comida a la boca solo, con derrames frecuentes.' }, alcance: 'parcial', orden: 1 },
  { id: 'ind-autonomia-2', skillId: 'autonomia-alimentacion', texto: { es: 'Come solo la mayor parte de la comida de forma independiente, sin importar algún derrame ocasional.' }, alcance: 'fuerte', orden: 2 },

  { id: 'ind-nombre-1', skillId: 'nombre-propio', texto: { es: 'Copia algunas letras de su nombre mirando un modelo.' }, alcance: 'parcial', orden: 1 },
  { id: 'ind-nombre-2', skillId: 'nombre-propio', texto: { es: 'Escribe su nombre completo de manera independiente, sin mirar un modelo.' }, alcance: 'fuerte', orden: 2 },
];

export function indicadoresDeSkill(skillId: string): IndicadorObservable[] {
  return INDICADORES_OFICIALES.filter((i) => i.skillId === skillId).sort((a, b) => a.orden - b.orden);
}

/* ── RELACIONES ── */

export const RELACIONES_OFICIALES: SkillRelation[] = [
  // Sin dependencia formal: comparten control/coordinación fina de la mano, pero tijeras NO es
  // imposible sin pinza — es una conexión útil, no una jerarquía (corrección del usuario: "no
  // digas que sin esa skill no es posible usar tijeras").
  { tipo: 'relacionada', desdeSkillId: 'tijeras', haciaSkillId: 'pinza', nota: 'Ambas involucran control y coordinación fina de la mano — una conexión útil de observar, sin que una dependa formalmente de la otra.' },
  // Ya no es "posible_siguiente" (progresión automática): queda como conexión sin dependencia,
  // nunca un siguiente paso inventado solo para llenar la relación.
  { tipo: 'relacionada', desdeSkillId: 'tijeras', haciaSkillId: 'nombre-propio', nota: 'Ambas involucran control fino de la mano y del lápiz/tijera — sin que una sea progresión automática de la otra.' },
  { tipo: 'relacionada', desdeSkillId: 'palabras', haciaSkillId: 'interaccion-social', nota: 'El vocabulario emergente suele apoyar la interacción con pares y viceversa — se desarrollan en paralelo, ninguna depende de la otra.' },
];

export function relacionesDesdeSkill(skillId: string): SkillRelation[] {
  return RELACIONES_OFICIALES.filter((r) => r.desdeSkillId === skillId);
}

export function relacionesHaciaSkill(skillId: string): SkillRelation[] {
  return RELACIONES_OFICIALES.filter((r) => r.haciaSkillId === skillId);
}

/* ── OPORTUNIDADES ── */

export const OPORTUNIDADES_OFICIALES: OportunidadObservacion[] = [
  { skillId: 'pinza', bloque: 'centros', nota: { es: 'Materiales pequeños en la mesa de centros (cuentas, cereal).' } },
  { skillId: 'pinza', momento: { es: 'Comidas' }, nota: { es: 'Tomar trozos pequeños de comida con los dedos.' } },
  { skillId: 'tijeras', bloque: 'centros' },
  { skillId: 'tijeras', bloque: 'principal', nota: { es: 'Cuando la actividad principal incluya recortar.' } },
  { skillId: 'palabras', bloque: 'circle' },
  { skillId: 'palabras', bloque: 'centros' },
  { skillId: 'interaccion-social', bloque: 'centros' },
  { skillId: 'interaccion-social', bloque: 'outdoor' },
  { skillId: 'autonomia-alimentacion', momento: { es: 'Comidas' } },
  { skillId: 'nombre-propio', bloque: 'prek', nota: { es: 'Mesa de Pre-K al llegar, firmando su trabajo.' } },
];

export function oportunidadesDeSkill(skillId: string): OportunidadObservacion[] {
  return OPORTUNIDADES_OFICIALES.filter((o) => o.skillId === skillId);
}

/* ── ANDAMIAJES Y SEÑALES ── */

export const ANDAMIAJES_OFICIALES: Andamiaje[] = [
  { id: 'and-pinza-1', skillId: 'pinza', tipoApoyo: 'modelado', texto: { es: 'Modelar cómo tomar el objeto con índice y pulgar antes de que lo intente.' } },
  { id: 'and-pinza-2', skillId: 'pinza', tipoApoyo: 'adaptacion_ambiente_material', texto: { es: 'Ofrecer objetos apenas más grandes que un cereal, no diminutos, para bajar la dificultad sin eliminar el reto.' } },

  { id: 'and-tijeras-1', skillId: 'tijeras', tipoApoyo: 'modelado', texto: { es: 'Modelar el primer corte y esperar antes de intervenir de nuevo.' } },
  { id: 'and-tijeras-2', skillId: 'tijeras', tipoApoyo: 'apoyo_visual', texto: { es: 'Marcar una línea gruesa y de alto contraste para seguir al cortar.' } },
  { id: 'and-tijeras-3', skillId: 'tijeras', tipoApoyo: 'apoyo_fisico', texto: { es: 'Sostener el papel mientras el niño corta, cuando lo pida o lo necesite.' }, aplicaCuando: { es: 'Solo si el niño todavía no puede sostener y cortar a la vez.' } },

  { id: 'and-palabras-1', skillId: 'palabras', tipoApoyo: 'pista_verbal', texto: { es: 'Verbalizar la acción del niño en el momento ("estás pidiendo más agua").' } },
  { id: 'and-palabras-2', skillId: 'palabras', tipoApoyo: 'gesto', texto: { es: 'Acompañar la palabra con un gesto o señal para reforzar el significado.' } },
  { id: 'and-palabras-3', skillId: 'palabras', tipoApoyo: 'pista_verbal', texto: { es: 'Modelado expansivo: si el niño dice "agua", el adulto responde ampliando ("más agua"), sin exigir que la repita.' } },

  { id: 'and-social-1', skillId: 'interaccion-social', tipoApoyo: 'otro', texto: { es: 'Esperar unos segundos antes de mediar un conflicto o intercambio entre niños.' } },
  { id: 'and-social-2', skillId: 'interaccion-social', tipoApoyo: 'modelado', texto: { es: 'Modelar una frase simple para pedir turno o unirse al juego.' } },

  { id: 'and-autonomia-1', skillId: 'autonomia-alimentacion', tipoApoyo: 'adaptacion_ambiente_material', texto: { es: 'Ofrecer una cuchara pequeña y un plato con borde alto que ayude a llevar la comida.' } },
  { id: 'and-autonomia-2', skillId: 'autonomia-alimentacion', tipoApoyo: 'modelado', texto: { es: 'Modelar el movimiento de llenar la cuchara sin hacerlo por el niño.' } },

  { id: 'and-nombre-1', skillId: 'nombre-propio', tipoApoyo: 'apoyo_visual', texto: { es: 'Tener su nombre modelo a la vista mientras practica.' } },
  { id: 'and-nombre-2', skillId: 'nombre-propio', tipoApoyo: 'pista_verbal', texto: { es: 'Nombrar cada letra en voz alta mientras el niño la traza.' } },
];

export const SENALES_REDUCIR_APOYO_OFICIALES: SenalReducirApoyo[] = [
  { id: 'sen-pinza-1', skillId: 'pinza', texto: { es: 'Toma el objeto con índice y pulgar sin que se le muestre antes.' }, andamiajeId: 'and-pinza-1' },
  { id: 'sen-tijeras-1', skillId: 'tijeras', texto: { es: 'Empieza a cortar sin esperar el modelo de la maestra.' }, andamiajeId: 'and-tijeras-1' },
  { id: 'sen-palabras-1', skillId: 'palabras', texto: { es: 'Combina las dos palabras sin que un adulto las verbalice primero.' }, andamiajeId: 'and-palabras-1' },
  { id: 'sen-social-1', skillId: 'interaccion-social', texto: { es: 'Se sostiene un momento más en la interacción antes de buscar a un adulto — no una medida de éxito, solo una señal para pausar antes de mediar.' }, andamiajeId: 'and-social-1' },
  { id: 'sen-autonomia-1', skillId: 'autonomia-alimentacion', texto: { es: 'Llena la cuchara sin que se le recuerde el movimiento.' }, andamiajeId: 'and-autonomia-2' },
  { id: 'sen-nombre-1', skillId: 'nombre-propio', texto: { es: 'Escribe su nombre sin mirar el modelo.' }, andamiajeId: 'and-nombre-1' },
];

export function andamiajesDeSkill(skillId: string): Andamiaje[] {
  return ANDAMIAJES_OFICIALES.filter((a) => a.skillId === skillId);
}

export function senalesReducirApoyoDeSkill(skillId: string): SenalReducirApoyo[] {
  return SENALES_REDUCIR_APOYO_OFICIALES.filter((s) => s.skillId === skillId);
}

/** ApoyoNino específico > andamiaje genérico del catálogo (regla del usuario, punto 12). Función
 * PURA de prioridad — no está conectada todavía a la generación en vivo de
 * `calcularPersonalizacionSemana` (eso es un paso posterior, fuera de este slice, ver ESTADO.md);
 * aquí se prueba y valida el criterio de prioridad de forma aislada. `contextoSkill` es el
 * `ContextoActividad` que corresponde a esta skill (ej. 'tijeras') — hoy es lo único que liga un
 * `ApoyoNino` a un contexto pedagógico concreto; sin ese contexto no hay forma honesta de decidir
 * si un apoyo del niño aplica a ESTA skill específica, así que la función simplemente no inventa
 * una coincidencia. */
export function sugerenciaDeApoyo(nino: Nino, skillId: string, contextoSkill?: import('./seed-data').ContextoActividad): { texto: string; origen: 'apoyo_especifico_nino' | 'andamiaje_catalogo' } | undefined {
  const especifico = contextoSkill ? (nino.apoyos ?? []).find((a) => a.activa && a.contextosRelevantes?.includes(contextoSkill)) : undefined;
  if (especifico) return { texto: especifico.estrategia, origen: 'apoyo_especifico_nino' };
  const generico = andamiajesDeSkill(skillId)[0];
  if (generico) return { texto: textoLocalizado(generico.texto, 'es'), origen: 'andamiaje_catalogo' };
  return undefined;
}

/* ── EVIDENCIA — sugerencia, nunca decisión automática ── */

/** ¿La evidencia acumulada alcanza el perfil que ESTA skill pide? Es una SUGERENCIA — jamás cambia
 * `estadoDesarrollo` sola (mismo principio que `sugiereMarcarCumplida` en `plan-seguimiento.ts`).
 * "Múltiples contextos" se aproxima con fechas u observaciones ligadas a actividades distintas
 * (proxy honesto: no existe todavía un campo `contexto` propio en `Observacion`). */
export function evidenciaSuficientePara(skillId: string, ninoId: string, observaciones: Observacion[], relaciones: ObservacionSkill[]): boolean {
  const skill = skillOficialPorId(skillId);
  if (!skill) return false;
  const evidencia = evidenciaDeSkill(ninoId, skillId, observaciones, relaciones);
  const { perfil, vecesMinimas } = skill.politicaEvidencia;
  if (perfil === 'una_demostracion_clara') return evidencia.length >= 1;
  if (perfil === 'consistencia_repetida') return evidencia.length >= (vecesMinimas ?? 3);
  if (perfil === 'multiples_contextos') {
    const contextos = new Set(evidencia.map((e: EvidenciaDeSkill) => e.observacion.actividadId ?? e.observacion.fecha));
    return contextos.size >= 2;
  }
  return false;
}

/* ── ADAPTADOR PARA `RUTAS_DEMO` (Sesión 6, paso 7 / preparación producción) ──

   `lib/prioridades.ts` deja de leer `RUTAS_DEMO[skillId]` directamente para las 6 skills migradas:
   llama a `rutaDemoDesdeOficial()` primero y solo cae a `RUTAS_DEMO` para las skills que NO están
   en este catálogo todavía (validación "RUTAS_DEMO deja de actuar como segunda fuente de verdad
   para las skills migradas"). La forma del objeto devuelto coincide ESTRUCTURALMENTE con la
   interfaz privada `RutaDemo` de `prioridades.ts` (TypeScript la acepta por tipado estructural, sin
   necesidad de exportar ese tipo ni duplicarlo aquí). */
export function rutaDemoDesdeOficial(skillId: string):
  | {
      skillId: string;
      raices: { skillId?: string; nombre: string }[];
      pasos: { id: string; senales: string[]; logrado: string; proximo: string; meta: string }[];
      estrategias: string[];
      oportunidades: string[];
      queObservar: string[];
      semanasRevision: number;
    }
  | undefined {
  const skill = skillOficialPorId(skillId);
  if (!skill) return undefined;

  const raices = relacionesDesdeSkill(skillId)
    .filter((r) => r.tipo === 'prerrequisito')
    .map((r) => {
      const haciaSkill = skillOficialPorId(r.haciaSkillId);
      return { skillId: r.haciaSkillId, nombre: haciaSkill ? textoLocalizado(haciaSkill.nombre, 'es') : r.haciaSkillId };
    });

  const indicadores = indicadoresDeSkill(skillId);
  const pasos = indicadores.slice(1).map((ind, i) => ({
    id: ind.id,
    senales: [],
    logrado: textoLocalizado(indicadores[i].texto, 'es'),
    proximo: textoLocalizado(ind.texto, 'es'),
    meta: textoLocalizado(ind.texto, 'es'),
  }));

  return {
    skillId,
    raices,
    pasos,
    estrategias: andamiajesDeSkill(skillId).map((a) => textoLocalizado(a.texto, 'es')),
    oportunidades: oportunidadesDeSkill(skillId).map((o) => textoLocalizado(o.nota ?? o.momento ?? { es: o.bloque ?? '' }, 'es')).filter(Boolean),
    queObservar: indicadores.map((i) => textoLocalizado(i.texto, 'es')),
    semanasRevision: 4,
  };
}

/** Adaptador — traduce la skill oficial a la forma que `SkillCatalogEntry` ya usa, para pantallas
 * que en el futuro quieran leer el catálogo nuevo sin cambiar su tipo. NO se conecta a las
 * pantallas todavía en este slice (`SKILLS_CATALOG` de `seed-data.ts` sigue siendo lo que leen hoy
 * evaluación/planeación/progreso — ver ESTADO.md, "qué no se conectó todavía"). */
export function comoSkillCatalogEntry(skillId: string): { id: string; dominio: string; nombre: string; rangoEdadMesesMin: number; rangoEdadMesesMax: number; prerrequisitos: string[]; politicaRevision: PoliticaRevision; evidenciaRequerida: EvidenciaRequerida } | undefined {
  const skill = skillOficialPorId(skillId);
  if (!skill) return undefined;
  return {
    id: skill.id,
    dominio: skill.dominioId,
    nombre: textoLocalizado(skill.nombre, 'es'),
    rangoEdadMesesMin: skill.rangoEdadRaiz.min,
    rangoEdadMesesMax: skill.rangoEdadRaiz.max,
    prerrequisitos: relacionesDesdeSkill(skillId).filter((r) => r.tipo === 'prerrequisito').map((r) => r.haciaSkillId),
    politicaRevision: skill.politicaRevision,
    evidenciaRequerida: skill.politicaEvidencia.perfil,
  };
}

/** IDs migrados a este catálogo — punto único de verdad para "¿esta skill ya no debe leer
 * RUTAS_DEMO?". */
export const SKILLS_MIGRADAS_IDS = new Set(SKILLS_OFICIALES.map((s) => s.id));
