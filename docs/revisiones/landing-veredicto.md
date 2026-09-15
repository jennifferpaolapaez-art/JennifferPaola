# VEREDICTO revisor-visual — landing
Fecha: 2026-09-14
Screenshot: docs/revisiones/landing-375.png
Usabilidad: 27/40
Craft: 12/20
Copy (si vende): 14/20
Fidelidad (si hubo referencia): N-A
Veredicto: NO LISTA
Top defectos:
1. Identidad ownable ausente — components/landing/ui.tsx `CheckCustom` (líneas 79-88) usa el ícono genérico Lucide `Check` en vez de la hojita de la "í" que FICHA-ARTE.md declara como dispositivo ownable repetido en bullets/logros/favicon; el kit es intercambiable con cualquier landing SaaS. Fix: sustituir el ícono del check por la hojita propia.
2. CTA con copy inconsistente entre secciones — app/page.tsx usa "Crear mi primera semana gratis" (líneas 26/247) pero Oferta.tsx cambia a "Empezar mis 7 días gratis" (línea 182) y "Elegir mensual" (línea 195), rompiendo la propia regla del kit ("MISMO verbo del hero", AppPorDentro.tsx línea 31). Fix: unificar el label del CTA en toda la página.
3. Garantía desacoplada del CTA de compra — Garantia.tsx vive en su propia SectionShell (app/page.tsx líneas 206-210), separada de los botones de compra en Oferta.tsx (líneas 167-196), en vez de aparecer como microcopy con plazo justo debajo de cada CTA de plan. Fix: añadir una línea de garantía con plazo bajo cada CtaButton dentro de las cards de precio.
4. Prueba social sin dato verificable — el socialProof del Hero (app/page.tsx líneas 52-57) afirma "Creada desde un salón real, no desde una lista de features" sin ningún número o testimonio citable, mientras FICHA-AVATAR.md confirma que no hay beta ni testimonios propios todavía. Fix: retirar el badge o reemplazar por un dato verificable y citable.
5. Profundidad de solo 2 niveles — toda la landing usa tintes de fondo planos + shadow-1/2 en cards (Tint en app/page.tsx, Hairline/SectionShell en ui.tsx) pero nunca un nivel "hundido" (--surface hundido/inputs), por lo que EJE2 de craft no alcanza los 3 niveles esperados. Fix: introducir un tratamiento hundido en al menos el stack de valor Hormozi (Oferta.tsx líneas 118-143).
