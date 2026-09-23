'use client';

// CALENDARIO PEDAGÓGICO REAL — Parte C de la nueva capa sobre Planeación. Responde "¿qué ocurre
// realmente cada día de este mes?" a partir del Diseño del Mes (B) ya aprobado. NO crea
// actividades detalladas (eso sigue siendo `Actividad`) y NO toca Planeación/Semana/Hoy todavía —
// la conexión real llega en la Parte D. El contexto de mes navegado aquí NUNCA afecta `/hoy`, que
// siempre usa la fecha real.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import { FECHA_HOY, leerProgramaConfig } from '@/lib/seed-data';
import { MES_NOMBRE, curriculoActivo, disenoDeMes, leerCurriculosAnuales, leerDisenosMensuales, type DisenoMensual, type Subtema } from '@/lib/curriculo';
import {
  DIAS_SEMANA_COMPLETOS,
  ESTADO_OPERATIVO_LABEL,
  MODO_PLANEACION_LABEL,
  TIPO_EVENTO_LABEL,
  actualizarDia,
  calendarioDeMes,
  cierreMensualConfig,
  crearCalendarioBase,
  diaDeCalendario,
  diaSemanaDe,
  distribuirMesConSubtemas,
  guardarCalendariosMensuales,
  leerCalendariosMensuales,
  resolverDiasSobrantes,
  type AccionDiasSobrantes,
  type CalendarioMensual,
  type DiaCalendario,
  type EstadoOperativoDia,
  type ModoPlaneacion,
  type TipoEvento,
} from '@/lib/calendario';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.03 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } } };

const CAMPO_INPUT =
  'min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

const ESTADOS: EstadoOperativoDia[] = ['abierto', 'cerrado', 'feriado', 'dia_administrativo', 'custom'];
const MODOS: ModoPlaneacion[] = ['normal', 'rutina_ligera', 'sin_actividad_dirigida'];
const TIPOS_EVENTO: TipoEvento[] = ['cumpleanos', 'fecha_cultural', 'estacion', 'celebracion', 'evento_programa', 'personalizado'];

const FORMATO_DIA_LARGO = new Intl.DateTimeFormat('es', { weekday: 'long', day: 'numeric', month: 'long' });
function fechaLarga(fecha: string): string {
  const t = FORMATO_DIA_LARGO.format(new Date(`${fecha}T12:00:00`));
  return t.charAt(0).toUpperCase() + t.slice(1);
}

const ARTICULOS_ES = new Set(['mi', 'mis', 'el', 'la', 'los', 'las', 'de', 'del', 'un', 'una', 'y', 'nuestro', 'nuestra']);

/** Los nombres de subtema suelen compartir la misma primera palabra ("Mi cuerpo" / "Mi familia" /
 * "Mi escuela") — tomar solo las primeras 3 letras del nombre completo produce la misma etiqueta
 * para subtemas distintos. Ignora artículos/posesivos para elegir la palabra que sí distingue, y si
 * dos aun así coinciden, alarga la abreviatura o agrega un sufijo numérico hasta que sean únicas. */
function abreviaturasSubtemas(subtemas: Subtema[]): Map<string, string> {
  const usadas = new Set<string>();
  const resultado = new Map<string, string>();
  for (const s of [...subtemas].sort((a, b) => a.orden - b.orden)) {
    const palabras = s.nombre.trim().split(/\s+/).filter(Boolean);
    const significativas = palabras.filter((p) => !ARTICULOS_ES.has(p.toLowerCase()));
    const base = (significativas[0] ?? palabras[0] ?? '?').toUpperCase();
    let largo = 3;
    let candidata = base.slice(0, largo);
    while (usadas.has(candidata) && largo < base.length) {
      largo++;
      candidata = base.slice(0, largo);
    }
    if (usadas.has(candidata)) {
      let sufijo = 2;
      while (usadas.has(`${base.slice(0, 2)}${sufijo}`)) sufijo++;
      candidata = `${base.slice(0, 2)}${sufijo}`;
    }
    usadas.add(candidata);
    resultado.set(s.id, candidata);
  }
  return resultado;
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{children}</p>;
}

