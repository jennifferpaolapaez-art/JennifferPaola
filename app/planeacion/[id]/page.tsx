'use client';

// DETALLE DE ACTIVIDAD — se abre al tocar un bloque desde /planeacion o desde /hoy. Contiene
// las 3 CAPAS que el usuario pidió mantener SEPARADAS (Sesión 5, corrección pedagógica):
//   A. "Una experiencia, cuatro niveles" — diferenciación por ETAPA (universal, todo el grupo).
//   B. "Adaptaciones individuales" — ajustes puntuales por niño (NO implica Plan Individual).
//   C. "Niños foco de hoy" — niños cuya meta activa se observa a propósito en ESTA actividad.
// Nunca se mezclan A/B/C entre sí, aunque las 3 vivan en la misma pantalla.

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, AvatarInicial, EtapaChip, LeafCheck } from '@/components/app/shell';
import { actividadPorId, ninoPorId, ETAPAS_ORDEN, TINT_HEX, BLOQUE_LABEL, type Etapa } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function DetalleActividad() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const encontrado = actividadPorId(params.id);
  const [etapaActiva, setEtapaActiva] = useState<Etapa>('Preschool');

  if (!encontrado) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta actividad</h1>
          <button type="button" onClick={() => router.push('/planeacion')} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a la planeación
          </button>
        </div>
      </AppShell>
    );
  }

  const { actividad, dia } = encontrado;

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

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
            {BLOQUE_LABEL[actividad.bloque]} · {dia.dia} {actividad.hora}
          </p>
          <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {actividad.titulo}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">{actividad.objetivo}</p>
          <span className="mt-2 inline-flex w-fit rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)]">
            {actividad.dominio}
          </span>
        </motion.header>

        {/* ——— Materiales ——— */}
        <motion.section variants={item} className="mb-6">
          <h2 className="mb-2 text-[14px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Materiales</h2>
          <div className="flex flex-wrap gap-2">
            {actividad.materiales.map((m) => (
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

        {/* ——— Preparación / rol de la maestra / rol de los niños / preguntas guía ——— */}
        {(actividad.preparacion || actividad.queHaceMaestra || actividad.queHacenNinos || actividad.preguntasGuia) && (
          <motion.section variants={item} className="mb-6 flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            {actividad.preparacion && (
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Preparación</h2>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.preparacion}</p>
              </div>
            )}
            {actividad.queHaceMaestra && (
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Qué haces tú</h2>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queHaceMaestra}</p>
              </div>
            )}
            {actividad.queHacenNinos && (
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Qué hacen los niños</h2>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queHacenNinos}</p>
              </div>
            )}
            {actividad.preguntasGuia && actividad.preguntasGuia.length > 0 && (
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Preguntas guía</h2>
                <ul className="mt-1 flex flex-col gap-1">
                  {actividad.preguntasGuia.map((p, i) => (
                    <li key={i} className="text-[14px] leading-snug text-[var(--text-primary)]">
                      · {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}

        {/* ——— CAPA A: diferenciación por ETAPA — "Una experiencia, cuatro niveles" ———
            Universal, aplica a TODO el grupo por nivel de desarrollo. Es SOLO de esta
            actividad, no representa la planeación completa del día (aclaración del usuario). */}
        {actividad.diferenciacion && (
          <motion.section
            variants={item}
            aria-label="Adaptación por etapa"
            className="mb-6 rounded-[var(--radius-card)] border-t-[3px] border-x border-b border-x-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-b-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-t-[var(--accent)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)]"
          >
            <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">
              Una experiencia, cuatro niveles
            </h2>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              Así se adapta <strong>{actividad.titulo}</strong> — toca cada nivel.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Bandas de edad">
              {ETAPAS_ORDEN.map((etapa) => (
                <EtapaChip key={etapa} etapa={etapa} activa={etapa === etapaActiva} onClick={() => setEtapaActiva(etapa)} />
              ))}
            </div>
            <motion.p
              key={etapaActiva}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-[calc(var(--radius-button)-2px)] bg-[var(--surface-2)] p-4 text-[15px] leading-snug text-[var(--text-primary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
            >
              {actividad.diferenciacion[etapaActiva]}
            </motion.p>
          </motion.section>
        )}

        {/* ——— CAPA B: ADAPTACIONES INDIVIDUALES — nunca mezclada con niños foco (regla dura
            del usuario). Un ajuste por una necesidad puntual; NO implica Plan Individual. ——— */}
        {actividad.adaptacionesIndividuales && actividad.adaptacionesIndividuales.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-1 text-[16px] font-semibold text-[var(--text-primary)]">Adaptaciones individuales</h2>
            <p className="mb-3 text-[13px] text-[var(--text-secondary)]">Ajustes puntuales — no implican un Plan Individual.</p>
            <ul className="flex flex-col gap-2">
              {actividad.adaptacionesIndividuales.map((a, i) => {
                const nino = ninoPorId(a.ninoId);
                if (!nino) return null;
                return (
                  <li key={i} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
                    <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                        {nino.nombre} · <span className="font-normal text-[var(--text-secondary)]">{a.necesidad}</span>
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">{a.ajuste}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {/* ——— CAPA C: NIÑOS FOCO — meta/skill activa que se observa a propósito hoy. ——— */}
        {actividad.ninosFoco && actividad.ninosFoco.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-1 text-[16px] font-semibold text-[var(--text-primary)]">Niños foco en esta actividad</h2>
            <p className="mb-3 text-[13px] text-[var(--text-secondary)]">Su meta activa, aprovechando esta misma experiencia.</p>
            <ul className="flex flex-col gap-2">
              {actividad.ninosFoco.map((f, i) => {
                const nino = ninoPorId(f.ninoId);
                if (!nino) return null;
                return (
                  <li key={i} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent)_7%,transparent)] p-4">
                    <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={32} />
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                        {nino.nombre} · <span className="font-normal text-[var(--accent)]">{f.meta}</span>
                      </p>
                      <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">Observar: {f.observar}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {/* ——— Qué observar / evidencia posible ——— */}
        {(actividad.queObservar || actividad.evidenciaPosible) && (
          <motion.section variants={item} className="mb-6 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-5">
            {actividad.queObservar && (
              <div>
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Qué observar</h2>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queObservar}</p>
              </div>
            )}
            {actividad.evidenciaPosible && (
              <div className="mt-3">
                <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Evidencia posible</h2>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.evidenciaPosible}</p>
              </div>
            )}
          </motion.section>
        )}
      </motion.div>
    </AppShell>
  );
}
