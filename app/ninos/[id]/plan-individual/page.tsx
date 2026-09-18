'use client';

// PLAN INDIVIDUAL — opcional, vive dentro del perfil del niño (Sesión 6, paso 4). Una
// necesidad/adaptación NUNCA lo crea automáticamente — la maestra decide cuándo. RAÍZ nunca marca
// una meta como "alcanzado" sola; siempre es una acción explícita de la maestra.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import { guardarNinos, leerNinos, ninoPorId, type EstadoMetaIndividual, type MetaIndividual, type Nino } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const ESTADOS_META: { valor: EstadoMetaIndividual; label: string }[] = [
  { valor: 'por_trabajar', label: 'Por trabajar' },
  { valor: 'en_progreso', label: 'En progreso' },
  { valor: 'casi', label: 'Casi' },
  { valor: 'alcanzado', label: 'Alcanzado' },
];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function PlanIndividualPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [nuevaMeta, setNuevaMeta] = useState('');

  useEffect(() => {
    setNinos(leerNinos());
    setCargado(true);
  }, []);

  const nino = ninoPorId(params.id, ninos);

  function guardarCambioNino(ninoActualizado: Nino) {
    const actualizados = ninos.map((n) => (n.id === ninoActualizado.id ? ninoActualizado : n));
    setNinos(actualizados);
    guardarNinos(actualizados);
  }

  function crearPlan() {
    if (!nino) return;
    guardarCambioNino({
      ...nino,
      planIndividual: { id: `plan-${Date.now()}`, fechaCreacion: hoyISO(), estado: 'activo', motivo: motivo.trim() || undefined, metas: [] },
    });
  }

  function agregarMeta() {
    if (!nino?.planIndividual || !nuevaMeta.trim()) return;
    const meta: MetaIndividual = {
      id: `meta-${Date.now()}`,
      descripcion: nuevaMeta.trim(),
      estado: 'por_trabajar',
      fechaActualizacion: hoyISO(),
    };
    guardarCambioNino({ ...nino, planIndividual: { ...nino.planIndividual, metas: [...nino.planIndividual.metas, meta] } });
    setNuevaMeta('');
  }

  function cambiarEstadoMeta(metaId: string, estado: EstadoMetaIndividual) {
    if (!nino?.planIndividual) return;
    guardarCambioNino({
      ...nino,
      planIndividual: {
        ...nino.planIndividual,
        metas: nino.planIndividual.metas.map((m) => (m.id === metaId ? { ...m, estado, fechaActualizacion: hoyISO() } : m)),
      },
    });
  }

  function cambiarEstadoPlan(estado: 'activo' | 'pausado' | 'cerrado') {
    if (!nino?.planIndividual) return;
    guardarCambioNino({ ...nino, planIndividual: { ...nino.planIndividual, estado } });
  }

  if (!cargado) return null;
  if (!nino) return null;

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

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{nino.nombre}</p>
          <h1 className="mt-1 text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Plan Individual
          </h1>
        </motion.header>

        {!nino.planIndividual ? (
          <motion.div variants={item}>
            <p className="mb-3 text-[14px] text-[var(--text-secondary)]">
              Tener una necesidad o adaptación no crea un Plan Individual automáticamente — esta es tu decisión.
            </p>
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Motivo (opcional)</label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="¿Por qué crear este plan ahora?"
              className="mb-4 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={crearPlan}
              className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
            >
              Crear Plan Individual
            </motion.button>
          </motion.div>
        ) : (
          <motion.div variants={item}>
            {nino.planIndividual.motivo && <p className="mb-3 text-[14px] text-[var(--text-secondary)]">{nino.planIndividual.motivo}</p>}

            <p className="mb-2 text-[12px] font-medium text-[var(--text-tertiary)]">Estado del plan</p>
            <div className="mb-5 flex flex-wrap gap-2">
              {(['activo', 'pausado', 'cerrado'] as const).map((e) => (
                <Chip key={e} label={e} activo={nino.planIndividual!.estado === e} onClick={() => cambiarEstadoPlan(e)} />
              ))}
            </div>

            <p className="mb-2 text-[14px] font-semibold text-[var(--text-primary)]">Metas</p>
            <ul className="mb-4 flex flex-col gap-3">
              {nino.planIndividual.metas.map((m) => (
                <li key={m.id} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                  <p className="text-[14px] font-medium text-[var(--text-primary)]">{m.descripcion}</p>
                  {m.estrategias && <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Estrategia: {m.estrategias}</p>}
                  {m.siguientePaso && <p className="mt-1 text-[13px] text-[var(--text-secondary)]">Siguiente paso: {m.siguientePaso}</p>}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ESTADOS_META.map((op) => (
                      <Chip key={op.valor} label={op.label} activo={m.estado === op.valor} onClick={() => cambiarEstadoMeta(m.id, op.valor)} />
                    ))}
                  </div>
                </li>
              ))}
              {nino.planIndividual.metas.length === 0 && <p className="text-[13px] text-[var(--text-tertiary)]">Sin metas todavía.</p>}
            </ul>

            <div className="flex gap-2">
              <input
                value={nuevaMeta}
                onChange={(e) => setNuevaMeta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarMeta())}
                placeholder="Nueva meta"
                className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={agregarMeta}
                disabled={!nuevaMeta.trim()}
                aria-label="Agregar meta"
                className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[var(--text-primary)] disabled:opacity-40"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}
