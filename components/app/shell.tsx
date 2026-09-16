'use client';

// KIT DE LA APP INTERNA — composición según la Pantalla Canónica (53-PANTALLA-CANONICA.md):
// shell min-h-dvh + flex-col + main flex-1 + nav SIEMPRE al fondo, safe-area, indicador de tab
// activa con layoutId. Reutiliza los tokens de marca de components/landing/tokens.css (import
// global en app/globals.css) — NO redefine color aquí.

import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { CalendarDays, Home, Users } from 'lucide-react';
import type { ReactNode } from 'react';

const NAV = [
  { id: 'hoy', label: 'Hoy', href: '/hoy', icono: Home },
  { id: 'semana', label: 'Semana', href: '/semana', icono: CalendarDays },
  { id: 'ninos', label: 'Niños', href: '/ninos', icono: Users },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const activo = NAV.find((n) => pathname === n.href || pathname.startsWith(n.href + '/'))?.id ?? 'hoy';

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)]">
      {/* Fix revisor-visual (Hoy, ronda 4): pb-6 no alcanzaba frente a la nav sticky (h-16 +
          safe-area) — el último párrafo de cada pantalla quedaba tapado. */}
      <main className="mx-auto w-full max-w-md flex-1 px-4 pt-6 pb-24">{children}</main>

      <nav
        aria-label="Navegación principal"
        className="sticky bottom-0 border-t border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)] pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
          {NAV.map(({ id, label, href, icono: Icono }) => {
            const esActivo = activo === id;
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => router.push(href)}
                aria-current={esActivo ? 'page' : undefined}
                className="relative flex min-w-16 flex-col items-center justify-center gap-1 [touch-action:manipulation]"
              >
                {esActivo && (
                  <motion.span
                    layoutId="app-tab-activa"
                    aria-hidden="true"
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-[var(--accent)]"
                  />
                )}
                <Icono
                  size={24}
                  aria-hidden="true"
                  color={esActivo ? 'var(--accent)' : 'var(--text-tertiary)'}
                  strokeWidth={esActivo ? 2.4 : 2}
                />
                <span
                  className={`text-[11px] font-medium ${
                    esActivo ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'
                  }`}
                >
                  {label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

/* ── <SkillBadge> — chip de estado que ABRAZA su contenido (49 §4), texto + color
   (nunca solo color — daltonismo). Usado en Perfil y en Niños foco. ── */
export function SkillBadge({ estado }: { estado: 'dominado' | 'en_desarrollo' | 'no_observado' }) {
  const cfg = {
    dominado: { label: 'Dominado', bg: 'color-mix(in oklab, var(--sage) 16%, transparent)', color: 'var(--sage)' },
    en_desarrollo: { label: 'En desarrollo', bg: 'color-mix(in oklab, var(--butter) 16%, transparent)', color: 'var(--butter)' },
    no_observado: { label: 'Aún no observado', bg: 'color-mix(in oklab, var(--coral) 14%, transparent)', color: 'var(--coral)' },
  }[estado];
  return (
    <span
      className="inline-flex w-fit items-center rounded-[var(--radius-button)] px-2.5 py-1 text-[12px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {cfg.label}
    </span>
  );
}

/* ── <EtapaChip> — chip de banda de edad (Infant/Toddler/Preschool/Pre-K), consistente con la
   landing (Solucion.tsx usa los mismos 4 tintes de marca). Interactivo si recibe onClick (fix
   revisor-visual: Hoy reimplementaba este mismo chip a mano con padding distinto — ahora hay
   UN solo componente para las variantes estática y tocable). ── */
export function EtapaChip({
  etapa,
  activa = false,
  onClick,
}: {
  etapa: string;
  activa?: boolean;
  onClick?: () => void;
}) {
  // Fix revisor-visual (ronda 3): --text-secondary sobre --surface-2 medía ~4.15:1, bajo el
  // mínimo AA (4.5:1) para texto de 13px — se usa --text-primary en el estado inactivo, que sí
  // pasa con margen sobre ese mismo fondo.
  // Fix revisor-visual (ronda 4): py-2 daba ~34px de alto táctil, bajo el mínimo de 44px (regla
  // UX 5) — min-h-11 (44px) lo garantiza sin cambiar el padding visual del texto.
  const clase = `inline-flex w-fit min-h-11 items-center rounded-[var(--radius-button)] px-3.5 py-2 text-[13px] font-semibold transition-colors duration-150 ${
    activa ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-primary)]'
  }`;
  if (onClick) {
    return (
      <motion.button whileTap={{ scale: 0.96 }} role="tab" aria-selected={activa} type="button" onClick={onClick} className={clase}>
        {etapa}
      </motion.button>
    );
  }
  return <span className={clase}>{etapa}</span>;
}

/* ── <LeafCheck> — el marcador de check/logro PROPIO de la marca (la hojita de la tilde de la
   "í" de Raíz — mismo dispositivo ownable de <CheckCustom> en components/landing/ui.tsx).
   Fix revisor-visual (pantalla Hoy, ronda 1): la app interna usaba el ✓/✕ genérico de Lucide en
   vez del dispositivo ownable que FICHA-ARTE.md exige que se repita en toda la app. ── */
export function LeafCheck({ negativo = false, size = 18 }: { negativo?: boolean; size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full"
      style={{ background: negativo ? 'var(--coral)' : 'var(--sage)', width: size, height: size }}
    >
      {negativo ? (
        <span className="block h-[2px] w-[9px] rounded-full" style={{ background: 'var(--bg)' }} />
      ) : (
        <span
          className="block rounded-tl-full rounded-br-full"
          style={{ background: 'var(--bg)', width: size * 0.32, height: size * 0.46, transform: 'rotate(-45deg)' }}
        />
      )}
    </span>
  );
}

/* ── <AvatarInicial> — círculo con la inicial del niño, tinte de marca (nunca foto real de
   un niño en el seed — privacidad). Mismo patrón visual de los mockups ya mostrados. ── */
export function AvatarInicial({ nombre, hex, size = 36 }: { nombre: string; hex: string; size?: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-[var(--bg)]"
      style={{ background: hex, width: size, height: size }}
      aria-hidden="true"
    >
      {nombre.charAt(0)}
    </span>
  );
}
