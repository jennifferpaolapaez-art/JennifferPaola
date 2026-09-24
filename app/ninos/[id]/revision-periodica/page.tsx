'use client';

// REVISIÓN PERIÓDICA (Sesión 6, paso 7 / 6f) — el hub que orquesta: Evaluación periódica → revisión
// del Plan Individual → nuevas prioridades → Reporte de Resultados → cierre del periodo. Casi todo
// lo que hace cada paso YA EXISTÍA (evaluación, Plan Individual, propuesta multi-área) — esta
// pantalla solo decide en qué paso está el ciclo (`pasoActualDeCiclo`, siempre derivado, nunca
// adivinado) y hacia dónde mandar a la maestra. El ciclo puede tomar varios días: cada vez que se
// entra aquí se reanuda exactamente donde quedó, nunca se vuelve a empezar por accidente.

import { Suspense, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Check, ChevronRight } from 'lucide-react';
import { AppShell, AvatarInicial } from '@/components/app/shell';
import {
  FECHA_HOY,
  TINT_HEX,
  leerEventosSkill,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  leerProgramaConfig,
  ninoPorId,
  planActivoDeNino,
  type EventoSkill,
  type Nino,
  type Observacion,
  type ObservacionSkill,
} from '@/lib/seed-data';
import { fechaCorta } from '@/lib/prioridades';
import { guardarUnChildReport } from '@/lib/informe-mensual';
import {
  calcularProximaRevisionFormal,
  cerrarCiclo,
  cicloEnProgresoDeNino,
  cicloPorId,
  crearCiclo,
  marcarReporte,
  pasoActualDeCiclo,
  prepararReporteResultadosBorrador,
  reporteResultadosDeCiclo,
  ultimoCicloCerradoDeNino,
  type PasoCiclo,
} from '@/lib/ciclo-revision';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const PASOS: { paso: PasoCiclo; titulo: string }[] = [
  { paso: 'preparar_evaluacion', titulo: 'Evaluación periódica' },
  { paso: 'revisar_evaluacion', titulo: 'Evaluación periódica' },
  { paso: 'revisar_metas', titulo: 'Revisión del Plan Individual' },
  { paso: 'nuevas_prioridades', titulo: 'Nuevas prioridades' },
  { paso: 'preparar_reporte', titulo: 'Reporte de Resultados' },
  { paso: 'revisar_reporte', titulo: 'Reporte de Resultados' },
  { paso: 'cerrar', titulo: 'Cerrar periodo' },
];

function ordenPaso(paso: PasoCiclo): number {
  if (paso === 'preparar_evaluacion' || paso === 'revisar_evaluacion') return 0;
  if (paso === 'revisar_metas') return 1;
  if (paso === 'nuevas_prioridades') return 2;
  if (paso === 'preparar_reporte' || paso === 'revisar_reporte') return 3;
  if (paso === 'cerrar') return 4;
  return 5;
}

