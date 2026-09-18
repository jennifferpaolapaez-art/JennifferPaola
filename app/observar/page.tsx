'use client';

// REGISTRAR OBSERVACIÓN — 3ra función núcleo del MVP (Constitución del Producto, ESTADO.md).
// Regla dura del usuario (Sesión 5, ronda 4): "la maestra puede observar sin saber cómo
// clasificar lo que vio. RAÍZ ayuda a organizarlo después." Dos caminos hacia el mismo historial:
//   (a) DIRIGIDA — toca una habilidad ya sugerida (o una micro-observación de opciones rápidas,
//       ej. Tijeras) → el skill queda aceptado de una vez, sin paso de sugerencia — EXCEPTO si la
//       opción elegida no representa evidencia real (ej. "No observado"), donde no se crea ninguna
//       fila de skill (Sesión 6 paso 6).
//   (b) ESPONTÁNEA — escribe/dicta libremente sin elegir ningún skill antes → RAÍZ ANALIZA (
//       simulación local por palabra clave, NUNCA IA real todavía — eso llega con el servicio de
//       IA en la fase de servicios externos, 30) y sugiere posibles skills; la maestra acepta,
//       rechaza, agrega otra área, o guarda sin clasificar. 0, 1 o varios skills por observación.
//
// Sesión 6 paso 6 — ÚNICO formulario, 3 puntos de entrada: sin parámetros arranca eligiendo niño
// (desde el módulo Observaciones); con `ninoId` salta directo a "¿qué observaste?" (desde Perfil/
// Niño foco); con `ninoId`+`skillId`(+`actividadId`) entra directo al camino dirigido de esa
// habilidad con el contexto ya enlazado (desde Hoy/Actividad). Cero lógica duplicada — Hoy/
// Actividad/Perfil/Observaciones solo arman el link con esos query params.
// Ahora SÍ persiste (antes solo vivía en estado local y se perdía al salir) y, si nace de un niño
// foco real de una actividad, marca ese foco como "observado" y lo enlaza — cierra el ciclo
// Planeación → Observación sin dejarla aislada (regla del usuario).
// Regla dura (Sesión 6 paso 6): guardar una observación NUNCA toca `Nino.skills` — solo agrega
// evidencia; el cambio de estado vivo sigue requiriendo una acción separada y explícita.

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'motion/react';
import { ArrowLeft, Camera, Keyboard, Mic, Plus, X } from 'lucide-react';
import { AppShell, AvatarInicial, LeafCheck, SkillBadge } from '@/components/app/shell';
import {
  leerNinos,
  TINT_HEX,
  FECHA_HOY,
  STAFF_ACTUAL_ID,
  OPCIONES_RAPIDAS_POR_SKILL,
  analizarNotaSimulado,
  agregarObservacion,
  marcarNinoFocoObservado,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type OrigenRelacionSkill,
  type EstadoRelacionSkill,
  type OpcionRapida,
} from '@/lib/seed-data';

type Paso = 'nino' | 'camino' | 'dirigida-nota' | 'espontanea-entrada' | 'espontanea-sugerencias' | 'listo';

interface SugerenciaUI {
  skillId: string;
  nombre: string;
  evidenciaTextual: string;
  origen: OrigenRelacionSkill;
  estado: EstadoRelacionSkill;
}

