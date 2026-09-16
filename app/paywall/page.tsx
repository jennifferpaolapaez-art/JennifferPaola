'use client';

// PAYWALL — Sesión 4. Secuencia de 3 pantallas (C0 de 50-DISENO-ONBOARDING-PAYWALL.md):
// 1) recap del valor personalizado (inversión visible) · 2) timeline del trial ·
// 3) precio. Precio/garantía/trial son los MISMOS de la landing (Oferta.tsx) — cosa juzgada
// de FICHA-MERCADO.md, no se re-decide aquí. Checkout real (Hotmart) se conecta en Sesión 6;
// por ahora el CTA lleva a /entrar con el plan elegido guardado (mockup honesto, C3ter: precio
// y copy reales, sin checkout falso).
// Ronda 1 revisor-visual: fix vacío muerto (FunnelStage centra verticalmente) + navegación
// atrás DENTRO de la secuencia (antes solo existía la X que sacaba del funnel entero) +
// hairline degradé en las superficies de venta + stagger real en listas/nodos/cards.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { X, ArrowLeft, Layers, Brain, RotateCcw, NotebookPen, ShieldCheck, Lock } from 'lucide-react';
import { FunnelShell, FunnelStage, FunnelHeader, FunnelCta, ProgressBar, AnimatedNumber } from '@/components/onboarding/ui';
import { Hairline } from '@/components/landing/ui';

type Dolor = 'adaptar-edades' | 'recordar-niño' | 'reconstruir' | 'documentar';

const DOLOR_ICON: Record<Dolor, typeof Layers> = {
  'adaptar-edades': Layers,
  'recordar-niño': Brain,
  reconstruir: RotateCcw,
  documentar: NotebookPen,
};
const DOLOR_BENEFICIO: Record<Dolor, string> = {
  'adaptar-edades': 'Cada actividad, ya adaptada a Infant, Toddler, Preschool y Pre-K',
  'recordar-niño': 'El foco de cada niño, siempre a la vista, sin cargarlo en tu cabeza',
  reconstruir: 'Tu semana ya armada — nunca más desde cero',
  documentar: 'Observaciones reformuladas de forma profesional en segundos',
};

interface Onboarding {
  salon: string | null;
  niños: number;
  dolor: Dolor | null;
  objecion: string | null;
  momento: string | null;
  nRespuestas: number;
}

const PLAN_ANUAL = { precioMesNum: 16.66, totalAnual: 'Se cobra $199.90/año', ahorro: '2 meses gratis (~17%)' };
const PLAN_MENSUAL = { precioMesNum: 19.99 };

/** Contenedor con stagger real (50-60ms entre hijos) — fix revisor-visual: listas/nodos/cards
 * entraban todos de golpe. */
function Stagger({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: reduce ? 0 : 0.07 } } }}
    >
      {children}
    </motion.div>
  );
}
const staggerItem = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as const } },
};

