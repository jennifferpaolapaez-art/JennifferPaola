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
