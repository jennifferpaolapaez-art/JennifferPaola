'use client';

// KIT DE ONBOARDING/PAYWALL — piezas compartidas del funnel (50-DISENO-ONBOARDING-PAYWALL.md).
// Reutiliza tokens.css de components/landing (misma marca) — este kit NO redefine color,
// solo compone: barra de progreso fina con % real, chips de opción 56-64px, micro-pantallas
// de reconocimiento, loading "construyendo tu plan" con líneas personalizadas.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Check } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/* ── <FunnelHeader> — logo + nombre arriba (regla de marca de 50), vuelve a /.
   Fix revisor-visual (ronda 2): logo agrandado de h-7 a h-9 (mismo tamaño que en el header de
   la landing) — a h-7 era casi ilegible como marca en 375px. ── */
export function FunnelHeader({ href = '/' }: { href?: string }) {
  return (
    <a href={href} className="flex h-14 items-center gap-2 text-[15px] font-semibold text-[var(--text-primary)]">
      <img src="/brand/raiz-logo.svg" alt="Raíz" className="h-9 w-auto" />
    </a>
  );
}

/* ── <ProgressBar> — línea fina 2-3px, % real, ENDOWED PROGRESS (arranca en 5-8%, nunca 0%). ── */
export function ProgressBar({ percent }: { percent: number }) {
  const pct = Math.max(6, Math.min(100, percent));
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-[color-mix(in_oklab,var(--text-tertiary)_15%,transparent)]">
      <motion.div
        className="h-full rounded-full bg-[var(--accent)]"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

/* ── <FunnelTopBar> — atrás (44px táctil) + barra + logo, mismo renglón. ── */
export function FunnelTopBar({
  percent,
  onBack,
  showBack = true,
}: {
  percent: number;
  onBack?: () => void;
  showBack?: boolean;
}) {
  return (
    <div className="sticky top-0 z-20 bg-[var(--bg)] px-5 pt-4">
      <div className="mx-auto flex w-full max-w-[480px] items-center gap-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Atrás"
            className="flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[color-mix(in_oklab,var(--text-tertiary)_10%,transparent)]"
          >
            <ArrowLeft size={20} strokeWidth={2} aria-hidden="true" />
          </button>
        ) : (
          <div className="size-11 shrink-0" aria-hidden="true" />
        )}
        <ProgressBar percent={percent} />
      </div>
      <div className="mx-auto mt-4 w-full max-w-[480px]">
        <FunnelHeader />
      </div>
    </div>
  );
}

/* ── <FunnelShell> — envoltorio de página completa del funnel.
   Fix revisor-visual ronda 1: fondo plano sin profundidad → mesh radial del acento.
   Fix revisor-visual ronda 2 (las 3 pantallas): el mesh a 7%/6% era IMPERCEPTIBLE en el
   screenshot real — subido a 14%/11% y radios más grandes. + hojita de firma (la tilde de
   la "í" de Raíz, mismo gesto que <CheckCustom> del kit de landing) como watermark de marca
   en la esquina — el dispositivo ownable de FICHA-ARTE.md no aparecía en ningún lado salvo
   el logo diminuto. ── */