function ObservarContenido() {
  const router = useRouter();
  const params = useSearchParams();
  const reduce = useReducedMotion();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ninoIdParam = params.get('ninoId');
  const actividadIdParam = params.get('actividadId') ?? undefined;
  const skillIdParam = params.get('skillId');

  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);
  const [paso, setPaso] = useState<Paso>('nino');
  const [ninoId, setNinoId] = useState<string | null>(null);
  const [entradaConContexto, setEntradaConContexto] = useState(false);

  // Camino A — dirigida
  const [skillDirigidoId, setSkillDirigidoId] = useState<string | null>(null);
  const [notaDirigida, setNotaDirigida] = useState('');
  const [opcionRapida, setOpcionRapida] = useState<OpcionRapida | null>(null);

  // Camino B — espontánea
  const [notaEspontanea, setNotaEspontanea] = useState('');
  const [evidencia, setEvidencia] = useState<{ nombre: string; url: string } | null>(null);
  const [analizando, setAnalizando] = useState(false);
  const [sugerencias, setSugerencias] = useState<SugerenciaUI[]>([]);
  const [agregandoArea, setAgregandoArea] = useState(false);

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
  const opcionesRapidas = skillDirigidoId ? OPCIONES_RAPIDAS_POR_SKILL[skillDirigidoId] : undefined;
  const areasDisponiblesParaAgregar = nino?.skills.filter((s) => !sugerencias.some((sg) => sg.skillId === s.id)) ?? [];

  const item: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 10 },
    visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0.15 : 0.3, ease: [0.16, 1, 0.3, 1] } },
  };

  const ANTERIOR: Record<Exclude<Paso, 'nino' | 'listo'>, Paso> = {
    camino: 'nino',
    'dirigida-nota': 'camino',
    'espontanea-entrada': 'camino',
    'espontanea-sugerencias': 'espontanea-entrada',
  };

  function manejarArchivo(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setEvidencia({ nombre: archivo.name, url: URL.createObjectURL(archivo) });
  }

  /** Si esta observación nace de un niño foco real de una actividad (mismo skill), cierra el
   * ciclo: marca ese foco como observado y lo enlaza — nunca toca `estadoDesarrollo`/
   * `estadoEvidencia`, solo el estado del foco puntual. */
  function cerrarCicloDeFocoSiAplica(observationId: string, skillIdAceptado?: string) {
    if (!actividadIdParam || !ninoId || !skillIdAceptado) return;
    marcarNinoFocoObservado(actividadIdParam, ninoId, observationId);
  }

  function guardarDirigida() {
    if (!nino || !skillDirigidoId) return;
    setGuardando(true);
    setTimeout(() => {
      const obsId = `obs-${Date.now()}`;
      const notaFinal = opcionRapida ? opcionRapida.texto : notaDirigida.trim();
      const nombreSkillMostrado = skillDirigido?.nombre ?? nombreSkillDirigidoCatalogo;
      const observacion: Observacion = {
        id: obsId,
        ninoId: nino.id,
        actividadId: actividadIdParam,
        fecha: FECHA_HOY,
        origen: 'dirigida',
        fuente: opcionRapida ? 'seleccion_rapida' : 'texto',
        notaOriginal: notaFinal,
        triggeredBySkillId: skillDirigidoId,
        autorId: STAFF_ACTUAL_ID,
        evidenciaArchivoNombre: evidencia?.nombre,
      };
      // Regla del usuario (Sesión 6 paso 6): una opción sin evidencia real (ej. "No observado")
      // NUNCA genera una fila de skill — la oportunidad queda registrada, no la evidencia.
      const esEvidencia = opcionRapida ? opcionRapida.esEvidencia : true;
      const skills: ObservacionSkill[] = esEvidencia
        ? [{ observacionId: obsId, skillId: skillDirigidoId, nombreSkill: nombreSkillMostrado, origen: 'observacion_dirigida', estado: 'aceptado' }]
        : [];
      agregarObservacion(observacion, skills);
      if (esEvidencia) cerrarCicloDeFocoSiAplica(obsId, skillDirigidoId);
      setResultado({ observacion, skills });
      setGuardando(false);
      setPaso('listo');
    }, 600);
  }

  function analizarConRaiz() {
    setAnalizando(true);
    // Simulación local por palabra clave — NUNCA IA real todavía (ver seed-data.ts,
    // analizarNotaSimulado). El análisis real llega con el servicio de IA server-side (30).
    setTimeout(() => {
      const encontradas = analizarNotaSimulado(notaEspontanea);
      // Regla del usuario (Sesión 6 paso 6): una sugerencia de RAÍZ arranca en 'sugerido' — NUNCA
      // se auto-acepta. La maestra tiene que aceptarla o rechazarla explícitamente.
      setSugerencias(encontradas.map((e) => ({ ...e, origen: 'raiz', estado: 'sugerido' })));
      setAnalizando(false);
      setPaso('espontanea-sugerencias');
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
        notaOriginal: notaEspontanea.trim(),
        autorId: STAFF_ACTUAL_ID,
        evidenciaArchivoNombre: evidencia?.nombre,
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
      setPaso('listo');
    }, 600);
  }

  if (!cargado) return null;

  return (
    <AppShell>
      <div className="mb-4">
        {paso !== 'listo' && !(entradaConContexto && paso === 'camino') && (
          <button
            type="button"
            onClick={() => (paso === 'nino' ? router.push('/hoy') : setPaso(ANTERIOR[paso]))}
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
                <button
                  type="button"
                  onClick={() => router.push('/ninos/nuevo')}
                  className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline"
                >
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
                        setPaso('camino');
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
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              Sobre {nino.nombre}
            </p>
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
                      setPaso('dirigida-nota');
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
                setPaso('espontanea-entrada');
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
              {nino.nombre} · {skillDirigido?.nombre ?? nombreSkillDirigidoCatalogo}
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
                {opcionRapida && !opcionRapida.esEvidencia && (
                  <p className="mt-3 text-[13px] leading-snug text-[var(--text-secondary)]">
                    Queda registrada la oportunidad de observarlo — esto NO cuenta como evidencia de {skillDirigido?.nombre ?? 'esta habilidad'}.
                  </p>
                )}
              </>
            ) : (
              <>
                <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
                  RAIZ lo convierte en documentación profesional para la familia.
                </p>
                <textarea
                  autoFocus
                  value={notaDirigida}
                  onChange={(e) => setNotaDirigida(e.target.value)}
                  placeholder="Ej: hoy usó las tijeras solo, sin ayuda, en las 3 líneas rectas."
                  rows={5}
                  className="mt-5 w-full resize-none rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
              </>
            )}

            {!opcionRapida && notaDirigida.trim().length === 0 && (
              <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">
                {opcionesRapidas ? 'Elige una opción para poder guardar.' : 'Escribe una nota para poder guardar.'}
              </p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={(!opcionRapida && notaDirigida.trim().length === 0) || guardando}
              onClick={guardarDirigida}
              className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar observación'}
            </motion.button>
          </motion.div>
        )}

        {paso === 'espontanea-entrada' && nino && (
          <motion.div key="espontanea-entrada" initial="hidden" animate="visible" exit={{ opacity: 0 }} variants={item}>
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              Sobre {nino.nombre} · Observación libre
            </p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Cuéntame qué viste
            </h1>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              No necesitas saber a qué habilidad pertenece — después RAÍZ te ayuda a organizarlo.
            </p>

            <div className="mt-4 flex gap-2">
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

            <textarea
              autoFocus
              value={notaEspontanea}
              onChange={(e) => setNotaEspontanea(e.target.value)}
              placeholder="Ej: Mateo estaba jugando con bloques pequeños. Primero intentó agarrarlos con toda la mano, pero después tomó dos usando el índice y el pulgar y los metió dentro de un recipiente."
              rows={6}
              className="mt-4 w-full resize-none rounded-[var(--radius-card)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-4 text-[15px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />

            <input ref={fileInputRef} type="file" accept="image/*" onChange={manejarArchivo} className="hidden" />
            {evidencia ? (
              <div className="mt-3 flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                <img src={evidencia.url} alt="" className="size-12 rounded-[calc(var(--radius-button)-4px)] object-cover" />
                <span className="min-w-0 flex-1 truncate text-[13px] text-[var(--text-secondary)]">{evidencia.nombre}</span>
                <button
                  type="button"
                  onClick={() => setEvidencia(null)}
                  aria-label="Quitar evidencia"
                  className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)] hover:bg-[var(--surface)]"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--accent)]"
              >
                <Camera size={16} aria-hidden="true" />
                Agregar foto (se guarda solo el nombre por ahora — sin almacenamiento real todavía)
              </button>
            )}

            {notaEspontanea.trim().length === 0 && (
              <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">Escribe una nota para continuar.</p>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={notaEspontanea.trim().length === 0 || analizando}
              onClick={analizarConRaiz}
              className="mt-4 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
              {analizando ? 'RAÍZ está analizando…' : 'RAÍZ analiza esta nota'}
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
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
              Sobre {nino.nombre}
            </p>
            <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Encontré posibles áreas relacionadas
            </h1>
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
              Análisis de ejemplo — el análisis real llega con el servicio de IA. Revísalas: nada queda aceptado hasta que tú lo confirmes.
            </p>

            <div className="mt-4 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4 text-[14px] leading-snug text-[var(--text-secondary)]">
              “{notaEspontanea}”
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
                          <span className="mt-0.5 block text-[13px] leading-snug text-[var(--text-secondary)]">
                            Evidencia: “{s.evidenciaTextual}”
                          </span>
                        )}
                        <span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">
                          {s.estado === 'aceptado' ? 'Aceptado' : s.estado === 'rechazado' ? 'Rechazado' : 'Sugerido · sin revisar'}
                        </span>
                      </span>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSugerencias((prev) => prev.map((p) => (p.skillId === s.skillId ? { ...p, estado: 'aceptado' } : p)))
                        }
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
                        onClick={() =>
                          setSugerencias((prev) => prev.map((p) => (p.skillId === s.skillId ? { ...p, estado: 'rechazado' } : p)))
                        }
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
                      // Agregada a mano por la maestra — ya es una decisión explícita, entra
                      // directo como aceptada (no como sugerencia de RAÍZ sin revisar).
                      setSugerencias((prev) => [
                        ...prev,
                        { skillId: s.id, nombre: s.nombre, evidenciaTextual: '', origen: 'maestra', estado: 'aceptado' },
                      ]);
                      setAgregandoArea(false);
                    }}
                    className="rounded-[var(--radius-card)] bg-[var(--surface)] p-3 text-left text-[14px] font-medium text-[var(--text-primary)] shadow-[var(--shadow-1)]"
                  >
                    {s.nombre}
                  </button>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAgregandoArea(true)}
                className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--accent)]"
              >
                <Plus size={16} aria-hidden="true" />
                Agregar otra área
              </button>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              disabled={guardando}
              onClick={() => guardarEspontanea(sugerencias)}
              className="mt-5 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
            >
              {guardando ? 'Guardando…' : 'Guardar observación'}
            </motion.button>
            <button
              type="button"
              disabled={guardando}
              onClick={() => guardarEspontanea([])}
              className="mt-3 w-full text-center text-[14px] font-semibold text-[var(--text-secondary)] underline disabled:opacity-40"
            >
              Guardar sin clasificar
            </button>
          </motion.div>
        )}

        {paso === 'listo' && nino && resultado && (
          <motion.div
            key="listo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center pt-10 text-center"
          >
            <span className="flex size-16 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_14%,transparent)]">
              <LeafCheck size={36} />
            </span>
            <h1 className="mt-5 text-balance text-[22px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
              Observación guardada
            </h1>
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
              onClick={() => router.push(`/ninos/${nino.id}`)}
              className="mt-8 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)]"
            >
              Ver perfil de {nino.nombre}
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
