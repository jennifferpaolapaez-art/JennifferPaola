'use client';

// REGISTRAR OBSERVACIÓN — 3ra función núcleo del MVP (Constitución del Producto, ESTADO.md).
// Regla dura del usuario (Sesión 5, ronda 4): "la maestra puede observar sin saber cómo
// clasificar lo que vio. RAÍZ ayuda a organizarlo después." Dos caminos hacia el mismo historial:
//   (a) DIRIGIDA — toca una habilidad ya sugerida. Con opciones rápidas (ej. Tijeras) RAÍZ genera
//       una redacción simple de una frase automáticamente, sin paso extra (Sesión 6 paso 6b: "no
//       hace falta obligar a un proceso largo cuando la opción ya es objetiva") — EXCEPTO si la
//       opción no representa evidencia real (ej. "No observado"), donde no se genera redacción ni
//       fila de skill. Con texto libre, pasa por el mismo paso de redacción que la espontánea,
//       pero el skill ya está fijado — no repite el análisis de áreas al final.
//   (b) ESPONTÁNEA — escribe/dicta libremente. Sesión 6 paso 6b agrega el paso "RAÍZ organizó tu
//       observación" ANTES de analizar áreas: nota original + redacción profesional sugerida
//       (hechos observables, sin etiquetas subjetivas, sin nombres de otros niños, sin inventar lo
//       ambiguo) → la maestra usa/edita/mantiene su nota → SOLO ENTONCES RAÍZ analiza posibles
//       skills sobre el texto confirmado (nunca sobre juicios ya descartados). "Guardar sin
//       clasificar" sigue disponible como salida rápida, sin pasar por nada de esto.
//
// Sesión 6 paso 6 — ÚNICO formulario, 3 puntos de entrada: sin parámetros arranca eligiendo niño
// (desde el módulo Observaciones); con `ninoId` salta directo a "¿qué observaste?" (desde Perfil/
// Niño foco); con `ninoId`+`skillId`(+`actividadId`) entra directo al camino dirigido de esa
// habilidad con el contexto ya enlazado (desde Hoy/Actividad). Cero lógica duplicada.
// Regla dura: guardar una observación NUNCA toca `Nino.skills` — solo agrega evidencia; el cambio
// de estado vivo sigue requiriendo una acción separada y explícita de la maestra.

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { ArrowLeft, Camera, Keyboard, Mic, Plus, X } from 'lucide-react';
import { AppShell, AvatarInicial, Chip, LeafCheck, SkillBadge } from '@/components/app/shell';
import {
  leerNinos,
  TINT_HEX,
  FECHA_HOY,
  STAFF_ACTUAL_ID,
  OPCIONES_RAPIDAS_POR_SKILL,
  analizarNotaSimulado,
  generarRedaccionProfesionalSimulada,
  generarRedaccionMicroObservacion,
  agregarObservacion,
  marcarNinoFocoObservado,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type OrigenRelacionSkill,
  type EstadoRelacionSkill,
  type OpcionRapida,
  type Evidencia,
  type RedaccionSugerida,
} from '@/lib/seed-data';

type Paso = 'nino' | 'camino' | 'dirigida-nota' | 'redaccion' | 'espontanea-entrada' | 'espontanea-sugerencias' | 'listo';
type OrigenParaRedaccion = 'dirigida' | 'espontanea';

interface SugerenciaUI {
  skillId: string;
  nombre: string;
  evidenciaTextual: string;
  origen: OrigenRelacionSkill;
  estado: EstadoRelacionSkill;
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{children}</h2>;
}

/** "Escribir"/"Hablar" al mismo nivel (regla del usuario, Sesión 6 paso 6b) — hoy solo Escribir
 * es real; Hablar queda visible pero deshabilitado, SIN simular ninguna transcripción falsa.
 * Cuando exista voz real, el mismo textarea que ya recibe esta prop se llenará con la
 * transcripción — la maestra la revisa igual que revisaría lo escrito. */
