'use client';

// CAMPOS DEL CURRÍCULO ANUAL — el programa elige qué campos usa además de "Tema" (Color, Número,
// Letras, Forma… o los suyos propios). Nunca un set fijo (regla del usuario: "Color+Número+
// Letras+Forma es configurable, no universal"). Cada campo acepta valor único o lista — se define
// aquí, una sola vez para todo el currículo, no por mes.

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { AppShell, Chip } from '@/components/app/shell';
import { guardarProgramaConfig, leerProgramaConfig, type CampoCurriculoDef, type ProgramaConfig } from '@/lib/seed-data';
import { CAMPOS_CURRICULO_SUGERIDOS } from '@/lib/curriculo';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

const CAMPO_INPUT =
  'min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

export default function CamposCurriculoPage() {
  const router = useRouter();
  const [config, setConfig] = useState<ProgramaConfig | null>(null);
  const [activos, setActivos] = useState<CampoCurriculoDef[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipo, setNuevoTipo] = useState<'unico' | 'lista'>('unico');
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const c = leerProgramaConfig();
    setConfig(c);
    setActivos(c.camposCurriculoAnual ?? []);
  }, []);

  if (!config) return null;

  function tieneActivo(id: string) {
    return activos.some((c) => c.id === id);
  }

  function alternar(def: CampoCurriculoDef) {
    setActivos((prev) => (prev.some((c) => c.id === def.id) ? prev.filter((c) => c.id !== def.id) : [...prev, def]));
    setGuardado(false);
  }

  function quitar(id: string) {
    setActivos((prev) => prev.filter((c) => c.id !== id));
    setGuardado(false);
  }

  function agregarPersonalizado() {
    const etiqueta = nuevoNombre.trim();
    if (!etiqueta) return;
    const id = `custom-${Date.now()}`;
    setActivos((prev) => [...prev, { id, etiqueta, tipo: nuevoTipo }]);
    setNuevoNombre('');
    setNuevoTipo('unico');
    setGuardado(false);
  }

  function guardar() {
    if (!config) return;
    const actualizado = { ...config, camposCurriculoAnual: activos };
    guardarProgramaConfig(actualizado);
    setConfig(actualizado);
    setGuardado(true);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push('/curriculo')}
            aria-label="Volver al Currículo Anual"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Currículo Anual</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">Campos que usa tu currículo</h1>
          <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">
            "Tema" siempre existe. El resto es tu elección — puedes no usar ninguno, o agregar los tuyos.
          </p>
        </motion.header>

        <motion.section variants={item} className="mb-6">
          <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Sugeridos</h2>
          <div className="flex flex-wrap gap-2">
            {CAMPOS_CURRICULO_SUGERIDOS.map((def) => (
              <Chip key={def.id} label={def.etiqueta} activo={tieneActivo(def.id)} onClick={() => alternar(def)} />
            ))}
          </div>
        </motion.section>

        {activos.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-2 text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">Activos en tu currículo</h2>
            <ul className="flex flex-col gap-2">
              {activos.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-3.5 shadow-[var(--shadow-1)]">
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-[var(--text-primary)]">{c.etiqueta}</p>
                    <p className="text-[12px] text-[var(--text-tertiary)]">{c.tipo === 'unico' ? 'Un valor' : 'Varios valores'}</p>
                  </div>
                  <button type="button" onClick={() => quitar(c.id)} aria-label={`Quitar ${c.etiqueta}`} className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--text-tertiary)]">
                    <X size={16} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        <motion.section variants={item} className="mb-6 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
          <h2 className="mb-2 text-[14px] font-semibold text-[var(--text-primary)]">Agregar un campo propio</h2>
          <label htmlFor="nombre-campo" className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">
            Nombre
          </label>
          <input id="nombre-campo" value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)} placeholder="Ej: Estación del hemisferio sur" className={`${CAMPO_INPUT} mb-3 w-full`} />
          <p className="mb-1 text-[12px] font-medium text-[var(--text-tertiary)]">¿Acepta uno o varios valores?</p>
          <div className="mb-3 flex gap-2">
            <Chip label="Un valor" activo={nuevoTipo === 'unico'} onClick={() => setNuevoTipo('unico')} />
            <Chip label="Varios valores" activo={nuevoTipo === 'lista'} onClick={() => setNuevoTipo('lista')} />
          </div>
          <button
            type="button"
            onClick={agregarPersonalizado}
            disabled={!nuevoNombre.trim()}
            className="flex min-h-11 items-center justify-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface)] px-3.5 text-[14px] font-semibold text-[var(--accent)] disabled:opacity-40"
          >
            <Plus size={16} aria-hidden="true" />
            Agregar campo
          </button>
        </motion.section>

        <motion.div variants={item} className="flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={guardar}
            className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
          >
            Guardar
          </motion.button>
          {guardado && <p role="status" className="text-center text-[13px] font-medium text-[var(--sage)]">Guardado.</p>}
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
