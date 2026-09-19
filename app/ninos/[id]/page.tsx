'use client';

// PERFIL DEL NIÑO — "Conoce a cada niño" (message-match con frame-perfil.png de la landing).
// Es una de las 3 funciones núcleo del MVP (ESTADO.md → Constitución): edad + skills con su
// estado real, el dato que alimenta la diferenciación de Hoy y Semana. Extendido en Módulo
// Niños (Sesión 6, paso 3) con las capas del perfil real: datos básicos, cómo es, "Cuéntame
// sobre este niño", y necesidades/apoyos — antes esta pantalla era de solo lectura.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronRight, Pencil, Plus } from 'lucide-react';
import { AppShell, AvatarInicial, Colapsable, FilaObservacion, SkillBadge } from '@/components/app/shell';
import {
  ESTADO_META_LABEL,
  calcularEdadTexto,
  calcularFechaProximaEvaluacion,
  evidenciaNuevaParaRevisar,
  grupoProgreso,
  leerEventosSkill,
  leerNinos,
  leerObservaciones,
  leerObservacionSkills,
  leerProgramaConfig,
  metasActivasDeNino,
  ninoPorId,
  planActivoDeNino,
  planesDeNino,
  observacionesDeNino,
  resumenProgresoTexto,
  skillsDeObservacion,
  skillsEsperadosSinEstado,
  TINT_HEX,
  type GrupoProgreso,
  type Nino,
} from '@/lib/seed-data';

const ESTADO_EVAL_LABEL: Record<string, string> = { borrador: 'Borrador', aprobada: 'Aprobada' };

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

