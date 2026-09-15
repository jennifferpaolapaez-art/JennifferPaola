# FICHA DE DIRECCIÓN DE ARTE — RAIZ

## Referencia del usuario (CONTRATO)
- ¿Hay imagen(es) de referencia del usuario?: SÍ → board de logo/brand identity subido en chat
  (logo primario/secundario, ícono de app, mockup de celular y tarjeta, 5 swatches de color con
  nombre + hex + uso, tabla de proporción 70/15/10/5/5).
- Extracción (mirada directamente en la imagen):
  - Modo: **claro** · Fondo: **#F6F0E4** (Warm Cream) · Superficie/card: N/A en el board — se
    deriva un tono elevado ligeramente más claro que el fondo (ver Brand kit final)
  - Texto 1º/2º: **#0D5C63** (Deep Teal, títulos/marca) / se deriva un teal-tinte más oscuro para
    texto de cuerpo largo (el board no muestra párrafos, solo lockups de logo)
  - Acento(s): **#F4C84A** Butter Yellow — aparece en la hojita del logo primario (detalle de
    firma) · **#F28A7A** Soft Coral — hojita del logo secundario y como acento cálido declarado
  - Semánticos visibles: ninguno (el board es de marca, no de UI con estados)
  - Display: serif redondeada/slab cálida, trazo grueso, terminales suaves, minúsculas con
    personalidad — candidata elegida: **Fraunces** (eje "soft" alto, peso 600-700) — es la que
    más se acerca a la calidez y grosor del logotipo sin clonar una fuente propietaria
  - Body: el board no define tipografía de cuerpo (es un lockup de marca, no una pantalla de
    producto) — se EXTIENDE con el mismo sistema: sans humanista cálida que no compita con la
    serif del logo — **Plus Jakarta Sans** (candidatas descartadas: Inter por sentirse más fría,
    Figtree por menos carácter)
  - Radio: el ícono de app es un squircle marcado (~22-24% de esquina) → cards/botones de UI
    heredan esa calidez: 16-20px
  - Espaciado base: aireado (el board respira mucho espacio en blanco entre lockups)
  - Sombras: sutil y cálida (el mockup de celular/tarjeta usa una sombra suave de contacto, nunca
    dura ni con glow)
  - Bordes: no se ven bordes duros en el board — la separación es por espacio y color, no línea
  - Textura/gradiente/grano: ninguno — superficies planas y limpias
  - Layout: hero + grid de lockups (logo design board), no aplica 1:1 a una pantalla de app —
    se traduce a layout de tipo "hero+cards" para la UI
  - Mood: cálido, artesanal, sereno
  - Detalle de firma a replicar: **la hojita reemplazando el punto de la "í"** — este gesto se
    convierte en el dispositivo ownable de toda la app (bullets, markers de skill logrado, favicon)
- Prohibiciones anti-IA que la referencia LEVANTA: ninguna — el board ya evita fondo oscuro,
  neón y glass; coincide con la capa anti-IA por diseño propio del usuario.

## Personalidad compilada
- 3 adjetivos de personalidad: **cálida, serena, artesanal**
- Compilación: spring suave (sin rebote exagerado) · duración base ~220ms · exclamaciones máx.
  1 por pantalla (RAIZ no celebra con confeti — celebra con una nota de color puntual, ej. la
  hojita) · celebración nivel bajo-medio (RAIZ acompaña, no premia como app de hábitos) · radio
  tendencial 18px

## Brand kit final
- Fondo: **#F6F0E4** · Superficie (card elevada): **#FBF7EE** · Hundido (inputs): **#EFE7D5** ·
  Texto 1º: **#0D5C63** (marca/títulos) · Texto 2º/cuerpo: **#1E3A3D** (teal-tinte oscuro, nunca
  negro puro — regla anti-IA)
- Acento: **#0D5C63** Deep Teal (SOLO en: marca, títulos, navegación activa, CTA primario) · 2ª
  nota: **#F4C84A** Butter Yellow (porqué: detalle de firma — hojita, logros, un dato puntual por
  pantalla — 3-5% del área visual, nunca fondo) · 3ª nota: **#F28A7A** Soft Coral (botón
  secundario, alertas suaves, 3-5%) · Apoyo: **#A8B9A5** Sage (fondos de tarjeta/categoría, 10%)
- Semánticos: éxito **#7A9B6E** (variante sage más saturada) · error **#D9614E** (variante coral
  más profunda, nunca rojo puro) · aviso **#E0A93A** (variante butter más oscura)
- Display: **Fraunces** (pesos 500/600/700, eje soft alto) · Body/UI: **Plus Jakarta Sans**
  (pesos 400/500/700) · Escala: display 28px / title 20px / body 15px / label 12px
- Radio: 18px (cards), 14px (botones/inputs) · Profundidad: sombras suaves de 1 nivel (contacto,
  nunca glass) · Espaciado base: escala 4·8·12·16·24·32·48
- Dispositivo ownable: la hojita de la "í" — se repite como bullet de lista, marcador de skill
  dominado, y favicon de la app
- Motion signature: easing ease-out suave · stagger 60ms entre cards · firma: la hojita hace un
  pequeño "brote" (scale 0.8→1) al aparecer un logro nuevo, nunca confeti

## Trazabilidad y vetos
- Ruta de diseño: réplica fiel de referencia del usuario (board de logo ya definido) — se
  reemplazan las 3 direcciones A/B/C propuestas previamente (quedan descartadas: la fusión de
  líderes sin referencia ya no aplica una vez que el usuario trajo su propio contrato de marca)
- Réplica fiel: `replica-fiel.html` (Hoy screen con este sistema, board de referencia embebido al
  lado) · captura de referencia: la imagen del board compartida en chat (no guardada como archivo
  local — solo vista en conversación) · test de fidelidad: ver artifact
- Tour de la app: `vista-previa-app.html` (raíz del proyecto) — 5 vistas: onboarding, paywall,
  Hoy (aha moment), planeación semanal, perfil del niño. Screenshot en
  `docs/revisiones/vista-previa-app.png`. Artifact: https://claude.ai/artifact/TF96ik4moNeGtGKEVwaLBb
- Paleta derivada de: board de marca del usuario (CONTRATO — se toma tal cual, no se reinterpreta)
- Registro anti-repetición: paleta Deep Teal/Warm Cream/Sage/Butter Yellow/Soft Coral + par
  Fraunces/Plus Jakarta Sans anotados en ESTADO.md → vetados para el próximo proyecto del SO
- Modo (claro/oscuro) DERIVADO por: el board del usuario es explícitamente claro (Warm Cream de
  fondo) — no se asumió, se extrajo

## Idioma UI: español (interfaz de trabajo de la maestra; salida a familias puede traducirse —
ver Constitución del Producto en ESTADO.md) · Fecha de cierre: 14-sep-2026 · Aprobada por el
usuario: PENDIENTE (se presenta ahora con la réplica fiel)
