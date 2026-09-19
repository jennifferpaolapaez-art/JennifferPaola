'use client';

// PROPUESTA DE PLAN INDIVIDUAL (Sesión 6, paso 7 / 6d). RAÍZ arma un BORRADOR con lo que sabe;
// VER la propuesta no crea nada. Solo "Crear Plan Individual" (o "Editar antes de crear" → crear)
// escribe algo, y siempre es decisión explícita de la maestra. Meta, raíces, estrategias y rutas
// vienen de reglas DEMO escritas a mano (`RUTAS_DEMO`) hasta el Catálogo Pedagógico Oficial + IA real.

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { guardarNinos, leerEventosSkill, leerNinos, leerObservacionSkills, leerObservaciones, ninoPorId, type Nino } from '@/lib/seed-data';
import {
  calcularPrioridadDeSkill,
  construirBorradorPlan,
  crearPlanDesdeBorrador,
  fechaCorta,
  puedeSugerirPlan,
  registrarDecisionPrioridad,
  type ContextoDatos,
} from '@/lib/prioridades';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

const CAMPO =
  'w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <motion.section variants={item} className="mb-5">
      <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{titulo}</h2>
      <div className="mt-1.5">{children}</div>
    </motion.section>
  );
}

function Lista({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-1">
      {items.map((t) => (
        <li key={t} className="text-[14px] leading-snug text-[var(--text-primary)]">
          {t}
        </li>
      ))}
    </ul>
  );
}