export default function Perfil() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState(() => leerObservaciones());
  const [observacionSkills, setObservacionSkills] = useState(() => leerObservacionSkills());
  const [eventosSkill, setEventosSkill] = useState(() => leerEventosSkill());
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setObservacionSkills(leerObservacionSkills());
    setEventosSkill(leerEventosSkill());
    setCargado(true);
  }, []);

  const nino = ninoPorId(params.id, ninos);
  const programaConfig = leerProgramaConfig();

  if (!cargado) return null;

  if (!nino) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos a este niño</h1>
          <p className="text-[14px] text-[var(--text-secondary)]">Puede que ya no esté en tu grupo activo.</p>
          <Link href="/ninos" className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a Niños
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2 flex items-center justify-between">
          <Link
            href="/ninos"
            aria-label="Volver a Niños"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <button
            type="button"
            onClick={() => router.push(`/ninos/${nino.id}/editar`)}
            className="flex items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3.5 py-2 text-[13px] font-semibold text-[var(--text-primary)]"
          >
            <Pencil size={14} aria-hidden="true" />
            Editar
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6 flex items-center gap-4">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={56} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Perfil</p>
            <h1 className="text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {nino.nombre}
            </h1>
            <p className="mt-0.5 text-[14px] text-[var(--text-secondary)]">
              {calcularEdadTexto(nino.fechaNacimiento)} · {nino.etapa}
            </p>
          </div>
        </motion.header>

        {(() => {
          const conteo: Record<GrupoProgreso, number> = { consolidado: 0, en_desarrollo: 0, necesita_evidencia: 0, sin_observar: 0 };
          for (const s of nino.skills) conteo[grupoProgreso(s)] += 1;
          conteo.sin_observar += skillsEsperadosSinEstado(nino, programaConfig.tracksActivos).length;
          const conNueva = nino.skills.filter((s) => evidenciaNuevaParaRevisar(nino.id, s, observaciones, observacionSkills, eventosSkill).length > 0).length;
          return (
            <motion.div variants={item} className="mb-6">
              <Link
                href={`/ninos/${nino.id}/progreso`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-2)]"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Progreso</p>
                  <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{resumenProgresoTexto(nino.nombre, conteo, conNueva)}</p>
                </div>
                <ChevronRight size={18} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
              </Link>
            </motion.div>
          );
        })()}

        <motion.div variants={item} className="mb-6 flex flex-col gap-3">
          <Colapsable titulo="Datos básicos" subtitulo="Ingreso, asistencia e idiomas">
            <dl className="flex flex-col gap-2 text-[14px]">
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Fecha de ingreso</dt>
                <dd className="text-right font-medium text-[var(--text-primary)]">{nino.fechaIngreso}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Días programados</dt>
                <dd className="text-right font-medium text-[var(--text-primary)]">{nino.diasAsistencia.join(', ')}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-[var(--text-secondary)]">Idiomas</dt>
                <dd className="text-right font-medium text-[var(--text-primary)]">{nino.idiomas.join(', ') || '—'}</dd>
              </div>
            </dl>
          </Colapsable>

          {(nino.intereses.length > 0 || nino.fortalezas.length > 0 || nino.preferencias.length > 0 || nino.formasComunicacion) && (
            <Colapsable titulo="Cómo es" subtitulo="Intereses, fortalezas y preferencias">
              {nino.intereses.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Intereses</p>
                  <p className="text-[14px] text-[var(--text-primary)]">{nino.intereses.join(', ')}</p>
                </div>
              )}
              {nino.fortalezas.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Fortalezas</p>
                  <p className="text-[14px] text-[var(--text-primary)]">{nino.fortalezas.join(', ')}</p>
                </div>
              )}
              {nino.preferencias.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Preferencias</p>
                  <p className="text-[14px] text-[var(--text-primary)]">{nino.preferencias.join(', ')}</p>
                </div>
              )}
              {nino.formasComunicacion && (
                <div>
                  <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Cómo se comunica</p>
                  <p className="text-[14px] text-[var(--text-primary)]">{nino.formasComunicacion}</p>
                </div>
              )}
            </Colapsable>
          )}

          {nino.notasIngresoOriginal && (
            <Colapsable titulo="Cuéntame sobre este niño" subtitulo="En las palabras de la maestra">
              <p className="text-[14px] leading-relaxed text-[var(--text-primary)]">{nino.notasIngresoOriginal}</p>
            </Colapsable>
          )}

          {nino.necesidades.length > 0 && (
            <Colapsable titulo="Necesidades y apoyos" subtitulo={`${nino.necesidades.length} registradas`} defaultAbierto>
              <ul className="flex flex-col gap-3">
                {nino.necesidades.map((n) => (
                  <li key={n.id} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">{n.categoria}</p>
                    <p className="mt-0.5 text-[14px] font-medium text-[var(--text-primary)]">{n.descripcion}</p>
                    {nino.apoyos
                      .filter((a) => a.necesidadId === n.id && a.activa)
                      .map((a) => (
                        <p key={a.id} className="mt-2 text-[13px] leading-snug text-[var(--text-secondary)]">
                          <span className="font-semibold text-[var(--text-primary)]">Apoyo: </span>
                          {a.estrategia}
                        </p>
                      ))}
                  </li>
                ))}
              </ul>
            </Colapsable>
          )}

          <Colapsable
            titulo="Observaciones"
            subtitulo={
              observacionesDeNino(nino.id, observaciones).length > 0
                ? `${observacionesDeNino(nino.id, observaciones).length} en el historial`
                : 'Todavía no hay observaciones registradas'
            }
          >
            {observacionesDeNino(nino.id, observaciones).length > 0 && (
              <ul className="mb-3 flex flex-col gap-2">
                {observacionesDeNino(nino.id, observaciones)
                  .slice(0, 5)
                  .map((o) => (
                    <FilaObservacion
                      key={o.id}
                      observacion={o}
                      ninoNombre={nino.nombre}
                      ninoHex={TINT_HEX[nino.colorTint]}
                      skills={skillsDeObservacion(o.id, observacionSkills)}
                      mostrarNino={false}
                    />
                  ))}
              </ul>
            )}
            <Link
              href={`/observar?ninoId=${nino.id}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
            >
              <Plus size={16} aria-hidden="true" />
              Nueva observación
            </Link>
          </Colapsable>

          <Colapsable
            titulo="Evaluaciones"
            subtitulo={
              nino.evaluaciones.length > 0
                ? `${nino.evaluaciones.length} en el historial · próxima ${calcularFechaProximaEvaluacion(nino, programaConfig.frecuenciaEvaluacion, programaConfig.frecuenciaEvaluacionMesesPersonalizada)}`
                : 'Todavía no tiene evaluación inicial'
            }
          >
            {nino.evaluaciones.length > 0 ? (
              <ul className="mb-3 flex flex-col gap-2">
                {[...nino.evaluaciones].reverse().map((ev) => (
                  <li key={ev.id}>
                    <Link
                      href={`/ninos/${nino.id}/evaluacion/${ev.id}`}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5"
                    >
                      <div className="min-w-0">
                        <p className="text-[14px] font-medium text-[var(--text-primary)]">
                          {ev.tipo === 'ingreso' ? 'Evaluación de ingreso' : 'Evaluación periódica'}
                        </p>
                        <p className="text-[12px] text-[var(--text-secondary)]">{ev.fecha} · {ESTADO_EVAL_LABEL[ev.estado]}</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mb-3 text-[13px] text-[var(--text-secondary)]">
                La evaluación inicial se prellena con lo que ya sabes — puedes dejarla en borrador y completarla poco a poco.
              </p>
            )}
            <Link
              href={`/ninos/${nino.id}/evaluacion/nueva?tipo=${nino.evaluaciones.length > 0 ? 'periodica' : 'ingreso'}`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
            >
              <Plus size={16} aria-hidden="true" />
              {nino.evaluaciones.length > 0 ? 'Generar evaluación periódica' : 'Generar evaluación inicial'}
            </Link>
          </Colapsable>

          <Colapsable
            titulo="Evaluaciones externas"
            subtitulo={nino.evaluacionesExternas.length > 0 ? `${nino.evaluacionesExternas.length} registradas` : 'ASQ-3, IEP, IFSP, speech, OT, PT...'}
          >
            {nino.evaluacionesExternas.length > 0 && (
              <ul className="mb-3 flex flex-col gap-2">
                {nino.evaluacionesExternas.map((ext) => (
                  <li key={ext.id} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5">
                    <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">{ext.tipo}</p>
                    <p className="mt-0.5 text-[14px] font-medium text-[var(--text-primary)]">{ext.nombreInstrumento}</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">{ext.fecha}{ext.profesionalOEntidad ? ` · ${ext.profesionalOEntidad}` : ''}</p>
                    {ext.resumen && <p className="mt-2 text-[13px] leading-snug text-[var(--text-secondary)]">{ext.resumen}</p>}
                    {ext.hallazgos.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1.5">
                        {ext.hallazgos.map((h) => (
                          <li key={h.id} className="text-[13px] leading-snug text-[var(--text-secondary)]">
                            <span className="font-semibold text-[var(--text-primary)]">{h.area}: </span>
                            {h.resumen}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <Link
              href={`/ninos/${nino.id}/evaluacion-externa/nueva`}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
            >
              <Plus size={16} aria-hidden="true" />
              Agregar evaluación externa
            </Link>
            <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
              El documento original todavía no se adjunta — solo el resumen. Cuando conectemos almacenamiento real podrás subirlo aquí.
            </p>
          </Colapsable>

          <Colapsable
            titulo="Plan Individual"
            subtitulo={
              planActivoDeNino(nino)
                ? `${metasActivasDeNino(nino).length} meta(s) activa(s)${planesDeNino(nino).length > 1 ? ` · ${planesDeNino(nino).length - 1} plan(es) anterior(es)` : ''}`
                : planesDeNino(nino).length > 0
                  ? `Sin plan activo · ${planesDeNino(nino).length} anterior(es)`
                  : 'Opcional — no todos los niños lo necesitan'
            }
          >
            {planActivoDeNino(nino) ? (
              <>
                <ul className="mb-3 flex flex-col gap-2">
                  {planActivoDeNino(nino)!.metas.map((m) => (
                    <li key={m.id} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5">
                      <p className="text-[14px] font-medium text-[var(--text-primary)]">{m.descripcion}</p>
                      <p className="mt-1 text-[12px] font-semibold text-[var(--accent)]">{ESTADO_META_LABEL[m.estado]}</p>
                      {m.siguientePaso && <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">Siguiente paso: {m.siguientePaso}</p>}
                    </li>
                  ))}
                </ul>
                <Link href={`/ninos/${nino.id}/plan-individual`} className="text-[13px] font-semibold text-[var(--accent)] underline">
                  Ver y editar Plan Individual
                </Link>
              </>
            ) : (
              <Link
                href={`/ninos/${nino.id}/plan-individual`}
                className="flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
              >
                <Plus size={16} aria-hidden="true" />
                Crear Plan Individual
              </Link>
            )}
          </Colapsable>
        </motion.div>

        <motion.h2 variants={item} className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">
          Habilidades
        </motion.h2>
        <ul className="flex flex-col gap-2">
          {nino.skills.map((s) => (
            <motion.li key={s.id} variants={item}>
              <Link
                href={`/ninos/${nino.id}/progreso/${s.id}`}
                className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
              >
                <span className="text-[15px] font-medium text-[var(--text-primary)]">{s.nombre}</span>
                <SkillBadge estadoDesarrollo={s.estadoDesarrollo} estadoEvidencia={s.estadoEvidencia} />
              </Link>
            </motion.li>
          ))}
        </ul>

        <motion.p variants={item} className="mt-6 text-center text-[13px] text-[var(--text-tertiary)]">
          Las observaciones agregan evidencia — el estado de cada habilidad solo cambia cuando tú lo apruebas.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
