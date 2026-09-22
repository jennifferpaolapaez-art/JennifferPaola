'use client';

// REVISIÓN MENSUAL DEL PLAN INDIVIDUAL (Sesión 6, paso 7 / 6d ampliación) — la experiencia sencilla
// de "cerrar el mes" que el usuario pidió: agrupada por área, cada meta activa que aplica este mes
// muestra la sugerencia de RAÍZ (o la evidencia sin sugerencia, o "sin evidencia este mes") y la
// maestra Confirma / Cambia / Mantiene sin revisar / Ve la evidencia. RAÍZ nunca escribe el
// checkpoint sola. Navega entre meses del plan con ← →.

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import { ESTADO_CHECKPOINT_LABEL, guardarNinos, leerNinos, leerObservacionSkills, leerObservaciones, ninoPorId, planActivoDeNino, type EstadoCheckpoint, type MetaIndividual, type Nino, type Observacion, type ObservacionSkill } from '@/lib/seed-data';
import { fechaCorta } from '@/lib/prioridades';
import { agruparMetasPorArea, checkpointDeMes, confirmarCheckpoint, mesActualStr, mesesDelPlan, metasParaRevisionDelMes, nombreMesLargo, sugerirCheckpoint } from '@/lib/plan-seguimiento';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const ESTADOS_ORDEN: EstadoCheckpoint[] = ['sin_evidencia', 'aun_no', 'emergente', 'adquirido'];

