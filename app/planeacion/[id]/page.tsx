'use client';

// DETALLE DE ACTIVIDAD/BLOQUE (Parte E — completar/editar sobre el sistema YA existente, sin
// segunda arquitectura). Sigue siendo la MISMA pantalla y el mismo significado de siempre: el
// detalle de UNA actividad. Ahora además:
//   - busca en TODAS las Planeaciones guardadas (no solo la Semana 3 demo) — con `?plan=<id>` en
//     la URL busca SOLO ahí (combinación segura, nunca puede confundir dos actividades de semanas
//     distintas); sin el parámetro, sigue el comportamiento de siempre;
//   - si la actividad está `pendiente` (esqueleto materializado por la Parte D), abre directo en
//     "¿Cómo quieres completarla?" en vez del detalle de lectura vacío;
//   - una actividad ya completa gana un botón [Editar actividad] que abre el MISMO formulario;
//   - "Ayúdame a crearla" es una plantilla DEMO por tipo de bloque (`lib/propuesta-actividad.ts`),
//     nunca IA real — se presenta como propuesta de ejemplo y nunca se guarda sola.
// Las 3 capas de personalización (etapa/individual/foco) NO se editan aquí — siguen siendo
// exactamente la misma sección de lectura que ya existía, intacta.

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, NotebookPen, Sparkles, PencilLine, Plus, X } from 'lucide-react';
import { AppShell, AvatarInicial, Colapsable, EtapaChip, LeafCheck } from '@/components/app/shell';
import {
  actividadPorIdGlobal,
  actualizarActividadEnPlan,
  calcularPersonalizacionSemana,
  estadoContenidoDeActividad,
  guardarUnaPlaneacion,
  ninoPorId,
  leerNinos,
  ETAPAS_ORDEN,
  TINT_HEX,
  BLOQUE_LABEL,
  ESTADO_CONTENIDO_LABEL,
  type Actividad,
  type DiaPlan,
  type Etapa,
  type Nino,
  type PlaneacionSemanal,
} from '@/lib/seed-data';
import { resolverContextoParaPropuesta, type ContextoPropuestaActividad } from '@/lib/planeacion-calendario';
import { generarPropuestaDemoParaBloque, lineaDestacadaDePropuesta } from '@/lib/propuesta-actividad';
import { TIPO_EVENTO_LABEL } from '@/lib/calendario';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const CAMPO_INPUT =
  'min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';
const CAMPO_TEXTAREA = `${CAMPO_INPUT} min-h-[72px] resize-y py-2.5`;

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{children}</h2>;
}

type Modo = 'lectura' | 'elegir' | 'propuesta' | 'editar';

/* ── CONTEXTO OPCIONAL — nunca obligatorio (regla del usuario, puntos 4/14/15): se muestra como
   información disponible, nunca fuerza que la actividad la use. ── */
