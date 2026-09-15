export const metadata = { title: "Aviso de IA — RAIZ" };

export default function AvisoIA() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16">
      <div className="max-w-[68ch] mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Aviso sobre el uso de inteligencia artificial
        </h1>

        <h2 className="text-lg font-semibold mt-8 mb-3">Qué hace la IA en RAIZ</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ usa modelos de lenguaje para ayudarte a generar planeaciones semanales adaptadas,
          sugerir actividades y reformular tus observaciones en lenguaje profesional. La IA
          propone; tú siempre revisas y confirmas antes de que algo quede guardado como definitivo.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Lo que la IA nunca hace</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ no diagnostica, no declara retrasos de desarrollo, no marca automáticamente una meta
          como lograda, y no asume que una observación aislada representa dominio de una habilidad.
          Siempre pide tu confirmación antes de actualizar el progreso de un niño.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Datos que se envían al modelo de IA</h2>
        <p className="mb-4 leading-relaxed">
          Para generar una planeación o reformular una observación, RAIZ envía solo la información
          pedagógica necesaria (primer nombre o identificador interno, edad, skills, contexto de la
          actividad) — nunca apellidos, direcciones ni datos familiares. Los proveedores de IA que
          usamos no entrenan sus modelos con estos datos.
        </p>

        <a href="/" className="inline-block mt-8 underline text-sm">← Volver al inicio</a>
      </div>
    </main>
  );
}
