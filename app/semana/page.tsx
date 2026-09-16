'use client';

// RESUMEN SEMANAL — vista rápida de "qué destaca cada día" (NUNCA la planeación completa —
// corrección del usuario, Sesión 5: una planeación real tiene varios bloques cada día). Esta
// pantalla se queda igual visualmente a como ya fue aprobada; solo cambia su CONCEPTO: ahora es
// un resumen que lleva a /planeacion para ver todos los bloques del día completo.

import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight, ClipboardList } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { PLANEACION_SEMANA_3, FECHA_HOY, actividadDestacada, focoTextoDestacado, BLOQUE_LABEL } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const FECHA_CORTA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

export default function Semana() {
  const router = useRouter();

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.header variants={item} className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              Semana {PLANEACION_SEMANA_3.numero} · Resumen
            </p>
            <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Mañana ya tiene foco
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Vista rápida — toca un día para ver todo.</p>
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
          {PLANEACION_SEMANA_3.dias.map((d) => {
            const destacada = actividadDestacada(d);
            const hoy = d.fecha === FECHA_HOY;
            return (
              <motion.li key={d.dia} variants={item}>
                <button
                  type="button"
                  onClick={() => router.push(`/planeacion?dia=${d.dia}`)}
                  className={`flex w-full items-center gap-4 rounded-[var(--radius-card)] p-4 text-left shadow-[var(--shadow-1)] transition-opacity active:opacity-90 ${
                    hoy ? 'bg-[var(--accent)]' : 'bg-[var(--surface)]'
                  }`}
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className={`text-[13px] font-bold uppercase ${hoy ? 'text-[var(--butter)]' : 'text-[var(--accent-2)]'}`}>
                      {d.dia}
                    </p>
                    <p className={`text-[11px] tabular-nums ${hoy ? 'text-[color-mix(in_oklab,var(--bg)_75%,transparent)]' : 'text-[var(--text-tertiary)]'}`}>
                      {FECHA_CORTA.format(new Date(`${d.fecha}T12:00:00`))}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12px] font-medium uppercase tracking-[0.04em] ${hoy ? 'text-[color-mix(in_oklab,var(--bg)_75%,transparent)]' : 'text-[var(--text-tertiary)]'}`}>
                      {BLOQUE_LABEL[destacada.bloque]}
                    </p>
                    <p className={`truncate text-[15px] font-semibold ${hoy ? 'text-[var(--bg)]' : 'text-[var(--text-primary)]'}`}>
                      {destacada.titulo}
                    </p>
                    <p className={`mt-0.5 truncate text-[13px] ${hoy ? 'text-[color-mix(in_oklab,var(--bg)_85%,transparent)]' : 'text-[var(--text-secondary)]'}`}>
                      {focoTextoDestacado(destacada)}
                    </p>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {/* ——— Acceso a la planeación completa — regla del usuario: la vista rápida NUNCA es
            la planeación; siempre debe llevar a los bloques completos del día. ——— */}
        <motion.div variants={item} className="mt-6">
          <button
            type="button"
            onClick={() => router.push('/planeacion')}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] text-[16px] font-semibold text-[var(--accent)] transition-opacity active:opacity-80"
          >
            <ClipboardList size={20} aria-hidden="true" />
            Ver planeación completa
          </button>
        </motion.div>

        <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
          Cada niño foco de esta semana viene de una observación real, no de una lista al azar.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
