'use client';

// NIÑOS FOCO — drill-down desde Hoy: "Hoy recuerda por ti" (message-match con frame-foco.png de la
// landing). Desde 6d NO tiene datos propios: un niño foco es un niño con una META ACTIVA (Por
// trabajar / En progreso / Casi lograda) en su Plan Individual activo — la misma fuente que Niños,
// Progreso, Plan Individual y Planeación. Cumplida y Cerrada no cuentan; un niño sin meta activa no
// aparece por una meta histórica. Cada tarjeta lleva a lo que la justifica: la meta, su habilidad,
// el Plan Individual y la evidencia/progreso relevante.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { AppShell, AvatarInicial, SkillBadge } from '@/components/app/shell';
import {
  ESTADO_META_LABEL,
  TINT_HEX,
  evidenciaDeSkill,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  ninosConMetaActiva,
  nombreDeSkillDeMeta,
  rosterEsDemo,
  type Nino,
  type Observacion,
  type ObservacionSkill,
} from '@/lib/seed-data';
import { evidenciaNuevaParaMeta } from '@/lib/prioridades';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const ENLACE = 'flex min-h-11 items-center text-[13px] font-semibold text-[var(--accent)] underline';

export default function NinosFoco() {
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [demo, setDemo] = useState(false);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setDemo(rosterEsDemo());
    setCargado(true);
  }, []);

  if (!cargado) return null;
  const foco = ninosConMetaActiva(ninos);

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
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Niños con una meta activa en su Plan Individual.</p>
          {demo && <p className="mt-2 inline-block rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2.5 py-1 text-[12px] text-[var(--text-tertiary)]">Estás viendo datos de ejemplo.</p>}
        </motion.header>

        {foco.length === 0 ? (
          <motion.div variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-1)]">
            <p className="text-[16px] font-semibold text-[var(--text-primary)]">Ningún niño tiene una meta activa todavía</p>
            <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">
              Los niños foco nacen de las metas de un Plan Individual. Cuando apruebes una meta, aparecerá aquí.
            </p>
            <Link href="/ninos" className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-[var(--accent)] underline">
              Ver a mis niños
            </Link>
          </motion.div>
        ) : (
          <ul className="flex flex-col gap-3">
            {foco.map(({ nino, metas }) => (
              <motion.li key={nino.id} variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-5">
                <div className="flex items-center gap-3">
                  <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[16px] font-semibold text-[var(--text-primary)]">{nino.nombre}</p>
                    <p className="text-[13px] text-[var(--text-secondary)]">
                      {metas.length} {metas.length === 1 ? 'meta activa' : 'metas activas'}
                    </p>
                  </div>
                  <Link href={`/ninos/${nino.id}`} aria-label={`Ver perfil de ${nino.nombre}`} className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)]">
                    <ChevronRight size={18} aria-hidden="true" />
                  </Link>
                </div>

                <ul className="mt-3 flex flex-col gap-3">
                  {metas.map((m) => {
                    const skill = m.skillId ? nino.skills.find((s) => s.id === m.skillId) : undefined;
                    const nombreSkill = nombreDeSkillDeMeta(nino, m.skillId);
                    const aprobadas = m.skillId ? evidenciaDeSkill(nino.id, m.skillId, observaciones, relaciones).length : 0;
                    const nuevas = evidenciaNuevaParaMeta(nino, m, observaciones, relaciones).length;
                    return (
                      <li key={m.id} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4">
                        <p className="text-[14px] font-medium leading-snug text-[var(--text-primary)]">{m.descripcion}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-2">
                          <span className="text-[12px] font-semibold text-[var(--accent)]">{ESTADO_META_LABEL[m.estado]}</span>
                          {skill && <SkillBadge estadoDesarrollo={skill.estadoDesarrollo} estadoEvidencia={skill.estadoEvidencia} />}
                        </div>
                        {m.siguientePaso && <p className="mt-1.5 text-[13px] leading-snug text-[var(--text-secondary)]">Siguiente paso: {m.siguientePaso}</p>}
                        {m.skillId && (
                          <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
                            {aprobadas === 0
                              ? 'Todavía sin observaciones aprobadas de esta habilidad.'
                              : `${aprobadas} ${aprobadas === 1 ? 'observación aprobada' : 'observaciones aprobadas'} de esta habilidad.`}
                          </p>
                        )}
                        {nuevas > 0 && (
                          <p className="mt-1.5 text-[12px] font-semibold text-[var(--butter)]">Esta meta tiene nueva evidencia. ¿Quieres revisar su estado?</p>
                        )}
                        <div className="mt-1 flex flex-wrap gap-x-4">
                          <Link href={`/ninos/${nino.id}/plan-individual${nuevas > 0 ? `?revisar=${m.id}` : ''}`} className={ENLACE}>
                            {nuevas > 0 ? 'Revisar meta' : 'Plan Individual'}
                          </Link>
                          {m.skillId && (
                            <Link href={`/ninos/${nino.id}/progreso/${m.skillId}`} className={ENLACE}>
                              Habilidad{nombreSkill ? `: ${nombreSkill}` : ''}
                            </Link>
                          )}
                          <Link href={`/ninos/${nino.id}/progreso`} className={ENLACE}>
                            Progreso
                          </Link>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </motion.li>
            ))}
          </ul>
        )}

        {ninos.length > 0 && (
          <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
            {ninos.length - foco.length} {ninos.length - foco.length === 1 ? 'niño más' : 'niños más'} en tu grupo, sin meta activa.
          </motion.p>
        )}
      </motion.div>
    </AppShell>
  );
}
