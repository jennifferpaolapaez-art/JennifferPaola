'use client';

// EDITAR UN MES DEL CURRÍCULO ANUAL — el tema y cada campo activo del programa (Color, Letras,
// Canciones…). Guardar este mes NUNCA modifica otro (regla del usuario) — se reemplaza solo la
// entrada de `curriculo.meses` que corresponde a este número de mes.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, EtiquetasLibres } from '@/components/app/shell';
import { leerProgramaConfig } from '@/lib/seed-data';
import {
  MES_NOMBRE,
  camposActivos,
  curriculoActivo,
  guardarCurriculosAnuales,
  guardarMesCurriculo,
  leerCurriculosAnuales,
  mesDeCurriculo,
  valorVacio,
  type CurriculoAnual,
  type MesCurricularAnual,
  type ValorCampoCurriculo,
} from '@/lib/curriculo';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

const CAMPO_INPUT =
  'min-h-11 w-full rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_28%,transparent)] bg-[var(--surface)] px-3.5 text-[14px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]';

export default function EditarMesCurriculoPage() {
  const params = useParams<{ mes: string }>();
  const router = useRouter();
  const mes = Number(params.mes);
  const [curriculos, setCurriculos] = useState<CurriculoAnual[]>([]);
  const [config, setConfig] = useState(() => leerProgramaConfig());
  const [tema, setTema] = useState('');
  const [valores, setValores] = useState<Record<string, ValorCampoCurriculo>>({});
  const [cargado, setCargado] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    const c = leerCurriculosAnuales();
    setCurriculos(c);
    setConfig(leerProgramaConfig());
    const activo = curriculoActivo(c);
    const mesActual = activo ? mesDeCurriculo(activo, mes) : undefined;
    setTema(mesActual?.tema ?? '');
    setValores(mesActual?.campos ?? {});
    setCargado(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mes]);

  if (!cargado) return null;
  const activo = curriculoActivo(curriculos);
  const campos = camposActivos(config);

  if (!activo || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos este mes</h1>
          <Link href="/curriculo" className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver al Currículo Anual
          </Link>
        </div>
      </AppShell>
    );
  }

  function valorDe(campoId: string, tipo: 'unico' | 'lista'): ValorCampoCurriculo {
    return valores[campoId] ?? valorVacio(tipo);
  }

  function actualizarUnico(campoId: string, texto: string) {
    setValores((v) => ({ ...v, [campoId]: { tipo: 'unico', valor: texto } }));
    setGuardado(false);
  }

  function actualizarLista(campoId: string, lista: string[]) {
    setValores((v) => ({ ...v, [campoId]: { tipo: 'lista', valores: lista } }));
    setGuardado(false);
  }

  function guardar() {
    if (!activo) return;
    const mesActualizado: MesCurricularAnual = { mes, tema: tema.trim(), campos: valores };
    const nuevoActivo = guardarMesCurriculo(activo, mesActualizado);
    const actualizados = curriculos.map((c) => (c.id === nuevoActivo.id ? nuevoActivo : c));
    setCurriculos(actualizados);
    guardarCurriculosAnuales(actualizados);
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
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{activo.nombre}</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">{MES_NOMBRE[mes]}</h1>
        </motion.header>

        <motion.div variants={item} className="mb-5">
          <label htmlFor="tema-mes" className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">
            Tema del mes
          </label>
          <input id="tema-mes" value={tema} onChange={(e) => { setTema(e.target.value); setGuardado(false); }} placeholder="Ej: Todo sobre mí" className={CAMPO_INPUT} />
        </motion.div>

        {campos.length === 0 ? (
          <motion.p variants={item} className="mb-5 text-[13px] leading-snug text-[var(--text-secondary)]">
            Tu currículo todavía no tiene más campos activos.{' '}
            <Link href="/curriculo/campos" className="font-semibold text-[var(--accent)] underline">
              Agregar campos
            </Link>{' '}
            (Color, Letras, Canciones…) — es opcional.
          </motion.p>
        ) : (
          campos.map((c) =>
            // Personaje del Mes tiene su propio flujo guiado (sugerencias/manual/ninguno) — vive en
            // el Diseño del Mes, no como un campo de texto suelto aquí (regla del usuario).
            c.id === 'personaje' ? (
              <motion.p key={c.id} variants={item} className="mb-5 text-[13px] leading-snug text-[var(--text-secondary)]">
                {c.etiqueta} se elige en el{' '}
                <Link href={`/curriculo/mes/${mes}/diseno`} className="font-semibold text-[var(--accent)] underline">
                  Diseño del Mes
                </Link>
                .
              </motion.p>
            ) : (
            <motion.div key={c.id} variants={item} className="mb-5">
              <label htmlFor={`campo-${c.id}`} className="mb-1 block text-[12px] font-medium text-[var(--text-tertiary)]">
                {c.etiqueta}
              </label>
              {c.tipo === 'unico' ? (
                <input
                  id={`campo-${c.id}`}
                  value={(valorDe(c.id, 'unico') as { tipo: 'unico'; valor: string }).valor}
                  onChange={(e) => actualizarUnico(c.id, e.target.value)}
                  className={CAMPO_INPUT}
                />
              ) : (
                <EtiquetasLibres
                  valores={(valorDe(c.id, 'lista') as { tipo: 'lista'; valores: string[] }).valores}
                  onChange={(v) => actualizarLista(c.id, v)}
                  placeholder={`Agregar ${c.etiqueta.toLowerCase()}...`}
                />
              )}
            </motion.div>
            )
          )
        )}

        <motion.div variants={item} className="flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={guardar}
            className="flex h-[52px] w-full items-center justify-center rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
          >
            Guardar {MES_NOMBRE[mes]}
          </motion.button>
          {guardado && <p role="status" className="text-center text-[13px] font-medium text-[var(--sage)]">Guardado — los demás meses no se tocaron.</p>}
        </motion.div>

        <motion.div variants={item} className="mt-6">
          <Link
            href={`/curriculo/mes/${mes}/diseno`}
            className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-[var(--text-primary)]">Diseño pedagógico de {MES_NOMBRE[mes]}</p>
              <p className="text-[12px] text-[var(--text-secondary)]">Subtemas, vocabulario, conceptos y experiencias clave de este mes</p>
            </div>
          </Link>
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
