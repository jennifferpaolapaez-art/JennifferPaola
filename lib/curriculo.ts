/* ── CURRÍCULO ANUAL (nueva capa sobre Planeación — Parte A de 4: A Currículo Anual → B Diseño
   del Mes → C Calendario Pedagógico Real → D Calendario → Planeación existente) ──

   Decisión arquitectónica completa en ESTADO.md ("Planeación deja de asumir mes = 4 semanas
   fijas"). Esta capa es la CIMA de la jerarquía: el mapa de contenido del año. NO reemplaza la
   metodología del programa, y NO obliga a nadie a trabajar con Tema+Color+Número+Letras+Forma —
   eso es SOLO el set sugerido de un currículo entre muchos posibles; cada programa elige qué
   campos usa (`ProgramaConfig.camposCurriculoAnual`).

   Esta parte (A) NO toca Planeación/Semana/Hoy en absoluto — son módulos totalmente
   independientes todavía. La conexión real llega en la parte D. ── */

import { FECHA_HOY, leerProgramaConfig, type CampoCurriculoDef, type ProgramaConfig } from './seed-data';

/** Un campo del currículo acepta UN valor (ej. Color: "Yellow") o VARIOS (ej. Letras: "A, M") —
 * nunca se fuerza todo a una sola cadena de texto (precisión del usuario). */
export type ValorCampoCurriculo = { tipo: 'unico'; valor: string } | { tipo: 'lista'; valores: string[] };

export function valorVacio(tipo: 'unico' | 'lista'): ValorCampoCurriculo {
  return tipo === 'unico' ? { tipo: 'unico', valor: '' } : { tipo: 'lista', valores: [] };
}

/** ¿Tiene contenido real? — para saber si un mes/campo cuenta como "completado" en el resumen. */
export function valorTieneContenido(v: ValorCampoCurriculo | undefined): boolean {
  if (!v) return false;
  return v.tipo === 'unico' ? v.valor.trim().length > 0 : v.valores.length > 0;
}

/** Catálogo SUGERIDO (DEMO) — ninguno está activo por defecto; el programa elige cuáles usar en
 * `/curriculo/campos`. También puede agregar campos propios con el mismo tipo unico/lista. */
export const CAMPOS_CURRICULO_SUGERIDOS: CampoCurriculoDef[] = [
  { id: 'color', etiqueta: 'Color', tipo: 'unico' },
  { id: 'numero', etiqueta: 'Número', tipo: 'unico' },
  { id: 'letras', etiqueta: 'Letras', tipo: 'lista' },
  { id: 'forma', etiqueta: 'Forma', tipo: 'unico' },
  { id: 'valor', etiqueta: 'Valor del mes', tipo: 'unico' },
  { id: 'personaje', etiqueta: 'Personaje o persona del mes', tipo: 'unico' },
  { id: 'enfoque_cultural', etiqueta: 'Enfoque cultural', tipo: 'unico' },
  { id: 'concepto_matematico', etiqueta: 'Concepto matemático', tipo: 'unico' },
  { id: 'canciones', etiqueta: 'Canciones', tipo: 'lista' },
  { id: 'libros', etiqueta: 'Libros', tipo: 'lista' },
  { id: 'estacion', etiqueta: 'Estación / seasonal focus', tipo: 'unico' },
];

/** UN mes dentro del mapa anual. `tema` es el único campo fijo (siempre presente en todo
 * currículo, sea cual sea la metodología); el resto vive en `campos`, keyed por
 * `CampoCurriculoDef.id`, y solo existen los que el programa activó. */
export interface MesCurricularAnual {
  mes: number; // 1-12
  tema: string;
  campos: Record<string, ValorCampoCurriculo>;
}

export type OrigenCurriculo = 'maestra' | 'raiz_sugerido';

/** Un currículo anual completo. `meses` puede tener de 0 a 12 entradas — un mes sin entrada
 * simplemente no está definido todavía (regla del usuario: "puedo completar los 12 meses o dejar
 * algunos incompletos"). */
export interface CurriculoAnual {
  id: string;
  nombre: string;
  anio: number;
  estado: 'activo' | 'archivado';
  origen: OrigenCurriculo;
  fechaCreacion: string;
  meses: MesCurricularAnual[];
}

