'use client';

// CONFIGURACIÓN DEL PROGRAMA — paso 2 del núcleo funcional acordado con el usuario (Sesión 6).
// Es la raíz de todo lo demás: rutina, evaluaciones, tracks, planeación con/sin niños. Persiste
// en localStorage por ahora (Supabase llega en el paso 8, después de que el núcleo esté sólido —
// ver ESTADO.md). Diseñada para NUNCA sentirse como un formulario que atrapa: todo vive en
// secciones plegables independientes (<Colapsable>), se puede guardar y volver a editar cuando
// sea, sin pasos bloqueantes.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useReducedMotion, type Variants } from 'motion/react';
import { ArrowLeft, ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { AppShell, Colapsable, LeafCheck } from '@/components/app/shell';
import {
  BLOQUE_LABEL,
  ETAPAS_ATENDIDAS_ORDEN,
  FRECUENCIA_EVALUACION_LABEL,
  IDIOMAS_ENSENANZA_SUGERIDOS,
  METODOLOGIAS,
  PRACTICA_A_EVITAR_LABEL,
  PRIORIDADES_PEDAGOGICAS_SUGERIDAS,
  PROGRAMA_CONFIG_DEFAULT,
  TRACK_LABEL,
  guardarProgramaConfig,
  leerProgramaConfig,
  type Bloque,
  type BloqueRutina,
  type DiaSemana,
  type EtapaAtendida,
  type FrecuenciaEvaluacion,
  type Metodologia,
  type PracticaAEvitar,
  type ProgramaConfig,
  type TipoPrograma,
  type TrackOpcional,
} from '@/lib/seed-data';

const TIPOS_PROGRAMA: TipoPrograma[] = ['Home Daycare / Family Child Care', 'Preschool', 'Pre-K', 'Child Care Center', 'Otro'];
const TRACKS: TrackOpcional[] = ['kindergarten_readiness', 'school_readiness', 'pre_literacy', 'pre_math', 'bilingual_language_focus'];
const FRECUENCIAS: FrecuenciaEvaluacion[] = ['trimestral', 'semestral', 'anual', 'personalizada'];
const PRACTICAS: PracticaAEvitar[] = ['comida_sensorial', 'glitter', 'worksheets', 'pantallas', 'otro'];
const BLOQUES_DISPONIBLES: Bloque[] = ['circle', 'principal', 'outdoor', 'steam', 'centros', 'lectura', 'musica', 'prek', 'cierre', 'transicion', 'custom'];
const DIAS: DiaSemana[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

function Chip({ label, activo, onClick }: { label: string; activo: boolean; onClick: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      type="button"
      aria-pressed={activo}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-[var(--radius-button)] px-3.5 py-2 text-[13px] font-semibold transition-colors duration-150 ${
        activo ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-primary)]'
      }`}
    >
      {label}
    </motion.button>
  );
}

/** Selector de varios elementos de una lista sugerida + posibilidad de agregar uno propio —
 * mismo patrón para idiomas de enseñanza y prioridades pedagógicas (regla del usuario: "no quiero
 * que sean exclusivamente texto libre si RAÍZ las va a usar para lógica, pero tampoco quiero
 * limitar cuántas puede elegir"). */
function SelectorConPersonalizado({
  sugeridos,
  seleccionados,
  onChange,
  placeholderAgregar,
}: {
  sugeridos: string[];
  seleccionados: string[];
  onChange: (valores: string[]) => void;
  placeholderAgregar: string;
}) {
  const [nuevo, setNuevo] = useState('');
  const todas = Array.from(new Set([...sugeridos, ...seleccionados]));

  function alternar(valor: string) {
    onChange(seleccionados.includes(valor) ? seleccionados.filter((v) => v !== valor) : [...seleccionados, valor]);
  }

  function agregar() {
    const v = nuevo.trim();
    if (!v || seleccionados.includes(v)) return;
    onChange([...seleccionados, v]);
    setNuevo('');
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {todas.map((v) => (
          <Chip key={v} label={v} activo={seleccionados.includes(v)} onClick={() => alternar(v)} />
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          value={nuevo}
          onChange={(e) => setNuevo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregar())}
          placeholder={placeholderAgregar}
          className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />
        <button
          type="button"
          onClick={agregar}
          disabled={!nuevo.trim()}
          aria-label="Agregar"
          className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[var(--text-primary)] disabled:opacity-40"
        >
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function BloqueEditor({
  bloqueItem,
  index,
  total,
  onCambiar,
  onEliminar,
  onMover,
}: {
  bloqueItem: BloqueRutina;
  index: number;
  total: number;
  onCambiar: (cambios: Partial<BloqueRutina>) => void;
  onEliminar: () => void;
  onMover: (direccion: -1 | 1) => void;
}) {
  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
      <div className="flex items-center gap-2">
        <select
          value={bloqueItem.bloque}
          onChange={(e) => onCambiar({ bloque: e.target.value as Bloque })}
          className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3 text-[14px] text-[var(--text-primary)] outline-none"
        >
          {BLOQUES_DISPONIBLES.map((b) => (
            <option key={b} value={b}>
              {BLOQUE_LABEL[b]}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => onMover(-1)} disabled={index === 0} aria-label="Subir bloque" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] disabled:opacity-30">
          <ArrowUp size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={() => onMover(1)} disabled={index === total - 1} aria-label="Bajar bloque" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-secondary)] disabled:opacity-30">
          <ArrowDown size={16} aria-hidden="true" />
        </button>
        <button type="button" onClick={onEliminar} aria-label="Eliminar bloque" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--coral)] hover:bg-[var(--surface)]">
          <Trash2 size={16} aria-hidden="true" />
        </button>
      </div>

      {bloqueItem.bloque === 'custom' && (
        <input
          value={bloqueItem.nombrePersonalizado ?? ''}
          onChange={(e) => onCambiar({ nombrePersonalizado: e.target.value })}
          placeholder="Nombre de este bloque"
          className="mt-3 min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />
      )}

      <div className="mt-3 flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Hora aproximada</label>
          <input
            value={bloqueItem.horaAproximada}
            onChange={(e) => onCambiar({ horaAproximada: e.target.value })}
            placeholder="9:30"
            className="min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Duración (min)</label>
          <input
            type="number"
            min={5}
            value={bloqueItem.duracionMin}
            onChange={(e) => onCambiar({ duracionMin: Number(e.target.value) || 0 })}
            className="min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
          />
        </div>
      </div>

      <label className="mb-1 mt-3 block text-[12px] font-medium text-[var(--text-tertiary)]">Días</label>
      <div className="flex flex-wrap gap-1.5">
        {DIAS.map((d) => (
          <Chip
            key={d}
            label={d}
            activo={bloqueItem.dias.includes(d)}
            onClick={() =>
              onCambiar({ dias: bloqueItem.dias.includes(d) ? bloqueItem.dias.filter((x) => x !== d) : [...bloqueItem.dias, d] })
            }
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onCambiar({ activo: !bloqueItem.activo })}
        aria-pressed={bloqueItem.activo}
        className="mt-3 flex items-center gap-2 text-[13px] font-semibold text-[var(--text-secondary)]"
      >
        <span
          className="flex size-5 items-center justify-center rounded-[6px]"
          style={{ background: bloqueItem.activo ? 'var(--sage)' : 'transparent', border: bloqueItem.activo ? 'none' : '2px solid var(--text-tertiary)' }}
        >
          {bloqueItem.activo && <LeafCheck size={12} />}
        </span>
        {bloqueItem.activo ? 'Bloque activo' : 'Bloque inactivo (no aparece en la planeación)'}
      </button>
    </div>
  );
}

export default function ConfiguracionPrograma() {
  const router = useRouter();
  const reduce = useReducedMotion();
  const [config, setConfig] = useState<ProgramaConfig>(PROGRAMA_CONFIG_DEFAULT);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    setConfig(leerProgramaConfig());
  }, []);

  function actualizar<K extends keyof ProgramaConfig>(campo: K, valor: ProgramaConfig[K]) {
    setConfig((c) => ({ ...c, [campo]: valor }));
    setGuardado(false);
  }

  function alternarEnArray<T>(campo: keyof ProgramaConfig, valor: T) {
    setConfig((c) => {
      const actual = c[campo] as unknown as T[];
      const nuevo = actual.includes(valor) ? actual.filter((v) => v !== valor) : [...actual, valor];
      return { ...c, [campo]: nuevo };
    });
    setGuardado(false);
  }

  function cambiarBloque(idx: number, cambios: Partial<BloqueRutina>) {
    setConfig((c) => ({ ...c, rutinaBloques: c.rutinaBloques.map((b, i) => (i === idx ? { ...b, ...cambios } : b)) }));
    setGuardado(false);
  }

  function eliminarBloque(idx: number) {
    setConfig((c) => ({ ...c, rutinaBloques: c.rutinaBloques.filter((_, i) => i !== idx) }));
    setGuardado(false);
  }

  function moverBloque(idx: number, direccion: -1 | 1) {
    setConfig((c) => {
      const copia = [...c.rutinaBloques];
      const destino = idx + direccion;
      if (destino < 0 || destino >= copia.length) return c;
      [copia[idx], copia[destino]] = [copia[destino], copia[idx]];
      return { ...c, rutinaBloques: copia.map((b, i) => ({ ...b, orden: i + 1 })) };
    });
    setGuardado(false);
  }

  function agregarBloque() {
    setConfig((c) => ({
      ...c,
      rutinaBloques: [
        ...c.rutinaBloques,
        { bloque: 'circle' as Bloque, horaAproximada: '9:00', duracionMin: 15, orden: c.rutinaBloques.length + 1, dias: [], activo: true },
      ],
    }));
    setGuardado(false);
  }

  function guardar() {
    guardarProgramaConfig(config);
    setGuardado(true);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push('/ninos')}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Configuración</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Tu programa
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Esto es lo que RAÍZ usa para personalizar todo lo demás. Puedes cambiarlo cuando quieras.
          </p>
        </motion.header>

        <motion.div variants={item} className="flex flex-col gap-3">
          <Colapsable titulo="Mi programa" subtitulo="Nombre y tipo" defaultAbierto>
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Nombre del programa o salón</label>
            <input
              value={config.nombrePrograma}
              onChange={(e) => actualizar('nombrePrograma', e.target.value)}
              className="mb-4 min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Tipo de programa</label>
            <div className="flex flex-wrap gap-2">
              {TIPOS_PROGRAMA.map((t) => (
                <Chip key={t} label={t} activo={config.tipoPrograma === t} onClick={() => actualizar('tipoPrograma', t)} />
              ))}
            </div>
          </Colapsable>

          <Colapsable titulo="A quién enseño" subtitulo="Edades y etapas que atiende tu programa">
            <div className="flex flex-wrap gap-2">
              {ETAPAS_ATENDIDAS_ORDEN.map((e: EtapaAtendida) => (
                <Chip key={e} label={e} activo={config.etapasAtendidas.includes(e)} onClick={() => alternarEnArray('etapasAtendidas', e)} />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">Puedes elegir varias — RAÍZ soporta grupos multiedad.</p>
          </Colapsable>

          <Colapsable titulo="Cómo enseño" subtitulo="Metodología o combinación">
            <div className="flex flex-wrap gap-2">
              {METODOLOGIAS.map((m: Metodologia) => (
                <Chip key={m} label={m} activo={config.metodologias.includes(m)} onClick={() => alternarEnArray('metodologias', m)} />
              ))}
            </div>
            <textarea
              value={config.metodologiaDescripcionAdicional ?? ''}
              onChange={(e) => actualizar('metodologiaDescripcionAdicional', e.target.value)}
              placeholder="Descripción adicional (opcional) — ej. cómo combinas estos enfoques en tu salón"
              rows={2}
              className="mt-3 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </Colapsable>

          <Colapsable titulo="Idiomas" subtitulo="De enseñanza y de reportes">
            <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">Idiomas de enseñanza</label>
            <SelectorConPersonalizado
              sugeridos={IDIOMAS_ENSENANZA_SUGERIDOS}
              seleccionados={config.idiomasEnsenanza}
              onChange={(v) => actualizar('idiomasEnsenanza', v)}
              placeholderAgregar="Agregar otro idioma"
            />
            <label className="mb-2 mt-5 block text-[13px] font-semibold text-[var(--text-primary)]">Idioma por defecto de reportes</label>
            <div className="flex flex-wrap gap-2">
              {['Español', 'English', ...config.idiomasEnsenanza].filter((v, i, arr) => arr.indexOf(v) === i).map((idi) => (
                <Chip key={idi} label={idi} activo={config.idiomaSalidaDefault === idi} onClick={() => actualizar('idiomaSalidaDefault', idi)} />
              ))}
            </div>
          </Colapsable>

          <Colapsable titulo="Qué quiero priorizar" subtitulo="Prioridades pedagógicas">
            <SelectorConPersonalizado
              sugeridos={PRIORIDADES_PEDAGOGICAS_SUGERIDAS}
              seleccionados={config.prioridadesPedagogicas}
              onChange={(v) => actualizar('prioridadesPedagogicas', v)}
              placeholderAgregar="Agregar una prioridad propia"
            />
          </Colapsable>

          <Colapsable titulo="Tracks opcionales" subtitulo="Solo si tu programa los activa">
            <div className="flex flex-wrap gap-2">
              {TRACKS.map((t) => (
                <Chip key={t} label={TRACK_LABEL[t]} activo={config.tracksActivos.includes(t)} onClick={() => alternarEnArray('tracksActivos', t)} />
              ))}
            </div>
            <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
              Una prioridad pedagógica no activa un track por sí sola — puedes tener "lenguaje" como prioridad sin encender Bilingual Focus.
            </p>
          </Colapsable>

          <Colapsable titulo="Evaluaciones" subtitulo="Frecuencia de revisión periódica">
            <div className="flex flex-wrap gap-2">
              {FRECUENCIAS.map((f) => (
                <Chip key={f} label={FRECUENCIA_EVALUACION_LABEL[f]} activo={config.frecuenciaEvaluacion === f} onClick={() => actualizar('frecuenciaEvaluacion', f)} />
              ))}
            </div>
            {config.frecuenciaEvaluacion === 'personalizada' && (
              <div className="mt-3">
                <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Cada cuántos meses</label>
                <input
                  type="number"
                  min={1}
                  value={config.frecuenciaEvaluacionMesesPersonalizada ?? ''}
                  onChange={(e) => actualizar('frecuenciaEvaluacionMesesPersonalizada', Number(e.target.value) || undefined)}
                  className="min-h-11 w-32 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                />
              </div>
            )}
            <p className="mt-2 text-[12px] text-[var(--text-tertiary)]">
              La evaluación de ingreso de cada niño es independiente de esta frecuencia.
            </p>
          </Colapsable>

          <Colapsable titulo="Mi rutina" subtitulo={`${config.rutinaBloques.length} bloques configurados`}>
            <div className="flex flex-col gap-3">
              {config.rutinaBloques.map((b, i) => (
                <BloqueEditor
                  key={i}
                  bloqueItem={b}
                  index={i}
                  total={config.rutinaBloques.length}
                  onCambiar={(c) => cambiarBloque(i, c)}
                  onEliminar={() => eliminarBloque(i)}
                  onMover={(d) => moverBloque(i, d)}
                />
              ))}
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              type="button"
              onClick={agregarBloque}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
            >
              <Plus size={16} aria-hidden="true" />
              Agregar bloque
            </motion.button>
            <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">
              Si un bloque está configurado para un día, aparece en la planeación de ese día — RAÍZ llena el contenido, tú defines la estructura.
            </p>
          </Colapsable>

          <Colapsable titulo="Preferencias" subtitulo="Cosas que prefiero evitar">
            <div className="flex flex-wrap gap-2">
              {PRACTICAS.map((p) => (
                <Chip key={p} label={PRACTICA_A_EVITAR_LABEL[p]} activo={config.practicasAEvitar.includes(p)} onClick={() => alternarEnArray('practicasAEvitar', p)} />
              ))}
            </div>
            <textarea
              value={config.preferenciasGeneralesTexto ?? ''}
              onChange={(e) => actualizar('preferenciasGeneralesTexto', e.target.value)}
              placeholder="Otras preferencias (opcional)"
              rows={2}
              className="mt-3 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </Colapsable>
        </motion.div>

        <motion.div variants={item} className="sticky bottom-20 mt-6">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={guardar}
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
          >
            {guardado ? (
              <>
                <LeafCheck size={18} />
                Guardado
              </>
            ) : (
              'Guardar cambios'
            )}
          </motion.button>
          <p className="mt-2 text-center text-[12px] text-[var(--text-tertiary)]">
            Puedes volver y editar esta configuración cuando quieras.
          </p>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
