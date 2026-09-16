'use client';

// PERFIL DEL NIÑO — "Conoce a cada niño" (message-match con frame-perfil.png de la landing).
// Es una de las 3 funciones núcleo del MVP (ESTADO.md → Constitución): edad + skills con su
// estado real, el dato que alimenta la diferenciación de Hoy y Semana.

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, AvatarInicial, SkillBadge } from '@/components/app/shell';
import { ninoPorId, TINT_HEX } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function Perfil() {
  const params = useParams<{ id: string }>();
  const nino = ninoPorId(params.id);

  if (!nino) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos a este niño</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Puede que ya no esté en tu grupo activo.</p>
          <Link href="/ninos" className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a Niños
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <Link
            href="/ninos"
            aria-label="Volver a Niños"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-6 flex items-center gap-4">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={56} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Perfil</p>
            <h1 className="text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {nino.nombre}
            </h1>
            <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">
              {nino.edadTexto} · {nino.etapa}
            </p>
          </div>
        </motion.header>

        <motion.h2 variants={item} className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">
          Habilidades
        </motion.h2>
        <ul className="flex flex-col gap-2">
          {nino.skills.map((s) => (
            <motion.li
              key={s.id}
              variants={item}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
            >
              <span className="text-[15px] font-medium text-[var(--text-primary)]">{s.nombre}</span>
              <SkillBadge estado={s.estado} />
            </motion.li>
          ))}
        </ul>

        <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
          Cada estado se actualiza con tus observaciones — nunca se marca solo.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
