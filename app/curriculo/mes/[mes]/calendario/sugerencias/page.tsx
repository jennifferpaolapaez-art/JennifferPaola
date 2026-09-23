'use client';

// SUGERENCIAS PARA ESTE MES — Parte C. Agrupa por fuente (ubicación / comunidad / niños / estación
// / tradiciones del programa) y nunca agrega nada sola: cada sugerencia espera una decisión
// explícita (Incluir / Solo mencionar / Mostrar en calendario / No incluir). ⚠️ DEMO: sin perfiles
// reales de familias/equipo todavía — cuando existan, alimentan estas mismas categorías sin cambiar
// la arquitectura (nunca elegir sola, siempre agrupado por fuente).

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { MES_NOMBRE, curriculoActivo, disenoDeMes, leerDisenosMensuales } from '@/lib/curriculo';
import {
  FUENTE_SUGERENCIA_LABEL,
  aplicarSugerenciaCumpleanos,
  aplicarSugerenciaFecha,
  calendarioDeMes,
  guardarCalendariosMensuales,
  leerCalendariosMensuales,
  sugerenciasDelMes,
  type CalendarioMensual,
  type NivelEvento,
  type SugerenciaCumpleanos,
  type SugerenciaFecha,
} from '@/lib/calendario';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

const ACCIONES: { nivel: NivelEvento | null; texto: string }[] = [
  { nivel: 'incluir', texto: 'Incluir' },
  { nivel: 'mencionar', texto: 'Solo mencionar' },
  { nivel: 'solo_calendario', texto: 'Mostrar en calendario' },
  { nivel: null, texto: 'No incluir' },
];

function decisionDeFecha(calendario: CalendarioMensual | undefined, s: SugerenciaFecha): NivelEvento | null {
  const dia = calendario?.dias.find((d) => d.fecha === s.fecha);
  const evento = dia?.eventos.find((e) => e.origen === 'sugerido' && e.nombre === s.nombre);
  return evento ? evento.nivel : null;
}

function decisionDeCumpleanos(calendario: CalendarioMensual | undefined, s: SugerenciaCumpleanos): NivelEvento | null {
  const dia = calendario?.dias.find((d) => d.fecha === s.fecha);
  const evento = dia?.eventos.find((e) => e.origen === 'sugerido' && e.ninoId === s.ninoId);
  return evento ? evento.nivel : null;
}

function FilaSugerencia({ nombre, decision, onDecidir }: { nombre: string; decision: NivelEvento | null; onDecidir: (nivel: NivelEvento | null) => void }) {
  return (
    <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-3.5 shadow-[var(--shadow-1)]">
      <p className="text-[14px] font-medium text-[var(--text-primary)]">{nombre}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ACCIONES.map((a) => (
          <button
            key={a.texto}
            type="button"
            onClick={() => onDecidir(a.nivel)}
            aria-pressed={a.nivel !== null && decision === a.nivel}
            className={`min-h-11 rounded-[var(--radius-button)] px-2.5 py-1.5 text-[12px] font-semibold ${
              a.nivel !== null && decision === a.nivel
                ? 'bg-[var(--accent)] text-[var(--bg)]'
                : 'bg-[var(--surface-2)] text-[var(--text-primary)]'
            }`}
          >
            {a.texto}
          </button>
        ))}
      </div>
    </li>
  );
}

