'use client';

// REPORTE DE RESULTADOS DEL PERIODO (Sesión 6, paso 7 / 6f) — sintetiza TODO el periodo entre dos
// evaluaciones (no un mes, como el Informe Mensual de 6e-2). Mismo patrón de ciclo de vida:
// Borrador → edición de la maestra → Aprobación → snapshot congelado y versionado. Sin IA real:
// plantillas estructurales y conservadoras, siempre citando su evidencia. El Reporte describe el
// periodo que TERMINA — lee el Plan Individual tal como quedó archivado en este ciclo, nunca un
// Plan nuevo que ya pueda existir (regla del usuario, 6f punto 7).

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronDown, FileText, PencilLine } from 'lucide-react';
import { AppShell, AvatarInicial } from '@/components/app/shell';
import { TINT_HEX, leerEventosSkill, leerNinos, leerObservaciones, leerObservacionSkills, ninoPorId, type EventoSkill, type Nino, type Observacion, type ObservacionSkill } from '@/lib/seed-data';
import { type InformeAssertion, leerChildReports, type ChildReport } from '@/lib/informe-mensual';
import {
  aprobarReporteResultados,
  cicloPorId,
  crearNuevaVersionReporte,
  guardarEdicionReporteResultados,
  hayEvidenciaNuevaReporte,
  marcarReporte,
  type ContenidoReporteResultados,
} from '@/lib/ciclo-revision';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const CAMPO_TEXTAREA =
  'min-h-[64px] w-full resize-y rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

