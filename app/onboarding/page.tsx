export const metadata = { title: "Empezar — RAIZ" };

export default function Onboarding() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <img src="/brand/raiz-logo.png" alt="Raíz" className="h-8 w-auto mx-auto mb-4" />
        <h1 className="text-xl font-semibold mb-3">
          El onboarding se construye en la <span className="accent text-[var(--accent)]">Sesión 4</span>
        </h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          Marcador de posición: aquí vivirá la configuración de tu programa, tu primer niño y tu
          primera semana.
        </p>
        <a href="/" className="inline-block mt-8 underline text-sm">← Volver al inicio</a>
      </div>
    </main>
  );
}
