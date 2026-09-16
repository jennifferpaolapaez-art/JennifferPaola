'use client';

// DETALLE DE ACTIVIDAD/BLOQUE — corrección del usuario (Sesión 5, ronda 2): cada TIPO de bloque
// tiene una función pedagógica distinta y necesita su propia guía (Circle Time ≠ Outdoor ≠
// Centros ≠ Actividad Principal/STEAM) — nunca forzar todo en la misma plantilla genérica.
// La superficie se mantiene simple; "Adaptaciones individuales", "Niños foco" y "Qué observar"
// quedan plegados por defecto (regla del usuario: "primero veo lo esencial, después expando").
// Las 3 capas (etapa / adaptación individual / niño foco) siguen SIEMPRE separadas entre sí.

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell, AvatarInicial, Colapsable, EtapaChip, LeafCheck } from '@/components/app/shell';
import { actividadPorId, ninoPorId, ETAPAS_ORDEN, TINT_HEX, BLOQUE_LABEL, type Etapa } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[13px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">{children}</h2>;
}

export default function DetalleActividad() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const encontrado = actividadPorId(params.id);
  const [etapaActiva, setEtapaActiva] = useState<Etapa>('Preschool');

  if (!encontrado) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos esta actividad</h1>
          <button type="button" onClick={() => router.push('/planeacion')} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a la planeación
          </button>
        </div>
      </AppShell>
    );
  }

  const { actividad, dia } = encontrado;
  const tieneGuiaGenerica = actividad.preparacion || actividad.queHaceMaestra || actividad.queHacenNinos || actividad.preguntasGuia;

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">
            {BLOQUE_LABEL[actividad.bloque]} · {dia.dia} {actividad.hora}
          </p>
          <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {actividad.titulo}
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">{actividad.objetivo}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className="inline-flex w-fit rounded-[var(--radius-button)] bg-[var(--surface-2)] px-2.5 py-1 text-[12px] font-medium text-[var(--text-secondary)]">
              {actividad.dominio}
            </span>
          </div>
        </motion.header>

        {/* ——— Materiales ——— */}
        {actividad.materiales.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <Etiqueta>Materiales</Etiqueta>
            <div className="mt-2 flex flex-wrap gap-2">
              {actividad.materiales.map((m) => (
                <span
                  key={m.nombre}
                  className={`inline-flex items-center gap-1.5 rounded-[var(--radius-button)] px-2.5 py-1 text-[12px] font-medium ${
                    m.disponible
                      ? 'bg-[color-mix(in_oklab,var(--sage)_14%,transparent)] text-[var(--sage)]'
                      : 'bg-[color-mix(in_oklab,var(--coral)_14%,transparent)] text-[var(--coral)]'
                  }`}
                >
                  <LeafCheck negativo={!m.disponible} size={14} />
                  {m.nombre}
                </span>
              ))}
            </div>
          </motion.section>
        )}

        {/* ——— GUÍA DE CIRCLE TIME: rutina breve + foco del día — nunca "otra actividad principal" ——— */}
        {actividad.guiaCircle && (
          <motion.section variants={item} className="mb-6 flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">
              Circle Time · {actividad.guiaCircle.duracion}
            </p>

            <div>
              <Etiqueta>Rutina diaria</Etiqueta>
              <ul className="mt-2 flex flex-col gap-2">
                {actividad.guiaCircle.rutinaDiaria.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-[14px] leading-snug text-[var(--text-primary)]">
                    <span aria-hidden="true">{r.icono}</span>
                    <span>
                      <strong>{r.titulo}:</strong> {r.texto}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Foco de hoy</p>
              <p className="mt-2 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaCircle.focoDeHoy.tema}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {actividad.guiaCircle.focoDeHoy.palabrasDelDia.map((p) => (
                  <span key={p} className="rounded-[var(--radius-button)] bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] px-2.5 py-1 text-[12px] font-semibold text-[var(--accent)]">
                    {p}
                  </span>
                ))}
              </div>
              <p className="mt-3 text-[14px] leading-snug text-[var(--text-primary)]">👀 {actividad.guiaCircle.focoDeHoy.muestra}</p>
              <ul className="mt-2 flex flex-col gap-1">
                {actividad.guiaCircle.focoDeHoy.preguntas.map((p, i) => (
                  <li key={i} className="text-[14px] leading-snug text-[var(--text-secondary)]">
                    💬 {p}
                  </li>
                ))}
              </ul>
              {actividad.guiaCircle.focoDeHoy.libro && <p className="mt-2 text-[14px] text-[var(--text-primary)]">📖 {actividad.guiaCircle.focoDeHoy.libro}</p>}
              {actividad.guiaCircle.focoDeHoy.letra && <p className="mt-1 text-[14px] text-[var(--text-primary)]">🔤 {actividad.guiaCircle.focoDeHoy.letra}</p>}
              {actividad.guiaCircle.focoDeHoy.cancion && <p className="mt-1 text-[14px] text-[var(--text-primary)]">🎵 {actividad.guiaCircle.focoDeHoy.cancion}</p>}
            </div>

            <div>
              <Etiqueta>Cierre / transición</Etiqueta>
              <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaCircle.cierre}</p>
            </div>
          </motion.section>
        )}

        {/* ——— GUÍA DE OUTDOOR: invitación breve + juego libre — nunca una clase académica ——— */}
        {actividad.guiaOutdoor && (
          <motion.section variants={item} className="mb-6 flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--accent)]">
              Movimiento intencional · {actividad.guiaOutdoor.movimientoIntencional.duracion}
            </p>
            <p className="text-[15px] font-medium leading-snug text-[var(--text-primary)]">
              {actividad.guiaOutdoor.movimientoIntencional.invitacion}
            </p>
            <ul className="flex flex-col gap-1">
              {actividad.guiaOutdoor.movimientoIntencional.ideas.map((idea, i) => (
                <li key={i} className="text-[14px] leading-snug text-[var(--text-secondary)]">
                  · {idea}
                </li>
              ))}
            </ul>
            {actividad.guiaOutdoor.movimientoIntencional.cancion && (
              <p className="text-[14px] text-[var(--text-primary)]">🎵 {actividad.guiaOutdoor.movimientoIntencional.cancion}</p>
            )}
            <div className="rounded-[var(--radius-button)] bg-[var(--surface-2)] p-4">
              <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-secondary)]">Después</p>
              <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.guiaOutdoor.juegoLibre}</p>
              {actividad.guiaOutdoor.preguntaInformal && (
                <p className="mt-2 text-[14px] text-[var(--text-secondary)]">💬 {actividad.guiaOutdoor.preguntaInformal}</p>
              )}
            </div>
            <p className="text-[12px] leading-snug text-[var(--text-tertiary)]">{actividad.guiaOutdoor.quePriorizar}</p>
          </motion.section>
        )}

        {/* ——— GUÍA DE CENTROS: varias estaciones a la vez, cada una con su propia provocación ——— */}
        {actividad.guiaCentros && (
          <motion.section variants={item} className="mb-6">
            <Etiqueta>Centros disponibles hoy</Etiqueta>
            <div className="mt-2 flex flex-col gap-3">
              {actividad.guiaCentros.map((c) => (
                <div key={c.nombre} className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]">
                  <p className="text-[15px] font-semibold text-[var(--text-primary)]">{c.nombre}</p>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Material:</strong> {c.material}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Provocación:</strong> {c.provocacion}
                  </p>
                  <p className="mt-1 text-[13px] text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Intención:</strong> {c.intencion}
                  </p>
                  {c.pregunta && <p className="mt-1 text-[13px] text-[var(--accent)]">💬 {c.pregunta}</p>}
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ——— GUÍA GENÉRICA (Actividad Principal, STEAM, Pre-K, Lectura, Cierre) ——— */}
        {tieneGuiaGenerica && (
          <motion.section variants={item} className="mb-6 flex flex-col gap-4 rounded-[var(--radius-card)] bg-[var(--surface)] p-5 shadow-[var(--shadow-1)]">
            {actividad.preparacion && (
              <div>
                <Etiqueta>Preparación</Etiqueta>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.preparacion}</p>
              </div>
            )}
            {actividad.queHaceMaestra && (
              <div>
                <Etiqueta>Qué haces tú</Etiqueta>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queHaceMaestra}</p>
              </div>
            )}
            {actividad.queHacenNinos && (
              <div>
                <Etiqueta>Qué hacen los niños</Etiqueta>
                <p className="mt-1 text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queHacenNinos}</p>
              </div>
            )}
            {actividad.preguntasGuia && actividad.preguntasGuia.length > 0 && (
              <div>
                <Etiqueta>Preguntas guía</Etiqueta>
                <ul className="mt-1 flex flex-col gap-1">
                  {actividad.preguntasGuia.map((p, i) => (
                    <li key={i} className="text-[14px] leading-snug text-[var(--text-primary)]">
                      · {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.section>
        )}

        {actividad.conexionTema && (
          <motion.p variants={item} className="mb-6 text-[13px] leading-snug text-[var(--text-tertiary)]">
            🔗 {actividad.conexionTema}
          </motion.p>
        )}

        {/* ——— CAPA A: diferenciación por ETAPA — "Una experiencia, cuatro niveles" (se mantiene
            tal cual el usuario la aprobó; aplica igual a Circle Time, Outdoor, STEAM...). ——— */}
        {actividad.diferenciacion && (
          <motion.section
            variants={item}
            aria-label="Adaptación por etapa"
            className="mb-6 rounded-[var(--radius-card)] border-x border-b border-t-[3px] border-x-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-b-[color-mix(in_oklab,var(--text-tertiary)_16%,transparent)] border-t-[var(--accent)] bg-[var(--surface)] p-6 shadow-[var(--shadow-2)]"
          >
            <h2 className="text-[19px] font-semibold text-[var(--text-primary)] [font-family:var(--font-display)]">
              Una experiencia, cuatro niveles
            </h2>
            <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
              Así participa cada nivel en <strong>{actividad.titulo}</strong>.
            </p>
            <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Bandas de edad">
              {ETAPAS_ORDEN.map((etapa) => (
                <EtapaChip key={etapa} etapa={etapa} activa={etapa === etapaActiva} onClick={() => setEtapaActiva(etapa)} />
              ))}
            </div>
            <motion.p
              key={etapaActiva}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 rounded-[calc(var(--radius-button)-2px)] bg-[var(--surface-2)] p-4 text-[15px] leading-snug text-[var(--text-primary)] shadow-[inset_0_2px_4px_rgba(0,0,0,0.08)]"
            >
              {actividad.diferenciacion[etapaActiva]}
            </motion.p>
          </motion.section>
        )}

        {/* ——— CAPAS B y C, y observación — plegadas por defecto (regla del usuario). ——— */}
        <motion.div variants={item} className="mb-6 flex flex-col gap-3">
          {actividad.adaptacionesIndividuales && actividad.adaptacionesIndividuales.length > 0 && (
            <Colapsable titulo="Adaptaciones individuales" subtitulo="Ajustes puntuales — no implican un Plan Individual">
              <ul className="flex flex-col gap-2">
                {actividad.adaptacionesIndividuales.map((a, i) => {
                  const nino = ninoPorId(a.ninoId);
                  if (!nino) return null;
                  return (
                    <li key={i} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                      <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                          {nino.nombre} · <span className="font-normal text-[var(--text-secondary)]">{a.necesidad}</span>
                        </p>
                        <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">{a.ajuste}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Colapsable>
          )}

          {actividad.ninosFoco && actividad.ninosFoco.length > 0 && (
            <Colapsable titulo="Niños foco en esta actividad" subtitulo="Su meta activa, aprovechando esta misma experiencia">
              <ul className="flex flex-col gap-2">
                {actividad.ninosFoco.map((f, i) => {
                  const nino = ninoPorId(f.ninoId);
                  if (!nino) return null;
                  return (
                    <li key={i} className="flex items-start gap-3 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent)_7%,transparent)] p-3">
                      <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={30} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-semibold text-[var(--text-primary)]">
                          {nino.nombre} · <span className="font-normal text-[var(--accent)]">{f.meta}</span>
                        </p>
                        <p className="mt-0.5 text-[13px] leading-snug text-[var(--text-secondary)]">Observar: {f.observar}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </Colapsable>
          )}

          {(actividad.queObservar || actividad.evidenciaPosible) && (
            <Colapsable titulo="Qué observar">
              {actividad.queObservar && <p className="text-[14px] leading-snug text-[var(--text-primary)]">{actividad.queObservar}</p>}
              {actividad.evidenciaPosible && (
                <p className="mt-2 text-[13px] leading-snug text-[var(--text-secondary)]">
                  <strong className="text-[var(--text-primary)]">Evidencia posible:</strong> {actividad.evidenciaPosible}
                </p>
              )}
            </Colapsable>
          )}
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
