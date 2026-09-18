'use client';

// OBSERVACIONES — módulo principal, entrada independiente a documentar (Sesión 6, paso 6).
// Regla del usuario: "centro rápido de documentación, no otro módulo pesado" — CTA de "Nueva
// observación" siempre arriba, historial con filtros sencillos debajo (niño, período). Reutiliza
// el MISMO formulario (`/observar`) y el MISMO historial (`FilaObservacion`) que ya usa el perfil
// del niño — cero lógica ni datos duplicados. Sin niños registrados: empty state simple, nunca
// bloquea ni empuja a usar perfiles infantiles (regla del usuario: una maestra que solo planea no
// debe sentirse presionada a documentar individualmente).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion, type Variants } from 'motion/react';
import { NotebookPen, Plus } from 'lucide-react';
import { AppShell, Chip, FilaObservacion } from '@/components/app/shell';
import { leerNinos, leerObservaciones, leerObservacionSkills, skillsDeObservacion, FECHA_HOY, TINT_HEX, type Nino, type Observacion, type ObservacionSkill } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const item: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
};

function haceDiasOMenos(fecha: string, dias: number): boolean {
  const diff = (new Date(`${FECHA_HOY}T00:00:00`).getTime() - new Date(`${fecha}T00:00:00`).getTime()) / 86400000;
  return diff >= 0 && diff <= dias;
}

export default function Observaciones() {
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [observaciones, setObservaciones] = useState<Observacion[]>([]);
  const [skills, setSkills] = useState<ObservacionSkill[]>([]);
  const [cargado, setCargado] = useState(false);
  const [ninoFiltro, setNinoFiltro] = useState<string | 'todos'>('todos');
  const [periodoFiltro, setPeriodoFiltro] = useState<'todo' | 'semana'>('todo');

  useEffect(() => {
    setNinos(leerNinos());
    setObservaciones(leerObservaciones());
    setSkills(leerObservacionSkills());
    setCargado(true);
  }, []);

  if (!cargado) return null;

  if (ninos.length === 0) {
    return (
      <AppShell>
        <motion.div variants={lista} initial="hidden" animate="visible">
          <motion.header variants={item} className="mb-6">
            <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Observaciones</p>
            <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
              Documenta lo que ves
            </h1>
          </motion.header>
          <motion.div variants={item} className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_10%,transparent)] text-[var(--accent)]">
              <NotebookPen size={26} aria-hidden="true" />
            </span>
            <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">
              Aún no tienes niños registrados.
              <br />
              Crea un perfil cuando quieras comenzar a documentar observaciones individuales.
            </p>
            <Link
              href="/ninos/nuevo"
              className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)]"
            >
              <Plus size={18} aria-hidden="true" />
              Crear niño
            </Link>
          </motion.div>
        </motion.div>
      </AppShell>
    );
  }

  const filtradas = observaciones
    .filter((o) => ninoFiltro === 'todos' || o.ninoId === ninoFiltro)
    .filter((o) => periodoFiltro === 'todo' || haceDiasOMenos(o.fecha, 7))
    .sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Observaciones</p>
          <h1 className="mt-1 text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Documenta lo que ves
          </h1>
        </motion.header>

        <motion.div variants={item} className="mb-6">
          <Link
            href="/observar"
            className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[16px] font-semibold text-[var(--bg)] shadow-[0_8px_30px_color-mix(in_oklab,var(--accent)_25%,transparent)]"
          >
            <NotebookPen size={20} aria-hidden="true" />
            Nueva observación
          </Link>
        </motion.div>

        <motion.div variants={item} className="mb-4 flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <Chip label="Todos" activo={ninoFiltro === 'todos'} onClick={() => setNinoFiltro('todos')} />
            {ninos.map((n) => (
              <Chip key={n.id} label={n.nombre} activo={ninoFiltro === n.id} onClick={() => setNinoFiltro(n.id)} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip label="Todo el historial" activo={periodoFiltro === 'todo'} onClick={() => setPeriodoFiltro('todo')} />
            <Chip label="Últimos 7 días" activo={periodoFiltro === 'semana'} onClick={() => setPeriodoFiltro('semana')} />
          </div>
        </motion.div>

        <motion.ul variants={item} className="flex flex-col gap-2">
          {filtradas.length === 0 ? (
            <li className="rounded-[var(--radius-card)] bg-[var(--surface)] p-6 text-center text-[14px] text-[var(--text-secondary)]">
              No hay observaciones con este filtro todavía.
            </li>
          ) : (
            filtradas.map((o) => {
              const nino = ninos.find((n) => n.id === o.ninoId);
              if (!nino) return null;
              return (
                <li key={o.id}>
                  <FilaObservacion observacion={o} ninoNombre={nino.nombre} ninoHex={TINT_HEX[nino.colorTint]} skills={skillsDeObservacion(o.id, skills)} />
                </li>
              );
            })
          )}
        </motion.ul>
      </motion.div>
    </AppShell>
  );
}
