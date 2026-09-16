# VEREDICTO revisor-visual — landing
Fecha: 2026-09-14 (séptima pasada)
Screenshot: docs/revisiones/landing-375.png
Usabilidad: 29/40
Craft: 16/20
Copy (si vende): 19/20
Fidelidad (si hubo referencia): N/A
Veredicto: NO LISTA
Top defectos:
1. app/page.tsx L131 y L239 (Solucion → paso "Conoce", FAQ "¿Por qué no usar ChatGPT?"): palabra "skills" en inglés crudo, mientras Oferta.tsx usa "habilidades" para el mismo concepto — inconsistencia visible en pantalla → reemplazar "skills" por "habilidades" en ambos strings.
2. Techo estructural de Usabilidad: 4 rondas seguidas (R4-R7: 29/29/28/29) estancadas en el mismo rango pese a fixes reales — h3/h5/h7/h9/h10 tienen techo bajo porque es landing sin producto interactivo; no va a llegar a 36/40 con microajustes de copy/color, requiere o aceptar el techo del formato o agregar algún elemento interactivo genuino (calculadora, preview funcional) para destrabar esas heurísticas.
3. Oferta.tsx L129-142 (stack de valor Hormozi, sección "La oferta"): cada fila lleva borde + shadow inset + fondo surface-2 — a 375px se ve denso/recargado justo antes de las cards de precio → quitar el borde de cada fila y dejar solo el inset shadow.
4. Oferta.tsx L191 (card Mensual): borde al 38% de --text-tertiary sigue siendo sutil contra el tinte butter de fondo de sección — se distingue pero bastante menos que la card Anual → subir a shadow-2 más fondo levemente tintado, o borde al 50%+.
5. Fixes de la ronda 6 verificados y sostenidos: hero.png y frame-hoy.png ahora dicen "Collage del cuerpo" / "Mi cuerpo" de forma consistente y 100% en español; --accent-2 en #A64B32 da contraste holgado en texto normal y titulares; cards de Oferta se distinguen mejor del fondo que en R6 — ninguno de estos tres reabre defecto.
