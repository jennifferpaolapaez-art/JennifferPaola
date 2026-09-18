'use client';

// DETALLE DE UNA OBSERVACIÓN (Sesión 6, paso 6) — regla del usuario: distinguir siempre NOTA
// ORIGINAL (lo que la maestra realmente escribió/eligió, NUNCA se sobrescribe) de REDACCIÓN
// PROFESIONAL (solo si existe — la IA real llega en la fase de servicios externos), SKILLS
// RELACIONADOS con su estado real (aceptado/rechazado/sugerido — un "sugerido" sigue pendiente de
// revisión, no se disfraza de aceptado), EVIDENCIA (solo el nombre del archivo, sin fingir
// almacenamiento real todavía) y CONTEXTO (actividad/bloque/fecha, si nació dentro de una).

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Paperclip } from 'lucide-react';
import { AppShell, AvatarInicial } from '@/components/app/shell';
import {
  leerNinos,
  leerObservaciones,
  skillsDeObservacion,
  leerObservacionSkills,
  actividadYPlanPorId,
  TINT_HEX,
  BLOQUE_LABEL,
  type Nino,
  type Observacion,
  type ObservacionSkill,
} from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const ESTADO_SKILL_LABEL: Record<string, { texto: string; bg: string; color: string }> = {
  aceptado: { texto: 'Aceptado', bg: 'color-mix(in oklab, var(--sage) 16%, transparent)', color: 'var(--sage)' },
  rechazado: { texto: 'Rechazado', bg: 'color-mix(in oklab, var(--coral) 14%, transparent)', color: 'var(--coral)' },
  sugerido: { texto: 'Sugerido · sin revisar', bg: 'color-mix(in oklab, var(--butter) 16%, transparent)', color: 'var(--butter)' },
};

const ORIGEN_OBSERVACION_LABEL: Record<string, string> = { dirigida: 'Observación dirigida', espontanea: 'Observación espontánea' };

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{children}</h2>;
}

export default function DetalleObservacion() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [skills, setSkills] = useState<ObservacionSkill[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setSkills(leerObservacionSkills());
    setCargado(true);
  }, []);

  if (!cargado) return null;

  const observacion = observaciones.find((o) => o.id === params.id);
  const nino = observacion ? ninos.find((n) => n.id === observacion.ninoId) : undefined;

  if (!observacion || !nino) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta observación</h1>
          <button type="button" onClick={() => router.push('/observaciones')} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a Observaciones
          </button>
        </div>
      </AppShell>
    );
  }

  const skillsRelacionados = skillsDeObservacion(observacion.id, skills);
  const contexto = observacion.actividadId ? actividadYPlanPorId(observacion.actividadId) : undefined;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6 flex items-center gap-3">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={44} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {ORIGEN_OBSERVACION_LABEL[observacion.origen]}
            </p>
            <h1 className="text-balance text-[20px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {nino.nombre} · {observacion.fecha}
            </h1>
          </div>
        </motion.header>

        <motion.section variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
          <Etiqueta>Nota original</Etiqueta>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-primary)]">{observacion.notaOriginal}</p>
        </motion.section>

        {observacion.redaccionProfesional && (
          <motion.section variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            <Etiqueta>Redacción profesional</Etiqueta>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-primary)]">{observacion.redaccionProfesional}</p>
          </motion.section>
        )}

        {skillsRelacionados.length > 0 && (
          <motion.section variants={item} className="mb-5">
            <Etiqueta>Skills relacionados</Etiqueta>
            <ul className="mt-2 flex flex-col gap-2">
              {skillsRelacionados.map((s) => {
                const cfg = ESTADO_SKILL_LABEL[s.estado];
                return (
                  <li key={s.skillId} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-3.5 shadow-[var(--shadow-1)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14px] font-semibold text-[var(--text-primary)]">{s.nombreSkill}</span>
                      <span className="rounded-[var(--radius-button)] px-2.5 py-1 text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.texto}
                      </span>
                    </div>
                    {s.evidenciaTextual && <p className="mt-1.5 text-[13px] leading-snug text-[var(--text-secondary)]">Evidencia: “{s.evidenciaTextual}”</p>}
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {observacion.evidenciaArchivoNombre && (
          <motion.section variants={item} className="mb-5 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
            <Paperclip size={18} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{observacion.evidenciaArchivoNombre}</p>
              <p className="text-[12px] text-[var(--text-tertiary)]">Referencia guardada — el archivo real todavía no se adjunta (sin almacenamiento conectado).</p>
            </div>
          </motion.section>
        )}

        {contexto && (
          <motion.section variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
            <Etiqueta>Contexto</Etiqueta>
            <Link href={`/planeacion/${contexto.actividad.id}`} className="mt-2 block text-[14px] font-medium text-[var(--accent)] underline">
              {BLOQUE_LABEL[contexto.actividad.bloque]} · {contexto.dia.dia} — {contexto.actividad.titulo}
            </Link>
          </motion.section>
        )}

        <motion.p variants={item} className="mt-2 text-center text-[13px] text-[var(--text-tertiary)]">
          Esta observación agrega evidencia — el estado del perfil de {nino.nombre} solo cambia si tú lo apruebas.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
