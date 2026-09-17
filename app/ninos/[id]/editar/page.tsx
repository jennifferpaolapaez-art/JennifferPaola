'use client';

// EDITAR NIÑO — reusa <NinoFormulario> precargado con los datos actuales (Módulo Niños, Sesión 6
// paso 3). Nada queda "atrapado": se puede volver y editar cuando sea.

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { NinoFormulario } from '@/components/app/nino-formulario';
import { guardarNinos, leerNinos, ninoPorId, type Nino } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

export default function EditarNino() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [ninos, setNinos] = useState<Nino[]>([]);
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    setNinos(leerNinos());
    setCargado(true);
  }, []);

  const nino = ninoPorId(params.id, ninos);

  function guardar(actualizado: Nino) {
    guardarNinos(ninos.map((n) => (n.id === actualizado.id ? actualizado : n)));
    router.push(`/ninos/${actualizado.id}`);
  }

  if (!cargado) return null;

  if (!nino) {
    return (
      <AppShell>
        <div className="flex flex-col items-center gap-3 rounded-[var(--radius-card)] bg-[var(--surface)] px-6 py-12 text-center">
          <h1 className="text-[18px] font-semibold text-[var(--text-primary)]">No encontramos a este niño</h1>
          <button type="button" onClick={() => router.push('/ninos')} className="mt-2 text-[14px] font-semibold text-[var(--accent)] underline">
            Volver a Niños
          </button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push(`/ninos/${nino.id}`)}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Editar</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            {nino.nombre}
          </h1>
        </motion.header>

        <motion.div variants={item}>
          <NinoFormulario ninoExistente={nino} onGuardar={guardar} />
        </motion.div>
      </motion.div>
    </AppShell>
  );
}
