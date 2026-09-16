'use client';

// REGISTRAR OBSERVACIÓN — 3ra función núcleo del MVP (Constitución del Producto, ESTADO.md):
// "Observación rápida del día que alimenta el próximo plan". Es el CTA principal de Hoy (M0) —
// sin esta pantalla, la maestra no tenía ninguna acción reconocible en <3s (defecto TOP del
// revisor-visual en la pantalla principal). Flujo: elegir niño → elegir habilidad relacionada →
// escribir en su propio lenguaje → RAIZ reformula (simulado localmente; la reformulación real
// con IA se conecta en la fase de servicios externos — 30/51).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, AvatarInicial, LeafCheck, SkillBadge } from '@/components/app/shell';
import { NINOS, TINT_HEX } from '@/lib/seed-data';

type Paso = 'nino' | 'habilidad' | 'nota' | 'listo';

export default function Observar() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [paso, setPaso] = useState<Paso>('nino');
  const [ninoId, setNinoId] = useState<string | null>(null);
  const [skillId, setSkillId] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const nino = NINOS.find((n) => n.id === ninoId) ?? null;
  const skill = nino?.skills.find((s) => s.id === skillId) ?? null;

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  };

  const guardar = () => {
    setGuardando(true);
    // Simulación local — Sesión 6 conecta la reformulación real con IA (server-side, 30).
    setTimeout(() => {
      setGuardando(false);
      setPaso('listo');
    }, 700);
  };

  return (
    <AppShell>
      <div className="mb-4">
        <button
          type="button"
          onClick={() => (paso === 'nino' ? router.push('/hoy') : setPaso(paso === 'nota' ? 'habilidad' : 'nino'))}
          aria-label="Atrás"
          className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
        >
          <ArrowLeft size={18} aria-hidden="true" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {paso === 'nino' && (
          <motion.div key="nino" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Observación</p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              ¿De quién es la observación?
            </h1>
            <ul className="mt-6 flex flex-col gap-3">
              {NINOS.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setNinoId(n.id);
                      setPaso('habilidad');
                    }}
                    className="flex w-full items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-1)] transition-opacity active:opacity-90"
                  >
                    <AvatarInicial nombre={n.nombre} hex={TINT_HEX[n.colorTint]} />
                    <span className="text-[15px] font-medium text-[var(--text-primary)]">{n.nombre}</span>
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {paso === 'habilidad' && nino && (
          <motion.div key="habilidad" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              Sobre {nino.nombre}
            </p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              ¿Qué habilidad observaste?
            </h1>
            <ul className="mt-6 flex flex-col gap-3">
              {nino.skills.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSkillId(s.id);
                      setPaso('nota');
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-1)] transition-opacity active:opacity-90"
                  >
                    <span className="text-[15px] font-medium text-[var(--text-primary)]">{s.nombre}</span>
                    <SkillBadge estado={s.estado} />
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}

        {paso === 'nota' && nino && skill && (
          <motion.div key="nota" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {nino.nombre} · {skill.nombre}
            </p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Cuéntalo con tus palabras
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              RAIZ lo convierte en documentación profesional para la familia.
            </p>
            <textarea
              autoFocus
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: hoy usó las tijeras solo, sin ayuda, en las 3 líneas rectas."
              rows={5}
              className="mt-5 w-full resize-none rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
            {/* Fix revisor-visual: el botón solo se apagaba al 50% sin explicar por qué —
                heurísticas 5/9 piden decir qué falta, no solo deshabilitar en silencio. */}
            {nota.trim().length === 0 && (
              <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">Escribe una nota para poder guardar.</p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={nota.trim().length === 0 || guardando}
              onClick={guardar}
              className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar observación'}
            </motion.button>
          </motion.div>
        )}

        {paso === 'listo' && nino && skill && (
          <motion.div
            key="listo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center pt-10 text-center"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]">
              <LeafCheck size={36} />
            </span>
            <h1 className="mt-5 text-balance text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
              Observación guardada
            </h1>
            <p className="mt-2 max-w-[32ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Esto ya ajusta la próxima planeación de {nino.nombre} en {skill.nombre}.
            </p>
            <button
              type="button"
              onClick={() => router.push('/hoy')}
              className="mt-8 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)]"
            >
              Volver a Hoy
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
