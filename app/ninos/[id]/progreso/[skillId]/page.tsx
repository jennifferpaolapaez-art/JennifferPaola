'use client';

// DETALLE DE UNA HABILIDAD (Sesión 6, paso 7 / 6c) — responde "¿por qué RAÍZ dice esto?": estado
// actual, evolución (child_skill_events), observaciones que la respaldan, oportunidades aún no
// observadas (que NO son evidencia ni dificultad), evaluaciones aprobadas y metas del Plan
// Individual. Aquí vive "Revisar habilidad": la maestra ve la evidencia y DECIDE el nuevo estado —
// es el único camino, además de aprobar una evaluación, que cambia `Nino.skills`, y siempre deja un
// evento en el historial. Una observación por sí sola nunca lo cambia.

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, LeafCheck, SkillBadge } from '@/components/app/shell';
import {
  BLOQUE_LABEL,
  SKILLS_CATALOG,
  actividadYPlanPorId,
  agregarEventosSkill,
  describirEstadoSkill,
  evidenciaDeSkill,
  evidenciaNuevaParaRevisar,
  eventosDeSkill,
  guardarNinos,
  leerEventosSkill,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  ninoPorId,
  oportunidadesSinEvidenciaDeSkill,
  pendientesRedaccionDeSkill,
  revisarHabilidad,
  sugeridasSinRevisarDeSkill,
  type EstadosSkill,
  type EventoSkill,
  type Nino,
  type Observacion,
  type ObservacionSkill,
} from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

const OPCIONES_REVISION: { id: string; texto: string; estados: EstadosSkill }[] = [
  { id: 'sin-observar', texto: 'Aún no observado', estados: { estadoDesarrollo: 'desconocido', estadoEvidencia: 'no_observado' } },
  { id: 'desarrollo-poca', texto: 'En desarrollo · con poca evidencia todavía', estados: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'insuficiente' } },
  { id: 'desarrollo-suficiente', texto: 'En desarrollo · con evidencia suficiente', estados: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'suficiente' } },
  { id: 'contradictoria', texto: 'La evidencia es contradictoria — necesito observar más', estados: { estadoDesarrollo: 'en_desarrollo', estadoEvidencia: 'contradictoria' } },
  { id: 'dominado', texto: 'Dominado', estados: { estadoDesarrollo: 'dominado', estadoEvidencia: 'suficiente' } },
];

const FUENTE_EVENTO_LABEL: Record<string, string> = { evaluacion: 'Evaluación aprobada', revision_maestra: 'Revisión de la maestra' };
const ESTADO_META_LABEL: Record<string, string> = { por_trabajar: 'Por trabajar', en_progreso: 'En progreso', casi: 'Casi lograda', alcanzado: 'Cumplida' };
const FECHA_LARGA = new Intl.DateTimeFormat('es', { day: 'numeric', month: 'short', year: 'numeric' });

function formatearFecha(iso: string): string {
  return FECHA_LARGA.format(new Date(`${iso}T12:00:00`));
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{children}</h2>;
}

function coinciden(a: EstadosSkill | undefined, b: EstadosSkill): boolean {
  return !!a && a.estadoDesarrollo === b.estadoDesarrollo && a.estadoEvidencia === b.estadoEvidencia;
}