function TarjetaRevisionMeta({
  nino,
  planId,
  meta,
  mes,
  observaciones,
  relaciones,
  onCambio,
}: {
  nino: Nino;
  planId: string;
  meta: MetaIndividual;
  mes: string;
  observaciones: Observacion[];
  relaciones: ObservacionSkill[];
  onCambio: (n: Nino) => void;
}) {
  const [omitida, setOmitida] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const [elegido, setElegido] = useState<EstadoCheckpoint | null>(null);
  const [verEvidencia, setVerEvidencia] = useState(false);

  const checkpoint = checkpointDeMes(meta, mes);
  const sugerencia = !checkpoint ? sugerirCheckpoint(nino, meta, mes, observaciones, relaciones) : null;

  if (checkpoint || omitida) {
    return (
      <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
        <p className="text-[14px] font-medium text-[var(--text-primary)]">{meta.descripcion}</p>
        <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
          {checkpoint ? (
            <>
              Confirmado este mes: <span className="font-semibold text-[var(--text-primary)]">{ESTADO_CHECKPOINT_LABEL[checkpoint.estado]}</span>
            </>
          ) : (
            'Lo dejaste sin revisar por ahora.'
          )}
        </p>
        {checkpoint && (
          <Link href={`/ninos/${nino.id}/plan-individual`} className="mt-1 inline-flex min-h-11 items-center text-[12px] font-semibold text-[var(--accent)] underline">
            Cambiar desde el Plan Individual
          </Link>
        )}
      </li>
    );
  }

  function confirmar(estado: EstadoCheckpoint) {
    onCambio(confirmarCheckpoint(nino, planId, meta.id, mes, estado, { sugeridoPorRaiz: sugerencia?.sugerido, observacionIds: sugerencia?.observacionIds ?? [] }));
  }

  return (
    <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
      <p className="text-[14px] font-medium text-[var(--text-primary)]">{meta.descripcion}</p>

      {sugerencia?.sugerido && sugerencia.sugerido !== 'sin_evidencia' ? (
        <>
          <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
            RAÍZ sugiere: <span className="font-semibold text-[var(--text-primary)]">{ESTADO_CHECKPOINT_LABEL[sugerencia.sugerido]}</span>
          </p>
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Basado en {sugerencia.observacionIds.length} {sugerencia.observacionIds.length === 1 ? 'observación aprobada' : 'observaciones aprobadas'}.
          </p>
        </>
      ) : sugerencia && sugerencia.observacionIds.length > 0 ? (
        <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
          Hay {sugerencia.observacionIds.length} {sugerencia.observacionIds.length === 1 ? 'observación aprobada' : 'observaciones aprobadas'} este mes. ¿Cómo la describirías?
        </p>
      ) : (
        <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">No hay suficiente evidencia nueva este mes.</p>
      )}

      {verEvidencia && sugerencia && sugerencia.observacionIds.length > 0 && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {sugerencia.observacionIds.map((id) => (
            <li key={id}>
              <Link href={`/observaciones/${id}`} className="text-[12px] font-semibold text-[var(--accent)] underline">
                Ver observación
              </Link>
            </li>
          ))}
        </ul>
      )}

      {cambiando && (
        <div className="mt-2 flex flex-wrap gap-2">
          {ESTADOS_ORDEN.map((e) => (
            <Chip key={e} label={ESTADO_CHECKPOINT_LABEL[e]} activo={elegido === e} onClick={() => setElegido(e)} />
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-3">
        {sugerencia?.sugerido && sugerencia.sugerido !== 'sin_evidencia' && !cambiando && (
          <button type="button" onClick={() => confirmar(sugerencia.sugerido!)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)]">
            Confirmar {ESTADO_CHECKPOINT_LABEL[sugerencia.sugerido]}
          </button>
        )}
        {cambiando ? (
          <button type="button" disabled={!elegido} onClick={() => confirmar(elegido!)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40">
            Guardar
          </button>
        ) : sugerencia?.observacionIds.length ? (
          <button type="button" onClick={() => setCambiando(true)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
            {sugerencia?.sugerido && sugerencia.sugerido !== 'sin_evidencia' ? 'Cambiar estado' : 'Elegir estado'}
          </button>
        ) : (
          <button type="button" onClick={() => confirmar('sin_evidencia')} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
            Marcar sin evidencia
          </button>
        )}
        {sugerencia && sugerencia.observacionIds.length > 0 && (
          <button type="button" onClick={() => setVerEvidencia((v) => !v)} className="min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
            {verEvidencia ? 'Ocultar evidencia' : 'Ver evidencia'}
          </button>
        )}
        <button type="button" onClick={() => setOmitida(true)} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
          Mantener sin revisar
        </button>
      </div>
    </li>
  );
}

function RevisionContenido() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const busqueda = useSearchParams();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setCargado(true);
  }, []);

  const nino = ninoPorId(params.id, ninos);
  const plan = nino ? planActivoDeNino(nino) : undefined;
  const meses = plan ? mesesDelPlan(plan) : [];
  const mesParam = busqueda.get('mes');
  const mes = mesParam && meses.includes(mesParam) ? mesParam : meses.includes(mesActualStr()) ? mesActualStr() : (meses[meses.length - 1] ?? mesActualStr());
  const idx = meses.indexOf(mes);

  function guardarCambioNino(ninoActualizado: Nino) {
    const actualizados = ninos.map((n) => (n.id === ninoActualizado.id ? ninoActualizado : n));
    setNinos(actualizados);
    guardarNinos(actualizados);
  }

  function irAMes(nuevoMes: string) {
    router.push(`/ninos/${params.id}/plan-individual/revision?mes=${nuevoMes}`);
  }

  if (!cargado) return null;
  if (!nino || !plan) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Sin Plan Individual activo</h1>
          <Link href={`/ninos/${params.id}/plan-individual`} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Ir al Plan Individual
          </Link>
        </div>
      </AppShell>
    );
  }

  const metasDelMes = metasParaRevisionDelMes(plan.metas, mes);
  const areas = agruparMetasPorArea(metasDelMes);
  const conEvidenciaNueva = metasDelMes.filter((m) => !checkpointDeMes(m, mes) && sugerirCheckpoint(nino, m, mes, observaciones, relaciones).observacionIds.length > 0).length;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <Link href={`/ninos/${nino.id}/plan-individual`} aria-label="Volver al Plan Individual" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-4">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{nino.nombre}</p>
          <h1 className="mt-1 text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Revisión mensual del Plan</h1>
        </motion.header>

        <motion.div variants={item} className="mb-5 flex items-center justify-between rounded-[var(--radius-card)] bg-[var(--surface-2)] p-2">
          <button type="button" disabled={idx <= 0} onClick={() => irAMes(meses[idx - 1])} aria-label="Mes anterior" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)] disabled:opacity-30">
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">{nombreMesLargo(mes)}</p>
          <button type="button" disabled={idx >= meses.length - 1} onClick={() => irAMes(meses[idx + 1])} aria-label="Mes siguiente" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)] disabled:opacity-30">
            <ChevronRight size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.p variants={item} className="mb-5 text-[14px] leading-snug text-[var(--text-primary)]">
          {conEvidenciaNueva > 0
            ? `${conEvidenciaNueva} ${conEvidenciaNueva === 1 ? 'meta tiene' : 'metas tienen'} nueva evidencia este mes.`
            : metasDelMes.length === 0
              ? 'Ninguna meta activa aplica este mes.'
              : 'Nada nuevo que revisar por ahora.'}
        </motion.p>

        {areas.map((a) => (
          <motion.section key={a.areaId} variants={item} className="mb-6">
            <h2 className="mb-2 text-[15px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">{a.area}</h2>
            <ul className="flex flex-col gap-3">
              {a.metas.map((m) => (
                <TarjetaRevisionMeta key={m.id} nino={nino} planId={plan.id} meta={m} mes={mes} observaciones={observaciones} relaciones={relaciones} onCambio={guardarCambioNino} />
              ))}
            </ul>
          </motion.section>
        ))}
      </motion.div>
    </AppShell>
  );
}

export default function RevisionMensualPage() {
  return (
    <Suspense fallback={null}>
      <RevisionContenido />
    </Suspense>
  );
}
