'use client';

// PROGRESO VIVO del niño (Sesión 6, paso 7 / 6c). Vista que se CALCULA al abrir — nunca se guarda
// ni se congela (los snapshots son los reportes, 6e/6f). Sin porcentajes ("Motricidad fina 67%"
// da una falsa precisión): la maestra ve, en palabras, qué está consolidado, qué está en
// desarrollo, qué necesita más evidencia y qué no se ha observado, y entra a cada habilidad para
// ver de dónde sale ese estado. Los estados solo cambian con una acción explícita de la maestra
// (aprobar una evaluación o "Revisar habilidad") — registrar una observación nunca los mueve.

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { AppShell, AvatarInicial, SkillBadge } from '@/components/app/shell';
import {
  GRUPO_PROGRESO_LABEL,
  SKILLS_CATALOG,
  calcularEdadTexto,
  evidenciaNuevaParaRevisar,
  grupoProgreso,
  leerEventosSkill,
  leerNinos,
  leerObservacionSkills,
  leerObservaciones,
  leerProgramaConfig,
  ninoPorId,
  resumenProgresoTexto,
  skillsEsperadosSinEstado,
  TINT_HEX,
  type EventoSkill,
  type GrupoProgreso,
  type Nino,
  type Observacion,
  type ObservacionSkill,
  type ProgramaConfig,
} from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
};

const ORDEN_GRUPOS: GrupoProgreso[] = ['consolidado', 'en_desarrollo', 'necesita_evidencia', 'sin_observar'];
const ESTADO_META_LABEL: Record<string, string> = {
  por_trabajar: 'Por trabajar',
  en_progreso: 'En progreso',
  casi: 'Casi lograda',
  alcanzado: 'Cumplida',
};

interface FilaSkill {
  id: string;
  nombre: string;
  dominio: string;
  grupo: GrupoProgreso;
  conEstado: boolean;
  estados?: { estadoDesarrollo: Nino['skills'][number]['estadoDesarrollo']; estadoEvidencia: Nino['skills'][number]['estadoEvidencia'] };
  nuevaEvidencia: number;
}

