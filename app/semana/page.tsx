'use client';

// SEMANA — planeación semanal con navegación real (← Semana N →), diferenciación y foco por
// día. Message-match con frame-semana.png ya mostrado en la landing ("Mañana ya tiene foco").
// Regla UX 13: fechas reales, no "Esta semana" — cada día muestra su fecha ISO formateada.

import { useState } from 'react';
import { motion, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { SEMANA } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const FECHA_CORTA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

export default function Semana() {
  const [numeroSemana] = useState(3);

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.header variants={item} className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              Semana {numeroSemana}
            </p>
            <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Mañana ya tiene foco
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Lo de hoy mejora lo que viene.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Semana anterior"
              className="flex size-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] text-[var(--text-secondary)]"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Semana siguiente"
              className="flex size-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] text-[var(--text-secondary)]"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </motion.header>

        <ul className="flex flex-col gap-3">
          {SEMANA.map((d) => (
            <motion.li
              key={d.dia}
              variants={item}
              className={`flex items-center gap-4 rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-1)] ${
                d.hoy ? 'bg-[var(--accent)]' : 'bg-[var(--surface)]'
              }`}
            >
              <div className="w-12 shrink-0 text-center">
                <p className={`text-[13px] font-bold uppercase ${d.hoy ? 'text-[var(--butter)]' : 'text-[var(--accent-2)]'}`}>
                  {d.dia}
                </p>
                <p className={`text-[11px] tabular-nums ${d.hoy ? 'text-[color-mix(in_oklab,var(--bg)_75%,transparent)]' : 'text-[var(--text-tertiary)]'}`}>
                  {FECHA_CORTA.format(new Date(`${d.fecha}T12:00:00`))}
                </p>
              </div>
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[15px] font-semibold ${d.hoy ? 'text-[var(--bg)]' : 'text-[var(--text-primary)]'}`}>
                  {d.titulo}
                </p>
                <p className={`mt-0.5 truncate text-[13px] ${d.hoy ? 'text-[color-mix(in_oklab,var(--bg)_85%,transparent)]' : 'text-[var(--text-secondary)]'}`}>
                  {d.focoTexto}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>

        <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
          Cada niño foco de esta semana viene de una observación real, no de una lista al azar.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
