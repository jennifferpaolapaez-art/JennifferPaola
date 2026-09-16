# VEREDICTO revisor-visual — entrar
Fecha: 2026-09-14 00:00
Screenshot: docs/revisiones/entrar-375.png
Usabilidad: 35/40
Craft: 13/20
Copy (si vende): N-A
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. [Fondo, esquina inferior derecha] La hojita de firma (dispositivo ownable, opacity 0.05) es prácticamente invisible en el screenshot real; el mesh de fondo (14%/11%) tampoco se distingue a simple vista → EJE 3 identidad y EJE 2 profundidad casi planos pese al fix de ronda 3. Fix: subir la hojita a ~0.10-0.14 y volver a verificar contra un screenshot real, no solo el valor en código.
2. [Mitad inferior de la pantalla, bajo "Volver al inicio"] El centrado vertical de FunnelStage deja ~185px sin ningún elemento de apoyo visible (ni textura ni watermark perceptible) → se percibe como aire muerto aunque esté matemáticamente centrado. Fix: reubicar/agrandar el watermark para que caiga DENTRO de esa zona vacía en vez de la esquina extrema fuera de vista.
3. [Input de correo] Solo valida el formato al enviar (submit); no hay validación en onBlur → el usuario se entera del error recién al tocar el CTA. Fix: validar también en onBlur para feedback más temprano (heurística 5).
4. [Flujo de reingreso] No hay ningún atajo para quien vuelve a "Entrar" (ej. ya usó la app antes): no precarga el último correo desde localStorage. Fix: precargar `email` si existe una entrada previa guardada (heurística 7).
5. [Código — estado `error-envio`] El camino de fallo de red está diseñado (mensaje, UI) pero el `setTimeout` en `enviarEnlace` siempre resuelve a `'enviado'`, nunca a `'error-envio'` → ese estado es inalcanzable e imposible de verificar hasta conectar Supabase real. No bloqueante ahora (es una decisión de mockup honesto), pero anotar como pendiente de prueba post-integración en ESTADO.md.
