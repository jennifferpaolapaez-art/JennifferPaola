'use client';

// "¿QUÉ CONVENDRÍA TRABAJAR AHORA?" — tarjeta de Progreso (Sesión 6, paso 7 / 6d). RAÍZ sugiere y
// explica por qué; la maestra decide (aceptar / cambiar / seguir observando / no priorizar). Como
// máximo 2 prioridades sugeridas: una PRINCIPAL y otra "también conviene observar" — nunca dos
// problemas equivalentes ni una lista. Ver `lib/prioridades.ts` para las reglas (todas DEMO).
// Lenguaje: sin diagnóstico y sin "niveles" — solo "va dentro de lo esperado", "seguir observando" o
// "podría beneficiarse de apoyo intencional".

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { ChevronRight } from 'lucide-react';
import type { Nino } from '@/lib/seed-data';
import {
  calcularPrioridadesDelNino,
  conclusionPlanDelNino,
  fechaCorta,
  leerDecisionesPrioridad,
  registrarDecisionPrioridad,
  ultimaDecision,
  type ContextoDatos,
  type DecisionPrioridad,
  type PrioridadSugerida,
  type TipoDecisionPrioridad,
} from '@/lib/prioridades';

type Rol = 'principal' | 'secundaria';

function Etiqueta({ children }: { children: React.ReactNode }) {
  return <p className="text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--text-tertiary)]">{children}</p>;
}

function BotonAccion({ children, onClick, principal = false }: { children: React.ReactNode; onClick: () => void; principal?: boolean }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={onClick}
      className={`min-h-11 rounded-[var(--radius-button)] px-3 py-2 text-[13px] font-semibold ${
        principal ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-primary)]'
      }`}
    >
      {children}
    </motion.button>
  );
}

