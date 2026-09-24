'use client';

// PLAN INDIVIDUAL — opcional, vive dentro del perfil del niño (Sesión 6, paso 4; ciclo de vida y
// checkpoints mensuales en 6d ampliación). Ni una necesidad, ni una evaluación, ni una prioridad lo
// crean solas: lo decide la maestra. UN plan pertenece al niño durante un periodo y puede tener
// VARIAS áreas, cada una con una o varias metas — nunca "1 plan = 1 área = 1 meta" (regla del
// usuario). Cada meta pasa por Por trabajar → En progreso → Casi lograda → Cumplida (o Cerrada / no
// continuar); RAÍZ NUNCA mueve el estado — solo avisa. El CHECKPOINT mensual (sin evidencia / NY /
// E / A) es evidencia de progreso, SEPARADO del ciclo de vida de la meta — un checkpoint A puede
// sugerir revisar el estado, nunca lo cambia solo. Un plan nuevo no sobrescribe el anterior.

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Plus } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import {
  ESTADO_CHECKPOINT_ABREV,
  ESTADO_CHECKPOINT_LABEL,
  ESTADO_META_LABEL,
  evidenciaDeSkill,
  guardarNinos,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  leerProgramaConfig,
  metaEstaActiva,
  ninoPorId,
  planActivoDeNino,
  planesDeNino,
  type EstadoCheckpoint,
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
import {
  agruparMetasPorArea,
  aplicacionDeMetaEnMes,
  checkpointDeMes,
  confirmarCheckpoint,
  esMesFuturo,
  fechaRevisionPrevistaPorDefecto,
  mesesDelPlan,
  nombreMesCorto,
  nombreMesLargo,
  sugerirCheckpoint,
  sugiereMarcarCumplida,
} from '@/lib/plan-seguimiento';
import { cicloPorId, refrescarRevisionMetas, revisionMetasCompleta } from '@/lib/ciclo-revision';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const ESTADOS_ORDEN: EstadoMetaIndividual[] = ['por_trabajar', 'en_progreso', 'casi', 'alcanzado', 'cerrada'];
const ESTADOS_CHECKPOINT_ORDEN: EstadoCheckpoint[] = ['sin_evidencia', 'aun_no', 'emergente', 'adquirido'];
const CAMPO =
  'w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

function tonoEstado(estado: EstadoMetaIndividual): string {
  if (estado === 'alcanzado') return 'text-[var(--sage)]';
  if (estado === 'cerrada') return 'text-[var(--text-secondary)]';
  return 'text-[var(--accent)]';
}

function tonoCheckpoint(estado: EstadoCheckpoint): string {
  if (estado === 'adquirido') return 'bg-[color-mix(in_oklab,var(--sage)_22%,transparent)] text-[var(--sage)]';
  if (estado === 'emergente') return 'bg-[color-mix(in_oklab,var(--butter)_22%,transparent)] text-[var(--butter)]';
  if (estado === 'aun_no') return 'bg-[var(--surface-2)] text-[var(--text-secondary)]';
  return 'bg-[var(--surface-2)] text-[var(--text-tertiary)]';
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

/** Fila de meses de UNA meta — "No aplica" antes de que existiera o después de Cumplida/Cerrada
 * (precisión del usuario: nunca confundir eso con "quedó sin revisar"), futuro atenuado, y un botón
 * por cada mes que sí aplica para abrir su editor de checkpoint. */
function FilaMeses({
  nino,
  plan,
  meta,
  meses,
  observaciones,
  relaciones,
  soloLectura,
  mesAbierto,
  onAbrirMes,
  onCambio,
}: {
  nino: Nino;
  plan: PlanIndividual;
  meta: MetaIndividual;
  meses: string[];
  observaciones: Observacion[];
  relaciones: ObservacionSkill[];
  soloLectura: boolean;
  mesAbierto: string | null;
  onAbrirMes: (mes: string | null) => void;
  onCambio: (n: Nino) => void;
}) {
  const [elegido, setElegido] = useState<EstadoCheckpoint | null>(null);
  const [verEvidenciaMes, setVerEvidenciaMes] = useState(false);

  const mes = mesAbierto;
  const checkpoint = mes ? checkpointDeMes(meta, mes) : undefined;
  const sugerencia = mes && !checkpoint ? sugerirCheckpoint(nino, meta, mes, observaciones, relaciones) : null;

  function abrir(m: string) {
    onAbrirMes(mesAbierto === m ? null : m);
    setElegido(null);
    setVerEvidenciaMes(false);
  }

  function confirmar(estado: EstadoCheckpoint, sugeridoPorRaiz?: EstadoCheckpoint | null, ids: string[] = []) {
    if (!mes) return;
    onCambio(confirmarCheckpoint(nino, plan.id, meta.id, mes, estado, { sugeridoPorRaiz, observacionIds: ids, nota: undefined }));
    onAbrirMes(null);
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-1.5">
        {meses.map((m) => {
          const aplicacion = aplicacionDeMetaEnMes(meta, m);
          const cp = checkpointDeMes(meta, m);
          const futuro = esMesFuturo(m);
          const etiqueta = aplicacion !== 'aplica' ? '·' : cp ? ESTADO_CHECKPOINT_ABREV[cp.estado] : futuro ? '' : '?';
          const deshabilitado = soloLectura || aplicacion !== 'aplica' || futuro;
          return (
            <button
              key={m}
              type="button"
              disabled={deshabilitado}
              onClick={() => abrir(m)}
              aria-label={`${nombreMesLargo(m)}${aplicacion !== 'aplica' ? ' — no aplica' : cp ? ` — ${ESTADO_CHECKPOINT_LABEL[cp.estado]}` : ' — sin revisar'}`}
              aria-pressed={mesAbierto === m}
              className={`flex min-w-11 flex-col items-center gap-0.5 rounded-[var(--radius-button)] px-2 py-1.5 text-center ${
                aplicacion !== 'aplica' ? 'opacity-40' : futuro ? 'opacity-50' : mesAbierto === m ? 'ring-2 ring-[var(--accent)]' : ''
              } ${cp ? tonoCheckpoint(cp.estado) : 'bg-[var(--surface-2)] text-[var(--text-tertiary)]'}`}
            >
              <span className="text-[10px] font-semibold uppercase tracking-[0.04em]">{nombreMesCorto(m)}</span>
              <span className="text-[13px] font-bold">{etiqueta}</span>
            </button>
          );
        })}
      </div>

      {mes && !soloLectura && (
        <div className="mt-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">{nombreMesLargo(mes)}</p>

          {checkpoint ? (
            <>
              <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                Confirmado: <span className="font-semibold text-[var(--text-primary)]">{ESTADO_CHECKPOINT_LABEL[checkpoint.estado]}</span>
                {checkpoint.sugeridoPorRaiz && checkpoint.sugeridoPorRaiz !== checkpoint.estado && (
                  <span className="text-[12px] text-[var(--text-tertiary)]"> · RAÍZ había sugerido {ESTADO_CHECKPOINT_LABEL[checkpoint.sugeridoPorRaiz]}</span>
                )}
              </p>
              {checkpoint.observacionIds && checkpoint.observacionIds.length > 0 && (
                <button type="button" onClick={() => setVerEvidenciaMes((v) => !v)} className="mt-1 min-h-11 text-[12px] font-semibold text-[var(--accent)] underline">
                  {verEvidenciaMes ? 'Ocultar evidencia' : 'Ver evidencia'}
                </button>
              )}
              {verEvidenciaMes && (
                <ul className="mt-1 flex flex-col gap-1">
                  {checkpoint.observacionIds!.map((id) => (
                    <li key={id}>
                      <Link href={`/observaciones/${id}`} className="text-[12px] font-semibold text-[var(--accent)] underline">
                        Ver observación
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {ESTADOS_CHECKPOINT_ORDEN.map((e) => (
                  <Chip key={e} label={ESTADO_CHECKPOINT_LABEL[e]} activo={(elegido ?? checkpoint.estado) === e} onClick={() => setElegido(e)} />
                ))}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={!elegido || elegido === checkpoint.estado}
                  onClick={() => confirmar(elegido!, checkpoint.sugeridoPorRaiz, checkpoint.observacionIds ?? [])}
                  className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40"
                >
                  Guardar cambio
                </button>
                <button type="button" onClick={() => onAbrirMes(null)} className="min-h-11 text-[12px] font-semibold text-[var(--text-secondary)] underline">
                  Cerrar
                </button>
              </div>
            </>
          ) : sugerencia?.sugerido && sugerencia.sugerido !== 'sin_evidencia' ? (
            <>
              <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
                RAÍZ sugiere: <span className="font-semibold text-[var(--text-primary)]">{ESTADO_CHECKPOINT_LABEL[sugerencia.sugerido]}</span>
              </p>
              <p className="text-[12px] text-[var(--text-tertiary)]">
                Basado en {sugerencia.observacionIds.length} {sugerencia.observacionIds.length === 1 ? 'observación' : 'observaciones'} aprobadas de este mes.
              </p>
              <div className="mt-2 flex flex-col gap-2">
                <button type="button" onClick={() => confirmar(sugerencia.sugerido!, sugerencia.sugerido, sugerencia.observacionIds)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)]">
                  Confirmar {ESTADO_CHECKPOINT_LABEL[sugerencia.sugerido]}
                </button>
                {!elegido ? (
                  <button type="button" onClick={() => setElegido(sugerencia.sugerido)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
                    Cambiar estado
                  </button>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {ESTADOS_CHECKPOINT_ORDEN.map((e) => (
                        <Chip key={e} label={ESTADO_CHECKPOINT_LABEL[e]} activo={elegido === e} onClick={() => setElegido(e)} />
                      ))}
                    </div>
                    <button type="button" onClick={() => confirmar(elegido, sugerencia.sugerido, sugerencia.observacionIds)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)]">
                      Guardar {ESTADO_CHECKPOINT_LABEL[elegido]}
                    </button>
                  </>
                )}
                <button type="button" onClick={() => onAbrirMes(null)} className="min-h-11 text-[12px] font-semibold text-[var(--text-secondary)] underline">
                  Mantener sin revisar
                </button>
              </div>
            </>
          ) : sugerencia && sugerencia.observacionIds.length > 0 ? (
            <>
              <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
                Hay {sugerencia.observacionIds.length} {sugerencia.observacionIds.length === 1 ? 'observación aprobada' : 'observaciones aprobadas'} este mes. ¿Cómo la describirías?
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {ESTADOS_CHECKPOINT_ORDEN.map((e) => (
                  <Chip key={e} label={ESTADO_CHECKPOINT_LABEL[e]} activo={elegido === e} onClick={() => setElegido(e)} />
                ))}
              </div>
              <div className="mt-2 flex flex-col gap-2">
                <button type="button" disabled={!elegido} onClick={() => confirmar(elegido!, null, sugerencia.observacionIds)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40">
                  Guardar
                </button>
                <div className="flex flex-wrap gap-x-3">
                  {sugerencia.observacionIds.map((id) => (
                    <Link key={id} href={`/observaciones/${id}`} className="text-[12px] font-semibold text-[var(--accent)] underline">
                      Ver observación
                    </Link>
                  ))}
                </div>
                <button type="button" onClick={() => onAbrirMes(null)} className="min-h-11 text-[12px] font-semibold text-[var(--text-secondary)] underline">
                  Mantener sin revisar
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">No hay evidencia aprobada de este mes todavía.</p>
              <div className="mt-2 flex flex-col gap-2">
                <button type="button" onClick={() => confirmar('sin_evidencia', 'sin_evidencia', [])} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
                  Marcar sin evidencia
                </button>
                {meta.skillId && (
                  <Link href={`/observar?ninoId=${nino.id}&skillId=${meta.skillId}`} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 py-2.5 text-center text-[13px] font-semibold text-[var(--accent)]">
                    Ver oportunidades de observación
                  </Link>
                )}
                <button type="button" onClick={() => onAbrirMes(null)} className="min-h-11 text-[12px] font-semibold text-[var(--text-secondary)] underline">
                  Cerrar
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TarjetaMeta({
  nino,
  plan,
  meta,
  meses,
  observaciones,
  relaciones,
  abiertaInicial,
  soloLectura,
  cicloId,
  onCambio,
}: {
  nino: Nino;
  plan: PlanIndividual;
  meta: MetaIndividual;
  meses: string[];
  observaciones: Observacion[];
  relaciones: ObservacionSkill[];
  abiertaInicial: boolean;
  soloLectura: boolean;
  cicloId?: string;
  onCambio: (n: Nino) => void;
}) {
  const [revisando, setRevisando] = useState(abiertaInicial);
  const [verHistorial, setVerHistorial] = useState(false);
  const [mesAbierto, setMesAbierto] = useState<string | null>(null);
  const [elegido, setElegido] = useState<EstadoMetaIndividual>(meta.estado);
  const [nota, setNota] = useState('');
  const [motivo, setMotivo] = useState('');
  const nuevas = evidenciaNuevaParaMeta(nino, meta, observaciones, relaciones);
  const evidenciaVigente = meta.skillId ? evidenciaDeSkill(nino.id, meta.skillId, observaciones, relaciones) : [];
  const idsVigentes = evidenciaVigente.map((e) => e.observacion.id);
  const cambia = elegido !== meta.estado;
  const puedeConfirmar = cambia && (elegido !== 'cerrada' || motivo.trim().length > 0);
  const sugiereCumplida = sugiereMarcarCumplida(meta);

  function confirmar() {
    onCambio(cambiarEstadoMeta(nino, plan.id, meta.id, elegido, { nota, observacionIds: idsVigentes, motivoCierre: motivo, cicloRevisionId: cicloId }));
    setRevisando(false);
    setNota('');
    setMotivo('');
  }

  function dejarComoEsta() {
    onCambio(mantenerMetaComoEsta(nino, plan.id, meta.id, idsVigentes, nota, cicloId));
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
      {meta.puntoActualInicial && <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">Punto de partida: {meta.puntoActualInicial}</p>}
      {meta.estrategias && <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">Estrategia: {meta.estrategias}</p>}
      {meta.siguientePaso && metaEstaActiva(meta) && <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">Siguiente paso: {meta.siguientePaso}</p>}
      {meta.origen === 'raiz_sugerido_aprobado' && <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Sugerida por RAÍZ y aprobada por ti.</p>}

      {meses.length > 0 && (
        <FilaMeses
          nino={nino}
          plan={plan}
          meta={meta}
          meses={meses}
          observaciones={observaciones}
          relaciones={relaciones}
          soloLectura={soloLectura}
          mesAbierto={mesAbierto}
          onAbrirMes={setMesAbierto}
          onCambio={onCambio}
        />
      )}

      {sugiereCumplida && !soloLectura && !revisando && (
        <div className="mt-3 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--sage)_14%,transparent)] p-3">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">Esta meta muestra evidencia consistente de adquisición. ¿Quieres marcarla como Cumplida?</p>
          <button
            type="button"
            onClick={() => {
              setRevisando(true);
              setElegido('alcanzado');
            }}
            className="mt-1 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline"
          >
            Revisar y marcar Cumplida
          </button>
        </div>
      )}

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
  const cicloId = busqueda.get('ciclo') ?? undefined;
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [cargado, setCargado] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [nuevaMeta, setNuevaMeta] = useState('');
  const [archivando, setArchivando] = useState(false);
  const [motivoNuevo, setMotivoNuevo] = useState('');
  const [continuar, setContinuar] = useState<string[]>([]);
  const [editandoRevision, setEditandoRevision] = useState(false);
  const [fechaRevisionEditada, setFechaRevisionEditada] = useState('');

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
    // El cache de "revisión completa" del ciclo se recalcula del historial real de las metas cada
    // vez que algo cambia — nunca se guarda como un simple toggle aparte (6f corrección 2).
    if (cicloId) {
      const ciclo = cicloPorId(cicloId);
      if (ciclo) refrescarRevisionMetas(ciclo, ninoActualizado);
    }
  }

  function terminarRevisionDeMetas() {
    router.push(`/ninos/${params.id}/revision-periodica?ciclo=${cicloId}`);
  }

  if (!cargado || !nino) return null;

  const activo = planActivoDeNino(nino);
  const anteriores = planesDeNino(nino).filter((p) => p.id !== activo?.id);
  const meses = activo ? mesesDelPlan(activo) : [];
  const areas = activo ? agruparMetasPorArea(activo.metas) : [];

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

  function guardarFechaRevision() {
    if (!nino || !activo || !fechaRevisionEditada) return;
    guardarCambioNino({
      ...nino,
      planesIndividuales: (nino.planesIndividuales ?? []).map((p) => (p.id === activo.id ? { ...p, fechaRevisionPrevista: fechaRevisionEditada } : p)),
    });
    setEditandoRevision(false);
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
            {activo.motivo && <p className="mt-1 mb-1 text-[14px] leading-snug text-[var(--text-secondary)]">{activo.motivo}</p>}

            {editandoRevision ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input type="date" value={fechaRevisionEditada} onChange={(e) => setFechaRevisionEditada(e.target.value)} aria-label="Fecha de revisión prevista" className={`${CAMPO} min-h-11 w-auto`} />
                <button type="button" onClick={guardarFechaRevision} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)]">
                  Guardar
                </button>
                <button type="button" onClick={() => setEditandoRevision(false)} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setFechaRevisionEditada(activo.fechaRevisionPrevista ?? '');
                  setEditandoRevision(true);
                }}
                className="mt-1 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline"
              >
                {activo.fechaRevisionPrevista ? `Revisión prevista: ${fechaCorta(activo.fechaRevisionPrevista)}` : 'Poner fecha de revisión prevista'}
              </button>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <Link href={`/ninos/${nino.id}/plan-individual/revision`} className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--accent)]">
                Revisión mensual del Plan
              </Link>
            </div>

            {cicloId && (
              <div className="mt-4 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] p-4">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">Revisión periódica en curso</p>
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-secondary)]">
                  {revisionMetasCompleta(nino, cicloId) ? 'Ya revisaste todas las metas activas de este ciclo.' : 'Revisa cada meta activa antes de continuar — puedes dejarla como está si no hay cambios.'}
                </p>
                <button type="button" onClick={terminarRevisionDeMetas} className="mt-2 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
                  {revisionMetasCompleta(nino, cicloId) ? 'Continuar con la revisión periódica' : 'Volver a la revisión periódica'}
                </button>
              </div>
            )}

            {areas.length === 0 ? (
              <p className="mt-4 text-[13px] text-[var(--text-tertiary)]">Sin metas todavía.</p>
            ) : (
              areas.map((a) => (
                <section key={a.areaId} className="mt-6">
                  <h2 className="mb-2 text-[15px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">{a.area}</h2>
                  <ul className="flex flex-col gap-3">
                    {a.metas.map((m) => (
                      <TarjetaMeta
                        key={m.id}
                        nino={nino}
                        plan={activo}
                        meta={m}
                        meses={meses}
                        observaciones={observaciones}
                        relaciones={relaciones}
                        abiertaInicial={revisarId === m.id}
                        soloLectura={false}
                        cicloId={cicloId}
                        onCambio={guardarCambioNino}
                      />
                    ))}
                  </ul>
                </section>
              ))
            )}

            <div className="mt-6 flex gap-2">
              <input
                id="nueva-meta"
                value={nuevaMeta}
                onChange={(e) => setNuevaMeta(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarMeta())}
                placeholder="Nueva meta (Sin área)"
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
            <p className="mt-1.5 text-[12px] leading-snug text-[var(--text-tertiary)]">
              Para agregar una meta dentro de un área con evidencia y ruta, usa <Link href={`/ninos/${nino.id}/plan-individual/propuesta`} className="font-semibold text-[var(--accent)] underline">la propuesta de RAÍZ</Link>.
            </p>

            {archivando ? (
              <div className="mt-6 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Empezar un nuevo periodo</p>
                <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
                  El plan actual ({periodoTexto(activo)}) se archiva con todas sus metas, checkpoints e historial. No se borra ni se sobrescribe.
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
              {anteriores.map((p) => {
                const mesesAnterior = mesesDelPlan(p);
                return (
                  <li key={p.id}>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                      {periodoTexto(p)} · {p.estado === 'archivado' ? 'Archivado' : p.estado === 'cerrado' ? 'Cerrado' : 'Pausado'}
                    </p>
                    {p.motivo && <p className="mt-0.5 mb-2 text-[13px] text-[var(--text-secondary)]">{p.motivo}</p>}
                    {agruparMetasPorArea(p.metas).map((a) => (
                      <div key={a.areaId} className="mt-3">
                        <h3 className="mb-1.5 text-[13px] font-bold text-[var(--text-secondary)]">{a.area}</h3>
                        <ul className="flex flex-col gap-3">
                          {a.metas.map((m) => (
                            <TarjetaMeta key={m.id} nino={nino} plan={p} meta={m} meses={mesesAnterior} observaciones={observaciones} relaciones={relaciones} abiertaInicial={false} soloLectura onCambio={guardarCambioNino} />
                          ))}
                        </ul>
                      </div>
                    ))}
                    {p.metas.length === 0 && <p className="text-[13px] text-[var(--text-tertiary)]">Este plan no tuvo metas.</p>}
                  </li>
                );
              })}
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
