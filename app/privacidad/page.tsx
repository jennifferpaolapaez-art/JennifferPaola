export const metadata = { title: "Privacidad — RAIZ" };

export default function Privacidad() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16">
      <div className="max-w-[68ch] mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Política de privacidad
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Última actualización: septiembre de 2026. RAIZ está en fase de construcción — esta
          política se revisa con asesoría legal antes del lanzamiento público (ver §59 del
          documento maestro de producto).
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Qué información recogemos</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ es una herramienta para educadoras de primera infancia. Recogemos: datos de la
          cuenta de la educadora (nombre, correo, programa), y datos pedagógicos de los niños que
          la educadora registra (nombre, fecha de nacimiento, observaciones, evidencia fotográfica
          cuando aplica). Los niños nunca crean una cuenta ni interactúan directamente con RAIZ.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Cómo protegemos los datos de los niños</h2>
        <p className="mb-4 leading-relaxed">
          Solo se recoge la información necesaria pedagógicamente. Las fotos, videos y documentos
          de evidencia son privados, se almacenan cifrados, y no se comparten con nadie fuera del
          programa de la educadora sin su autorización explícita. Los metadatos de ubicación se
          eliminan de las fotos al subirlas.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Uso de inteligencia artificial</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ usa IA para ayudar a generar planeaciones y reformular observaciones. No enviamos al
          modelo de IA apellidos, direcciones ni información familiar de los niños. No usamos datos
          de niños para entrenar modelos ni para publicidad. Ver el{" "}
          <a href="/aviso-ia" className="underline">Aviso de IA</a> para más detalle.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Tus derechos</h2>
        <p className="mb-4 leading-relaxed">
          Puedes solicitar exportar o eliminar la información de tu programa escribiendo a{" "}
          <a href="mailto:hola@raizapp.com" className="underline">hola@raizapp.com</a>.
        </p>

        <a href="/" className="inline-block mt-8 underline text-sm">← Volver al inicio</a>
      </div>
    </main>
  );
}
