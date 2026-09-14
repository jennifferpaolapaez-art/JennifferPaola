# ESTADO.md — RAIZ

> Memoria viva del proyecto. Se actualiza en cada hito.

## Fase actual
Sesión 1 (Validación → Constitución → Dirección de Arte) — en curso, sub-paso: dirección visual (B4/54).

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

## App modelo (FICHA-MODELO.md — creada, pendiente de aprobación del usuario)
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

## Dirección de arte — 3 direcciones presentadas (artifact: direcciones-abc.html)
Fusión de líderes reales (Brightwheel, Lillio/ex-HiMama, Learning Genie/Curriculum Genie,
Bloomily) + Notion como gigante admirado por craft editorial cálido. Nunca combinación inventada.
- **A — Cuaderno cálido:** Fraunces + Inter, crema/tinta/terracota. Editorial, "libreta de
  maestra con oficio".
- **B — Crecimiento orgánico:** Plus Jakarta Sans única, verdes-tierra, app-shell con nav
  inferior. La más ligera/nativa de uso diario.
- **C — Tierra contemporánea:** terracota como protagonista, Fraunces en negrita, más contraste.
  Editorial-premium, "field guide impreso".
Las 3 resaltan sutilmente "AI" dentro de R-AI-Z sin llamarse "RAIZ AI", cada una con su propio
recurso (cursiva de color / subrayado / chip invertido).
Pendiente: elección del usuario (o combinación/ajuste) → cerrar FICHA-ARTE.md + tokens CSS.

## Próximos pasos
1. Usuario elige/ajusta dirección visual → FICHA-ARTE.md + tokens CSS.
2. Usuario aprueba FICHA-MODELO.md (Brightwheel como app modelo).
3. Presentar Plan Maestro completo (8 sesiones) y arrancar Sesión 1 formal (pricing con 02C +
   40-UNIT-ECONOMICS, arquitectura, base de datos, auth).

## Decisiones técnicas (para el agente, no se discuten con el usuario)
- Ninguna aún — se registran aquí cuando se tomen (stack, esquema de datos, auth).
