'use client';

// AGREGAR NIÑO — primera pantalla de CREACIÓN real de la app (Módulo Niños, Sesión 6 paso 3).
// Reusa <NinoFormulario> (compartido con /ninos/[id]/editar). Persiste en localStorage — Supabase
// llega en el paso 8 del orden acordado con el usuario.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, type Variants } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import { AppShell } from '@/components/app/shell';
import { NinoFormulario } from '@/components/app/nino-formulario';
import { guardarNinos, leerNinos, type Nino } from '@/lib/seed-data';

const lista: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.05 } } };
const item: Variants = { hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } } };

export default function NuevoNino() {
  const router = useRouter();
  const [guardando, setGuardando] = useState(false);

  function guardar(nino: Nino) {
    setGuardando(true);
    const actuales = leerNinos();
    guardarNinos([...actuales, nino]);
    router.push(`/ninos/${nino.id}`);
  }

  return (
    <AppShell>
      <motion.div variants={lista} initial="hidden" animate="visible">
        <motion.div variants={item} className="mb-2">
          <button
            type="button"
            onClick={() => router.push('/ninos')}
            aria-label="Atrás"
            className="flex size-9 items-center justify-center rounded-full text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)]"
          >
            <ArrowLeft size={18} aria-hidden="true" />
          </button>
        </motion.div>

        <motion.header variants={item} className="mb-6">
          <p className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[var(--accent)]">Tu grupo</p>
          <h1 className="mt-1 text-balance text-[24px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
            Agregar niño
          </h1>
          <p className="mt-1 text-[14px] text-[var(--text-secondary)]">
            Solo el nombre y la fecha de nacimiento son obligatorios — puedes completar el resto después.
          </p>
        </motion.header>

        <motion.div variants={item}>
          <NinoFormulario onGuardar={guardar} />
        </motion.div>
        {guardando && <p className="mt-3 text-center text-[13px] text-[var(--text-tertiary)]">Guardando…</p>}
      </motion.div>
    </AppShell>
  );
}
