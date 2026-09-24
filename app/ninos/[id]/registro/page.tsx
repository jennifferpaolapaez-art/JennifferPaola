'use client';

// REGISTRO MENSUAL DE OBSERVACIONES (Sesión 6, paso 7 / 6e-1) — "¿qué observamos exactamente de
// este niño durante este mes?". Vista INTERNA derivada de Observaciones — la maestra NO vuelve a
// escribir nada aquí. Solo observaciones con redacción profesional APROBADA entran al Registro
// principal; pendientes de redacción y "No observado" viven en sus propias secciones, nunca
// mezclados ni mostrando la nota cruda. Sin síntesis, sin porcentajes, sin comparación entre
// meses — eso es 6e-2 (Informe Mensual), un producto DISTINTO que llega después.

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight, NotebookPen, Paperclip } from 'lucide-react';
import { AppShell, AvatarInicial, Chip } from '@/components/app/shell';
import {
  FECHA_HOY,
  TINT_HEX,
  BLOQUE_LABEL,
  leerNinos,
  leerObservaciones,
  leerObservacionSkills,
  ninoPorId,
  actividadPorIdGlobal,
  type Nino,
  type Observacion,
  type ObservacionSkill,
} from '@/lib/seed-data';
import { MES_NOMBRE } from '@/lib/curriculo';
import { informeVigente } from '@/lib/informe-mensual';
import {
  areasDelMes,
  habilidadesAceptadasDeObservacion,
  habilidadesDelMes,
  mesAnterior,
  mesSiguiente,
  observacionesAprobadasDelMes,
  oportunidadesSinEvidenciaDelMes,
  pendientesDeRedaccionDelMes,
  resumenRegistroMes,
} from '@/lib/registro-mensual';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const ORIGEN_LABEL: Record<string, string> = { dirigida: 'Dirigida', espontanea: 'Espontánea' };

function fechaCortaLegible(fecha: string): string {
  const t = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short' }).format(new Date(`${fecha}T12:00:00`));
  return t.replace('.', '');
}

