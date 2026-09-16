# VEREDICTO revisor-visual — onboarding
Fecha: 2026-09-14 00:00
Screenshot: docs/revisiones/onboarding-375.png
Usabilidad: 30/40
Craft: 11/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Fondo completo] El mesh radial (14%/11%) y la hojita de firma (opacity 0.05, esquina inferior derecha) NO se perciben en el screenshot real — la pantalla se ve como un fill plano de principio a fin → subir el mesh a ~20-24% en el radial más cercano al contenido y la hojita a 10-12% (o darle un borde/tono de superficie propio en vez de solo opacity), y volver a verificar contra un screenshot real antes de dar el fix por hecho.
2. [Centro vertical de la pantalla, entre topbar y primer chip, y entre último chip y el borde inferior] Queda ~45% de la altura del viewport vacía (≈170px arriba del eyebrow, ≈200px abajo del último chip) por el centrado vertical de FunnelStage con solo 3 chips de contenido → anclar el bloque más arriba (padding-top fijo en vez de centrado por flex) o añadir un elemento de apoyo (ilustración, dato de contexto) en preguntas cortas que no llenan el viewport.
3. [Topbar, logo "Raíz"] Con nada seleccionado en el paso 0, el único acento de marca visible en toda la pantalla son 2 líneas de texto diminutas (eyebrow teal + hilo del progreso) — el resto es texto neutro sobre fondo plano, lo que hace que la primera impresión no comunique la identidad de marca (teal/mostaza/serif) de FICHA-ARTE.md.
4. [Los 3 QuestionChip] Sin selección, los tres chips son visualmente idénticos entre sí (mismo fondo de ícono neutro) — ningún color de marca distingue las opciones hasta hacer tap; el acento solo aparece DESPUÉS del clic, nunca antes.
5. [Pantalla completa] Heurística 7 (flexibilidad/atajos): no existe forma de responder con teclado (ej. 1/2/3) en escritorio ni ningún atajo para el usuario avanzado — solo clic/tap.
