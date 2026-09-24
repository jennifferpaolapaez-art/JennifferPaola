'use client';

// PROPUESTA DE PLAN INDIVIDUAL (Sesión 6, paso 7 / 6d ampliación). RAÍZ reúne TODAS las áreas que
// podrían beneficiarse de apoyo intencional — nunca "una prioridad = una meta": cada área puede
// traer varias metas candidatas. VER la propuesta no crea nada. La maestra selecciona, edita,
// agrega una meta manual o un área nueva, puede dejar un área "seguir observando", y solo "Crear
// Plan Individual" escribe algo. Rutas/metas vienen de `RUTAS_DEMO` — sin ruta, RAÍZ no inventa: la
// maestra puede agregar su propia meta para esa habilidad.

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import {
  FECHA_HOY,
  guardarNinos,
  leerEventosSkill,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  leerProgramaConfig,
  ninoPorId,
  planActivoDeNino,
  type Nino,
} from '@/lib/seed-data';
import { cicloPorId, marcarDecisionPlan } from '@/lib/ciclo-revision';
import {
  DOMINIO_AREA_OPCIONES,
  construirPropuestaPlan,
  crearPlanDesdePropuesta,
  fechaCorta,
  registrarDecisionPrioridad,
  calcularPrioridadesDelNino,
  leerDecisionesPrioridad,
  type ContextoDatos,
  type PropuestaArea,
  type PropuestaMeta,
} from '@/lib/prioridades';
import { fechaRevisionPrevistaPorDefecto } from '@/lib/plan-seguimiento';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

const CAMPO =
  'w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-2.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{children}</p>;
}

function Lista({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((t) => (
        <li key={t} className="text-[13px] leading-snug text-[var(--text-secondary)]">
          {t}
        </li>
      ))}
    </ul>
  );
}

interface MetaManualUI {
  tempId: string;
  descripcion: string;
  skillId?: string;
}

function TarjetaMetaSugerida({ meta, marcada, texto, onMarcar, onEditar }: { meta: PropuestaMeta; marcada: boolean; texto: string; onMarcar: () => void; onEditar: (v: string) => void }) {
  return (
    <li className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
      <label className="flex items-start gap-2.5">
        <input type="checkbox" checked={marcada} onChange={onMarcar} className="mt-1 size-5 shrink-0 accent-[var(--accent)]" />
        <div className="min-w-0 flex-1">
          {marcada ? (
            <input value={texto} onChange={(e) => onEditar(e.target.value)} className={`${CAMPO} min-h-11`} aria-label="Editar meta sugerida" />
          ) : (
            <p className="text-[14px] leading-snug text-[var(--text-primary)]">{meta.descripcion}</p>
          )}
          <p className="mt-1 text-[11px] uppercase tracking-[0.04em] text-[var(--accent)]">Sugerida por RAÍZ</p>
          <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-tertiary)]">Criterio de logro: {meta.criterioDeLogro}</p>
        </div>
      </label>
    </li>
  );
}

