'use client';

// NIÑOS — roster completo del grupo, agrupado por etapa (regla UX 14: listas >8 ítems piden
// filtro; con pocos niños agrupar por etapa ya organiza sin pedir un filtro aparte). Cada fila
// lleva a /ninos/[id] (Perfil — message-match con frame-perfil.png de la landing). Módulo Niños
// (Sesión 6, paso 3): ya lee el roster REAL (`leerNinos`, localStorage) en vez de la semilla
// fija, y tiene una acción primaria para crear un niño nuevo (regla UX 12: la acción de crear
// vive junto a la lista a la que pertenece).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ChevronRight, Plus, Settings } from 'lucide-react';
import { AppShell, AvatarInicial } from '@/components/app/shell';
import { calcularEdadTexto, ETAPAS_ORDEN, leerNinos, TINT_HEX, type Nino } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

export default function Ninos() {
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setCargado(true);
  }, []);

  if (!cargado) return null;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.header variants={item} className="mb-6 flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Tu grupo</p>
            <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {ninos.length} niños
            </h1>
          </div>
          <Link
            href="/configuracion"
            aria-label="Configuración del programa"
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <Settings size={20} aria-hidden="true" />
          </Link>
        </motion.header>

        <motion.div variants={item} className="mb-6">
          <Link
            href="/ninos/nuevo"
            className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
          >
            <Plus size={16} aria-hidden="true" />
            Agregar niño
          </Link>
        </motion.div>

        {ninos.length === 0 && (
          <motion.p variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-6 text-center text-[14px] text-[var(--text-secondary)]">
            Todavía no tienes niños registrados. Puedes seguir planeando por etapa mientras los agregas.
          </motion.p>
        )}

        {ETAPAS_ORDEN.map((etapa) => {
          const niñosEtapa = ninos.filter((n) => n.etapa === etapa);
          if (niñosEtapa.length === 0) return null;
          return (
            <motion.section key={etapa} variants={item} className="mb-6">
              <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--text-tertiary)]">
                {etapa}
              </h2>
              <ul className="flex flex-col gap-2">
                {niñosEtapa.map((n) => (
                  <li key={n.id}>
                    <Link
                      href={`/ninos/${n.id}`}
                      className="flex items-center gap-3 rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] p-4 transition-opacity active:opacity-90"
                    >
                      <AvatarInicial nombre={n.nombre} hex={TINT_HEX[n.colorTint]} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-[var(--text-primary)]">{n.nombre}</p>
                        <p className="mt-0.5 truncate text-[13px] text-[var(--text-secondary)]">{calcularEdadTexto(n.fechaNacimiento)}</p>
                      </div>
                      {n.metaActiva && (
                        <span className="hidden shrink-0 text-[12px] text-[var(--text-tertiary)] sm:inline">
                          Foco: {n.metaActiva.nota}
                        </span>
                      )}
                      <ChevronRight size={18} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                    </Link>
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