export default function ProgresoNino() {
  const params = useParams<{ id: string }>();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [relaciones, setRelaciones] = useState<ObservacionSkill[]>([]);
  const [eventos, setEventos] = useState<EventoSkill[]>([]);
  const [config, setConfig] = useState<ProgramaConfig | null>(null);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setRelaciones(leerObservacionSkills());
    setEventos(leerEventosSkill());
    setConfig(leerProgramaConfig());
    setCargado(true);
  }, []);

  if (!cargado || !config) return null;
  const nino = ninoPorId(params.id, ninos);

  if (!nino) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos a este niño</h1>
          <Link href="/ninos" className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a Niños
          </Link>
        </div>
      </AppShell>
    );
  }

  const filas: FilaSkill[] = nino.skills.map((s) => {
    const catalogo = SKILLS_CATALOG.find((c) => c.id === s.id);
    return {
      id: s.id,
      nombre: s.nombre,
      dominio: catalogo?.dominio ?? '',
      grupo: grupoProgreso(s),
      conEstado: true,
      estados: { estadoDesarrollo: s.estadoDesarrollo, estadoEvidencia: s.estadoEvidencia },
      nuevaEvidencia: evidenciaNuevaParaRevisar(nino.id, s, observaciones, relaciones, eventos).length,
    };
  });
  for (const esperado of skillsEsperadosSinEstado(nino, config.tracksActivos)) {
    const catalogo = SKILLS_CATALOG.find((c) => c.id === esperado.id);
    filas.push({
      id: esperado.id,
      nombre: esperado.nombre,
      dominio: catalogo?.dominio ?? '',
      grupo: 'sin_observar',
      conEstado: false,
      nuevaEvidencia: evidenciaNuevaParaRevisar(nino.id, { id: esperado.id }, observaciones, relaciones, eventos).length,
    });
  }

  const conteo: Record<GrupoProgreso, number> = { consolidado: 0, en_desarrollo: 0, necesita_evidencia: 0, sin_observar: 0 };
  for (const f of filas) conteo[f.grupo] += 1;
  const conNuevaEvidencia = filas.filter((f) => f.nuevaEvidencia > 0);
  const metasActivas = (nino.planIndividual?.metas ?? []).filter((m) => m.estado !== 'alcanzado');

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <Link
            href={`/ninos/${nino.id}`}
            aria-label="Volver al perfil"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </Link>
        </motion.div>

        <motion.header variants={item} className="mb-5 flex items-center gap-4">
          <AvatarInicial nombre={nino.nombre} hex={TINT_HEX[nino.colorTint]} size={48} />
          <div className="min-w-0">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Progreso</p>
            <h1 className="text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">{nino.nombre}</h1>
            <p className="text-[13px] text-[var(--text-secondary)]">
              {calcularEdadTexto(nino.fechaNacimiento)} · {nino.etapa}
            </p>
          </div>
        </motion.header>

        <motion.p variants={item} className="mb-6 text-[15px] leading-relaxed text-[var(--text-primary)]">
          {resumenProgresoTexto(nino.nombre, conteo, conNuevaEvidencia.length)}
        </motion.p>

        {conNuevaEvidencia.length > 0 && (
          <motion.section variants={item} className="mb-6 rounded-[var(--radius-card)] bg-[color-mix(in_oklab,var(--butter)_14%,transparent)] p-4">
            <h2 className="text-[14px] font-semibold text-[var(--text-primary)]">Hay nueva evidencia para revisar</h2>
            <p className="mt-0.5 text-[12px] text-[var(--text-secondary)]">Nada cambia hasta que tú lo decidas.</p>
            <ul className="mt-2 flex flex-col gap-1">
              {conNuevaEvidencia.map((f) => (
                <li key={f.id}>
                  <Link href={`/ninos/${nino.id}/progreso/${f.id}?revisar=1`} className="flex items-center justify-between gap-2 py-1.5 text-[14px] font-medium text-[var(--accent)]">
                    <span>
                      {f.nombre} · {f.nuevaEvidencia} {f.nuevaEvidencia === 1 ? 'observación nueva' : 'observaciones nuevas'}
                    </span>
                    <ChevronRight size={16} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {metasActivas.length > 0 && (
          <motion.section variants={item} className="mb-6">
            <h2 className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">Metas activas</h2>
            <ul className="flex flex-col gap-2">
              {metasActivas.map((m) => (
                <li key={m.id}>
                  <Link
                    href={m.skillId ? `/ninos/${nino.id}/progreso/${m.skillId}` : `/ninos/${nino.id}/plan-individual`}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)]"
                  >
                    <div className="min-w-0">
                      <p className="text-[14px] font-medium text-[var(--text-primary)]">{m.descripcion}</p>
                      <p className="mt-0.5 text-[12px] font-semibold text-[var(--accent)]">{ESTADO_META_LABEL[m.estado]}</p>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </motion.section>
        )}

        {ORDEN_GRUPOS.map((grupo) => {
          const delGrupo = filas.filter((f) => f.grupo === grupo);
          if (delGrupo.length === 0) return null;
          return (
            <motion.section key={grupo} variants={item} className="mb-6">
              <h2 className="mb-2 text-[16px] font-semibold text-[var(--text-primary)]">
                {GRUPO_PROGRESO_LABEL[grupo]} <span className="text-[13px] font-normal text-[var(--text-tertiary)]">· {delGrupo.length}</span>
              </h2>
              <ul className="flex flex-col gap-2">
                {delGrupo.map((f) => (
                  <li key={f.id}>
                    <Link
                      href={`/ninos/${nino.id}/progreso/${f.id}`}
                      className="flex items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] p-4 shadow-[var(--shadow-1)] transition-opacity active:opacity-90"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-[15px] font-medium text-[var(--text-primary)]">{f.nombre}</p>
                        {f.nuevaEvidencia > 0 && <p className="mt-0.5 text-[12px] font-semibold text-[var(--butter)]">Nueva evidencia para revisar</p>}
                      </div>
                      {f.estados ? <SkillBadge estadoDesarrollo={f.estados.estadoDesarrollo} estadoEvidencia={f.estados.estadoEvidencia} /> : (
                        <span className="text-[12px] text-[var(--text-tertiary)]">Sin dato</span>
                      )}
                      <ChevronRight size={16} className="shrink-0 text-[var(--text-tertiary)]" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.section>
          );
        })}

        <motion.p variants={item} className="mt-2 text-center text-[13px] leading-snug text-[var(--text-tertiary)]">
          Tener muchas habilidades “en desarrollo” es parte normal de crecer — no es una señal de alarma. Los estados solo cambian cuando tú los apruebas.
        </motion.p>
      </motion.div>
    </AppShell>
  );
}
