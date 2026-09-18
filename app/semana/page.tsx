'use client';

// RESUMEN SEMANAL — vista rápida de "qué destaca cada día" (NUNCA la planeación completa —
// corrección del usuario, Sesión 5: una planeación real tiene varios bloques cada día). Esta
// pantalla se queda igual visualmente a como ya fue aprobada; solo cambia su CONCEPTO: ahora es
// un resumen que lleva a /planeacion para ver todos los bloques del día completo.
//
// Sesión 6 paso 5: agrega el interruptor "Personalizar con mis niños" — pertenece a ESTA semana
// (`plan.personalizacionActiva`), no a un ajuste global (regla del usuario: una maestra puede
// personalizar unas semanas y no otras). Sin niños registrados, el interruptor no aparece — la
// planeación grupal sigue funcionando exactamente igual. Encenderlo corre
// `calcularPersonalizacionSemana` UNA vez y lo guarda; después solo "Actualizar personalización"
// lo vuelve a correr (nunca se recalcula solo al abrir la pantalla).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ChevronLeft, ChevronRight, ClipboardList, RefreshCw, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import {
  FECHA_HOY,
  actividadDestacada,
  focoTextoDestacado,
  BLOQUE_LABEL,
  leerNinos,
  planeacionPorNumero,
  guardarUnaPlaneacion,
  calcularPersonalizacionSemana,
  type Nino,
  type PlaneacionSemanal,
} from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const FECHA_CORTA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' });

export default function Semana() {
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [plan, setPlan] = useState<PlaneacionSemanal | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setPlan(planeacionPorNumero(3));
    setCargado(true);
  }, []);

  if (!cargado || !plan) return null;

  function alternarPersonalizacion() {
    if (!plan) return;
    const activar = !plan.personalizacionActiva;
    const actualizado = activar ? calcularPersonalizacionSemana(plan, ninos) : { ...plan, personalizacionActiva: false };
    guardarUnaPlaneacion(actualizado);
    setPlan(actualizado);
  }

  function actualizarPersonalizacion() {
    if (!plan) return;
    const actualizado = calcularPersonalizacionSemana(plan, ninos);
    guardarUnaPlaneacion(actualizado);
    setPlan(actualizado);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.header variants={item} className="mb-6 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              Semana {plan.numero} · Resumen
            </p>
            <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Mañana ya tiene foco
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Vista rápida — toca un día para ver todo.</p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              aria-label="Semana anterior"
              className="flex size-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] text-[var(--text-secondary)]"
            >
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Semana siguiente"
              className="flex size-11 items-center justify-center rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] text-[var(--text-secondary)]"
            >
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </motion.header>

        {ninos.length > 0 && (
          <motion.div
            variants={item}
            className="mb-6 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <Sparkles size={18} aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Personalizar con mis niños</p>
              <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-secondary)]">
                {plan.personalizacionActiva
                  ? `Activada para esta semana · actualizada ${plan.personalizacionActualizadaEn ?? ''}`
                  : 'Agrega adaptaciones y niños foco reales solo a esta semana.'}
              </p>
            </div>
            {plan.personalizacionActiva && (
              <button
                type="button"
                onClick={actualizarPersonalizacion}
                aria-label="Actualizar personalización"
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
              >
                <RefreshCw size={16} aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              role="switch"
              aria-checked={plan.personalizacionActiva}
              onClick={alternarPersonalizacion}
              className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
              style={{ background: plan.personalizacionActiva ? 'var(--accent)' : 'color-mix(in oklab, var(--text-tertiary) 30%, transparent)' }}
            >
              <motion.span
                className="absolute top-1 left-1 size-5 rounded-full bg-[var(--bg)] shadow-[var(--shadow-1)]"
                animate={{ x: plan.personalizacionActiva ? 20 : 0 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              />
            </button>
          </motion.div>
        )}

        <ul className="flex flex-col gap-3">
          {plan.dias.map((d) => {
            const destacada = actividadDestacada(d);
            const hoy = d.fecha === FECHA_HOY;
            return (
              <motion.li key={d.dia} variants={item}>
                <button
                  type="button"
                  onClick={() => router.push(`/planeacion?dia=${d.dia}`)}
                  className={`flex w-full items-center gap-4 rounded-[var(--radius-card)] p-4 text-left shadow-[var(--shadow-1)] transition-opacity active:opacity-90 ${
                    hoy ? 'bg-[var(--accent)]' : 'bg-[var(--surface)]'
                  }`}
                >
                  <div className="w-12 shrink-0 text-center">
                    <p className={`text-[13px] font-bold uppercase ${hoy ? 'text-[var(--butter)]' : 'text-[var(--accent-2)]'}`}>
                      {d.dia}
                    </p>
                    <p className={`text-[11px] tabular-nums ${hoy ? 'text-[color-mix(in_oklab,var(--bg)_75%,transparent)]' : 'text-[var(--text-tertiary)]'}`}>
                      {FECHA_CORTA.format(new Date(`${d.fecha}T12:00:00`))}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12px] font-medium uppercase tracking-[0.04em] ${hoy ? 'text-[color-mix(in_oklab,var(--bg)_75%,transparent)]' : 'text-[var(--text-tertiary)]'}`}>
                      {BLOQUE_LABEL[destacada.bloque]}
                    </p>
                    <p className={`truncate text-[15px] font-semibold ${hoy ? 'text-[var(--bg)]' : 'text-[var(--text-primary)]'}`}>
                      {destacada.titulo}
                    </p>
                    <p className={`mt-0.5 truncate text-[13px] ${hoy ? 'text-[color-mix(in_oklab,var(--bg)_85%,transparent)]' : 'text-[var(--text-secondary)]'}`}>
                      {focoTextoDestacado(destacada)}
                    </p>
                  </div>
                </button>
              </motion.li>
            );
          })}
        </ul>

        {/* ——— Acceso a la planeación completa — regla del usuario: la vista rápida NUNCA es
            la planeación; siempre debe llevar a los bloques completos del día. ——— */}
        <motion.div variants={item} className="mt-6">
          <button
            type="button"
            onClick={() => router.push('/planeacion')}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,transparent)] text-[16px] font-semibold text-[var(--accent)] transition-opacity active:opacity-80"
          >
            <ClipboardList size={20} aria-hidden="true" />
            Ver planeación completa
          </button>
        </motion.div>

        <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
          Cada niño foco de esta semana viene de una observación real, no de una lista al azar.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