function ChipsContexto({ contexto }: { contexto: ContextoPropuestaActividad }) {
  const chips: string[] = [];
  if (contexto.dia.subtemaNombre) chips.push(`Subtema: ${contexto.dia.subtemaNombre}`);
  if (contexto.dia.vocabulario.length > 0) chips.push(`Vocabulario: ${contexto.dia.vocabulario.join(', ')}`);
  if (contexto.mes.personajeDelMes) chips.push(`Personaje del mes: ${contexto.mes.personajeDelMes}`);
  if (contexto.mes.enfoqueCultural) chips.push(`Enfoque cultural: ${contexto.mes.enfoqueCultural}`);
  for (const c of contexto.mes.camposActivos) chips.push(`${c.etiqueta}: ${c.valor}`);
  for (const e of contexto.dia.eventos) chips.push(`${TIPO_EVENTO_LABEL[e.tipo as keyof typeof TIPO_EVENTO_LABEL] ?? e.tipo}: ${e.nombre}`);
  if (chips.length === 0) return null;
  return (
    <div className="mb-4">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Contexto disponible — úsalo si tiene sentido, no es obligatorio</p>
      <div className="flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span key={c} className="rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2.5 py-1 text-[12px] text-[var(--text-secondary)]">
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function EditorListaTexto({ etiqueta, valores, onCambiar }: { etiqueta: string; valores: string[]; onCambiar: (v: string[]) => void }) {
  const [nuevo, setNuevo] = useState('');
  return (
    <div>
      <Etiqueta>{etiqueta}</Etiqueta>
      <ul className="mt-1 flex flex-col gap-1.5">
        {valores.map((v, i) => (
          <li key={i} className="flex items-center gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-2">
            <span className="flex-1 text-[13px] text-[var(--text-primary)]">{v}</span>
            <button type="button" onClick={() => onCambiar(valores.filter((_, idx) => idx !== i))} aria-label={`Quitar ${v}`}>
              <X size={14} className="text-[var(--text-tertiary)]" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Agregar..." className={CAMPO_INPUT} />
        <button
          type="button"
          onClick={() => {
            if (!nuevo.trim()) return;
            onCambiar([...valores, nuevo.trim()]);
            setNuevo('');
          }}
          className="flex min-h-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[var(--accent)]"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function EditorMateriales({ materiales, onCambiar }: { materiales: { nombre: string; disponible: boolean }[]; onCambiar: (m: { nombre: string; disponible: boolean }[]) => void }) {
  const [nuevo, setNuevo] = useState('');
  return (
    <div>
      <Etiqueta>Materiales</Etiqueta>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {materiales.map((m, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-primary)]">
            {m.nombre}
            <button type="button" onClick={() => onCambiar(materiales.filter((_, idx) => idx !== i))} aria-label={`Quitar ${m.nombre}`}>
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>
      <div className="mt-2 flex gap-2">
        <input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Agregar material..." className={CAMPO_INPUT} />
        <button
          type="button"
          onClick={() => {
            if (!nuevo.trim()) return;
            onCambiar([...materiales, { nombre: nuevo.trim(), disponible: true }]);
            setNuevo('');
          }}
          className="flex min-h-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[var(--accent)]"
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ── EDITOR — mismo formulario para "Escribirla yo" (vacío), "Ayúdame a crearla" (pre-llenado con
   la propuesta que la maestra aceptó) y "Editar actividad" (pre-llenado con lo que ya existía).
   Vista simple primero (título/qué haremos/materiales/qué observar); "Ver guía completa" despliega
   el resto, variando según el TIPO de bloque (regla del usuario, punto 6/9). ── */
function EditorActividad({
  base,
  contexto,
  onGuardar,
  onCancelar,
}: {
  base: Actividad;
  contexto: ContextoPropuestaActividad;
  onGuardar: (actividad: Actividad, marcarLista: boolean) => void;
  onCancelar: () => void;
}) {
  const [act, setAct] = useState<Actividad>(base);

  function campo<K extends keyof Actividad>(k: K, v: Actividad[K]) {
    setAct((a) => ({ ...a, [k]: v }));
  }

  return (
    <div className="flex flex-col gap-5">
      <ChipsContexto contexto={contexto} />

      <div>
        <Etiqueta>Título</Etiqueta>
        <input value={act.titulo} onChange={(e) => campo('titulo', e.target.value)} className={`${CAMPO_INPUT} mt-1`} placeholder="Ej: Collage del cuerpo" />
      </div>
      <div>
        <Etiqueta>Qué haremos</Etiqueta>
        <textarea value={act.objetivo} onChange={(e) => campo('objetivo', e.target.value)} className={`${CAMPO_TEXTAREA} mt-1`} placeholder="En una o dos frases: qué van a hacer y para qué." />
      </div>
      <EditorMateriales materiales={act.materiales} onCambiar={(m) => campo('materiales', m)} />
      <div>
        <Etiqueta>Qué observar</Etiqueta>
        <textarea value={act.queObservar ?? ''} onChange={(e) => campo('queObservar', e.target.value)} className={`${CAMPO_TEXTAREA} mt-1`} placeholder="Qué podrías notar mientras el grupo participa (opcional)." />
      </div>

      <Colapsable titulo="Ver guía completa" subtitulo={`Los campos propios de ${BLOQUE_LABEL[act.bloque]}`}>
        <div className="flex flex-col gap-4">
          <div>
            <Etiqueta>Dominio / habilidad</Etiqueta>
            <input value={act.dominio} onChange={(e) => campo('dominio', e.target.value)} className={`${CAMPO_INPUT} mt-1`} />
          </div>

          {act.bloque === 'circle' && (
            <>
              <div>
                <Etiqueta>Duración</Etiqueta>
                <input
                  value={act.guiaCircle?.duracion ?? ''}
                  onChange={(e) => campo('guiaCircle', { ...(act.guiaCircle ?? { rutinaDiaria: [], focoDeHoy: { tema: '', palabrasDelDia: [], muestra: '', preguntas: [] }, cierre: '' }), duracion: e.target.value })}
                  className={`${CAMPO_INPUT} mt-1`}
                />
              </div>
              <div>
                <Etiqueta>Qué mostrar</Etiqueta>
                <textarea
                  value={act.guiaCircle?.focoDeHoy.muestra ?? ''}
                  onChange={(e) =>
                    campo('guiaCircle', {
                      ...(act.guiaCircle ?? { duracion: '10–15 min', rutinaDiaria: [], cierre: '' }),
                      focoDeHoy: { ...(act.guiaCircle?.focoDeHoy ?? { tema: '', palabrasDelDia: [], preguntas: [] }), muestra: e.target.value },
                    })
                  }
                  className={`${CAMPO_TEXTAREA} mt-1`}
                />
              </div>
              <EditorListaTexto
                etiqueta="Preguntas guía"
                valores={act.guiaCircle?.focoDeHoy.preguntas ?? []}
                onCambiar={(v) =>
                  campo('guiaCircle', {
                    ...(act.guiaCircle ?? { duracion: '10–15 min', rutinaDiaria: [], cierre: '' }),
                    focoDeHoy: { ...(act.guiaCircle?.focoDeHoy ?? { tema: '', palabrasDelDia: [], muestra: '' }), preguntas: v },
                  })
                }
              />
              <div>
                <Etiqueta>Cierre / transición</Etiqueta>
                <textarea value={act.guiaCircle?.cierre ?? ''} onChange={(e) => campo('guiaCircle', { ...(act.guiaCircle ?? { duracion: '10–15 min', rutinaDiaria: [], focoDeHoy: { tema: '', palabrasDelDia: [], muestra: '', preguntas: [] } }), cierre: e.target.value })} className={`${CAMPO_TEXTAREA} mt-1`} />
              </div>
            </>
          )}

          {act.bloque === 'outdoor' && (
            <>
              <div>
                <Etiqueta>Invitación de movimiento</Etiqueta>
                <textarea
                  value={act.guiaOutdoor?.movimientoIntencional.invitacion ?? ''}
                  onChange={(e) => campo('guiaOutdoor', { ...(act.guiaOutdoor ?? { juegoLibre: '', quePriorizar: '' }), movimientoIntencional: { ...(act.guiaOutdoor?.movimientoIntencional ?? { duracion: '10 min', ideas: [] }), invitacion: e.target.value } })}
                  className={`${CAMPO_TEXTAREA} mt-1`}
                />
              </div>
              <div>
                <Etiqueta>Después (juego libre)</Etiqueta>
                <textarea value={act.guiaOutdoor?.juegoLibre ?? ''} onChange={(e) => campo('guiaOutdoor', { ...(act.guiaOutdoor ?? { movimientoIntencional: { duracion: '10 min', invitacion: '', ideas: [] }, quePriorizar: '' }), juegoLibre: e.target.value })} className={`${CAMPO_TEXTAREA} mt-1`} />
              </div>
              <div>
                <Etiqueta>Qué priorizar</Etiqueta>
                <textarea value={act.guiaOutdoor?.quePriorizar ?? ''} onChange={(e) => campo('guiaOutdoor', { ...(act.guiaOutdoor ?? { movimientoIntencional: { duracion: '10 min', invitacion: '', ideas: [] }, juegoLibre: '' }), quePriorizar: e.target.value })} className={`${CAMPO_TEXTAREA} mt-1`} />
              </div>
            </>
          )}

          {act.bloque === 'cierre' && (
            <>
              <div>
                <Etiqueta>Recuerda</Etiqueta>
                <textarea value={act.guiaCierre?.recuerda ?? ''} onChange={(e) => campo('guiaCierre', { ...(act.guiaCierre ?? { pregunta: '', vocabulario: '' }), recuerda: e.target.value })} className={`${CAMPO_TEXTAREA} mt-1`} />
              </div>
              <div>
                <Etiqueta>Pregunta de cierre</Etiqueta>
                <input value={act.guiaCierre?.pregunta ?? ''} onChange={(e) => campo('guiaCierre', { ...(act.guiaCierre ?? { recuerda: '', vocabulario: '' }), pregunta: e.target.value })} className={`${CAMPO_INPUT} mt-1`} />
              </div>
            </>
          )}

          {act.bloque === 'centros' && (
            <div>
              <Etiqueta>Centros disponibles</Etiqueta>
              <div className="mt-1.5 flex flex-col gap-2">
                {(act.guiaCentros ?? []).map((c, i) => (
                  <div key={i} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                    <input
                      value={c.nombre}
                      onChange={(e) => {
                        const copia = [...(act.guiaCentros ?? [])];
                        copia[i] = { ...c, nombre: e.target.value };
                        campo('guiaCentros', copia);
                      }}
                      className={`${CAMPO_INPUT} mb-2`}
                      placeholder="Nombre del centro"
                    />
                    <textarea
                      value={c.provocacion}
                      onChange={(e) => {
                        const copia = [...(act.guiaCentros ?? [])];
                        copia[i] = { ...c, provocacion: e.target.value };
                        campo('guiaCentros', copia);
                      }}
                      className={CAMPO_TEXTAREA}
                      placeholder="Provocación"
                    />
                    <button type="button" onClick={() => campo('guiaCentros', (act.guiaCentros ?? []).filter((_, idx) => idx !== i))} className="mt-1.5 text-[12px] font-semibold text-[var(--coral)]">
                      Quitar centro
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => campo('guiaCentros', [...(act.guiaCentros ?? []), { nombre: '', material: '', provocacion: '', intencion: '' }])}
                  className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--accent)]"
                >
                  Agregar centro
                </button>
              </div>
            </div>
          )}

          {!['circle', 'outdoor', 'cierre', 'centros'].includes(act.bloque) && (
            <>
              <div>
                <Etiqueta>Preparación</Etiqueta>
                <textarea value={act.preparacion ?? ''} onChange={(e) => campo('preparacion', e.target.value)} className={`${CAMPO_TEXTAREA} mt-1`} />
              </div>
              <div>
                <Etiqueta>Qué haces tú</Etiqueta>
                <textarea value={act.queHaceMaestra ?? ''} onChange={(e) => campo('queHaceMaestra', e.target.value)} className={`${CAMPO_TEXTAREA} mt-1`} />
              </div>
              <div>
                <Etiqueta>Qué hacen los niños</Etiqueta>
                <textarea value={act.queHacenNinos ?? ''} onChange={(e) => campo('queHacenNinos', e.target.value)} className={`${CAMPO_TEXTAREA} mt-1`} />
              </div>
              <EditorListaTexto etiqueta="Preguntas guía" valores={act.preguntasGuia ?? []} onCambiar={(v) => campo('preguntasGuia', v)} />
            </>
          )}

          <div>
            <Etiqueta>Evidencia posible</Etiqueta>
            <textarea value={act.evidenciaPosible ?? ''} onChange={(e) => campo('evidenciaPosible', e.target.value)} className={`${CAMPO_TEXTAREA} mt-1`} />
          </div>
        </div>
      </Colapsable>

      <div className="flex flex-col gap-2">
        <motion.button
          whileTap={{ scale: 0.97 }}
          type="button"
          disabled={!act.titulo.trim()}
          onClick={() => onGuardar({ ...act, estadoContenido: 'lista', contenidoPendiente: false }, true)}
          className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] disabled:opacity-40"
        >
          Marcar como lista
        </motion.button>
        <button
          type="button"
          disabled={!act.titulo.trim()}
          onClick={() => onGuardar({ ...act, estadoContenido: 'borrador', contenidoPendiente: false }, false)}
          className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--text-primary)] disabled:opacity-40"
        >
          Guardar borrador
        </button>
        <button type="button" onClick={onCancelar} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
          Cancelar
        </button>
      </div>
    </div>
  );
}

/* ── PROPUESTA DEMO — nunca se guarda hasta que la maestra la usa (regla del usuario, punto 6/7). ── */
function PropuestaDemoCard({
  actividad,
  contexto,
  variante,
  onUsar,
  onIntentarOtra,
  onCancelar,
}: {
  actividad: Actividad;
  contexto: ContextoPropuestaActividad;
  variante: number;
  onUsar: (campos: Partial<Actividad>) => void;
  onIntentarOtra: () => void;
  onCancelar: () => void;
}) {
  const propuesta = generarPropuestaDemoParaBloque(actividad.bloque, contexto, variante);
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
      <p className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--butter)_18%,transparent)] px-2.5 py-1 text-[12px] font-semibold text-[var(--butter)]">
        <Sparkles size={13} aria-hidden="true" /> Propuesta de ejemplo — DEMO
      </p>
      <p className="mt-2 text-[12px] leading-snug text-[var(--text-tertiary)]">
        RAÍZ todavía no genera actividades con IA real — esto es una plantilla de ejemplo según el tipo de bloque y el contexto de este día. Revísala, edítala y apruébala antes de guardarla.
      </p>
      <ChipsContexto contexto={contexto} />
      <h3 className="mt-3 text-[18px] font-semibold text-[var(--text-primary)]">{propuesta.titulo}</h3>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{propuesta.objetivo}</p>
      {lineaDestacadaDePropuesta(actividad.bloque, propuesta) && <p className="mt-2 text-[13px] leading-snug text-[var(--text-primary)]">{lineaDestacadaDePropuesta(actividad.bloque, propuesta)}</p>}
      <div className="mt-4 flex flex-col gap-2">
        <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={() => onUsar(propuesta)} className="flex h-[48px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--bg)]">
          Usar y editar esta propuesta
        </motion.button>
        <button type="button" onClick={onIntentarOtra} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--text-primary)]">
          Probar otra
        </button>
        <button type="button" onClick={onCancelar} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function DetalleActividad() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') ?? undefined;

  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);
  const [etapaActiva, setEtapaActiva] = useState<Etapa>('Preschool');
  const [modo, setModo] = useState<Modo | null>(null);
  const [variantePropuesta, setVariantePropuesta] = useState(0);
  const [prefillEditor, setPrefillEditor] = useState<Partial<Actividad> | null>(null);
  const [planActual, setPlanActual] = useState<PlaneacionSemanal | null>(null);

  useEffect(() => {
    setNinos(leerNinos());
    setCargado(true);
  }, []);

  const encontrado = cargado ? actividadPorIdGlobal(params.id, { planId }) : undefined;
  const plan = planActual ?? encontrado?.plan;
  const dia = encontrado?.dia;
  const actividad = plan && dia ? plan.dias.find((d) => d.fecha === dia.fecha)?.actividades.find((a) => a.id === params.id) : encontrado?.actividad;

  useEffect(() => {
    if (!actividad || modo !== null) return;
    setModo(estadoContenidoDeActividad(actividad) === 'pendiente' ? 'elegir' : 'lectura');
  }, [actividad, modo]);

  if (!cargado) return null;

  if (!encontrado || !actividad || !dia || !plan) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta actividad</h1>
          <button type="button" onClick={() => router.push('/planeacion')} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a la planeación
          </button>
        </div>
      </AppShell>
    );
  }

  const tieneGuiaGenerica = actividad.preparacion || actividad.queHaceMaestra || actividad.queHacenNinos || actividad.preguntasGuia;
  const contexto = resolverContextoParaPropuesta(dia, actividad.bloque);

  function guardar(actividadActualizada: Actividad) {
    const actualizado = actualizarActividadEnPlan(plan!, dia!.fecha, actividadActualizada);
    setPlanActual(actualizado);
    setPrefillEditor(null);
    setModo('lectura');
  }

  function revisarPersonalizacion() {
    const conPersonalizacion = calcularPersonalizacionSemana(plan!, ninos);
    const limpio = { ...conPersonalizacion, dias: conPersonalizacion.dias.map((d) => (d.fecha !== dia!.fecha ? d : { ...d, actividades: d.actividades.map((a) => (a.id === actividad!.id ? { ...a, personalizacionDesactualizada: false } : a)) })) };
    guardarUnaPlaneacion(limpio);
    setPlanActual(limpio);
  }

  function mantenerPersonalizacion() {
    const actualizado = { ...plan!, dias: plan!.dias.map((d) => (d.fecha !== dia!.fecha ? d : { ...d, actividades: d.actividades.map((a) => (a.id === actividad!.id ? { ...a, personalizacionDesactualizada: false } : a)) })) };
    guardarUnaPlaneacion(actualizado);
    setPlanActual(actualizado);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button type="button" onClick={() => router.back()} aria-label="Atrás" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        {modo === 'elegir' && (
          <motion.div variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {BLOQUE_LABEL[actividad.bloque]} · {dia.dia} {actividad.hora}
            </p>
            <h1 className="mt-1 mb-5 text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">¿Cómo quieres completarla?</h1>
            <div className="flex flex-col gap-3">
              <button type="button" onClick={() => { setPrefillEditor(null); setModo('editar'); }} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-1)]">
                <PencilLine size={20} className="mt-0.5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                <div>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">Escribirla yo</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">Escribe o pega tu actividad. Completa solo los campos que quieras.</p>
                </div>
              </button>
              <button type="button" onClick={() => { setVariantePropuesta(0); setModo('propuesta'); }} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-1)]">
                <Sparkles size={20} className="mt-0.5 shrink-0 text-[var(--butter)]" aria-hidden="true" />
                <div>
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">Ayúdame a crearla</p>
                  <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">RAÍZ propone un ejemplo — tú decides si lo usas, lo editas o lo descartas.</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {modo === 'propuesta' && (
          <motion.div variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {BLOQUE_LABEL[actividad.bloque]} · {dia.dia} {actividad.hora}
            </p>
            <div className="mt-3">
              <PropuestaDemoCard
                actividad={actividad}
                contexto={contexto}
                variante={variantePropuesta}
                onUsar={(campos) => {
                  setPrefillEditor(campos);
                  setModo('editar');
                }}
                onIntentarOtra={() => setVariantePropuesta((v) => v + 1)}
                onCancelar={() => setModo('elegir')}
              />
            </div>
          </motion.div>
        )}

        {modo === 'editar' && (
          <motion.div variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {BLOQUE_LABEL[actividad.bloque]} · {dia.dia} {actividad.hora}
            </p>
            <h1 className="mt-1 mb-5 text-balance text-[20px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {estadoContenidoDeActividad(actividad) === 'pendiente' && !prefillEditor ? 'Completa esta actividad' : 'Editar actividad'}
            </h1>
            <EditorActividad
              base={{ ...actividad, ...(prefillEditor ?? {}) }}
              contexto={contexto}
              onGuardar={(actividadActualizada) => guardar(actividadActualizada)}
              onCancelar={() => {
                setPrefillEditor(null);
                setModo(estadoContenidoDeActividad(actividad) === 'pendiente' ? 'elegir' : 'lectura');
              }}
            />
          </motion.div>
        )}

        {modo === 'lectura' && (
          <>
            <motion.header variants={item} className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
                  {BLOQUE_LABEL[actividad.bloque]} · {dia.dia} {actividad.hora}
                </p>
                <span className="rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-semibold text-[var(--text-secondary)]">{ESTADO_CONTENIDO_LABEL[estadoContenidoDeActividad(actividad)]}</span>
              </div>
              <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">{actividad.titulo}</h1>
              <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">{actividad.objetivo}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {actividad.dominio && <span className="inline-flex w-fit rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)]">{actividad.dominio}</span>}
                <button type="button" onClick={() => { setPrefillEditor(null); setModo('editar'); }} className="inline-flex items-center gap-1 text-[13px] font-semibold text-[var(--accent)] underline">
                  <PencilLine size={13} aria-hidden="true" /> Editar actividad
                </button>
              </div>
            </motion.header>

            {actividad.personalizacionDesactualizada && (
              <motion.div variants={item} className="mb-6 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_16%,transparent)] p-4">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">La actividad cambió después de personalizarla.</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">¿Quieres revisar las adaptaciones y niños foco?</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={revisarPersonalizacion} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
                    Revisar ahora
                  </button>
                  <button type="button" onClick={mantenerPersonalizacion} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
                    Mantener por ahora
                  </button>
                </div>
              </motion.div>
            )}

            {/* ——— Materiales ——— */}
            {actividad.materiales.length > 0 && (
              <motion.section variants={item} className="mb-6">
                <Etiqueta>Materiales</Etiqueta>
                <div className="mt-2 flex flex-wrap gap-2">
                  {actividad.materiales.map((m) => (
                    <span
                      key={m.nombre}
                      className={`inline-flex items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 py-1 text-[12px] font-medium ${
                        m.disponible ? 'bg-[color-mix(in_oklab,var(--sage)_14%,transparent)] text-[var(--sage)]' : 'bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] text-[var(--coral)]'
                      }`}
                    >
                      <LeafCheck negativo={!m.disponible} size={14} />
                      {m.nombre}
                    </span>
                  ))}
                </div>
              </motion.section>
            )}

            {actividad.guiaCircle && (
              <motion.section variants={item} className="mb-6 flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">Circle Time · {actividad.guiaCircle.duracion}</p>
                <div>
                  <Etiqueta>Rutina diaria</Etiqueta>
                  <ul className="mt-2 flex flex-col gap-2">
                    {actividad.guiaCircle.rutinaDiaria.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-[14px] leading-snug text-[var(--text-primary)]">
                        <span aria-hidden="true">{r.icono}</span>
                        <span>
                          <strong>{r.titulo}:</strong> {r.texto}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Foco de hoy</p>
                  <p className="mt-2 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaCircle.focoDeHoy.tema}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {actividad.guiaCircle.focoDeHoy.palabrasDelDia.map((p) => (
                      <span key={p} className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-2.5 py-1 text-[12px] font-semibold text-[var(--accent)]">
                        {p}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-[14px] leading-snug text-[var(--text-primary)]">👀 {actividad.guiaCircle.focoDeHoy.muestra}</p>
                  <ul className="mt-2 flex flex-col gap-1">
                    {actividad.guiaCircle.focoDeHoy.preguntas.map((p, i) => (
                      <li key={i} className="text-[14px] leading-snug text-[var(--text-secondary)]">
                        💬 {p}
                      </li>
                    ))}
                  </ul>
                  {actividad.guiaCircle.focoDeHoy.libro && <p className="mt-2 text-[14px] text-[var(--text-primary)]">📖 {actividad.guiaCircle.focoDeHoy.libro}</p>}
                  {actividad.guiaCircle.focoDeHoy.letra && <p className="mt-1 text-[14px] text-[var(--text-primary)]">🔤 {actividad.guiaCircle.focoDeHoy.letra}</p>}
                  {actividad.guiaCircle.focoDeHoy.cancion && <p className="mt-1 text-[14px] text-[var(--text-primary)]">🎵 {actividad.guiaCircle.focoDeHoy.cancion}</p>}
                </div>
                <div>
                  <Etiqueta>Cierre / transición</Etiqueta>
                  <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaCircle.cierre}</p>
                </div>
              </motion.section>
            )}

            {actividad.guiaOutdoor && (
              <motion.section variants={item} className="mb-6 flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">Movimiento intencional · {actividad.guiaOutdoor.movimientoIntencional.duracion}</p>
                <p className="text-[15px] font-medium leading-snug text-[var(--text-primary)]">{actividad.guiaOutdoor.movimientoIntencional.invitacion}</p>
                <ul className="flex flex-col gap-1">
                  {actividad.guiaOutdoor.movimientoIntencional.ideas.map((idea, i) => (
                    <li key={i} className="text-[14px] leading-snug text-[var(--text-secondary)]">
                      · {idea}
                    </li>
                  ))}
                </ul>
                {actividad.guiaOutdoor.movimientoIntencional.cancion && <p className="text-[14px] text-[var(--text-primary)]">🎵 {actividad.guiaOutdoor.movimientoIntencional.cancion}</p>}
                <div className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-4">
                  <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Después</p>
                  <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaOutdoor.juegoLibre}</p>
                  {actividad.guiaOutdoor.preguntaInformal && <p className="mt-2 text-[14px] text-[var(--text-secondary)]">💬 {actividad.guiaOutdoor.preguntaInformal}</p>}
                </div>
                <p className="text-[12px] leading-snug text-[var(--text-tertiary)]">{actividad.guiaOutdoor.quePriorizar}</p>
              </motion.section>
            )}

            {actividad.guiaCentros && (
              <motion.section variants={item} className="mb-6">
                <Etiqueta>Centros disponibles hoy</Etiqueta>
                <div className="mt-2 flex flex-col gap-3">
                  {actividad.guiaCentros.map((c) => (
                    <div key={c.nombre} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                      <p className="text-[15px] font-semibold text-[var(--text-primary)]">{c.nombre}</p>
                      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">Material:</strong> {c.material}
                      </p>
                      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">Provocación:</strong> {c.provocacion}
                      </p>
                      <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                        <strong className="text-[var(--text-primary)]">Intención:</strong> {c.intencion}
                      </p>
                      {c.pregunta && <p className="mt-1 text-[13px] text-[var(--accent)]">💬 {c.pregunta}</p>}
                    </div>
                  ))}
                </div>
              </motion.section>
            )}

            {actividad.guiaCierre && (
              <motion.section variants={item} className="mb-6 flex flex-col gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
                <div>
                  <Etiqueta>Recuerda</Etiqueta>
                  <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaCierre.recuerda}</p>
                </div>
                <p className="text-[14px] text-[var(--text-secondary)]">💬 {actividad.guiaCierre.pregunta}</p>
                <p className="text-[14px] text-[var(--text-primary)]">🗣️ {actividad.guiaCierre.vocabulario}</p>
                {actividad.guiaCierre.cancionOMovimiento && <p className="text-[14px] text-[var(--text-primary)]">🎵 {actividad.guiaCierre.cancionOMovimiento}</p>}
                {actividad.guiaCierre.puenteManana && (
                  <div className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Puente a la próxima semana</p>
                    <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaCierre.puenteManana}</p>
                  </div>
                )}
              </motion.section>
            )}

            {tieneGuiaGenerica && (
              <motion.section variants={item} className="mb-6 flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
                {actividad.preparacion && (
                  <div>
                    <Etiqueta>Preparación</Etiqueta>
                    <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.preparacion}</p>
                  </div>
                )}
                {actividad.queHaceMaestra && (
                  <div>
                    <Etiqueta>Qué haces tú</Etiqueta>
                    <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queHaceMaestra}</p>
                  </div>
                )}
                {actividad.queHacenNinos && (
                  <div>
                    <Etiqueta>Qué hacen los niños</Etiqueta>
                    <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queHacenNinos}</p>
                  </div>
                )}
                {actividad.preguntasGuia && actividad.preguntasGuia.length > 0 && (
                  <div>
                    <Etiqueta>Preguntas guía</Etiqueta>
                    <ul className="mt-1 flex flex-col gap-1">
                      {actividad.preguntasGuia.map((p, i) => (
                        <li key={i} className="text-[14px] leading-snug text-[var(--text-primary)]">
                          · {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.section>
            )}

            {actividad.conexionTema && (
              <motion.p variants={item} className="mb-6 text-[13px] leading-snug text-[var(--text-tertiary)]">
                🔗 {actividad.conexionTema}
              </motion.p>
            )}

            {actividad.diferenciacion && (
              <motion.section
                variants={item}
                aria-label="Adaptación por etapa"
                className="mb-6 rounded-[var(--radius-card)] border-x border-b border-t-[3px] border-x-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-b-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-t-[var(--accent)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)]"
              >
                <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Una experiencia, cinco niveles</h2>
                <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
                  Así participa cada nivel en <strong>{actividad.titulo}</strong>.
                </p>
                <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Bandas de edad">
                  {ETAPAS_ORDEN.map((etapa) => (
                    <EtapaChip key={etapa} etapa={etapa} activa={etapa === etapaActiva} onClick={() => setEtapaActiva(etapa)} />
                  ))}
                </div>
                <motion.p
                  key={etapaActiva}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-4 rounded-[calc(var(--radius-button)-2px)] bg-[var(--surface-2)] p-4 text-[15px] leading-snug text-[var(--text-primary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
                >
                  {actividad.diferenciacion[etapaActiva]}
                </motion.p>
              </motion.section>
            )}

            <motion.div variants={item} className="mb-6 flex flex-col gap-3">
              {plan.personalizacionActiva && actividad.adaptacionesIndividuales && actividad.adaptacionesIndividuales.length > 0 && (
                <Colapsable titulo="Adaptaciones individuales" subtitulo="Ajustes puntuales — no implican un Plan Individual">
                  <ul className="flex flex-col gap-2">
                    {actividad.adaptacionesIndividuales.map((a, i) => {
                      const nino = ninoPorId(a.ninoId, ninos);
                      if (!nino) return null;
                      return (
                        <li key={i} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={30} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                              {nino.nombre} · <span className="font-normal text-[var(--text-secondary)]">{a.necesidad}</span>
                              {a.origenCalculo === 'raiz_sugerido' && <span className="ml-1.5 text-[11px] font-semibold text-[var(--accent)]">· sugerido por RAÍZ</span>}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">{a.ajuste}</p>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </Colapsable>
              )}

              {plan.personalizacionActiva && actividad.ninosFoco && actividad.ninosFoco.length > 0 && (
                <Colapsable titulo="Niños foco en esta actividad" subtitulo="Su meta activa, aprovechando esta misma experiencia">
                  <ul className="flex flex-col gap-2">
                    {actividad.ninosFoco.map((f, i) => {
                      const nino = ninoPorId(f.ninoId, ninos);
                      if (!nino) return null;
                      const yaObservado = f.estadoFoco === 'observado';
                      return (
                        <li key={i} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent)_7%,transparent)] p-3">
                          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={30} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                              {nino.nombre} · <span className="font-normal text-[var(--accent)]">{f.meta}</span>
                              {f.origenCalculo === 'raiz_sugerido' && <span className="ml-1.5 text-[11px] font-semibold text-[var(--accent)]">· sugerido por RAÍZ</span>}
                            </p>
                            <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">Observar: {f.observar}</p>
                          </div>
                          {yaObservado && f.observationId ? (
                            <Link href={`/observaciones/${f.observationId}`} className="shrink-0 text-[12px] font-semibold text-[var(--sage)] underline">
                              Ya observado
                            </Link>
                          ) : (
                            <Link
                              href={`/observar?ninoId=${nino.id}&actividadId=${actividad.id}${f.skillId ? `&skillId=${f.skillId}` : ''}`}
                              aria-label={`Registrar observación de ${nino.nombre}`}
                              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--accent)]"
                            >
                              <NotebookPen size={15} aria-hidden="true" />
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </Colapsable>
              )}

              {(actividad.queObservar || actividad.evidenciaPosible) && (
                <Colapsable titulo="Qué observar">
                  {actividad.queObservar && <p className="text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queObservar}</p>}
                  {actividad.evidenciaPosible && (
                    <p className="mt-2 text-[13px] leading-snug text-[var(--text-secondary)]">
                      <strong className="text-[var(--text-primary)]">Evidencia posible:</strong> {actividad.evidenciaPosible}
                    </p>
                  )}
                </Colapsable>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
