'use client';

// EVALUACIÓN — generar/revisar/aprobar (Sesión 6, paso 4: Perfil completo del niño). El borrador
// se prellena con lo que ya se sabe (nunca inventa); puede guardarse incompleto y completarse
// después. RAÍZ nunca marca nada como logrado sin que la maestra apruebe explícitamente.
//
// RONDA 2 (capa de experiencia, misma arquitectura): la maestra responde sobre una CONDUCTA
// OBSERVABLE concreta (cuando el skill tiene una `PreguntaObservable` — regla del usuario:
// "pregunta observable → respuesta concreta → RAÍZ interpreta → estado_desarrollo +
// estado_evidencia"), no directamente entre 3-4 botones grandes de estado. El estado derivado se
// muestra chico, como conclusión — con opción de editarlo a mano si hace falta. Los skills sin
// pregunta definida todavía (fuera del alcance de esta demo) siguen editándose directo.

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { AppShell, Chip, LeafCheck } from '@/components/app/shell';
import {
  FECHA_HOY,
  SKILLS_CATALOG,
  agregarEventosSkill,
  aprobarEvaluacion,
  eventosDeAprobacion,
  derivarEstadoDesdeConteo,
  generarBorradorEvaluacion,
  guardarNinos,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  leerProgramaConfig,
  ninoPorId,
  preguntaObservablePorSkill,
  type EstadoDesarrollo,
  type EstadoEvidencia,
  type EvaluacionNino,
  type Nino,
  type OpcionObservable,
  type PreguntaObservable,
  type ResultadoEvaluacion,
  type TipoEvaluacion,
} from '@/lib/seed-data';
import { cicloPorId, generarBorradorEvaluacionPeriodica, marcarEvaluacionActual, marcarPeriodoFin } from '@/lib/ciclo-revision';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const DESARROLLO_OPCIONES: { valor: EstadoDesarrollo; label: string }[] = [
  { valor: 'desconocido', label: 'Desconocido' },
  { valor: 'en_desarrollo', label: 'En desarrollo' },
  { valor: 'dominado', label: 'Dominado' },
];
const EVIDENCIA_OPCIONES: { valor: EstadoEvidencia; label: string }[] = [
  { valor: 'no_observado', label: 'No observado' },
  { valor: 'insuficiente', label: 'Insuficiente' },
  { valor: 'suficiente', label: 'Suficiente' },
  { valor: 'contradictoria', label: 'Contradictoria' },
];
const DESARROLLO_LABEL: Record<EstadoDesarrollo, string> = { desconocido: 'Desconocido', en_desarrollo: 'En desarrollo', dominado: 'Dominado' };
const EVIDENCIA_LABEL: Record<EstadoEvidencia, string> = { no_observado: 'sin observar', insuficiente: 'evidencia insuficiente', suficiente: 'evidencia suficiente', contradictoria: 'evidencia contradictoria' };

/** Fila de opción compacta (radio) — más chica que <Chip>, pensada para listas de 4-6 respuestas
 * progresivas dentro de una pregunta observable (regla del usuario: "interfaz más pequeña y
 * limpia, las preguntas son lo principal"). */
