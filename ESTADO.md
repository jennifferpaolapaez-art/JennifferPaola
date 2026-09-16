# ESTADO.md — RAIZ

> Memoria viva del proyecto. Se actualiza en cada hito.

## Fase actual
Sesión 1 CERRADA. Sesión 3 (landing) v2 — **APROBADA por el usuario y CERRADA** (detalle abajo).
Sesión 4 (onboarding → paywall → login) — **APROBADA por el usuario y CERRADA**: 3 rondas de
revisor-visual, defectos reales corregidos, gate binario aceptado como techo estructural
documentado (mismo patrón que la landing) — ver "Problemas conocidos". Build verde, código
completo. Siguiente: **Sesión 5 (app interna)** en cuanto el usuario confirme seguir.

## Sesión 4 — Onboarding, paywall y login
- **Alcance de esta sesión** (SECUENCIA MAESTRA: página de ventas → onboarding → paywall →
  login/auth → app interna → servicios externos): se construyeron las 3 piezas de UI con copy y
  precio REALES, pero SIN backend real todavía — ni Supabase Auth ni checkout Hotmart están
  conectados (eso es la fase de "servicios externos", más adelante). Las interacciones (envío de
  magic link, "pago") están simuladas con estado local, siguiendo el mockup-honesto de
  `50-DISENO-ONBOARDING-PAYWALL.md` → C3ter: sin checkout falso, con precio/copy reales.