function EntradaAprobada({ observacion, relaciones }: { observacion: Observacion; relaciones: ObservacionSkill[] }) {
  const habilidades = habilidadesAceptadasDeObservacion(observacion.id, relaciones);
  const contexto = observacion.actividadId ? actividadPorIdGlobal(observacion.actividadId) : undefined;
  return (
    <Link href={`/observaciones/${observacion.id}`} className="block rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">{fechaCortaLegible(observacion.fecha)}</span>
        <span className="text-[11px] font-medium text-[var(--text-tertiary)]">{ORIGEN_LABEL[observacion.origen]}</span>
        {observacion.idiomaRedaccion && <span className="rounded-[var(--radius-button)] bg-[var(--surface-2)] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">{observacion.idiomaRedaccion}</span>}
        {contexto && <span className="text-[11px] text-[var(--text-tertiary)]">· {BLOQUE_LABEL[contexto.actividad.bloque]}: {contexto.actividad.titulo}</span>}
      </div>
      <p className="mt-1.5 text-[14px] leading-snug text-[var(--text-primary)]">{observacion.redaccionProfesional}</p>
      {(habilidades.length > 0 || (observacion.evidencias?.length ?? 0) > 0) && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {habilidades.map((h) => (
            <span key={h.skillId} className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--sage)_14%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--sage)]">
              {h.nombreSkill}
            </span>
          ))}
          {(observacion.evidencias?.length ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--text-tertiary)]">
              <Paperclip size={11} aria-hidden="true" />
              {observacion.evidencias!.length} {observacion.evidencias!.length === 1 ? 'evidencia' : 'evidencias'}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function RegistroMensual() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [cargado, setCargado] = useState(false);
  const [filtroArea, setFiltroArea] = useState<string | 'todas'>('todas');
  const [filtroHabilidad, setFiltroHabilidad] = useState<string | 'todas'>('todas');

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setCargado(true);
  }, []);

  if (!cargado) return null;
  const nino = ninoPorId(params.id, ninos);
  if (!nino) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos a este niño</h1>
          <Link href="/ninos" className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a Niños
          </Link>
        </div>
      </AppShell>
    );
  }

  // `FECHA_HOY` sigue siendo la constante DEMO documentada en `seed-data.ts` — se usa aquí solo
  // para elegir el mes con el que abre esta pantalla por defecto, nunca para "hoy" real.
  const anio = Number(searchParams.get('anio')) || Number(FECHA_HOY.slice(0, 4));
  const mes = Number(searchParams.get('mes')) || Number(FECHA_HOY.slice(5, 7));

  function irAMes(destino: { anio: number; mes: number }) {
    setFiltroArea('todas');
    setFiltroHabilidad('todas');
    router.push(`/ninos/${params.id}/registro?anio=${destino.anio}&mes=${destino.mes}`);
  }

  const aprobadas = observacionesAprobadasDelMes(nino.id, anio, mes, observaciones);
  const pendientes = pendientesDeRedaccionDelMes(nino.id, anio, mes, observaciones);
  const oportunidades = oportunidadesSinEvidenciaDelMes(nino.id, anio, mes, observaciones);
  const resumen = resumenRegistroMes(aprobadas, pendientes);
  const areas = areasDelMes(aprobadas, relaciones);
  const habilidadesOpciones = habilidadesDelMes(aprobadas, relaciones);
  const informeExistente = !!informeVigente(nino.id, anio, mes);

  const aprobadasFiltradas = aprobadas.filter((o) => {
    if (filtroArea === 'todas' && filtroHabilidad === 'todas') return true;
    const h = habilidadesAceptadasDeObservacion(o.id, relaciones);
    const pasaArea = filtroArea === 'todas' || h.some((x) => x.dominio === filtroArea);
    const pasaHabilidad = filtroHabilidad === 'todas' || h.some((x) => x.skillId === filtroHabilidad);
    return pasaArea && pasaHabilidad;
  });

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2 flex items-center justify-between">
          <Link href={`/ninos/${nino.id}`} aria-label="Volver al perfil" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-1">
            <button type="button" onClick={() => irAMes(mesAnterior(anio, mes))} aria-label="Mes anterior" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)]">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => irAMes(mesSiguiente(anio, mes))} aria-label="Mes siguiente" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)]">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        <motion.header variants={item} className="mb-5 flex items-center gap-3">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={44} />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Registro mensual</p>
            <h1 className="text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {nino.nombre} · {MES_NOMBRE[mes]} {anio}
            </h1>
          </div>
        </motion.header>

        <motion.p variants={item} className="mb-2 text-[14px] text-[var(--text-secondary)]">
          {resumen.totalAprobadas === 0
            ? 'Sin observaciones aprobadas este mes.'
            : `${resumen.totalAprobadas} ${resumen.totalAprobadas === 1 ? 'observación aprobada' : 'observaciones aprobadas'} en ${resumen.diasDistintos} ${resumen.diasDistintos === 1 ? 'día' : 'días'}.`}
          {resumen.totalPendientes > 0 && ` ${resumen.totalPendientes} ${resumen.totalPendientes === 1 ? 'pendiente' : 'pendientes'} de redacción.`}
        </motion.p>

        <motion.div variants={item} className="mb-5">
          <Link href={`/ninos/${nino.id}/informe-mensual?anio=${anio}&mes=${mes}`} className="text-[13px] font-semibold text-[var(--accent)] underline">
            {informeExistente ? 'Ver Informe Mensual' : 'Preparar Informe Mensual'}
          </Link>
        </motion.div>

        {(areas.length > 0 || habilidadesOpciones.length > 0) && (
          <motion.div variants={item} className="mb-5 flex flex-col gap-2">
            {areas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Chip label="Todas las áreas" activo={filtroArea === 'todas'} onClick={() => setFiltroArea('todas')} />
                {areas.map((a) => (
                  <Chip key={a.id} label={a.nombre} activo={filtroArea === a.id} onClick={() => setFiltroArea(a.id)} />
                ))}
              </div>
            )}
            {habilidadesOpciones.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <Chip label="Todas las habilidades" activo={filtroHabilidad === 'todas'} onClick={() => setFiltroHabilidad('todas')} />
                {habilidadesOpciones.map((h) => (
                  <Chip key={h.id} label={h.nombre} activo={filtroHabilidad === h.id} onClick={() => setFiltroHabilidad(h.id)} />
                ))}
              </div>
            )}
          </motion.div>
        )}

        <motion.section variants={item} aria-label="Registro del mes" className="mb-6 flex flex-col gap-2">
          {aprobadasFiltradas.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-10 text-center">
              <NotebookPen size={22} className="text-[var(--text-tertiary)]" aria-hidden="true" />
              <p className="text-[14px] text-[var(--text-secondary)]">
                {aprobadas.length === 0 ? `Todavía no hay observaciones aprobadas para ${MES_NOMBRE[mes]} ${anio}.` : 'Ninguna observación coincide con este filtro.'}
              </p>
            </div>
          ) : (
            aprobadasFiltradas.map((o) => <EntradaAprobada key={o.id} observacion={o} relaciones={relaciones} />)
          )}
        </motion.section>

        {pendientes.length > 0 && (
          <motion.section variants={item} aria-label="Pendientes de redacción" className="mb-6">
            <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Pendientes de redacción ({pendientes.length})</h2>
            <ul className="flex flex-col gap-2">
              {pendientes.map((o) => {
                const contexto = o.actividadId ? actividadPorIdGlobal(o.actividadId) : undefined;
                return (
                  <li key={o.id}>
                    <Link href={`/observaciones/${o.id}`} className="flex items-center justify-between gap-2 rounded-[var(--radius-card)] bg-[var(--surface-2)] px-4 py-3">
                      <span className="text-[13px] text-[var(--text-primary)]">
                        {fechaCortaLegible(o.fecha)}
                        {contexto && ` · ${contexto.actividad.titulo}`}
                      </span>
                      <span className="text-[12px] font-semibold text-[var(--accent)]">Organizar observación</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {oportunidades.length > 0 && (
          <motion.section variants={item} aria-label="Momentos pendientes de observar">
            <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Momentos pendientes de observar ({oportunidades.length})</h2>
            <ul className="flex flex-col gap-1.5">
              {oportunidades.map((o) => (
                <li key={o.id} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] px-4 py-2.5 text-[13px] text-[var(--text-secondary)]">
                  {fechaCortaLegible(o.fecha)} — hubo oportunidad de observar, sin evidencia todavía.
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </motion.div>
    </AppShell>
  );
}
