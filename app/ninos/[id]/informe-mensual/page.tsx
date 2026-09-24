'use client';

// INFORME MENSUAL DE OBSERVACIONES (Sesión 6, paso 7 / 6e-2) — "¿qué nos dice, en conjunto, la
// evidencia de este niño durante este mes?". DISTINTO del Registro Mensual (6e-1, cronológico,
// nunca sintetiza, siempre vivo) — el Informe SÍ sintetiza, por eso pasa por Borrador → edición →
// Aprobación → snapshot congelado y versionado. Sin IA real: las afirmaciones automáticas son
// plantillas estructurales y conservadoras, siempre con su evidencia citada — nunca prosa
// interpretativa fingida. Interno del programa en esta fase, no reporte para familias.

import { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, FileText, PencilLine } from 'lucide-react';
import { AppShell, AvatarInicial } from '@/components/app/shell';
import { FECHA_HOY, TINT_HEX, leerEventosSkill, leerNinos, leerObservaciones, leerObservacionSkills, ninoPorId, type EventoSkill, type Nino, type Observacion, type ObservacionSkill } from '@/lib/seed-data';
import { MES_NOMBRE } from '@/lib/curriculo';
import { mesAnterior, mesSiguiente } from '@/lib/registro-mensual';
import {
  aprobarInforme,
  crearNuevaVersionInforme,
  guardarEdicionBorrador,
  guardarUnChildReport,
  hayEvidenciaNuevaTrasAprobar,
  informeMensualVigente,
  prepararInformeBorrador,
  type ChildReport,
  type ContenidoInformeMensual,
  type InformeAssertion,
} from '@/lib/informe-mensual';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const CAMPO_TEXTAREA =
  'min-h-[64px] w-full resize-y rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 py-2.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