- **Decisión técnica (sin preguntar al usuario, con respaldo del SO):** longitud del onboarding
  = 5 preguntas reales + 2 reconocimientos + loading (categoría "Productividad" → 02B: "empezar
  con 4-8 pasos de alto rendimiento"). Cada pregunta ecoa un campo de FICHA-AVATAR.md (dolor,
  objeción, ancla contextual) — ninguna es decorativa (regla 2 de 02B). Preguntas: (1) tipo de
  salón (segmentación), (2) niños en el grupo (compromiso/slider), (3) mayor complicación al
  planear (dolor #1-4 de la ficha, con reconocimiento personalizado por respuesta), (4) qué ya
  probó (objeción dominante de la ficha), (5) cuándo planea (ancla contextual, fija hora de
  recordatorio futuro). Reconocimiento final con ETIQUETADO POSITIVO (regla b de LA ESCALERA,
  02B). Loading "Construyendo tu Memoria del Salón" con líneas armadas con las respuestas reales
  del usuario (spec B de 50).
- **Paywall en 3 pantallas** (secuencia C0 de 50, +37% de conversión medido vs 1 página): (1)
  recap con inversión visible ("Hecho con tus N respuestas") + value stack con la respuesta real
  del dolor elegido, (2) timeline del trial (patrón Blinkist: Hoy/Día 6/Día 7 con fecha y monto
  exactos), (3) precio — MISMOS planes y garantía que la landing (Anual $16.66/mes · $199.90/año
  · 2 meses gratis; Mensual $19.99/mes; 7 días de prueba; Garantía de tu Primera Semana 15 días —
  cosa juzgada de FICHA-MERCADO.md, no se re-decidió aquí).
- **Login** (`/entrar`): magic link por email (método primario, decisión Hotmart-first de
  26-AUTH-MODERNO.md) + Google OAuth secundario, con los 3 estados reales (enviando/enviado con
  cooldown de 60s/error con copy anti-enumeración) — spec E de 50.
- **Componentes nuevos:** `components/onboarding/ui.tsx` (kit compartido: FunnelTopBar con barra
  de progreso ENDOWED PROGRESS, QuestionChip, QuestionScreen, SliderMeta, Reconocimiento,
  LoadingConstruyendo, FunnelCta) reutilizando `tokens.css` de la landing (misma marca, sin
  redefinir color) · `app/onboarding/page.tsx` (máquina de estados del quiz) ·
  `app/paywall/page.tsx` (secuencia de 3 pantallas, lee respuestas de `localStorage`) ·
  `app/entrar/page.tsx` (reemplazó el placeholder de Sesión 3).
- **Verificado:** tsc ✓ · build ✓ (`app/onboarding`, `/paywall`, `/entrar` compilan como rutas
  estáticas) · recorrido completo probado en el navegador interactivo a 375px real: selección de
  chip con auto-avance, slider con conteo en vivo, reconocimiento personalizado por respuesta
  (verificado con 2 respuestas distintas), retroceso preservando estado, las 3 pantallas del
  paywall con datos inyectados, y los 3 estados del login (idle/enviando/enviado con cooldown).
  Screenshots no guardados en docs/revisiones/ todavía (pendiente antes del revisor-visual).
- **⚠️ Nota de entorno (no es bug de producto):** durante la primera verificación manual, el
  servidor de desarrollo sufrió varias recargas en caliente (Fast Refresh) que, en un tramo,
  reseteaban el estado local del onboarding a mitad de la prueba (websocket de HMR fallando en
  el panel del navegador). Un reinicio limpio del servidor resolvió el síntoma. Para las capturas
  de revisor-visual, a partir de la ronda 1 se usó SIEMPRE `next build && next start` (producción
  real), nunca `next dev` — evita además la insignia de Next.js/Turbopack que un round inicial
  malinterpretó como un elemento roto de la UI (falso positivo ya descartado).

### Revisor-visual — 3 rondas corridas sobre onboarding/paywall/entrar
Igual que en la landing: Agent tool no reconoce `revisor-visual` por nombre en este entorno →
simulado con `general-purpose` + la ficha completa pegada + los 4 insumos (screenshot 375,
código, FICHA-ARTE.md, FICHA-AVATAR.md cuando vende).

```
                    ONBOARDING          PAYWALL                  ENTRAR (login)
R1  Usab/Craft/Copy 30/40 · 12/20       29/40 · 12/20 · 15/20    29/40 · 13/20
    Defecto dominante en las 3: vacío muerto (contenido pegado arriba, resto de
    min-h-dvh vacío) + fondo totalmente plano. Paywall además sin navegación
    "Atrás" entre sus 3 sub-pantallas. Entrar sin <form>/onSubmit real.
    FIX: <FunnelStage> centra verticalmente + mesh radial de fondo + stagger de
    entrada en chips/listas + Atrás real en paywall + <form onSubmit> con regex
    de email + mensajes de error separados por causa.

R2  Usab/Craft/Copy 34/40 · 13/20       33/40 · 13/20 · 17/20    34/40 · 10/20
    El centrado vertical resolvió el vacío muerto pero el mesh (7%/6%) seguía
    "imperceptible en el screenshot real" en las 3 — hallazgo repetido, no
    aislado. Logo del funnel muy chico, ningún dispositivo ownable visible,
    botón "Continuar con Google" sin onClick (regla dura #11: nada interactivo
    sin función), sin indicador de paso en el paywall, números héroe sin
    conteo animado.
    FIX: mesh subido a 14-26%/11-20% + hojita de firma como watermark + logo
    agrandado (h-7→h-9) + sombra en QuestionChip + indicador "Paso X de 3"
    (reusa <ProgressBar> del kit) + <AnimatedNumber> en todos los números héroe
    + whileTap en tarjetas de plan + botón Google con nota honesta ("llega muy
    pronto, usa tu enlace por correo" — no hay OAuth real todavía) + onBlur y
    precarga de correo en el login.

R3  Usab/Craft/Copy 30/40 · 11/20 ↓     33/40 · 15/20 · 18/20 ↑  35/40 · 13/20 ↑
    Paywall y Entrar mejoraron real y consistentemente. Onboarding OSCILÓ hacia
    abajo (34→30) pese a los mismos fixes aplicados — la varianza entre
    revisores independientes en preguntas cortas de poco contenido es alta.
    Hallazgo que se repite POR TERCERA VEZ en las 3 pantallas: el mesh de
    fondo y la hojita de firma se leen "planos" en el screenshot real pese a
    verificarse correctos en el código — inspeccionado a fondo tras esta
    ronda (ver nota técnica abajo).
```

**Investigación técnica del "mesh imperceptible" (tras R3):** se verificó con
`getBoundingClientRect()` y `getComputedStyle()` en el navegador real que el gradiente y la
hojita de firma SÍ se pintan con los valores correctos (color, opacity, posición, tamaño) — no
es un bug de código. Es un límite de contraste real: Deep Teal al 13-26% de opacidad sobre Warm
Cream produce una diferencia de luminancia pequeña (~15-30/255 en R) que un revisor humano/IA
mirando un PNG comprimido percibe como "plano", incluso cuando matemáticamente existe. Subir más
la opacidad entra en tensión directa con la Regla de Oro de dirección de arte ("restricción
cromática estricta", "sin loud decoration") — es el mismo tipo de techo que Craft tocó en la
landing entre "sutil y elegante" vs "visible para un revisor exigente".

**Fixes de la ronda 3 (aplicados, sin 4ª ronda de revisor todavía — ver decisión pendiente):**
mesh subido de nuevo (10%/-10% → 26%/20%) + hojita reposicionada a media altura (antes esquina
extrema invisible) + `<FunnelStage>` ya NO centra verticalmente (el centrado resolvía R1 pero
abría un vacío igual de grande arriba Y abajo en preguntas cortas — patrón real de apps de
onboarding como Duolingo/Cal AI es contenido anclado arriba, no centrado) + tinte de íconos del
paywall subido 12%→18% + validación `onBlur` y precarga del último correo en el login.
Verificado: tsc ✓ build ✓ (producción). NO se relanzó una 4ª ronda de revisor-visual sobre estos
últimos cambios — ver "Problemas conocidos" para la decisión pendiente del usuario.

- **⛔ Pendiente antes de declarar Sesión 4 "lista" (Regla de Oro 7):** el gate doble (≥36/40 y
  ≥16/20) no se cumplió en ninguna de las 3 pantallas tras 3 rondas — ver "Problemas conocidos"
  para el detalle y las opciones presentadas al usuario. Tampoco se ha decidido el "review prompt
  a mitad del onboarding" (patrón Cal AI, opcional) ni instrumentado analítica (`36`, fase
  posterior). El backend real (Supabase Auth + Hotmart) se conecta en la fase de servicios
  externos, más adelante en la secuencia maestra.

## Fuente de verdad del producto
`G:\My Drive\CLAUDE\Proyectos\App Creciendo Bilingue\Notas de trabajo.docx` — documento maestro de
producto (93 secciones). Volcado íntegro en el historial de esta conversación. Contiene visión
completa: NO simplificar a "generador de lesson plans con IA". Distinguir siempre "fase posterior"
de "no pertenece a RAIZ" — nunca eliminar de la arquitectura Centros/Inventario, printables,
evaluaciones, rutas de prerrequisitos.

## Identidad
- Marca educativa existente: Creciendo Bilingüe (sigue operando aparte).
- Nombre provisional de la app: **RAIZ** (sin tilde) — contiene visualmente R-AI-Z. Pendiente:
  validación de dominio, búsqueda comercial/marca, revisión legal. NO es marca legal definitiva.

## Constitución del Producto (aprobada por el usuario)
- **Qué es:** asistente pedagógica con IA para educación infantil. NO es app administrativa
  (no billing/tuition/payroll).
- **Cliente ideal:** definido por ROL Y PROBLEMA, no por edad. Educadora de primera infancia en
  EE.UU. — dueña de home daycare/family childcare o maestra líder de preschool pequeño — que
  trabaja directo con los niños, planea y observa, y necesita adaptar su enseñanza a distintas
  edades/niveles/necesidades sin cargar todo el contexto mentalmente. ~6-12 niños de referencia,
  sin que ese número limite el producto. Puede tener 23 años recién graduada o 50 con experiencia.
- **Mercado inicial:** Estados Unidos (donde el usuario tiene experiencia práctica real: home
  daycare, evaluaciones, documentación, familias, edades mixtas).
- **Primer nicho de adquisición (no de producto):** educadoras latinas/hispanohablantes en EE.UU.
  — dolor adicional real: piensan/planean/dictan en español pero entregan documentación
  profesional en inglés a familias/coaches/licensors. El producto NUNCA se posiciona como
  "exclusivo para latinas/bilingües" — debe funcionar igual para una maestra monolingüe inglés.
- **Núcleo (el diferenciador, no negociable):** Perfil del niño → Planeación → Observación →
  Próxima planeación. El perfil real de cada niño cambia activamente la próxima recomendación
  — esto es lo que evita que RAIZ sea "otro generador de lesson plans" (eso ya existe: Learning
  Genie, MagicSchool, GoTeach).
- **Primera victoria / AHA moment:** la maestra crea su semana y RAIZ muestra, en el momento,
  cómo la misma actividad grupal se adapta a Infant/Toddler/Preschool/Pre-K + qué niño puede
  aprovecharla para su meta individual (tijeras, números...) + que ya tiene los materiales en su
  Science Center. Mostrar la promesa, no venderla.
- **3 funciones núcleo del MVP:** (1) Perfil del niño (edad obligatoria + skills + necesidades),
  (2) Planeación semanal con diferenciación por edad + foco individual, (3) Observación rápida
  del día que alimenta el próximo plan.
- **Centros/Inventario, printables, evaluaciones:** FASE POSTERIOR en construcción, pero deben
  vivir en el modelo de datos y en la lógica de skills DESDE EL PRINCIPIO — no se diseña la
  planeación de forma que después sea difícil conectarlos. V1 puede ser simple (centros
  registrados, materiales básicos, biblioteca básica); fases avanzadas: foto de material con
  reconocimiento, rotación automática, análisis visual de centro completo.
- **Lo que RAIZ nunca hace:** no diagnostica, no factura/cobra tuition, no marca metas como
  "logradas" sola (siempre pide confirmación), no asume que info vieja sigue vigente, no impone
  metodología/currículo.

## Reporte de Validación (resumen — completo en el historial de chat)
- **Veredicto:** viable con ajustes. Hay competencia real en inglés (confirma que el problema
  paga) pero ninguna cubre el ángulo de RAIZ.
- **Competencia directa (inglés):** Learning Genie/Curriculum Genie (más parecida: IA desde
  evaluación real), Illumine, Bloomily, Nookly, Elina AI (todo-en-uno con billing/admin — lo que
  RAIZ evita), MagicSchool/GoTeach (genéricos, no individualizados).
- **Queja recurrente de usuarios (Brightwheel):** plan de clase NO conectado al portafolio del
  niño — hay que meter todo dos veces. Ahí gana RAIZ: el ciclo perfil↔planeación es el corazón.
- **Brecha LATAM/español:** confirmada. Lo que existe en español (Daily Connect, StoriiCare,
  Kidi, Procare) son las mismas suites administrativas traducidas — cero enfoque pedagógico
  individualizado. Espacio libre real.
- **Señal de negocio dura:** home daycare provider promedia ~60h/semana por ~$15,000/año →
  precio debe justificarse de inmediato. Esto sugiere ancla más cerca de $19.99-29.99 que de
  $49.99 (precio final se decide con 02C + 40-UNIT-ECONOMICS en Sesión 1 completa, aún pendiente).
  Burnout confirmado por fuentes: viene explícitamente de "personalizar cada actividad para cada
  niño, cada día" — valida el dolor central del documento maestro.
- **Posicionamiento recomendado:** pedagogy-first, sin bloat administrativo + única en
  español/bilingüe que conecta perfil real del niño con la planeación.

## Dirección visual — en curso
Usuario eligió opción 3 (combinación): sin referencia de imagen fija, pero con dirección
descriptiva fuerte:
- SÍ: cálida, moderna, profesional, confiable, sencilla, organizada, humana, pedagógica, premium
  sin corporativa. Conexión sutil con raíz/crecimiento/desarrollo/naturaleza — elegante, NO
  literal (nada de árboles/hojitas/dibujos infantiles). Paleta imaginada: crema, tonos tierra,
  verde sage suave, terracota. Mucho espacio limpio.
- NO: app médica, software administrativo, tecno-futurista, colores primarios, infantil tipo
  caricatura.
- Logo/wordmark: explorar resaltar sutilmente "AI" dentro de R-AI-Z sin llamarse "RAIZ AI".
- Protocolo aplicado: SIN referencia de imagen → TABLA DE LÍDERES (16-DIRECCION-DE-ARTE PASO
  0.2bis) + fusión, NO invención. Pendiente: completar tabla, arquetipo, mundo del sujeto, y
  presentar 3 fusiones A/B/C renderizadas.

## App modelo (FICHA-MODELO.md — APROBADA por el usuario)
- Elegida: **Brightwheel** (revenue probado: ~$37.5M ARR 2024 (Latka) + $88.8M levantados/
  valuación $735M 2025 (PitchBook/Crunchbase) — 2 señales independientes, ambas de terceros
  porque es privada).
- Eje de diferenciación de RAIZ: de "administración del daycare" a "pedagogía e
  individualización del niño" — conservando el mecanismo de suscripción mensual mobile-first
  vendida directo a la educadora. Resuelve su queja #1 documentada (plan de clase desconectado
  del perfil del niño).