export default function Paywall() {
  const router = useRouter();
  const [datos, setDatos] = useState<Onboarding | null>(null);
  const [pantalla, setPantalla] = useState(0);
  const [plan, setPlan] = useState<'anual' | 'mensual'>('anual');

  useEffect(() => {
    const raw = localStorage.getItem('raiz_onboarding');
    if (raw) {
      try {
        setDatos(JSON.parse(raw));
      } catch {
        setDatos(null);
      }
    }
  }, []);

  const nRespuestas = datos?.nRespuestas ?? 5;
  const dolor = datos?.dolor ?? 'reconstruir';
  const DolorIcon = DOLOR_ICON[dolor];

  const confirmarPlan = () => {
    localStorage.setItem('raiz_plan_elegido', plan);
    router.push('/entrar');
  };

  return (
    <FunnelShell>
      <div className="sticky top-0 z-20 flex items-center justify-between bg-[var(--bg)] px-5 pt-4">
        {pantalla > 0 ? (
          <button
            type="button"
            onClick={() => setPantalla((p) => p - 1)}
            aria-label="Atrás"
            className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]"
          >
            <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : (
          <a
            href="/"
            aria-label="Cerrar"
            className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]"
          >
            <X size={20} strokeWidth={2} aria-hidden="true" />
          </a>
        )}
        <div className="scale-90"><FunnelHeader /></div>
        <a
          href="/"
          aria-label="Cerrar"
          className="flex size-11 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]"
        >
          {pantalla > 0 ? <X size={20} strokeWidth={2} aria-hidden="true" /> : <span className="block size-5" aria-hidden="true" />}
        </a>
      </div>
      {/* Indicador de paso de la secuencia — fix revisor-visual ronda 2: el usuario no sabía
          cuántos pasos faltaban. Reusa <ProgressBar> del kit compartido (no reinventa la barra). */}
      <div className="px-5 pt-2">
        <div className="mx-auto w-full max-w-[480px]">
          <ProgressBar percent={((pantalla + 1) / 3) * 100} />
          <p className="mt-1.5 text-[11px] font-medium tabular-nums text-[var(--text-tertiary)]">Paso {pantalla + 1} de 3</p>
        </div>
      </div>

      <FunnelStage topbarHeight={112}>
        <AnimatePresence mode="wait">
          {/* PANTALLA 1 — recap de valor personalizado + inversión visible (costo hundido) */}
          {pantalla === 0 && (
            <motion.div
              key="recap"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[480px] px-5"
            >
              <h1 className="text-balance text-[30px] font-bold leading-[1.12] text-[var(--text-primary)] [font-family:var(--font-display)]">
                Tu <span className="text-[var(--accent-2)]">Memoria del Salón</span> está lista
              </h1>
              <p className="mt-2 text-[14px] text-[var(--text-secondary)]">
                Hecho con tus <AnimatedNumber value={nRespuestas} /> respuestas.
              </p>

              <Hairline surface="surface" className="mt-7">
                <Stagger>
                  <div className="flex flex-col gap-3 rounded-[var(--radius-card)] p-5 shadow-[var(--shadow-1)]">
                    {[
                      { icon: DolorIcon, texto: DOLOR_BENEFICIO[dolor] },
                      { icon: Layers, texto: <>Planeación semanal diferenciada para tus <AnimatedNumber value={datos?.niños ?? 6} /> niños</> },
                      { icon: NotebookPen, texto: 'Perfil y ruta de habilidades de cada niño' },
                    ].map((item, i) => (
                      <motion.div key={i} variants={staggerItem} className="flex items-start gap-3">
                        <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[color-mix(in_oklab,var(--accent)_18%,transparent)]">
                          <item.icon size={18} strokeWidth={2.2} color="var(--accent)" aria-hidden="true" />
                        </span>
                        <p className="pt-1.5 text-[15px] leading-snug text-[var(--text-primary)]">{item.texto}</p>
                      </motion.div>
                    ))}
                  </div>
                </Stagger>
              </Hairline>

              <div className="mt-8">
                <FunnelCta onClick={() => setPantalla(1)}>Ver cómo funciona mi prueba gratis</FunnelCta>
              </div>
            </motion.div>
          )}

          {/* PANTALLA 2 — timeline del trial (patrón Blinkist, spec C4) */}
          {pantalla === 1 && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[480px] px-5"
            >
              <h1 className="text-balance text-[28px] font-bold leading-[1.12] text-[var(--text-primary)] [font-family:var(--font-display)]">
                Así funciona tu <span className="text-[var(--accent-2)]">prueba de 7 días</span>
              </h1>

              <Stagger>
                <div className="relative mt-8 flex flex-col gap-6 pl-2">
                  <div aria-hidden="true" className="absolute left-[9px] top-2 h-[calc(100%-16px)] w-px bg-[color-mix(in_oklab,var(--accent)_35%,transparent)]" />
                  {[
                    { nodo: 'fill', title: 'Hoy — acceso completo', body: 'Todo tu plan, sin límites.' },
                    { nodo: 'fill', title: 'Día 6 — te avisamos', body: 'Correo antes de cualquier cobro.' },
                    { nodo: 'outline', title: `Día 7 — 1er cobro: $199.90/año`, body: 'Cancela antes sin costo.' },
                  ].map((n, i) => (
                    <motion.div key={i} variants={staggerItem} className="relative flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className={`relative z-10 mt-1 size-[13px] shrink-0 rounded-full ${
                          n.nodo === 'fill' ? 'bg-[var(--accent)]' : 'border-2 border-[var(--accent)] bg-[var(--bg)]'
                        }`}
                      />
                      <div>
                        <p className="text-[15px] font-semibold text-[var(--text-primary)]">{n.title}</p>
                        <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{n.body}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </Stagger>

              <div className="mt-9">
                <FunnelCta onClick={() => setPantalla(2)}>Ver mi plan y precio</FunnelCta>
              </div>
            </motion.div>
          )}

          {/* PANTALLA 3 — precio (C1) */}
          {pantalla === 2 && (
            <motion.div
              key="precio"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto w-full max-w-[480px] px-5"
            >
              <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
                Empieza mis <span className="text-[var(--accent-2)]">7 días gratis</span>
              </h1>

              <Stagger>
                <div className="mt-6 flex flex-col gap-3">
                  <motion.div variants={staggerItem}>
                    <Hairline emphasis={plan === 'anual'} surface="surface">
                      <motion.button
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => setPlan('anual')}
                        className={`relative w-full rounded-[var(--radius-card)] p-4 text-left transition-colors ${
                          plan === 'anual' ? 'bg-[color-mix(in_oklab,var(--accent)_7%,transparent)]' : ''
                        }`}
                      >
                        <span className="absolute -top-[10px] left-4 rounded-full bg-[var(--accent)] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.05em] text-[var(--bg)]">
                          Más popular
                        </span>
                        <p className="text-[15px] font-semibold text-[var(--text-primary)]">Anual</p>
                        <p className="mt-1 text-[24px] font-bold tabular-nums text-[var(--text-primary)]">
                          $<AnimatedNumber value={PLAN_ANUAL.precioMesNum} decimals={2} />
                          <span className="text-[14px] font-normal text-[var(--text-secondary)]">/mes</span>
                        </p>
                        <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">{PLAN_ANUAL.totalAnual}</p>
                        <p className="mt-1 text-[13px] font-semibold text-[var(--accent)]">{PLAN_ANUAL.ahorro}</p>
                      </motion.button>
                    </Hairline>
                  </motion.div>

                  <motion.button
                    variants={staggerItem}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setPlan('mensual')}
                    className={`rounded-[var(--radius-card)] border p-4 text-left transition-colors ${
                      plan === 'mensual'
                        ? 'border-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_7%,var(--surface))]'
                        : 'border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)]'
                    }`}
                  >
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">Mensual</p>
                    <p className="mt-1 text-[24px] font-bold tabular-nums text-[var(--text-primary)]">
                      $<AnimatedNumber value={PLAN_MENSUAL.precioMesNum} decimals={2} />
                      <span className="text-[14px] font-normal text-[var(--text-secondary)]">/mes</span>
                    </p>
                  </motion.button>
                </div>
              </Stagger>

              <div className="mt-6">
                <FunnelCta onClick={confirmarPlan}>Empezar mis 7 días gratis</FunnelCta>
                <p className="mt-2 text-center text-[13px] text-[var(--text-secondary)]">
                  Hoy no pagas nada · Te avisamos 1 día antes del cobro · Cancela en 1 tap
                </p>
              </div>

              <div className="mt-4 flex items-center justify-center gap-4 text-[13px] text-[var(--text-tertiary)]">
                <a href="/entrar" className="underline">Ahora no</a>
                <span aria-hidden="true">·</span>
                <a href="/entrar" className="underline">Restaurar compra</a>
              </div>

              <div className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-[var(--text-tertiary)]">
                <Lock size={14} strokeWidth={2} aria-hidden="true" />
                Pago seguro (Hotmart)
                <span aria-hidden="true">·</span>
                <ShieldCheck size={14} strokeWidth={2} aria-hidden="true" />
                Garantía de tu Primera Semana — 15 días
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </FunnelStage>
    </FunnelShell>
  );
}
