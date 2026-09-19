'use client';

// PLAN INDIVIDUAL — opcional, vive dentro del perfil del niño (Sesión 6, paso 4; ciclo de vida en
// 6d). Ni una necesidad, ni una evaluación, ni una prioridad lo crean solas: lo decide la maestra.
// Cada meta pasa por Por trabajar → En progreso → Casi lograda → Cumplida (o Cerrada / no
// continuar); RAÍZ NUNCA mueve el estado — solo avisa "esta meta tiene nueva evidencia" y la
// maestra revisa y confirma. Cada cambio queda en el historial de la meta. Cumplida y Cerrada no se
// borran: quedan como logro/historia y dejan de personalizar Planeación. Un plan nuevo no
// sobrescribe el anterior: el anterior queda archivado con su periodo.

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import {
  ESTADO_META_LABEL,
  evidenciaDeSkill,
  guardarNinos,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  metaEstaActiva,
  ninoPorId,
  planActivoDeNino,
  planesDeNino,
  type EstadoMetaIndividual,
  type MetaIndividual,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type PlanIndividual,
} from '@/lib/seed-data';
import {
  agregarMetaAlPlanActivo,
  archivarPlanYEmpezarNuevo,
  cambiarEstadoMeta,
  crearMetaManual,
  crearPlanVacio,
  evidenciaNuevaParaMeta,
  fechaCorta,
  mantenerMetaComoEsta,
  periodoTexto,
} from '@/lib/prioridades';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const ESTADOS_ORDEN: EstadoMetaIndividual[] = ['por_trabajar', 'en_progreso', 'casi', 'alcanzado', 'cerrada'];
const CAMPO =
  'w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

function tonoEstado(estado: EstadoMetaIndividual): string {
  if (estado === 'alcanzado') return 'text-[var(--sage)]';
  if (estado === 'cerrada') return 'text-[var(--text-secondary)]';
  return 'text-[var(--accent)]';
}