function PropuestaContenido() {
  const params = useParams<{ id: string }>();
  const busqueda = useSearchParams();
  const router = useRouter();
  const skillId = busqueda.get('skill') ?? '';
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [datos, setDatos] = useState<ContextoDatos | null>(null);
  const [editando, setEditando] = useState(false);
  const [meta, setMeta] = useState('');
  const [estrategias, setEstrategias] = useState('');
  const [siguientePaso, setSiguientePaso] = useState('');
  const [fechaRevision, setFechaRevision] = useState('');
  const [creado, setCreado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    setNinos(leerNinos());
    setDatos({ observaciones: leerObservaciones(), relaciones: leerObservacionSkills(), eventos: leerEventosSkill() });
  }, []);

  const nino = ninoPorId(params.id, ninos);
  const skill = nino?.skills.find((s) => s.id === skillId);
  const prioridad = nino && skill && datos ? calcularPrioridadDeSkill(nino, skill, datos) : null;
  const borrador = nino && prioridad && datos ? construirBorradorPlan(nino, prioridad, datos) : null;

  // Los campos editables se inicializan una sola vez, cuando el borrador existe.
  useEffect(() => {
    if (!borrador) return;
    setMeta((m) => m || borrador.metaSugerida);
    setEstrategias((e) => e || borrador.estrategias.join(' · '));
    setSiguientePaso((s) => s || `Observar: ${borrador.queObservar[0]}`);
    setFechaRevision((f) => f || borrador.fechaRevision);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrador?.skillId, borrador?.metaSugerida]);

  if (!nino || !datos) return null;

  const factible = prioridad ? puedeSugerirPlan(prioridad, nino) : { ok: false, motivo: 'No encontramos esa habilidad.' };
  const volver = `/ninos/${nino.id}/progreso`;

  function crear() {
    if (!nino || !borrador || !prioridad) return;
    const actualizado = crearPlanDesdeBorrador(nino, borrador, { meta, estrategias, siguientePaso, fechaRevision });
    const todos = ninos.map((n) => (n.id === nino.id ? actualizado : n));
    guardarNinos(todos);
    setNinos(todos);
    registrarDecisionPrioridad(prioridad, nino.id, 'aceptada', { nota: 'Plan Individual creado desde la propuesta.' });
    setCreado(true);
  }

  function seguirObservando() {
    if (!nino || !prioridad) return;
    registrarDecisionPrioridad(prioridad, nino.id, 'seguir_observando');
    router.push(volver);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <Link href={volver} aria-label="Volver al progreso" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{nino.nombre} · Propuesta</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Plan Individual sugerido</h1>
          <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">Es un borrador. No se crea nada hasta que tú lo apruebes.</p>
        </motion.header>

        {creado ? (
          <motion.section variants={item} className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] p-5">
            <p className="text-[16px] font-semibold text-[var(--text-primary)]">Plan Individual creado.</p>
            <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">
              La meta quedó como “Por trabajar”. Desde ahora puede ayudar a personalizar tus próximas planeaciones cuando haya una oportunidad natural.
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href={`/ninos/${nino.id}/plan-individual`} className="flex min-h-11 items-center text-[14px] font-semibold text-[var(--accent)] underline">
                Ver Plan Individual
              </Link>
              <Link href={volver} className="flex min-h-11 items-center text-[14px] font-semibold text-[var(--text-secondary)] underline">
                Volver al progreso
              </Link>
            </div>
          </motion.section>
        ) : !borrador || !prioridad ? (
          <motion.section variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Todavía no hay una propuesta para esta habilidad</p>
            <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">{factible.motivo}</p>
            <Link href={volver} className="mt-3 flex min-h-11 items-center text-[14px] font-semibold text-[var(--accent)] underline">
              Volver al progreso
            </Link>
          </motion.section>
        ) : (
          <>
            <Bloque titulo="Área prioritaria">
              <p className="text-[16px] font-semibold text-[var(--text-primary)]">
                {borrador.area} · {prioridad.nombreSkill}
              </p>
            </Bloque>

            <Bloque titulo="Punto actual">
              <p className="text-[14px] leading-snug text-[var(--text-primary)]">{borrador.puntoActual}</p>
            </Bloque>

            <Bloque titulo="Meta sugerida">
              {editando ? (
                <textarea id="meta-sugerida" value={meta} onChange={(e) => setMeta(e.target.value)} rows={3} aria-label="Meta sugerida" className={`${CAMPO} resize-none`} />
              ) : (
                <p className="text-[15px] font-semibold leading-snug text-[var(--text-primary)]">{meta}</p>
              )}
              <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">Criterio de logro: {borrador.criterioDeLogro}</p>
              <p className="mt-2 text-[13px] leading-snug text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">¿Por qué esta meta? </span>
                {borrador.porQueEstaMeta}
              </p>
            </Bloque>

            <Bloque titulo="Raíces / prerrequisitos relevantes">
              <ul className="flex flex-col gap-2">
                {borrador.raices.map((r) => (
                  <li key={r.nombre} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{r.nombre}</p>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-secondary)]">{r.nota}</p>
                  </li>
                ))}
              </ul>
              <p className="mt-1.5 text-[12px] leading-snug text-[var(--text-tertiary)]">
                Las raíces son una ayuda para decidir, no una regla: solo pesan cuando hay evidencia de que siguen en desarrollo.
              </p>
            </Bloque>

            <Bloque titulo="Estrategias">
              {editando ? <textarea id="estrategias" value={estrategias} onChange={(e) => setEstrategias(e.target.value)} rows={4} aria-label="Estrategias" className={`${CAMPO} resize-none`} /> : <Lista items={borrador.estrategias} />}
            </Bloque>

            <Bloque titulo="Oportunidades en la rutina">
              <Lista items={borrador.oportunidades} />
            </Bloque>

            <Bloque titulo="Qué observar">
              {editando ? <input id="siguiente-paso" value={siguientePaso} onChange={(e) => setSiguientePaso(e.target.value)} aria-label="Qué observar primero" className={`${CAMPO} min-h-11`} /> : <Lista items={borrador.queObservar} />}
            </Bloque>

            <Bloque titulo="Evidencia que respalda esta propuesta">
              <ul className="flex flex-col gap-2">
                {borrador.evidencia.map((e) => (
                  <li key={e.observacionId} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                    <p className="text-[12px] font-semibold text-[var(--text-tertiary)]">{fechaCorta(e.fecha)}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-primary)]">{e.texto}</p>
                    <Link href={`/observaciones/${e.observacionId}`} className="mt-1 inline-flex min-h-11 items-center text-[12px] font-semibold text-[var(--accent)] underline">
                      Ver observación
                    </Link>
                  </li>
                ))}
              </ul>
            </Bloque>

            <Bloque titulo="Fecha de revisión">
              {editando ? (
                <input id="fecha-revision" type="date" value={fechaRevision} onChange={(e) => setFechaRevision(e.target.value)} aria-label="Fecha de revisión" className={`${CAMPO} min-h-11`} />
              ) : (
                <p className="text-[14px] text-[var(--text-primary)]">{fechaCorta(fechaRevision || borrador.fechaRevision)}</p>
              )}
            </Bloque>

            {aviso && (
              <p role="status" className="mb-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3 text-[13px] text-[var(--text-primary)]">
                {aviso}
              </p>
            )}

            <motion.div variants={item} className="mt-2 flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={crear}
                className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
              >
                Crear Plan Individual
              </motion.button>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => setEditando((v) => !v)}
                  aria-pressed={editando}
                  className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--text-primary)]"
                >
                  {editando ? 'Listo con la edición' : 'Editar antes de crear'}
                </button>
                <button type="button" onClick={seguirObservando} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--text-primary)]">
                  Seguir observando
                </button>
                <button
                  type="button"
                  onClick={() => router.push(volver)}
                  className="min-h-11 rounded-[var(--radius-button)] px-3 text-[14px] font-semibold text-[var(--text-secondary)] underline"
                >
                  No crear ahora
                </button>
              </div>
              <p className="text-[12px] leading-snug text-[var(--text-tertiary)]">
                “No crear ahora” no guarda nada. La propuesta seguirá disponible desde la prioridad aceptada.
              </p>
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}

export default function PropuestaPlanIndividual() {
  return (
    <Suspense fallback={null}>
      <PropuestaContenido />
    </Suspense>
  );
}
