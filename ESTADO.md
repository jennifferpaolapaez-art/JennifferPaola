# ESTADO.md — RAIZ

> Memoria viva del proyecto. Se actualiza en cada hito.

## Fase actual
Sesión 1 CERRADA. Sesión 3 (landing) v2 construida, pero el revisor-visual independiente la
marcó **NO LISTA** (ver `docs/revisiones/landing-veredicto.md`: Usabilidad 27/40, Craft 12/20,
Copy 14/20 — los 3 por debajo del umbral ≥36/≥16/≥16). NO se declara la landing terminada ni se
avanza a Sesión 4 hasta corregir los 5 defectos del veredicto y volver a pasar el revisor.
Progreso de corrección: 1 de 5 defectos corregido (ver "Problemas conocidos").

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
- **Logo real en el header y footer**: `<img src="/brand/raiz-logo.png">` — el PNG que el usuario
  compartió en chat (se guardó solo en `public/brand/raiz-logo.png`), usado TAL CUAL, no
  recreado en CSS/texto (instrucción explícita del usuario en el rechazo de v1).
- **Headline nuevo**: "Deja de cargar a todos tus niños en la cabeza" (con acento en "en la
  cabeza") — se evaluó contra 2 alternativas que el usuario propuso y contra el original; ganó
  por ser la más corta, más emocional y la que mejor espeja el dolor #1 de FICHA-AVATAR. Subtítulo
  corregido a una idea completa (antes se cortaba en "...con tu próxima").
- **Visual del hero real**: ya no es el placeholder punteado — es un mockup construido con el
  sistema de marca real (`public/mockups/hero.png`) mostrando la pantalla "Hoy": actividad Body
  Collage, adaptación a los 4 niveles, foco individual de Luca/Zayne, materiales en Science
  Center. Mismos mockups reutilizados como screenshots reales del carrusel (`public/mockups/
  frame-*.png`) — ya no son cajas grises con nombre, son demos visuales del producto.
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
- **Logo vectorial pendiente**: el header/footer ya usan el PNG real del usuario
  (`public/brand/raiz-logo.png`), pero ese PNG parece boceto/concepto (probable IA), no archivo
  vectorial de producción. No bloquea construcción — se necesitará un SVG/vector definitivo antes
  de assets de producción (ícono de app nativo, favicon nítido a tamaños pequeños, print).
- **Fotografía real pendiente**: ver nota en "Sesión 3 — v2" arriba — el usuario debe proveer
  fotos reales de educadoras/salones cuando las tenga; no se fabricaron.
- **Auditoría de conversión**: re-corrida sobre v2 — mismos falsos positivos ya documentados
  (hairlines/gradiente/voseo) + 2 hallazgos reales corregidos (acento de h1 en `/onboarding` y
  `/entrar` vía `style` en vez de clase CSS → corregido a className; `docs/copy/landing.md`
  desactualizado → reescrito para v2).
- **⛔ Veredicto revisor-visual: NO LISTA** (`docs/revisiones/landing-veredicto.md` —
  Usabilidad 27/40, Craft 12/20, Copy 14/20; umbral ≥36/≥16/≥16). 5 defectos reportados,
  estado de corrección:
  1. ✅ CORREGIDO — `CheckCustom` en `ui.tsx` usaba el ícono genérico Lucide `Check`; ahora usa la
     hojita propia de la marca (mismo gesto CSS del logo) como dispositivo ownable repetido.
  2. ⬜ PENDIENTE — CTA con copy inconsistente: `page.tsx` usa "Crear mi primera semana gratis"
     pero `Oferta.tsx` cambia a "Empezar mis 7 días gratis" / "Elegir mensual". Falta unificar al
     mismo verbo en toda la página (regla propia del kit).
  3. ⬜ PENDIENTE — la Garantía vive en su propia sección, separada de los botones de precio; falta
     microcopy de garantía con plazo justo debajo de cada CTA de plan en `Oferta.tsx`.
  4. ⬜ PENDIENTE — el badge de credibilidad del hero ("Creada desde un salón real...") no tiene
     dato verificable/citable; el revisor pide retirarlo o reemplazarlo por algo concreto.
  5. ⬜ PENDIENTE — la landing solo usa 2 niveles de profundidad (base/elevado); falta un
     tratamiento "hundido" (ej. en el stack de valor Hormozi de `Oferta.tsx`).
  **No avanzar a Sesión 4 ni declarar la landing lista hasta corregir 2-5 y volver a correr el
  revisor-visual** (ver protocolo en `.claude/agents/revisor-visual.md` — en este entorno el
  Agent tool no reconoce agentes de proyecto por nombre; se simula invocando un agente
  general-purpose con el contenido completo de esa ficha pegado en el prompt, más las 4 rutas
  de insumo: screenshot 375, código, FICHA-ARTE.md, FICHA-AVATAR.md).

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