function VerObservaciones({ ids, observaciones }: { ids: string[]; observaciones: Observacion[] }) {
  const [abierto, setAbierto] = useState(false);
  if (ids.length === 0) return null;
  const encontradas = ids.map((id) => observaciones.find((o) => o.id === id)).filter((o): o is Observacion => !!o);
  if (encontradas.length === 0) return null;
  return (
    <div className="mt-1.5">
      <button type="button" onClick={() => setAbierto((v) => !v)} className="flex items-center gap-1 text-[12px] font-semibold text-[var(--accent)]">
        <ChevronDown size={13} className={`transition-transform ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
        Ver observaciones ({encontradas.length})
      </button>
      {abierto && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {encontradas.map((o) => (
            <li key={o.id}>
              <Link href={`/observaciones/${o.id}`} className="block rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-2 text-[12px] text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text-primary)]">{o.fecha}</span> — {o.redaccionProfesional ?? '(sin redacción aprobada)'}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function BloqueAssertion({ assertion, observaciones, editable, onCambiarTexto }: { assertion: InformeAssertion; observaciones: Observacion[]; editable: boolean; onCambiarTexto?: (texto: string) => void }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-3.5">
      {editable ? (
        <textarea value={assertion.texto} onChange={(e) => onCambiarTexto?.(e.target.value)} className={CAMPO_TEXTAREA} />
      ) : (
        <p className="text-[14px] leading-snug text-[var(--text-primary)]">{assertion.texto}</p>
      )}
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        {assertion.origen === 'maestra' && <span className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_12%,transparent)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--accent)]">Escrito por la maestra</span>}
        {assertion.origen === 'raiz_demo' && <span className="rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase text-[var(--text-tertiary)]">Borrador estructurado DEMO</span>}
      </div>
      <VerObservaciones ids={assertion.observationIds} observaciones={observaciones} />
    </div>
  );
}

function Seccion({
  titulo,
  vacio,
  assertions,
  observaciones,
  editable,
  onCambiar,
}: {
  titulo: string;
  vacio: string;
  assertions: InformeAssertion[];
  observaciones: Observacion[];
  editable: boolean;
  onCambiar: (i: number, texto: string) => void;
}) {
  if (assertions.length === 0 && !editable) return null;
  return (
    <motion.section variants={item} className="mb-6">
      <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">{titulo}</h2>
      {assertions.length === 0 ? (
        <p className="text-[13px] text-[var(--text-secondary)]">{vacio}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {assertions.map((a, i) => (
            <BloqueAssertion key={a.id} assertion={a} observaciones={observaciones} editable={editable} onCambiarTexto={(t) => onCambiar(i, t)} />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function ReporteResultadosContenido() {
  const params = useParams<{ id: string; reporteId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const cicloId = searchParams.get('ciclo');
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [eventosSkill, setEventosSkill] = useState<EventoSkill[]>([]);
  const [reporte, setReporte] = useState<ChildReport<ContenidoReporteResultados> | undefined>(undefined);
  const [cargado, setCargado] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [borrador, setBorrador] = useState<ContenidoReporteResultados | null>(null);
  const [avisoDescartado, setAvisoDescartado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setEventosSkill(leerEventosSkill());
    const encontrado = leerChildReports().find((r) => r.id === params.reporteId && r.tipo === 'period_results_report') as ChildReport<ContenidoReporteResultados> | undefined;
    setReporte(encontrado);
    setCargado(true);
  }, [params.reporteId]);

  if (!cargado) return null;
  const nino = ninoPorId(params.id, ninos);
  if (!nino || !reporte) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <FileText size={22} className="text-[var(--text-tertiary)]" aria-hidden="true" />
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos este reporte</h1>
          <Link href={`/ninos/${params.id}`} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver al perfil
          </Link>
        </div>
      </AppShell>
    );
  }

  const contenido = modoEdicion ? borrador! : reporte.contenidoSnapshot;
  const evidenciaNueva = hayEvidenciaNuevaReporte(reporte, nino, observaciones, relaciones, eventosSkill);
  const volverAlCiclo = cicloId ? `/ninos/${nino.id}/revision-periodica?ciclo=${cicloId}` : `/ninos/${nino.id}`;

  function empezarEdicion() {
    setBorrador(reporte!.contenidoSnapshot);
    setModoEdicion(true);
  }

  function guardarEdicion() {
    if (!borrador) return;
    const actualizado = guardarEdicionReporteResultados(reporte!, borrador);
    setReporte(actualizado);
    setModoEdicion(false);
    setBorrador(null);
  }

  function aprobar() {
    const actualizado = aprobarReporteResultados(reporte!, nino!, observaciones, relaciones, eventosSkill);
    setReporte(actualizado);
  }

  function nuevaVersion() {
    if (!cicloId) return;
    const ciclo = cicloPorId(cicloId);
    if (!ciclo) return;
    const nueva = crearNuevaVersionReporte(reporte!, nino!, ciclo, observaciones, relaciones, eventosSkill);
    marcarReporte(ciclo, nueva.id);
    setReporte(nueva);
  }

  function cambiar(campo: keyof ContenidoReporteResultados, i: number | null, texto: string) {
    if (!borrador) return;
    if (i === null) {
      setBorrador({ ...borrador, resumenPeriodo: { ...borrador.resumenPeriodo, texto, editadoManualmente: true } });
      return;
    }
    const lista = [...(borrador[campo] as InformeAssertion[])];
    lista[i] = { ...lista[i], texto, editadoManualmente: true };
    setBorrador({ ...borrador, [campo]: lista });
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2 flex items-center justify-between">
          <Link href={volverAlCiclo} aria-label="Volver" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-5 flex items-center gap-3">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={44} />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Reporte de Resultados del Periodo</p>
            <h1 className="text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">{nino.nombre}</h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              {contenido.periodoInicio} — {contenido.periodoFin}
            </p>
            <span className={`mt-1 inline-block rounded-[var(--radius-button)] px-2 py-0.5 text-[11px] font-semibold ${reporte.estado === 'aprobado' ? 'bg-[color-mix(in_oklab,var(--sage)_18%,transparent)] text-[var(--sage)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>
              {reporte.estado === 'aprobado' ? `Aprobado · v${reporte.version}` : `Borrador · v${reporte.version}`}
            </span>
          </div>
        </motion.header>

        {evidenciaNueva && !modoEdicion && !avisoDescartado && (
          <motion.div variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_16%,transparent)] p-4">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">Hay evidencia nueva de este periodo después de aprobar este reporte.</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={nuevaVersion} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
                Crear nueva versión
              </button>
              <button type="button" onClick={() => setAvisoDescartado(true)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
                Mantener versión actual
              </button>
            </div>
          </motion.div>
        )}

        <Seccion titulo="Fortalezas confirmadas" vacio="Sin cambios confirmados hacia dominio este periodo." assertions={contenido.fortalezas} observaciones={observaciones} editable={modoEdicion} onCambiar={(i, t) => cambiar('fortalezas', i, t)} />
        <Seccion titulo="Cambios confirmados" vacio="No se confirmaron cambios de estado durante este periodo." assertions={contenido.cambiosConfirmados} observaciones={observaciones} editable={modoEdicion} onCambiar={(i, t) => cambiar('cambiosConfirmados', i, t)} />
        <Seccion titulo="Áreas en desarrollo" vacio="Sin evidencia aprobada suficiente este periodo." assertions={contenido.areasEnDesarrollo} observaciones={observaciones} editable={modoEdicion} onCambiar={(i, t) => cambiar('areasEnDesarrollo', i, t)} />
        <Seccion titulo="Metas cumplidas" vacio="Ninguna meta se marcó como cumplida este periodo." assertions={contenido.metasCumplidas} observaciones={observaciones} editable={modoEdicion} onCambiar={(i, t) => cambiar('metasCumplidas', i, t)} />
        <Seccion titulo="Metas que continúan" vacio="Sin metas activas al cierre de este periodo." assertions={contenido.metasQueContinuan} observaciones={observaciones} editable={modoEdicion} onCambiar={(i, t) => cambiar('metasQueContinuan', i, t)} />
        <Seccion titulo="Metas cerradas" vacio="Ninguna meta se cerró este periodo." assertions={contenido.metasCerradas} observaciones={observaciones} editable={modoEdicion} onCambiar={(i, t) => cambiar('metasCerradas', i, t)} />

        <motion.section variants={item} className="mb-6">
          <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Resumen del periodo</h2>
          <BloqueAssertion assertion={contenido.resumenPeriodo} observaciones={observaciones} editable={modoEdicion} onCambiarTexto={(t) => cambiar('resumenPeriodo', null, t)} />
        </motion.section>

        <Seccion titulo="Próximos pasos" vacio="Sin próximos pasos sugeridos." assertions={contenido.proximosPasos} observaciones={observaciones} editable={modoEdicion} onCambiar={(i, t) => cambiar('proximosPasos', i, t)} />

        <motion.div variants={item} className="flex flex-col gap-2">
          {modoEdicion ? (
            <>
              <button type="button" onClick={guardarEdicion} className="flex h-[48px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)]">
                Guardar cambios
              </button>
              <button
                type="button"
                onClick={() => {
                  setModoEdicion(false);
                  setBorrador(null);
                }}
                className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline"
              >
                Cancelar
              </button>
            </>
          ) : reporte.estado === 'borrador' ? (
            <>
              <button type="button" onClick={aprobar} className="flex h-[48px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)]">
                Aprobar reporte
              </button>
              <button type="button" onClick={empezarEdicion} className="flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--text-primary)]">
                <PencilLine size={14} aria-hidden="true" />
                Editar
              </button>
            </>
          ) : (
            <Link href={volverAlCiclo} className="flex h-[48px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)]">
              Continuar
            </Link>
          )}
        </motion.div>
      </motion.div>
    </AppShell>
  );
}

export default function ReporteResultados() {
  return (
    <Suspense fallback={null}>
      <ReporteResultadosContenido />
    </Suspense>
  );
}
