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

/** Campos activos del programa — vacío por defecto, nunca fijo a Color/Número/Letras/Forma. */
export function camposActivos(config: ProgramaConfig = leerProgramaConfig()): CampoCurriculoDef[] {
  return config.camposCurriculoAnual ?? [];
}

/** Cuántos de los campos activos del programa tienen contenido en ese mes — para el resumen del
 * grid anual ("3 de 5 campos completados"), nunca un porcentaje falso. */
export function progresoDelMes(mes: MesCurricularAnual | undefined, campos: CampoCurriculoDef[]): { completados: number; total: number } {
  if (!mes) return { completados: 0, total: campos.length };
  const completados = campos.filter((c) => valorTieneContenido(mes.campos[c.id])).length;
  return { completados, total: campos.length };
}
