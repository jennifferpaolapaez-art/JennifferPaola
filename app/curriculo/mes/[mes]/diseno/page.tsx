'use client';

// DISEÑO DEL MES — Parte B de la nueva capa sobre Planeación. Desarrolla PEDAGÓGICAMENTE un mes
// concreto (subtemas, vocabulario multi-idioma, conceptos, experiencias clave) tomando el marco
// del Currículo Anual como referencia. Un Subtema es SOLO contenido — nunca tiene semana ni
// duración (eso lo decide la Parte C, Calendario, más adelante). Esta pantalla NO toca
// Planeación/Semana/Hoy en absoluto todavía.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronDown, ChevronUp, Plus, Settings2, Sparkles, Trash2, X } from 'lucide-react';
import { AppShell, Chip, EtiquetasLibres } from '@/components/app/shell';
import { leerProgramaConfig } from '@/lib/seed-data';
import {
  MES_NOMBRE,
  agregarSubtema,
  aprobarDiseno,
  actualizarCampoDiseno,
  actualizarSubtema,
  camposActivos,
  crearDisenoDesdePropuestaDemo,
  crearDisenoVacio,
  crearVocabularioVacio,
  curriculoActivo,
  disenoDeMes,
  elegirPersonajeDelMes,
  eliminarSubtema,
  guardarDisenosMensuales,
  idiomasVocabulario,
  leerCurriculosAnuales,
  leerDisenosMensuales,
  moverSubtema,
  noUsarPersonajeDelMes,
  puedeAprobarDiseno,
  sugerirPersonajesDelMes,
  valorTieneContenido,
  volverABorrador,
  type CulturaRelacionada,
  type DisenoMensual,
  type RecursoLibroCancion,
  type Subtema,
  type SugerenciaPersonaje,
  type TipoRecurso,
  type ValorCampoCurriculo,
} from '@/lib/curriculo';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

const CAMPO_INPUT =
  'min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <p className="mb-1 text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{children}</p>;
}

