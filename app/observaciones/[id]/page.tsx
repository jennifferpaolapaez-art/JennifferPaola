'use client';

// DETALLE DE UNA OBSERVACIÓN (Sesión 6, paso 6 → 6b) — muestra como PRINCIPAL la observación
// profesional (o la nota original si todavía no hay redacción confirmada — regla del usuario:
// "mantener mi nota" no convierte la nota subjetiva en redacción profesional, así que puede no
// existir), con "Ver nota original" para revisar exactamente lo que la maestra escribió/dictó
// (NUNCA se sobrescribe). SKILLS RELACIONADOS con su estado real — un "sugerido" se puede
// Aceptar/Rechazar directo desde aquí, para que nunca quede pendiente para siempre solo porque la
// maestra ya salió de la pantalla anterior. EVIDENCIA (solo el nombre del archivo, sin fingir
// almacenamiento real) y CONTEXTO (actividad/bloque/fecha, si nació dentro de una).

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Paperclip, X } from 'lucide-react';
import { AppShell, AvatarInicial, Chip, LeafCheck } from '@/components/app/shell';
import {
  aprobarRedaccionObservacion,
  generarRedaccionProfesionalSimulada,
  leerNinos,
  leerObservaciones,
  skillsDeObservacion,
  leerObservacionSkills,
  actualizarEstadoObservacionSkill,
  actividadYPlanPorId,
  estadoRegistroObservacion,
  TINT_HEX,
  BLOQUE_LABEL,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type RedaccionSugerida,
} from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

const ESTADO_SKILL_LABEL: Record<string, { texto: string; bg: string; color: string }> = {
  aceptado: { texto: 'Aceptado', bg: 'color-mix(in oklab, var(--sage) 16%, transparent)', color: 'var(--sage)' },
  rechazado: { texto: 'Rechazado', bg: 'color-mix(in oklab, var(--coral) 14%, transparent)', color: 'var(--coral)' },
  sugerido: { texto: 'Sugerido · sin revisar', bg: 'color-mix(in oklab, var(--butter) 16%, transparent)', color: 'var(--butter)' },
};

const ORIGEN_OBSERVACION_LABEL: Record<string, string> = { dirigida: 'Observación dirigida', espontanea: 'Observación espontánea' };

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{children}</h2>;
}

