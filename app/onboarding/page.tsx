'use client';

// ONBOARDING — Sesión 4. Modelo 2 (onboarding-first, decidido en Sesión 1 con 02C).
// 5 preguntas reales + 2 reconocimientos + loading — longitud "4-8 pasos de alto rendimiento"
// (02B, categoría Productividad). Cada pregunta ecoa un campo de FICHA-AVATAR.md (dolor,
// deseo, objeción) — ninguna es decorativa. Las respuestas viajan a /paywall vía localStorage
// (sin backend todavía: Supabase se conecta en la fase de servicios externos — 51/62).
// Especificación visual: docs/sistema/50-DISENO-ONBOARDING-PAYWALL.md → sección A/B.

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'motion/react';
import { Home, Users, Layers, Brain, RotateCcw, NotebookPen, Pin, MessageSquareText, Images, Shuffle, Moon, Sun, Clock3, HelpCircle } from 'lucide-react';
import { FunnelShell, FunnelStage, FunnelTopBar, QuestionScreen, QuestionChip, SliderMeta, FunnelCta, Reconocimiento, LoadingConstruyendo } from '@/components/onboarding/ui';

type Salon = 'home-daycare' | 'preschool' | 'otro';
type Dolor = 'adaptar-edades' | 'recordar-niño' | 'reconstruir' | 'documentar';
type Objecion = 'pinterest-tpt' | 'chatgpt' | 'cuadernos' | 'varias';
type Momento = 'domingo-noche' | 'semana-noche' | 'durante-dia' | 'sin-fijo';

interface Respuestas {
  salon: Salon | null;
  niños: number;
  dolor: Dolor | null;
  objecion: Objecion | null;
  momento: Momento | null;
}

const DOLOR_LABEL: Record<Dolor, string> = {
  'adaptar-edades': 'adaptar la misma actividad a cada edad',
  'recordar-niño': 'recordar qué necesita cada niño',
  reconstruir: 'reconstruir todo desde cero cada semana',
  documentar: 'escribir observaciones de forma profesional',
};

const MOMENTO_LABEL: Record<Momento, string> = {
  'domingo-noche': 'el domingo por la noche',
  'semana-noche': 'entre semana, de noche',
  'durante-dia': 'durante el día, entre actividades',
  'sin-fijo': 'cuando encuentras un rato',
};

const RECONOCIMIENTO_DOLOR: Record<Dolor, { titulo: string; cuerpo: string }> = {
  'adaptar-edades': {
    titulo: 'No es que te falte método',
    cuerpo:
      'Adaptar una actividad a Infant, Toddler, Preschool y Pre-K a la vez es trabajo real — nadie lo hace "más rápido" solo con práctica. La Memoria del Salón hace esa adaptación por ti, actividad por actividad.',
  },
  'recordar-niño': {
    titulo: 'Tenerlo todo en la cabeza no es sostenible',
    cuerpo:
      'Nadie puede recordar el nivel, el foco y la meta de cada niño a la vez, todos los días. Eso no es falta de dedicación — es demasiado para cualquier persona sola. La Memoria del Salón lo recuerda contigo.',
  },
  reconstruir: {
    titulo: 'Cada domingo empiezas de cero porque nada te lo recuerda',
    cuerpo:
      'El problema no es tu planeación — es que ninguna herramienta conecta lo que ya sabes con lo que toca planear. La Memoria del Salón conecta esas dos cosas por ti.',
  },
  documentar: {
    titulo: 'Sabes lo que pasó — el reto es escribirlo bien',
    cuerpo:
      'Observas todo el día, pero convertirlo en documentación profesional a las 9pm es otro trabajo aparte. La Memoria del Salón reformula tus notas por ti, sin cambiar lo que viste.',
  },
};