function OpcionRadio({ texto, seleccionada, onClick, deshabilitada }: { texto: string; seleccionada: boolean; onClick: () => void; deshabilitada?: boolean }) {
  return (
    <button
      type="button"
      disabled={deshabilitada}
      onClick={onClick}
      aria-pressed={seleccionada}
      className="flex min-h-11 w-full items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-left transition-colors disabled:opacity-70"
      style={{ background: seleccionada ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent' }}
    >
      <span
        className="flex size-4 shrink-0 items-center justify-center rounded-full border-2"
        style={{ borderColor: seleccionada ? 'var(--accent)' : 'var(--text-tertiary)' }}
      >
        {seleccionada && <span className="size-2 rounded-full" style={{ background: 'var(--accent)' }} />}
      </span>
      <span className="text-[13.5px] leading-snug" style={{ color: seleccionada ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: seleccionada ? 600 : 400 }}>
        {texto}
      </span>
    </button>
  );
}

/** Chip pequeño de checkbox — para preguntas de selección múltiple (ej. números 1–10). */
function CasillaCompacta({ texto, marcada, onClick, deshabilitada }: { texto: string; marcada: boolean; onClick: () => void; deshabilitada?: boolean }) {
  return (
    <button
      type="button"
      disabled={deshabilitada}
      onClick={onClick}
      aria-pressed={marcada}
      className="flex size-11 shrink-0 items-center justify-center rounded-[10px] text-[13px] font-semibold transition-colors disabled:opacity-70"
      style={{
        background: marcada ? 'var(--accent)' : 'var(--surface-2)',
        color: marcada ? 'var(--bg)' : 'var(--text-primary)',
      }}
    >
      {texto}
    </button>
  );
}

function FilaResultado({
  r,
  soloLectura,
  onCambiar,
}: {
  r: ResultadoEvaluacion;
  soloLectura: boolean;
  onCambiar: (cambios: Partial<ResultadoEvaluacion>) => void;
}) {
  const catalogo = SKILLS_CATALOG.find((c) => c.id === r.skillId);
  const pregunta = preguntaObservablePorSkill(r.skillId);
  const [editandoDirecto, setEditandoDirecto] = useState(false);

  const encabezado = (
    <>
      <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{catalogo?.dominio ?? ''}</p>
      <p className="text-[15px] font-medium text-[var(--text-primary)]">{catalogo?.nombre ?? r.skillId}</p>
    </>
  );

  if (!pregunta) {
    // Sin pregunta observable definida todavía — se edita directo (fallback honesto, no todos
    // los skills de esta demo tienen su pregunta construida).
    return (
      <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        {encabezado}
        {r.sugeridoPorRaiz && !r.editadoPorMaestra && <p className="mt-0.5 text-[12px] text-[var(--accent)]">Prellenado con lo ya observado</p>}
        <p className="mb-1 mt-3 text-[12px] font-medium text-[var(--text-tertiary)]">Desarrollo</p>
        <div className="flex flex-wrap gap-2">
          {DESARROLLO_OPCIONES.map((op) => (
            <Chip key={op.valor} label={op.label} activo={r.estadoDesarrollo === op.valor} onClick={() => !soloLectura && onCambiar({ estadoDesarrollo: op.valor })} />
          ))}
        </div>
        <p className="mb-1 mt-3 text-[12px] font-medium text-[var(--text-tertiary)]">Evidencia</p>
        <div className="flex flex-wrap gap-2">
          {EVIDENCIA_OPCIONES.map((op) => (
            <Chip key={op.valor} label={op.label} activo={r.estadoEvidencia === op.valor} onClick={() => !soloLectura && onCambiar({ estadoEvidencia: op.valor })} />
          ))}
        </div>
      </li>
    );
  }

  const respuestaActual = r.respuestaObservableIds ?? [];

  function elegirUnica(opcion: OpcionObservable) {
    onCambiar({ estadoDesarrollo: opcion.estadoDesarrollo, estadoEvidencia: opcion.estadoEvidencia, respuestaObservableIds: [opcion.id] });
  }

  function alternarMultiple(opcionId: string) {
    if (!pregunta) return;
    const nuevas = respuestaActual.includes(opcionId) ? respuestaActual.filter((x) => x !== opcionId) : [...respuestaActual, opcionId];
    const derivado = derivarEstadoDesdeConteo(pregunta, nuevas);
    onCambiar({ estadoDesarrollo: derivado.estadoDesarrollo, estadoEvidencia: derivado.estadoEvidencia, respuestaObservableIds: nuevas });
  }

  return (
    <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
      {encabezado}
      <p className="mt-3 text-[13.5px] font-medium text-[var(--text-primary)]">{pregunta.texto}</p>

      {pregunta.tipoRespuesta === 'seleccion_unica' ? (
        <div className="mt-2 flex flex-col gap-0.5">
          {pregunta.opciones!.map((op) => (
            <OpcionRadio key={op.id} texto={op.texto} seleccionada={respuestaActual[0] === op.id} onClick={() => elegirUnica(op)} deshabilitada={soloLectura} />
          ))}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {pregunta.opcionesMultiples!.map((op) => (
            <CasillaCompacta key={op.id} texto={op.texto} marcada={respuestaActual.includes(op.id)} onClick={() => alternarMultiple(op.id)} deshabilitada={soloLectura} />
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[color-mix(in_oklab,var(--text-tertiary)_14%,transparent)] pt-2.5">
        <p className="text-[12px] text-[var(--text-tertiary)]">
          Estado sugerido: <span className="font-semibold text-[var(--text-secondary)]">{DESARROLLO_LABEL[r.estadoDesarrollo]}</span> · {EVIDENCIA_LABEL[r.estadoEvidencia]}
        </p>
        {!soloLectura && (
          <button type="button" onClick={() => setEditandoDirecto((v) => !v)} className="flex shrink-0 items-center gap-1 text-[12px] font-semibold text-[var(--accent)]">
            <Pencil size={11} aria-hidden="true" />
            Editar
          </button>
        )}
      </div>

      {editandoDirecto && !soloLectura && (
        <div className="mt-3 rounded-[10px] bg-[var(--surface-2)] p-3">
          <p className="mb-1 text-[11px] font-medium text-[var(--text-tertiary)]">Corregir desarrollo</p>
          <div className="flex flex-wrap gap-1.5">
            {DESARROLLO_OPCIONES.map((op) => (
              <Chip key={op.valor} label={op.label} activo={r.estadoDesarrollo === op.valor} onClick={() => onCambiar({ estadoDesarrollo: op.valor })} />
            ))}
          </div>
          <p className="mb-1 mt-2.5 text-[11px] font-medium text-[var(--text-tertiary)]">Corregir evidencia</p>
          <div className="flex flex-wrap gap-1.5">
            {EVIDENCIA_OPCIONES.map((op) => (
              <Chip key={op.valor} label={op.label} activo={r.estadoEvidencia === op.valor} onClick={() => onCambiar({ estadoEvidencia: op.valor })} />
            ))}
          </div>
        </div>
      )}
    </li>
  );
}

function EvaluacionContenido() {
  const params = useParams<{ id: string; evalId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cicloId = searchParams.get('ciclo');
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [evaluacion, setEvaluacion] = useState<EvaluacionNino | null>(null);
  const [cargado, setCargado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const listaNinos = leerNinos();
    setNinos(listaNinos);
    const nino = ninoPorId(params.id, listaNinos);
    if (!nino) {
      setCargado(true);
      return;
    }
    if (params.evalId === 'nueva') {
      const tipo = (searchParams.get('tipo') as TipoEvaluacion) ?? 'ingreso';
      const config = leerProgramaConfig();
      // Dentro del flujo de Revisión Periódica (6f): solo entran los skills que corresponde
      // revisar (`skillsParaRevisionPeriodica`), nunca todo el catálogo — eso queda reservado para
      // la evaluación de ingreso, donde sí tiene sentido verlo todo por primera vez.
      const ciclo = cicloId ? cicloPorId(cicloId) : undefined;
      if (ciclo) {
        setEvaluacion(generarBorradorEvaluacionPeriodica(nino, config.tracksActivos, ciclo.id, ciclo.periodoInicio, leerObservaciones(), leerObservacionSkills()));
      } else {
        setEvaluacion(generarBorradorEvaluacion(nino, tipo, config.tracksActivos));
      }
    } else {
      setEvaluacion(nino.evaluaciones.find((e) => e.id === params.evalId) ?? null);
    }
    setCargado(true);
  }, [params.id, params.evalId, searchParams, cicloId]);

  const nino = ninoPorId(params.id, ninos);

  function actualizarResultado(resultadoId: string, cambios: Partial<ResultadoEvaluacion>) {
    setEvaluacion((ev) => (ev ? { ...ev, resultados: ev.resultados.map((r) => (r.id === resultadoId ? { ...r, ...cambios, editadoPorMaestra: true } : r)) } : ev));
  }

  function guardarBorrador() {
    if (!nino || !evaluacion) return;
    setGuardando(true);
    const yaExiste = nino.evaluaciones.some((e) => e.id === evaluacion.id);
    const evaluacionesActualizadas = yaExiste
      ? nino.evaluaciones.map((e) => (e.id === evaluacion.id ? evaluacion : e))
      : [...nino.evaluaciones, evaluacion];
    const ninoActualizado = { ...nino, evaluaciones: evaluacionesActualizadas };
    guardarNinos(ninos.map((n) => (n.id === nino.id ? ninoActualizado : n)));
    if (cicloId) {
      marcarEvaluacionActual(cicloPorId(cicloId)!, evaluacion.id);
      router.push(`/ninos/${nino.id}/revision-periodica?ciclo=${cicloId}`);
    } else {
      router.push(`/ninos/${nino.id}`);
    }
  }

  function aprobar() {
    if (!nino || !evaluacion) return;
    setGuardando(true);
    // Historial (Sesión 6 paso 7 / 6c): los eventos se calculan con el niño ANTES de aprobar,
    // porque `aprobarEvaluacion` sobrescribe `nino.skills`. Solo los skills que realmente
    // cambiaron generan un evento.
    agregarEventosSkill(eventosDeAprobacion(nino, { ...evaluacion, estado: 'aprobada' }));
    const ninoActualizado = aprobarEvaluacion(nino, evaluacion, 'maestra');
    guardarNinos(ninos.map((n) => (n.id === nino.id ? ninoActualizado : n)));
    if (cicloId) {
      const evaluacionAprobada = ninoActualizado.evaluaciones.find((e) => e.id === evaluacion.id);
      const ciclo = marcarEvaluacionActual(cicloPorId(cicloId)!, evaluacion.id);
      marcarPeriodoFin(ciclo, evaluacionAprobada?.aprobadaEn ?? FECHA_HOY);
      router.push(`/ninos/${nino.id}/revision-periodica?ciclo=${cicloId}`);
    } else {
      router.push(`/ninos/${nino.id}`);
    }
  }

  if (!cargado) return null;

  if (!nino || !evaluacion) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta evaluación</h1>
          <button type="button" onClick={() => router.push(`/ninos/${params.id}`)} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver al perfil
          </button>
        </div>
      </AppShell>
    );
  }

  const soloLectura = evaluacion.estado === 'aprobada';

  // Agrupa por dominio para mostrar secciones (regla del usuario: "secciones por dominio").
  const dominiosOrden: string[] = [];
  const porDominio = new Map<string, ResultadoEvaluacion[]>();
  for (const r of evaluacion.resultados) {
    const dominio = SKILLS_CATALOG.find((c) => c.id === r.skillId)?.dominio ?? 'General';
    if (!porDominio.has(dominio)) {
      porDominio.set(dominio, []);
      dominiosOrden.push(dominio);
    }
    porDominio.get(dominio)!.push(r);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push(`/ninos/${nino.id}`)}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-2">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
            {nino.nombre} · {evaluacion.tipo === 'ingreso' ? 'Evaluación de ingreso' : 'Evaluación periódica'}
          </p>
          <h1 className="mt-1 text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {soloLectura ? 'Evaluación aprobada' : 'Revisa el borrador'}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            {evaluacion.fecha} · edad al momento {evaluacion.edadAlMomentoMeses} meses · {evaluacion.etapaAlMomento}
            {soloLectura && evaluacion.aprobadaEn && ` · aprobada ${evaluacion.aprobadaEn}`}
          </p>
        </motion.header>

        {!soloLectura && (
          <motion.p variants={item} className="mb-4 text-[13px] text-[var(--text-secondary)]">
            Responde sobre lo que has visto. Lo que no hayas observado puedes dejarlo así y guardar — no tienes que completarla toda de una vez.
          </motion.p>
        )}

        {dominiosOrden.map((dominio) => (
          <motion.section key={dominio} variants={item} className="mb-5">
            <h2 className="mb-2 text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">{dominio.replace(/_/g, ' ')}</h2>
            <ul className="flex flex-col gap-3">
              {porDominio.get(dominio)!.map((r) => (
                <FilaResultado key={r.id} r={r} soloLectura={soloLectura} onCambiar={(cambios) => actualizarResultado(r.id, cambios)} />
              ))}
            </ul>
          </motion.section>
        ))}

        {!soloLectura && (
          <motion.div variants={item} className="mt-3 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={guardando}
              onClick={aprobar}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
              <LeafCheck size={18} />
              Aprobar evaluación
            </motion.button>
            <button
              type="button"
              disabled={guardando}
              onClick={guardarBorrador}
              className="flex h-11 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[14px] font-semibold text-[var(--text-primary)] disabled:opacity-50"
            >
              Guardar borrador y continuar después
            </button>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}

export default function Evaluacion() {
  return (
    <Suspense fallback={null}>
      <EvaluacionContenido />
    </Suspense>
  );
}