export default function SugerenciasMesPage() {
  const params = useParams<{ mes: string }>();
  const router = useRouter();
  const mes = Number(params.mes);
  const [calendarios, setCalendarios] = useState<CalendarioMensual[]>([]);
  const [curriculo] = useState(() => curriculoActivo());
  const [disenos] = useState(() => leerDisenosMensuales());
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setCalendarios(leerCalendariosMensuales());
    setCargado(true);
  }, []);

  if (!cargado || !curriculo || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;
  const anio = curriculo.anio;
  const diseno = disenoDeMes(anio, mes, disenos);
  const calendario = calendarioDeMes(anio, mes, calendarios);
  const sugerencias = sugerenciasDelMes(anio, mes, diseno);

  function persistir(actualizado: CalendarioMensual) {
    const actualizados = calendarios.map((c) => (c.id === actualizado.id ? actualizado : c));
    setCalendarios(actualizados);
    guardarCalendariosMensuales(actualizados);
  }

  if (!calendario) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">Primero genera el calendario de este mes</h1>
          <Link href={`/curriculo/mes/${mes}/calendario`} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Ir al Calendario
          </Link>
        </div>
      </AppShell>
    );
  }

  const porUbicacion = sugerencias.fechas.filter((f) => f.fuente === 'ubicacion');
  const porComunidad = sugerencias.fechas.filter((f) => f.fuente === 'comunidad');
  const estacional = sugerencias.fechas.filter((f) => f.tipo === 'estacion');
  const tradiciones = sugerencias.fechas.filter((f) => f.fuente === 'programa' && f.tipo !== 'estacion');

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push(`/curriculo/mes/${mes}/calendario`)}
            aria-label="Volver al Calendario"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Calendario Pedagógico</p>
          <h1 className="text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Sugerencias para {MES_NOMBRE[mes]}
          </h1>
          <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">Nada se agrega solo — cada una espera tu decisión.</p>
        </motion.header>

        {[
          { titulo: FUENTE_SUGERENCIA_LABEL.ubicacion, items: porUbicacion },
          { titulo: FUENTE_SUGERENCIA_LABEL.comunidad, items: porComunidad },
        ].map(
          ({ titulo, items }) =>
            items.length > 0 && (
              <motion.section key={titulo} variants={item} className="mb-6">
                <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">{titulo}</h2>
                <ul className="flex flex-col gap-2">
                  {items.map((s) => (
                    <FilaSugerencia key={s.id} nombre={`${s.nombre} — ${s.fecha.slice(8, 10)} de ${MES_NOMBRE[mes].toLowerCase()}`} decision={decisionDeFecha(calendario, s)} onDecidir={(nivel) => persistir(aplicarSugerenciaFecha(calendario, s, nivel))} />
                  ))}
                </ul>
              </motion.section>
            )
        )}

        {sugerencias.cumpleanos.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Por tus niños</h2>
            <ul className="flex flex-col gap-2">
              {sugerencias.cumpleanos.map((s) => (
                <FilaSugerencia key={s.id} nombre={`🎂 Cumpleaños de ${s.ninoNombre} — ${s.fecha.slice(8, 10)} de ${MES_NOMBRE[mes].toLowerCase()}`} decision={decisionDeCumpleanos(calendario, s)} onDecidir={(nivel) => persistir(aplicarSugerenciaCumpleanos(calendario, s, nivel))} />
              ))}
            </ul>
          </motion.section>
        )}

        {estacional.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Estacional</h2>
            <ul className="flex flex-col gap-2">
              {estacional.map((s) => (
                <FilaSugerencia key={s.id} nombre={s.nombre} decision={decisionDeFecha(calendario, s)} onDecidir={(nivel) => persistir(aplicarSugerenciaFecha(calendario, s, nivel))} />
              ))}
            </ul>
          </motion.section>
        )}

        {tradiciones.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">{FUENTE_SUGERENCIA_LABEL.programa}</h2>
            <ul className="flex flex-col gap-2">
              {tradiciones.map((s) => (
                <FilaSugerencia key={s.id} nombre={s.nombre} decision={decisionDeFecha(calendario, s)} onDecidir={(nivel) => persistir(aplicarSugerenciaFecha(calendario, s, nivel))} />
              ))}
            </ul>
          </motion.section>
        )}

        {porUbicacion.length === 0 && porComunidad.length === 0 && sugerencias.cumpleanos.length === 0 && estacional.length === 0 && tradiciones.length === 0 && (
          <motion.p variants={item} className="text-[14px] text-[var(--text-secondary)]">
            RAÍZ no encontró sugerencias para este mes todavía.
          </motion.p>
        )}
      </motion.div>
    </AppShell>
  );
}