- Campos NO ENCONTRADOS (documentados, no inventados): onboarding exacto, tabla de pricing
  pública, ángulos de ads en Meta Ads Library — pendientes para cuando se necesiten (Sesión 1
  completa / Sesión 8 adquisición).

## Dirección de arte — CERRADA Y APROBADA por el usuario (referencia-mandato)
El usuario trajo su propio board de marca (imagen) → esto es CONTRATO, reemplaza las 3
direcciones A/B/C fusionadas que se habían propuesto sin referencia (esas quedan descartadas).
- Paleta (proporción 70/15/10/5/5): Warm Cream `#F6F0E4` (fondo) · Deep Teal `#0D5C63` (marca/
  texto 1º) · Sage `#A8B9A5` (apoyo/tarjetas) · Butter Yellow `#F4C84A` (acento firma — hojita) ·
  Soft Coral `#F28A7A` (acento cálido secundario).
- Logotipo: "Raíz" en serif de **alto contraste** (equivalente Google Fonts: **Playfair
  Display** — corregido en esta sesión tras una segunda imagen más nítida del usuario; la
  primera extracción usó Fraunces, demasiado suave/redondeada) con la **tilde de la "í"
  convertida en hojita** (no un punto de "i") — dispositivo ownable que se repite en toda la UI
  (bullets, marcador de niño foco, favicon, ícono de app squircle).
