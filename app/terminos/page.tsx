export const metadata = { title: "Términos y condiciones — RAIZ" };

export default function Terminos() {
  return (
    <main className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)] px-6 py-16">
      <div className="max-w-[68ch] mx-auto">
        <h1 className="text-2xl font-bold mb-6" style={{ fontFamily: "var(--font-display)" }}>
          Términos y condiciones
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mb-8">
          Última actualización: septiembre de 2026. Documento en borrador — se completa con
          asesoría legal antes del lanzamiento público.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Qué es RAIZ</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ es una asistente pedagógica con IA para educadoras de primera infancia. No
          reemplaza el juicio profesional de la educadora: toda sugerencia de RAIZ (planeación,
          observación, evaluación) requiere su revisión y confirmación.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Uso permitido</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ está pensada para uso profesional dentro de un programa de cuidado o educación
          infantil (home daycare, family childcare, preschool). La cuenta es de la educadora o
          del programa; los niños no tienen cuenta propia.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Suscripción y cobros</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ se ofrece por suscripción mensual o anual, con un período de prueba gratuito. Los
          pagos se procesan a través de Hotmart. Puedes cancelar en cualquier momento desde tu
          cuenta.
        </p>

        <h2 className="text-lg font-semibold mt-8 mb-3">Límites de responsabilidad</h2>
        <p className="mb-4 leading-relaxed">
          RAIZ no diagnostica condiciones médicas ni de desarrollo, no reemplaza evaluaciones
          profesionales externas (terapia del habla, ocupacional, etc.) y no garantiza resultados
          específicos de aprendizaje.
        </p>

        <a href="/" className="inline-block mt-8 underline text-sm">← Volver al inicio</a>
      </div>
    </main>
  );
}