function VerObservaciones({ ids, observaciones }: { ids: string[]; observaciones: Observacion[] }) {
  const [abierto, setAbierto] = useState(false);
  if (ids.length === 0) return null;
  const encontradas = ids.map((id) => observaciones.find((o) => o.id === id)).filter((o): o is Observacion => !!o);
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

function BloqueAssertion({
  assertion,
  observaciones,
  editable,
  onCambiarTexto,
}: {
  assertion: InformeAssertion;
  observaciones: Observacion[];
  editable: boolean;
  onCambiarTexto?: (texto: string) => void;
}) {
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

export default function InformeMensual() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [eventosSkill, setEventosSkill] = useState<EventoSkill[]>([]);
  const [informe, setInforme] = useState<ChildReport | undefined>(undefined);
  const [cargado, setCargado] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [borrador, setBorrador] = useState<ContenidoInformeMensual | null>(null);
  // Solo oculta el aviso EN ESTA VISTA — el hecho de que hay evidencia nueva sigue siendo cierto
  // (nunca se persiste como "resuelto"), así que reaparece si se recarga la pantalla, igual que el
  // mismo patrón de aviso en Calendario → Planeación (Parte D).
  const [avisoDescartado, setAvisoDescartado] = useState(false);
  const [notaManual, setNotaManual] = useState('');

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setEventosSkill(leerEventosSkill());
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

  // `FECHA_HOY` sigue siendo la constante DEMO documentada en `seed-data.ts` — solo elige el mes
  // con el que abre esta pantalla por defecto, igual que en el Registro Mensual (6e-1).
  const anio = Number(searchParams.get('anio')) || Number(FECHA_HOY.slice(0, 4));
  const mes = Number(searchParams.get('mes')) || Number(FECHA_HOY.slice(5, 7));

  const vigente = informe ?? informeMensualVigente(nino.id, anio, mes);

  function irAMes(destino: { anio: number; mes: number }) {
    setModoEdicion(false);
    setBorrador(null);
    setInforme(undefined);
    setAvisoDescartado(false);
    router.push(`/ninos/${params.id}/informe-mensual?anio=${destino.anio}&mes=${destino.mes}`);
  }

  function preparar() {
    const nuevo = prepararInformeBorrador(nino!, anio, mes, observaciones, relaciones, eventosSkill);
    guardarUnChildReport(nuevo);
    setInforme(nuevo);
  }

  function empezarEdicion() {
    setBorrador(vigente!.contenidoSnapshot);
    setModoEdicion(true);
  }

  function guardarEdicion() {
    if (!vigente || !borrador) return;
    const actualizado = guardarEdicionBorrador(vigente, borrador);
    setInforme(actualizado);
    setModoEdicion(false);
    setBorrador(null);
  }

  function aprobar() {
    if (!vigente) return;
    const actualizado = aprobarInforme(vigente, observaciones, relaciones);
    setInforme(actualizado);
  }

  function nuevaVersion() {
    if (!vigente) return;
    const nueva = crearNuevaVersionInforme(vigente, nino!, observaciones, relaciones, eventosSkill);
    setInforme(nueva);
  }

  function agregarNotaManual() {
    if (!borrador || !notaManual.trim()) return;
    const nota: InformeAssertion = {
      id: `foco-manual-${Date.now()}-${Math.round(Math.random() * 10000)}`,
      texto: notaManual.trim(),
      observationIds: [],
      origen: 'maestra',
    };
    setBorrador({ ...borrador, focoParaContinuar: [...borrador.focoParaContinuar, nota] });
    setNotaManual('');
  }

  function actualizarAssertion(ruta: 'resumen' | 'comparacion' | { area: number; assertion: number } | { foco: number }, texto: string) {
    if (!borrador) return;
    if (ruta === 'resumen') {
      setBorrador({ ...borrador, resumenMensual: { ...borrador.resumenMensual, texto, editadoManualmente: true } });
    } else if (ruta === 'comparacion') {
      if (!borrador.comparacionMesAnterior) return;
      setBorrador({ ...borrador, comparacionMesAnterior: { ...borrador.comparacionMesAnterior, texto, editadoManualmente: true } });
    } else if ('foco' in ruta) {
      const foco = [...borrador.focoParaContinuar];
      foco[ruta.foco] = { ...foco[ruta.foco], texto, editadoManualmente: true };
      setBorrador({ ...borrador, focoParaContinuar: foco });
    } else {
      const secciones = [...borrador.secciones];
      const assertions = [...secciones[ruta.area].assertions];
      assertions[ruta.assertion] = { ...assertions[ruta.assertion], texto, editadoManualmente: true };
      secciones[ruta.area] = { ...secciones[ruta.area], assertions };
      setBorrador({ ...borrador, secciones });
    }
  }

  const contenido = modoEdicion ? borrador : (vigente?.contenidoSnapshot ?? null);
  const evidenciaNueva = vigente ? hayEvidenciaNuevaTrasAprobar(vigente, observaciones, relaciones) : false;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2 flex items-center justify-between">
          <Link href={`/ninos/${nino.id}`} aria-label="Volver al perfil" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          {!modoEdicion && (
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => irAMes(mesAnterior(anio, mes))} aria-label="Mes anterior" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)]">
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button type="button" onClick={() => irAMes(mesSiguiente(anio, mes))} aria-label="Mes siguiente" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)]">
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </motion.div>

        <motion.header variants={item} className="mb-5 flex items-center gap-3">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={44} />
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Informe mensual</p>
            <h1 className="text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {nino.nombre} · {MES_NOMBRE[mes]} {anio}
            </h1>
            {vigente && (
              <span className={`mt-1 inline-block rounded-[var(--radius-button)] px-2 py-0.5 text-[11px] font-semibold ${vigente.estado === 'aprobado' ? 'bg-[color-mix(in_oklab,var(--sage)_18%,transparent)] text-[var(--sage)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>
                {vigente.estado === 'aprobado' ? `Aprobado · v${vigente.version}` : `Borrador · v${vigente.version}`}
              </span>
            )}
          </div>
        </motion.header>

        {!vigente && (
          <motion.div variants={item} className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-10 text-center">
            <FileText size={22} className="text-[var(--text-tertiary)]" aria-hidden="true" />
            <p className="text-[14px] text-[var(--text-secondary)]">Todavía no hay un Informe Mensual para {MES_NOMBRE[mes]} {anio}.</p>
            <button type="button" onClick={preparar} className="mt-1 flex h-[48px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-[14px] font-semibold text-[var(--bg)]">
              Preparar Informe Mensual
            </button>
          </motion.div>
        )}

        {vigente && evidenciaNueva && !modoEdicion && !avisoDescartado && (
          <motion.div variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_16%,transparent)] p-4">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">
              Hay nueva evidencia de {MES_NOMBRE[mes]} {anio} después de aprobar este informe.
            </p>
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

        {vigente && contenido && (
          <>
            <motion.p variants={item} className="mb-5 text-[14px] text-[var(--text-secondary)]">
              Resumen de evidencia: {contenido.secciones.reduce((n, s) => n + s.assertions.reduce((m, a) => m + a.observationIds.length, 0), 0)} observaciones aprobadas · {contenido.secciones.length} {contenido.secciones.length === 1 ? 'área' : 'áreas'}.
            </motion.p>

            <motion.div variants={item} className="mb-6 flex flex-col gap-4">
              {contenido.secciones.length === 0 && <p className="text-[14px] text-[var(--text-secondary)]">No hubo suficiente evidencia aprobada este mes para elaborar ninguna sección.</p>}
              {contenido.secciones.map((s, iArea) => (
                <section key={s.areaId}>
                  <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">{s.areaNombre}</h2>
                  <div className="flex flex-col gap-2">
                    {s.assertions.map((a, iAssert) => (
                      <BloqueAssertion key={a.id} assertion={a} observaciones={observaciones} editable={modoEdicion} onCambiarTexto={(t) => actualizarAssertion({ area: iArea, assertion: iAssert }, t)} />
                    ))}
                  </div>
                </section>
              ))}
            </motion.div>

            <motion.section variants={item} className="mb-6">
              <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Comparación con el mes anterior</h2>
              {contenido.comparacionMesAnterior ? (
                <BloqueAssertion assertion={contenido.comparacionMesAnterior} observaciones={observaciones} editable={modoEdicion} onCambiarTexto={(t) => actualizarAssertion('comparacion', t)} />
              ) : (
                <p className="text-[13px] text-[var(--text-secondary)]">Todavía no hay suficiente evidencia comparable de meses anteriores.</p>
              )}
            </motion.section>

            <motion.section variants={item} className="mb-6">
              <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Resumen mensual</h2>
              <BloqueAssertion assertion={contenido.resumenMensual} observaciones={observaciones} editable={modoEdicion} onCambiarTexto={(t) => actualizarAssertion('resumen', t)} />
            </motion.section>

            <motion.section variants={item} className="mb-6">
              <h2 className="mb-2 text-[15px] font-semibold text-[var(--text-primary)]">Foco para continuar observando</h2>
              {contenido.focoParaContinuar.length === 0 && !modoEdicion ? (
                <p className="text-[13px] text-[var(--text-secondary)]">Sin foco sugerido este mes.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {contenido.focoParaContinuar.map((f, i) => (
                    <BloqueAssertion key={f.id} assertion={f} observaciones={observaciones} editable={modoEdicion} onCambiarTexto={(t) => actualizarAssertion({ foco: i }, t)} />
                  ))}
                </div>
              )}
              {modoEdicion && (
                <div className="mt-2 flex gap-2">
                  <input
                    value={notaManual}
                    onChange={(e) => setNotaManual(e.target.value)}
                    placeholder="Agregar una nota tuya (sin evidencia automática)..."
                    className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                  />
                  <button type="button" onClick={agregarNotaManual} disabled={!notaManual.trim()} className="min-h-11 shrink-0 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--accent)] disabled:opacity-40">
                    Agregar
                  </button>
                </div>
              )}
            </motion.section>

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
              ) : vigente.estado === 'borrador' ? (
                <>
                  <button type="button" onClick={aprobar} className="flex h-[48px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)]">
                    Aprobar informe
                  </button>
                  <button type="button" onClick={empezarEdicion} className="flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[13px] font-semibold text-[var(--text-primary)]">
                    <PencilLine size={14} aria-hidden="true" />
                    Editar
                  </button>
                </>
              ) : null}
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