function DetalleHabilidadContenido() {
  const params = useParams<{ id: string; skillId: string }>();
  const busqueda = useSearchParams();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [eventos, setEventos] = useState<EventoSkill[]>([]);
  const [cargado, setCargado] = useState(false);
  const [revisando, setRevisando] = useState(false);
  const [opcionElegida, setOpcionElegida] = useState<string | null>(null);
  const [nota, setNota] = useState('');
  const [confirmado, setConfirmado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setEventos(leerEventosSkill());
    setRevisando(busqueda.get('revisar') === '1');
    setCargado(true);
  }, [busqueda]);

  if (!cargado) return null;
  const nino = ninoPorId(params.id, ninos);
  const catalogo = SKILLS_CATALOG.find((c) => c.id === params.skillId);
  const skill = nino?.skills.find((s) => s.id === params.skillId);

  if (!nino || (!skill && !catalogo)) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta habilidad</h1>
          <Link href={nino ? `/ninos/${nino.id}/progreso` : '/ninos'} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver al progreso
          </Link>
        </div>
      </AppShell>
    );
  }

  const nombreSkill = skill?.nombre ?? catalogo?.nombre ?? params.skillId;
  const estadosActuales: EstadosSkill | undefined = skill ? { estadoDesarrollo: skill.estadoDesarrollo, estadoEvidencia: skill.estadoEvidencia } : undefined;
  const historial = eventosDeSkill(nino.id, params.skillId, eventos);
  const evidencia = evidenciaDeSkill(nino.id, params.skillId, observaciones, relaciones);
  const pendientes = pendientesRedaccionDeSkill(nino.id, params.skillId, observaciones, relaciones);
  // Línea de tiempo: cambios de estado aprobados + notas pendientes de redacción (visibles para no
  // perderse, pero distintas: no son un cambio de estado ni cuentan como evidencia todavía).
  const linea = [
    ...historial.map((e) => ({ tipo: 'evento' as const, fecha: e.fecha, evento: e })),
    ...pendientes.map((p) => ({ tipo: 'pendiente' as const, fecha: p.observacion.fecha, observacion: p.observacion })),
  ].sort((a, b) => a.fecha.localeCompare(b.fecha));
  const ultimoEventoId = historial.slice(-1)[0]?.id;
  const nuevas = evidenciaNuevaParaRevisar(nino.id, { id: params.skillId, actualizado: skill?.actualizado }, observaciones, relaciones, eventos);
  const idsNuevas = new Set(nuevas.map((n) => n.observacion.id));
  const oportunidades = oportunidadesSinEvidenciaDeSkill(nino.id, params.skillId, observaciones);
  const sugeridas = sugeridasSinRevisarDeSkill(nino.id, params.skillId, observaciones, relaciones);
  const evaluacionesConSkill = nino.evaluaciones
    .filter((e) => e.estado === 'aprobada')
    .map((e) => ({ evaluacion: e, resultado: e.resultados.find((r) => r.skillId === params.skillId) }))
    .filter((x) => x.resultado)
    .sort((a, b) => a.evaluacion.fecha.localeCompare(b.evaluacion.fecha));
  const metas = (nino.planIndividual?.metas ?? []).filter((m) => m.skillId === params.skillId);

  const opcionActualId = OPCIONES_REVISION.find((o) => coinciden(estadosActuales, o.estados))?.id ?? null;
  const seleccion = OPCIONES_REVISION.find((o) => o.id === opcionElegida);
  const hayCambio = !!seleccion && !coinciden(estadosActuales, seleccion.estados);

  function confirmarRevision() {
    if (!nino || !seleccion) return;
    const { nino: actualizado, evento } = revisarHabilidad(nino, params.skillId, seleccion.estados, {
      observacionIds: evidencia.map((e) => e.observacion.id),
      nota,
    });
    guardarNinos(ninos.map((n) => (n.id === nino.id ? actualizado : n)));
    setNinos(ninos.map((n) => (n.id === nino.id ? actualizado : n)));
    setEventos(agregarEventosSkill([evento]));
    setRevisando(false);
    setOpcionElegida(null);
    setNota('');
    setConfirmado(true);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <Link
            href={`/ninos/${nino.id}/progreso`}
            aria-label="Volver al progreso"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
            {nino.nombre}
            {catalogo ? ` · ${catalogo.dominio.replace(/_/g, ' ')}` : ''}
          </p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">{nombreSkill}</h1>
          <div className="mt-2 flex items-center gap-2">
            {skill ? <SkillBadge estadoDesarrollo={skill.estadoDesarrollo} estadoEvidencia={skill.estadoEvidencia} /> : <span className="text-[13px] text-[var(--text-tertiary)]">Todavía sin estado registrado</span>}
            {skill && <span className="text-[12px] text-[var(--text-tertiary)]">desde {formatearFecha(skill.actualizado)}</span>}
          </div>
        </motion.header>

        {confirmado && (
          <motion.p variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] p-4 text-[14px] font-medium text-[var(--text-primary)]">
            Habilidad actualizada — el cambio quedó en el historial.
          </motion.p>
        )}

        {nuevas.length > 0 && !revisando && (
          <motion.section variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_14%,transparent)] p-4">
            <p className="text-[14px] font-semibold text-[var(--text-primary)]">Hay nueva evidencia para revisar esta habilidad</p>
            <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
              {nuevas.length} {nuevas.length === 1 ? 'observación aceptada' : 'observaciones aceptadas'} desde el último cambio. El estado no cambia solo.
            </p>
            <button type="button" onClick={() => setRevisando(true)} className="mt-2 text-[13px] font-semibold text-[var(--accent)] underline">
              Revisar habilidad
            </button>
          </motion.section>
        )}

        {revisando ? (
          <motion.section variants={item} className="mb-6 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-2)]">
            <h2 className="text-[18px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">Revisar habilidad</h2>
            <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
              Mira la evidencia de abajo y elige cómo describirías esta habilidad ahora. RAÍZ no cambia nada hasta que confirmes.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {OPCIONES_REVISION.map((o) => {
                const activa = (opcionElegida ?? opcionActualId) === o.id;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      aria-pressed={activa}
                      onClick={() => setOpcionElegida(o.id)}
                      className={`flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-button)] px-3 py-2 text-left text-[14px] transition-colors ${
                        activa ? 'bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] font-semibold text-[var(--text-primary)]' : 'bg-[var(--surface-2)] text-[var(--text-primary)]'
                      }`}
                    >
                      <span
                        className="flex size-4 shrink-0 items-center justify-center rounded-full"
                        style={{ border: activa ? '5px solid var(--accent)' : '2px solid var(--text-tertiary)' }}
                        aria-hidden="true"
                      />
                      <span>
                        {o.texto}
                        {o.id === opcionActualId && <span className="ml-1.5 text-[11px] font-semibold text-[var(--text-tertiary)]">· actual</span>}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <label htmlFor="nota-revision" className="mt-4 block text-[12px] font-medium text-[var(--text-tertiary)]">
              Nota (opcional)
            </label>
            <textarea
              id="nota-revision"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={2}
              placeholder="Ej: lo vi también en el patio esta semana."
              className="mt-1 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
            <div className="mt-4 flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                disabled={!hayCambio}
                onClick={confirmarRevision}
                className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] disabled:opacity-50"
              >
                <LeafCheck size={16} />
                Confirmar cambio
              </motion.button>
              <button type="button" onClick={() => setRevisando(false)} className="text-center text-[13px] font-semibold text-[var(--text-secondary)] underline">
                Mantener como está
              </button>
            </div>
          </motion.section>
        ) : (
          !confirmado &&
          nuevas.length === 0 && (
            <motion.div variants={item} className="mb-5">
              <button type="button" onClick={() => setRevisando(true)} className="text-[13px] font-semibold text-[var(--accent)] underline">
                Revisar habilidad
              </button>
            </motion.div>
          )
        )}

        <motion.section variants={item} className="mb-6">
          <Etiqueta>Cómo ha evolucionado</Etiqueta>
          {linea.length === 0 ? (
            <p className="mt-2 text-[14px] leading-snug text-[var(--text-secondary)]">
              {skill ? `Sin cambios registrados todavía. Estado actual desde ${formatearFecha(skill.actualizado)}.` : 'Todavía no hay un estado registrado para esta habilidad.'}
            </p>
          ) : (
            <ol className="mt-3 flex flex-col">
              {linea.map((entrada, i) => {
                const hayMas = i < linea.length - 1;
                if (entrada.tipo === 'pendiente') {
                  return (
                    <li key={`pend-${entrada.observacion.id}`} className="relative flex gap-3 pb-4 last:pb-0">
                      {hayMas && <span className="absolute left-[5px] top-4 h-full w-px bg-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)]" aria-hidden="true" />}
                      <span className="relative mt-1 size-[11px] shrink-0 rounded-full border-2 border-dashed border-[var(--butter)] bg-transparent" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-[var(--butter)]">Nota pendiente de redacción profesional</p>
                        <p className="text-[12px] text-[var(--text-secondary)]">
                          {formatearFecha(entrada.fecha)} · no cuenta todavía como evidencia ·{' '}
                          <Link href={`/observaciones/${entrada.observacion.id}`} className="font-semibold text-[var(--accent)] underline">
                            Ver nota
                          </Link>
                        </p>
                      </div>
                    </li>
                  );
                }
                const e = entrada.evento;
                const esActual = e.id === ultimoEventoId;
                return (
                  <li key={e.id} className="relative flex gap-3 pb-4 last:pb-0">
                    {hayMas && <span className="absolute left-[5px] top-4 h-full w-px bg-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)]" aria-hidden="true" />}
                    <span
                      className="relative mt-1 size-[11px] shrink-0 rounded-full"
                      style={{ background: esActual ? 'var(--accent)' : 'var(--text-tertiary)' }}
                      aria-hidden="true"
                    />
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                        {describirEstadoSkill(e.nuevo)}
                        {esActual && <span className="ml-1.5 text-[11px] font-semibold text-[var(--accent)]">· actual</span>}
                      </p>
                      <p className="text-[12px] text-[var(--text-secondary)]">
                        {formatearFecha(e.fecha)} · {FUENTE_EVENTO_LABEL[e.fuente]}
                        {e.nota ? ` · ${e.nota}` : ''}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </motion.section>

        <motion.section variants={item} className="mb-6">
          <Etiqueta>Observaciones que lo respaldan</Etiqueta>
          {evidencia.length === 0 ? (
            <p className="mt-2 text-[14px] leading-snug text-[var(--text-secondary)]">Todavía no hay observaciones aceptadas para esta habilidad.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-2">
              {evidencia.map(({ observacion: o }) => (
                <li key={o.id}>
                  <Link href={`/observaciones/${o.id}`} className="block rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      {formatearFecha(o.fecha)}
                      {idsNuevas.has(o.id) && <span className="ml-1.5 font-semibold text-[var(--butter)]">· nueva</span>}
                    </p>
                    <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{o.redaccionProfesional ?? o.notaOriginal}</p>
                    {o.actividadId && (() => {
                      const ctx = actividadYPlanPorId(o.actividadId);
                      return ctx ? (
                        <p className="mt-1 text-[12px] text-[var(--text-secondary)]">
                          {BLOQUE_LABEL[ctx.actividad.bloque]} · {ctx.actividad.titulo}
                        </p>
                      ) : null;
                    })()}
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {pendientes.length > 0 && (
            <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
              Hay {pendientes.length} {pendientes.length === 1 ? 'nota' : 'notas'} con esta habilidad aceptada pero pendiente{pendientes.length === 1 ? '' : 's'} de redacción profesional — aparece{pendientes.length === 1 ? '' : 'n'} en la línea de tiempo y cuenta{pendientes.length === 1 ? '' : 'n'} como evidencia cuando apruebes la redacción.
            </p>
          )}
          {sugeridas > 0 && (
            <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
              Hay {sugeridas} {sugeridas === 1 ? 'observación' : 'observaciones'} con esta habilidad sugerida y sin revisar — no cuentan como evidencia hasta que las aceptes.
            </p>
          )}
        </motion.section>

        {oportunidades.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <Etiqueta>Oportunidades aún no observadas</Etiqueta>
            <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Hubo la oportunidad de observarla, pero no se vio. No cuenta como evidencia ni como dificultad.</p>
            <ul className="mt-2 flex flex-col gap-2">
              {oportunidades.map((o) => (
                <li key={o.id}>
                  <Link href={`/observaciones/${o.id}`} className="block rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3 text-[13px] text-[var(--text-secondary)]">
                    {formatearFecha(o.fecha)} · no observado
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {evaluacionesConSkill.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <Etiqueta>Evaluaciones</Etiqueta>
            <ul className="mt-2 flex flex-col gap-2">
              {evaluacionesConSkill.map(({ evaluacion: e, resultado: r }) => (
                <li key={e.id}>
                  <Link href={`/ninos/${nino.id}/evaluacion/${e.id}`} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                    <div>
                      <p className="text-[14px] font-medium text-[var(--text-primary)]">{e.tipo === 'ingreso' ? 'Evaluación de ingreso' : 'Evaluación periódica'}</p>
                      <p className="text-[12px] text-[var(--text-secondary)]">{formatearFecha(e.fecha)}</p>
                    </div>
                    {r && <SkillBadge estadoDesarrollo={r.estadoDesarrollo} estadoEvidencia={r.estadoEvidencia} />}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {metas.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <Etiqueta>Plan Individual</Etiqueta>
            <ul className="mt-2 flex flex-col gap-2">
              {metas.map((m) => (
                <li key={m.id}>
                  <Link href={`/ninos/${nino.id}/plan-individual`} className="block rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{m.descripcion}</p>
                    <p className="mt-0.5 text-[12px] font-semibold text-[var(--accent)]">{ESTADO_META_LABEL[m.estado]}</p>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </motion.div>
    </AppShell>
  );
}

export default function DetalleHabilidad() {
  return (
    <Suspense fallback={null}>
      <DetalleHabilidadContenido />
    </Suspense>
  );
}
