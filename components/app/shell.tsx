'use client';

// KIT DE LA APP INTERNA — composición según la Pantalla Canónica (53-PANTALLA-CANONICA.md):
// shell min-h-dvh + flex-col + main flex-1 + nav SIEMPRE al fondo, safe-area, indicador de tab
// activa con layoutId. Reutiliza los tokens de marca de components/landing/tokens.css (import
// global en app/globals.css) — NO redefine color aquí.

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, ChevronDown, ChevronRight, Home, NotebookPen, Plus, Users, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { etiquetaSkill, type EstadoDesarrollo, type EstadoEvidencia, type Observacion, type ObservacionSkill } from '@/lib/seed-data';

const NAV = [
  { id: 'hoy', label: 'Hoy', href: '/hoy', icono: Home },
  { id: 'semana', label: 'Semana', href: '/semana', icono: CalendarDays },
  { id: 'observaciones', label: 'Observar', href: '/observaciones', icono: NotebookPen },
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
   (nunca solo color — daltonismo). Usado en Perfil y en Niños foco. Sesión 6 paso 4: recibe los
   DOS ejes separados (desarrollo/evidencia) y los traduce a UNA etiqueta vía `etiquetaSkill` —
   nunca vuelve a mezclarlos en un solo campo guardado. ── */
export function SkillBadge({ estadoDesarrollo, estadoEvidencia }: { estadoDesarrollo: EstadoDesarrollo; estadoEvidencia: EstadoEvidencia }) {
  const { label, tono } = etiquetaSkill(estadoDesarrollo, estadoEvidencia);
  const cfg = {
    dominado: { bg: 'color-mix(in oklab, var(--sage) 16%, transparent)', color: 'var(--sage)' },
    en_desarrollo: { bg: 'color-mix(in oklab, var(--butter) 16%, transparent)', color: 'var(--butter)' },
    sin_evidencia: { bg: 'color-mix(in oklab, var(--coral) 14%, transparent)', color: 'var(--coral)' },
  }[tono];
  return (
    <span
      className="inline-flex w-fit items-center rounded-[var(--radius-button)] px-2.5 py-1 text-[12px] font-semibold"
      style={{ background: cfg.bg, color: cfg.color }}
    >
      {label}
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

/* ── <Colapsable> — la superficie se mantiene simple, la profundidad vive debajo (regla del
   usuario, Sesión 5 ronda 2: "primero veo lo esencial, después puedo expandir 'Adaptaciones',
   'Qué observar'"). Cerrado por defecto salvo que la pantalla decida abrirlo (ej. si aplica hoy). ── */
export function Colapsable({
  titulo,
  subtitulo,
  defaultAbierto = false,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  defaultAbierto?: boolean;
  children: ReactNode;
}) {
  const [abierto, setAbierto] = useState(defaultAbierto);
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-[var(--surface)] shadow-[var(--shadow-1)]">
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-expanded={abierto}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span>
          <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{titulo}</span>
          {subtitulo && <span className="mt-0.5 block text-[12px] text-[var(--text-secondary)]">{subtitulo}</span>}
        </span>
        <motion.span animate={{ rotate: abierto ? 180 : 0 }} transition={{ duration: 0.2 }} className="shrink-0 text-[var(--text-tertiary)]">
          <ChevronDown size={18} aria-hidden="true" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {abierto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── <Chip> — toggle de selección (única o múltiple, según lo use el padre). Extraído de
   Configuración del programa (Sesión 6, paso 2) a este kit compartido porque Módulo Niños
   (paso 3) necesita exactamente el mismo control. ── */
export function Chip({ label, activo, onClick }: { label: string; activo: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-[var(--radius-button)] px-3.5 py-2 text-[13px] font-semibold transition-colors duration-150 ${
        activo ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-primary)]'
      }`}
    >
      {label}
    </motion.button>
  );
}

/** Selector de varios elementos de una lista sugerida + posibilidad de agregar uno propio — texto
 * libre no bastaba (RAÍZ usa estos valores para lógica), pero tampoco se limita cuántos puede
 * elegir la maestra. */
export function SelectorConPersonalizado({
  sugeridos,
  seleccionados,
  onChange,
  placeholderAgregar,
}: {
  sugeridos: string[];
  seleccionados: string[];
  onChange: (valores: string[]) => void;
  placeholderAgregar: string;
}) {
  const [nuevo, setNuevo] = useState('');
  const todas = Array.from(new Set([...sugeridos, ...seleccionados]));

  function alternar(valor: string) {
    onChange(seleccionados.includes(valor) ? seleccionados.filter((v) => v !== valor) : [...seleccionados, valor]);
  }

  function agregar() {
    const v = nuevo.trim();
    if (!v || seleccionados.includes(v)) return;
    onChange([...seleccionados, v]);
    setNuevo('');
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {todas.map((v) => (
          <Chip key={v} label={v} activo={seleccionados.includes(v)} onClick={() => alternar(v)} />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregar())}
          placeholder={placeholderAgregar}
          className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!nuevo.trim()}
          aria-label="Agregar"
          className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[var(--text-primary)] disabled:opacity-40"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** Lista de etiquetas libres (intereses/fortalezas/preferencias del niño) — sin lista sugerida:
 * cada niño es distinto, no tiene sentido sugerir "intereses típicos". Escribe, Enter o botón
 * agrega, cada etiqueta se puede quitar con su × — nunca texto plano sin estructura. */
export function EtiquetasLibres({
  valores,
  onChange,
  placeholder,
}: {
  valores: string[];
  onChange: (valores: string[]) => void;
  placeholder: string;
}) {
  const [nuevo, setNuevo] = useState('');

  function agregar() {
    const v = nuevo.trim();
    if (!v || valores.includes(v)) return;
    onChange([...valores, v]);
    setNuevo('');
  }

  return (
    <div>
      {valores.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {valores.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-1.5 text-[13px] font-medium text-[var(--text-primary)]"
            >
              {v}
              <button type="button" onClick={() => onChange(valores.filter((x) => x !== v))} aria-label={`Quitar ${v}`} className="text-[var(--text-tertiary)]">
                <X size={13} aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregar())}
          placeholder={placeholder}
          className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!nuevo.trim()}
          aria-label="Agregar"
          className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[var(--text-primary)] disabled:opacity-40"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

const ORIGEN_OBSERVACION_LABEL: Record<string, string> = { dirigida: 'Dirigida', espontanea: 'Espontánea' };

/** Una fila de historial de observaciones — MISMA fila en `/observaciones` (todas) y dentro del
 * perfil del niño (filtrada por ese niño), regla del usuario Sesión 6 paso 6: "no es otro
 * dataset, es la misma información filtrada". `mostrarNino` se apaga dentro del perfil (ya se
 * sabe de quién es). Los skills `rechazado` no se muestran aquí — sí en el detalle completo. */
export function FilaObservacion({
  observacion,
  ninoNombre,
  ninoHex,
  skills,
  mostrarNino = true,
}: {
  observacion: Observacion;
  ninoNombre: string;
  ninoHex: string;
  skills: ObservacionSkill[];
  mostrarNino?: boolean;
}) {
  const relevantes = skills.filter((s) => s.estado !== 'rechazado');
  return (
    <Link
      href={`/observaciones/${observacion.id}`}
      className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] transition-opacity active:opacity-90"
    >
      {mostrarNino && <AvatarInicial nombre={ninoNombre} hex={ninoHex} size={36} />}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {mostrarNino && <span className="text-[14px] font-semibold text-[var(--text-primary)]">{ninoNombre}</span>}
          <span className="text-[12px] text-[var(--text-tertiary)]">{observacion.fecha}</span>
          <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">
            {ORIGEN_OBSERVACION_LABEL[observacion.origen]}
          </span>
        </div>
        <p className="mt-1 truncate text-[14px] text-[var(--text-secondary)]">{observacion.notaOriginal}</p>
        {relevantes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {relevantes.map((s) => (
              <span
                key={s.skillId}
                className={`rounded-[var(--radius-button)] px-2 py-0.5 text-[11px] font-semibold ${
                  s.estado === 'aceptado'
                    ? 'bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] text-[var(--sage)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]'
                }`}
              >
                {s.nombreSkill}
                {s.estado === 'sugerido' ? ' · sin revisar' : ''}
              </span>
            ))}
          </div>
        )}
      </div>
      <ChevronRight size={16} className="mt-1 shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
    </Link>
  );
}