function RevisionPeriodicaContenido() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [eventosSkill, setEventosSkill] = useState<EventoSkill[]>([]);
  const [cargado, setCargado] = useState(false);
  const [creandoCiclo, setCreandoCiclo] = useState(false);
  const [preparandoReporte, setPreparandoReporte] = useState(false);
  const [cerrando, setCerrando] = useState(false);

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

  const idCicloUrl = searchParams.get('ciclo');
  const cicloDesdeUrl = idCicloUrl ? cicloPorId(idCicloUrl) : undefined;
  const cicloEnProgreso = cicloDesdeUrl ?? cicloEnProgresoDeNino(nino.id);
  const config = leerProgramaConfig();

  function empezarCiclo() {
    setCreandoCiclo(true);
    const nuevo = crearCiclo(nino!);
    router.push(`/ninos/${nino!.id}/evaluacion/nueva?tipo=periodica&ciclo=${nuevo.id}`);
  }

  if (!cicloEnProgreso) {
    const proxima = calcularProximaRevisionFormal(nino, config);
    const disponible = proxima <= FECHA_HOY;
    const ultimoCerrado = ultimoCicloCerradoDeNino(nino.id);
    return (
      <AppShell>
        <motion.div variants={lista} initial="hidden" animate="visible">
          <Cabecera nino={nino} />
          <motion.div variants={item} className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-10 text-center">
            <p className="text-[14px] text-[var(--text-secondary)]">{disponible ? 'Revisión disponible.' : `Revisión prevista desde el ${fechaCorta(proxima)}.`}</p>
            {ultimoCerrado?.periodoFin && <p className="text-[12px] text-[var(--text-tertiary)]">Último periodo cerrado: hasta el {fechaCorta(ultimoCerrado.periodoFin)}.</p>}
            <button
              type="button"
              disabled={creandoCiclo}
              onClick={empezarCiclo}
              className="mt-1 flex h-[48px] items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] px-5 text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50"
            >
              Preparar evaluación periódica
            </button>
          </motion.div>
        </motion.div>
      </AppShell>
    );
  }

  const ciclo = cicloEnProgreso;
  const paso = pasoActualDeCiclo(ciclo, nino);
  const plan = planActivoDeNino(nino);
  const reporte = ciclo.reporteResultadosId ? reporteResultadosDeCiclo(ciclo.id) : undefined;

  function prepararReporte() {
    setPreparandoReporte(true);
    const nuevo = prepararReporteResultadosBorrador(nino!, ciclo, observaciones, relaciones, eventosSkill);
    guardarUnChildReport(nuevo);
    marcarReporte(ciclo, nuevo.id);
    router.push(`/ninos/${nino!.id}/reporte-resultados/${nuevo.id}?ciclo=${ciclo.id}`);
  }

  function cerrarPeriodo() {
    setCerrando(true);
    cerrarCiclo(ciclo);
    router.push(`/ninos/${nino!.id}`);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <Cabecera nino={nino} />

        <motion.p variants={item} className="mb-5 text-[13px] text-[var(--text-secondary)]">
          Periodo desde {fechaCorta(ciclo.periodoInicio)}
          {ciclo.periodoFin ? ` hasta ${fechaCorta(ciclo.periodoFin)}` : ' — todavía sin cerrar'}.
        </motion.p>

        <motion.ol variants={item} className="mb-6 flex flex-col gap-2.5">
          <PasoLinea
            titulo="Evaluación periódica"
            completo={ordenPaso(paso) > 0}
            activo={paso === 'preparar_evaluacion' || paso === 'revisar_evaluacion'}
            descripcion={paso === 'preparar_evaluacion' ? 'Prepara la evaluación de este periodo.' : paso === 'revisar_evaluacion' ? 'Revisa y aprueba el borrador.' : 'Aprobada.'}
            accion={
              paso === 'preparar_evaluacion'
                ? { texto: 'Preparar evaluación', href: `/ninos/${nino.id}/evaluacion/nueva?tipo=periodica&ciclo=${ciclo.id}` }
                : paso === 'revisar_evaluacion'
                  ? { texto: 'Revisar evaluación', href: `/ninos/${nino.id}/evaluacion/${ciclo.evaluacionActualId}?ciclo=${ciclo.id}` }
                  : undefined
            }
          />
          <PasoLinea
            titulo="Revisión del Plan Individual"
            completo={ordenPaso(paso) > 1}
            activo={paso === 'revisar_metas'}
            descripcion={!plan ? 'Este niño no tiene Plan Individual activo — se salta este paso.' : paso === 'revisar_metas' ? 'Revisa cada meta activa.' : ordenPaso(paso) > 1 ? 'Revisada.' : 'Pendiente.'}
            accion={paso === 'revisar_metas' && plan ? { texto: 'Revisar metas', href: `/ninos/${nino.id}/plan-individual?ciclo=${ciclo.id}` } : undefined}
          />
          <PasoLinea
            titulo="Nuevas prioridades"
            completo={ordenPaso(paso) > 2}
            activo={paso === 'nuevas_prioridades'}
            descripcion={
              ciclo.decisionSiguientePlan === 'plan_nuevo'
                ? 'Se creó un Plan Individual nuevo.'
                : ciclo.decisionSiguientePlan === 'sigue_observando'
                  ? 'Se seguirá observando antes de decidir.'
                  : ciclo.decisionSiguientePlan === 'no_necesita'
                    ? 'Por ahora no necesita un Plan Individual.'
                    : 'RAÍZ revisa si hay áreas que podrían beneficiarse de apoyo intencional.'
            }
            accion={paso === 'nuevas_prioridades' ? { texto: 'Ver nuevas prioridades', href: `/ninos/${nino.id}/plan-individual/propuesta?ciclo=${ciclo.id}` } : undefined}
          />
          <PasoLinea
            titulo="Reporte de Resultados"
            completo={ordenPaso(paso) > 3}
            activo={paso === 'preparar_reporte' || paso === 'revisar_reporte'}
            descripcion={
              paso === 'preparar_reporte'
                ? 'Todavía no se preparó el borrador.'
                : paso === 'revisar_reporte'
                  ? 'Revisa y aprueba el borrador.'
                  : ordenPaso(paso) > 3
                    ? 'Aprobado.'
                    : 'Pendiente.'
            }
            accion={
              paso === 'preparar_reporte'
                ? { texto: 'Preparar Reporte de Resultados', onClick: prepararReporte, cargando: preparandoReporte }
                : paso === 'revisar_reporte' && reporte
                  ? { texto: 'Revisar Reporte', href: `/ninos/${nino.id}/reporte-resultados/${reporte.id}?ciclo=${ciclo.id}` }
                  : undefined
            }
          />
        </motion.ol>

        {paso === 'cerrar' && (
          <motion.div variants={item} className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] p-5">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Listo para cerrar el periodo</p>
            <ul className="mt-2 flex flex-col gap-1 text-[13px] text-[var(--text-secondary)]">
              <li className="flex items-center gap-1.5">
                <Check size={14} className="text-[var(--sage)]" aria-hidden="true" /> Evaluación aprobada
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={14} className="text-[var(--sage)]" aria-hidden="true" /> Metas revisadas
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={14} className="text-[var(--sage)]" aria-hidden="true" /> Reporte aprobado
              </li>
              <li className="flex items-center gap-1.5">
                <Check size={14} className="text-[var(--sage)]" aria-hidden="true" /> Próximo Plan decidido
              </li>
            </ul>
            <button
              type="button"
              disabled={cerrando}
              onClick={cerrarPeriodo}
              className="mt-3 flex h-[48px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[14px] font-semibold text-[var(--bg)] disabled:opacity-50"
            >
              Cerrar periodo
            </button>
          </motion.div>
        )}
      </motion.div>
    </AppShell>
  );
}

