'use client';

// CURRÍCULO ANUAL — Parte A de la nueva capa sobre Planeación (ver ESTADO.md: "Planeación deja de
// asumir mes = 4 semanas fijas"). Es el mapa de CONTENIDO del año, independiente de la
// metodología del programa — Tema+Color+Número+Letras+Forma es SOLO el catálogo sugerido, nunca
// obligatorio (`camposCurriculoAnual` en Configuración). Esta pantalla todavía NO toca
// Planeación/Semana/Hoy en absoluto (eso llega en la parte D).

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronRight, Settings2, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { FECHA_HOY, leerProgramaConfig } from '@/lib/seed-data';
import {
  MES_NOMBRE,
  camposActivos,
  crearCurriculoDesdePlantillaDemo,
  crearCurriculoVacio,
  curriculoActivo,
  guardarCurriculosAnuales,
  leerCurriculosAnuales,
  mesDeCurriculo,
  progresoDelMes,
  type CurriculoAnual,
} from '@/lib/curriculo';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.04 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] } } };

const MESES_ORDEN = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CurriculoAnualPage() {
  const router = useRouter();
  const [curriculos, setCurriculos] = useState<CurriculoAnual[]>([]);
  const [config, setConfig] = useState(() => leerProgramaConfig());
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setCurriculos(leerCurriculosAnuales());
    setConfig(leerProgramaConfig());
    setCargado(true);
  }, []);

  if (!cargado) return null;
  const activo = curriculoActivo(curriculos);
  const campos = camposActivos(config);
  const anioActual = new Date(`${FECHA_HOY}T00:00:00`).getFullYear();

  function empezar(nuevo: CurriculoAnual) {
    const actualizados = [...curriculos, nuevo];
    setCurriculos(actualizados);
    guardarCurriculosAnuales(actualizados);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push('/configuracion')}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Currículo Anual</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {activo ? activo.nombre : 'El mapa de tu año'}
          </h1>
          <p className="mt-1 text-[14px] leading-snug text-[var(--text-secondary)]">
            {activo
              ? 'Toca un mes para desarrollarlo. Editar un mes nunca cambia los demás.'
              : 'Esto es el mapa de contenido del año — no reemplaza tu metodología, y los campos que uses son los que tú elijas.'}
          </p>
        </motion.header>

        {!activo ? (
          <motion.div variants={item} className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => empezar(crearCurriculoVacio(anioActual))}
              className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-1)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_14%,transparent)] text-[var(--accent)]">
                <Settings2 size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Ya tengo mi currículo</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">Empieza en blanco y cárgalo mes a mes con lo que ya usas.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => empezar(crearCurriculoDesdePlantillaDemo(anioActual))}
              className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 text-left shadow-[var(--shadow-1)]"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--butter)_16%,transparent)] text-[var(--butter)]">
                <Sparkles size={18} aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[var(--text-primary)]">Ayúdame a crearlo</p>
                <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">
                  RAÍZ te da una plantilla de temas de ejemplo para los 12 meses — la revisas y la haces tuya.
                </p>
              </div>
            </button>
          </motion.div>
        ) : (
          <>
            {activo.origen === 'raiz_sugerido' && (
              <motion.p
                variants={item}
                className="mb-4 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_14%,transparent)] p-3.5 text-[13px] leading-snug text-[var(--text-primary)]"
              >
                Plantilla de ejemplo — revisa y edita cada mes; todavía no es tu currículo terminado.
              </motion.p>
            )}

            <motion.div variants={item} className="mb-5">
              <Link href="/curriculo/campos" className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--text-secondary)]">
                  <Settings2 size={16} aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-[var(--text-primary)]">Campos de tu currículo</p>
                  <p className="text-[12px] text-[var(--text-secondary)]">
                    {campos.length === 0 ? 'Aún no elegiste ninguno (opcional)' : `${campos.length} activo(s): ${campos.map((c) => c.etiqueta).join(', ')}`}
                  </p>
                </div>
                <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
              </Link>
            </motion.div>

            <motion.div variants={item} className="grid grid-cols-2 gap-3">
              {MESES_ORDEN.map((mes) => {
                const mesDef = mesDeCurriculo(activo, mes);
                const progreso = progresoDelMes(mesDef, campos);
                return (
                  <Link
                    key={mes}
                    href={`/curriculo/mes/${mes}`}
                    className="flex flex-col gap-1 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
                  >
                    <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{MES_NOMBRE[mes]}</p>
                    <p className="text-[14px] font-medium leading-snug text-[var(--text-primary)]">{mesDef?.tema || 'Sin definir'}</p>
                    {campos.length > 0 && (
                      <p className="mt-1 text-[12px] text-[var(--text-tertiary)]">
                        {progreso.completados} de {progreso.total} campos
                      </p>
                    )}
                  </Link>
                );
              })}
            </motion.div>
          </>
        )}
      </motion.div>
    </AppShell>
  );
}