function HistorialMeta({ meta }: { meta: MetaIndividual }) {
  const entradas = meta.historial ?? [];
  if (entradas.length === 0) return <p className="text-[12px] text-[var(--text-tertiary)]">Sin cambios registrados todavía.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {entradas.map((h, i) => (
        <li key={`${h.fecha}-${i}`} className="border-l-2 border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] pl-3">
          <p className="text-[12px] font-semibold text-[var(--text-tertiary)]">{fechaCorta(h.fecha)}</p>
          <p className="text-[13px] font-medium text-[var(--text-primary)]">
            {h.de && h.de === h.a ? `Revisada — se deja como “${ESTADO_META_LABEL[h.a]}”` : h.de ? `${ESTADO_META_LABEL[h.de]} → ${ESTADO_META_LABEL[h.a]}` : ESTADO_META_LABEL[h.a]}
          </p>
          {h.nota && <p className="text-[12px] leading-snug text-[var(--text-secondary)]">{h.nota}</p>}
          {h.observacionIds && h.observacionIds.length > 0 && (
            <p className="mt-0.5 flex flex-wrap gap-x-3">
              {h.observacionIds.slice(0, 3).map((id, n) => (
                <Link key={id} href={`/observaciones/${id}`} className="text-[12px] font-semibold text-[var(--accent)] underline">
                  Ver observación{h.observacionIds!.length > 1 ? ` (${n + 1})` : ''}
                </Link>
              ))}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function TarjetaMeta({
  nino,
  plan,
  meta,
  observaciones,
  relaciones,
  abiertaInicial,
  soloLectura,
  onCambio,
}: {
  nino: Nino;
  plan: PlanIndividual;
  meta: MetaIndividual;
  observaciones: Observacion[];
  relaciones: ObservacionSkill[];
  abiertaInicial: boolean;
  soloLectura: boolean;
  onCambio: (n: Nino) => void;
}) {
  const [revisando, setRevisando] = useState(abiertaInicial);
  const [verHistorial, setVerHistorial] = useState(false);
  const [elegido, setElegido] = useState<EstadoMetaIndividual>(meta.estado);
  const [nota, setNota] = useState('');
  const [motivo, setMotivo] = useState('');
  const nuevas = evidenciaNuevaParaMeta(nino, meta, observaciones, relaciones);
  const evidenciaVigente = meta.skillId ? evidenciaDeSkill(nino.id, meta.skillId, observaciones, relaciones) : [];
  const idsVigentes = evidenciaVigente.map((e) => e.observacion.id);
  const cambia = elegido !== meta.estado;
  const puedeConfirmar = cambia && (elegido !== 'cerrada' || motivo.trim().length > 0);

  function confirmar() {
    onCambio(cambiarEstadoMeta(nino, plan.id, meta.id, elegido, { nota, observacionIds: idsVigentes, motivoCierre: motivo }));
    setRevisando(false);
    setNota('');
    setMotivo('');
  }

  function dejarComoEsta() {
    onCambio(mantenerMetaComoEsta(nino, plan.id, meta.id, idsVigentes, nota));
    setRevisando(false);
    setNota('');
  }

  return (
    <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
      <p className="text-[14px] font-medium text-[var(--text-primary)]">{meta.descripcion}</p>
      <p className={`mt-1 text-[12px] font-semibold ${tonoEstado(meta.estado)}`}>
        {ESTADO_META_LABEL[meta.estado]}
        {meta.fechaCumplimiento ? ` — ${fechaCorta(meta.fechaCumplimiento)}` : meta.fechaCierre ? ` — ${fechaCorta(meta.fechaCierre)}` : ''}
      </p>
      {meta.motivoCierre && <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">Motivo: {meta.motivoCierre}</p>}
      {meta.estrategias && <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">Estrategia: {meta.estrategias}</p>}
      {meta.siguientePaso && metaEstaActiva(meta) && <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">Siguiente paso: {meta.siguientePaso}</p>}
      {meta.fechaRevision && metaEstaActiva(meta) && <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Revisión prevista: {fechaCorta(meta.fechaRevision)}</p>}
      {meta.origen === 'raiz_sugerido_aprobado' && <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Sugerida por RAÍZ y aprobada por ti.</p>}

      {nuevas.length > 0 && !revisando && !soloLectura && (
        <div className="mt-3 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--butter)_14%,transparent)] p-3">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Esta meta tiene nueva evidencia. ¿Quieres revisar su estado?</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">
            {nuevas.length} {nuevas.length === 1 ? 'observación aprobada nueva' : 'observaciones aprobadas nuevas'}. El estado no cambia solo.
          </p>
          <button type="button" onClick={() => setRevisando(true)} className="mt-1 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
            Revisar meta
          </button>
        </div>
      )}

      {revisando && !soloLectura ? (
        <div className="mt-3 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
          <p className="text-[14px] font-semibold text-[var(--text-primary)]">Revisar meta</p>
          {evidenciaVigente.length > 0 && (
            <ul className="mt-2 flex flex-col gap-1.5">
              {evidenciaVigente.slice(0, 3).map((e) => (
                <li key={e.observacion.id} className="text-[12px] leading-snug text-[var(--text-secondary)]">
                  <span className="font-semibold text-[var(--text-tertiary)]">{fechaCorta(e.observacion.fecha)} · </span>
                  {e.observacion.redaccionProfesional}{' '}
                  <Link href={`/observaciones/${e.observacion.id}`} className="font-semibold text-[var(--accent)] underline">
                    Ver observación
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-[12px] font-semibold text-[var(--text-tertiary)]">¿Cómo la describirías ahora?</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {ESTADOS_ORDEN.map((e) => (
              <Chip key={e} label={ESTADO_META_LABEL[e]} activo={elegido === e} onClick={() => setElegido(e)} />
            ))}
          </div>
          {elegido === 'cerrada' && (
            <div className="mt-3">
              <label htmlFor={`motivo-${meta.id}`} className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">
                Motivo del cierre (obligatorio)
              </label>
              <input id={`motivo-${meta.id}`} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: ya no es relevante para él por ahora" className={`${CAMPO} min-h-11`} />
            </div>
          )}
          <label htmlFor={`nota-${meta.id}`} className="mb-1 mt-3 block text-[12px] font-medium text-[var(--text-tertiary)]">
            Nota para el historial (opcional)
          </label>
          <textarea id={`nota-${meta.id}`} value={nota} onChange={(e) => setNota(e.target.value)} rows={2} className={`${CAMPO} resize-none`} />
          <div className="mt-3 flex flex-col gap-2">
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={confirmar}
              disabled={!puedeConfirmar}
              className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[14px] font-semibold text-[var(--bg)] disabled:opacity-40"
            >
              Confirmar cambio
            </motion.button>
            <button type="button" onClick={dejarComoEsta} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[14px] font-semibold text-[var(--text-primary)]">
              Dejar como está
            </button>
            <button type="button" onClick={() => setRevisando(false)} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        !soloLectura && (
          <button type="button" onClick={() => { setRevisando(true); setElegido(meta.estado); }} className="mt-2 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
            Cambiar estado
          </button>
        )
      )}

      <div className="mt-1">
        <button type="button" onClick={() => setVerHistorial((v) => !v)} aria-expanded={verHistorial} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
          Historial de la meta ({(meta.historial ?? []).length})
        </button>
        {verHistorial && (
          <div className="mt-1">
            <HistorialMeta meta={meta} />
          </div>
        )}
      </div>
    </li>
  );
}

function PlanContenido() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const busqueda = useSearchParams();
  const revisarId = busqueda.get('revisar');
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [cargado, setCargado] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [nuevaMeta, setNuevaMeta] = useState('');
  const [archivando, setArchivando] = useState(false);
  const [motivoNuevo, setMotivoNuevo] = useState('');
  const [continuar, setContinuar] = useState<string[]>([]);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setCargado(true);
  }, []);

  const nino = ninoPorId(params.id, ninos);

  function guardarCambioNino(ninoActualizado: Nino) {
    const actualizados = ninos.map((n) => (n.id === ninoActualizado.id ? ninoActualizado : n));
    setNinos(actualizados);
    guardarNinos(actualizados);
  }

  if (!cargado || !nino) return null;

  const activo = planActivoDeNino(nino);
  const anteriores = planesDeNino(nino).filter((p) => p.id !== activo?.id);

  function agregarMeta() {
    if (!nino || !nuevaMeta.trim()) return;
    guardarCambioNino(agregarMetaAlPlanActivo(nino, crearMetaManual(nuevaMeta)));
    setNuevaMeta('');
  }

  function abrirArchivar() {
    setContinuar((activo?.metas ?? []).filter(metaEstaActiva).map((m) => m.id));
    setArchivando(true);
  }

  function confirmarArchivar() {
    if (!nino) return;
    guardarCambioNino(archivarPlanYEmpezarNuevo(nino, { motivo: motivoNuevo, continuarMetaIds: continuar }));
    setArchivando(false);
    setMotivoNuevo('');
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push(`/ninos/${nino.id}`)}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{nino.nombre}</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Plan Individual</h1>
        </motion.header>

        {!activo ? (
          <motion.div variants={item} className="mb-8">
            <p className="mb-3 text-[14px] leading-snug text-[var(--text-secondary)]">
              Tener una necesidad, una adaptación o una evaluación no crea un Plan Individual automáticamente — esta es tu decisión.
            </p>
            <label htmlFor="motivo-plan" className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">
              Motivo (opcional)
            </label>
            <textarea id="motivo-plan" value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} placeholder="¿Por qué crear este plan ahora?" className={`mb-4 ${CAMPO} resize-none`} />
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => guardarCambioNino(crearPlanVacio(nino, motivo))}
              className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
            >
              Crear Plan Individual
            </motion.button>
            <Link href={`/ninos/${nino.id}/progreso`} className="mt-3 flex min-h-11 items-center justify-center text-[14px] font-semibold text-[var(--accent)] underline">
              Ver si RAÍZ tiene una sugerencia en Progreso
            </Link>
          </motion.div>
        ) : (
          <motion.div variants={item} className="mb-8">
            <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Plan activo · {periodoTexto(activo)}</p>
            {activo.motivo && <p className="mt-1 mb-3 text-[14px] leading-snug text-[var(--text-secondary)]">{activo.motivo}</p>}

            <p className="mb-2 mt-3 text-[14px] font-semibold text-[var(--text-primary)]">Metas</p>
            <ul className="mb-4 flex flex-col gap-3">
              {activo.metas.map((m) => (
                <TarjetaMeta
                  key={m.id}
                  nino={nino}
                  plan={activo}
                  meta={m}
                  observaciones={observaciones}
                  relaciones={relaciones}
                  abiertaInicial={revisarId === m.id}
                  soloLectura={false}
                  onCambio={guardarCambioNino}
                />
              ))}
              {activo.metas.length === 0 && <p className="text-[13px] text-[var(--text-tertiary)]">Sin metas todavía.</p>}
            </ul>

            <div className="flex gap-2">
              <input
                id="nueva-meta"
                value={nuevaMeta}
                onChange={(e) => setNuevaMeta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarMeta())}
                placeholder="Nueva meta"
                aria-label="Nueva meta"
                className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={agregarMeta}
                disabled={!nuevaMeta.trim()}
                aria-label="Agregar meta"
                className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[var(--text-primary)] disabled:opacity-40"
              >
                <Plus size={18} aria-hidden="true" />
              </button>
            </div>

            {archivando ? (
              <div className="mt-6 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Empezar un nuevo periodo</p>
                <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
                  El plan actual ({periodoTexto(activo)}) se archiva con todas sus metas y su historial. No se borra ni se sobrescribe.
                </p>
                {activo.metas.some(metaEstaActiva) && (
                  <fieldset className="mt-3">
                    <legend className="text-[12px] font-semibold text-[var(--text-tertiary)]">Metas en curso que quieres continuar en el plan nuevo</legend>
                    <ul className="mt-1 flex flex-col gap-1">
                      {activo.metas.filter(metaEstaActiva).map((m) => (
                        <li key={m.id}>
                          <label className="flex min-h-11 items-center gap-2.5 text-[14px] text-[var(--text-primary)]">
                            <input
                              type="checkbox"
                              checked={continuar.includes(m.id)}
                              onChange={(e) => setContinuar((c) => (e.target.checked ? [...c, m.id] : c.filter((x) => x !== m.id)))}
                              className="size-5 accent-[var(--accent)]"
                            />
                            {m.descripcion}
                          </label>
                        </li>
                      ))}
                    </ul>
                  </fieldset>
                )}
                <label htmlFor="motivo-nuevo" className="mb-1 mt-3 block text-[12px] font-medium text-[var(--text-tertiary)]">
                  Motivo o foco del nuevo periodo (opcional)
                </label>
                <input id="motivo-nuevo" value={motivoNuevo} onChange={(e) => setMotivoNuevo(e.target.value)} className={`${CAMPO} min-h-11`} />
                <div className="mt-3 flex flex-col gap-2">
                  <motion.button whileTap={{ scale: 0.97 }} type="button" onClick={confirmarArchivar} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[14px] font-semibold text-[var(--bg)]">
                    Archivar y empezar nuevo plan
                  </motion.button>
                  <button type="button" onClick={() => setArchivando(false)} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={abrirArchivar} className="mt-4 min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
                Cerrar este periodo y empezar un plan nuevo
              </button>
            )}
          </motion.div>
        )}

        {anteriores.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">Planes anteriores</h2>
            <ul className="flex flex-col gap-4">
              {anteriores.map((p) => (
                <li key={p.id}>
                  <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                    {periodoTexto(p)} · {p.estado === 'archivado' ? 'Archivado' : p.estado === 'cerrado' ? 'Cerrado' : 'Pausado'}
                  </p>
                  {p.motivo && <p className="mt-0.5 mb-2 text-[13px] text-[var(--text-secondary)]">{p.motivo}</p>}
                  <ul className="mt-2 flex flex-col gap-3">
                    {p.metas.map((m) => (
                      <TarjetaMeta key={m.id} nino={nino} plan={p} meta={m} observaciones={observaciones} relaciones={relaciones} abiertaInicial={false} soloLectura onCambio={guardarCambioNino} />
                    ))}
                    {p.metas.length === 0 && <p className="text-[13px] text-[var(--text-tertiary)]">Este plan no tuvo metas.</p>}
                  </ul>
                </li>
              ))}
            </ul>
          </motion.section>
        )}
      </motion.div>
    </AppShell>
  );
}

export default function PlanIndividualPage() {
  return (
    <Suspense fallback={null}>
      <PlanContenido />
    </Suspense>
  );
}
