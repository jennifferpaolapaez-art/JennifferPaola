'use client';

// HOY — pantalla principal de la app (M0, el ritual diario, la pantalla MÁS VISTA).
// Corrección pedagógica del usuario (Sesión 5): primero el resumen de TODA la rutina del día
// (varios bloques, no una sola actividad), después se destaca la actividad ACTUAL con su
// detalle — diferenciación por etapa, adaptaciones individuales y niños foco, como 3 capas
// separadas. Message-match con el mockup ya mostrado en la landing (frame-hoy.png).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ChevronRight, NotebookPen } from 'lucide-react';
import { AppShell, AvatarInicial, EtapaChip, LeafCheck } from '@/components/app/shell';
import {
  ETAPAS_ORDEN,
  TINT_HEX,
  BLOQUE_LABEL,
  FECHA_HOY,
  diaPorFecha,
  actividadActualHoy,
  ninoPorId,
  leerNinos,
  planeacionPorNumero,
  type Etapa,
  type Nino,
} from '@/lib/seed-data';
import { ESTADO_OPERATIVO_LABEL, TIPO_EVENTO_LABEL, calendarioDeMes, diaDeCalendario, leerCalendariosMensuales } from '@/lib/calendario';

/** Mayúscula solo en la primera letra — "capitalize" de Tailwind mayusculiza CADA palabra,
 * incluida la preposición "de" en fechas en español ("15 De Septiembre"), fix revisor-visual. */