export default function DetalleObservacion() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [skills, setSkills] = useState<ObservacionSkill[]>([]);
  const [cargado, setCargado] = useState(false);
  const [verNotaOriginal, setVerNotaOriginal] = useState(false);
  const [organizando, setOrganizando] = useState(false);
  const [sugerida, setSugerida] = useState<RedaccionSugerida | null>(null);
  const [textoRedaccion, setTextoRedaccion] = useState('');
  const [aclaracionDescartada, setAclaracionDescartada] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setSkills(leerObservacionSkills());
    setCargado(true);
  }, []);

  if (!cargado) return null;

  const observacion = observaciones.find((o) => o.id === params.id);
  const nino = observacion ? ninos.find((n) => n.id === observacion.ninoId) : undefined;

  if (!observacion || !nino) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta observación</h1>
          <button type="button" onClick={() => router.push('/observaciones')} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a Observaciones
          </button>
        </div>
      </AppShell>
    );
  }

  function revisarSkill(skillId: string, nuevoEstado: 'aceptado' | 'rechazado') {
    setSkills(actualizarEstadoObservacionSkill(observacion!.id, skillId, nuevoEstado));
  }

  /** Genera la redacción sugerida para una observación que quedó "pendiente" (mismo generador de
   * `/observar`, misma anonimización) — la maestra la edita y aprueba; solo entonces cuenta. */
  function organizarRedaccion() {
    const s = generarRedaccionProfesionalSimulada(observacion!.notaOriginal, observacion!.ninoId, ninos);
    setSugerida(s);
    setTextoRedaccion(s.texto);
    setAclaracionDescartada(false);
    setOrganizando(true);
  }

  function regenerarConAclaracion(opcion: string) {
    const s = generarRedaccionProfesionalSimulada(observacion!.notaOriginal, observacion!.ninoId, ninos, opcion);
    setSugerida(s);
    setTextoRedaccion(s.texto);
  }

  function aprobarRedaccion() {
    setObservaciones(aprobarRedaccionObservacion(observacion!.id, textoRedaccion));
    setOrganizando(false);
  }

  const skillsRelacionados = skillsDeObservacion(observacion.id, skills);
  const contexto = observacion.actividadId ? actividadYPlanPorId(observacion.actividadId) : undefined;
  const observacionPrincipal = observacion.redaccionProfesional ?? observacion.notaOriginal;
  const tieneRedaccionPropia = !!observacion.redaccionProfesional;
  const estadoRegistro = estadoRegistroObservacion(observacion);

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6 flex items-center gap-3">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={44} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {ORIGEN_OBSERVACION_LABEL[observacion.origen]}
            </p>
            <h1 className="text-balance text-[20px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {nino.nombre} · {observacion.fecha}
            </h1>
          </div>
        </motion.header>

        <motion.section variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
          <Etiqueta>
            {estadoRegistro === 'oportunidad_sin_evidencia'
              ? 'Oportunidad de observación'
              : tieneRedaccionPropia
                ? 'Observación profesional'
                : 'Nota'}
          </Etiqueta>
          {estadoRegistro === 'pendiente_redaccion' && (
            <p className="mt-1 text-[12px] font-semibold text-[var(--butter)]">
              Pendiente de redacción profesional — no alimenta Registro, Informe, evaluaciones ni reportes hasta que se apruebe.
            </p>
          )}
          {estadoRegistro === 'oportunidad_sin_evidencia' && (
            <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
              Sin evidencia: quedó registrado que hubo una oportunidad de observar. No cuenta como evidencia ni como dificultad.
            </p>
          )}
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-primary)]">{observacionPrincipal}</p>
          {tieneRedaccionPropia && (
            <button
              type="button"
              onClick={() => setVerNotaOriginal((v) => !v)}
              className="mt-3 text-[13px] font-semibold text-[var(--accent)] underline"
            >
              {verNotaOriginal ? 'Ocultar nota original' : 'Ver nota original'}
            </button>
          )}
          {tieneRedaccionPropia && verNotaOriginal && (
            <p className="mt-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3 text-[14px] leading-relaxed text-[var(--text-secondary)]">
              {observacion.notaOriginal}
            </p>
          )}
        </motion.section>

        {estadoRegistro === 'pendiente_redaccion' && (
          <motion.section variants={item} className="mb-5">
            {!organizando ? (
              <button
                type="button"
                onClick={organizarRedaccion}
                className="flex h-11 w-full items-center justify-center rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
              >
                Organizar redacción profesional
              </button>
            ) : (
              <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                <Etiqueta>Observación profesional sugerida</Etiqueta>
                <textarea
                  id="redaccion-pendiente"
                  value={textoRedaccion}
                  onChange={(e) => setTextoRedaccion(e.target.value)}
                  rows={5}
                  placeholder="RAÍZ no encontró hechos suficientes — escribe tu propia versión objetiva."
                  className="mt-2 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
                {sugerida && sugerida.excluidas.length > 0 && (
                  <p className="mt-2 text-[12px] leading-snug text-[var(--text-tertiary)]">
                    No incluimos: {sugerida.excluidas.map((ex) => `“${ex.fragmento}” (${ex.motivo})`).join('; ')}.
                  </p>
                )}
                {sugerida?.aclaracionDisponible && !aclaracionDescartada && (
                  <div className="mt-3 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_12%,transparent)] p-3">
                    <p className="text-[13px] leading-snug text-[var(--text-primary)]">{sugerida.aclaracionDisponible.pregunta}</p>
                    <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Opcional.</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {sugerida.aclaracionDisponible.opciones.map((op) => (
                        <Chip key={op} label={op} activo={false} onClick={() => regenerarConAclaracion(op)} />
                      ))}
                      <button type="button" onClick={() => setAclaracionDescartada(true)} className="text-[13px] font-semibold text-[var(--text-secondary)] underline">
                        No es necesario
                      </button>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={!textoRedaccion.trim()}
                    onClick={aprobarRedaccion}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] disabled:opacity-50"
                  >
                    <LeafCheck size={16} />
                    Usar esta redacción
                  </button>
                  <button type="button" onClick={() => setOrganizando(false)} className="text-center text-[13px] font-semibold text-[var(--text-secondary)] underline">
                    Ahora no
                  </button>
                </div>
              </div>
            )}
          </motion.section>
        )}

        {skillsRelacionados.length > 0 && (
          <motion.section variants={item} className="mb-5">
            <Etiqueta>Skills relacionados</Etiqueta>
            <ul className="mt-2 flex flex-col gap-2">
              {skillsRelacionados.map((s) => {
                const cfg = ESTADO_SKILL_LABEL[s.estado];
                return (
                  <li key={s.skillId} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-3.5 shadow-[var(--shadow-1)]">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[14px] font-semibold text-[var(--text-primary)]">{s.nombreSkill}</span>
                      <span className="rounded-[var(--radius-button)] px-2.5 py-1 text-[11px] font-semibold" style={{ background: cfg.bg, color: cfg.color }}>
                        {cfg.texto}
                      </span>
                    </div>
                    {s.evidenciaTextual && <p className="mt-1.5 text-[13px] leading-snug text-[var(--text-secondary)]">Evidencia: “{s.evidenciaTextual}”</p>}
                    {s.estado === 'aceptado' && estadoRegistro === 'profesional_aprobada' && (
                      <Link
                        href={`/ninos/${nino.id}/progreso/${s.skillId}?revisar=1`}
                        className="mt-2 inline-block text-[13px] font-semibold text-[var(--accent)] underline"
                      >
                        Revisar habilidad
                      </Link>
                    )}
                    {s.estado === 'aceptado' && estadoRegistro === 'pendiente_redaccion' && (
                      <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">Cuenta como evidencia cuando apruebes la redacción profesional.</p>
                    )}
                    {s.estado === 'sugerido' && (
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => revisarSkill(s.skillId, 'aceptado')}
                          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--text-primary)]"
                        >
                          <LeafCheck size={13} />
                          Aceptar
                        </button>
                        <button
                          type="button"
                          onClick={() => revisarSkill(s.skillId, 'rechazado')}
                          className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--text-primary)]"
                        >
                          <X size={13} aria-hidden="true" />
                          Rechazar
                        </button>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </motion.section>
        )}

        {observacion.evidencias && observacion.evidencias.length > 0 && (
          <motion.section variants={item} className="mb-5">
            <Etiqueta>Evidencia</Etiqueta>
            <ul className="mt-2 flex flex-col gap-2">
              {observacion.evidencias.map((ev) => (
                <li key={ev.id} className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
                  <Paperclip size={18} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="truncate text-[14px] font-medium text-[var(--text-primary)]">{ev.nombreArchivo}</p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">
                      Interna · referencia guardada — el archivo real todavía no se adjunta (sin almacenamiento conectado).
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {contexto && (
          <motion.section variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
            <Etiqueta>Contexto</Etiqueta>
            <Link href={`/planeacion/${contexto.actividad.id}`} className="mt-2 block text-[14px] font-medium text-[var(--accent)] underline">
              {BLOQUE_LABEL[contexto.actividad.bloque]} · {contexto.dia.dia} — {contexto.actividad.titulo}
            </Link>
          </motion.section>
        )}

        <motion.p variants={item} className="mt-2 text-center text-[13px] text-[var(--text-tertiary)]">
          Esta observación agrega evidencia — el estado del perfil de {nino.nombre} solo cambia si tú lo apruebas.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