function Cabecera({ nino }: { nino: Nino }) {
  return (
    <>
      <motion.div variants={item} className="mb-2">
        <Link href={`/ninos/${nino.id}`} aria-label="Volver al perfil" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
          <ArrowLeft size={18} aria-hidden="true" />
        </Link>
      </motion.div>
      <motion.header variants={item} className="mb-5 flex items-center gap-3">
        <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={44} />
        <div>
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Revisión periódica</p>
          <h1 className="text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">{nino.nombre}</h1>
        </div>
      </motion.header>
    </>
  );
}

function PasoLinea({
  titulo,
  descripcion,
  completo,
  activo,
  accion,
}: {
  titulo: string;
  descripcion: string;
  completo: boolean;
  activo: boolean;
  accion?: { texto: string; href?: string; onClick?: () => void; cargando?: boolean };
}) {
  return (
    <li className={`rounded-[var(--radius-card)] p-4 ${activo ? 'bg-[var(--surface)] shadow-[var(--shadow-1)]' : 'bg-[var(--surface-2)]'}`}>
      <div className="flex items-start gap-2.5">
        <span
          className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full ${completo ? 'bg-[var(--sage)] text-[var(--bg)]' : activo ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--text-tertiary)]'}`}
        >
          {completo && <Check size={12} aria-hidden="true" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[14px] font-semibold ${activo ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'}`}>{titulo}</p>
          <p className="mt-0.5 text-[12.5px] leading-snug text-[var(--text-tertiary)]">{descripcion}</p>
          {accion &&
            (accion.href ? (
              <Link href={accion.href} className="mt-2 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[var(--accent)]">
                {accion.texto}
                <ChevronRight size={14} aria-hidden="true" />
              </Link>
            ) : (
              <button type="button" disabled={accion.cargando} onClick={accion.onClick} className="mt-2 flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[var(--accent)] disabled:opacity-50">
                {accion.texto}
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            ))}
        </div>
      </div>
    </li>
  );
}

export default function RevisionPeriodicaPage() {
  return (
    <Suspense fallback={null}>
      <RevisionPeriodicaContenido />
    </Suspense>
  );
}