function primeraMayuscula(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Hoy() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : 0.06 } } };
  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] } },
  };
  const [etapaActiva, setEtapaActiva] = useState<Etapa>('Preschool');
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setCargado(true);
  }, []);

  if (!cargado) return null;

  const hoyDate = new Date(`${FECHA_HOY}T09:00:00`);
  const fecha = primeraMayuscula(
    new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' }).format(hoyDate)
  );

  // Parte D — antes de buscar Planeación, RAÍZ pregunta al Calendario si hoy el programa abre.
  // `/hoy` SIGUE usando siempre la fecha real (nunca un contexto navegado); esto solo decide qué
  // mostrar cuando esa fecha real cae en un día que la maestra marcó cerrado/feriado/administrativo
  // en su Calendario. Sin Calendario para este mes (la maestra nunca lo usó), se sigue el camino
  // de siempre — nunca se exige Calendario retroactivamente.
  const [anioHoyStr, mesHoyStr] = FECHA_HOY.split('-');
  const calendarioHoy = calendarioDeMes(Number(anioHoyStr), Number(mesHoyStr), leerCalendariosMensuales());
  const diaCalendarioHoy = calendarioHoy ? diaDeCalendario(calendarioHoy, FECHA_HOY) : undefined;

  if (diaCalendarioHoy && diaCalendarioHoy.estado !== 'abierto') {
    return (
      <AppShell>
        <motion.div variants={lista} initial="hidden" animate="visible">
          <motion.header variants={item} className="mb-5">
            <p className="text-[13px] font-medium text-[var(--text-tertiary)]">{fecha}</p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Tu día completo
            </h1>
          </motion.header>
          <motion.div variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-6 text-center shadow-[var(--shadow-1)]">
            <p className="text-[16px] font-semibold text-[var(--text-primary)]">Hoy el programa está cerrado</p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">{ESTADO_OPERATIVO_LABEL[diaCalendarioHoy.estado]}</p>
            {diaCalendarioHoy.eventos.length > 0 && (
              <ul className="mt-4 flex flex-col gap-1.5">
                {diaCalendarioHoy.eventos.map((e) => (
                  <li key={e.id} className="text-[13px] text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-primary)]">{TIPO_EVENTO_LABEL[e.tipo]}</span> · {e.nombre}
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        </motion.div>
      </AppShell>
    );
  }

  const plan = planeacionPorNumero(3);
  const dia = diaPorFecha(FECHA_HOY, plan);
  const actual = actividadActualHoy(plan);

  if (!dia || !actual) return null;
  const { actividad } = actual;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.header variants={item} className="mb-5">
          <p className="text-[13px] font-medium text-[var(--text-tertiary)]">{fecha}</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Tu día completo
          </h1>
        </motion.header>

        {/* ——— RESUMEN DE LA RUTINA DEL DÍA — corrección del usuario: Hoy debe mostrar TODO
            lo que va a ocurrir en la jornada, no solo una actividad. Cada bloque lleva a su
            detalle completo. ——— */}
        <motion.section variants={item} aria-label="Rutina de hoy" className="mb-6">
          <ul className="flex flex-col gap-2">
            {dia.actividades.map((act) => {
              const esActual = act.id === actividad.id;
              return (
                <li key={act.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/planeacion/${act.id}`)}
                    className={`flex w-full items-center gap-3 rounded-[var(--radius-card)] p-3.5 text-left transition-opacity active:opacity-90 ${
                      esActual
                        ? 'border-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)]'
                        : 'border border-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)] bg-[var(--surface)]'
                    }`}
                  >
                    <span className="w-12 shrink-0 text-[12px] tabular-nums text-[var(--text-tertiary)]">{act.hora}</span>
                    <div className="min-w-0 flex-1">
                      <p className={`truncate text-[11px] font-semibold uppercase tracking-[0.04em] ${esActual ? 'text-[var(--accent)]' : 'text-[var(--text-tertiary)]'}`}>
                        {BLOQUE_LABEL[act.bloque]}
                        {esActual && ' · Ahora'}
                      </p>
                      <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{act.titulo}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </motion.section>

        {/* ——— ACTIVIDAD ACTUAL, destacada — su detalle inline (etapa) + acceso al detalle
            completo (adaptaciones, foco, materiales, etc. viven en /planeacion/[id]). ——— */}
        <motion.section
          variants={item}
          aria-label="Actividad actual"
          className="mb-6 rounded-[var(--radius-card)] border-x border-b border-t-[3px] border-x-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-b-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-t-[var(--accent)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)]"
        >
          <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Actividad actual</p>
          <h2 className="mt-1 text-[20px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">
            {actividad.titulo}
          </h2>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{actividad.objetivo}</p>

          {actividad.diferenciacion && (
            <>
              <p className="mt-4 text-[13px] font-semibold text-[var(--text-primary)]">Una experiencia, cinco niveles</p>
              <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Bandas de edad">
                {ETAPAS_ORDEN.map((etapa) => (
                  <EtapaChip key={etapa} etapa={etapa} activa={etapa === etapaActiva} onClick={() => setEtapaActiva(etapa)} />
                ))}
              </div>
              <motion.p
                key={etapaActiva}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 rounded-[calc(var(--radius-button)-2px)] bg-[var(--surface-2)] p-4 text-[15px] leading-snug text-[var(--text-primary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
              >
                {actividad.diferenciacion[etapaActiva]}
              </motion.p>
            </>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
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

          <button
            type="button"
            onClick={() => router.push(`/planeacion/${actividad.id}`)}
            className="mt-4 text-[13px] font-semibold text-[var(--accent)] underline"
          >
            Ver detalle completo de esta actividad
          </button>
        </motion.section>

        {/* ——— CAPA B: adaptaciones individuales — SEPARADA de niños foco. Solo si ESTA semana
            tiene personalización activada (regla del usuario, Sesión 6 paso 5). ——— */}
        {plan.personalizacionActiva && actividad.adaptacionesIndividuales && actividad.adaptacionesIndividuales.length > 0 && (
          <motion.section variants={item} className="mb-6" aria-label="Adaptaciones individuales">
            <h2 className="mb-1 text-[16px] font-semibold text-[var(--text-primary)]">Adaptaciones individuales</h2>
            <p className="mb-3 text-[13px] text-[var(--text-secondary)]">Ajustes puntuales — no implican un Plan Individual.</p>
            <ul className="flex flex-col gap-2">
              {actividad.adaptacionesIndividuales.map((a, i) => {
                const nino = ninoPorId(a.ninoId, ninos);
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

        {/* ——— CAPA C: niños foco — SEPARADA de adaptaciones individuales. Solo si ESTA semana
            tiene personalización activada (regla del usuario, Sesión 6 paso 5). ——— */}
        {plan.personalizacionActiva && actividad.ninosFoco && actividad.ninosFoco.length > 0 && (
          <motion.section variants={item} className="mb-6 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-5" aria-label="Niños foco de hoy">
            <button
              type="button"
              onClick={() => router.push('/ninos-foco')}
              className="mb-3 flex w-full items-center justify-between text-left"
            >
              <h2 className="text-[16px] font-semibold text-[var(--text-primary)]">Niños foco de hoy</h2>
              <ChevronRight size={18} className="text-[var(--text-tertiary)]" aria-hidden="true" />
            </button>
            <ul className="flex flex-col gap-1">
              {actividad.ninosFoco.map((f) => {
                const nino = ninoPorId(f.ninoId, ninos);
                if (!nino) return null;
                const yaObservado = f.estadoFoco === 'observado';
                return (
                  <li key={f.ninoId}>
                    <Link
                      href={`/observar?ninoId=${nino.id}&actividadId=${actividad.id}${f.skillId ? `&skillId=${f.skillId}` : ''}`}
                      className="flex items-center gap-3 rounded-[var(--radius-button)] p-2 -mx-2 transition-opacity active:opacity-90"
                    >
                      <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} />
                      <span className="flex-1 text-[15px] font-medium text-[var(--text-primary)]">{nino.nombre}</span>
                      <span className="text-[13px] text-[var(--text-secondary)]">{yaObservado ? 'Ya observado' : f.meta}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {/* ——— CTA PRINCIPAL: registrar observación ——— */}
        <motion.div variants={item} className="mb-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => router.push(`/observar?actividadId=${actividad.id}`)}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] [touch-action:manipulation]"
          >
            <NotebookPen size={20} aria-hidden="true" />
            Registrar observación de hoy
          </motion.button>
        </motion.div>

        <motion.p variants={item} className="text-center text-[13px] text-[var(--text-tertiary)]">
          Cada observación de hoy mejora la planeación de mañana.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
