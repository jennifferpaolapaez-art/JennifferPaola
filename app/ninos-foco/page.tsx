'use client';

// NIÑOS FOCO — drill-down desde Hoy. Message-match con frame-foco.png ya mostrado en la
// landing: "Hoy recuerda por ti" — la meta activa de cada niño con foco, sin que la maestra
// tenga que recordarla de memoria (el mecanismo central de RAIZ).

import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { AppShell, AvatarInicial, SkillBadge } from '@/components/app/shell';
import { NINOS, TINT_HEX, ninosConFocoHoy } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function NinosFoco() {
  const focoHoy = ninosConFocoHoy();

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2 flex items-center gap-2">
          <Link
            href="/hoy"
            aria-label="Volver a Hoy"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Niños foco</p>
          <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Hoy recuerda por ti
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Basado en su perfil y su meta activa.</p>
        </motion.header>

        <ul className="flex flex-col gap-3">
          {focoHoy.map((n) => {
            const skill = n.skills.find((s) => s.id === n.metaActiva?.skillId);
            return (
              <motion.li key={n.id} variants={item}>
                <Link
                  href={`/ninos/${n.id}`}
                  className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-5 transition-opacity active:opacity-90"
                >
                  <AvatarInicial nombre={n.nombre} hex={TINT_HEX[n.colorTint]} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold text-[var(--text-primary)]">{n.nombre}</p>
                    <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">{n.metaActiva?.nota}</p>
                  </div>
                  {skill && <SkillBadge estado={skill.estado} />}
                  <ChevronRight size={18} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                </Link>
              </motion.li>
            );
          })}
        </ul>

        <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
          {NINOS.length - focoHoy.length} niños más en tu grupo, sin foco activo hoy.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
