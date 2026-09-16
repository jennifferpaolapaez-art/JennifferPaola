# VEREDICTO revisor-visual — paywall
Fecha: 2026-09-14 00:00
Screenshot: docs/revisiones/paywall-375.png
Usabilidad: 33/40
Craft: 15/20
Copy (si vende): 18/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. Fondo mesh imperceptible en el screenshot real pese al fix de ronda 2 (comentario en código dice "subido a 14%/11%") — el área superior (y 0-330px) se ve plana, color liso → medir el render real tras el fix, no solo el valor en código; subir opacidad/tamaño hasta que sea perceptible a 375-500px.
2. Espacio vacío excesivo arriba (~170px) y abajo (~200px) del bloque de contenido por el centrado vertical de <FunnelStage> — en la pantalla 1 del paywall (recap de valor), que debería sentirse "llena" para construir inversión emocional (regla 7 del SO) → anclar el contenido más arriba o sumar un elemento visual (mini-preview de la semana armada, ilustración) en vez de solo texto+card+CTA flotando.
3. Los 3 chips de ícono de la card de beneficios se perciben grisáceos, no en Deep Teal reconocible — bajo la tinta de 12% el acento se diluye contra Warm Cream → subir el tinte de fondo (16-18%) y/o el peso del ícono para que el acento de marca se note de un vistazo.
4. El dispositivo ownable (la hojita, firma de FICHA-ARTE.md) no aparece en ningún punto visible de esta pantalla salvo el logo diminuto del header — el watermark de <FunnelShell> está a opacity 0.05 y prácticamente invisible → subir su opacidad a un nivel perceptible o usar la hojita como marcador de al menos 1 de los 3 bullets, como ya hace <CheckCustom> en el kit de landing.
5. Pantalla de recap se siente sostenida por poco contenido (1 card + 1 CTA) para ser el primer paso de una secuencia de venta — pasa el gate de carga cognitiva pero no transmite "producto enriquecido" → sumar un refuerzo visual adicional (ej. resumen tipo mapa de las edades/grupos cubiertos) sin romper la regla de 1 acción primaria.
