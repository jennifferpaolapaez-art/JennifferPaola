'use client';

// LOGIN — Sesión 4, último paso del funnel (spec E de 50-DISENO-ONBOARDING-PAYWALL.md).
// Magic link por email (método primario, decisión Hotmart-first de 26-AUTH-MODERNO.md) +
// Google OAuth secundario. Supabase Auth real se conecta en la fase de servicios externos
// (51/62) — por ahora el envío se simula localmente con los 3 estados ya diseñados, para que
// conectar el backend después sea cablear una función, no rediseñar la pantalla.
// Ronda 1 revisor-visual: fix vacío muerto (FunnelStage) + <form onSubmit> real (Enter envía) +
// regex de email en vez de solo ".includes('@')" + mensajes de error separados por causa +
// AnimatePresence en el cambio de estado idle→enviado.

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Lock } from 'lucide-react';
import { FunnelShell, FunnelStage, FunnelHeader, FunnelCta } from '@/components/onboarding/ui';

type Estado = 'idle' | 'enviando' | 'enviado' | 'error-formato' | 'error-envio';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58Z" />
    </svg>
  );
}

export default function Entrar() {
  const reduce = useReducedMotion();
  const [estado, setEstado] = useState<Estado>('idle');
  const [email, setEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [googleNota, setGoogleNota] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Fix revisor-visual ronda 3 (heurística 7, flexibilidad): precarga el último correo usado,
  // para quien vuelve a entrar no tenga que volver a escribirlo.
  useEffect(() => {
    const ultimo = localStorage.getItem('raiz_ultimo_correo');
    if (ultimo) setEmail(ultimo);
  }, []);

  // Fix revisor-visual ronda 3: antes solo validaba al enviar — el usuario se enteraba del
  // error recién al tocar el CTA. Ahora valida también al salir del campo (onBlur).
  const validarAlSalir = () => {
    if (email.trim().length > 0 && !EMAIL_RE.test(email.trim())) {
      setEstado('error-formato');
    }
  };

  const enviarEnlace = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!EMAIL_RE.test(email.trim())) {
      setEstado('error-formato');
      return;
    }
    setEstado('enviando');
    localStorage.setItem('raiz_ultimo_correo', email.trim());
    // Simulación local — Sesión 6 conecta supabase.auth.signInWithOtp aquí.
    setTimeout(() => {
      // Fallo simulado ~0% en producción real; aquí queda el camino de error cableado
      // (spec E: "ERROR: humano y accionable") para cuando el envío real pueda fallar —
      // hoy no es alcanzable hasta conectar Supabase (anotado en ESTADO.md).
      setEstado('enviado');
      setCooldown(60);
      timerRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1 && timerRef.current) clearInterval(timerRef.current);
          return Math.max(0, c - 1);
        });
      }, 1000);
    }, 900);
  };

  const enviando = estado === 'enviando';
  const error = estado === 'error-formato' || estado === 'error-envio';

  return (
    <FunnelShell>
      <div className="px-5 pt-4">
        <div className="mx-auto w-full max-w-[420px]">
          <FunnelHeader />
        </div>
      </div>

      <FunnelStage topbarHeight={64}>
        <div className="mx-auto flex w-full max-w-[420px] flex-col px-5">
          <AnimatePresence mode="wait">
            {estado !== 'enviado' ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
                  Entra a tu plan
                </h1>
                <p className="mt-2 text-[14px] leading-snug text-[var(--text-secondary)]">
                  Para guardarlo y verlo en cualquier dispositivo. Si compraste por Hotmart, usa el correo de tu compra.
                </p>

                <form onSubmit={enviarEnlace} className="mt-7 flex flex-col gap-3" noValidate>
                  <div>
                    <input
                      id="email-entrar"
                      type="email"
                      autoFocus
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setEstado('idle');
                      }}
                      onBlur={validarAlSalir}
                      placeholder="tu@correo.com"
                      aria-invalid={error}
                      aria-describedby={error ? 'email-error' : undefined}
                      className={`h-14 w-full rounded-[var(--radius-button)] border bg-[var(--surface)] px-4 text-[16px] text-[var(--text-primary)] outline-none transition-colors ${
                        error ? 'border-[#B6553A]' : 'border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] focus-visible:border-[var(--accent)]'
                      }`}
                    />
                    {estado === 'error-formato' && (
                      <p id="email-error" className="mt-1.5 text-[13px] text-[#B6553A]">
                        Ese correo no se ve completo — revisa que tenga la forma nombre@correo.com.
                      </p>
                    )}
                    {estado === 'error-envio' && (
                      <p id="email-error" className="mt-1.5 text-[13px] text-[#B6553A]">
                        No pudimos enviar el enlace. Revisa tu conexión e intenta de nuevo.
                      </p>
                    )}
                  </div>

                  <FunnelCta disabled={enviando}>
                    {enviando ? 'Enviando…' : 'Enviarme mi enlace de acceso'}
                  </FunnelCta>
                </form>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={() => setGoogleNota(true)}
                  aria-describedby={googleNota ? 'google-nota' : undefined}
                  className="mt-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-[var(--radius-button)] border border-[color-mix(in_oklab,var(--text-tertiary)_30%,transparent)] bg-[var(--surface)] text-[15px] font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-2)]"
                >
                  <GoogleG />
                  Continuar con Google
                </motion.button>
                <AnimatePresence>
                  {googleNota && (
                    <motion.p
                      id="google-nota"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 text-center text-[13px] text-[var(--text-secondary)]"
                    >
                      El acceso con Google llega muy pronto — por ahora entra con tu enlace por correo.
                    </motion.p>
                  )}
                </AnimatePresence>

                <p className="mt-5 flex items-center gap-1.5 text-[13px] text-[var(--text-tertiary)]">
                  <Lock size={14} strokeWidth={2} aria-hidden="true" />
                  Sin contraseñas: te llegará un enlace de un solo uso.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="enviado"
                initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -10 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <h1 className="text-balance text-[26px] font-bold leading-[1.15] text-[var(--text-primary)] [font-family:var(--font-display)]">
                  Revisa tu correo
                </h1>
                <p className="mt-2 text-[15px] leading-relaxed text-[var(--text-secondary)]">
                  Te enviamos el enlace de acceso a <span className="font-semibold text-[var(--text-primary)]">{email}</span>.
                </p>
                <button
                  type="button"
                  disabled={cooldown > 0}
                  onClick={() => enviarEnlace()}
                  className="mt-6 text-[14px] font-medium text-[var(--accent)] disabled:text-[var(--text-tertiary)]"
                >
                  {cooldown > 0 ? `Reenviar en ${cooldown}s` : 'Reenviar enlace'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <a href="/" className="mt-10 text-center text-[13px] text-[var(--text-tertiary)] underline">
            ← Volver al inicio
          </a>
        </div>
      </FunnelStage>
    </FunnelShell>
  );
}
