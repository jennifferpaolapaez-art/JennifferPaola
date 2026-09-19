'use client';

// FORMULARIO DE NIÑO — compartido por /ninos/nuevo (crear) y /ninos/[id]/editar (editar). Módulo
// Niños real (Sesión 6, paso 3): antes el perfil era de solo lectura; esta es la primera vez que
// una maestra puede crear/editar un niño de verdad. La edad SIEMPRE se calcula desde la fecha de
// nacimiento (regla del usuario) — nunca se pide ni se guarda como texto aparte.

import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2 } from 'lucide-react';
import { Chip, Colapsable, EtiquetasLibres, SelectorConPersonalizado } from '@/components/app/shell';
import {
  ETAPAS_ORDEN,
  IDIOMAS_ENSENANZA_SUGERIDOS,
  TINT_HEX,
  calcularEdadTexto,
  edadEnMeses,
  etapaSugeridaPorEdad,
  generarIdNino,
  type ApoyoNino,
  type DiaSemana,
  type Etapa,
  type NecesidadNino,
  type Nino,
} from '@/lib/seed-data';

const DIAS: DiaSemana[] = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
const COLORES: Nino['colorTint'][] = ['coral', 'sage', 'butter', 'teal'];

interface NecesidadForm {
  clave: string;
  categoria: string;
  descripcion: string;
  estrategia: string;
}

function hoyISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function NinoFormulario({
  ninoExistente,
  onGuardar,
}: {
  ninoExistente?: Nino;
  onGuardar: (nino: Nino) => void;
}) {
  const [nombre, setNombre] = useState(ninoExistente?.nombre ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(ninoExistente?.fechaNacimiento ?? '');
  const [etapaManual, setEtapaManual] = useState<Etapa | null>(ninoExistente?.etapa ?? null);
  const [colorTint, setColorTint] = useState<Nino['colorTint']>(ninoExistente?.colorTint ?? COLORES[0]);
  const [fechaIngreso, setFechaIngreso] = useState(ninoExistente?.fechaIngreso ?? hoyISO());
  const [diasAsistencia, setDiasAsistencia] = useState<DiaSemana[]>(ninoExistente?.diasAsistencia ?? []);
  const [idiomas, setIdiomas] = useState<string[]>(ninoExistente?.idiomas ?? []);
  const [intereses, setIntereses] = useState<string[]>(ninoExistente?.intereses ?? []);
  const [fortalezas, setFortalezas] = useState<string[]>(ninoExistente?.fortalezas ?? []);
  const [preferencias, setPreferencias] = useState<string[]>(ninoExistente?.preferencias ?? []);
  const [formasComunicacion, setFormasComunicacion] = useState(ninoExistente?.formasComunicacion ?? '');
  const [notasIngresoOriginal, setNotasIngresoOriginal] = useState(ninoExistente?.notasIngresoOriginal ?? '');

  const [necesidades, setNecesidades] = useState<NecesidadForm[]>(
    ninoExistente
      ? ninoExistente.necesidades.map((n) => ({
          clave: n.id,
          categoria: n.categoria,
          descripcion: n.descripcion,
          estrategia: ninoExistente.apoyos.find((a) => a.necesidadId === n.id)?.estrategia ?? '',
        }))
      : []
  );

  const etapaSugerida = fechaNacimiento ? etapaSugeridaPorEdad(edadEnMeses(fechaNacimiento)) : null;
  const etapaEfectiva = etapaManual ?? etapaSugerida;

  function agregarNecesidad() {
    setNecesidades((prev) => [...prev, { clave: `tmp-${Date.now()}`, categoria: '', descripcion: '', estrategia: '' }]);
  }

  function actualizarNecesidad(clave: string, cambios: Partial<NecesidadForm>) {
    setNecesidades((prev) => prev.map((n) => (n.clave === clave ? { ...n, ...cambios } : n)));
  }

  function eliminarNecesidad(clave: string) {
    setNecesidades((prev) => prev.filter((n) => n.clave !== clave));
  }

  const puedeGuardar = nombre.trim().length > 0 && !!fechaNacimiento && !!etapaEfectiva;

  function guardar() {
    if (!puedeGuardar || !etapaEfectiva) return;
    const necesidadesFinal: NecesidadNino[] = [];
    const apoyosFinal: ApoyoNino[] = [];
    for (const n of necesidades) {
      if (!n.descripcion.trim()) continue;
      const id = n.clave.startsWith('tmp-') ? `need-${generarIdNino()}` : n.clave;
      necesidadesFinal.push({
        id,
        categoria: n.categoria.trim() || 'General',
        descripcion: n.descripcion.trim(),
        estado: 'activa',
        origen: 'maestra',
        teacherConfirmed: true,
        fechaCreacion: ninoExistente?.necesidades.find((e) => e.id === id)?.fechaCreacion ?? hoyISO(),
      });
      if (n.estrategia.trim()) {
        apoyosFinal.push({
          id: `apoyo-${id}`,
          necesidadId: id,
          estrategia: n.estrategia.trim(),
          activa: true,
          origen: 'maestra',
          teacherConfirmed: true,
        });
      }
    }

    const nino: Nino = {
      id: ninoExistente?.id ?? generarIdNino(),
      nombre: nombre.trim(),
      etapa: etapaEfectiva,
      fechaNacimiento,
      fechaIngreso,
      colorTint,
      idiomas,
      intereses,
      fortalezas,
      preferencias,
      formasComunicacion: formasComunicacion.trim() || undefined,
      notasIngresoOriginal: notasIngresoOriginal.trim() || undefined,
      notasIngresoResumen: ninoExistente?.notasIngresoResumen,
      necesidades: necesidadesFinal,
      apoyos: apoyosFinal,
      skills: ninoExistente?.skills ?? [],
      diasAsistencia,
      fechaUltimaEvaluacionAprobada: ninoExistente?.fechaUltimaEvaluacionAprobada,
      evaluaciones: ninoExistente?.evaluaciones ?? [],
      evaluacionesExternas: ninoExistente?.evaluacionesExternas ?? [],
      planesIndividuales: ninoExistente?.planesIndividuales,
    };
    onGuardar(nino);
  }

  return (
    <div className="flex flex-col gap-3">
      <Colapsable titulo="Datos básicos" subtitulo="Nombre, fecha de nacimiento y color" defaultAbierto>
        <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Nombre</label>
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Nombre del niño"
          className="mb-4 min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />

        <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Fecha de nacimiento</label>
        <input
          type="date"
          value={fechaNacimiento}
          onChange={(e) => {
            setFechaNacimiento(e.target.value);
            setEtapaManual(null);
          }}
          className="mb-2 min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />
        {fechaNacimiento && (
          <p className="mb-4 text-[13px] text-[var(--text-secondary)]">
            Edad calculada: <strong className="text-[var(--text-primary)]">{calcularEdadTexto(fechaNacimiento)}</strong>
          </p>
        )}

        <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">
          Etapa {etapaSugerida && !etapaManual && '(sugerida por la edad — puedes cambiarla)'}
        </label>
        <div className="mb-4 flex flex-wrap gap-2">
          {ETAPAS_ORDEN.map((e) => (
            <Chip key={e} label={e} activo={etapaEfectiva === e} onClick={() => setEtapaManual(e)} />
          ))}
        </div>

        <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Fecha de ingreso</label>
        <input
          type="date"
          value={fechaIngreso}
          onChange={(e) => setFechaIngreso(e.target.value)}
          className="mb-4 min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />

        <label className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">Días programados</label>
        <div className="mb-4 flex flex-wrap gap-2">
          {DIAS.map((d) => (
            <Chip
              key={d}
              label={d}
              activo={diasAsistencia.includes(d)}
              onClick={() => setDiasAsistencia((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))}
            />
          ))}
        </div>

        <label className="mb-2 block text-[12px] font-medium text-[var(--text-tertiary)]">Color en la app</label>
        <div className="flex gap-2">
          {COLORES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColorTint(c)}
              aria-label={c}
              aria-pressed={colorTint === c}
              className="flex size-11 items-center justify-center rounded-full"
              style={{ background: TINT_HEX[c], outline: colorTint === c ? '3px solid var(--text-primary)' : 'none', outlineOffset: 2 }}
            />
          ))}
        </div>
      </Colapsable>

      <Colapsable titulo="Idiomas" subtitulo="Los que habla o escucha en casa">
        <SelectorConPersonalizado
          sugeridos={IDIOMAS_ENSENANZA_SUGERIDOS}
          seleccionados={idiomas}
          onChange={setIdiomas}
          placeholderAgregar="Agregar otro idioma"
        />
      </Colapsable>

      <Colapsable titulo="Cómo es" subtitulo="Intereses, fortalezas y preferencias">
        <label className="mb-2 block text-[13px] font-semibold text-[var(--text-primary)]">Intereses</label>
        <EtiquetasLibres valores={intereses} onChange={setIntereses} placeholder="Ej: dinosaurios, bloques..." />

        <label className="mb-2 mt-5 block text-[13px] font-semibold text-[var(--text-primary)]">Fortalezas</label>
        <EtiquetasLibres valores={fortalezas} onChange={setFortalezas} placeholder="Ej: memoria para canciones..." />

        <label className="mb-2 mt-5 block text-[13px] font-semibold text-[var(--text-primary)]">Preferencias</label>
        <EtiquetasLibres valores={preferencias} onChange={setPreferencias} placeholder="Ej: prefiere elegir entre 2 opciones..." />

        <label className="mb-1 mt-5 block text-[12px] font-medium text-[var(--text-tertiary)]">Cómo se comunica</label>
        <textarea
          value={formasComunicacion}
          onChange={(e) => setFormasComunicacion(e.target.value)}
          placeholder="Ej: pre-verbal, usa gestos y palabras sueltas..."
          rows={2}
          className="w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />
      </Colapsable>

      <Colapsable titulo="Cuéntame sobre este niño" subtitulo="Escribe libremente lo que ya sabes">
        <textarea
          value={notasIngresoOriginal}
          onChange={(e) => setNotasIngresoOriginal(e.target.value)}
          placeholder="Lo que escribas aquí se guarda tal cual — nunca se sobrescribe."
          rows={4}
          className="w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
        />
      </Colapsable>

      <Colapsable titulo="Necesidades y apoyos" subtitulo="Si ya conoces alguna — es opcional">
        <div className="flex flex-col gap-3">
          {necesidades.map((n) => (
            <div key={n.clave} className="rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5">
              <div className="flex items-center gap-2">
                <input
                  value={n.categoria}
                  onChange={(e) => actualizarNecesidad(n.clave, { categoria: e.target.value })}
                  placeholder="Categoría (ej: Sensorial)"
                  className="min-h-11 flex-1 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3 text-[13px] text-[var(--text-primary)] outline-none"
                />
                <button type="button" onClick={() => eliminarNecesidad(n.clave)} aria-label="Eliminar" className="flex size-9 shrink-0 items-center justify-center rounded-full text-[var(--coral)]">
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </div>
              <textarea
                value={n.descripcion}
                onChange={(e) => actualizarNecesidad(n.clave, { descripcion: e.target.value })}
                placeholder="¿Qué necesita?"
                rows={2}
                className="mt-2 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
              <textarea
                value={n.estrategia}
                onChange={(e) => actualizarNecesidad(n.clave, { estrategia: e.target.value })}
                placeholder="¿Qué apoyo o estrategia funciona? (opcional)"
                rows={2}
                className="mt-2 w-full resize-none rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] p-3 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
              />
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={agregarNecesidad}
          className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border-2 border-dashed border-[color-mix(in_oklab,var(--accent)_45%,transparent)] text-[14px] font-semibold text-[var(--accent)]"
        >
          <Plus size={16} aria-hidden="true" />
          Agregar necesidad
        </button>
        <p className="mt-3 text-[12px] text-[var(--text-tertiary)]">Registrar una necesidad no crea un Plan Individual — eso lo decides tú aparte.</p>
      </Colapsable>

      <motion.button
        whileTap={{ scale: 0.97 }}
        type="button"
        disabled={!puedeGuardar}
        onClick={guardar}
        className="mt-2 flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-50"
      >
        {ninoExistente ? 'Guardar cambios' : 'Agregar niño'}
      </motion.button>
      {!puedeGuardar && (
        <p className="text-center text-[12px] text-[var(--text-tertiary)]">Falta el nombre y la fecha de nacimiento para poder guardar.</p>
      )}
    </div>
  );
}
