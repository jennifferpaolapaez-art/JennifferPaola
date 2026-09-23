/* ── PROPUESTA DEMO POR TIPO DE BLOQUE (Parte E) ──

   "Ayúdame a crearla" en esta fase es una plantilla DEMO/controlada por tipo de bloque, NUNCA IA
   real (regla del usuario, punto 6: "no inventar datos pedagógicos que pretendan venir de una IA
   real que todavía no está conectada"). Usa el contexto que ya existe (subtema, vocabulario,
   metodología) para variar el texto, pero cada bloque recibe una ESTRUCTURA propia — Circle Time
   nunca recibe la misma plantilla que STEAM (regla del usuario, punto 6/10).

   Nada de esto se guarda solo: la pantalla siempre lo presenta como "Propuesta de ejemplo — DEMO"
   y solo entra al formulario editable cuando la maestra pulsa "Usar propuesta"; guardar de verdad
   sigue siendo una acción aparte (Guardar borrador / Marcar como lista). */

import type { Actividad, Bloque } from './seed-data';
import { BLOQUE_LABEL } from './seed-data';
import type { ContextoPropuestaActividad } from './planeacion-calendario';

type CamposPropuesta = Pick<
  Actividad,
  'titulo' | 'objetivo' | 'dominio' | 'materiales' | 'preparacion' | 'queHaceMaestra' | 'queHacenNinos' | 'preguntasGuia' | 'queObservar' | 'guiaCircle' | 'guiaOutdoor' | 'guiaCentros' | 'guiaCierre'
>;

function primeraPalabra(vocabulario: string[]): string | undefined {
  return vocabulario[0];
}

function temaOGenerico(contexto: ContextoPropuestaActividad): string {
  return contexto.dia.subtemaNombre || contexto.mes.temaMensual || 'el tema de esta semana';
}

/** Una propuesta por tipo de bloque — cada rama llena la guía/estructura que YA existe para ese
 * bloque (nunca campos nuevos, regla del usuario: "reutiliza lo existente"). `variante` cambia la
 * idea central (nunca la estructura) — sirve para el botón "Probar otra": misma clase de bloque,
 * otra propuesta de ejemplo, sin volver a inventar la plantilla desde cero. */
