'use client';

// AGREGAR EVALUACIÓN EXTERNA — ASQ-3, IEP, IFSP, speech/OT/PT... (Sesión 6, paso 4). SEPARADA de
// las evaluaciones propias de RAÍZ, nunca mezclada. RAÍZ no diagnostica — solo guarda lo
// pedagógicamente relevante. Sin almacenamiento real todavía: no se adjunta el archivo original.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import { guardarNinos, leerNinos, ninoPorId, type HallazgoEvaluacionExterna, type Nino, type TipoEvaluacionExterna } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const TIPOS: TipoEvaluacionExterna[] = ['ASQ-3', 'IFSP', 'IEP', 'speech_language', 'OT', 'PT', 'otro'];

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface HallazgoForm {
  clave: string;
  area: string;
  resumen: string;
  recomendacion: string;
}

export default function NuevaEvaluacionExterna() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);

  const [tipo, setTipo] = useState<TipoEvaluacionExterna>('ASQ-3');
  const [nombreInstrumento, setNombreInstrumento] = useState('');
  const [fecha, setFecha] = useState(hoyISO());
  const [profesional, setProfesional] = useState('');
  const [resumen, setResumen] = useState('');
  const [recomendaciones, setRecomendaciones] = useState('');
  const [permiso, setPermiso] = useState(false);
  const [hallazgos, setHallazgos] = useState<HallazgoForm[]>([]);

  useEffect(() => {
    setNinos(leerNinos());
    setCargado(true);
  }, []);

  const nino = ninoPorId(params.id, ninos);

  function agregarHallazgo() {
    setHallazgos((prev) => [...prev, { clave: `h-${Date.now()}`, area: '', resumen: '', recomendacion: '' }]);
  }
  function actualizarHallazgo(clave: string, cambios: Partial<HallazgoForm>) {
    setHallazgos((prev) => prev.map((h) => (h.clave === clave ? { ...h, ...cambios } : h)));
  }
  function eliminarHallazgo(clave: string) {
    setHallazgos((prev) => prev.filter((h) => h.clave !== clave));
  }

  function guardar() {
    if (!nino || !nombreInstrumento.trim()) return;
    const id = `ext-${Date.now()}`;
    const hallazgosFinal: HallazgoEvaluacionExterna[] = hallazgos
      .filter((h) => h.resumen.trim())
      .map((h) => ({ id: `hallazgo-${Date.now()}-${h.clave}`, area: h.area.trim() || 'General', resumen: h.resumen.trim(), recomendacion: h.recomendacion.trim() || undefined }));

    const ninoActualizado: Nino = {
      ...nino,
      evaluacionesExternas: [
        ...nino.evaluacionesExternas,
        {
          id,
          tipo,
          nombreInstrumento: nombreInstrumento.trim(),
          fecha,
          profesionalOEntidad: profesional.trim() || undefined,
          resumen: resumen.trim() || undefined,
          recomendaciones: recomendaciones.trim() || undefined,
          permisoUsoPedagogico: permiso,
          hallazgos: hallazgosFinal,
        },
      ],
    };
    guardarNinos(ninos.map((n) => (n.id === nino.id ? ninoActualizado : n)));
    router.push(`/ninos/${nino.id}`);
  }

  if (!cargado) return null;
  if (!nino) return null;

  const puedeGuardar = nombreInstrumento.trim().length > 0;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push(`/ninos/${nino.id}`)}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{nino.nombre}</p>
          <h1 className="mt-1 text-balance text-[22px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Evaluación o documento externo
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
            RAÍZ no diagnostica — solo guarda lo pedagógicamente relevante. El archivo original no se adjunta todavía.
          </p>
        </motion.header>

        <motion.div variants={item} className="flex flex-col gap-4">
          <div>
            <p className="mb-2 text-[12px] font-medium text-[var(--text-tertiary)]">Tipo</p>
            <div className="flex flex-wrap gap-2">
              {TIPOS.map((t) => (
                <Chip key={t} label={t} activo={tipo === t} onClick={() => setTipo(t)} />
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Nombre del instrumento o documento</label>
            <input
              value={nombreInstrumento}
              onChange={(e) => setNombreInstrumento(e.target.value)}
              placeholder="Ej: ASQ-3 — 24 meses"
              className="min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Fecha</label>
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Profesional o entidad (opcional)</label>
            <input
              value={profesional}
              onChange={(e) => setProfesional(e.target.value)}
              placeholder="Ej: Speech-Language Pathologist"
              className="min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Resumen</label>
            <textarea
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
              rows={3}
              placeholder="Lo relevante del documento, en tus palabras"
              className="w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </div>

          <div>
            <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Recomendaciones</label>
            <textarea
              value={recomendaciones}
              onChange={(e) => setRecomendaciones(e.target.value)}
              rows={2}
              placeholder="Qué recomendó el profesional"
              className="w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
            />
          </div>

          <button
            type="button"
            onClick={() => setPermiso((p) => !p)}
            aria-pressed={permiso}
            className="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]"
          >
            <span
              className="flex size-5 items-center justify-center rounded-[6px]"
              style={{ background: permiso ? 'var(--sage)' : 'transparent', border: permiso ? 'none' : '2px solid var(--text-tertiary)' }}
            />
            Tengo permiso para usar esta información pedagógicamente
          </button>

          <div>
            <p className="mb-2 text-[13px] font-semibold text-[var(--text-primary)]">Hallazgos puntuales (opcional)</p>
            <div className="flex flex-col gap-3">
              {hallazgos.map((h) => (
                <div key={h.clave} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5">
                  <div className="flex items-center gap-2">
                    <input
                      value={h.area}
                      onChange={(e) => actualizarHallazgo(h.clave, { area: e.target.value })}
                      placeholder="Área (ej: Lenguaje expresivo)"
                      className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text-primary)] outline-none"
                    />
                    <button type="button" onClick={() => eliminarHallazgo(h.clave)} aria-label="Eliminar" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--coral)]">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <textarea
                    value={h.resumen}
                    onChange={(e) => actualizarHallazgo(h.clave, { resumen: e.target.value })}
                    placeholder="¿Qué encontró?"
                    rows={2}
                    className="mt-2 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                  />
                  <textarea
                    value={h.recomendacion}
                    onChange={(e) => actualizarHallazgo(h.clave, { recomendacion: e.target.value })}
                    placeholder="Recomendación puntual (opcional)"
                    rows={2}
                    className="mt-2 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                  />
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={agregarHallazgo}
              className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
            >
              <Plus size={16} aria-hidden="true" />
              Agregar hallazgo
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            disabled={!puedeGuardar}
            onClick={guardar}
            className="mt-2 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
          >
            Guardar
          </motion.button>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