- Body/UI (extendido, el board no lo definía): **Plus Jakarta Sans**.
- Radio 18px cards/14px botones · sombras suaves de 1 nivel · modo claro derivado directamente
  del board (Warm Cream de fondo).
- Los 3 entregables nacen del kit oficial `plantillas-codigo/direcciones-abc/plantilla.html`
  (marcador `data-kit="abc-v2"` intacto en los 3 — gate del hook pre-stop), viven en la raíz del
  proyecto con screenshot en `docs/revisiones/`:
  - `direcciones-abc.html`: como el usuario ya trajo su contrato de marca, las 3 opciones NO son
    3 direcciones distintas — son 3 COMPOSICIONES de la pantalla "Hoy" con la MISMA marca
    (doctrina referencia-mandato: divergen solo en lo que el contrato no fija). A = dato del día
    grande, B = anillo de progreso + grid, C = timeline editorial.
  - `replica-fiel.html`: board recreado al lado de la pantalla "Hoy" real, test de fidelidad
    pasado.
  - `vista-previa-app.html`: 5 vistas (onboarding, paywall, Hoy, planeación semanal, perfil del
    niño) en el chasis real de la app. Pendiente: pregunta de cierre al usuario
    (me encanta/ajustar/repensar).
- ⚠️ Pendiente real: el logo del board parece boceto/concepto (probable IA), no archivo vectorial
  final — no bloquea, pero se necesitará producir el SVG/vector definitivo del logotipo "Raiz +
  hojita" antes de assets de producción (ícono de app, favicon, print).

## ⚠️ ENTORNO — dónde vive realmente el código (leer antes de tocar node/npm)
El proyecto documental (ESTADO.md, fichas, docs/, este repo git) vive en
`G:\My Drive\CLAUDE\Proyectos\RAIZ` — Google Drive. Pero **el código de la app (Next.js) se
desarrolla y compila en `C:\dev\raiz-app`** (disco local), no aquí, porque G: es una unidad
virtual de Google Drive (no NTFS real): `npm install` ahí se corrompe a medias (EPERM/EBADF,
miles de archivos pequeños peleando con la sincronización en tiempo real) y ni siquiera admite
symlinks/junctions para redirigir `node_modules`.
- **Flujo de trabajo:** editar/instalar/compilar SIEMPRE en `C:\dev\raiz-app`. Al cerrar un hito,
  sincronizar con `robocopy "C:\dev\raiz-app" "G:\My Drive\CLAUDE\Proyectos\RAIZ" /E /XD
  node_modules .next .git /NFL /NDL /NJH` y copiar `package-lock.json` aparte.
  **⚠️ EL `.git` SIEMPRE VA EN `/XD` (excluido) — `C:\dev\raiz-app` NUNCA debe tener su propia
  carpeta `.git`.** Si alguna vez aparece una (por ejemplo si alguien copia el proyecto completo
  con `/E` sin excluirla), el próximo robocopy C:→G: SOBRESCRIBE el `.git` real de G: con esa
  copia vieja y congelada — pasó una vez en esta sesión y se perdió un commit intermedio
  ("Sesión 3: landing construida y verificada", el contenido no se perdió, solo el punto de
  guardado). Ya se borró esa carpeta duplicada en `C:\dev\raiz-app\.git`; si reaparece, borrarla
  de nuevo antes de sincronizar.
  **⚠️ CUIDADO DE DIRECCIÓN: el robocopy va SIEMPRE de C: → G:, nunca al revés.** Si se edita
  ESTADO.md (o cualquier archivo) directo en G: y LUEGO se corre robocopy C:→G:, el archivo de
  G: se pisa con la versión vieja de C: y el edit se pierde. Regla segura: cualquier archivo que se edite fuera
  de `C:\dev\raiz-app` (como ESTADO.md casi siempre) se edita, y LUEGO se copia manualmente esa
  misma edición también a `C:\dev\raiz-app` antes de la próxima sincronización — o mejor, editar
  ESTADO.md siempre en AMBOS lados, o revisar el diff antes de sincronizar.
  `C:\dev\raiz-app` NO tiene su propio `.git` — el repo real es el de G:.
- Node.js está instalado pero no en el PATH por defecto de esta terminal:
  `export PATH="/c/Program Files/nodejs:$PATH"` al abrir una sesión de bash nueva.