function BloqueGrupo({
  areaId,
  grupo,
  marcadas,
  textos,
  onMarcar,
  onEditar,
  manuales,
  onAgregarManual,
  onCambiarManual,
  onQuitarManual,
}: {
  areaId: string;
  grupo: PropuestaArea['grupos'][number];
  marcadas: Set<string>;
  textos: Record<string, string>;
  onMarcar: (metaId: string, meta: PropuestaMeta) => void;
  onEditar: (metaId: string, texto: string) => void;
  manuales: MetaManualUI[];
  onAgregarManual: () => void;
  onCambiarManual: (tempId: string, texto: string) => void;
  onQuitarManual: (tempId: string) => void;
}) {
  const [verDetalle, setVerDetalle] = useState(false);
  return (
    <div className="mt-3 first:mt-0">
      <p className="text-[14px] font-semibold text-[var(--text-primary)]">{grupo.nombreSkill}</p>
      <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">
        <span className="font-semibold text-[var(--text-primary)]">Punto actual: </span>
        {grupo.puntoActual}
      </p>

      {grupo.sinRuta ? (
        <p className="mt-1.5 text-[12px] leading-snug text-[var(--text-tertiary)]">Todavía no hay una ruta controlada para esta habilidad — RAÍZ no propone una meta. Puedes agregar la tuya abajo.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {grupo.metas.map((m) => (
            <TarjetaMetaSugerida
              key={m.id}
              meta={m}
              marcada={marcadas.has(m.id)}
              texto={textos[m.id] ?? m.descripcion}
              onMarcar={() => onMarcar(m.id, m)}
              onEditar={(v) => onEditar(m.id, v)}
            />
          ))}
        </ul>
      )}

      {manuales.length > 0 && (
        <ul className="mt-2 flex flex-col gap-2">
          {manuales.map((m) => (
            <li key={m.tempId} className="flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
              <input value={m.descripcion} onChange={(e) => onCambiarManual(m.tempId, e.target.value)} placeholder="Meta manual" aria-label="Meta manual" className={`${CAMPO} min-h-11 flex-1`} />
              <button type="button" onClick={() => onQuitarManual(m.tempId)} aria-label="Quitar meta manual" className="min-h-11 shrink-0 px-1 text-[13px] font-semibold text-[var(--text-secondary)] underline">
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}

      <button type="button" onClick={onAgregarManual} className="mt-2 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
        Agregar otra meta para {grupo.nombreSkill.toLowerCase()}
      </button>

      <button type="button" onClick={() => setVerDetalle((v) => !v)} aria-expanded={verDetalle} className="mt-1 block min-h-11 text-[12px] font-semibold text-[var(--text-secondary)] underline">
        {verDetalle ? 'Ocultar por qué / estrategias / evidencia' : 'Ver por qué, raíces, estrategias y evidencia'}
      </button>
      {verDetalle && (
        <div className="mt-2 flex flex-col gap-3 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
          <div>
            <Etiqueta>¿Por qué?</Etiqueta>
            <Lista items={grupo.porQue} />
          </div>
          {grupo.raices.filter((r) => r.relevante).length > 0 && (
            <div>
              <Etiqueta>Raíces / prerrequisitos relevantes</Etiqueta>
              <ul className="flex flex-col gap-1">
                {grupo.raices.filter((r) => r.relevante).map((r) => (
                  <li key={r.nombre} className="text-[13px] leading-snug text-[var(--text-secondary)]">
                    <span className="font-medium text-[var(--text-primary)]">{r.nombre}</span> — {r.nota}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {grupo.estrategias.length > 0 && (
            <div>
              <Etiqueta>Estrategias</Etiqueta>
              <Lista items={grupo.estrategias} />
            </div>
          )}
          {grupo.oportunidades.length > 0 && (
            <div>
              <Etiqueta>Oportunidades en la rutina</Etiqueta>
              <Lista items={grupo.oportunidades} />
            </div>
          )}
          {grupo.queObservar.length > 0 && (
            <div>
              <Etiqueta>Qué observar</Etiqueta>
              <Lista items={grupo.queObservar} />
            </div>
          )}
          {grupo.evidencia.length > 0 && (
            <div>
              <Etiqueta>Evidencia que respalda esta propuesta</Etiqueta>
              <ul className="flex flex-col gap-1.5">
                {grupo.evidencia.map((e) => (
                  <li key={e.observacionId} className="text-[13px] leading-snug text-[var(--text-secondary)]">
                    <span className="font-semibold text-[var(--text-tertiary)]">{fechaCorta(e.fecha)} · </span>
                    {e.texto}{' '}
                    <Link href={`/observaciones/${e.observacionId}`} className="font-semibold text-[var(--accent)] underline">
                      Ver
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PropuestaContenido() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const busqueda = useSearchParams();
  const cicloId = busqueda.get('ciclo');
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [datos, setDatos] = useState<ContextoDatos | null>(null);
  const [decisiones, setDecisiones] = useState(() => leerDecisionesPrioridad());
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [manualesPorSkill, setManualesPorSkill] = useState<Record<string, MetaManualUI[]>>({});
  const [areasSeguirObservando, setAreasSeguirObservando] = useState<Set<string>>(new Set());
  const [agregandoArea, setAgregandoArea] = useState(false);
  const [nuevaAreaId, setNuevaAreaId] = useState('');
  const [nuevaAreaMeta, setNuevaAreaMeta] = useState('');
  const [areasExtra, setAreasExtra] = useState<{ areaId: string; area: string; metas: MetaManualUI[] }[]>([]);
  const [fechaRevision, setFechaRevision] = useState('');
  const [creado, setCreado] = useState<number | null>(null);
  const [inicializado, setInicializado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setDatos({ observaciones: leerObservaciones(), relaciones: leerObservacionSkills(), eventos: leerEventosSkill() });
    const config = leerProgramaConfig();
    setFechaRevision(fechaRevisionPrevistaPorDefecto(FECHA_HOY, config));
  }, []);

  const nino = ninoPorId(params.id, ninos);
  const areas: PropuestaArea[] = useMemo(() => (nino && datos ? construirPropuestaPlan(nino, datos, decisiones) : []), [nino, datos, decisiones]);

  // Marca por defecto la primera meta de cada grupo, una sola vez cuando la propuesta aparece.
  useEffect(() => {
    if (inicializado || areas.length === 0) return;
    const iniciales = new Set<string>();
    const textosIniciales: Record<string, string> = {};
    for (const a of areas) for (const g of a.grupos) for (const m of g.metas) if (m.porDefecto) { iniciales.add(m.id); textosIniciales[m.id] = m.descripcion; }
    setMarcadas(iniciales);
    setTextos(textosIniciales);
    setInicializado(true);
  }, [areas, inicializado]);

  if (!nino || !datos) return null;
  const volver = `/ninos/${nino.id}/progreso`;
  const volverAlCiclo = cicloId ? `/ninos/${nino.id}/revision-periodica?ciclo=${cicloId}` : volver;

  function noNecesitaPlan() {
    if (!cicloId) return;
    const ciclo = cicloPorId(cicloId);
    if (ciclo) marcarDecisionPlan(ciclo, 'no_necesita');
    router.push(volverAlCiclo);
  }

  function alternarMarca(metaId: string, meta: PropuestaMeta) {
    setMarcadas((s) => {
      const copia = new Set(s);
      if (copia.has(metaId)) copia.delete(metaId);
      else copia.add(metaId);
      return copia;
    });
    setTextos((t) => (t[metaId] ? t : { ...t, [metaId]: meta.descripcion }));
  }

  function agregarManual(skillId: string) {
    setManualesPorSkill((m) => ({ ...m, [skillId]: [...(m[skillId] ?? []), { tempId: `manual-${Date.now()}-${Math.random()}`, descripcion: '' }] }));
  }
  function cambiarManual(skillId: string, tempId: string, descripcion: string) {
    setManualesPorSkill((m) => ({ ...m, [skillId]: (m[skillId] ?? []).map((x) => (x.tempId === tempId ? { ...x, descripcion } : x)) }));
  }
  function quitarManual(skillId: string, tempId: string) {
    setManualesPorSkill((m) => ({ ...m, [skillId]: (m[skillId] ?? []).filter((x) => x.tempId !== tempId) }));
  }

  // "Seguir observando" un área es reversible mientras no crees el Plan (regla del usuario: "nada
  // se crea hasta aprobación" — también aplica a esta decisión). Por eso NO se guarda todavía: solo
  // se oculta localmente y se limpia su selección; la decisión de prioridad recién se registra si
  // sigues así hasta "Crear Plan Individual" (ver `crear`). "Deshacer" la trae de vuelta sin dejar rastro.
  function marcarSeguirObservando(a: PropuestaArea) {
    setAreasSeguirObservando((s) => new Set(s).add(a.areaId));
    const skillIdsDelArea = new Set(a.grupos.map((g) => g.skillId));
    const metaIdsDelArea = new Set(a.grupos.flatMap((g) => g.metas.map((m) => m.id)));
    setMarcadas((s) => new Set([...s].filter((id) => !metaIdsDelArea.has(id))));
    setManualesPorSkill((m) => Object.fromEntries(Object.entries(m).filter(([skillId]) => !skillIdsDelArea.has(skillId))));
  }
  function deshacerSeguirObservando(areaId: string) {
    setAreasSeguirObservando((s) => {
      const copia = new Set(s);
      copia.delete(areaId);
      return copia;
    });
  }

  function agregarAreaExtra() {
    if (!nuevaAreaId || !nuevaAreaMeta.trim()) return;
    const label = DOMINIO_AREA_OPCIONES.find((o) => o.id === nuevaAreaId)?.label ?? nuevaAreaId;
    setAreasExtra((prev) => {
      const existente = prev.find((a) => a.areaId === nuevaAreaId);
      const metaNueva: MetaManualUI = { tempId: `extra-${Date.now()}`, descripcion: nuevaAreaMeta.trim() };
      if (existente) return prev.map((a) => (a.areaId === nuevaAreaId ? { ...a, metas: [...a.metas, metaNueva] } : a));
      return [...prev, { areaId: nuevaAreaId, area: label, metas: [metaNueva] }];
    });
    setNuevaAreaMeta('');
    setNuevaAreaId('');
    setAgregandoArea(false);
  }
  function cambiarAreaExtra(areaId: string, tempId: string, descripcion: string) {
    setAreasExtra((prev) => prev.map((a) => (a.areaId === areaId ? { ...a, metas: a.metas.map((m) => (m.tempId === tempId ? { ...m, descripcion } : m)) } : a)));
  }
  function quitarAreaExtra(areaId: string, tempId: string) {
    setAreasExtra((prev) => prev.map((a) => (a.areaId === areaId ? { ...a, metas: a.metas.filter((m) => m.tempId !== tempId) } : a)).filter((a) => a.metas.length > 0));
  }

  const areasVisibles = areas.filter((a) => !areasSeguirObservando.has(a.areaId));
  const totalManualesValidas = Object.values(manualesPorSkill).flat().filter((m) => m.descripcion.trim()).length + areasExtra.flatMap((a) => a.metas).filter((m) => m.descripcion.trim()).length;
  const totalSeleccion = marcadas.size + totalManualesValidas;
  // "Guardar" también está habilitado con 0 metas si hay áreas en "seguir observando" — esa
  // decisión igual necesita quedar registrada, aunque el Plan no reciba ninguna meta nueva.
  const hayAlgoQueGuardar = totalSeleccion > 0 || areasSeguirObservando.size > 0;

  function crear() {
    if (!nino || !datos || !hayAlgoQueGuardar) return;
    const metasSeleccionadas: { meta: PropuestaMeta; descripcion: string }[] = [];
    for (const a of areas) for (const g of a.grupos) for (const m of g.metas) if (marcadas.has(m.id)) metasSeleccionadas.push({ meta: m, descripcion: textos[m.id] ?? m.descripcion });

    const metasManuales = [
      ...Object.entries(manualesPorSkill).flatMap(([skillId, lista]) => {
        const areaId = areas.flatMap((a) => a.grupos.map((g) => ({ areaId: a.areaId, skillId: g.skillId }))).find((x) => x.skillId === skillId)?.areaId ?? 'sin-area';
        return lista.filter((m) => m.descripcion.trim()).map((m) => ({ descripcion: m.descripcion, skillId, areaId }));
      }),
      ...areasExtra.flatMap((a) => a.metas.filter((m) => m.descripcion.trim()).map((m) => ({ descripcion: m.descripcion, areaId: a.areaId }))),
    ];

    // Las áreas que llegaron marcadas "seguir observando" hasta este momento sí registran esa
    // decisión ahora — es la aprobación final de la maestra, no el simple toggle de la UI.
    const areasParaSeguirObservando = areas.filter((a) => areasSeguirObservando.has(a.areaId));

    const metaIdsAntes = new Set(planActivoDeNino(nino)?.metas.map((m) => m.id) ?? []);
    const { nino: actualizadoBase, skillIdsConMeta } = crearPlanDesdePropuesta(nino, areas, { metasSeleccionadas, metasManuales }, fechaRevision);
    // Dentro del flujo 6f: una meta recién creada en este mismo paso ("Nuevas prioridades") no
    // necesita pasar TAMBIÉN por "Revisión de metas" (Paso 3) — no existía antes de este ciclo, así
    // que no hay nada previo que revisar. Se etiqueta su entrada de creación con el mismo
    // `cicloRevisionId`, evitando que el ciclo rebote de vuelta al paso anterior.
    const actualizado = cicloId
      ? {
          ...actualizadoBase,
          planesIndividuales: (actualizadoBase.planesIndividuales ?? []).map((p) =>
            p.id === planActivoDeNino(actualizadoBase)?.id
              ? {
                  ...p,
                  metas: p.metas.map((m) =>
                    metaIdsAntes.has(m.id) || !m.historial || m.historial.length === 0
                      ? m
                      : { ...m, historial: m.historial.map((h, i) => (i === m.historial!.length - 1 ? { ...h, cicloRevisionId: cicloId } : h)) }
                  ),
                }
              : p
          ),
        }
      : actualizadoBase;
    const todos = ninos.map((n) => (n.id === nino.id ? actualizado : n));
    guardarNinos(todos);
    setNinos(todos);
    let dec = decisiones;
    for (const skillId of skillIdsConMeta) {
      const prioridad = calcularPrioridadesDelNino(nino, datos, dec).sugeridasTodas.find((p) => p.skillId === skillId) ?? calcularPrioridadesDelNino(nino, datos, dec).aceptadas.find((p) => p.skillId === skillId);
      if (prioridad) dec = registrarDecisionPrioridad(prioridad, nino.id, 'aceptada', { nota: 'Meta creada desde la propuesta.' });
    }
    for (const a of areasParaSeguirObservando) {
      for (const g of a.grupos) {
        const prioridad = calcularPrioridadesDelNino(nino, datos, dec).sugeridasTodas.find((p) => p.skillId === g.skillId) ?? calcularPrioridadesDelNino(nino, datos, dec).aceptadas.find((p) => p.skillId === g.skillId);
        if (prioridad) dec = registrarDecisionPrioridad(prioridad, nino.id, 'seguir_observando');
      }
    }
    setDecisiones(dec);
    const total = metasSeleccionadas.length + metasManuales.length;
    setCreado(total);
    if (cicloId) {
      const ciclo = cicloPorId(cicloId);
      if (ciclo) {
        const planNuevoId = total > 0 ? planActivoDeNino(actualizado)?.id : undefined;
        marcarDecisionPlan(ciclo, total > 0 ? 'plan_nuevo' : 'sigue_observando', planNuevoId);
      }
    }
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <Link href={volverAlCiclo} aria-label="Volver" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{nino.nombre} · Propuesta</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Plan Individual sugerido</h1>
          <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
            {areas.length === 0
              ? 'Es un borrador. No se crea nada hasta que tú lo apruebes.'
              : 'RAÍZ encontró áreas que podrían beneficiarse de apoyo intencional. Elige qué metas formarán parte del Plan — nada se crea todavía.'}
          </p>
        </motion.header>

        {creado !== null ? (
          <motion.section variants={item} className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] p-5">
            <p className="text-[16px] font-semibold text-[var(--text-primary)]">
              {creado > 0 ? `Plan Individual actualizado — ${creado} ${creado === 1 ? 'meta agregada' : 'metas agregadas'}.` : 'Listo — quedó registrado que sigues observando esas áreas.'}
            </p>
            <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">
              {creado > 0 ? 'Cada meta quedó como “Por trabajar”. Desde ahora pueden ayudar a personalizar tus próximas planeaciones cuando haya una oportunidad natural.' : 'RAÍZ no volverá a mostrarlas pronto; solo si pasan unas semanas o aparece información nueva.'}
            </p>
            <div className="mt-3 flex flex-wrap gap-4">
              <Link href={`/ninos/${nino.id}/plan-individual`} className="flex min-h-11 items-center text-[14px] font-semibold text-[var(--accent)] underline">
                Ver Plan Individual
              </Link>
              <Link href={volverAlCiclo} className="flex min-h-11 items-center text-[14px] font-semibold text-[var(--text-secondary)] underline">
                {cicloId ? 'Volver a la revisión periódica' : 'Volver al progreso'}
              </Link>
            </div>
          </motion.section>
        ) : areas.length === 0 && areasExtra.length === 0 ? (
          <motion.section variants={item} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            <p className="text-[15px] font-semibold text-[var(--text-primary)]">Por ahora RAÍZ no encontró áreas que necesiten un Plan Individual</p>
            <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">Puedes seguir registrando observaciones, o agregar tu propia área si ya sabes qué quieres trabajar.</p>
            <button type="button" onClick={() => setAgregandoArea(true)} className="mt-3 min-h-11 text-[14px] font-semibold text-[var(--accent)] underline">
              Agregar un área manualmente
            </button>
            {cicloId ? (
              <button type="button" onClick={noNecesitaPlan} className="mt-3 block min-h-11 pt-3 text-[14px] font-semibold text-[var(--accent)] underline">
                Continuar — por ahora no necesita un Plan Individual
              </button>
            ) : (
              <Link href={volver} className="mt-3 block min-h-11 pt-3 text-[14px] font-semibold text-[var(--accent)] underline">
                Volver al progreso
              </Link>
            )}
          </motion.section>
        ) : (
          <>
            {areasVisibles.map((a) => (
              <motion.section key={a.areaId} variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-[18px] font-bold leading-snug text-[var(--text-primary)] [font-family:var(--font-display)]">Área: {a.area}</h2>
                  <button type="button" onClick={() => marcarSeguirObservando(a)} className="shrink-0 text-[12px] font-semibold text-[var(--text-secondary)] underline">
                    Seguir observando
                  </button>
                </div>
                {a.grupos.map((g) => (
                  <BloqueGrupo
                    key={g.skillId}
                    areaId={a.areaId}
                    grupo={g}
                    marcadas={marcadas}
                    textos={textos}
                    onMarcar={alternarMarca}
                    onEditar={(metaId, texto) => setTextos((t) => ({ ...t, [metaId]: texto }))}
                    manuales={manualesPorSkill[g.skillId] ?? []}
                    onAgregarManual={() => agregarManual(g.skillId)}
                    onCambiarManual={(tempId, texto) => cambiarManual(g.skillId, tempId, texto)}
                    onQuitarManual={(tempId) => quitarManual(g.skillId, tempId)}
                  />
                ))}
              </motion.section>
            ))}

            {[...areasSeguirObservando].length > 0 && (
              <motion.div variants={item} className="mb-5 flex flex-col gap-2">
                {[...areasSeguirObservando].map((areaId) => {
                  const a = areas.find((x) => x.areaId === areaId);
                  return (
                    <div key={areaId} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                      <p className="text-[13px] text-[var(--text-secondary)]">
                        <span className="font-semibold text-[var(--text-primary)]">{a?.area ?? areaId}</span> — marcada para seguir observando, no entra en el Plan.
                      </p>
                      <button type="button" onClick={() => deshacerSeguirObservando(areaId)} className="shrink-0 text-[12px] font-semibold text-[var(--accent)] underline">
                        Deshacer
                      </button>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {areasExtra.map((a) => (
              <motion.section key={a.areaId} variants={item} className="mb-5 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
                <h2 className="text-[18px] font-bold leading-snug text-[var(--text-primary)] [font-family:var(--font-display)]">Área: {a.area}</h2>
                <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">Agregada por ti — sin señales de RAÍZ.</p>
                <ul className="mt-2 flex flex-col gap-2">
                  {a.metas.map((m) => (
                    <li key={m.tempId} className="flex items-center gap-2 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                      <input value={m.descripcion} onChange={(e) => cambiarAreaExtra(a.areaId, m.tempId, e.target.value)} className={`${CAMPO} min-h-11 flex-1`} aria-label="Meta del área nueva" />
                      <button type="button" onClick={() => quitarAreaExtra(a.areaId, m.tempId)} className="min-h-11 shrink-0 px-1 text-[13px] font-semibold text-[var(--text-secondary)] underline">
                        Quitar
                      </button>
                    </li>
                  ))}
                </ul>
              </motion.section>
            ))}

            <motion.div variants={item} className="mb-5">
              {agregandoArea ? (
                <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                  <p className="mb-2 text-[14px] font-semibold text-[var(--text-primary)]">Agregar otra área</p>
                  <select value={nuevaAreaId} onChange={(e) => setNuevaAreaId(e.target.value)} aria-label="Área nueva" className={`${CAMPO} mb-2 min-h-11`}>
                    <option value="">Elige un área</option>
                    {DOMINIO_AREA_OPCIONES.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <input value={nuevaAreaMeta} onChange={(e) => setNuevaAreaMeta(e.target.value)} placeholder="Meta para esta área" aria-label="Meta del área nueva" className={`${CAMPO} mb-2 min-h-11`} />
                  <div className="flex gap-2">
                    <button type="button" disabled={!nuevaAreaId || !nuevaAreaMeta.trim()} onClick={agregarAreaExtra} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[13px] font-semibold text-[var(--bg)] disabled:opacity-40">
                      Agregar
                    </button>
                    <button type="button" onClick={() => setAgregandoArea(false)} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAgregandoArea(true)} className="min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
                  Agregar otra área
                </button>
              )}
            </motion.div>

            <motion.div variants={item} className="mb-5">
              <Etiqueta>Fecha de revisión prevista</Etiqueta>
              <input type="date" value={fechaRevision} onChange={(e) => setFechaRevision(e.target.value)} aria-label="Fecha de revisión prevista" className={`${CAMPO} mt-1 min-h-11`} />
              <p className="mt-1 text-[12px] leading-snug text-[var(--text-tertiary)]">Sale de tu frecuencia de evaluación configurada — puedes ajustarla.</p>
            </motion.div>

            <motion.div variants={item} className="flex flex-col gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={crear}
                disabled={!hayAlgoQueGuardar}
                className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-40"
              >
                {totalSeleccion > 0 ? `Crear Plan Individual (${totalSeleccion})` : 'Guardar decisión'}
              </motion.button>
              <Link href={volverAlCiclo} className="flex min-h-11 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--text-secondary)]">
                No crear ahora
              </Link>
              <p className="text-[12px] leading-snug text-[var(--text-tertiary)]">“No crear ahora” no guarda nada. La propuesta se vuelve a calcular la próxima vez que entres.</p>
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}

export default function PropuestaPlanIndividual() {
  return (
    <Suspense fallback={null}>
      <PropuestaContenido />
    </Suspense>
  );
}