export function generarPropuestaDemoParaBloque(bloque: Bloque, contexto: ContextoPropuestaActividad, variante = 0): CamposPropuesta {
  const tema = temaOGenerico(contexto);
  const palabra = primeraPalabra(contexto.dia.vocabulario);
  const duracion = contexto.programa.duracionMin ? `${contexto.programa.duracionMin} min` : '10–15 min';
  const v = variante % 2;

  switch (bloque) {
    case 'circle':
      return {
        titulo: `Circle Time — ${tema}`,
        objetivo: `Saludar al grupo y presentar ${palabra ? `la palabra "${palabra}"` : `el tema de ${tema}`}.`,
        dominio: 'Lenguaje y participación grupal',
        materiales: [],
        guiaCircle: {
          duracion,
          rutinaDiaria: [{ icono: '👋', titulo: 'Saludo', texto: 'Cantamos la canción de bienvenida y revisamos el clima del día.' }],
          focoDeHoy: {
            tema,
            palabrasDelDia: contexto.dia.vocabulario.slice(0, 3),
            muestra: v === 0 ? `Mostrar algo relacionado con ${tema} para que el grupo lo explore junto.` : `Traer un objeto sorpresa relacionado con ${tema} dentro de una bolsa misteriosa.`,
            preguntas: [`¿Qué sabemos sobre ${tema}?`, palabra ? `¿Quién puede usar la palabra "${palabra}" en una frase?` : '¿Qué te gustaría aprender hoy?'],
          },
          cierre: 'Transición cantada hacia el siguiente bloque.',
        },
      };

    case 'outdoor':
      return {
        titulo: `Movimiento al aire libre — ${tema}`,
        objetivo: 'Ofrecer una invitación breve de movimiento intencional, seguida de juego libre supervisado.',
        dominio: 'Motricidad gruesa',
        materiales: [],
        guiaOutdoor: {
          movimientoIntencional: {
            duracion: '10 min',
            invitacion: v === 0 ? `Invitación de movimiento relacionada con ${tema}.` : `Circuito breve inspirado en ${tema}.`,
            ideas: v === 0 ? ['Carrera suave en zigzag', 'Saltos con los dos pies juntos'] : ['Caminar en puntillas', 'Equilibrio en una línea marcada'],
          },
          juegoLibre: 'Tiempo de juego libre en el patio, con la maestra circulando entre los niños.',
          preguntaInformal: palabra ? `¿Puedes moverte como algo que empiece con "${palabra}"?` : undefined,
          quePriorizar: 'Seguridad física y movimiento activo — no convertirlo en otra clase académica.',
        },
      };

    case 'centros':
      return {
        titulo: `Centros — ${tema}`,
        objetivo: 'Ofrecer 2-3 estaciones con provocaciones relacionadas al tema, para exploración libre.',
        dominio: 'Exploración autónoma',
        materiales: [],
        guiaCentros: [
          { nombre: 'Centro sugerido 1', material: 'Materiales disponibles en el salón', provocacion: v === 0 ? `Provocación relacionada con ${tema}.` : `Invitación sensorial relacionada con ${tema}.`, intencion: 'Exploración sensorial libre.' },
          { nombre: 'Centro sugerido 2', material: 'Materiales disponibles en el salón', provocacion: `Segunda provocación relacionada con ${tema}.`, intencion: 'Motricidad fina.' },
        ],
        queObservar: 'Qué centro elige cada niño y cuánto tiempo se sostiene en la exploración.',
      };

    case 'cierre':
      return {
        titulo: `Cierre — ${tema}`,
        objetivo: 'Cerrar el día repasando lo vivido, sin volverlo una evaluación académica.',
        dominio: 'Reflexión y transición',
        materiales: [],
        guiaCierre: {
          recuerda: `Hoy exploramos ${tema}.`,
          pregunta: v === 0 ? '¿Qué fue lo que más te gustó de hoy?' : '¿Qué fue lo más difícil de hoy?',
          vocabulario: palabra ?? tema,
          puenteManana: 'Mañana seguimos explorando este mismo tema.',
        },
      };

    case 'lectura':
      return {
        titulo: `Lectura — ${tema}`,
        objetivo: `Leer un libro relacionado con ${tema} y conversar sobre él.`,
        dominio: 'Lenguaje y comprensión',
        materiales: [{ nombre: 'Libro relacionado con el tema', disponible: false }],
        preparacion: `Elegir un libro de la biblioteca del salón relacionado con ${tema}.`,
        queHaceMaestra: v === 0 ? 'Leer en voz alta, señalando las ilustraciones y pausando en la palabra del día.' : 'Leer en voz alta e invitar a los niños a predecir qué pasa en la siguiente página.',
        queHacenNinos: 'Escuchan, señalan lo que reconocen y responden preguntas simples.',
        preguntasGuia: [`¿Qué crees que va a pasar?`, palabra ? `¿Dónde ves "${palabra}" en el cuento?` : '¿Qué parte te gustó más?'],
      };

    case 'steam':
      return {
        titulo: `STEAM — ${tema}`,
        objetivo: `Explorar una pregunta o problema simple relacionado con ${tema}.`,
        dominio: 'Pensamiento científico',
        materiales: [],
        preparacion: 'Preparar los materiales de exploración antes de que lleguen los niños.',
        queHaceMaestra: v === 0 ? `Plantear una pregunta abierta sobre ${tema} y acompañar el proceso sin dar la respuesta.` : `Proponer un pequeño reto relacionado con ${tema} y dejar que el grupo pruebe soluciones.`,
        queHacenNinos: 'Exploran, prueban y comparten lo que notan.',
        preguntasGuia: ['¿Qué crees que va a pasar?', '¿Qué notaste?'],
        queObservar: 'Cómo cada niño explora el material y qué lenguaje usa para describir lo que ve.',
      };

    case 'prek':
      return {
        titulo: `Trabajo Pre-K — ${tema}`,
        objetivo: 'Practicar una habilidad concreta (pre-escritura, conteo, clasificación) con una actividad apropiada para Pre-K.',
        dominio: 'Habilidades académicas tempranas',
        materiales: [],
        preparacion: 'Preparar el material de mesa para el grupo de Pre-K.',
        queHaceMaestra: 'Modela la habilidad y acompaña a cada niño individualmente.',
        queHacenNinos: 'Practican la habilidad en su propio ritmo.',
      };

    case 'principal':
    case 'musica':
    case 'transicion':
    case 'custom':
    default:
      return {
        titulo: `${BLOQUE_LABEL[bloque]} — ${tema}`,
        objetivo: v === 0 ? `Experiencia principal del día relacionada con ${tema}.` : `Experiencia práctica relacionada con ${tema}, con un cierre compartido en grupo.`,
        dominio: '',
        materiales: [],
        preparacion: 'Preparar los materiales antes de reunir al grupo.',
        queHaceMaestra: 'Presenta la actividad y guía la experiencia.',
        queHacenNinos: 'Participan de la actividad principal.',
        preguntasGuia: [`¿Qué sabemos sobre ${tema}?`],
      };
  }
}

/** La línea que de verdad cambia entre variantes de un mismo bloque (para que "Probar otra" se
 * note en la tarjeta compacta — el `objetivo` por sí solo no varía en varios tipos de bloque,
 * porque la variación vive en su guía específica). Puramente de presentación, no se guarda. */
export function lineaDestacadaDePropuesta(bloque: Bloque, propuesta: CamposPropuesta): string | undefined {
  switch (bloque) {
    case 'circle':
      return propuesta.guiaCircle?.focoDeHoy.muestra;
    case 'outdoor':
      return propuesta.guiaOutdoor?.movimientoIntencional.invitacion;
    case 'centros':
      return propuesta.guiaCentros?.[0]?.provocacion;
    case 'cierre':
      return propuesta.guiaCierre?.pregunta;
    case 'lectura':
    case 'steam':
      return propuesta.queHaceMaestra;
    default:
      return undefined;
  }
}