export default function Onboarding() {
  const router = useRouter();
  const [paso, setPaso] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [r, setR] = useState<Respuestas>({ salon: null, niños: 6, dolor: null, objecion: null, momento: null });
  const otroSalonRef = useRef<HTMLInputElement>(null);
  const [otroSalon, setOtroSalon] = useState('');

  const TOTAL_PASOS = 9; // 5 preguntas + 2 reconocimientos + slider ya contado + loading
  const avanzar = useCallback(() => {
    setDir(1);
    setPaso((p) => p + 1);
  }, []);
  const retroceder = useCallback(() => {
    setDir(-1);
    setPaso((p) => Math.max(0, p - 1));
  }, []);

  const terminarOnboarding = useCallback(() => {
    const nRespuestas = [r.salon, r.dolor, r.objecion, r.momento].filter(Boolean).length + 1; // +1 por el grupo
    localStorage.setItem(
      'raiz_onboarding',
      JSON.stringify({ ...r, salonOtro: otroSalon || undefined, nRespuestas })
    );
    router.push('/paywall');
  }, [r, otroSalon, router]);

  const percent = (paso / TOTAL_PASOS) * 100;

  return (
    <FunnelShell>
      <FunnelTopBar percent={percent} onBack={retroceder} showBack={paso > 0} />
      <FunnelStage topbarHeight={140}>
        <AnimatePresence mode="wait" initial={false}>
          {/* Paso 0 — segmentación funcional: tipo de salón */}
          {paso === 0 && (
            <QuestionScreen
              key="p0"
              direction={dir}
              eyebrow="TU SALÓN"
              pregunta="¿Cómo es tu salón?"
              microcopy="Así ajustamos el lenguaje de tu planeación y tus reportes."
            >
              <QuestionChip
                index={0}
                icon={Home}
                label="Home daycare en mi propia casa"
                selected={r.salon === 'home-daycare'}
                onClick={() => {
                  setR((s) => ({ ...s, salon: 'home-daycare' }));
                  setTimeout(avanzar, 300);
                }}
              />
              <QuestionChip
                index={1}
                icon={Users}
                label="Maestra líder en un preschool pequeño"
                selected={r.salon === 'preschool'}
                onClick={() => {
                  setR((s) => ({ ...s, salon: 'preschool' }));
                  setTimeout(avanzar, 300);
                }}
              />
              <QuestionChip
                index={2}
                icon={HelpCircle}
                label="Otra cosa (escribe la tuya)"
                selected={r.salon === 'otro'}
                onClick={() => setR((s) => ({ ...s, salon: 'otro' }))}
              />
              {r.salon === 'otro' && (
                <div className="mt-1 flex flex-col gap-3">
                  <input
                    ref={otroSalonRef}
                    autoFocus
                    value={otroSalon}
                    onChange={(e) => setOtroSalon(e.target.value)}
                    placeholder="Cuéntanos en una frase"
                    className="h-14 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none focus-visible:border-[var(--accent)]"
                  />
                  <FunnelCta onClick={avanzar} disabled={otroSalon.trim().length === 0}>
                    Continuar
                  </FunnelCta>
                </div>
              )}
            </QuestionScreen>
          )}

          {/* Paso 1 — compromiso: cuántos niños (commitment device) */}
          {paso === 1 && (
            <QuestionScreen key="p1" direction={dir} eyebrow="TU GRUPO" pregunta="¿Cuántos niños tienes en tu grupo?">
              <SliderMeta value={r.niños} min={1} max={20} unidad="niños en tu grupo" onChange={(v) => setR((s) => ({ ...s, niños: v }))} />
              <div className="mt-2">
                <FunnelCta onClick={avanzar}>Fijar mi grupo</FunnelCta>
              </div>
            </QuestionScreen>
          )}

          {/* Paso 2 — dolor #1/#2 de la ficha, eco literal */}
          {paso === 2 && (
            <QuestionScreen
              key="p2"
              direction={dir}
              eyebrow="TU SEMANA"
              pregunta="¿Qué es lo que más se te complica al planear?"
              microcopy="Con esto priorizamos qué resuelve primero tu plan."
            >
              {(
                [
                  ['adaptar-edades', Layers, 'Adaptar la misma actividad a cada edad'],
                  ['recordar-niño', Brain, 'Recordar qué necesita cada niño'],
                  ['reconstruir', RotateCcw, 'Reconstruir todo desde cero cada semana'],
                  ['documentar', NotebookPen, 'Escribir observaciones de forma profesional'],
                ] as [Dolor, typeof Layers, string][]
              ).map(([val, Icono, label], i) => (
                <QuestionChip
                  key={val}
                  index={i}
                  icon={Icono}
                  label={label}
                  selected={r.dolor === val}
                  onClick={() => {
                    setR((s) => ({ ...s, dolor: val }));
                    setTimeout(avanzar, 300);
                  }}
                />
              ))}
            </QuestionScreen>
          )}

          {/* Paso 3 — reconocimiento (tras pregunta sensible), fórmula: nombra patrón + quita culpa + nombra mecanismo */}
          {paso === 3 && r.dolor && (
            <Reconocimiento
              key="rec1"
              icon={Brain}
              titulo={RECONOCIMIENTO_DOLOR[r.dolor].titulo}
              cuerpo={RECONOCIMIENTO_DOLOR[r.dolor].cuerpo}
              onContinuar={avanzar}
            />
          )}

          {/* Paso 4 — objeción dominante de la ficha, como pregunta */}
          {paso === 4 && (
            <QuestionScreen
              key="p4"
              direction={dir}
              eyebrow="LO QUE YA PROBASTE"
              pregunta="¿Ya intentaste organizar esto con algo más?"
              microcopy="Así sabemos qué comparar contigo, sin repetirte lo mismo."
            >
              {(
                [
                  ['pinterest-tpt', Pin, 'Pinterest o Teachers Pay Teachers'],
                  ['chatgpt', MessageSquareText, 'ChatGPT u otro generador de IA'],
                  ['cuadernos', Images, 'Cuadernos, fotos y memoria'],
                  ['varias', Shuffle, 'Varias cosas a la vez, sin conectar'],
                ] as [Objecion, typeof Pin, string][]
              ).map(([val, Icono, label], i) => (
                <QuestionChip
                  key={val}
                  index={i}
                  icon={Icono}
                  label={label}
                  selected={r.objecion === val}
                  onClick={() => {
                    setR((s) => ({ ...s, objecion: val }));
                    setTimeout(avanzar, 300);
                  }}
                />
              ))}
            </QuestionScreen>
          )}

          {/* Paso 5 — ancla contextual (momento del día), fija la hora del recordatorio */}
          {paso === 5 && (
            <QuestionScreen key="p5" direction={dir} eyebrow="TU RUTINA" pregunta="¿Cuándo sueles planear tu semana?">
              {(
                [
                  ['domingo-noche', Moon, 'Domingo por la noche'],
                  ['semana-noche', Clock3, 'Entre semana, ya de noche'],
                  ['durante-dia', Sun, 'Durante el día, entre actividades'],
                  ['sin-fijo', HelpCircle, 'No tengo un momento fijo'],
                ] as [Momento, typeof Moon, string][]
              ).map(([val, Icono, label], i) => (
                <QuestionChip
                  key={val}
                  index={i}
                  icon={Icono}
                  label={label}
                  selected={r.momento === val}
                  onClick={() => {
                    setR((s) => ({ ...s, momento: val }));
                    setTimeout(avanzar, 300);
                  }}
                />
              ))}
            </QuestionScreen>
          )}

          {/* Paso 6 — reconocimiento final con ETIQUETADO POSITIVO (regla b de la Escalera, 02B) */}
          {paso === 6 && r.dolor && r.momento && (
            <Reconocimiento
              key="rec2"
              icon={Users}
              titulo="Tus respuestas te describen"
              cuerpo={
                <>
                  Ya sabes exactamente qué te quita {MOMENTO_LABEL[r.momento]}: {DOLOR_LABEL[r.dolor]}. Eso no es
                  desorganización — es <strong>conciencia del problema real</strong>, que es lo que la mayoría nunca
                  llega a nombrar. Tu Memoria del Salón va a cargar justo esa parte por ti.
                </>
              }
              ctaLabel="Ver mi Memoria del Salón"
              onContinuar={avanzar}
            />
          )}

          {/* Paso 7 — loading "construyendo tu plan" (spec B), líneas con respuestas reales */}
          {paso === 7 && r.dolor && r.momento && (
            <div key="loading">
              <LoadingConstruyendo
                titulo="Construyendo tu Memoria del Salón…"
                lineas={[
                  { texto: `Ajustando a tu grupo: ${r.niños} niños` },
                  { texto: `Priorizando: ${DOLOR_LABEL[r.dolor]}` },
                  { texto: `Programando tu recordatorio para ${MOMENTO_LABEL[r.momento]}` },
                  { texto: 'Preparando tu primera semana' },
                ]}
                onDone={terminarOnboarding}
              />
            </div>
          )}
        </AnimatePresence>
      </FunnelStage>
    </FunnelShell>
  );
}
