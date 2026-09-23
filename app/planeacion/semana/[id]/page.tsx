'use client';

// PLANEACIÓN DE LA SEMANA (Parte D) — muestra una `PlaneacionSemanal` materializada desde el
// Calendario Pedagógico (Parte C): el esqueleto de bloques configurados por día, con su contexto
// (subtema/vocabulario/eventos) referenciado en vivo, nunca copiado. NO genera contenido
// pedagógico — cada bloque queda "Pendiente" hasta que la maestra o una IA posterior lo complete.
// Ruta NUEVA e inequívoca — `/planeacion/[id]` (que hoy abre una ACTIVIDAD puntual de la Semana 3
// demo) se queda exactamente como está, sin cambiar de significado.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import { BLOQUE_LABEL, guardarUnaPlaneacion, leerPlaneaciones, planeacionPorId, type PlaneacionSemanal } from '@/lib/seed-data';
import { MODO_PLANEACION_LABEL, TIPO_EVENTO_LABEL, leerCalendariosMensuales } from '@/lib/calendario';
import { disenoDeMes, leerDisenosMensuales } from '@/lib/curriculo';
import { detectarConflictos, resolverConflictoDia, type AccionConflictoDia, type ConflictoDia } from '@/lib/planeacion-calendario';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

const FORMATO_DIA = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
function fechaLarga(fecha: string): string {
  const t = FORMATO_DIA.format(new Date(`${fecha}T12:00:00`));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const TITULO_CONFLICTO: Record<ConflictoDia['tipo'], string> = {
  sin_cambios: '',
  cambio_estructural: 'Tu Calendario cambió después de crear esta Planeación.',
  ahora_cerrado: 'Este día ahora figura como cerrado en tu Calendario.',
  dia_nuevo_disponible: 'Tu Calendario tiene un día abierto que todavía no está en esta Planeación.',
};

function BannerConflicto({ conflicto, onResolver }: { conflicto: ConflictoDia; onResolver: (accion: AccionConflictoDia) => void }) {
  const opciones: { accion: AccionConflictoDia; texto: string }[] =
    conflicto.tipo === 'dia_nuevo_disponible'
      ? [
          { accion: 'agregar_dia', texto: 'Agregar este día a la Planeación' },
          { accion: 'mantener', texto: 'No agregarlo por ahora' },
        ]
      : [
          { accion: 'mantener', texto: 'Conservar Planeación actual' },
          { accion: 'actualizar', texto: conflicto.tipo === 'ahora_cerrado' ? 'Marcar como cerrado y conservar el trabajo' : 'Actualizar estructura' },
          { accion: 'quitar_dia', texto: 'Quitar este día de la semana' },
        ];

  return (
    <div className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_16%,transparent)] p-4">
      <p className="text-[13px] font-semibold text-[var(--text-primary)]">{fechaLarga(conflicto.fecha)}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">{TITULO_CONFLICTO[conflicto.tipo]}</p>
      {conflicto.hayTrabajoReal && conflicto.tipo !== 'dia_nuevo_disponible' && (
        <p className="mt-1 text-[12px] font-semibold text-[var(--coral)]">Este día ya tiene trabajo pedagógico guardado — no se borra solo.</p>
      )}
      <div className="mt-2 flex flex-col gap-2">
        {opciones.map((o) => (
          <button
            key={o.accion}
            type="button"
            onClick={() => onResolver(o.accion)}
            className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-left text-[13px] font-semibold text-[var(--text-primary)]"
          >
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function PlaneacionSemanaPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [planes, setPlanes] = useState<PlaneacionSemanal[]>([]);
  const [cargado, setCargado] = useState(false);
  const [confirmarQuitar, setConfirmarQuitar] = useState<string | null>(null);

  useEffect(() => {
    setPlanes(leerPlaneaciones());
    setCargado(true);
  }, []);

  if (!cargado) return null;
  const plan = planeacionPorId(params.id, planes);

  if (!plan) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta Planeación</h1>
          <button type="button" onClick={() => router.back()} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver
          </button>
        </div>
      </AppShell>
    );
  }

  const calendarios = leerCalendariosMensuales();
  const disenos = leerDisenosMensuales();
  const conflictos = plan.origenCalendario ? detectarConflictos(plan, calendarios) : [];

  function persistir(actualizado: PlaneacionSemanal) {
    const actualizados = planes.some((p) => p.id === actualizado.id) ? planes.map((p) => (p.id === actualizado.id ? actualizado : p)) : [...planes, actualizado];
    setPlanes(actualizados);
    guardarUnaPlaneacion(actualizado);
  }

  function resolver(fecha: string, accion: AccionConflictoDia) {
    if (!plan) return;
    if (accion === 'quitar_dia' && confirmarQuitar !== fecha) {
      const conflicto = conflictos.find((c) => c.fecha === fecha);
      if (conflicto?.hayTrabajoReal) {
        setConfirmarQuitar(fecha);
        return;
      }
    }
    persistir(resolverConflictoDia(plan, fecha, accion, { calendarios, disenos }));
    setConfirmarQuitar(null);
  }

  const dias = [...plan.dias].sort((a, b) => a.fecha.localeCompare(b.fecha));

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button type="button" onClick={() => router.back()} aria-label="Volver" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Planeación de la semana</p>
          <h1 className="text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {plan.rangoInicio ? `${fechaLarga(plan.rangoInicio)} — ${plan.rangoFin ? fechaLarga(plan.rangoFin) : ''}` : `Semana ${plan.numero ?? ''}`}
          </h1>
          {plan.subtemaSemanal && <p className="mt-1 text-[14px] text-[var(--text-secondary)]">{plan.subtemaSemanal}</p>}
        </motion.header>

        {plan.origenCalendario?.diasFueraDeAlcance && plan.origenCalendario.diasFueraDeAlcance.length > 0 && (
          <motion.p variants={item} className="mb-4 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5 text-[12px] leading-snug text-[var(--text-secondary)]">
            Tu Calendario tiene días abiertos que esta Planeación todavía no puede mostrar ({plan.origenCalendario.diasFueraDeAlcance.join(', ')}) — RAÍZ solo arma semanas de lunes a viernes por ahora.
          </motion.p>
        )}

        {conflictos.length > 0 && (
          <motion.div variants={item} className="mb-6 flex flex-col gap-3">
            {conflictos.map((c) => (
              <BannerConflicto key={`${c.fecha}-${c.tipo}`} conflicto={c} onResolver={(accion) => resolver(c.fecha, accion)} />
            ))}
          </motion.div>
        )}

        {confirmarQuitar && (
          <motion.div variants={item} className="mb-6 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] p-4">
            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{fechaLarga(confirmarQuitar)} tiene trabajo guardado. ¿Quitarlo de todas formas?</p>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => resolver(confirmarQuitar, 'quitar_dia')} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--coral)] px-3 text-[13px] font-semibold text-white">
                Sí, quitar
              </button>
              <button type="button" onClick={() => setConfirmarQuitar(null)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--text-primary)]">
                Cancelar
              </button>
            </div>
          </motion.div>
        )}

        <motion.div variants={item} className="flex flex-col gap-4">
          {dias.map((dia) => {
            const [anioStr, mesStr] = dia.fecha.split('-');
            const diseno = dia.origenCalendario?.subtemaId ? disenoDeMes(Number(anioStr), Number(mesStr), disenos) : undefined;
            const subtema = diseno?.subtemas.find((s) => s.id === dia.origenCalendario?.subtemaId);
            const vocabulario = (dia.origenCalendario?.vocabularioIds ?? [])
              .map((id) => subtema?.vocabulario.find((v) => v.id === id))
              .filter((v): v is NonNullable<typeof v> => !!v)
              .map((v) => v.terminos.map((t) => t.texto).filter(Boolean).join(' / '));

            return (
              <div key={dia.fecha} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">{fechaLarga(dia.fecha)}</p>
                  {dia.origenCalendario?.esCierreMensual && <span className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--butter)_18%,transparent)] px-2 py-0.5 text-[11px] font-semibold text-[var(--butter)]">Cierre del mes</span>}
                </div>

                {(dia.temaDia || dia.focoDia) && (
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                    {dia.temaDia}
                    {dia.focoDia && ` · ${dia.focoDia}`}
                  </p>
                )}
                {vocabulario.length > 0 && <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">Vocabulario: {vocabulario.join(', ')}</p>}
                {dia.origenCalendario && dia.origenCalendario.modoPlaneacion !== 'normal' && (
                  <p className="mt-0.5 text-[12px] font-medium text-[var(--accent)]">{MODO_PLANEACION_LABEL[dia.origenCalendario.modoPlaneacion]}</p>
                )}

                {dia.origenCalendario && dia.origenCalendario.eventos.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {dia.origenCalendario.eventos.map((e, i) => (
                      <Chip key={i} label={`${TIPO_EVENTO_LABEL[e.tipo as keyof typeof TIPO_EVENTO_LABEL] ?? e.tipo} · ${e.nombre}`} activo={false} onClick={() => {}} />
                    ))}
                  </div>
                )}

                <ul className="mt-3 flex flex-col gap-1.5">
                  {dia.actividades.map((a) => (
                    // Sin página de detalle todavía para el contenido de una semana materializada
                    // (completar título/objetivo/materiales es trabajo posterior a la Parte D — ver
                    // punto Q) — fila informativa, nunca un enlace que no lleva a ningún lado.
                    <li key={a.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-2">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{BLOQUE_LABEL[a.bloque]}</span>
                        <span className="block truncate text-[14px] font-medium text-[var(--text-primary)]">{a.titulo}</span>
                      </span>
                      {a.contenidoPendiente && <span className="shrink-0 rounded-[var(--radius-button)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-tertiary)]">Pendiente</span>}
                    </li>
                  ))}
                  {dia.actividades.length === 0 && <li className="text-[12px] text-[var(--text-tertiary)]">Sin bloques de rutina configurados para este modo.</li>}
                </ul>
              </div>
            );
          })}
          {dias.length === 0 && <p className="text-[14px] text-[var(--text-secondary)]">Esta semana no tiene días abiertos en tu Calendario.</p>}
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