function CeldaDia({ dia, abrev, seleccionado, onClick }: { dia: DiaCalendario; abrev?: string; seleccionado: boolean; onClick: () => void }) {
  const abierto = dia.estado === 'abierto';
  const esHoy = dia.fecha === FECHA_HOY;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${fechaLarga(dia.fecha)} — ${ESTADO_OPERATIVO_LABEL[dia.estado]}`}
      aria-pressed={seleccionado}
      className={`flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[var(--radius-button)] p-1 text-center ${
        seleccionado ? 'ring-2 ring-[var(--accent)]' : ''
      } ${abierto ? 'bg-[var(--surface)]' : 'bg-[var(--surface-2)] opacity-50'}`}
    >
      <span className={`text-[13px] font-semibold ${esHoy ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}>{Number(dia.fecha.slice(8, 10))}</span>
      {dia.esCierreMensual && <span className="text-[9px] font-semibold text-[var(--butter)]">CIERRE</span>}
      {abrev && !dia.esCierreMensual && <span className="text-[9px] font-medium text-[var(--accent)]">{abrev}</span>}
      {dia.eventos.length > 0 && <span className="text-[9px] text-[var(--text-tertiary)]">{'●'.repeat(Math.min(dia.eventos.length, 3))}</span>}
    </button>
  );
}