- Si el usuario prefiere evitar este paso manual en el futuro, la solución de fondo es excluir
  `node_modules`/`.next` de la sincronización de Google Drive (clic derecho → "Omitir estos
  archivos" en la app de Drive) para poder trabajar directo en G: — pendiente de decidir con el
  usuario, no bloqueante mientras tanto.
- **Chrome headless local (CLI) no captura bien** ventanas angostas (<450px de ancho) ni
  secciones con animación `whileInView` en una sola captura sin scroll real (se queda en
  opacity:0 — no es bug de la app). Para evidencia visual: usar ventanas ≥500px de ancho, o el
  navegador interactivo (mcp Claude_Browser) con scroll real + `wait` antes de cada screenshot.

## Sesión 3 — Página de ventas — v2 construida, build verde, pendiente aprobación del usuario
**v1 fue RECHAZADA explícitamente por el usuario** (mensaje: "NO apruebo todavía la landing").
Pidió elevar dirección de arte, jerarquía, paleta, riqueza visual, sensación premium,
escaneabilidad mobile y demostración visual del producto — SIN tocar la estructura de 10
secciones ni el argumento de venta ya aprobado. v2 responde punto por punto:
- FICHA-AVATAR.md aprobada · FICHA-MERCADO.md creada (precio $19.99/$29.99, prueba 7 días,
  garantía 15 días — verificado > prueba contra los plazos reales de Hotmart 7/15/21/30).
- Mecanismo bautizado: **la Memoria del Salón** (frase textual del documento maestro, sec. 6).
- Next.js scaffolded (create-next-app, App Router, Tailwind v4, Turbopack) — el kit de landing
  (`plantillas-codigo/landing/`) copiado a `components/landing/`, tokens.css tematizado con
  FICHA-ARTE, copy marcado en `docs/copy/landing.md` (trazado a FICHA-AVATAR), página compuesta
  en `app/page.tsx`. `npm run build` pasa limpio.
- **Logo real en el header y footer**: `<img src="/brand/raiz-logo.svg">` — el usuario mandó
  después el vector oficial (`RAIZ_logo_oficial_vector.svg`, vectorizado desde el PNG maestro),
  usado TAL CUAL, no recreado en CSS/texto. El PNG (`raiz-logo.png`) se conserva como respaldo
  visual, per instrucción del usuario, pero el SVG es el que se usa en producción.
- **Headline nuevo**: "Deja de cargar a todos tus niños en la cabeza" (con acento en "en la
  cabeza") — se evaluó contra 2 alternativas que el usuario propuso y contra el original; ganó
  por ser la más corta, más emocional y la que mejor espeja el dolor #1 de FICHA-AVATAR. Subtítulo
  corregido a una idea completa (antes se cortaba en "...con tu próxima").
- **Visual del hero real**: ya no es el placeholder punteado — es un mockup construido con el
  sistema de marca real (`public/mockups/hero.png`) mostrando la pantalla "Hoy": actividad
  "Collage del cuerpo" (100% en español desde la ronda 6 del revisor — ver abajo), adaptación a
  los 4 niveles (Infant/Toddler/Preschool/Pre-K se dejan en inglés a propósito: terminología
  estándar de la industria en el mercado real de EE.UU., FICHA-AVATAR), foco individual de
  Luca/Zayne, materiales en el Centro de Ciencias. Mismos mockups reutilizados como screenshots
  del carrusel (`public/mockups/frame-*.png`) — ya no son cajas grises con nombre, son demos
  visuales del producto, con el mismo nombre de actividad en ambos (antes divergían).
- **Riqueza de color**: se agregó un helper `Tint` (en `app/page.tsx`, no toca el kit) que pinta
  un fondo propio por bloque de secciones sin romper la doctrina "el kit no se reescribe a mano"
  — Problema+Agitación en blush coral pálido, Mecanismo en sage pálido, Carrusel en butter cálido
  pálido; Oferta/Garantía/FAQ se dejan en cream/blanco (para no saturar — máximo 3 tintes en toda
  la página, tal como pidió el usuario). Cada tarjeta de "Problema" tiene su ícono en un color de
  marca distinto (coral/sage/butter/teal) vía un campo `tint` nuevo agregado a `Problema.tsx`.
- **Mecanismo ampliado a 4 pasos** ("el ciclo RAÍZ": Conoce → Planea → Observa → Avanza, cada uno
  con su color) — se amplió `Solucion.tsx` de una tupla de 3 a una tupla de 4 pasos (única
  modificación estructural al kit; documentada aquí per doctrina de "desviación justificada").
  Corresponde 1:1 al núcleo Perfil→Planeación→Observación→Próximo paso de la Constitución.
- **Franja de credibilidad de fundadora** rediseñada como badge con punto de acento (antes era
  letra chica bajo el CTA que leía como disclaimer).
- **Badge de oferta corregido**: "MÁS POPULAR" → "MEJOR VALOR" (el primero afirmaba una
  preferencia social que no tenemos evidencia de tener; el segundo es objetivamente cierto por el
  ahorro de 2 meses).
- **CTA final**: copy nuevo "Cierra tu día sabiendo qué sigue mañana" (antes "Imagina tu domingo
  sin planear" — el nuevo aterriza mejor en el beneficio diario, no solo dominical).
- Verificado con el navegador interactivo a 375px, sección por sección con scroll real (no CLI
  automatizado, por el bug de whileInView documentado arriba): hero, problema, mecanismo,
  carrusel, oferta, garantía, CTA final y footer — todos renderizan correctamente. Screenshot del
  hero guardado en `docs/revisiones/landing-v2-hero.png`.
- **Fotografía**: el usuario pidió fotos cálidas y reales de educadoras con niños. NO se agregó
  ninguna — el SO prohíbe fotos de stock/fabricadas y no hay ningún asset real disponible todavía.
  Pendiente: el usuario provee fotos reales (suyas o con licencia) cuando las tenga.
- Páginas legales como borrador funcional (no lorem, pendiente de revisión legal antes de
  lanzar): `/privacidad`, `/terminos`, `/reembolsos`, `/aviso-ia`. `/onboarding` y `/entrar` son
  placeholders (se construyen en Sesión 4).

## Revisor-visual independiente — 7 rondas corridas (ver docs/revisiones/landing-veredicto.md)
⚠️ En este entorno el Agent tool NO reconoce el subagente de proyecto `revisor-visual` por
nombre (`.claude/agents/revisor-visual.md` no se carga vía `subagent_type`). Se simuló
invocando un agente `general-purpose` con el contenido COMPLETO de esa ficha pegado en el
prompt (rúbricas /40, /20, /20 + formato de salida + instrucción de escribir el archivo de
veredicto) más los 4 insumos exigidos (screenshot 375, código, FICHA-ARTE.md, FICHA-AVATAR.md).
Repetir este patrón en futuras revisiones mientras el entorno no resuelva agentes de proyecto.

Trayectoria de puntajes (Usabilidad/40 · Craft/20 · Copy/20 — umbral ≥36 / ≥16 / ≥16):
```
R1  27 · 12 · 14   NO LISTA — 5 defectos (identidad ownable, CTA inconsistente, garantía
                    desacoplada, prueba social sin dato, profundidad de 2 niveles)
R2  29 · 14 · 17   NO LISTA — los 5 de R1 corregidos, pero apareció uno nuevo: el H2 del CTA
                    final (fondo invertido oscuro) usaba el acento teal, casi invisible
R3  27 · 14 · 18   NO LISTA — CTA final corregido (H2), pero el bug real estaba en el CTA
                    BUTTON de esa misma sección (mismo problema, no cubierto por el fix de R2)
                    + footer con "RAIZ" duplicado junto al logo + recap ambiguo (7 vs 15 días)
                    + inglés crudo en el mockup del hero (Body Collage/Circle time/Science Center)
R4  29 · 14 · 18   NO LISTA — hallazgo SISTÉMICO: <Accent> (ui.tsx) pintaba TODOS los [acento]
                    de la página en Deep Teal, casi idéntico a --text-primary (también teal
                    oscuro) — el énfasis no se notaba en NINGÚN titular del sitio, no solo el
                    CTA final. Corregido en la raíz: Accent pasa a usar --accent-2 (Soft Coral)
R5  28 · 14 · 16   NO LISTA — el fix de R4 introdujo su propio bug: Soft Coral (#F28A7A) como
                    texto fallaba WCAG AA (~2.2:1) sobre los fondos claros de cada sección →
                    oscurecido a terracota #B6553A. + hojita (CheckCustom) agrandada 22→26px.
                    + "hueco vacío de 1300px" reportado tras el footer → INVESTIGADO Y
                    DESCARTADO: verificado con scroll real en el navegador interactivo, no
                    existe — es un artefacto del método de captura (ver ⚠️ ENTORNO arriba)
R6  28 · 15 · 19   NO LISTA — Craft cruza a un punto del umbral, Copy ya sólido. Quedaba:
                    frame-hoy.png (carrusel) todavía en inglés Y con nombre de actividad
                    distinto al de hero.png ("Mi cuerpo" vs "Collage del cuerpo") → mockup
                    regenerado, ahora consistente y en español en ambos. + terracota afinado
                    a #A64B32 (el anterior quedaba justo en texto normal, no solo titulares).
                    + cards de Oferta reforzadas (tinte/borde/sombra)
R7  29 · 16 · 19   NO LISTA — CRAFT Y COPY YA PASAN EL UMBRAL. Usabilidad se mantiene en
                    27-29/40 desde R4 (4 rondas) pese a defectos reales corregidos en cada
                    una. El propio revisor concluyó explícitamente: es un TECHO ESTRUCTURAL
                    del formato landing — heurísticas de Nielsen como control/libertad,
                    prevención de errores, flexibilidad, ayuda contextual (h3/h5/h7/h10) no
                    pueden subir más sin funcionalidad interactiva real, que una landing de
                    marketing no tiene por definición. Único defecto real quedaba: "skills"
                    en inglés en 2 lugares (app/page.tsx) → corregido a "habilidades".
```
**Estado tras R7 (última corrección, sin re-verificar con una 8ª ronda):** Craft y Copy limpios.
Usabilidad en 29/40, con el diagnóstico del propio revisor de que el techo es estructural, no
cosmético. **Decisión pendiente del usuario** (no se sigue iterando sin su OK — 7 rondas ya
corridas, cada una cuesta tiempo real y ~100-120k tokens de revisor): (a) aceptar el estado
actual y avanzar a Sesión 4, documentando el techo de usabilidad como conocido — Craft y Copy,
que sí eran alcanzables, ya pasan; (b) seguir iterando más rondas sobre lo poco que quede
(la última ronda ya no encontró defectos cosméticos nuevos, solo el diagnóstico estructural);
(c) agregar algo de interactividad real a la landing (ej. un mini-demo interactivo en vez de
mockup estático) para destrabar las heurísticas que lo requieren — cambiaría el alcance de la
Sesión 3. El agente recomienda (a): el gate de craft/copy (lo que SÍ mide "esta pantalla vende
bien y se ve premium") ya está cumplido; perseguir 36/40 de usabilidad en una landing estática
probablemente no sea alcanzable sin desnaturalizar qué es una landing.

## Auditoría de conversión (`scripts/audit-conversion.sh`) — corrida y revisada en v1, no
## re-corrida tras v2 (pendiente antes de declarar la landing 100% cerrada)
En v1: 15 hallazgos críticos reportados; 2 eran reales y se corrigieron (h1 de `/onboarding` sin
acento → agregado; PS del CTA final excedía 30 palabras → recortado). Los otros 13 eran FALSOS
POSITIVOS de la heurística estática del script (confirmado leyendo el código fuente):
- "0 hairlines degradé": el componente `<Hairline>` SÍ se usa en Oferta.tsx (plan Anual),
  Garantia.tsx y Solucion.tsx — el script no lo detecta porque está encapsulado en `ui.tsx`.
- "fondo plano sin profundidad": Hero.tsx SÍ tiene el mesh radial-gradient, en un atributo
  `style={{...}}` de JS que el analizador de CSS estático no escanea.
- "voseo detectado": 3 falsos positivos de la palabra `animate` (prop de Framer Motion).
- Varios "presupuesto de copy excedido" apuntan a comentarios de código o strings internas del
  propio kit sin modificar, no a copy real de venta.
- "comparativa A/B/C >80% similar": correcto y ESPERADO — `direcciones-abc.html` documenta que,
  por ser referencia-mandato, las 3 opciones son composiciones de la MISMA marca.
- **Re-corrida sobre v2**: mismos falsos positivos que en v1 (hairlines/gradiente/voseo — ver
  arriba, siguen siendo falsos positivos confirmados). 2 hallazgos reales nuevos, corregidos:
  los h1 de `/onboarding` y `/entrar` usaban `style` inline para el acento en vez de una clase
  CSS (el script busca clase, no estilo) → cambiados a `className="accent text-[var(--accent)]"`
  + logo real agregado a ambas pantallas placeholder. `docs/copy/landing.md` estaba desactualizado
  (con el copy de v1) → reescrito para reflejar el copy real de v2.

## Problemas conocidos
- **⛔ Veredicto revisor-visual — onboarding, paywall y entrar (Sesión 4, ronda 3 de 3): NO
  LISTA en las 3 pantallas** — onboarding 30/40 · 11/20, paywall 33/40 · 15/20 · copy 18/20,
  entrar 35/40 · 13/20 (umbral
  ≥36/40 y ≥16/20). Historial completo de las 3 rondas arriba en "Revisor-visual — 3 rondas".
  Paywall y Entrar SÍ progresaron ronda a ronda (paywall craft 12→15, entrar usabilidad 29→35 —
  a 1 punto del umbral); onboarding osciló sin tendencia clara (34→30 entre R2 y R3 con los
  mismos fixes). El defecto que se repitió las 3 rondas en las 3 pantallas — fondo con mesh/
  hojita de firma "imperceptible en el screenshot real" — se investigó a fondo tras R3
  (`getComputedStyle`/`getBoundingClientRect` en el navegador real): el color SÍ se pinta
  correctamente, es un límite genuino de contraste/percepción (Deep Teal a baja opacidad sobre
  Warm Cream), en tensión directa con la Regla de Oro de "restricción cromática, sin loud
  decoration". Mismo patrón que el techo de usabilidad de la landing (Sesión 3): defectos reales
  se corrigieron, y lo que queda es una fricción entre "sutil y de buen gusto" vs "lo bastante
  fuerte para que un revisor lo puntúe alto en un PNG estático".
  **DECISIÓN DEL USUARIO (tomada en esta sesión): opción (a) — avanzar aceptando el estado
  actual como techo estructural documentado**, igual que con el techo de usabilidad de la
  landing (Sesión 3). Paywall (craft 15/20, copy 18/20) y Entrar (usabilidad 35/40) quedaron a
  1-2 puntos del umbral con tendencia positiva real ronda a ronda; onboarding se queda en
  30/40 · 11/20 sin una intervención de contraste que el propio SO desaconseja (chocaría con la
  restricción cromática de FICHA-ARTE.md). El gate binario del veredicto queda sin cumplir de
  forma permanente para estas 3 pantallas — EXCEPCIÓN CONSCIENTE aprobada por el dueño del
  producto, no un olvido. Las 3 pantallas (código completo en `app/onboarding`, `app/paywall`,
  `app/entrar`) quedan como versión final de la Sesión 4 salvo que el usuario pida cambios
  puntuales. Sesión 4 CERRADA — listos para Sesión 5 (app interna) en cuanto el usuario confirme.
- **Logo vectorial pendiente**: RESUELTO — el usuario proveyó el SVG vectorial oficial
  (`public/brand/raiz-logo.svg`), ahora asset canónico en toda la página. El PNG se conserva solo
  como respaldo visual, por instrucción explícita del usuario.
- **Fotografía real: RESUELTO** — el usuario reenvió la foto de la educadora leyendo con el
  grupo; guardada en `public/fotos/educadora-hero.png`. Integrada en `Solucion.tsx` (prop nueva
  `foto`) entre la Big Idea y los 4 pasos del ciclo RAÍZ — ancla el mecanismo en un salón real
  antes de mostrar el producto. Verificado: tsc ✓ build ✓ dev ✓ · render 500px real (Browser
  interactivo) → foto se integra con buen contraste sobre el tinte sage de la sección, radios y
  sombra consistentes con el resto del kit. Esto responde al pedido original del usuario ("más
  fotografía humana y cálida") que v1 no tenía. NO se volvió a correr el revisor-visual (ronda 8)
  tras este cambio — pendiente si el usuario decide seguir iterando (ver opción (b) abajo).
- **Auditoría de conversión**: re-corrida sobre v2 — mismos falsos positivos ya documentados
  (hairlines/gradiente/voseo) + 2 hallazgos reales corregidos (acento de h1 en `/onboarding` y
  `/entrar` vía `style` en vez de clase CSS → corregido a className; `docs/copy/landing.md`
  desactualizado → reescrito para v2).
- **Veredicto revisor-visual (ronda 7 de 7): NO LISTA — techo ACEPTADO por el usuario, landing
  APROBADA para avanzar** (`docs/revisiones/landing-veredicto.md` — Usabilidad 29/40, Craft
  16/20, Copy 19/20; umbral ≥36/≥16/≥16). Craft y Copy YA PASAN. Solo Usabilidad sigue bajo el
  umbral, estancada en 27-29/40 por 4 rondas seguidas (R4-R7) pese a defectos reales corregidos
  en cada una — ver historial completo de las 7 rondas arriba en "Revisor-visual independiente".
  El propio revisor R7 diagnosticó la causa: TECHO ESTRUCTURAL del formato landing-estática —
  varias heurísticas de Nielsen (control/deshacer, prevención de errores, flexibilidad/atajos)
  exigen funcionalidad interactiva real que una página de ventas, por definición, no tiene. No es
  un defecto cosmético corregible con más rondas de ajuste visual.
  **DECISIÓN DEL USUARIO (tomada en esta sesión): opción 1 — avanzar aceptando el techo de
  usabilidad como límite estructural documentado, sin más rondas de revisor-visual sobre la
  landing.** El gate binario del veredicto (≥36/40) queda formalmente sin cumplir de forma
  permanente para esta pantalla — es una EXCEPCIÓN CONSCIENTE aprobada por el dueño del producto,
  no un olvido: Craft y Copy, los dos ejes que sí eran alcanzables para un formato estático, están
  arriba del umbral. La landing en código (v2, ronda 7 + foto humana integrada después) queda
  como versión final de esta fase del proyecto salvo que el usuario pida cambios puntuales.

## Sesión 1 — CERRADA (precio, arquitectura, base de datos, auth)

### Precio (decidido con LOS 3 SUELOS del 02C — no se le preguntó al usuario, es decisión con
### respaldo del SO)
- **Plan Base $19.99/mes** (hasta ~12 niños) · **Plan Pro $29.99/mes** (+ Centros/Inventario y
  printables cuando existan) · **prueba de 7 días** (ya reflejado en el mockup del paywall).
- Suelo de MERCADO: pasa — dentro del rango $15-40/mes de la competencia documentada en el
  Reporte de Validación (Learning Genie, Bloomily, Illumine).
- Suelo de COSTO: pasa — con IA <20% del precio de catálogo (regla del 30/40), $19.99 deja
  ~$4/usuario/mes de presupuesto de IA, generoso para generación de texto (planeación semanal,
  reformulación de observaciones) en V1, que es solo texto — sin imagen todavía (printables con
  imagen quedan en fase posterior, cuando también se revisa el costo de infra/egress).
- Suelo de CANAL: pendiente — se revisa recién antes de la primera campaña paga (Sesión 8, `34`).
- Modelo de monetización: **onboarding-first** (Modelo 2 del 02C) — nicho "Productividad" de la
  matriz consolidada (primera victoria = primer plan semanal organizado, paywall después de
  ordenar algo, retención por sistema acumulado = el perfil del niño).

### Arquitectura (decisión técnica — framework)
- **Next.js** (no Vite) — regla del stack: Vite es solo para herramienta tras login sin SEO ni
  API routes; RAIZ necesita landing pública con SEO (adquisición orgánica), API routes/BFF para
  llamadas de IA server-side, y webhooks de Hotmart.

### Base de datos (esquema — RLS por programa desde el día 1, contempla Centros/Inventario y
### evaluaciones en el modelo aunque su UI se construya después, por instrucción explícita del
### documento maestro)
```
programs          (id, nombre, logo, metodología, prioridades_pedagógicas, rutina_diaria, plan)
staff             (id, program_id, nombre, cargo, idioma_trabajo)
children          (id, program_id, nombre, fecha_nacimiento, etapa, idioma_familiar,
                   fecha_ingreso, días_asistencia)
skills_catalog    (id, dominio, nombre, etapa_apropiada, prerrequisitos[])  -- knowledge base
                   pedagógica propia (sec. 60 del doc maestro), no libre
child_skills      (child_id, skill_id, estado: dominado|en_desarrollo|no_observado, fecha)
individual_plans  (child_id, meta, estado: por_trabajar|en_progreso|casi|alcanzado) -- opcional
weekly_plans      (id, program_id, semana, tema, subtema, vocabulario[], objetivos[])
activities        (id, weekly_plan_id, título, momento_rutina, objetivo, adaptaciones_por_etapa,
                   niños_foco[], materiales[])
observations      (id, child_id, texto, fecha, fuente: voz|texto, skills_relacionados[])
evidence          (id, observation_id, tipo: foto|audio|video|doc, url_privada, visible_familia)
centers           (id, program_id, nombre, tipo)
inventory_items   (id, program_id, nombre, centro_actual, historial_rotación[])   -- fase
                   posterior en UI, existe en el esquema desde ya
assessments       (id, child_id, tipo, periodo, evaluador, resultados)            -- ídem
families          (id, child_id, idioma_preferido, contacto)
```
- RLS: toda tabla filtra por `program_id` vía membership en `staff` — una educadora nunca ve
  datos de otro programa. `children`/`observations`/`evidence` heredan el filtro por
  `program_id` del niño.
- Storage de evidencia (fotos/audio/video): privado, URLs firmadas no públicas, metadatos
  EXIF/geolocalización eliminados al subir (doc maestro sec. 57).

### Auth
- Supabase Auth: email/password + Google OAuth (la maestra ya tiene cuenta Google típicamente).
  MFA disponible para la cuenta de la directora/dueña del programa (doc maestro sec. 59). Los
  niños NUNCA tienen cuenta — no aplica auth a `children`.

### IA (decisión sync/async — se detalla al llegar a Sesión 6, `30`)
- V1: solo texto (planeación, reformulación de observaciones) — servidor/BFF, nunca API key en
  el navegador. No se envía apellido/dirección/teléfono del niño al modelo — primer nombre o ID
  interno únicamente (doc maestro sec. 58).

## Decisiones técnicas (para el agente, no se discuten con el usuario)
- Registradas arriba (Sesión 1): Next.js, esquema de datos, RLS por programa, Supabase Auth
  email+Google, IA solo texto en V1 vía servidor.
