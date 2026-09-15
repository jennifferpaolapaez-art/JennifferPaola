export const metadata = { title: "Reembolsos — RAIZ" };

export default function Reembolsos() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16">
      <div className="max-w-[68ch] mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Política de reembolsos
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Última actualización: septiembre de 2026. ⚠️ Este plazo se verifica contra la
          configuración real del producto en Hotmart antes del lanzamiento — no puede prometerse
          más de lo que la plataforma permite ejecutar.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">La Garantía de tu Primera Semana</h2>
        <p className="mb-4 leading-relaxed">
          Si dentro de tus primeros 15 días con RAIZ no recibes una planeación semanal realmente
          diferenciada para tu grupo, escríbenos y te devolvemos el pago completo. Sin preguntas,
          sin formularios largos. (7 días de prueba gratuita + margen real de cobertura después
          del primer cobro.)
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Cómo pedir tu reembolso</h2>
        <p className="mb-4 leading-relaxed">
          Escribe a{" "}
          <a href="mailto:hola@raizapp.com" className="underline">hola@raizapp.com</a>{" "}
          desde el correo con el que te suscribiste, dentro de los 15 días. Procesamos el
          reembolso a través de Hotmart, tu procesador de pago.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Cancelación</h2>
        <p className="mb-4 leading-relaxed">
          Puedes cancelar tu suscripción en cualquier momento desde tu cuenta; seguirás teniendo
          acceso hasta el final del período ya pagado.
        </p>

        <a href="/" className="inline-block mt-8 underline text-sm">← Volver al inicio</a>
      </div>
    </main>
  );
}