function EditorDia({
  dia,
  diseno,
  onCambiar,
}: {
  dia: DiaCalendario;
  diseno: DisenoMensual;
  onCambiar: (cambios: Partial<DiaCalendario>, manual?: boolean) => void;
}) {
  const [nuevoEventoTipo, setNuevoEventoTipo] = useState<TipoEvento>('personalizado');
  const [nuevoEventoNombre, setNuevoEventoNombre] = useState('');

  const subtemas = [...diseno.subtemas].sort((a, b) => a.orden - b.orden);
  const subtemaActual = subtemas.find((s) => s.id === dia.subtemaId);
  const config = cierreMensualConfig();

  // Los eventos son un eje independiente del subtema del día (regla del usuario, punto 8) —
  // agregarlos/quitarlos nunca marca `editadoManualmente`, o el próximo "Regenerar propuesta"
  // excluiría en silencio este día del reparto de subtemas solo por tener un evento.
  function agregarEventoLocal() {
    const n = nuevoEventoNombre.trim();
    if (!n) return;
    onCambiar({ eventos: [...dia.eventos, { id: `evento-${Date.now()}`, tipo: nuevoEventoTipo, nombre: n, nivel: 'incluir', origen: 'maestra' }] }, false);
    setNuevoEventoNombre('');
  }

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-2)]">
      <p className="text-[15px] font-semibold text-[var(--text-primary)]">{fechaLarga(dia.fecha)}</p>
      {dia.editadoManualmente && <p className="mt-0.5 text-[11px] font-semibold text-[var(--accent)]">Editado a mano — no se pisa al regenerar</p>}

      <div className="mt-3">
        <Etiqueta>Estado operativo</Etiqueta>
        <div className="flex flex-wrap gap-2">
          {ESTADOS.map((e) => (
            <Chip key={e} label={ESTADO_OPERATIVO_LABEL[e]} activo={dia.estado === e} onClick={() => onCambiar({ estado: e, incluidoEnPlaneacion: e === 'abierto' })} />
          ))}
        </div>
      </div>

      {dia.estado === 'abierto' && (
        <div className="mt-3">
          <Etiqueta>Modo de planeación</Etiqueta>
          <div className="flex flex-wrap gap-2">
            {MODOS.map((m) => (
              <Chip key={m} label={MODO_PLANEACION_LABEL[m]} activo={dia.modoPlaneacion === m} onClick={() => onCambiar({ modoPlaneacion: m })} />
            ))}
          </div>
        </div>
      )}

      {dia.estado === 'abierto' && dia.modoPlaneacion === 'normal' && (
        <div className="mt-3">
          <Etiqueta>Subtema del día</Etiqueta>
          <select
            value={dia.subtemaId ?? ''}
            onChange={(e) => {
              const nuevoId = e.target.value || undefined;
              const nuevoSubtema = subtemas.find((s) => s.id === nuevoId);
              // Al cambiar el subtema de un día a mano, una palabra de vocabulario que pertenecía al
              // subtema ANTERIOR deja de tener sentido ahí — se quita la referencia de ESTE día (nunca
              // se borra el VocabularioItem original en B). Si la palabra sí sigue existiendo en el
              // subtema nuevo (mismo id compartido entre subtemas), se conserva tal cual.
              const vocabularioValido = nuevoSubtema ? dia.vocabularioDelDia.filter((v) => nuevoSubtema.vocabulario.some((vi) => vi.id === v.vocabularioId)) : [];
              onCambiar({ subtemaId: nuevoId, vocabularioDelDia: vocabularioValido });
            }}
            className={CAMPO_INPUT}
            aria-label="Subtema del día"
          >
            <option value="">Sin subtema</option>
            {subtemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          {subtemaActual && (
            <p className="mt-1.5 text-[12px] leading-snug text-[var(--text-secondary)]">
              {dia.vocabularioDelDia.length > 0
                ? `Vocabulario del día: ${dia.vocabularioDelDia
                    .map((v) => subtemaActual.vocabulario.find((vi) => vi.id === v.vocabularioId))
                    .filter((v): v is NonNullable<typeof v> => !!v)
                    .map((v) => v.terminos.map((t) => t.texto).filter(Boolean).join(' / '))
                    .join(', ')}`
                : 'Sin vocabulario asignado a este día.'}
            </p>
          )}
        </div>
      )}

      {dia.esCierreMensual && config.activo && (
        <div className="mt-3 rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--butter)_14%,transparent)] p-3">
          <Etiqueta>Cierre del mes — para la maestra</Etiqueta>
          <ul className="flex flex-col gap-1">
            {config.checklist.map((c) => (
              <li key={c} className="text-[13px] leading-snug text-[var(--text-secondary)]">
                · {c}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-3">
        <Etiqueta>Eventos de este día</Etiqueta>
        {dia.eventos.length > 0 && (
          <ul className="mb-2 flex flex-col gap-1.5">
            {dia.eventos.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-2">
                <span className="text-[13px] text-[var(--text-primary)]">
                  <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{TIPO_EVENTO_LABEL[e.tipo]}</span>
                  {e.nombre}
                </span>
                <button type="button" onClick={() => onCambiar({ eventos: dia.eventos.filter((x) => x.id !== e.id) }, false)} aria-label={`Quitar ${e.nombre}`} className="shrink-0 text-[12px] font-semibold text-[var(--text-secondary)] underline">
                  Quitar
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="flex gap-2">
          <select value={nuevoEventoTipo} onChange={(e) => setNuevoEventoTipo(e.target.value as TipoEvento)} aria-label="Tipo de evento" className={`${CAMPO_INPUT} w-auto shrink-0`}>
            {TIPOS_EVENTO.map((t) => (
              <option key={t} value={t}>
                {TIPO_EVENTO_LABEL[t]}
              </option>
            ))}
          </select>
          <input value={nuevoEventoNombre} onChange={(e) => setNuevoEventoNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregarEventoLocal())} placeholder="Nombre del evento" aria-label="Nombre del evento" className={`${CAMPO_INPUT} flex-1`} />
        </div>
        <button type="button" onClick={agregarEventoLocal} disabled={!nuevoEventoNombre.trim()} className="mt-2 min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[13px] font-semibold text-[var(--accent)] disabled:opacity-40">
          Agregar evento
        </button>
      </div>
    </div>
  );
}

export default function CalendarioMesPage() {
  const params = useParams<{ mes: string }>();
  const router = useRouter();
  const mes = Number(params.mes);
  const [calendarios, setCalendarios] = useState<CalendarioMensual[]>([]);
  const [disenos, setDisenos] = useState<DisenoMensual[]>([]);
  const [curriculo, setCurriculo] = useState(() => curriculoActivo());
  const [cargado, setCargado] = useState(false);
  const [seleccionado, setSeleccionado] = useState<string | null>(null);
  const [avisoSobrantes, setAvisoSobrantes] = useState<string[] | null>(null);

  useEffect(() => {
    setCalendarios(leerCalendariosMensuales());
    setDisenos(leerDisenosMensuales());
    setCurriculo(curriculoActivo(leerCurriculosAnuales()));
    setCargado(true);
    setSeleccionado(null);
    setAvisoSobrantes(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  if (!cargado || !curriculo || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;
  const anio = curriculo.anio;
  const diseno = disenoDeMes(anio, mes, disenos);
  const calendario = calendarioDeMes(anio, mes, calendarios);

  function persistir(actualizado: CalendarioMensual) {
    const actualizados = calendarios.some((c) => c.id === actualizado.id) ? calendarios.map((c) => (c.id === actualizado.id ? actualizado : c)) : [...calendarios, actualizado];
    setCalendarios(actualizados);
    guardarCalendariosMensuales(actualizados);
  }

  const semanas = calcularSemanas(calendario);
  const abrevs = diseno ? abreviaturasSubtemas(diseno.subtemas) : new Map<string, string>();

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2 flex items-center justify-between">
          <Link href={`/curriculo/mes/${mes}/diseno`} aria-label="Volver al Diseño del Mes" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
          <div className="flex items-center gap-1">
            <button type="button" disabled={mes <= 1} onClick={() => router.push(`/curriculo/mes/${mes - 1}/calendario`)} aria-label="Mes anterior" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)] disabled:opacity-30">
              <ChevronLeft size={18} aria-hidden="true" />
            </button>
            <button type="button" disabled={mes >= 12} onClick={() => router.push(`/curriculo/mes/${mes + 1}/calendario`)} aria-label="Mes siguiente" className="flex size-9 items-center justify-center rounded-full text-[var(--text-primary)] disabled:opacity-30">
              <ChevronRight size={18} aria-hidden="true" />
            </button>
          </div>
        </motion.div>

        <motion.header variants={item} className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Calendario Pedagógico</p>
          <h1 className="text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {MES_NOMBRE[mes]} {anio}
          </h1>
        </motion.header>

        {!diseno ? (
          <motion.section variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Primero necesitas el Diseño de este mes</p>
            <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">El Calendario distribuye los subtemas y el vocabulario que ya aprobaste en el Diseño del Mes.</p>
            <Link href={`/curriculo/mes/${mes}/diseno`} className="mt-3 inline-flex min-h-11 items-center text-[14px] font-semibold text-[var(--accent)] underline">
              Ir al Diseño del Mes
            </Link>
          </motion.section>
        ) : !calendario ? (
          <motion.section variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            {diseno.estado !== 'aprobado' && <p className="mb-3 text-[13px] leading-snug text-[var(--text-secondary)]">El Diseño de este mes todavía está en borrador — puedes generar el calendario igual y ajustarlo después.</p>}
            <button
              type="button"
              onClick={() => persistir(crearCalendarioBase(anio, mes, diseno.id, leerProgramaConfig()))}
              className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
            >
              Generar calendario de {MES_NOMBRE[mes]}
            </button>
          </motion.section>
        ) : (
          <>
            <motion.div variants={item} className="mb-4 flex flex-wrap gap-3">
              <Link href={`/curriculo/mes/${mes}/calendario/sugerencias`} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-2.5 text-[13px] font-semibold text-[var(--accent)]">
                Sugerencias para este mes
              </Link>
              <button
                type="button"
                onClick={() => {
                  const { calendario: actualizado, diasSobrantes } = distribuirMesConSubtemas(calendario, diseno);
                  persistir(actualizado);
                  setAvisoSobrantes(diasSobrantes.length > 0 ? diasSobrantes : null);
                }}
                className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)]"
              >
                {calendario.dias.some((d) => d.subtemaId) ? 'Regenerar propuesta' : 'Distribuir subtemas'}
              </button>
            </motion.div>

            {avisoSobrantes && (
              <motion.div variants={item} className="mb-4 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_14%,transparent)] p-4">
                <p className="text-[13px] font-semibold text-[var(--text-primary)]">
                  Quedan {avisoSobrantes.length} {avisoSobrantes.length === 1 ? 'día disponible' : 'días disponibles'} después de repartir los subtemas.
                </p>
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-secondary)]">¿Qué quieres hacer con ellos?</p>
                <div className="mt-2 flex flex-col gap-2">
                  {(
                    [
                      ['continuar_ultimo', 'Extender el último subtema'],
                      ['integracion', 'Usar como integración / repaso'],
                      ['decidir_luego', 'Decidirlo tú, día por día'],
                    ] as [AccionDiasSobrantes, string][]
                  ).map(([accion, texto]) => (
                    <button
                      key={accion}
                      type="button"
                      onClick={() => {
                        persistir(resolverDiasSobrantes(calendario, diseno, avisoSobrantes, accion));
                        setAvisoSobrantes(null);
                      }}
                      className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-left text-[13px] font-semibold text-[var(--text-primary)]"
                    >
                      {texto}
                    </button>
                  ))}
                  <Link href={`/curriculo/mes/${mes}/diseno`} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 py-2.5 text-[13px] font-semibold text-[var(--text-primary)]">
                    Crear un nuevo subtema en el Diseño del Mes
                  </Link>
                </div>
              </motion.div>
            )}

            <motion.div variants={item} className="mb-2 grid grid-cols-7 gap-1 text-center">
              {DIAS_SEMANA_COMPLETOS.map((d) => (
                <p key={d} className="text-[11px] font-semibold uppercase tracking-[0.02em] text-[var(--text-tertiary)]">
                  {d}
                </p>
              ))}
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-7 gap-1">
              {semanas.flat().map((dia, i) =>
                dia ? (
                  <CeldaDia
                    key={dia.fecha}
                    dia={dia}
                    abrev={dia.subtemaId ? abrevs.get(dia.subtemaId) : undefined}
                    seleccionado={seleccionado === dia.fecha}
                    onClick={() => setSeleccionado((f) => (f === dia.fecha ? null : dia.fecha))}
                  />
                ) : (
                  <div key={`vacio-${i}`} aria-hidden="true" />
                )
              )}
            </motion.div>

            {seleccionado &&
              (() => {
                const dia = diaDeCalendario(calendario, seleccionado);
                if (!dia) return null;
                return (
                  <motion.div variants={item} className="mt-4">
                    <EditorDia dia={dia} diseno={diseno} onCambiar={(cambios, manual = true) => persistir(actualizarDia(calendario, seleccionado, cambios, manual))} />
                  </motion.div>
                );
              })()}
          </>
        )}
      </motion.div>
    </AppShell>
  );
}

/** Agrupa los días del mes en semanas calendario (Dom–Sáb), con huecos `null` para los días fuera
 * del mes en la primera/última fila — solo para dibujar el grid; nunca se guarda ni se cruza con
 * el mes vecino aquí (eso es trabajo de la Parte D). Función pura, sin hooks — el cálculo es
 * trivial (como mucho 6 semanas × 7 días), no necesita memoización. */
function calcularSemanas(calendario: CalendarioMensual | undefined): (DiaCalendario | null)[][] {
  if (!calendario || calendario.dias.length === 0) return [];
  const primero = calendario.dias[0];
  const offset = DIAS_SEMANA_COMPLETOS.indexOf(diaSemanaDe(primero.fecha));
  const celdas: (DiaCalendario | null)[] = [...Array(offset).fill(null), ...calendario.dias];
  while (celdas.length % 7 !== 0) celdas.push(null);
  const semanas: (DiaCalendario | null)[][] = [];
  for (let i = 0; i < celdas.length; i += 7) semanas.push(celdas.slice(i, i + 7));
  return semanas;
}