export const MES_NOMBRE: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril', 5: 'Mayo', 6: 'Junio',
  7: 'Julio', 8: 'Agosto', 9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

/** Plantilla DEMO para "Ayúdame a crearlo" — temas genéricos, sin sesgo de hemisferio, marcados
 * explícitamente como punto de partida editable. NO es generación pedagógica real (esa llega con
 * IA real, fase de servicios externos) — es una regla fija, igual de honesta que las rutas demo de
 * Plan Individual. Nunca se le presenta a la maestra como "tu currículo ya está listo". */
export const TEMAS_PLANTILLA_DEMO: Record<number, string> = {
  1: 'Nuevos comienzos', 2: 'La familia', 3: 'La naturaleza', 4: 'Los animales',
  5: 'Mi comunidad', 6: 'El agua y los sentidos', 7: 'El movimiento y mi cuerpo',
  8: 'Bienvenida y nuevos amigos', 9: 'Todo sobre mí', 10: 'Colores y texturas',
  11: 'Gratitud y comunidad', 12: 'Celebraciones y luz',
};

const CURRICULOS_STORAGE_KEY = 'raiz_curriculos_anuales';

export function leerCurriculosAnuales(): CurriculoAnual[] {
  if (typeof window === 'undefined') return [];
  try {
    const guardado = window.localStorage.getItem(CURRICULOS_STORAGE_KEY);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado) as CurriculoAnual[];
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

export function guardarCurriculosAnuales(curriculos: CurriculoAnual[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(CURRICULOS_STORAGE_KEY, JSON.stringify(curriculos));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

/** Un solo currículo "activo" a la vez — mismo patrón que `PlanIndividual` (uno activo, los demás
 * quedan archivados; útil más adelante si un programa cambia de currículo entre años). */
export function curriculoActivo(curriculos: CurriculoAnual[] = leerCurriculosAnuales()): CurriculoAnual | undefined {
  return curriculos.find((c) => c.estado === 'activo');
}

export function generarIdCurriculo(): string {
  return `curriculo-${Date.now()}`;
}

function crearCurriculoBase(anio: number, origen: OrigenCurriculo, meses: MesCurricularAnual[]): CurriculoAnual {
  return {
    id: generarIdCurriculo(),
    nombre: `Currículo ${anio}`,
    anio,
    estado: 'activo',
    origen,
    fechaCreacion: FECHA_HOY,
    meses,
  };
}

/** Camino A — "Ya tengo mi currículo": arranca vacío, la maestra lo llena mes a mes. */
export function crearCurriculoVacio(anio: number): CurriculoAnual {
  return crearCurriculoBase(anio, 'maestra', []);
}

/** Camino B — "Ayúdame a crearlo": prellena los 12 temas de la plantilla DEMO (solo `tema`, los
 * campos configurados quedan vacíos para que la maestra los complete) — nunca finge ser una
 * propuesta pedagógica personalizada real. */
export function crearCurriculoDesdePlantillaDemo(anio: number): CurriculoAnual {
  const meses: MesCurricularAnual[] = Object.entries(TEMAS_PLANTILLA_DEMO).map(([mes, tema]) => ({
    mes: Number(mes),
    tema,
    campos: {},
  }));
  return crearCurriculoBase(anio, 'raiz_sugerido', meses);
}

export function mesDeCurriculo(curriculo: CurriculoAnual, mes: number): MesCurricularAnual | undefined {
  return curriculo.meses.find((m) => m.mes === mes);
}

/** Guarda (crea o reemplaza) UN mes sin tocar los demás — regla del usuario: "editar un mes no
 * modifica otro". Devuelve el currículo actualizado; quien llama lo persiste. */
export function guardarMesCurriculo(curriculo: CurriculoAnual, mesActualizado: MesCurricularAnual): CurriculoAnual {
  const existe = curriculo.meses.some((m) => m.mes === mesActualizado.mes);
  const meses = existe
    ? curriculo.meses.map((m) => (m.mes === mesActualizado.mes ? mesActualizado : m))
    : [...curriculo.meses, mesActualizado].sort((a, b) => a.mes - b.mes);
  return { ...curriculo, meses };
}

/** Campos ACTIVOS del programa — vacío por defecto, nunca fijo a Color/Número/Letras/Forma. */
export function camposActivos(config: ProgramaConfig = leerProgramaConfig()): CampoCurriculoDef[] {
  return (config.camposCurriculoAnual ?? []).filter((c) => c.activo !== false);
}

/** Campos que la maestra desactivó — sus datos en los meses siguen intactos, solo ocultos hasta
 * reactivarlos (protección del usuario). */
export function camposArchivados(config: ProgramaConfig = leerProgramaConfig()): CampoCurriculoDef[] {
  return (config.camposCurriculoAnual ?? []).filter((c) => c.activo === false);
}

/** Cuántos de los campos activos del programa tienen contenido en ese mes — para el resumen del
 * grid anual ("3 de 5 campos completados"), nunca un porcentaje falso. */
export function progresoDelMes(mes: MesCurricularAnual | undefined, campos: CampoCurriculoDef[]): { completados: number; total: number } {
  if (!mes) return { completados: 0, total: campos.length };
  const completados = campos.filter((c) => valorTieneContenido(mes.campos[c.id])).length;
  return { completados, total: campos.length };
}

/* ── DISEÑO DEL MES (Parte B) ── Desarrolla PEDAGÓGICAMENTE un mes concreto: qué subtemas,
   vocabulario, conceptos y experiencias clave se van a trabajar. Todavía NO decide fechas ni
   duración — eso es la Parte C (Calendario). Un Subtema es contenido puro: nunca tiene semana,
   duración ni día — "Subtema 1 = Semana 1" es exactamente lo que el usuario pidió eliminar.

   Toma el marco del Currículo Anual (tema + campos de ESE mes) como SNAPSHOT al crear el diseño —
   un cambio posterior en el Currículo Anual nunca sobrescribe silenciosamente un diseño ya
   trabajado; eso se compara y se avisa después (Parte C), no aquí. ── */

/** Un término de vocabulario en UN idioma — nunca un string combinado tipo "Body / Cuerpo". Los
 * idiomas disponibles son los que el programa configuró en `ProgramaConfig.idiomasEnsenanza`
 * (nunca hardcodeados inglés/español). */
export interface TerminoVocabulario {
  idioma: string;
  texto: string;
}

/** UNA palabra de vocabulario, con su(s) traducción(es) y un `orden` — sirve para AYUDAR a
 * distribuirla después en el Calendario (Parte C), nunca una fecha (regla del usuario: "puede
 * existir orden/prioridad, pero NO fecha"). Es la ÚNICA fuente: Calendario, Circle, visuales,
 * actividades e imprimibles la leen de aquí — nunca se duplica en otro lado. */
export interface VocabularioItem {
  id: string;
  terminos: TerminoVocabulario[];
  orden: number;
}

export type TipoRecurso = 'libro' | 'cancion';

/** Libro o canción — general del mes (viene del Currículo Anual o es propio del mes) o asociado a
 * un subtema en particular. Sin biblioteca real todavía: solo el título. */
export interface RecursoLibroCancion {
  id: string;
  tipo: TipoRecurso;
  titulo: string;
}

/** Contenido de un subtema — SOLO contenido, nunca duración/semana/días (regla del usuario). La
 * "experiencia clave" es una intención del mes, no la actividad detallada de Planeación (eso
 * sigue siendo `Actividad`, sin duplicarse aquí). */
export interface Subtema {
  id: string;
  nombre: string;
  enfoque?: string;
  vocabulario: VocabularioItem[];
  conceptos: string[];
  experienciasClave: string[];
  recursos: RecursoLibroCancion[];
  orden: number;
}

export type EstadoDisenoMensual = 'borrador' | 'aprobado';

/** Una cultura/comunidad que el mes quiere integrar — SIN fecha real todavía (esa la asigna el
 * Calendario, Parte C: "Diseño del mes dice QUÉ culturas; Calendario dice QUÉ FECHA"). */
export interface CulturaRelacionada {
  id: string;
  nombre: string;
  nota?: string;
}

/** El Diseño Mensual de UN mes/año concreto. `marcoSnapshot` es una FOTO del Currículo Anual al
 * crear o actualizar explícitamente el diseño — nunca se sobrescribe sola si el Currículo Anual
 * cambia después; comparar `marcoSnapshot` contra el mes vivo del currículo (Parte C) es cómo se
 * detecta el desfase para avisar, sin tocar nada automáticamente. `version` existe SOLO para que
 * la Parte C pueda detectar más adelante que el diseño cambió después de generar un calendario —
 * no se usa todavía. */
/** De dónde salió el personaje elegido — igual que `OrigenMeta` en Plan Individual: distingue
 * "RAÍZ lo sugirió y la maestra lo aceptó" de "la maestra lo escribió ella misma". */
export type OrigenPersonaje = 'sugerido_raiz' | 'manual';

/** El personaje YA ELEGIDO por la maestra — nunca lo que RAÍZ propuso (eso es
 * `SugerenciaPersonaje`, más abajo, que no se guarda hasta que se acepta). */
export interface PersonajeDelMes {
  nombre: string;
  origen: OrigenPersonaje;
  razonPedagogica?: string;
  relacionTema?: string;
  notasMaestra?: string;
}

/** `'sin_personaje'` = la maestra decidió explícitamente NO usar personaje este mes (distinto de
 * `undefined` = todavía no se decidió nada). */
export type PersonajeDelMesEstado = PersonajeDelMes | 'sin_personaje';

export interface DisenoMensual {
  id: string;
  anio: number;
  mes: number;
  curriculoAnualId?: string;
  marcoSnapshot: { tema: string; campos: Record<string, ValorCampoCurriculo> };
  estado: EstadoDisenoMensual;
  origen: OrigenCurriculo;
  enfoqueCultural?: string;
  culturasRelacionadas: CulturaRelacionada[];
  recursosGenerales: RecursoLibroCancion[];
  subtemas: Subtema[];
  /** Personaje del Mes — SOLO si el programa activó ese campo en `camposCurriculoAnual`. Vive
   * aquí (no en `MesCurricularAnual.campos`) porque sus sugerencias dependen del tema y las
   * culturas de ESTE diseño, no del Currículo Anual. */
  personajeDelMes?: PersonajeDelMesEstado;
  version: number;
  fechaCreacion: string;
  fechaActualizacion: string;
}

const DISENOS_STORAGE_KEY = 'raiz_disenos_mensuales';

export function leerDisenosMensuales(): DisenoMensual[] {
  if (typeof window === 'undefined') return [];
  try {
    const guardado = window.localStorage.getItem(DISENOS_STORAGE_KEY);
    if (!guardado) return [];
    const parseado = JSON.parse(guardado) as DisenoMensual[];
    return Array.isArray(parseado) ? parseado : [];
  } catch {
    return [];
  }
}

export function guardarDisenosMensuales(disenos: DisenoMensual[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(DISENOS_STORAGE_KEY, JSON.stringify(disenos));
  } catch {
    // Almacenamiento no disponible — la sesión sigue funcionando en memoria.
  }
}

export function disenoDeMes(anio: number, mes: number, disenos: DisenoMensual[] = leerDisenosMensuales()): DisenoMensual | undefined {
  return disenos.find((d) => d.anio === anio && d.mes === mes);
}

function generarIdDiseno(): string {
  return `diseno-${Date.now()}`;
}

function generarIdSubtema(): string {
  return `subtema-${Date.now()}-${Math.round(Math.random() * 1000)}`;
}

function tomarSnapshotMarco(curriculo: CurriculoAnual | undefined, mes: number): { tema: string; campos: Record<string, ValorCampoCurriculo> } {
  const mesDef = curriculo ? mesDeCurriculo(curriculo, mes) : undefined;
  return { tema: mesDef?.tema ?? '', campos: mesDef?.campos ?? {} };
}

/** Camino A — "Ya tengo mi mes": arranca sin subtemas, la maestra los agrega. Siempre toma el
 * marco vivo del Currículo Anual como snapshot inicial. */
export function crearDisenoVacio(anio: number, mes: number, curriculo: CurriculoAnual | undefined): DisenoMensual {
  return {
    id: generarIdDiseno(),
    anio,
    mes,
    curriculoAnualId: curriculo?.id,
    marcoSnapshot: tomarSnapshotMarco(curriculo, mes),
    estado: 'borrador',
    origen: 'maestra',
    culturasRelacionadas: [],
    recursosGenerales: [],
    subtemas: [],
    version: 1,
    fechaCreacion: FECHA_HOY,
    fechaActualizacion: FECHA_HOY,
  };
}

/** DEMO — subtemas genéricos de 4 semanas "clásicas" de un tema mensual típico de primera
 * infancia, sin contenido específico (la maestra los completa) — NUNCA implica que cada uno dura
 * una semana; son solo nombres de arranque editables. Marcado como propuesta, nunca como currículo
 * terminado (regla del usuario, igual que `TEMAS_PLANTILLA_DEMO`). */
const NOMBRES_SUBTEMA_DEMO = ['Introducción al tema', 'Profundizando', 'Explorando más', 'Cierre e integración'];

/** Camino B — "Ayúdame a crear mi mes": propone subtemas DEMO vacíos de contenido (la maestra
 * completa vocabulario/conceptos/experiencias) — nunca finge generación pedagógica real. */
export function crearDisenoDesdePropuestaDemo(anio: number, mes: number, curriculo: CurriculoAnual | undefined): DisenoMensual {
  const base = crearDisenoVacio(anio, mes, curriculo);
  const subtemas: Subtema[] = NOMBRES_SUBTEMA_DEMO.map((nombre, i) => ({
    id: generarIdSubtema(),
    nombre,
    vocabulario: [],
    conceptos: [],
    experienciasClave: [],
    recursos: [],
    orden: i,
  }));
  return { ...base, origen: 'raiz_sugerido', subtemas };
}

function tocar(diseno: DisenoMensual): DisenoMensual {
  return { ...diseno, version: diseno.version + 1, fechaActualizacion: FECHA_HOY };
}

export function crearSubtemaVacio(orden: number): Subtema {
  return { id: generarIdSubtema(), nombre: '', vocabulario: [], conceptos: [], experienciasClave: [], recursos: [], orden };
}

export function agregarSubtema(diseno: DisenoMensual): DisenoMensual {
  return tocar({ ...diseno, subtemas: [...diseno.subtemas, crearSubtemaVacio(diseno.subtemas.length)] });
}

export function eliminarSubtema(diseno: DisenoMensual, subtemaId: string): DisenoMensual {
  return tocar({ ...diseno, subtemas: diseno.subtemas.filter((s) => s.id !== subtemaId).map((s, i) => ({ ...s, orden: i })) });
}

export function actualizarSubtema(diseno: DisenoMensual, subtemaId: string, cambios: Partial<Subtema>): DisenoMensual {
  return tocar({ ...diseno, subtemas: diseno.subtemas.map((s) => (s.id === subtemaId ? { ...s, ...cambios } : s)) });
}

/** Mueve un subtema una posición arriba/abajo — mismo patrón que `moverBloque` en Configuración. */
export function moverSubtema(diseno: DisenoMensual, subtemaId: string, direccion: -1 | 1): DisenoMensual {
  const ordenados = [...diseno.subtemas].sort((a, b) => a.orden - b.orden);
  const idx = ordenados.findIndex((s) => s.id === subtemaId);
  const destino = idx + direccion;
  if (idx < 0 || destino < 0 || destino >= ordenados.length) return diseno;
  [ordenados[idx], ordenados[destino]] = [ordenados[destino], ordenados[idx]];
  return tocar({ ...diseno, subtemas: ordenados.map((s, i) => ({ ...s, orden: i })) });
}

export function actualizarCampoDiseno(diseno: DisenoMensual, cambios: Partial<DisenoMensual>): DisenoMensual {
  return tocar({ ...diseno, ...cambios });
}

/** Lo REALMENTE necesario para aprobar — nunca obliga a llenar vocabulario/conceptos/experiencias
 * ni ningún campo opcional (regla del usuario). */
export function puedeAprobarDiseno(diseno: DisenoMensual): { ok: boolean; motivo?: string } {
  if (diseno.subtemas.length === 0) return { ok: false, motivo: 'Agrega al menos un subtema antes de aprobar.' };
  if (diseno.subtemas.some((s) => !s.nombre.trim())) return { ok: false, motivo: 'Cada subtema necesita un nombre.' };
  return { ok: true };
}

export function aprobarDiseno(diseno: DisenoMensual): DisenoMensual {
  return tocar({ ...diseno, estado: 'aprobado' });
}

export function volverABorrador(diseno: DisenoMensual): DisenoMensual {
  return tocar({ ...diseno, estado: 'borrador' });
}

/** Idiomas para el vocabulario — los de enseñanza configurados; si el programa no configuró
 * ninguno, cae al idioma de salida por defecto (nunca deja a la maestra sin ningún campo). */
export function idiomasVocabulario(config: ProgramaConfig = leerProgramaConfig()): string[] {
  return config.idiomasEnsenanza.length > 0 ? config.idiomasEnsenanza : [config.idiomaSalidaDefault || 'Español'];
}

export function crearVocabularioVacio(idiomas: string[], orden: number): VocabularioItem {
  return { id: `vocab-${Date.now()}-${Math.round(Math.random() * 1000)}`, terminos: idiomas.map((idioma) => ({ idioma, texto: '' })), orden };
}

/* ── PERSONAJE DEL MES — tres caminos: RAÍZ sugiere / la maestra escribe el suyo / este mes no se
   usa (regla del usuario: "el uso de Personaje del Mes sigue siendo completamente opcional por
   programa y por mes"). RAÍZ NUNCA elige uno sola — solo propone, con una razón pedagógica breve
   cada vez, y la maestra confirma.

   ⚠️ DEMO — sin IA real: el catálogo de abajo NO nombra personas reales con biografías inventadas
   (regla del usuario: "no inventes biografías, hechos ni conexiones pedagógicas no verificadas").
   Son ARQUETIPOS/roles genéricos (una científica, un artista local, alguien de la comunidad...) que
   la maestra reemplaza por una persona real de su elección — exactamente lo que ya pedían los
   ejemplos del usuario ("animales; medio ambiente; ciencia" / "educadores; artistas; líderes
   comunitarios"), nunca una lista de celebridades con hechos no verificados. Cuando exista el
   servicio de IA real, esta función es el punto que se reemplaza — la arquitectura ya queda lista
   para eso. ── */

/** Una propuesta de RAÍZ — NO es todavía el personaje elegido (eso es `PersonajeDelMes`, arriba).
 * Nunca se guarda sola; solo cuando la maestra la acepta se convierte en `PersonajeDelMes`. */
export interface SugerenciaPersonaje {
  id: string;
  nombre: string;
  razonPedagogica: string;
  relacionTema: string;
  edadesSugeridas?: string;
  relacionCultural?: string;
}

interface ArquetipoPersonajeDemo {
  id: string;
  nombre: string;
  razonPedagogica: string;
  relacionTema: string;
  edadesSugeridas?: string;
}

interface GrupoPersonajeDemo {
  palabrasClave: string[];
  personajes: ArquetipoPersonajeDemo[];
}

const PERSONAJES_DEMO: GrupoPersonajeDemo[] = [
  {
    palabrasClave: ['natural', 'animal', 'planta', 'estacion', 'otoño', 'otono', 'primavera', 'ambiente', 'agua', 'sentidos'],
    personajes: [
      { id: 'nat-1', nombre: 'Un explorador o exploradora de la naturaleza', razonPedagogica: 'Ayuda a los niños a imaginar cómo se investiga el mundo natural con curiosidad y cuidado.', relacionTema: 'Conecta directamente con la observación del entorno.', edadesSugeridas: '3-5 años' },
      { id: 'nat-2', nombre: 'Una persona que cuida animales (veterinaria/o o cuidador de zoológico)', razonPedagogica: 'Modela el valor del cuidado y la responsabilidad hacia otros seres vivos.', relacionTema: 'Relaciona el tema con una profesión concreta y cercana.', edadesSugeridas: '3-6 años' },
      { id: 'nat-3', nombre: 'Una científica o científico del medio ambiente', razonPedagogica: 'Introduce la idea de que cuidar la naturaleza también es un trabajo real.', relacionTema: 'Apoya conceptos de conservación.', edadesSugeridas: '4-6 años' },
    ],
  },
  {
    palabrasClave: ['comunidad', 'vecindario', 'ayudante', 'servicio', 'gratitud'],
    personajes: [
      { id: 'com-1', nombre: 'Una persona líder de tu comunidad local', razonPedagogica: 'Ayuda a los niños a reconocer que hay personas reales, cercanas a ellos, que cuidan del lugar donde viven.', relacionTema: 'Directamente relacionado con el tema de comunidad.', edadesSugeridas: '3-6 años' },
      { id: 'com-2', nombre: 'Una educadora o educador que el equipo admire', razonPedagogica: 'Refuerza el valor del aprendizaje y el cuidado dentro de la propia comunidad.', relacionTema: 'Conecta el salón con el mundo real.' },
      { id: 'com-3', nombre: 'Una persona artista local', razonPedagogica: 'Muestra que la creatividad también construye comunidad.', relacionTema: 'Amplía la idea de comunidad más allá de lo familiar.' },
    ],
  },
  {
    palabrasClave: ['cuerpo', 'identidad', ' yo ', 'mi cuerpo', 'sentidos', 'familia', 'historia', 'emocion', 'seguridad'],
    personajes: [
      { id: 'id-1', nombre: 'Alguien de la propia comunidad del salón, a quien los niños puedan conocer en persona', razonPedagogica: 'Los temas de identidad se trabajan mejor con referentes cercanos y reales, no lejanos.', relacionTema: 'Apoya un mes centrado en "quién soy yo" mostrando que cada persona importa.' },
      { id: 'id-2', nombre: 'Una persona con una historia de vida que el grupo pueda escuchar y comentar', razonPedagogica: 'Ofrece un ejemplo concreto de historia personal y pertenencia.', relacionTema: 'Conecta con identidad y familia.' },
    ],
  },
  {
    palabrasClave: ['numero', 'letra', 'forma', 'color', 'matematic', 'contar'],
    personajes: [
      { id: 'aca-1', nombre: 'Alguien que use números, formas o letras en su trabajo diario (panadera/o, arquitecta/o, ingeniera/o)', razonPedagogica: 'Muestra que los conceptos del mes existen fuera del salón, en trabajos reales.', relacionTema: 'Conecta el contenido académico con una profesión concreta.', edadesSugeridas: '4-6 años' },
    ],
  },
];

function personajesPorCultura(culturas: string[]): SugerenciaPersonaje[] {
  return culturas
    .filter((n) => n.trim())
    .map((nombre, i) => ({
      id: `cultura-${i}-${nombre}`,
      nombre: `Una persona relevante de ${nombre}, a elegir por el equipo`,
      razonPedagogica: `Representa la cultura de ${nombre}, que forma parte del diseño de este mes.`,
      relacionTema: 'Está relacionado con una cultura que ya marcaste para este mes.',
      relacionCultural: nombre,
    }));
}

/** Hasta 4 sugerencias — nunca una lista larga, nunca una sola opción elegida por RAÍZ. Usa el
 * tema, los subtemas y las culturas relacionadas de ESTE diseño; sin ningún match de tema, cae a
 * una sugerencia neutra que nunca deja a la maestra sin nada que ver. */
export function sugerirPersonajesDelMes(diseno: DisenoMensual): SugerenciaPersonaje[] {
  const texto = [diseno.marcoSnapshot.tema, ...diseno.subtemas.flatMap((s) => [s.nombre, s.enfoque ?? '', ...s.conceptos])]
    .join(' ')
    .toLowerCase();
  const deTemas: SugerenciaPersonaje[] = PERSONAJES_DEMO.filter((g) => g.palabrasClave.some((k) => texto.includes(k))).flatMap((g) => g.personajes);
  const deCulturas = personajesPorCultura(diseno.culturasRelacionadas.map((c) => c.nombre));
  const combinadas = [...deTemas, ...deCulturas];
  if (combinadas.length === 0) {
    return [
      {
        id: 'generico-1',
        nombre: 'Una persona de la comunidad del salón relacionada con el tema del mes',
        razonPedagogica: 'RAÍZ todavía no reconoce un tema específico para este mes — parte de alguien cercano a tu salón y ajusta desde ahí.',
        relacionTema: 'Puedes ajustar esta sugerencia a tu tema real.',
      },
    ];
  }
  return combinadas.slice(0, 4);
}

export function elegirPersonajeDelMes(diseno: DisenoMensual, personaje: PersonajeDelMes): DisenoMensual {
  return tocar({ ...diseno, personajeDelMes: personaje });
}

export function noUsarPersonajeDelMes(diseno: DisenoMensual): DisenoMensual {
  return tocar({ ...diseno, personajeDelMes: 'sin_personaje' });
}