export function FunnelShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(900px 560px at 10% -10%, color-mix(in oklab, var(--accent) 26%, transparent) 0%, transparent 65%), ' +
            'radial-gradient(700px 500px at 108% 40%, color-mix(in oklab, var(--accent-2) 20%, transparent) 0%, transparent 62%)',
        }}
      />
      {/* Hojita de firma — fix ronda 3: a opacity 0.05 era invisible en el screenshot real
          (revisor, 3 rondas seguidas). Subida a 0.13 y reubicada a media altura derecha, dentro
          de la zona que el centrado vertical deja libre — deja de ser esquina decorativa y pasa
          a ser parte de la composición. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-1/2 -right-10 -z-10 block size-48 -translate-y-1/2 rounded-tl-full rounded-br-full opacity-[0.13]"
        style={{ background: 'var(--accent)', transform: 'translateY(-50%) rotate(-45deg)' }}
      />
      {children}
    </div>
  );
}

/* ── <FunnelStage> — reserva el alto real bajo el topbar (para que el fondo con profundidad
   cubra toda la pantalla, sin franjas planas) SIN forzar centrado vertical del contenido.
   Fix ronda 1→3: centrar de verdad (justify-center) resolvía el "vacío muerto" de la ronda 1
   pero abría un vacío IGUAL de grande arriba Y abajo en preguntas cortas (ronda 3) — el patrón
   real de apps de onboarding (Duolingo, Cal AI) es contenido anclado arriba, con el fondo (mesh +
   hojita de firma, ver <FunnelShell>) llenando el resto — no el centrado. `topbarHeight` ajusta
   el offset real del alto reservado según el topbar de cada pantalla. ── */
export function FunnelStage({ children, topbarHeight = 96 }: { children: ReactNode; topbarHeight?: number }) {
  return (
    <div className="flex flex-col pb-10" style={{ minHeight: `calc(100dvh - ${topbarHeight}px)` }}>
      {children}
    </div>
  );
}

/* ── <AnimatedNumber> — conteo 0→valor al montar (baseline de movimiento obligatoria: los
   números héroe SIEMPRE cuentan, nunca aparecen estáticos — fix revisor-visual ronda 2, ningún
   número del paywall se animaba). prefijo/sufijo van fuera del conteo (ej. "$"/"/mes"). ── */
export function AnimatedNumber({
  value,
  decimals = 0,
  className = '',
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      el.textContent = value.toFixed(decimals);
      return;
    }
    const controls = animate(0, value, {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (el) el.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [value, decimals, reduce]);

  return <span ref={ref} className={`tabular-nums ${className}`}>{value.toFixed(decimals)}</span>;
}

/* ── <QuestionChip> — ancho completo, 56-64px, ícono duotone + label; estado seleccionado
   con borde+fondo+check acento (spec A2). ── */
export function QuestionChip({
  icon: Icono,
  label,
  selected = false,
  onClick,
  index = 0,
}: {
  icon?: LucideIcon;
  label: string;
  selected?: boolean;
  onClick: () => void;
  /** Posición en la lista — fija el retraso del stagger de entrada (fix revisor-visual:
   * antes TODOS los chips entraban de golpe con el título, sin escalonar). */
  index?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduce ? 0 : index * 0.06, ease: [0.16, 1, 0.3, 1] }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      aria-pressed={selected}
      className={`flex min-h-[56px] w-full items-center gap-3 rounded-[var(--radius-button)] border px-4 py-3 text-left shadow-[var(--shadow-1)] transition-colors duration-150 ${
        selected
          ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_10%,var(--surface))]'
          : 'border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] hover:border-[color-mix(in_oklab,var(--accent)_35%,transparent)]'
      }`}
    >
      {Icono && (
        <span
          aria-hidden="true"
          className={`flex size-9 shrink-0 items-center justify-center rounded-[10px] ${
            selected ? 'bg-[color-mix(in_oklab,var(--accent)_18%,transparent)]' : 'bg-[var(--surface-2)]'
          }`}
        >
          <Icono size={18} strokeWidth={2} color={selected ? 'var(--accent)' : 'var(--text-secondary)'} aria-hidden="true" />
        </span>
      )}
      <span className="flex-1 text-[16px] font-medium leading-snug text-[var(--text-primary)]">{label}</span>
      <AnimatePresence>
        {selected && (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]"
          >
            <Check size={13} strokeWidth={3} color="var(--bg)" aria-hidden="true" />
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

/* ── <QuestionScreen> — 1 pregunta por pantalla, transición A4, stagger de chips. ── */
export function QuestionScreen({
  eyebrow,
  pregunta,
  microcopy,
  children,
  direction = 1,
}: {
  eyebrow?: string;
  pregunta: string;
  microcopy?: string;
  children: ReactNode;
  direction?: 1 | -1;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, x: reduce ? 0 : 40 * direction }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: reduce ? 0 : -24 * direction }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mx-auto w-full max-w-[480px] px-5 pt-8"
    >
      {eyebrow && (
        <p className="mb-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--accent)]">{eyebrow}</p>
      )}
      <h1 className="text-balance text-[28px] font-bold leading-[1.12] tracking-[-0.01em] text-[var(--text-primary)] [font-family:var(--font-display)] md:text-[32px]">
        {pregunta}
      </h1>
      {microcopy && <p className="mt-2 text-[14px] leading-snug text-[var(--text-secondary)]">{microcopy}</p>}
      <div className="mt-7 flex flex-col gap-3">{children}</div>
    </motion.div>
  );
}

/* ── <Reconocimiento> — micro-pantalla de recompensa cada 3-5 preguntas (spec A5). ── */
export function Reconocimiento({
  icon: Icono,
  titulo,
  cuerpo,
  ctaLabel = 'Continuar',
  onContinuar,
}: {
  icon: LucideIcon;
  titulo: string;
  cuerpo: ReactNode;
  ctaLabel?: string;
  onContinuar: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex w-full max-w-[480px] flex-col items-center px-5 pt-10 text-center"
    >
      <motion.span
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05, duration: 0.3 }}
        aria-hidden="true"
        className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_12%,transparent)]"
      >
        <Icono size={30} strokeWidth={1.8} color="var(--accent)" aria-hidden="true" />
      </motion.span>
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.32 }}
        className="mt-5 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]"
      >
        {titulo}
      </motion.h1>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.32 }}
        className="mt-3 max-w-[38ch] text-[16px] leading-relaxed text-[var(--text-secondary)]"
      >
        {cuerpo}
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28, duration: 0.32 }}
        className="mt-8 w-full"
      >
        <FunnelCta onClick={onContinuar}>{ctaLabel}</FunnelCta>
      </motion.div>
    </motion.div>
  );
}

