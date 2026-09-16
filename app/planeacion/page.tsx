'use client';

// PLANEACIÓN COMPLETA — el nivel que faltaba entre "Resumen semanal" y "Actividad": muestra
// primero la información general de la semana (tema mensual, subtema, vocabulario, objetivos
// de la semana, dominios), y después TODOS los bloques de cada día — nunca una sola actividad
// por día. Cada bloque es tocable y lleva al detalle completo de esa actividad.
// Jerarquía (regla del usuario): Vista rápida → Planeación completa → Día → Actividad.

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { PLANEACION_SEMANA_3, BLOQUE_LABEL, FECHA_HOY } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

const FECHA_LARGA = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
const DIA_COMPLETO: Record<string, string> = { Lun: 'Lunes', Mar: 'Martes', Mié: 'Miércoles', Jue: 'Jueves', Vie: 'Viernes' };

function PlaneacionContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const diaAbrir = params.get('dia');
  const plan = PLANEACION_SEMANA_3;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push('/semana')}
            aria-label="Volver al resumen semanal"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
            Planeación completa · Semana {plan.numero}
          </p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {plan.subtemaSemanal}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Tema del mes: {plan.temaMensual}</p>
        </motion.header>

        {/* ——— INFORMACIÓN GENERAL DE LA SEMANA (objetivo nivel 1 de 3) ——— */}
        <motion.section variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-5">
          <h2 className="text-[14px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
            Objetivos de la semana
          </h2>
          <ul className="mt-2 flex flex-col gap-1.5">
            {plan.objetivosGenerales.map((o, i) => (
              <li key={i} className="text-[14px] leading-snug text-[var(--text-primary)]">
                · {o}
              </li>
            ))}
          </ul>

          <h2 className="mt-4 text-[14px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
            Dominios principales
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {plan.dominiosPrincipales.map((d) => (
              <span key={d} className="rounded-[var(--radius-button)] bg-[var(--surface)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)]">
                {d}
              </span>
            ))}
          </div>

          <h2 className="mt-4 text-[14px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
            Vocabulario
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {plan.vocabulario.map((v) => (
              <span key={v} className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-2.5 py-1 text-[12px] font-medium text-[var(--accent)]">
                {v}
              </span>
            ))}
          </div>
        </motion.section>

        {/* ——— CADA DÍA, TODOS SUS BLOQUES (nunca una sola actividad por día) ——— */}
        {plan.dias.map((dia) => {
          const esHoy = dia.fecha === FECHA_HOY;
          const abiertoPorDefecto = diaAbrir ? diaAbrir === dia.dia : esHoy;
          return (
            <motion.section key={dia.dia} variants={item} className="mt-6">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">
                  {DIA_COMPLETO[dia.dia]}
                  {esHoy && <span className="ml-2 text-[12px] font-semibold text-[var(--accent-2)]">· Hoy</span>}
                </h2>
                <p className="text-[12px] capitalize text-[var(--text-tertiary)]">
                  {FECHA_LARGA.format(new Date(`${dia.fecha}T12:00:00`)).replace(/^\w/, (c) => c.toUpperCase())}
                </p>
              </div>
              <ul className={`flex flex-col gap-2 ${abiertoPorDefecto ? '' : 'opacity-90'}`}>
                {dia.actividades.map((act) => (
                  <li key={act.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/planeacion/${act.id}`)}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-3.5 text-left transition-opacity active:opacity-90"
                    >
                      <span className="w-14 shrink-0 text-[12px] tabular-nums text-[var(--text-tertiary)]">{act.hora}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">
                          {BLOQUE_LABEL[act.bloque]}
                        </p>
                        <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{act.titulo}</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            </motion.section>
          );
        })}
      </motion.div>
    </AppShell>
  );
}

export default function Planeacion() {
  return (
    <Suspense fallback={null}>
      <PlaneacionContenido />
    </Suspense>
  );
}
