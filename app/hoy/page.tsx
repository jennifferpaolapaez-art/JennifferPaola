'use client';

// HOY — pantalla principal de la app (M0, el ritual diario, la pantalla MÁS VISTA).
// Composición según 53-PANTALLA-CANONICA.md: header con fecha real + objeto principal
// (la actividad de hoy, diferenciada por edad) + lista de valor (niños foco) + microcopy.
// Message-match con el mockup ya mostrado en la landing (frame-hoy.png / AppPorDentro):
// misma actividad "Collage del cuerpo", mismos niños foco.

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ChevronRight, NotebookPen } from 'lucide-react';
import { AppShell, AvatarInicial, EtapaChip, LeafCheck } from '@/components/app/shell';
import { ACTIVIDAD_HOY, ETAPAS_ORDEN, ninosConFocoHoy, TINT_HEX } from '@/lib/seed-data';

/** Mayúscula solo en la primera letra — "capitalize" de Tailwind mayusculiza CADA palabra,
 * incluida la preposición "de" en fechas en español ("15 De Septiembre"), fix revisor-visual. */
function primeraMayuscula(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Hoy() {
  const router = useRouter();
  const reduce = useReducedMotion();
  // Fix revisor-visual: el stagger de listas no consultaba reduced-motion.
  const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : 0.06 } } };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] } },
  };
  const [etapaActiva, setEtapaActiva] = useState<(typeof ETAPAS_ORDEN)[number]>('Preschool');
  const focoHoy = ninosConFocoHoy();
  const hoy = new Date('2026-09-15T09:00:00');
  const fecha = primeraMayuscula(
    new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(hoy)
  );

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        {/* ——— HEADER: fecha real, no "Hoy" genérico ——— */}
        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-medium text-[var(--text-tertiary)]">{fecha}</p>
          <h1 className="mt-1 text-balance text-[28px] font-bold leading-[1.1] tracking-[-0.01em] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {ACTIVIDAD_HOY.titulo}
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            {ACTIVIDAD_HOY.momento} · Tema: {ACTIVIDAD_HOY.tema}
          </p>
        </motion.header>

        {/* ——— OBJETO PRINCIPAL: la diferenciación por edad — el mecanismo de RAIZ en acción ——— */}
        <motion.section
          variants={item}
          aria-label="Actividad diferenciada por edad"
          className="rounded-[var(--radius-card)] border-x border-b border-t-[3px] border-x-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-b-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-t-[var(--accent)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)]"
        >
          <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">
            Una experiencia, cuatro niveles
          </h2>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Toca cada nivel para ver cómo se adapta.</p>

          <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Bandas de edad">
            {ETAPAS_ORDEN.map((etapa) => (
              <EtapaChip key={etapa} etapa={etapa} activa={etapa === etapaActiva} onClick={() => setEtapaActiva(etapa)} />
            ))}
          </div>

          <motion.p
            key={etapaActiva}
            initial={{ opacity: 0, y: reduce ? 0 : 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 rounded-[calc(var(--radius-button)-2px)] bg-[var(--surface-2)] p-4 text-[15px] leading-snug text-[var(--text-primary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
          >
            {ACTIVIDAD_HOY.diferenciacion[etapaActiva]}
          </motion.p>

          <div className="mt-4 flex flex-wrap gap-2">
            {ACTIVIDAD_HOY.materiales.map((m) => (
              <span
                key={m.nombre}
                className={`inline-flex items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 py-1 text-[12px] font-medium ${
                  m.disponible
                    ? 'bg-[color-mix(in_oklab,var(--sage)_14%,transparent)] text-[var(--sage)]'
                    : 'bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] text-[var(--coral)]'
                }`}
              >
                <LeafCheck negativo={!m.disponible} size={14} />
                {m.nombre}
              </span>
            ))}
          </div>
        </motion.section>

        {/* ——— CTA PRINCIPAL: registrar observación — fix revisor-visual (defecto TOP: la
            pantalla más vista de la app no tenía NINGUNA acción reconocible en <3s) ——— */}
        <motion.div variants={item} className="mt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => router.push('/observar')}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] [touch-action:manipulation]"
          >
            <NotebookPen size={20} aria-hidden="true" />
            Registrar observación de hoy
          </motion.button>
        </motion.div>

        {/* ——— NIÑOS FOCO DE HOY: drill-down a /ninos-foco (expande frame-foco.png) ——— */}
        <motion.section variants={item} className="mt-6" aria-label="Niños foco de hoy">
          <Link
            href="/ninos-foco"
            className="block rounded-[var(--radius-card)] bg-[var(--surface-2)] p-5 transition-opacity active:opacity-90"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Niños foco de hoy</h2>
              <ChevronRight size={18} className="text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>
            <ul className="flex flex-col gap-3">
              {focoHoy.map((n) => (
                <li key={n.id} className="flex items-center gap-3">
                  <AvatarInicial nombre={n.nombre} hex={TINT_HEX[n.colorTint]} />
                  <span className="flex-1 text-[15px] font-medium text-[var(--text-primary)]">{n.nombre}</span>
                  <span className="text-[13px] text-[var(--text-secondary)]">{n.metaActiva?.nota}</span>
                </li>
              ))}
            </ul>
          </Link>
        </motion.section>

        <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
          Cada observación de hoy mejora la planeación de mañana.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