function TarjetaPrioridad({
  p,
  rol,
  nino,
  alternativas,
  onDecidir,
  onCambiar,
}: {
  p: PrioridadSugerida;
  rol: Rol;
  nino: Nino;
  alternativas: PrioridadSugerida[];
  onDecidir: (p: PrioridadSugerida, d: TipoDecisionPrioridad) => void;
  onCambiar: (original: PrioridadSugerida, nueva: PrioridadSugerida) => void;
}) {
  const [cambiando, setCambiando] = useState(false);
  const etiqueta = rol === 'secundaria' ? 'También conviene observar' : p.nivel === 'apoyo_intencional' ? 'Prioridad principal' : 'Conviene seguir observando';
  const otras = alternativas.filter((a) => a.skillId !== p.skillId);

  return (
    <section
      aria-label={`${etiqueta}: ${p.area}`}
      className={`rounded-[var(--radius-card)] bg-[var(--surface)] p-5 ${rol === 'principal' ? 'shadow-[var(--shadow-2)]' : 'shadow-[var(--shadow-1)]'}`}
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">{etiqueta}</p>
      <h3 className="mt-1 text-balance text-[19px] font-bold leading-[1.2] text-[var(--text-primary)] [font-family:var(--font-display)]">Área sugerida: {p.area}</h3>
      <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{p.nombreSkill}</p>

      <div className="mt-4 flex flex-col gap-3.5">
        <div>
          <Etiqueta>Punto actual</Etiqueta>
          <p className="mt-0.5 text-[14px] leading-snug text-[var(--text-primary)]">{p.puntoActual}</p>
        </div>
        <div>
          <Etiqueta>Próximo paso sugerido</Etiqueta>
          <p className="mt-0.5 text-[14px] font-medium leading-snug text-[var(--text-primary)]">{p.proximoPaso}</p>
        </div>
        <div>
          <Etiqueta>¿Por qué?</Etiqueta>
          <ul className="mt-1 flex flex-col gap-1">
            {p.porQue.map((frase) => (
              <li key={frase} className="text-[13px] leading-snug text-[var(--text-secondary)]">
                {frase}
              </li>
            ))}
          </ul>
          {p.observacionIds.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
              {p.observacionIds.slice(0, 3).map((id, i) => (
                <Link key={id} href={`/observaciones/${id}`} className="text-[12px] font-semibold text-[var(--accent)] underline">
                  Ver observación que respalda esto{p.observacionIds.length > 1 ? ` (${i + 1})` : ''}
                </Link>
              ))}
            </div>
          )}
        </div>
        {p.oportunidades.length > 0 && (
          <div>
            <Etiqueta>Oportunidades naturales</Etiqueta>
            <ul className="mt-1 flex flex-col gap-0.5">
              {p.oportunidades.map((o) => (
                <li key={o} className="text-[13px] leading-snug text-[var(--text-secondary)]">
                  {o}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {cambiando ? (
        <div className="mt-4 rounded-[var(--radius-button)] bg-[var(--surface-2)] p-3">
          <p className="text-[13px] font-semibold text-[var(--text-primary)]">¿Qué habilidad prefieres priorizar?</p>
          {otras.length === 0 ? (
            <p className="mt-1 text-[13px] text-[var(--text-secondary)]">No hay otras habilidades en desarrollo para elegir ahora.</p>
          ) : (
            <ul className="mt-2 flex flex-col gap-1.5">
              {otras.map((o) => (
                <li key={o.skillId}>
                  <button
                    type="button"
                    onClick={() => onCambiar(p, o)}
                    className="flex min-h-11 w-full items-center justify-between gap-2 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 py-2 text-left text-[14px] text-[var(--text-primary)]"
                  >
                    <span>{o.nombreSkill}</span>
                    <ChevronRight size={16} className="text-[var(--text-tertiary)]" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setCambiando(false)} className="mt-2 text-[13px] font-semibold text-[var(--text-secondary)] underline">
            Cancelar
          </button>
        </div>
      ) : (
        <div className="mt-5 grid grid-cols-2 gap-2">
          <BotonAccion principal onClick={() => onDecidir(p, 'aceptada')}>
            Aceptar prioridad
          </BotonAccion>
          <BotonAccion onClick={() => setCambiando(true)}>Cambiar prioridad</BotonAccion>
          <BotonAccion onClick={() => onDecidir(p, 'seguir_observando')}>Seguir observando</BotonAccion>
          <BotonAccion onClick={() => onDecidir(p, 'no_priorizar')}>No priorizar ahora</BotonAccion>
        </div>
      )}
      <p className="mt-3 text-[12px] leading-snug text-[var(--text-tertiary)]">RAÍZ solo sugiere. No cambia nada hasta que tú decidas.</p>
    </section>
  );
}

export function TarjetaPrioridades({ nino, datos }: { nino: Nino; datos: ContextoDatos }) {
  const [decisiones, setDecisiones] = useState<DecisionPrioridad[]>(() => leerDecisionesPrioridad());
  const [aviso, setAviso] = useState<string | null>(null);
  const [revisando, setRevisando] = useState<string[]>([]);
  const [verAnteriores, setVerAnteriores] = useState(false);

  const calculo = useMemo(() => calcularPrioridadesDelNino(nino, datos, decisiones), [nino, datos, decisiones]);
  const conclusion = useMemo(() => conclusionPlanDelNino(calculo), [calculo]);

  // Las que la maestra decidió revisar de nuevo se comportan como sugeridas normales (tope 2 en total).
  const reabiertas: PrioridadSugerida[] = [...calculo.reabrir, ...calculo.silenciadas].filter((r) => revisando.includes(r.skillId));
  const pendientesReabrir = calculo.reabrir.filter((r) => !revisando.includes(r.skillId));
  const visibles = [...calculo.sugeridas, ...reabiertas].slice(0, 2);

  function decidir(p: PrioridadSugerida, decision: TipoDecisionPrioridad) {
    setDecisiones(registrarDecisionPrioridad(p, nino.id, decision));
    setRevisando((r) => r.filter((id) => id !== p.skillId));
    if (decision === 'aceptada') setAviso(`Listo — "${p.area}" quedó como prioridad aceptada.`);
    else if (decision === 'seguir_observando') setAviso('Listo — RAÍZ no vuelve a mostrártelo pronto; solo si pasan unas semanas o aparece información nueva.');
    else if (decision === 'no_priorizar') setAviso('Listo — queda en silencio. Solo volverá a aparecer si hay información importante nueva.');
    else if (decision === 'retirada') setAviso('Listo — la prioridad se quitó.');
  }

  function cambiar(original: PrioridadSugerida, nueva: PrioridadSugerida) {
    registrarDecisionPrioridad(original, nino.id, 'cambiada', { reemplazadaPorSkillId: nueva.skillId });
    setDecisiones(registrarDecisionPrioridad(nueva, nino.id, 'aceptada'));
    setRevisando((r) => r.filter((id) => id !== original.skillId));
    setAviso(`Listo — priorizaste "${nueva.area}" (${nueva.nombreSkill}) en lugar de "${original.area}".`);
  }

  function volverAMostrar(p: PrioridadSugerida) {
    setRevisando((r) => (r.includes(p.skillId) ? r : [...r, p.skillId]));
  }

  const silenciadasVisibles = calculo.silenciadas.filter((p) => !revisando.includes(p.skillId));
  const hayAlgo = visibles.length > 0 || calculo.aceptadas.length > 0 || pendientesReabrir.length > 0;

  return (
    <section aria-labelledby="titulo-prioridades" className="mb-6">
      <h2 id="titulo-prioridades" className="mb-1.5 text-[17px] font-bold text-[var(--text-primary)] [font-family:var(--font-display)]">
        ¿Qué convendría trabajar ahora?
      </h2>
      <p className="mb-3 text-[13px] leading-snug text-[var(--text-secondary)]">
        {conclusion === 'hay_areas'
          ? 'RAÍZ encontró áreas que podrían beneficiarse de apoyo intencional.'
          : conclusion === 'seguir_observando'
            ? 'Conviene seguir observando antes de decidir — todavía no hace falta un Plan Individual.'
            : `Por ahora ${nino.nombre} no necesita un Plan Individual — lo que está desarrollando va dentro de lo esperado.`}
      </p>

      {aviso && (
        <p role="status" className="mb-3 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--sage)_16%,transparent)] p-3 text-[13px] font-medium text-[var(--text-primary)]">
          {aviso}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {calculo.aceptadas.map((a) => (
          <div key={a.skillId} className="rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--accent)_8%,var(--surface))] p-4 shadow-[var(--shadow-1)]">
            <p className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Prioridad aceptada</p>
            <p className="mt-0.5 text-[16px] font-semibold text-[var(--text-primary)]">
              {a.area} · {a.nombreSkill}
            </p>
            <p className="mt-1 text-[13px] leading-snug text-[var(--text-secondary)]">
              <span className="font-semibold text-[var(--text-primary)]">Próximo paso: </span>
              {a.proximoPaso}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
              {a.nivel === 'apoyo_intencional' ? (
                <Link href={`/ninos/${nino.id}/plan-individual/propuesta`} className="flex min-h-11 items-center text-[14px] font-semibold text-[var(--accent)] underline">
                  Ver propuesta de Plan Individual
                </Link>
              ) : (
                <p className="text-[12px] leading-snug text-[var(--text-tertiary)]">Por ahora conviene seguir observando antes de proponer un plan.</p>
              )}
              <button type="button" onClick={() => decidir(a, 'retirada')} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
                Quitar prioridad
              </button>
            </div>
          </div>
        ))}

        {visibles.map((p, i) => (
          <TarjetaPrioridad key={p.skillId} p={p} rol={i === 0 ? 'principal' : 'secundaria'} nino={nino} alternativas={calculo.alternativas} onDecidir={decidir} onCambiar={cambiar} />
        ))}

        {pendientesReabrir.map((p) => (
          <div key={p.skillId} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3.5">
            <p className="text-[13px] leading-snug text-[var(--text-secondary)]">
              {p.motivoReabrir === 'informacion_nueva'
                ? `Desde tu última decisión apareció nueva información sobre "${p.nombreSkill}". ¿Quieres revisar esta prioridad?`
                : `Pasó el tiempo que elegiste para seguir observando "${p.nombreSkill}". ¿Quieres revisar esta prioridad?`}
            </p>
            <button type="button" onClick={() => volverAMostrar(p)} className="min-h-11 shrink-0 rounded-[var(--radius-button)] bg-[var(--surface)] px-3 text-[13px] font-semibold text-[var(--accent)]">
              Revisar
            </button>
          </div>
        ))}

        {!hayAlgo && (
          <p className="rounded-[var(--radius-card)] bg-[var(--surface)] p-4 text-[14px] leading-snug text-[var(--text-secondary)] shadow-[var(--shadow-1)]">
            {silenciadasVisibles.length > 0
              ? 'No hay nada nuevo que priorizar por ahora. Lo que dejaste en observación queda en silencio; RAÍZ solo te lo vuelve a mostrar si aparece información nueva.'
              : `Por ahora no hay nada que priorizar para ${nino.nombre}: lo que está desarrollando va dentro de lo esperado o ya tiene su propia meta. Sigue registrando observaciones y RAÍZ te avisará si algo conviene mirar.`}
          </p>
        )}
      </div>

      {silenciadasVisibles.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setVerAnteriores((v) => !v)} aria-expanded={verAnteriores} className="min-h-11 text-[13px] font-semibold text-[var(--text-secondary)] underline">
            Decisiones anteriores ({silenciadasVisibles.length})
          </button>
          {verAnteriores && (
            <ul className="mt-1 flex flex-col gap-2">
              {silenciadasVisibles.map((p) => {
                const d = ultimaDecision(decisiones, nino.id, p.skillId);
                const texto = d?.decision === 'no_priorizar' ? 'No priorizar ahora' : d?.decision === 'cambiada' ? 'Cambiaste la prioridad' : 'Seguir observando';
                return (
                  <li key={p.skillId} className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface-2)] p-3">
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[var(--text-primary)]">{p.nombreSkill}</p>
                      <p className="text-[12px] text-[var(--text-tertiary)]">
                        {texto}
                        {d ? ` · ${fechaCorta(d.fecha)}` : ''}
                      </p>
                    </div>
                    <button type="button" onClick={() => volverAMostrar(p)} className="min-h-11 shrink-0 text-[13px] font-semibold text-[var(--accent)] underline">
                      Volver a mostrar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