/* ── <FunnelCta> — CTA primario del funnel, 52-56px, acento pleno. ── */
export function FunnelCta({
  children,
  onClick,
  href,
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
}) {
  const cls = `flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] px-6 text-[16px] font-semibold transition-opacity duration-150 [touch-action:manipulation] ${
    disabled
      ? 'cursor-not-allowed bg-[var(--accent)] text-[var(--bg)] opacity-50'
      : 'bg-[var(--accent)] text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]'
  }`;
  if (href && !disabled) {
    return (
      <motion.a whileTap={{ scale: 0.97 }} href={href} className={cls}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button whileTap={disabled ? undefined : { scale: 0.97 }} type="button" onClick={onClick} disabled={disabled} className={cls}>
      {children}
    </motion.button>
  );
}

/* ── <SliderMeta> — pregunta de compromiso: número héroe + track. Spec A6. ── */
export function SliderMeta({
  value,
  min,
  max,
  unidad,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  unidad: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mt-4 flex flex-col items-center">
      <p className="text-[44px] font-bold leading-none tabular-nums text-[var(--text-primary)] [font-family:var(--font-display)]">
        {value}
      </p>
      <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{unidad}</p>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-6 w-full accent-[var(--accent)]"
        aria-label={unidad}
      />
      <div className="mt-1 flex w-full justify-between text-[12px] text-[var(--text-tertiary)]">
        <span>{min}</span>
        <span>{max}+</span>
      </div>
    </div>
  );
}

/* ── LOADING "construyendo tu plan" — spec B. 4-6s, líneas personalizadas, anillo con mesetas. ── */
export interface LineaLoading {
  texto: string;
}

export function LoadingConstruyendo({
  titulo,
  lineas,
  onDone,
}: {
  titulo: string;
  lineas: LineaLoading[];
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const [activa, setActiva] = useState(0);
  const [percent, setPercent] = useState(8);

  useEffect(() => {
    const stepMs = reduce ? 300 : 750;
    const timers: ReturnType<typeof setTimeout>[] = [];
    lineas.forEach((_, i) => {
      timers.push(
        setTimeout(() => {
          setActiva(i + 1);
          setPercent(Math.round(((i + 1) / lineas.length) * 100));
        }, stepMs * (i + 1))
      );
    });
    timers.push(setTimeout(onDone, stepMs * lineas.length + 500));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-live="polite"
      aria-busy={activa < lineas.length}
      className="mx-auto flex w-full max-w-[420px] flex-col items-center px-5 pt-16 text-center"
    >
      <div className="relative flex size-[112px] items-center justify-center">
        <svg viewBox="0 0 112 112" className="absolute inset-0 -rotate-90">
          <circle cx="56" cy="56" r="48" fill="none" stroke="var(--surface-2)" strokeWidth="9" />
          <motion.circle
            cx="56"
            cy="56"
            r="48"
            fill="none"
            stroke="var(--accent)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 48}
            initial={{ strokeDashoffset: 2 * Math.PI * 48 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 48 * (1 - percent / 100) }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          />
        </svg>
        <span className="text-[22px] font-bold tabular-nums text-[var(--text-primary)]">{percent}%</span>
      </div>
      <h1 className="mt-6 text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">{titulo}</h1>
      <ul className="mt-8 flex w-full flex-col gap-3 text-left">
        {lineas.map((l, i) => {
          const estado = i < activa ? 'done' : i === activa ? 'active' : 'pending';
          return (
            <motion.li
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: estado === 'pending' ? 0.4 : 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start gap-3 text-[15px] leading-snug text-[var(--text-primary)]"
            >
              {estado === 'done' ? (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
                  <Check size={12} strokeWidth={3} color="var(--bg)" aria-hidden="true" />
                </span>
              ) : estado === 'active' ? (
                <span className="mt-1.5 flex size-5 shrink-0 items-center justify-center">
                  <motion.span
                    animate={reduce ? undefined : { opacity: [1, 0.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="size-2 rounded-full bg-[var(--accent)]"
                  />
                </span>
              ) : (
                <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-[color-mix(in_oklab,var(--text-tertiary)_40%,transparent)]" />
              )}
              <span>{l.texto}</span>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}
