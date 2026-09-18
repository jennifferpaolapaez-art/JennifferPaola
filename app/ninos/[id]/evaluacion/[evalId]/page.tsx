'use client';

// EVALUACIÓN — generar/revisar/aprobar (Sesión 6, paso 4: Perfil completo del niño). El borrador
// se prellena con lo que ya se sabe (nunca inventa); puede guardarse incompleto y completarse
// después. RAÍZ nunca marca nada como logrado sin que la maestra apruebe explícitamente.

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import {
  SKILLS_CATALOG,
  aprobarEvaluacion,
  generarBorradorEvaluacion,
  guardarNinos,
  leerNinos,
  leerProgramaConfig,
  ninoPorId,
  type EstadoDesarrollo,
  type EstadoEvidencia,
  type EvaluacionNino,
  type Nino,
  type ResultadoEvaluacion,
  type TipoEvaluacion,
} from '@/lib/seed-data';

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

function EvaluacionContenido() {
  const params = useParams<{ id: string; evalId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
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
      setEvaluacion(generarBorradorEvaluacion(nino, tipo, config.tracksActivos));
    } else {
      setEvaluacion(nino.evaluaciones.find((e) => e.id === params.evalId) ?? null);
    }
    setCargado(true);
  }, [params.id, params.evalId, searchParams]);

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
    router.push(`/ninos/${nino.id}`);
  }

  function aprobar() {
    if (!nino || !evaluacion) return;
    setGuardando(true);
    const ninoActualizado = aprobarEvaluacion(nino, evaluacion, 'maestra');
    guardarNinos(ninos.map((n) => (n.id === nino.id ? ninoActualizado : n)));
    router.push(`/ninos/${nino.id}`);
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
            Ya prellenamos lo que sabíamos. Revisa, ajusta lo que haga falta, y guarda como borrador si quieres continuar después — no tienes que terminarla toda de una vez.
          </motion.p>
        )}

        <motion.ul variants={item} className="flex flex-col gap-3">
          {evaluacion.resultados.map((r) => {
            const catalogo = SKILLS_CATALOG.find((c) => c.id === r.skillId);
            return (
              <li key={r.id} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{catalogo?.dominio ?? ''}</p>
                <p className="text-[15px] font-medium text-[var(--text-primary)]">{catalogo?.nombre ?? r.skillId}</p>
                {r.sugeridoPorRaiz && !r.editadoPorMaestra && (
                  <p className="mt-0.5 text-[12px] text-[var(--accent)]">Prellenado con lo ya observado</p>
                )}

                <p className="mb-1 mt-3 text-[12px] font-medium text-[var(--text-tertiary)]">Desarrollo</p>
                <div className="flex flex-wrap gap-2">
                  {DESARROLLO_OPCIONES.map((op) => (
                    <Chip
                      key={op.valor}
                      label={op.label}
                      activo={r.estadoDesarrollo === op.valor}
                      onClick={() => !soloLectura && actualizarResultado(r.id, { estadoDesarrollo: op.valor })}
                    />
                  ))}
                </div>

                <p className="mb-1 mt-3 text-[12px] font-medium text-[var(--text-tertiary)]">Evidencia</p>
                <div className="flex flex-wrap gap-2">
                  {EVIDENCIA_OPCIONES.map((op) => (
                    <Chip
                      key={op.valor}
                      label={op.label}
                      activo={r.estadoEvidencia === op.valor}
                      onClick={() => !soloLectura && actualizarResultado(r.id, { estadoEvidencia: op.valor })}
                    />
                  ))}
                </div>
              </li>
            );
          })}
        </motion.ul>

        {!soloLectura && (
          <motion.div variants={item} className="mt-6 flex flex-col gap-3">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={guardando}
              onClick={aprobar}
              className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
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
