# VEREDICTO revisor-visual — pantalla-principal (Hoy)
Fecha: 2026-09-15 00:00
Screenshot: docs/revisiones/pantalla-principal-375.png
Usabilidad: 28/40
Craft: 14/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. Pie de pantalla ("Cada observación de hoy mejora la planeación de mañana") queda cortado/pisado por la barra de navegación inferior sticky — main solo tiene pb-6, insuficiente para la altura de la nav (h-16 + safe-area) → aumentar el padding-bottom del main (ej. pb-24) o insertar un spacer antes de la nav.
2. Chips de banda de edad (Infant/Toddler/Preschool/Pre-K) miden ~34px de alto (py-2 + texto 13px), por debajo del mínimo táctil de 44px de la Regla UX 5 → subir a py-3/min-h-11.
3. El cambio de contenido al tocar otra banda de edad no tiene animación de salida (solo entra el nuevo texto por key, sin AnimatePresence) → envolver en AnimatePresence mode="wait" para el cross-fade suave que promete la firma de movimiento de FICHA-ARTE.
4. La banda activa por defecto ("Preschool") no tiene lógica visible de personalización ni se recuerda entre visitas (heurística 7) → persistir última selección o derivarla de los niños foco del día.
5. Dentro de la card "Una experiencia, cuatro niveles", los tamaños de texto secundario (13/14/15px) quedan demasiado cerca entre sí — al entrecerrar los ojos el nivel body/label se aplana → ampliar la diferencia de tamaño/peso entre el subtítulo de la card y el cuerpo de la diferenciación.