function MarcoDelMes({ tema, campos, camposDef }: { tema: string; campos: Record<string, ValorCampoCurriculo>; camposDef: { id: string; etiqueta: string }[] }) {
  return (
    <section className="mb-6 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
      <Etiqueta>Marco del mes</Etiqueta>
      <p className="text-[16px] font-semibold text-[var(--text-primary)]">{tema || 'Sin tema definido'}</p>
      {camposDef.length > 0 && (
        <dl className="mt-2 flex flex-col gap-1.5">
          {camposDef.map((c) => {
            const v = campos[c.id];
            if (!v || !valorTieneContenido(v)) return null;
            return (
              <div key={c.id} className="flex gap-2 text-[13px]">
                <dt className="shrink-0 font-semibold text-[var(--text-secondary)]">{c.etiqueta}:</dt>
                <dd className="text-[var(--text-primary)]">{v.tipo === 'unico' ? v.valor : v.valores?.join(', ')}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </section>
  );
}

function EditorVocabulario({ subtema, idiomas, onCambio }: { subtema: Subtema; idiomas: string[]; onCambio: (vocabulario: Subtema['vocabulario']) => void }) {
  function agregar() {
    onCambio([...subtema.vocabulario, crearVocabularioVacio(idiomas, subtema.vocabulario.length)]);
  }
  function actualizarTermino(vocabId: string, idioma: string, texto: string) {
    onCambio(
      subtema.vocabulario.map((v) =>
        v.id === vocabId
          ? { ...v, terminos: v.terminos.some((t) => t.idioma === idioma) ? v.terminos.map((t) => (t.idioma === idioma ? { ...t, texto } : t)) : [...v.terminos, { idioma, texto }] }
          : v
      )
    );
  }
  function quitar(vocabId: string) {
    onCambio(subtema.vocabulario.filter((v) => v.id !== vocabId));
  }

  return (
    <div>
      <Etiqueta>Vocabulario</Etiqueta>
      <ul className="flex flex-col gap-2">
        {subtema.vocabulario.map((v) => (
          <li key={v.id} className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
            <div className="flex flex-col gap-2">
              {idiomas.map((idioma) => (
                <div key={idioma} className="flex items-center gap-2">
                  <span className="w-20 shrink-0 text-[12px] font-semibold text-[var(--text-tertiary)]">{idioma}</span>
                  <input
                    value={v.terminos.find((t) => t.idioma === idioma)?.texto ?? ''}
                    onChange={(e) => actualizarTermino(v.id, idioma, e.target.value)}
                    aria-label={`Palabra en ${idioma}`}
                    className={`${CAMPO_INPUT} flex-1`}
                  />
                </div>
              ))}
            </div>
            <button type="button" onClick={() => quitar(v.id)} className="mt-2 min-h-11 text-[12px] font-semibold text-[var(--text-secondary)] underline">
              Quitar palabra
            </button>
          </li>
        ))}
      </ul>
      <button type="button" onClick={agregar} className="mt-2 flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[var(--accent)] underline">
        <Plus size={15} aria-hidden="true" />
        Agregar palabra
      </button>
    </div>
  );
}

function EditorRecursos({ recursos, onCambio, etiqueta }: { recursos: RecursoLibroCancion[]; onCambio: (r: RecursoLibroCancion[]) => void; etiqueta: string }) {
  const [tipo, setTipo] = useState<TipoRecurso>('libro');
  const [titulo, setTitulo] = useState('');

  function agregar() {
    const t = titulo.trim();
    if (!t) return;
    onCambio([...recursos, { id: `recurso-${Date.now()}`, tipo, titulo: t }]);
    setTitulo('');
  }
  function quitar(id: string) {
    onCambio(recursos.filter((r) => r.id !== id));
  }

  return (
    <div>
      <Etiqueta>{etiqueta}</Etiqueta>
      {recursos.length > 0 && (
        <ul className="mb-2 flex flex-col gap-1.5">
          {recursos.map((r) => (
            <li key={r.id} className="flex items-center justify-between gap-2 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 py-2">
              <span className="text-[13px] text-[var(--text-primary)]">
                <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{r.tipo === 'libro' ? 'Libro' : 'Canción'}</span>
                {r.titulo}
              </span>
              <button type="button" onClick={() => quitar(r.id)} aria-label={`Quitar ${r.titulo}`} className="shrink-0 text-[var(--text-tertiary)]">
                <X size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <div className="flex shrink-0 gap-1">
          <Chip label="Libro" activo={tipo === 'libro'} onClick={() => setTipo('libro')} />
          <Chip label="Canción" activo={tipo === 'cancion'} onClick={() => setTipo('cancion')} />
        </div>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregar())} placeholder="Título" aria-label="Título del recurso" className={`${CAMPO_INPUT} flex-1`} />
        <button type="button" onClick={agregar} disabled={!titulo.trim()} aria-label="Agregar recurso" className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[var(--text-primary)] disabled:opacity-40">
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function TarjetaSubtema({
  subtema,
  idiomas,
  esPrimero,
  esUltimo,
  onCambiar,
  onMover,
  onEliminar,
}: {
  subtema: Subtema;
  idiomas: string[];
  esPrimero: boolean;
  esUltimo: boolean;
  onCambiar: (cambios: Partial<Subtema>) => void;
  onMover: (direccion: -1 | 1) => void;
  onEliminar: () => void;
}) {
  const [abierto, setAbierto] = useState(!subtema.nombre.trim());

  return (
    <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">{subtema.nombre.trim() || 'Sin nombre'}</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">
            {subtema.vocabulario.length} {subtema.vocabulario.length === 1 ? 'palabra' : 'palabras'} · {subtema.conceptos.length} {subtema.conceptos.length === 1 ? 'concepto' : 'conceptos'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" disabled={esPrimero} onClick={() => onMover(-1)} aria-label="Subir subtema" className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)] disabled:opacity-30">
            <ChevronUp size={15} aria-hidden="true" />
          </button>
          <button type="button" disabled={esUltimo} onClick={() => onMover(1)} aria-label="Bajar subtema" className="flex size-8 items-center justify-center rounded-full text-[var(--text-tertiary)] disabled:opacity-30">
            <ChevronDown size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {abierto ? (
        <div className="mt-3 flex flex-col gap-4 border-t border-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] pt-3">
          <div>
            <Etiqueta>Nombre del subtema</Etiqueta>
            <input value={subtema.nombre} onChange={(e) => onCambiar({ nombre: e.target.value })} className={CAMPO_INPUT} />
          </div>
          <div>
            <Etiqueta>Enfoque (opcional)</Etiqueta>
            <input value={subtema.enfoque ?? ''} onChange={(e) => onCambiar({ enfoque: e.target.value })} placeholder="Ej: identidad y pertenencia" className={CAMPO_INPUT} />
          </div>
          <EditorVocabulario subtema={subtema} idiomas={idiomas} onCambio={(vocabulario) => onCambiar({ vocabulario })} />
          <div>
            <Etiqueta>Conceptos</Etiqueta>
            <EtiquetasLibres valores={subtema.conceptos} onChange={(conceptos) => onCambiar({ conceptos })} placeholder="Ej: partes del cuerpo..." />
          </div>
          <div>
            <Etiqueta>Experiencias clave</Etiqueta>
            <EtiquetasLibres valores={subtema.experienciasClave} onChange={(experienciasClave) => onCambiar({ experienciasClave })} placeholder="Ej: autorretrato..." />
          </div>
          <EditorRecursos recursos={subtema.recursos} onCambio={(recursos) => onCambiar({ recursos })} etiqueta="Libros y canciones de este subtema" />
          <div className="flex items-center justify-between">
            <button type="button" onClick={() => setAbierto(false)} className="min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
              Listo
            </button>
            <button type="button" onClick={onEliminar} className="flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[var(--coral)] underline">
              <Trash2 size={14} aria-hidden="true" />
              Eliminar subtema
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAbierto(true)} className="mt-2 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
          Editar
        </button>
      )}
    </li>
  );
}

function EditorCulturas({ culturas, onCambio }: { culturas: CulturaRelacionada[]; onCambio: (c: CulturaRelacionada[]) => void }) {
  const [nombre, setNombre] = useState('');

  function agregar() {
    const n = nombre.trim();
    if (!n) return;
    onCambio([...culturas, { id: `cultura-${Date.now()}`, nombre: n }]);
    setNombre('');
  }
  function quitar(id: string) {
    onCambio(culturas.filter((c) => c.id !== id));
  }
  function actualizarNota(id: string, nota: string) {
    onCambio(culturas.map((c) => (c.id === id ? { ...c, nota } : c)));
  }

  return (
    <div>
      <Etiqueta>Culturas o comunidades a integrar</Etiqueta>
      <p className="mb-2 text-[12px] leading-snug text-[var(--text-tertiary)]">Las fechas exactas se asignan después, en el Calendario.</p>
      {culturas.length > 0 && (
        <ul className="mb-2 flex flex-col gap-2">
          {culturas.map((c) => (
            <li key={c.id} className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[14px] font-medium text-[var(--text-primary)]">{c.nombre}</p>
                <button type="button" onClick={() => quitar(c.id)} aria-label={`Quitar ${c.nombre}`} className="shrink-0 text-[var(--text-tertiary)]">
                  <X size={14} aria-hidden="true" />
                </button>
              </div>
              <input value={c.nota ?? ''} onChange={(e) => actualizarNota(c.id, e.target.value)} placeholder="Idea (opcional) — ej. fecha que nos gustaría incluir" className={`${CAMPO_INPUT} mt-1.5`} />
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), agregar())} placeholder="Ej: Colombia" className={`${CAMPO_INPUT} flex-1`} />
        <button type="button" onClick={agregar} disabled={!nombre.trim()} aria-label="Agregar cultura" className="flex size-11 shrink-0 items-center justify-center rounded-[var(--radius-button)] bg-[var(--surface-2)] text-[var(--text-primary)] disabled:opacity-40">
          <Plus size={18} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/** PERSONAJE DEL MES — tres caminos: RAÍZ sugiere / la maestra escribe el suyo / este mes no se
 * usa. RAÍZ nunca elige uno sola — cada sugerencia queda como propuesta hasta que la maestra la
 * toca; solo ESE clic la convierte en `diseno.personajeDelMes` (regla del usuario). */
function PersonajeDelMesSection({ diseno, onCambio }: { diseno: DisenoMensual; onCambio: (d: DisenoMensual) => void }) {
  const [sugerencias, setSugerencias] = useState<SugerenciaPersonaje[] | null>(null);
  const [escribiendo, setEscribiendo] = useState(false);
  const [nombreManual, setNombreManual] = useState('');
  const [cambiando, setCambiando] = useState(false);

  const elegido = diseno.personajeDelMes;

  function reiniciar() {
    setSugerencias(null);
    setEscribiendo(false);
    setNombreManual('');
    setCambiando(false);
  }

  function aceptarSugerencia(s: SugerenciaPersonaje) {
    onCambio(elegirPersonajeDelMes(diseno, { nombre: s.nombre, origen: 'sugerido_raiz', razonPedagogica: s.razonPedagogica, relacionTema: s.relacionTema }));
    reiniciar();
  }

  function guardarManual() {
    const n = nombreManual.trim();
    if (!n) return;
    onCambio(elegirPersonajeDelMes(diseno, { nombre: n, origen: 'manual' }));
    reiniciar();
  }

  function noUsar() {
    onCambio(noUsarPersonajeDelMes(diseno));
    reiniciar();
  }

  const mostrarPicker = !elegido || cambiando;

  return (
    <div className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
      <Etiqueta>Personaje del mes</Etiqueta>

      {!mostrarPicker && elegido && elegido !== 'sin_personaje' && (
        <>
          <p className="text-[15px] font-semibold text-[var(--text-primary)]">{elegido.nombre}</p>
          <p className="mt-0.5 text-[12px] text-[var(--text-tertiary)]">{elegido.origen === 'sugerido_raiz' ? 'Sugerido por RAÍZ y aprobado por ti' : 'Elegido por ti'}</p>
          {elegido.razonPedagogica && <p className="mt-2 text-[13px] leading-snug text-[var(--text-secondary)]">{elegido.razonPedagogica}</p>}
          <button type="button" onClick={() => setCambiando(true)} className="mt-2 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
            Cambiar
          </button>
        </>
      )}

      {!mostrarPicker && elegido === 'sin_personaje' && (
        <>
          <p className="text-[14px] leading-snug text-[var(--text-secondary)]">Decidiste no usar personaje este mes.</p>
          <button type="button" onClick={() => setCambiando(true)} className="mt-2 min-h-11 text-[13px] font-semibold text-[var(--accent)] underline">
            Cambiar
          </button>
        </>
      )}

      {mostrarPicker && !sugerencias && !escribiendo && (
        <div className="flex flex-col gap-2">
          <button type="button" onClick={() => setSugerencias(sugerirPersonajesDelMes(diseno))} className="flex min-h-11 items-center gap-1.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--accent)]">
            <Sparkles size={15} aria-hidden="true" />
            RAÍZ me sugiere personajes
          </button>
          <button type="button" onClick={() => setEscribiendo(true)} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--text-primary)]">
            Escribir mi propio personaje
          </button>
          <button type="button" onClick={noUsar} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
            Este mes no usar personaje
          </button>
          {cambiando && (
            <button type="button" onClick={reiniciar} className="min-h-11 text-[12px] text-[var(--text-tertiary)] underline">
              Cancelar
            </button>
          )}
        </div>
      )}

      {sugerencias && (
        <div>
          <p className="mb-2 text-[12px] leading-snug text-[var(--text-tertiary)]">
            Según el tema de este mes. Son ideas DEMO — tú decides, y puedes ajustar cualquier detalle.
          </p>
          <ul className="flex flex-col gap-2">
            {sugerencias.map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => aceptarSugerencia(s)} className="flex w-full items-start gap-2.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3 text-left">
                  <span className="mt-1 size-3 shrink-0 rounded-full border-2 border-[var(--text-tertiary)]" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-[var(--text-primary)]">{s.nombre}</span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-[var(--text-secondary)]">{s.razonPedagogica}</span>
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" onClick={() => { setSugerencias(null); setEscribiendo(true); }} className="flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3 text-left text-[14px] font-medium text-[var(--text-primary)]">
                <span className="size-3 shrink-0 rounded-full border-2 border-[var(--text-tertiary)]" aria-hidden="true" />
                Escribir otro personaje
              </button>
            </li>
            <li>
              <button type="button" onClick={noUsar} className="flex min-h-11 w-full items-center gap-2.5 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3 text-left text-[14px] font-medium text-[var(--text-primary)]">
                <span className="size-3 shrink-0 rounded-full border-2 border-[var(--text-tertiary)]" aria-hidden="true" />
                Este mes no usar personaje
              </button>
            </li>
          </ul>
          <button type="button" onClick={reiniciar} className="mt-2 min-h-11 text-[12px] text-[var(--text-tertiary)] underline">
            Cancelar
          </button>
        </div>
      )}

      {escribiendo && (
        <div>
          <input value={nombreManual} onChange={(e) => setNombreManual(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), guardarManual())} placeholder="Nombre del personaje" aria-label="Nombre del personaje" className={`${CAMPO_INPUT} mb-2`} />
          <div className="flex flex-col gap-2">
            <button type="button" onClick={guardarManual} disabled={!nombreManual.trim()} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--accent)] px-3 text-[14px] font-semibold text-[var(--bg)] disabled:opacity-40">
              Guardar
            </button>
            <button type="button" onClick={reiniciar} className="min-h-11 text-[12px] text-[var(--text-tertiary)] underline">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DisenoDelMesPage() {
  const params = useParams<{ mes: string }>();
  const router = useRouter();
  const mes = Number(params.mes);
  const [disenos, setDisenos] = useState<DisenoMensual[]>([]);
  const [config, setConfig] = useState(() => leerProgramaConfig());
  const [curriculo, setCurriculo] = useState(() => curriculoActivo());
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setDisenos(leerDisenosMensuales());
    setConfig(leerProgramaConfig());
    setCurriculo(curriculoActivo(leerCurriculosAnuales()));
    setCargado(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  if (!cargado || !curriculo || !Number.isInteger(mes) || mes < 1 || mes > 12) return null;

  const anio = curriculo.anio;
  const diseno = disenoDeMes(anio, mes, disenos);
  const campos = camposActivos(config);
  const camposMarcoVisibles = campos.filter((c) => c.id !== 'personaje');
  const usaPersonaje = campos.some((c) => c.id === 'personaje');
  const idiomas = idiomasVocabulario(config);

  function persistir(actualizado: DisenoMensual) {
    const actualizados = disenos.some((d) => d.id === actualizado.id) ? disenos.map((d) => (d.id === actualizado.id ? actualizado : d)) : [...disenos, actualizado];
    setDisenos(actualizados);
    guardarDisenosMensuales(actualizados);
  }

  const mesEnCurriculo = curriculo.meses.find((m) => m.mes === mes);
  const temaMarco = diseno ? diseno.marcoSnapshot.tema : mesEnCurriculo?.tema ?? '';
  const camposMarco = diseno ? diseno.marcoSnapshot.campos : mesEnCurriculo?.campos ?? {};
  const aprobacion = diseno ? puedeAprobarDiseno(diseno) : { ok: false };

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <Link href={`/curriculo/mes/${mes}`} aria-label="Volver al marco del mes" className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]">
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Diseño del Mes</p>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              {MES_NOMBRE[mes]} {anio}
            </h1>
            {diseno && (
              <span className={`rounded-[var(--radius-button)] px-2.5 py-1 text-[12px] font-semibold ${diseno.estado === 'aprobado' ? 'bg-[color-mix(in_oklab,var(--sage)_20%,transparent)] text-[var(--sage)]' : 'bg-[var(--surface-2)] text-[var(--text-secondary)]'}`}>
                {diseno.estado === 'aprobado' ? 'Aprobado' : 'Borrador'}
              </span>
            )}
          </div>
        </motion.header>

        <motion.div variants={item}>
          <MarcoDelMes tema={temaMarco} campos={camposMarco} camposDef={camposMarcoVisibles} />
        </motion.div>

        {!diseno ? (
          <motion.div variants={item} className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => persistir(crearDisenoVacio(anio, mes, curriculo))}
              className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-1)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-[var(--accent)]">
                <Settings2 size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Ya tengo mi mes</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">Empieza en blanco y agrega tus propios subtemas.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => persistir(crearDisenoDesdePropuestaDemo(anio, mes, curriculo))}
              className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-1)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--butter)_16%,transparent)] text-[var(--butter)]">
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Ayúdame a crear mi mes</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">RAÍZ propone 4 subtemas de ejemplo, vacíos de contenido — tú decides qué va en cada uno.</p>
              </div>
            </button>
          </motion.div>
        ) : (
          <>
            {diseno.origen === 'raiz_sugerido' && diseno.estado === 'borrador' && (
              <motion.p variants={item} className="mb-4 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_14%,transparent)] p-3.5 text-[13px] leading-snug text-[var(--text-primary)]">
                Propuesta de ejemplo — completa cada subtema con tu contenido real antes de aprobar.
              </motion.p>
            )}

            <motion.div variants={item} className="mb-6">
              <input
                value={diseno.enfoqueCultural ?? ''}
                onChange={(e) => persistir(actualizarCampoDiseno(diseno, { enfoqueCultural: e.target.value }))}
                placeholder="Enfoque cultural del mes (opcional)"
                aria-label="Enfoque cultural"
                className={`${CAMPO_INPUT} mb-4`}
              />
              <EditorCulturas culturas={diseno.culturasRelacionadas} onCambio={(culturasRelacionadas) => persistir(actualizarCampoDiseno(diseno, { culturasRelacionadas }))} />
            </motion.div>

            <motion.div variants={item} className="mb-6">
              <EditorRecursos recursos={diseno.recursosGenerales} onCambio={(recursosGenerales) => persistir(actualizarCampoDiseno(diseno, { recursosGenerales }))} etiqueta="Libros y canciones generales del mes" />
            </motion.div>

            {usaPersonaje && (
              <motion.div variants={item} className="mb-6">
                <PersonajeDelMesSection diseno={diseno} onCambio={persistir} />
              </motion.div>
            )}

            <motion.section variants={item} className="mb-6">
              <h2 className="mb-3 text-[16px] font-semibold text-[var(--text-primary)]">Contenido del mes</h2>
              <ul className="flex flex-col gap-3">
                {[...diseno.subtemas]
                  .sort((a, b) => a.orden - b.orden)
                  .map((s, i, arr) => (
                    <TarjetaSubtema
                      key={s.id}
                      subtema={s}
                      idiomas={idiomas}
                      esPrimero={i === 0}
                      esUltimo={i === arr.length - 1}
                      onCambiar={(cambios) => persistir(actualizarSubtema(diseno, s.id, cambios))}
                      onMover={(direccion) => persistir(moverSubtema(diseno, s.id, direccion))}
                      onEliminar={() => persistir(eliminarSubtema(diseno, s.id))}
                    />
                  ))}
                {diseno.subtemas.length === 0 && <p className="text-[13px] text-[var(--text-tertiary)]">Sin subtemas todavía.</p>}
              </ul>
              <button type="button" onClick={() => persistir(agregarSubtema(diseno))} className="mt-3 flex min-h-11 items-center gap-1.5 text-[13px] font-semibold text-[var(--accent)] underline">
                <Plus size={15} aria-hidden="true" />
                Agregar subtema
              </button>
            </motion.section>

            <motion.div variants={item} className="flex flex-col gap-2">
              {diseno.estado === 'borrador' ? (
                <>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="button"
                    disabled={!aprobacion.ok}
                    onClick={() => persistir(aprobarDiseno(diseno))}
                    className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)] disabled:opacity-40"
                  >
                    Aprobar Diseño del Mes
                  </motion.button>
                  {!aprobacion.ok && aprobacion.motivo && <p className="text-center text-[12px] text-[var(--text-tertiary)]">{aprobacion.motivo}</p>}
                </>
              ) : (
                <>
                  <Link
                    href={`/curriculo/mes/${mes}/calendario`}
                    className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
                  >
                    Ir al Calendario del mes
                  </Link>
                  <button type="button" onClick={() => persistir(volverABorrador(diseno))} className="min-h-11 rounded-[var(--radius-button)] bg-[var(--surface-2)] px-3 text-[14px] font-semibold text-[var(--text-primary)]">
                    Volver a borrador
                  </button>
                </>
              )}
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