function TogleEscribirHablar() {
  return (
    <div className="flex gap-2">
      <span className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] py-2.5 text-[13px] font-semibold text-[var(--bg)]">
        <Keyboard size={16} aria-hidden="true" />
        Escribir
      </span>
      <span
        title="Muy pronto — por ahora escribe tu nota"
        className="flex flex-1 items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] py-2.5 text-[13px] font-semibold text-[var(--text-tertiary)] opacity-60"
      >
        <Mic size={16} aria-hidden="true" />
        Hablar · muy pronto
      </span>
    </div>
  );
}

/** "+ Agregar evidencia" (regla del usuario: la entidad es EVIDENCIA, no "foto" — disponible
 * desde CUALQUIER punto de entrada). Solo `foto` es real hoy; se guarda únicamente el nombre. */
function BloqueEvidencia({
  evidencia,
  onArchivo,
  onQuitar,
}: {
  evidencia: { tipo: 'foto'; nombre: string; url: string } | null;
  onArchivo: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onQuitar: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-3">
      <input ref={ref} type="file" accept="image/*" onChange={onArchivo} className="hidden" />
      {evidencia ? (
        <div className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
          <img src={evidencia.url} alt="" className="size-12 rounded-[calc(var(--radius-button)-4px)] object-cover" />
          <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-secondary)]">{evidencia.nombre}</span>
          <button
            type="button"
            onClick={onQuitar}
            aria-label="Quitar evidencia"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--surface)]"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => ref.current?.click()} className="flex items-center gap-2 text-[13px] font-semibold text-[var(--accent)]">
          <Camera size={16} aria-hidden="true" />
          + Agregar evidencia (por ahora solo foto — se guarda el nombre, sin almacenamiento real todavía)
        </button>
      )}
    </div>
  );
}

function ObservarContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();

  const ninoIdParam = params.get('ninoId');
  const actividadIdParam = params.get('actividadId') ?? undefined;
  const skillIdParam = params.get('skillId');

  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);
  const [paso, setPaso] = useState<Paso>('nino');
  const [pasoAnterior, setPasoAnterior] = useState<Paso>('nino');
  const [ninoId, setNinoId] = useState<string | null>(null);
  const [entradaConContexto, setEntradaConContexto] = useState(false);

  // Camino A — dirigida
  const [skillDirigidoId, setSkillDirigidoId] = useState<string | null>(null);
  const [notaDirigida, setNotaDirigida] = useState('');
  const [opcionRapida, setOpcionRapida] = useState<OpcionRapida | null>(null);

  // Camino B — espontánea
  const [notaEspontanea, setNotaEspontanea] = useState('');
  const [evidencia, setEvidencia] = useState<{ tipo: 'foto'; nombre: string; url: string } | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [sugerencias, setSugerencias] = useState<SugerenciaUI[]>([]);
  const [agregandoArea, setAgregandoArea] = useState(false);

  // Paso nuevo — "RAÍZ organizó tu observación" (Sesión 6 paso 6b), compartido por ambos caminos
  // cuando la nota es texto libre.
  const [origenParaRedaccion, setOrigenParaRedaccion] = useState<OrigenParaRedaccion>('espontanea');
  const [notaEnRevision, setNotaEnRevision] = useState('');
  const [redaccionSugerida, setRedaccionSugerida] = useState<RedaccionSugerida | null>(null);
  const [redaccionTrabajo, setRedaccionTrabajo] = useState('');
  const [editandoRedaccion, setEditandoRedaccion] = useState(false);
  const [aclaracionDescartada, setAclaracionDescartada] = useState(false);
  const [redaccionConfirmada, setRedaccionConfirmada] = useState<string | undefined>(undefined);

  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState<{ observacion: Observacion; skills: ObservacionSkill[] } | null>(null);

  useEffect(() => {
    const todos = leerNinos();
    setNinos(todos);
    // Entrada con contexto (Sesión 6 paso 6): salta pasos según qué llegó en la URL — mismo
    // formulario, distinto punto de partida.
    if (ninoIdParam && todos.some((n) => n.id === ninoIdParam)) {
      setNinoId(ninoIdParam);
      setEntradaConContexto(true);
      if (skillIdParam) {
        setSkillDirigidoId(skillIdParam);
        setOpcionRapida(null);
        setNotaDirigida('');
        setPaso('dirigida-nota');
      } else {
        setPaso('camino');
      }
    }
    setCargado(true);
  }, [ninoIdParam, skillIdParam]);

  const nino = ninos.find((n) => n.id === ninoId) ?? null;
  const skillDirigido = nino?.skills.find((s) => s.id === skillDirigidoId) ?? null;
  const nombreSkillDirigidoCatalogo = skillDirigidoId ?? '';
  const nombreSkillDirigidoMostrado = skillDirigido?.nombre ?? nombreSkillDirigidoCatalogo;
  const opcionesRapidas = skillDirigidoId ? OPCIONES_RAPIDAS_POR_SKILL[skillDirigidoId] : undefined;
  const areasDisponiblesParaAgregar = nino?.skills.filter((s) => !sugerencias.some((sg) => sg.skillId === s.id)) ?? [];

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] } },
  };

  function irA(destino: Paso, desde: Paso) {
    setPasoAnterior(desde);
    setPaso(destino);
  }

  function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setEvidencia({ tipo: 'foto', nombre: archivo.name, url: URL.createObjectURL(archivo) });
  }

  function evidenciaGuardable(): Evidencia | undefined {
    return evidencia ? { tipo: evidencia.tipo, nombreArchivo: evidencia.nombre } : undefined;
  }

  /** Si esta observación nace de un niño foco real de una actividad (mismo skill), cierra el
   * ciclo: marca ese foco como observado y lo enlaza — nunca toca `estadoDesarrollo`/
   * `estadoEvidencia`, solo el estado del foco puntual. */
  function cerrarCicloDeFocoSiAplica(observationId: string, skillIdAceptado?: string) {
    if (!actividadIdParam || !ninoId || !skillIdAceptado) return;
    marcarNinoFocoObservado(actividadIdParam, ninoId, observationId);
  }

  /** Abre el paso "RAÍZ organizó tu observación" — compartido por dirigida (texto libre) y
   * espontánea. Nunca toca la nota original; solo prepara lo que se OFRECE como redacción. */
  function prepararRedaccion(nota: string, origen: OrigenParaRedaccion, desde: Paso) {
    if (!ninoId) return;
    const sugerida = generarRedaccionProfesionalSimulada(nota, ninoId, ninos);
    setOrigenParaRedaccion(origen);
    setNotaEnRevision(nota);
    setRedaccionSugerida(sugerida);
    setRedaccionTrabajo(sugerida.texto);
    setEditandoRedaccion(false);
    setAclaracionDescartada(false);
    setRedaccionConfirmada(undefined);
    irA('redaccion', desde);
  }

  function regenerarConAclaracion(opcion: string) {
    if (!ninoId) return;
    const sugerida = generarRedaccionProfesionalSimulada(notaEnRevision, ninoId, ninos, opcion);
    setRedaccionSugerida(sugerida);
    setRedaccionTrabajo(sugerida.texto);
  }

  /** ✓ Usar esta redacción / ✎ (ya editando) Guardar esta versión / ↩ Mantener mi nota — regla
   * del usuario: "mantener mi nota" NUNCA convierte notaOriginal en redaccionProfesional; la deja
   * pendiente en vez de arriesgar una redacción sin confirmar en un reporte. */
  function confirmarRedaccion(accion: 'usar' | 'mantener') {
    const confirmada = accion === 'usar' ? redaccionTrabajo.trim() : undefined;
    setRedaccionConfirmada(confirmada);
    if (origenParaRedaccion === 'dirigida') {
      guardarDirigida(confirmada);
    } else {
      analizarConRaiz(confirmada ?? notaEnRevision);
    }
  }

  function guardarDirigida(redaccionProfesionalFinal?: string) {
    if (!nino || !skillDirigidoId) return;
    setGuardando(true);
    setTimeout(() => {
      const obsId = `obs-${Date.now()}`;
      const notaFinal = opcionRapida ? opcionRapida.texto : notaEnRevision.trim() || notaDirigida.trim();
      const observacion: Observacion = {
        id: obsId,
        ninoId: nino.id,
        actividadId: actividadIdParam,
        fecha: FECHA_HOY,
        origen: 'dirigida',
        fuente: opcionRapida ? 'seleccion_rapida' : 'texto',
        notaOriginal: notaFinal,
        redaccionProfesional: redaccionProfesionalFinal || undefined,
        triggeredBySkillId: skillDirigidoId,
        autorId: STAFF_ACTUAL_ID,
        evidencia: evidenciaGuardable(),
      };
      // Regla del usuario (Sesión 6 paso 6): una opción sin evidencia real (ej. "No observado")
      // NUNCA genera una fila de skill — la oportunidad queda registrada, no la evidencia.
      const esEvidencia = opcionRapida ? opcionRapida.esEvidencia : true;
      const skills: ObservacionSkill[] = esEvidencia
        ? [{ observacionId: obsId, skillId: skillDirigidoId, nombreSkill: nombreSkillDirigidoMostrado, origen: 'observacion_dirigida', estado: 'aceptado' }]
        : [];
      agregarObservacion(observacion, skills);
      if (esEvidencia) cerrarCicloDeFocoSiAplica(obsId, skillDirigidoId);
      setResultado({ observacion, skills });
      setGuardando(false);
      irA('listo', paso);
    }, 600);
  }

  function analizarConRaiz(textoBase: string) {
    setAnalizando(true);
    // Simulación local por palabra clave — NUNCA IA real todavía (ver seed-data.ts,
    // analizarNotaSimulado). Regla del usuario (Sesión 6 paso 6b): analiza la redacción YA
    // confirmada (o la nota si la maestra decidió no usar redacción todavía) — nunca palabras ya
    // descartadas como juicio ("grosero", "feliz").
    setTimeout(() => {
      const encontradas = analizarNotaSimulado(textoBase);
      // Regla del usuario: una sugerencia de RAÍZ arranca en 'sugerido' — NUNCA se auto-acepta.
      setSugerencias(encontradas.map((e) => ({ ...e, origen: 'raiz', estado: 'sugerido' })));
      setAnalizando(false);
      irA('espontanea-sugerencias', 'redaccion');
    }, 900);
  }

  function guardarEspontanea(skillsFinal: SugerenciaUI[]) {
    if (!nino) return;
    setGuardando(true);
    setTimeout(() => {
      const obsId = `obs-${Date.now()}`;
      const observacion: Observacion = {
        id: obsId,
        ninoId: nino.id,
        actividadId: actividadIdParam,
        fecha: FECHA_HOY,
        origen: 'espontanea',
        fuente: 'texto',
        notaOriginal: (notaEnRevision || notaEspontanea).trim(),
        redaccionProfesional: redaccionConfirmada || undefined,
        autorId: STAFF_ACTUAL_ID,
        evidencia: evidenciaGuardable(),
      };
      const skills: ObservacionSkill[] = skillsFinal.map((s) => ({
        observacionId: obsId,
        skillId: s.skillId,
        nombreSkill: s.nombre,
        origen: s.origen,
        estado: s.estado,
        evidenciaTextual: s.evidenciaTextual || undefined,
      }));
      agregarObservacion(observacion, skills);
      const aceptado = skillsFinal.find((s) => s.estado === 'aceptado');
      if (aceptado) cerrarCicloDeFocoSiAplica(obsId, aceptado.skillId);
      setResultado({ observacion, skills });
      setGuardando(false);
      irA('listo', paso);
    }, 600);
  }

  if (!cargado) return null;

  return (
    <AppShell>
      <div className="mb-4">
        {paso !== 'listo' && !(entradaConContexto && paso === 'camino') && (
          <button
            type="button"
            onClick={() => (paso === 'nino' ? router.push('/hoy') : setPaso(pasoAnterior))}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {paso === 'nino' && (
          <motion.div key="nino" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Observación</p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              ¿De quién es la observación?
            </h1>
            {ninos.length === 0 ? (
              <div className="mt-6 flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
                <p className="text-[14px] text-[var(--text-secondary)]">Aún no tienes niños registrados.</p>
                <button type="button" onClick={() => router.push('/ninos/nuevo')} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
                  Crear niño
                </button>
              </div>
            ) : (
              <ul className="mt-6 flex flex-col gap-3">
                {ninos.map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setNinoId(n.id);
                        irA('camino', 'nino');
                      }}
                      className="flex w-full items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-1)] transition-opacity active:opacity-90"
                    >
                      <AvatarInicial nombre={n.nombre} hex={TINT_HEX[n.colorTint]} />
                      <span className="text-[15px] font-medium text-[var(--text-primary)]">{n.nombre}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.div>
        )}

        {paso === 'camino' && nino && (
          <motion.div key="camino" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Sobre {nino.nombre}</p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              ¿Qué observaste hoy?
            </h1>

            <p className="mt-6 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">
              Habilidades sugeridas para observar
            </p>
            <ul className="mt-2 flex flex-col gap-3">
              {nino.skills.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSkillDirigidoId(s.id);
                      setOpcionRapida(null);
                      setNotaDirigida('');
                      setEvidencia(null);
                      irA('dirigida-nota', 'camino');
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-left shadow-[var(--shadow-1)] transition-opacity active:opacity-90"
                  >
                    <span className="text-[15px] font-medium text-[var(--text-primary)]">{s.nombre}</span>
                    <SkillBadge estadoDesarrollo={s.estadoDesarrollo} estadoEvidencia={s.estadoEvidencia} />
                  </button>
                </li>
              ))}
            </ul>

            <div className="my-6 h-px bg-[color-mix(in_oklab,var(--text-tertiary)_18%,transparent)]" />

            <p className="text-[15px] font-semibold text-[var(--text-primary)]">¿Viste algo diferente?</p>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              No necesitas saber qué habilidad es — cuéntalo y RAÍZ te ayuda a organizarlo.
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => {
                setNotaEspontanea('');
                setEvidencia(null);
                setSugerencias([]);
                irA('espontanea-entrada', 'camino');
              }}
              className="mt-4 flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[15px] font-semibold text-[var(--accent)]"
            >
              <Plus size={18} aria-hidden="true" />
              Registrar otra observación
            </motion.button>
          </motion.div>
        )}

        {paso === 'dirigida-nota' && nino && skillDirigidoId && (
          <motion.div key="dirigida-nota" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              {nino.nombre} · {nombreSkillDirigidoMostrado}
            </p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Cuéntalo con tus palabras
            </h1>

            {opcionesRapidas ? (
              <>
                <p className="mt-1 text-[14px] text-[var(--text-secondary)]">Elige lo que mejor describe lo que viste.</p>
                <ul className="mt-5 flex flex-col gap-2">
                  {opcionesRapidas.map((op) => (
                    <li key={op.id}>
                      <button
                        type="button"
                        onClick={() => setOpcionRapida(op)}
                        className={`flex w-full items-center rounded-[var(--radius-card)] p-4 text-left text-[15px] font-medium transition-colors ${
                          opcionRapida?.id === op.id
                            ? 'bg-[var(--accent)] text-[var(--bg)]'
                            : 'bg-[var(--surface)] text-[var(--text-primary)] shadow-[var(--shadow-1)]'
                        }`}
                      >
                        {op.texto}
                      </button>
                    </li>
                  ))}
                </ul>
                {opcionRapida && (
                  opcionRapida.esEvidencia ? (
                    <p className="mt-3 text-[13px] leading-snug text-[var(--text-secondary)]">
                      RAÍZ escribirá: “{generarRedaccionMicroObservacion(nino.nombre, nombreSkillDirigidoMostrado, opcionRapida.texto)}”
                    </p>
                  ) : (
                    <p className="mt-3 text-[13px] leading-snug text-[var(--text-secondary)]">
                      Queda registrada la oportunidad de observarlo — esto NO cuenta como evidencia de {nombreSkillDirigidoMostrado}.
                    </p>
                  )
                )}
                <BloqueEvidencia evidencia={evidencia} onArchivo={manejarArchivo} onQuitar={() => setEvidencia(null)} />
                {!opcionRapida && <p className="mt-3 text-[13px] text-[var(--text-tertiary)]">Elige una opción para poder guardar.</p>}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={!opcionRapida || guardando}
                  onClick={() => guardarDirigida(opcionRapida?.esEvidencia ? generarRedaccionMicroObservacion(nino.nombre, nombreSkillDirigidoMostrado, opcionRapida.texto) : undefined)}
                  className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
                >
                  {guardando ? 'Guardando…' : 'Guardar observación'}
                </motion.button>
              </>
            ) : (
              <>
                <p className="mt-1 text-[14px] text-[var(--text-secondary)]">RAÍZ lo convierte en documentación profesional para la familia.</p>
                <div className="mt-4">
                  <TogleEscribirHablar />
                </div>
                <textarea
                  autoFocus
                  value={notaDirigida}
                  onChange={(e) => setNotaDirigida(e.target.value)}
                  placeholder="Ej: hoy usó las tijeras solo, sin ayuda, en las 3 líneas rectas."
                  rows={5}
                  className="mt-4 w-full resize-none rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
                <BloqueEvidencia evidencia={evidencia} onArchivo={manejarArchivo} onQuitar={() => setEvidencia(null)} />
                {notaDirigida.trim().length === 0 && <p className="mt-3 text-[13px] text-[var(--text-tertiary)]">Escribe una nota para poder guardar.</p>}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  disabled={notaDirigida.trim().length === 0}
                  onClick={() => prepararRedaccion(notaDirigida, 'dirigida', 'dirigida-nota')}
                  className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
                >
                  RAÍZ organiza tu observación
                </motion.button>
              </>
            )}
          </motion.div>
        )}

        {paso === 'redaccion' && nino && redaccionSugerida && (
          <motion.div key="redaccion" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Sobre {nino.nombre}</p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              RAÍZ organizó tu observación
            </h1>

            <div className="mt-5 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
              <Etiqueta>Nota original</Etiqueta>
              <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--text-secondary)]">{notaEnRevision}</p>
            </div>

            <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
              <Etiqueta>Observación profesional sugerida</Etiqueta>
              {editandoRedaccion ? (
                <textarea
                  autoFocus
                  value={redaccionTrabajo}
                  onChange={(e) => setRedaccionTrabajo(e.target.value)}
                  rows={5}
                  className="mt-2 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
              ) : redaccionTrabajo ? (
                <p className="mt-1.5 text-[15px] leading-relaxed text-[var(--text-primary)]">{redaccionTrabajo}</p>
              ) : (
                <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--text-tertiary)]">
                  No encontramos suficientes hechos observables para redactar algo objetivo — puedes escribir tu propia versión con “Editar”.
                </p>
              )}
            </div>

            {redaccionSugerida.excluidas.length > 0 && (
              <p className="mt-3 text-[12px] leading-snug text-[var(--text-tertiary)]">
                No incluimos: {redaccionSugerida.excluidas.map((ex, i) => (
                  <span key={i}>
                    “{ex.fragmento}” ({ex.motivo}){i < redaccionSugerida.excluidas.length - 1 ? '; ' : '.'}
                  </span>
                ))}
              </p>
            )}

            {redaccionSugerida.aclaracionDisponible && !aclaracionDescartada && (
              <div className="mt-3 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_12%,transparent)] p-4">
                <p className="text-[13px] leading-snug text-[var(--text-primary)]">{redaccionSugerida.aclaracionDisponible.pregunta}</p>
                <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">Opcional — solo si quieres documentar ese momento con precisión.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {redaccionSugerida.aclaracionDisponible.opciones.map((op) => (
                    <Chip key={op} label={op} activo={false} onClick={() => regenerarConAclaracion(op)} />
                  ))}
                  <button type="button" onClick={() => setAclaracionDescartada(true)} className="text-[13px] font-semibold text-[var(--text-secondary)] underline">
                    No es necesario
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5 flex flex-col gap-2">
              {editandoRedaccion ? (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => confirmarRedaccion('usar')}
                  className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
                >
                  Guardar esta versión
                </motion.button>
              ) : (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    disabled={!redaccionTrabajo}
                    onClick={() => confirmarRedaccion('usar')}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
                  >
                    <LeafCheck size={16} />
                    Usar esta redacción
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setEditandoRedaccion(true)}
                    className="flex h-11 w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[14px] font-semibold text-[var(--text-primary)]"
                  >
                    ✎ Editar
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => confirmarRedaccion('mantener')}
                className="mt-1 text-center text-[13px] font-semibold text-[var(--text-secondary)] underline"
              >
                ↩ Mantener mi nota / No usar redacción todavía
              </button>
            </div>
          </motion.div>
        )}

        {paso === 'espontanea-entrada' && nino && (
          <motion.div key="espontanea-entrada" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Sobre {nino.nombre} · Observación libre</p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Cuéntame qué viste
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              No necesitas saber a qué habilidad pertenece — después RAÍZ te ayuda a organizarlo.
            </p>

            <div className="mt-4">
              <TogleEscribirHablar />
            </div>

            <textarea
              autoFocus
              value={notaEspontanea}
              onChange={(e) => setNotaEspontanea(e.target.value)}
              placeholder="Ej: Mateo estaba jugando con bloques pequeños. Primero intentó agarrarlos con toda la mano, pero después tomó dos usando el índice y el pulgar y los metió dentro de un recipiente."
              rows={6}
              className="mt-4 w-full resize-none rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />

            <BloqueEvidencia evidencia={evidencia} onArchivo={manejarArchivo} onQuitar={() => setEvidencia(null)} />

            {notaEspontanea.trim().length === 0 && <p className="mt-3 text-[13px] text-[var(--text-tertiary)]">Escribe una nota para continuar.</p>}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={notaEspontanea.trim().length === 0}
              onClick={() => prepararRedaccion(notaEspontanea, 'espontanea', 'espontanea-entrada')}
              className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
              RAÍZ organiza tu observación
            </motion.button>
            <button
              type="button"
              disabled={notaEspontanea.trim().length === 0 || guardando}
              onClick={() => guardarEspontanea([])}
              className="mt-3 w-full text-center text-[14px] font-semibold text-[var(--text-secondary)] underline disabled:opacity-40"
            >
              Guardar sin clasificar
            </button>
          </motion.div>
        )}

        {paso === 'espontanea-sugerencias' && nino && (
          <motion.div key="espontanea-sugerencias" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Sobre {nino.nombre}</p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Encontré posibles áreas relacionadas
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Análisis de ejemplo — el análisis real llega con el servicio de IA. Revísalas: nada queda aceptado hasta que tú lo confirmes.
            </p>

            <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4 text-[14px] leading-snug text-[var(--text-secondary)]">
              “{redaccionConfirmada ?? notaEnRevision}”
            </div>

            {sugerencias.length === 0 ? (
              <p className="mt-5 text-[14px] text-[var(--text-secondary)]">
                No encontramos áreas claras en esta nota — puedes guardarla igual y clasificarla más tarde.
              </p>
            ) : (
              <ul className="mt-5 flex flex-col gap-2">
                {sugerencias.map((s) => (
                  <li
                    key={s.skillId}
                    className={`rounded-[var(--radius-card)] p-4 transition-colors ${
                      s.estado === 'aceptado'
                        ? 'bg-[color-mix(in_oklab,var(--sage)_16%,transparent)]'
                        : s.estado === 'rechazado'
                          ? 'bg-[var(--surface-2)] opacity-50'
                          : 'bg-[var(--surface-2)]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-[var(--text-primary)]">{s.nombre}</span>
                        {s.evidenciaTextual && (
                          <span className="mt-0.5 block text-[13px] leading-snug text-[var(--text-secondary)]">Evidencia: “{s.evidenciaTextual}”</span>
                        )}
                        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                          {s.estado === 'aceptado' ? 'Aceptado' : s.estado === 'rechazado' ? 'Rechazado' : 'Sugerido · sin revisar'}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setSugerencias((prev) => prev.map((p) => (p.skillId === s.skillId ? { ...p, estado: 'aceptado' } : p)))}
                        aria-pressed={s.estado === 'aceptado'}
                        className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] text-[13px] font-semibold transition-colors ${
                          s.estado === 'aceptado' ? 'bg-[var(--sage)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--text-primary)]'
                        }`}
                      >
                        <LeafCheck size={13} negativo={false} />
                        Aceptar
                      </button>
                      <button
                        type="button"
                        onClick={() => setSugerencias((prev) => prev.map((p) => (p.skillId === s.skillId ? { ...p, estado: 'rechazado' } : p)))}
                        aria-pressed={s.estado === 'rechazado'}
                        className={`flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[var(--radius-button)] text-[13px] font-semibold transition-colors ${
                          s.estado === 'rechazado' ? 'bg-[var(--coral)] text-[var(--bg)]' : 'bg-[var(--surface)] text-[var(--text-primary)]'
                        }`}
                      >
                        <X size={13} aria-hidden="true" />
                        Rechazar
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {agregandoArea ? (
              <div className="mt-3 flex flex-col gap-2">
                {areasDisponiblesParaAgregar.length === 0 && (
                  <p className="text-[13px] text-[var(--text-tertiary)]">No hay más habilidades del perfil de {nino.nombre} para agregar.</p>
                )}
                {areasDisponiblesParaAgregar.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSugerencias((prev) => [...prev, { skillId: s.id, nombre: s.nombre, evidenciaTextual: '', origen: 'maestra', estado: 'aceptado' }]);
                      setAgregandoArea(false);
                    }}
                    className="rounded-[var(--radius-card)] bg-[var(--surface)] p-3 text-left text-[14px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-1)]"
                  >
                    {s.nombre}
                  </button>
                ))}
              </div>
            ) : (
              <button type="button" onClick={() => setAgregandoArea(true)} className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--accent)]">
                <Plus size={16} aria-hidden="true" />
                Agregar otra área
              </button>
            )}

            <BloqueEvidencia evidencia={evidencia} onArchivo={manejarArchivo} onQuitar={() => setEvidencia(null)} />

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={guardando}
              onClick={() => guardarEspontanea(sugerencias)}
              className="mt-5 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar observación'}
            </motion.button>
            <button type="button" disabled={guardando} onClick={() => guardarEspontanea([])} className="mt-3 w-full text-center text-[14px] font-semibold text-[var(--text-secondary)] underline disabled:opacity-40">
              Guardar sin clasificar
            </button>
          </motion.div>
        )}

        {paso === 'listo' && nino && resultado && (
          <motion.div key="listo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center pt-10 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]">
              <LeafCheck size={36} />
            </span>
            <h1 className="mt-5 text-balance text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">Observación guardada</h1>
            {resultado.skills.filter((s) => s.estado === 'aceptado').length > 0 ? (
              <div className="mt-4 flex w-full flex-col gap-2 text-left">
                {resultado.skills
                  .filter((s) => s.estado === 'aceptado')
                  .map((s) => (
                    <div key={s.skillId} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] px-4 py-2.5 text-[14px] font-medium text-[var(--text-primary)]">
                      Nueva evidencia para revisar &quot;{s.nombreSkill}&quot; — tú decides si actualiza su perfil.
                    </div>
                  ))}
              </div>
            ) : resultado.observacion.triggeredBySkillId ? (
              <p className="mt-2 max-w-[32ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
                Quedó registrada la oportunidad — sin evidencia todavía de {skillDirigido?.nombre ?? 'esta habilidad'}.
              </p>
            ) : (
              <p className="mt-2 max-w-[32ch] text-[15px] leading-relaxed text-[var(--text-secondary)]">
                Guardada en el historial de {nino.nombre} sin clasificar todavía.
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push(`/observaciones/${resultado.observacion.id}`)}
              className="mt-8 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)]"
            >
              Ver la observación
            </button>
            <button type="button" onClick={() => router.push('/hoy')} className="mt-3 text-[14px] font-semibold text-[var(--text-secondary)] underline">
              Volver a Hoy
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

export default function Observar() {
  return (
    <Suspense fallback={null}>
      <ObservarContenido />
    </Suspense>
  );
}
