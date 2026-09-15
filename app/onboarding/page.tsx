export const metadata = { title: "Empezar — RAIZ" };

export default function Onboarding() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] flex items-center justify-center px-6 py-16">
      <div className="max-w-md text-center">
        <p
          className="text-2xl font-bold mb-4"
          style={{ fontFamily: "var(--font-display)", color: "var(--accent)" }}
        >
          Raíz
        </p>
        <h1 className="text-xl font-semibold mb-3">El onboarding se construye en la Sesión 4</h1>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          Esta pantalla es un marcador de posición — aquí vivirá la configuración de tu programa,
          tu primer niño y tu primera semana. Por ahora, esta landing solo demuestra la promesa de
          RAIZ.
        </p>
        <a href="/" className="inline-block mt-8 underline text-sm">← Volver al inicio</a>
      </div>
    </main>
  );
}
