# ESTADO.md — RAIZ

> Memoria viva del proyecto. Se actualiza en cada hito.

## Fase actual
Sesión 1 CERRADA. Sesión 3 (landing) v2 — **APROBADA por el usuario y CERRADA** (detalle abajo).
Sesión 4 (onboarding → paywall → login) — **APROBADA por el usuario y CERRADA**: 3 rondas de
revisor-visual, defectos reales corregidos, gate binario aceptado como techo estructural
documentado (mismo patrón que la landing) — ver "Problemas conocidos". Sesión 5 (app interna) —
**construida, dirección visual APROBADA sin cambios por el usuario, modelo pedagógico APROBADO
tras 2 rondas de feedback + replicado a las 5 semanas completas** (ronda 1: jerarquía Resumen→
Planeación completa→Día→Actividad + 3 capas separadas; ronda 2: guía propia por tipo de bloque,
aprobada por el usuario ["se ve bien, replícalo al resto de la semana"] y ya generalizada a
Lunes-Viernes completos) — ver "Sesión 5". **Ronda 3 (arquitectura de datos): CERRADA** — antes de
seguir construyendo pantallas nuevas, el usuario pidió fijar el esqueleto de datos (rutina
configurada, adaptaciones/niños foco relacionales, asistencia con estado, imprimibles reservados);
negociado punto por punto con el usuario y ejecutado — ver "Refinamiento del esquema (Sesión 5,
ronda 3)" en Sesión 1 y "Sesión 5 → Arquitectura de datos" abajo. Build verde. **Sesión 5
funcionalmente completa — pendiente que el usuario la recorra completa y confirme antes de pasar a
Sesión 6** — el usuario recorrió Hoy/Planeación/Observar en el navegador interactivo (dirigida con
opciones rápidas y espontánea con análisis simulado, ambos caminos probados de punta a punta) y
confirmó avanzar. **Sesión 5 CERRADA con Puerta de Etapa aprobada** (ver abajo). Explícitamente NO
construido todavía (por instrucción del usuario): generación de PDF, contenido generado por IA
real, imprimibles reales, paquete semanal, pantalla "Preparar mi semana". Gate del revisor-visual
sobre `/hoy` (4 rondas, previas a ambas correcciones pedagógicas) sigue como techo estructural
aceptado — ver "Problemas conocidos".

**⚠️ SECUENCIA REPLANIFICADA por el usuario (tras cerrar la Puerta de Etapa de Sesión 5) — cosa
juzgada, no volver a la secuencia genérica de servicios externos sin que el usuario lo pida.**
El usuario detectó correctamente que la app interna de Sesión 5 es un vertical slice mínimo
(Planeación→Hoy→actividad→adaptaciones/foco→observación), NO el núcleo funcional completo de
RAÍZ — y que conectar Supabase/Auth/IA real/Hotmart ahora congelaría un esquema construido sobre
datos de ejemplo fijos (`NINOS`/`RUTINA_PROGRAMA` son constantes en código; el Perfil del niño en
`app/ninos/[id]/page.tsx` es de solo lectura — no hay dónde crear/editar un niño todavía). Orden
oficial a partir de ahora:
```
1. GitHub / respaldo del proyecto actual                    ← CERRADO (push verificado en remoto)
2. Configuración del programa (metodología, etapas, rutina, idiomas, prioridades, tracks) ← CERRADO
3. Módulo Niños real (crear/editar, DOB→edad automática, días, idioma, "Cuéntame sobre este niño")
   ← CERRADO
4. Perfil completo del niño: evaluación inicial RAÍZ + evaluaciones/documentos externos +
   Plan Individual opcional — CERRADO por completo (arquitectura + experiencia de evaluación por
   preguntas observables, validada en Infant/Toddler/Preschool/Pre-K), ver sección de cierre
5. Planeación CON o SIN niños — CERRADO (conecta la Planeación ya aprobada con Módulo Niños, ver
   sección de cierre; no se reconstruyó nada de lo existente)
6. Observaciones como módulo independiente — CERRADO (persiste de verdad, entrada propia +
   contexto desde Hoy/Actividad/Perfil, cierra el ciclo con Planeación), ver sección de cierre
7. Progreso / Reportes (vista de lectura sobre lo ya acumulado)
   — núcleo funcional sólido antes de continuar —
8. Supabase + Auth real
9. IA real
10. Publicación (Vercel)
11. Dominio
12. Cobro (Hotmart)
```
Centros/Inventario, imprimibles, PDF, paquete semanal y "Preparar mi semana" NO se eliminan —
siguen como fase posterior ya decidida en la Constitución del Producto (Sesión 1), fuera de este
punch list.

### Arquitectura APROBADA — Perfil completo del niño (v2, negociada en 3 rondas con el usuario)
Cosa juzgada — no rediseñar salvo que el usuario lo pida. Entidades finales:
```
programs           += idiomas_ensenanza[], idioma_salida_default, tracks_activos[],
                       frecuencia_evaluacion  (idioma_trabajo YA vive en `staff`, Sesión 1 —
                       no se duplica en programs)
children            += idiomas[], intereses[], fortalezas[], formas_comunicacion,
                       notas_ingreso_original, notas_ingreso_resumen? (mismo patrón que
                       observations.nota_original/redaccion_profesional — nunca se sobrescribe),
                       frecuencia_evaluacion_override?, fecha_ultima_evaluacion_aprobada?,
                       fecha_proxima_evaluacion (calculada), idioma_reporte_preferido?
skills_catalog       += rango_edad_meses_min/max, politica_revision (una_vez_dominado|
                       seguimiento_periodico|desarrollo_continuo), evidencia_requerida
                       (una_demostracion_clara|multiples_contextos|consistencia_repetida),
                       veces_minimas? (SOLO si evidencia_requerida=consistencia_repetida — nunca
                       una regla universal de "N observaciones"), contextos_recomendados[]

assessment_templates       (id, rango_edad_meses_min/max, etapa, track: null=core|track_id,
                            version, vigente) — INMUTABLE tras el primer uso; un cambio siempre
                            crea versión nueva, nunca edita la existente
assessment_template_skills (assessment_template_id, skill_id, orden)

child_skills          -- ESTADO ACTUAL, dos ejes separados:
                          estado_desarrollo: desconocido|en_desarrollo|dominado
                          estado_evidencia:  no_observado|insuficiente|suficiente|contradictoria
child_skill_events    -- HISTORIAL: child_id, skill_id, estado_desarrollo_anterior/nuevo,
                          estado_evidencia_anterior/nuevo, fecha, fuente, observation_id?,
                          child_assessment_id?, confirmado_por_maestra

child_needs     (child_id, categoria, descripcion, estado: activa|resuelta|por_revisar, origen,
                 teacher_confirmed) + columnas FK EXCLUYENTES en vez de referencia genérica:
                 observation_id? / child_assessment_id? / external_assessment_id? /
                 external_assessment_finding_id? / individual_plan_id? (exactamente una NOT NULL
                 si origen≠'maestra' — integridad referencial real en Postgres/Supabase)
child_supports  (child_id, child_need_id?, estrategia, activa) — mismo patrón de FK excluyentes

child_assessments          (child_id, tipo: ingreso|periodica, fecha, estado: borrador|aprobada,
                            aprobada_por, aprobada_en, edad_al_momento_meses, etapa_al_momento)
child_assessment_results   (child_assessment_id, skill_id, assessment_template_id,
                            estado_desarrollo, estado_evidencia, sugerido_por_raiz,
                            editado_por_maestra)
child_assessment_result_evidence (..._result_id, observation_id?, evidence_id?,
                            external_assessment_id?, external_assessment_finding_id?)

observations, observation_skills, evidence   -- sin cambios (Sesión 5 ronda 4)

external_assessments          (child_id, tipo: ASQ-3|IFSP|IEP|speech_language|OT|PT|otro,
                               nombre_instrumento, fecha, profesional_o_entidad, resumen,
                               areas_relevantes[], recomendaciones, archivo_url,
                               permiso_uso_pedagogico) — RAÍZ nunca diagnostica, nunca reproduce
                               el instrumento propietario completo
external_assessment_findings   (external_assessment_id, tipo_hallazgo, area, resumen,
                               recomendacion, skill_id?, teacher_confirmed) — hallazgos puntuales
                               citables sin convertir el documento completo en resultado propio

individual_plans   (child_id, estado, motivo, origen) — 0 filas = sin Plan Individual, válido
individual_goals    (individual_plan_id, skill_id?, descripcion, estado, estrategias,
                    siguiente_paso)
individual_goal_evidence (individual_goal_id, observation_id?, evidence_id?)

child_reports   (child_id, tipo, periodo_inicio/fin, estado: borrador|aprobado,
                contenido_snapshot, based_on_child_assessment_id?, idioma, version, pdf_url?
                reservado) — congelado tras aprobar; un cambio posterior en datos vivos NUNCA
                altera un reporte ya aprobado; versión nueva en vez de sobrescribir

rutina_bloques, dias_plan, activities                       -- sin cambios (Sesión 5 ronda 3)
activity_child_adaptations (+ child_support_id? nuevo)
activity_child_focus        (ya tenía individual_goal_id?/skill_id? — sin cambios)
```
Regla de próxima evaluación (decisión técnica, no configurable — evita exponerle a la maestra una
regla que no necesita decidir): `fecha_proxima_evaluacion` = (`fecha_ultima_evaluacion_aprobada` o
`fecha_ingreso` si aún no tiene ninguna) + (`frecuencia_evaluacion_override` del niño, si existe,
si no la del programa). "Reportes" y "Progreso" quedan separados a propósito: progreso es una
vista dinámica sobre datos vivos; `child_reports` es el snapshot congelado y versionado que sí se
puede aprobar/compartir sin que cambie después.

### Puerta de Etapa — App interna (Sesión 5)
1. Objetivo: entregar Perfil→Planeación→Observación→Próxima planeación con datos semilla reales.
2. Archivos del SO leídos: 32, 53, RUBRICAS-DE-PANTALLA, CHECKLIST-CIERRE (por pantalla, sesión a sesión).
3. Rutas: `/hoy`, `/semana`, `/planeacion`, `/planeacion/[id]`, `/ninos`, `/ninos/[id]`,
   `/ninos-foco`, `/observar` (reconstruida con 2 caminos en ronda 4).
4. Protagonista por pantalla: Hoy=rutina del día+actividad actual; Planeación=todos los bloques de
   la semana; Actividad=las 3 capas (etapa/adaptación/foco); Niños=roster y perfil; Observar=
   registrar sin necesitar saber clasificar.
5. Acción primaria: Hoy→"Registrar observación de hoy"; Planeación→abrir un bloque; Observar→
   guardar (dirigida o espontánea).
6. Evidencia: tsc ✓ build ✓ (18 rutas) en cada ronda · revisor-visual sobre `/hoy` 4 rondas
   (24→27→34→28/40 · 12→15→15→14/20, techo estructural documentado y aceptado) · recorrido
   completo en navegador interactivo a 375px real, ambos caminos de Observar verificados end to end.
7. Riesgos/pendientes: gate `/hoy` bajo umbral (aceptado como excepción); printables/PDF/IA
   real/paquete semanal/"Preparar mi semana" quedan para fases posteriores, no para Sesión 6.
8. Veredicto: **aprobable** (excepción consciente documentada, no bloqueante).
9. Siguiente etapa: Sesión 6, servicios externos — conectar lo ya construido a infraestructura real.

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
- **⛔ Veredicto revisor-visual — pantalla principal /hoy (Sesión 5, ronda 4 de 4): NO LISTA** —
  24/40→27/40→34/40→28/40 · 12/20→15/20→15/20→14/20 (umbral ≥36/40 y ≥16/20). Historial completo
  de las 4 rondas arriba en "Sesión 5". Cada ronda corrigió defectos reales y verificables (sin
  CTA principal → agregado; contraste AA fallando en 2 tokens → corregido; ícono genérico en vez
  del dispositivo ownable → corregido; tamaño táctil bajo 44px → corregido; texto tapado por el
  nav → corregido), pero el puntaje OSCILÓ en vez de converger — mismo patrón de techo
  estructural ya documentado y aceptado por el usuario en la landing (7 rondas) y en
  onboarding/paywall/entrar (3 rondas): a partir de cierto punto, cada ronda de revisor
  independiente encuentra un conjunto DISTINTO de micro-defectos subjetivos (jerarquía de
  tamaños, timing de animación, persistencia de preferencias) más rápido de lo que se pueden
  cerrar, sin que el puntaje general mejore de forma sostenida.
  **DECISIÓN PENDIENTE DEL USUARIO** (presentada en el reporte de cierre de esta sesión, aún sin
  respuesta): (a) avanzar aceptando el estado actual de `/hoy` como techo estructural
  documentado — los defectos objetivos (CTA, contraste, tamaño táctil, dispositivo ownable) ya
  están corregidos; lo que resta son matices de criterio entre revisores; (b) invertir una 5ª
  ronda de revisor-visual; (c) revisar manualmente junto con el usuario los 5 defectos de la
  ronda 4 y decidir cuáles vale la pena perseguir. **No se avanza a la fase de servicios externos
  (Supabase/Hotmart reales) ni se declara la Sesión 5 "lista" hasta que el usuario elija.**
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

## Sesión 5 — App interna (Hoy, Observar, Semana, Niños, Perfil)

### ⚠️ CORRECCIÓN PEDAGÓGICA DEL USUARIO (tras ver la app construida — cosa juzgada, no redecidir)
El usuario aprobó la dirección visual sin cambios ("me gusta mucho cómo va visualmente y NO
quiero cambiar la dirección general") pero corrigió el MODELO de fondo: la v1 de Hoy/Semana
simplificaba de más cómo funciona una planeación real de Early Childhood Education. Reglas
correctas ya implementadas, cosa juzgada para toda sesión futura:
```
1. Un día tiene VARIOS bloques de rutina (Circle Time, Actividad principal, STEAM, Centros,
   Lectura, Outdoor, Pre-K, Cierre) — NUNCA una sola actividad. Los bloques son CONFIGURABLES
   por la maestra (catálogo Bloque/BLOQUE_LABEL en seed-data.ts), no fijos para todas.
2. "Semana" (la pantalla que ya existía) es un RESUMEN/vista rápida — NUNCA la planeación. Debe
   llevar a "Ver planeación completa" (/planeacion), que sí muestra info general de la semana
   (tema mensual, subtema, vocabulario, objetivos, dominios) + TODOS los bloques de cada día.
3. Jerarquía de navegación fija: Vista rápida (/semana) → Planeación completa (/planeacion) →
   Día (sección dentro de /planeacion) → Actividad (/planeacion/[id]) → capas de esa actividad.
4. Dentro de una actividad hay 3 CAPAS que NUNCA se mezclan entre sí:
   (a) diferenciación por ETAPA (Infant/Toddler/Preschool/Pre-K) — universal, "Una experiencia,
       cuatro niveles" se mantiene tal cual, pero aclarando que es de UNA actividad, no del día.
   (b) ADAPTACIONES INDIVIDUALES — ajuste puntual de un niño por una necesidad (sensorial,
       motriz, de lenguaje). NUNCA implica que el niño tenga un Plan Individual.
   (c) NIÑOS FOCO — niños cuya meta/skill activa se observa a propósito en ESA actividad. Un
       niño foco puede no tener ninguna adaptación, y viceversa — son listas independientes
       (`adaptacionesIndividuales` y `ninosFoco` en el tipo `Actividad`, nunca combinadas).
5. 3 NIVELES de objetivo, nunca colapsados en uno: objetivo DE LA SEMANA (grupo — campo
   `objetivosGenerales` de `PlaneacionSemanal`), objetivo DE LA ACTIVIDAD (skill/propósito —
   campo `objetivo` de `Actividad`), objetivo INDIVIDUAL (cómo un niño puntual aprovecha esa
   misma experiencia — vive en `ninosFoco`/`adaptacionesIndividuales`, no como campo aparte).
6. "Hoy" muestra PRIMERO el resumen de toda la rutina del día (todos los bloques con hora),
   Y DESPUÉS destaca la "Actividad actual" con su detalle — nunca entra directo a una actividad.
```
Implementado en `lib/seed-data.ts` (reescrito: `PlaneacionSemanal`/`DiaPlan`/`Actividad`/
`AdaptacionIndividual`/`NinoFocoActividad`, catálogo `Bloque`/`BLOQUE_LABEL`) + `app/semana`
(ahora "Resumen semanal", mismo diseño ya aprobado, + CTA "Ver planeación completa") +
`app/planeacion` (nueva, info general de semana + todos los bloques de cada día) +
`app/planeacion/[id]` (nueva, detalle de actividad con las 3 capas separadas) + `app/hoy`
(reescrita: rutina completa primero, actividad actual después, adaptaciones y foco como
secciones separadas). Verificado: tsc ✓ build ✓ · las 4 pantallas revisadas visualmente en
producción (screenshots temporales, no guardados) — contenido completo confirmado también vía
HTML renderizado en servidor cuando la animación de entrada no había asentado en la captura.
**Mostrado al usuario — pendiente su confirmación antes de avanzar** (regla explícita del
usuario: "no avances todavía a nuevas funcionalidades hasta mostrarme cómo quedan estas
correcciones").

### ⚠️ CORRECCIÓN PEDAGÓGICA DEL USUARIO — RONDA 2 (tras ver la ronda 1 — cosa juzgada)
El usuario aprobó la estructura de la ronda 1 ("va exactamente en la dirección correcta") pero
señaló que solo la Actividad Principal tenía profundidad real — Circle Time/Outdoor/STEAM/
Centros se quedaban en una descripción corta + skill + materiales. Regla nueva, cosa juzgada:
```
7. CADA TIPO DE BLOQUE tiene una función pedagógica propia y NECESITA SU PROPIA estructura de
   guía — nunca forzar todo en la plantilla de "Actividad Principal". Implementado como 3 tipos
   de guía específicos en `Actividad` (`guiaCircle`, `guiaOutdoor`, `guiaCentros` — solo UNO se
   llena según `bloque`), reutilizando los campos genéricos ya existentes (`preparacion`/
   `queHaceMaestra`/`queHacenNinos`/`preguntasGuia`) para STEAM y Pre-K, que SÍ encajan en esa
   forma:
   - CIRCLE TIME (`guiaCircle`): rutina que se repite BREVE cada día (saludo/fecha/clima/conteo,
     3-5 min) + un "Foco de hoy" que SÍ cambia (tema/palabras del día/muestra/preguntas/libro/
     letra/canción, 5-7 min) + cierre-transición. RAIZ decide qué enfatizar cada día — la maestra
     nunca escribe esto desde cero.
   - OUTDOOR (`guiaOutdoor`): una invitación de movimiento intencional breve (~5 min) conectada
     al tema, seguida de juego libre real — JAMÁS otra clase académica al aire libre.
   - CENTROS (`guiaCentros`): lista de estaciones simultáneas, cada una con su propia
     provocación/intención/pregunta — nunca "juego libre" a secas.
8. La superficie se mantiene simple aunque la profundidad exista: `<Colapsable>` nuevo en
   `components/app/shell.tsx` — "Adaptaciones individuales", "Niños foco" y "Qué observar" viven
   plegados por defecto en el detalle de cualquier bloque; lo que SÍ es la guía propia del tipo
   de bloque (Circle Time/Outdoor/Centros/genérica) y "Una experiencia, cuatro niveles" quedan
   siempre visibles al abrir la pantalla.
```
Implementado y poblado a profundidad completa para los 4 bloques del martes que el usuario pidió
ver como muestra (`mar-circle`, `mar-outdoor`, `mar-steam`, `mar-centros` en `lib/seed-data.ts`),
demostrando los 4 conceptos pedidos en los 4: diferenciación por etapa, adaptación individual
(Sofía/lenguaje expresivo en Circle Time, Mateo/no se sienta en Circle Time y STEAM), niño foco
con micro-observación (Sofía→HEAD, Luca→pregunta corporal en Circle; Zayne→vocabulario en STEAM),
y `conexionTema` (cómo cada bloque se conecta con el tema semanal).

**✅ APROBADO por el usuario** ("se ve bien, replícalo al resto de la semana") **y ya
replicado a los 5 días completos** (Lunes-Viernes, 18 actividades en total en
`PLANEACION_SEMANA_3`): cada Circle Time de la semana sigue la distribución que el propio
usuario propuso (Lunes introduce el tema + 1 palabra · Martes profundiza 2 palabras + letra ·
Miércoles trae el libro del día · Jueves liga un concepto/número [los 5 sentidos] · Viernes
repasa todo el vocabulario de la semana), cada Outdoor tiene su invitación de movimiento propia,
cada Centros tiene sus estaciones con provocación propia, y se agregó el tipo `GuiaCierre`
(Recuerda/Pregunta/Vocabulario/Canción-movimiento/Puente a la próxima semana) para `vie-cierre`,
que la ronda 1 había dejado sin estructura. Verificado: tsc ✓ build ✓ · las 14 rutas nuevas
responden 200 · contenido confirmado completo vía HTML renderizado en servidor para varias
muestras (Lunes completo, Viernes-Cierre).
- **Alcance:** las 3 funciones núcleo del MVP (Constitución del Producto) + la pantalla principal
  M0. Construida con datos semilla realistas (`lib/seed-data.ts` — 4 niños: Luca/Preschool,
  Zayne/Pre-K, Sofía/Toddler, Mateo/Infant, con habilidades y estados reales) — SIN backend
  todavía (Supabase se conecta en la fase de servicios externos, más adelante en la secuencia
  maestra). Message-match verificado con los mockups YA mostrados en la landing (frame-hoy.png,
  frame-foco.png, frame-semana.png, frame-perfil.png de `AppPorDentro.tsx`) — misma actividad
  "Collage del cuerpo", mismos niños foco.
- **Pantallas construidas:**
  - `/hoy` (M0, pantalla principal): actividad del día diferenciada por las 4 bandas de edad
    (tabs tocables) + materiales disponibles/faltantes + niños foco + CTA principal.
  - `/observar` (nueva, no estaba en los mockups de la landing): la 3ª función núcleo del MVP
    ("observación rápida que alimenta el próximo plan") — flujo de 3 pasos (niño → habilidad →
    nota) que antes NO existía como pantalla; se creó porque el revisor-visual marcó que Hoy no
    tenía ninguna acción principal reconocible en <3s.
  - `/ninos-foco`: drill-down desde Hoy, expande "Niños foco de hoy" (message-match frame-foco.png).
  - `/semana`: planeación semanal con navegación de períodos (mockup frame-semana.png).
  - `/ninos` (roster, agrupado por etapa) → `/ninos/[id]` (Perfil — mockup frame-perfil.png).
- **Componentes nuevos:** `components/app/shell.tsx` (AppShell con bottom nav de 3 destinos:
  Hoy/Semana/Niños, `SkillBadge`, `EtapaChip`, `AvatarInicial`, `LeafCheck` — el dispositivo
  ownable de marca, reemplazando los íconos genéricos Check/X de Lucide) + `lib/seed-data.ts`.
  Se agregaron tokens `--sage`/`--butter`/`--coral`/`--teal-nota` a `tokens.css` (antes cada
  archivo del proyecto hardcodeaba su propio hex para las 4 notas de color del ciclo RAÍZ).
- **Revisor-visual sobre `/hoy` (pantalla principal — obligatorio, una de las 4 del dinero):
  4 rondas corridas.**
  ```
  R1  24/40 · 12/20 — defectos: bandas de edad "en inglés" (FALSO POSITIVO — decisión de
      producto ya tomada, términos de licenciamiento US, documentado abajo), párrafo de cierre
      no visible, sin CTA principal reconocible (defecto real más importante — Hoy no tenía
      NINGUNA acción en <3s), fecha con "De" en mayúscula (bug de la clase `capitalize` de
      Tailwind con preposiciones en español), sin dispositivo ownable, reduced-motion incompleto.
  R2  27/40 · 15/20 — tras agregar el CTA "Registrar observación de hoy" (→ nueva pantalla
      /observar), LeafCheck en vez de Check/X genérico, fix de fecha, reduced-motion completo.
      Defectos nuevos: contraste del --coral en el chip negativo (~3.25:1), el ícono de éxito de
      /observar no usaba LeafCheck, EtapaChip duplicado (Hoy reimplementaba el compartido a
      mano), CTA sin whileTap real (solo CSS).
  R3  34/40 · 15/20 — tras oscurecer --coral a #96412D, unificar EtapaChip, agregar whileTap.
      Defectos nuevos: --text-secondary sobre --surface-2 medía ~4.15:1 (bajo AA), card principal
      dependía solo de la sombra para separarse del fondo, botón deshabilitado de /observar sin
      texto de ayuda.
  R4  28/40 · 14/20 — tras los 3 fixes de R3 (chip inactivo a --text-primary, borde sutil en la
      card, hint bajo el textarea). OSCILÓ hacia abajo pese a fixes reales — mismo patrón de
      varianza entre revisores independientes ya visto en onboarding. Defectos nuevos: el pie de
      página quedaba tapado por el nav sticky (pb-6 insuficiente — REAL, corregido), chips de
      edad con ~34px de alto táctil (bajo el mínimo 44px — REAL, corregido a min-h-11), falta
      AnimatePresence en el cross-fade del texto de diferenciación, "Preschool" como default sin
      persistencia (heurística 7), jerarquía de tamaños 13/14/15px muy apretada.
  ```
  **Fixes objetivos de R4 aplicados sin relanzar una 5ª ronda** (padding del shell, tamaño
  táctil de los chips — ambos verificables sin ambigüedad, no dependen del criterio subjetivo
  del revisor). NO se corrió una 5ª ronda de revisor-visual: 4 rondas ya corridas (~320k tokens),
  con oscilación de puntaje (24→27→34→28) en vez de convergencia — el mismo patrón de techo
  estructural que la landing (7 rondas) y onboarding/paywall/entrar (3 rondas). Ver decisión en
  "Problemas conocidos".
- **Nota sobre "Infant/Toddler/Preschool/Pre-K" en inglés:** el revisor R1 lo marcó como defecto
  de idioma; se mantuvo sin cambio porque es una decisión de producto YA tomada y documentada
  (Sesión 3, mockups de la landing): son los términos de clasificación por edad del licenciamiento
  de cuidado infantil en EE.UU., no un descuido de traducción — cambiarlos rompería además el
  message-match con los mockups que la landing ya le prometió al usuario.

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

### Refinamiento del esquema (Sesión 5, ronda 3 — arquitectura oficial, decidida con el usuario)
El modelo pedagógico de Sesión 5 (rutina/capas/guías por bloque) exigió extender el esquema base
de arriba sin romperlo — negociado punto por punto con el usuario (relacional vs. JSONB, qué
entidades separar), documentado aquí como arquitectura oficial de RAÍZ:
```
rutina_bloques         (id, program_id, bloque, hora_aproximada, duracion_min, orden, dias[])
                        -- CONFIGURACIÓN del salón; el día NUNCA improvisa qué bloques trae, los
                        hereda de aquí (demo: RUTINA_PROGRAMA + bloquesConfiguradosParaDia())
dias_plan               (id, weekly_plan_id, dia_semana, fecha, tema_dia, foco_dia)
                        -- antes vivía escondido dentro del contenido de Circle Time; ahora es un
                        hecho estructurado del día (demo: DiaPlan.temaDia/focoDia)
activities              = LA INSTANCIA programada de un día concreto, nunca una biblioteca
                        reutilizable. Contenido flexible por tipo de bloque (circle/outdoor/
                        centros/cierre/genérico) va en JSONB; una futura activity_templates/
                        activity_library (NO construida) podría alimentarla más adelante.
activity_child_adaptations (id, activity_id, child_id, necesidad, adaptacion, origen:
                        necesidad_registrada|plan_individual|observacion|recomendacion_raiz,
                        alcance: solo_esta_actividad|general_del_nino, child_need_id?,
                        individual_goal_id?, plan_id?, observation_id?)
                        -- necesidad/adaptacion = snapshot histórico de lo usado ese día; las
                        referencias enlazan la fuente estructurada cuando existe (ninguna
                        obligatoria) para saber no solo QUÉ se hizo sino POR QUÉ se sugirió
activity_child_focus    (id, activity_id, child_id, skill_id?, individual_goal_id?, motivo,
                        pregunta_observacion, estado: pendiente|observado, observation_id?)
                        -- el RESULTADO nunca se duplica como texto aquí: la fuente de verdad del
                        resultado vive solo en observations
asistencia_diaria       (child_id, fecha, estado: sin_marcar|presente|ausente,
                        UNIQUE(child_id, fecha))
                        -- "programado" NO es un valor de este estado: se DERIVA comparando
                        children.días_asistencia contra el día de la semana, nunca se guarda como
                        presencia (demo: estaProgramadoEnFecha() vs. estadoAsistencia())
printables              (id, activity_id, titulo, tipo: ficha_individual|ficha_grupal|
                        guia_para_casa) -- entidad RESERVADA, sin generación de archivos real
```
Regla dura que gobierna todo lo anterior: el contenido flexible (JSONB) NUNCA esconde una llave
relacional (child_id, skill_id, observation_id, individual_goal_id...) — esas siempre viven en
campos/tablas estructurados, nunca en el texto libre de una guía. Implementado en el modelo
TypeScript de la demo (`lib/seed-data.ts`): `BloqueRutina`/`RUTINA_PROGRAMA`,
`AdaptacionIndividual` (con origen/alcance/referencias), `NinoFocoActividad` (con skillId/
estadoFoco/observationId), `EstadoAsistencia`/`ASISTENCIA_HOY`/`estaProgramadoEnFecha`,
`Printable` (reservado, sin instancias todavía), `DiaPlan.temaDia`/`focoDia`. Verificado: tsc ✓
build ✓ · `/hoy` y `/planeacion/mar-principal` revisadas en el navegador interactivo, sin
regresión frente al modelo anterior. **Explícitamente NO construido en esta ronda** (instrucción
del usuario): generación de PDF, contenido generado por IA real, archivos de imprimibles reales,
el paquete semanal agregado, la pantalla "Preparar mi semana".

### Refinamiento del esquema (Sesión 5, ronda 4 — `observations`, arquitectura oficial)
Regla dura del usuario, motivo del cambio: "la maestra puede observar sin saber cómo clasificar
lo que vio. RAÍZ ayuda a organizarlo después." `observations` nunca se había implementado (solo
un boceto de una línea en el esquema original de Sesión 1, `skills_relacionados[]` como array) —
se construyó completo, con DOS caminos hacia el mismo historial:
```
observations           (id, child_id, activity_id?, fecha, origen: dirigida|espontanea,
                        fuente: texto|voz|seleccion_rapida, nota_original,
                        redaccion_profesional?, triggered_by_skill_id?)
                        -- nota_original NUNCA se sobrescribe; redaccion_profesional vive aparte
                        (reservado — el análisis real de IA llega en servicios externos, `30`)
observation_skills      (observation_id, skill_id, origen: raiz|maestra|observacion_dirigida,
                        estado: sugerido|aceptado|rechazado, evidencia_textual?)
                        -- una observación tiene 0, 1 o varios skills. `origen`+`estado` en vez de
                        dos booleanos independientes (ambigüedad que el usuario señaló
                        explícitamente: "sugerido y no revisado" vs. "sugerido y rechazado" deben
                        distinguirse sin adivinar) — así se conserva incluso qué sugerencias de
                        RAÍZ se rechazaron, sin duplicar el resultado en otro lado
```
DOS caminos, un mismo historial: (a) DIRIGIDA — toca una habilidad ya sugerida o una
micro-observación de opciones rápidas (`fuente: seleccion_rapida`, ej. Tijeras) → el skill queda
`aceptado` de una vez, sin paso de sugerencia (`origen: observacion_dirigida`). (b) ESPONTÁNEA —
escribe/dicta libremente SIN elegir ningún skill antes → RAÍZ analiza la nota y sugiere posibles
skills (`origen: raiz`, `estado: sugerido`); la maestra acepta/rechaza cada uno (toggle), agrega
otra área manualmente (`origen: maestra`), o guarda sin clasificar (0 filas en
`observation_skills`, perfectamente válido). El progreso real del niño (`child_skills`/
`Nino.skills[].estado`) sigue sin cambiar solo por acumular observaciones — decisión humana
explícita, sin tocar en esta ronda.
Implementado en `lib/seed-data.ts` (`Observacion`, `ObservacionSkill`, `OPCIONES_RAPIDAS_POR_SKILL`,
`analizarNotaSimulado` — **simulación local por palabra clave, NUNCA IA real todavía**, con aviso
explícito en la UI: "Análisis de ejemplo — el análisis real llega con el servicio de IA") +
`app/observar/page.tsx` reescrita con 6 pasos (nino → camino → dirigida-nota /
espontanea-entrada → espontanea-sugerencias → listo). "Hablar" (dictado por voz) queda deshabilitado
con copy honesto ("muy pronto"), mismo patrón ya usado para Google OAuth en Sesión 4 — nunca se
simula una capacidad que no existe. "Agregar foto" SÍ es funcional (preview local con
`URL.createObjectURL`, sin subir a ningún backend todavía). Verificado: tsc ✓ build ✓ · recorrido
completo en el navegador interactivo a 375px real — camino dirigido con opción rápida (Tijeras →
"Cortes consecutivos sin ayuda" → guardado con skill aceptado automáticamente) y camino espontáneo
(nota de ejemplo del usuario sobre Mateo/bloques → RAÍZ sugiere "Agarre de pinza" con la evidencia
textual correcta → probado tanto aceptar como rechazar la sugerencia → pantalla final refleja
correctamente "guardada sin clasificar" cuando el único skill queda rechazado). Sin regresión en
niños foco/adaptaciones (sus `observationId?` siguen siendo la misma referencia opcional).

## Sesión 6, paso 2 — Configuración del programa (CERRADO)
Primera pantalla real de creación/edición de la app (todo lo anterior era solo lectura). Construida
en `app/configuracion/page.tsx`, 9 secciones plegables (`<Colapsable>`, reutilizado sin cambios):
Mi programa (nombre + tipo), A quién enseño (en su momento un tipo `EtapaAtendida` propio,
separado del `Etapa` de 4 valores de las 18 actividades — reconciliado en el paso 3, ver abajo:
ya no existe, ambas pantallas comparten el mismo `Etapa` de 5 valores), Cómo enseño (metodologías estructuradas + descripción libre),
Idiomas (`idiomasEnsenanza[]` + `idiomaSalidaDefault` — "bilingüe" ya NO es un valor de idioma,
corrección del usuario), Qué quiero priorizar (lista sugerida + agregar propia, sin límite),
Tracks opcionales (5 tracks controlados, ligados a `assessment_template.track`), Evaluaciones
(trimestral/semestral/anual/personalizada, default trimestral), Mi rutina (editor completo de
`RUTINA_PROGRAMA`: tipo de bloque incl. Música/Transición/Personalizado, nombre personalizado,
hora, duración, días, activo/inactivo, reordenar ↑↓, agregar/eliminar), Preferencias (prácticas a
evitar + texto libre). Persistencia: `localStorage` (`raiz_programa_config`) — Supabase llega en
el paso 8 del orden acordado, no antes; mismo patrón ya usado por `/paywall` con las respuestas
del onboarding. Entrada a la pantalla: ícono de engranaje en el header de `/ninos`.
Verificado: tsc ✓ build ✓ (18 rutas) · recorrido real en navegador a 375px — multi-selección y
selección única confirmadas, editor de rutina probado (cambio de duración, guardado, recarga
completa de página, el valor nuevo persiste correctamente vía localStorage). Sin regresión: las
18 actividades de la semana demo siguen usando el `Etapa`/`Bloque` originales sin tocar.

## Sesión 6, paso 3 — Módulo Niños real (CERRADO)
Primer CRUD real de niños — antes `NINOS` era una constante fija y el Perfil (`/ninos/[id]`) era
de solo lectura. Reconciliación clave de este paso: `Etapa` pasa de 4 a 5 valores (`Infant`,
`Toddler Jr`, `Toddler Sr`, `Preschool`, `Pre-K`) — se dividió Toddler porque pedagógicamente 14 y
32 meses no son lo mismo. Las 18 actividades de la semana demo ya tenían un bloque `Toddler:` en
cada `diferenciacion` (12 bloques, verificado); se duplicó ese texto en `'Toddler Jr'`/
`'Toddler Sr'` (sin perder contenido, sin inventar distinción todavía) para que `Record<Etapa,
string>` siguiera siendo válido sin relajar el tipo. `EtapaAtendida`/`ETAPAS_ATENDIDAS_ORDEN` de
Configuración desaparecen — ambas pantallas comparten `Etapa`/`ETAPAS_ORDEN`. Sofía se reclasificó
de `'Toddler'` a `'Toddler Sr'` (25 meses, consistente con `etapaSugeridaPorEdad`). "Una
experiencia, cuatro niveles" → "cinco niveles" en `/hoy` y `/planeacion/[id]`.
Nuevo en `lib/seed-data.ts`: `Nino` gana `fechaNacimiento` (la edad SIEMPRE se calcula desde
aquí vía `calcularEdadTexto` — el campo `edadTexto` fijo desaparece), `fechaIngreso`, `idiomas[]`,
`intereses[]`, `fortalezas[]`, `preferencias[]`, `formasComunicacion?`, `notasIngresoOriginal?`/
`notasIngresoResumen?` ("Cuéntame sobre este niño" — mismo patrón original/redacción que
`Observacion`), y las entidades aprobadas de la arquitectura v2 `NecesidadNino`/`ApoyoNino` (con
`origen` de 5 valores, hoy solo se ejercita `'maestra'`; la integridad referencial por FK
excluyentes queda para cuando exista Supabase — un `origenReferenciaId?` simple basta mientras no
hay base de datos real detrás). `leerNinos()`/`guardarNinos()` — localStorage, mismo patrón que
`leerProgramaConfig` — reemplazan la constante fija PARA las pantallas del módulo (`/ninos`,
`/ninos/[id]`, `/ninos/nuevo`, `/ninos/[id]/editar`); Hoy/Planeación/Observar/Niños-foco
DELIBERADAMENTE siguen leyendo la semilla fija (`NINOS`) sin regresión — se reconcilian con el
roster real en el paso 5 ("Planeación con o sin niños"), donde de todas formas se reescribe esa
lógica. `Chip`/`SelectorConPersonalizado` se movieron de Configuración a `components/app/shell.tsx`
(compartidos) + nuevo `EtiquetasLibres` (tags libres sin lista sugerida). Nuevo
`components/app/nino-formulario.tsx` (`<NinoFormulario>`) compartido por crear y editar.
Verificado: tsc ✓ build ✓ (19 rutas) · recorrido real en navegador — creación completa de un niño
nuevo (DOB tecleada, edad calculada correctamente vía `.value` del input nativo, etapa sugerida
automática y seleccionable, guardado, aparece en la lista agrupada por etapa correcta), edición
precargada con todos los campos, Perfil de Sofía muestra sus 2 necesidades con su apoyo enlazado
correctamente por `necesidadId`, Hoy y Planeación siguen sin regresión con las 5 etapas.

## Sesión 6, paso 4 — Perfil completo del niño (CERRADO)
Construye la arquitectura v2 aprobada: catálogo de skills + plantillas versionadas + evaluación
inicial/periódica con prellenado y aprobación humana + evaluaciones externas + Plan Individual.
**El usuario confirmó explícitamente que `SKILLS_CATALOG`/`ASSESSMENT_TEMPLATES` son datos DEMO
para probar el mecanismo — el catálogo pedagógico oficial (skills definitivos, rangos, políticas
de evidencia, Core Developmental Profile, tracks) se revisa en una ronda aparte.**

Cambio de fondo en `Skill`: `estado` (3 valores, ambiguo) se separa en `estadoDesarrollo`
(desconocido|en_desarrollo|dominado) + `estadoEvidencia` (no_observado|insuficiente|suficiente|
contradictoria) — corrección explícita del usuario para no confundir "no observado" con "en
desarrollo". `etiquetaSkill()` traduce los dos ejes a una sola etiqueta para la UI; `SkillBadge`
(shell.tsx) y sus 3 consumidores (`/ninos/[id]`, `/ninos-foco`, `/observar`) actualizados. Los 12
skills de los 4 niños semilla se migraron 1:1 (mismo estado visible, ahora en dos campos); se
unificó `tijeras-z` (Zayne) → `tijeras` (mismo skill que Luca, sin motivo real para IDs distintos).

Nuevo en `lib/seed-data.ts`: `SkillCatalogEntry` (dominio, rango de edad en meses, prerrequisitos,
`politicaRevision`, `evidenciaRequerida` + `vecesMinimas?` SOLO si evidenciaRequerida=
consistencia_repetida — nunca una regla universal de "N observaciones", corrección del usuario) —
`SKILLS_CATALOG` con ~24 entradas cubriendo las 5 etapas + track Kindergarten Readiness.
`AssessmentTemplate` (versión INMUTABLE tras el primer uso; `track: null`=CORE obligatorio, con
track=opcional solo si `programs.tracksActivos` lo incluye) + `AssessmentTemplateSkill` — 6
plantillas v1.0 (una CORE por etapa + 1 track para Pre-K). `plantillasAplicables()`,
`generarBorradorEvaluacion()` (prellena con `nino.skills` actual, nunca inventa — si no hay dato
previo queda explícito desconocido/no_observado), `aprobarEvaluacion()` (congela el snapshot y
SOLO ENTONCES sincroniza `nino.skills` — nunca antes, nunca automático), y
`calcularFechaProximaEvaluacion()` (última aprobada, o fecha de ingreso si nunca hubo una, +
frecuencia del programa — regla técnica fija, no configurable). `EvaluacionNino`/
`ResultadoEvaluacion` viven anidados en cada `Nino` (sin store aparte); igual `EvaluacionExterna`/
`HallazgoEvaluacionExterna` y `PlanIndividual`/`MetaIndividual` — todo persiste vía
`leerNinos()`/`guardarNinos()` ya existentes, sin nuevas claves de localStorage.

Pantallas nuevas: `/ninos/[id]/evaluacion/[evalId]` (evalId='nueva' genera el borrador al vuelo;
revisar/editar con chips de desarrollo+evidencia por skill; "Guardar borrador" no toca el perfil
vivo, "Aprobar evaluación" sí — nunca automático, regla del usuario); `/ninos/[id]/evaluacion-
externa/nueva` (ASQ-3/IFSP/IEP/speech/OT/PT + hallazgos puntuales opcionales — **sin adjuntar
archivo, con aviso explícito en pantalla de que el almacenamiento real llega después**, regla del
usuario); `/ninos/[id]/plan-individual` (crear solo por acción explícita — una necesidad NUNCA lo
crea sola; metas con estado por_trabajar/en_progreso/casi/alcanzado, cambiado SIEMPRE a mano).
Perfil (`/ninos/[id]`) gana 3 secciones: Evaluaciones (historial + próxima evaluación visible +
botón generar), Evaluaciones externas, Plan Individual.

Sofía (seed) queda con una evaluación de ingreso aprobada, una evaluación externa con 1 hallazgo,
y un Plan Individual con 1 meta — para que el mecanismo se vea poblado desde el primer vistazo
(32, "nunca se enseña vacía"), no solo en pantallas vacías.

Verificado: tsc ✓ build ✓ (23 rutas) · recorrido real en navegador — evaluación periódica generada
para Sofía (4 skills de la plantilla Toddler Sr, 2 prellenadas correctamente desde su perfil
actual), guardar borrador confirmado que NO toca `nino.skills`, aprobar confirmado que SÍ
sincroniza el perfil vivo (pasó de 2 a 4 skills) y recalcula la próxima evaluación
(2026-05-12 → 2026-12-15), evaluación aprobada anterior se ve correctamente de solo lectura,
evaluación externa y su hallazgo renderizan bien con el aviso de "no se adjunta todavía", Plan
Individual de Sofía editable (cambié una meta a "Alcanzado" a mano) y el de Luca ofrece "Crear"
sin haberse generado solo pese a que Luca no tiene necesidades registradas.

### Sesión 6, paso 4, ronda 2 — experiencia de evaluación con preguntas observables (CERRADO)
El usuario probó la ronda 1 y pidió una capa de experiencia distinta: NO responder directo entre
botones grandes "Desconocido/En desarrollo/Dominado", sino sobre una CONDUCTA OBSERVABLE concreta
— "pregunta observable → respuesta → RAÍZ interpreta → estado_desarrollo + estado_evidencia".
Inspirado en el ENFOQUE de sistemas profesionales de ECE (evaluación auténtica, progresión,
indicadores observables — contenido propio, no copiado). **No cambia la arquitectura aprobada**:
`ResultadoEvaluacion` sigue guardando exactamente `estadoDesarrollo`/`estadoEvidencia`; se agregó
un campo aditivo opcional `respuestaObservableIds?: string[]` para recordar qué respondió la
maestra al reabrir un borrador.
Nuevo en `lib/seed-data.ts`: `PreguntaObservable` (`seleccion_unica` con `OpcionObservable[]`
progresivas que declaran directo su estado — ej. tijeras: 6 opciones de "aún no observado" a
"sigue una línea sencilla"; o `seleccion_multiple` con `UmbralConteo[]` que derivan el estado por
CUÁNTAS opciones se marcaron, ej. reconocimiento de numerales 1-10: 8+=dominado, 4+=en_desarrollo/
suficiente, 1+=en_desarrollo/insuficiente, 0=desconocido). `PREGUNTAS_OBSERVABLES_DEMO` con 5
preguntas (tijeras, juego-cooperativo, conteo-verbal-secuencia, reconocimiento-numerales,
correspondencia-uno-a-uno) — datos DEMO, mismo aviso que `SKILLS_CATALOG`.
Regla del usuario ("no mezclar como si fuera un solo skill"): 'numeros-1-8' se reemplazó en la
plantilla Preschool por 3 skills separados — conteo-verbal-secuencia (secuencia verbal),
reconocimiento-numerales (numerales fuera de orden), correspondencia-uno-a-uno (cantidad) — el
catálogo entry `numeros-1-8` queda sin usar en ninguna plantilla, no se borra (Luca ya tiene un
resultado histórico con ese id).
`/ninos/[id]/evaluacion/[evalId]` reescrita: agrupa resultados por dominio (secciones), cada fila
usa `<FilaResultado>` — si el skill tiene pregunta observable, muestra la pregunta + radios
compactos (`<OpcionRadio>`) o casillas compactas (`<CasillaCompacta>`, grid para selección
múltiple) + una línea discreta "Estado sugerido: X · evidencia Y" con botón "Editar" que revela
los chips directos para corrección manual; si NO tiene pregunta observable (colores, nombre en
esta demo), sigue editándose directo como antes — ambos caminos coexisten honestamente.
Verificado: tsc ✓ build ✓ (23 rutas) · recorrido real en navegador con Luca (44 meses/Preschool) —
secciones por dominio visibles, radio de tijeras cambia el estado sugerido al instante
(Dominado·suficiente al elegir "sigue línea sencilla"), casillas de números derivan correctamente
por conteo (verificado con clicks directos vía DOM: 4 marcados → En desarrollo/suficiente,
coincide exacto con el umbral de `UmbralConteo`), botón Editar revela corrección manual, guardar
borrador persiste `respuestaObservableIds` en localStorage. (Una inconsistencia vista durante
pruebas con clics encadenados rápidos resultó ser un artefacto del automatizador de pruebas, no
del código — se re-verificó limpio con clicks directos sobre el DOM.)

### Sesión 6, paso 4, ronda 2b — 3 casos de prueba más (CERRADO)
El usuario aprobó la dirección de ronda 2 pero pidió 3 casos más antes de declarar la EXPERIENCIA
definitiva: colores, letras mayúsculas, nombre propio — para probar `seleccion_multiple` con lista
abierta, `seleccion_multiple` con grilla completa y `seleccion_unica` como progresión de 8
niveles, respectivamente.

`lib/seed-data.ts`: 3 `PreguntaObservable` nuevas en `PREGUNTAS_OBSERVABLES_DEMO` —
`preg-colores` (11 colores, mismos umbrales de conteo que numerales: 8+dominado/4+suficiente/
1+insuficiente/0 desconocido — con nota de catálogo dejando dicho que "reconoce/señala" vs
"nombra independientemente" son distinciones que la estructura ya soporta separar cuando el
catálogo oficial lo pida, sin construir dos cuestionarios en esta demo), `preg-letras-mayusculas`
(grid A-Z, umbrales 20+/10+/1+/0 — mismo patrón, con la misma nota reservando recitar-secuencia/
minúsculas/letra-sonido para después) y `preg-nombre` (8 opciones progresivas, de "aún no
observado" a "escribe su nombre independientemente", cada una con su estadoDesarrollo/
estadoEvidencia). Letras mayúsculas es un skill NUEVO (`reconocimiento-letras-mayusculas`,
dominio pre_literacy) que NO se agregó al CORE de Preschool — vive en una plantilla de track
nueva (`tpl-preschool-pre-literacy-v1`, track `pre_literacy`, ya existente en `TrackOpcional`) que
solo aparece en la evaluación si el programa activa ese track en Configuración (mismo patrón que
`reconocimiento-letras` con Kindergarten Readiness en Pre-K) — un programa play-based no queda
obligado a evaluarlo.
**Aviso demo-only reforzado por instrucción explícita del usuario**: comentario ampliado arriba de
`PREGUNTAS_OBSERVABLES_DEMO` (todo umbral/mapeo es ilustrativo, ningún instrumento validado, pasa
por revisión pedagógica aparte antes de usarse con familias reales) + eco corto en la definición
de `UmbralConteo` — aplica a cualquier skill nuevo que se agregue después (letras, colores, etc.),
no solo a los 3 de hoy.

Verificado: tsc ✓ · build ✓ (23 rutas) · recorrido real en navegador — activé el track
Pre-literacy en Configuración, generé la evaluación de ingreso de Luca y vi las 6 preguntas juntas
(tijeras, 3 de números, colores, letras, nombre, juego cooperativo) en sus 6 secciones por
dominio. Clicks directos por DOM (mismo método que ronda 2, evita el ruido del automatizador de
pruebas): 4 colores marcados → "En desarrollo · evidencia suficiente" (coincide con el umbral 4);
10 letras marcadas → "En desarrollo · evidencia suficiente" (coincide con el umbral 10); "Copia su
nombre mirando un modelo" → "En desarrollo · evidencia suficiente" (coincide con la opción
mapeada). Guardé el borrador y confirmé en localStorage que las 3 respuestas persistieron
(`respuestaObservableIds`) y que `ResultadoEvaluacion` sigue guardando solo `estadoDesarrollo`/
`estadoEvidencia` — cero cambios a la arquitectura aprobada. Reabrí el borrador y confirmé que las
respuestas marcadas se ven pre-seleccionadas (Rojo/A/"Copia su nombre..." con `aria-pressed=true`,
Naranja/K con `false`). Datos de prueba limpiados de localStorage al terminar.

### Sesión 6, paso 4, ronda 3 — Infant y Toddler con la misma familia visual (CERRADO)
El usuario aprobó la DIRECCIÓN de la experiencia (preguntas observables) vista con Luca y fijó una
regla explícita, con vigencia permanente para todo el catálogo, no solo para esta ronda:

**⚠️ REGLA DEL USUARIO — LA MISMA LÓGICA VISUAL APLICA A TODAS LAS EDADES.** El contenido (las
preguntas) cambia por etapa — Infant tiene preguntas de bebé, Toddler las suyas, Preschool/Pre-K
las suyas — pero la EXPERIENCIA nunca cambia: (1) pregunta observable en lenguaje simple, (2)
radios compactos para respuesta única o casillas/chips compactos para selección múltiple, (3)
progresiones cuando corresponda, (4) "Aún no observado" siempre disponible como primera opción,
(5) `estadoDesarrollo`/`estadoEvidencia` son un RESULTADO SECUNDARIO que RAÍZ deriva, nunca la
forma PRINCIPAL de responder — el selector grande "Desconocido/En desarrollo/Dominado" +
"No observado/Insuficiente/Suficiente/Contradictoria" NO vuelve a ser la interacción primaria,
tampoco para bebés. Ese selector grande sigue existiendo solo como corrección manual secundaria
detrás de "Editar" (ya lo era desde ronda 2) para cuando la maestra necesita ajustar a mano lo que
RAÍZ sugirió. Aplica hacia adelante a cualquier skill/etapa que se agregue después.

Para probarlo sin construir el catálogo completo, se agregaron 8 `PreguntaObservable` nuevas en
`lib/seed-data.ts` cubriendo los 4 skills CORE de Infant (gateo, pinza, balbuceo-comunicativo,
apego-seguro) y los 4 CORE de Toddler Sr (palabras, apilar, sigue-instrucciones-simples,
autonomia-alimentacion) — mismo patrón `seleccion_unica` progresiva que tijeras/nombre, sin
selección múltiple en este grupo porque ninguna de estas conductas se presta a un conteo (no
aplica "cuántas veces gatea cruzado"). Contenido DEMO, mismo aviso que el resto del catálogo.

Verificado: tsc ✓ · build ✓ (23 rutas) · recorrido real en navegador — evaluación periódica de
Mateo (Infant, 11 meses) muestra las 4 preguntas nuevas en sus 4 dominios, con "Gateo cruzado"
sugiriendo Dominado (coincide con su skill ya registrado) y "Balbuceo comunicativo"/"Apego seguro"
en Desconocido (sin dato previo, como corresponde); evaluación periódica de Sofía (Toddler Sr, 25
meses) muestra las 4 suyas, con "Apila 4+ bloques" sugiriendo Dominado y "Vocabulario de 2
palabras" en En desarrollo — ambas coinciden exacto con los skills que Mateo/Sofía ya tenían en su
perfil. Cero botones grandes visibles como interacción principal en ninguna de las dos. localStorage
limpio (no se guardó borrador, solo se generó la vista).

### Catálogo Pedagógico Oficial RAÍZ (FASE FUTURA — no construida, decisión documentada ahora)
El usuario dejó fijado, antes de cerrar esta experiencia, cuándo y cómo se construye el contenido
REAL (no la UX, que ya queda aprobada): todo lo que existe hoy en `SKILLS_CATALOG`,
`ASSESSMENT_TEMPLATES`, `ASSESSMENT_TEMPLATE_SKILLS` y `PREGUNTAS_OBSERVABLES_DEMO` — skills,
preguntas, progresiones, rangos de edad, prerrequisitos y criterios de evidencia — es DEMO. Antes
de usar RAÍZ con evaluaciones reales de clientes, hay una fase dedicada y aparte, **"Catálogo
Pedagógico Oficial RAÍZ"**, donde se construyen/revisan las evaluaciones definitivas por
edad/etapa. Ese catálogo debe quedar terminado, revisado y VERSIONADO antes de evaluaciones
reales. Regla dura para la IA una vez conectada (paso 9, IA real): la IA nunca inventa una
evaluación distinta cada vez — usa exclusivamente las plantillas oficiales versionadas, y su rol
es prellenar, interpretar evidencia, sugerir qué falta observar, preparar revisiones periódicas, y
conectar resultados con la planeación — nunca generar contenido pedagógico nuevo por su cuenta.

**Decisión del usuario**: con Infant + Toddler confirmados con la misma UX, la EXPERIENCIA de
evaluación por preguntas observables queda APROBADA Y CERRADA por ahora — el contenido pedagógico
(preguntas, opciones, umbrales) sigue DEMO hasta la fase de Catálogo Pedagógico Oficial. Sesión 6
paso 4 queda cerrado por completo; siguiente paso oficial: paso 5, Planeación con/sin niños.

## Sesión 6, paso 5 — Planeación conectada con Módulo Niños (CERRADO)
El usuario fue explícito: la Planeación YA está construida y APROBADA — este paso es CONECTARLA
con los perfiles reales del niño, no reconstruirla ni crear un segundo sistema ("Planeación con
niños" vs "sin niños"). Sigue siendo UNA sola planeación; Capa A (diferenciación por etapa) sigue
siempre visible y no depende de ningún niño — una maestra que solo quiere que RAÍZ le planee no
necesita registrar niños ni ve ningún mensaje pidiéndoselo.

**Decisiones técnicas (negociadas con el usuario antes de ejecutar, 4 ajustes sobre el plan
inicial):**
1. **La personalización pertenece a la SEMANA, no a un ajuste global.** `PlaneacionSemanal` gana
   `personalizacionActiva: boolean` + `personalizacionActualizadaEn?: fecha` — una maestra puede
   personalizar unas semanas y no otras. Sin niños registrados, el control ni aparece.
2. **Relevancia por CONTEXTO, no por igualar categoría de necesidad con dominio de actividad**
   (corrección explícita del usuario: esa igualdad era demasiado limitada — una necesidad
   sensorial sigue siendo relevante en una actividad de motricidad fina). Nuevo tipo
   `ContextoActividad` — tags controlados y fijos (`contacto_sensorial`, `motricidad_fina`,
   `tijeras`, `pega`, `movimiento`, `respuesta_verbal`, `sentarse_quieto`,
   `participacion_grupal`), NUNCA texto libre. `Actividad.contextos?` + `ApoyoNino.
   contextosRelevantes?` — una adaptación se sugiere cuando hay intersección real entre ambos.
3. **Niño foco por SKILL real de la actividad, no por dominio** (misma corrección: "tijeras en
   desarrollo" no debe activar foco en cualquier actividad de motricidad fina, solo en las que de
   verdad trabajan tijeras). Nuevo `Actividad.skillsRelacionados?: string[]` (IDs de
   `SKILLS_CATALOG`). Prioridad 1 = meta activa de Plan Individual sobre ese skill; prioridad 2 =
   skill en desarrollo; prioridad 3 = sin evidencia suficiente todavía (oportunidad real de
   observar ahí); dominio nunca es criterio de entrada por sí solo. Tope de 2 focos automáticos
   por actividad.
   ⚠️ **Bug real atrapado en pruebas y corregido antes de cerrar**: sin filtrar por el rango de
   edad del catálogo (`SkillCatalogEntry.rangoEdadMesesMin/Max`), el cálculo sugirió a Mateo (11
   meses, Infant) como foco de "tijeras" (36-60m) solo porque no tenía ese skill registrado — un
   caso exactamente del tipo que el usuario pidió evitar. Corregido: prioridad 2/3 ahora se salta
   cualquier skill fuera del rango de edad real del niño; la meta de Plan Individual (prioridad 1,
   decisión explícita de la maestra) no se filtra por edad.
4. **Sugerencia GUARDADA, no recalculada en vivo** (para que una planeación ya usada no cambie
   sola si el perfil del niño cambia después). Como Planeación era 100% estática hasta ahora, se
   agregó `leerPlaneaciones()/guardarPlaneaciones()/guardarUnaPlaneacion()` en localStorage —
   mismo patrón exacto que `leerNinos()`/`leerProgramaConfig()`. `calcularPersonalizacionSemana()`
   corre UNA vez (al prender el interruptor o al pulsar "Actualizar personalización" en
   `/semana`) y GUARDA el resultado dentro de `dias[].actividades[]`, marcado
   `origenCalculo: 'raiz_sugerido'` (vs `'maestra_manual'` o sin marcar = contenido ya escrito a
   mano, que SIEMPRE se conserva intacto — el cálculo solo agrega niños que no estuvieran ya
   cubiertos en esa actividad, nunca duplica). Abrir la pantalla después solo LEE lo guardado.
   `AdaptacionIndividual` gana `childSupportId?`; `NinoFocoActividad` gana `individualGoalId?` —
   ambas para trazar el origen real cuando `origenCalculo='raiz_sugerido'`.
5. **Datos hardcodeados = seed, no lógica definitiva** — se dejó explícito en comentarios que
   Mateo/Luca/Sofía/Zayne y sus adaptaciones/focos ya escritos a mano son contenido DEMO para
   probar el recorrido; con el roster real (`leerNinos()`) conectado en todas las pantallas de
   Planeación, una cuenta sin niños no ve ningún nombre demo, y una cuenta con sus propios niños
   ve solo los suyos — no hay ninguna ruta que siga citando `NINOS` (la constante estática) salvo
   `/ninos-foco` (mecanismo aparte, basado en `Nino.metaActiva`, fuera del alcance de este paso —
   queda anotado como pendiente menor, no bloqueante).

**Archivos tocados** (ninguno reescrito desde cero): `lib/seed-data.ts` (tipos nuevos +
`calcularPersonalizacionSemana`/`apoyosRelevantesParaActividad`/`candidatoFocoParaActividad` +
persistencia de planeaciones + `actividadPorId`/`actividadActualHoy`/`diaPorFecha` ahora aceptan
un `plan` en vez de leer la constante fija siempre); `app/semana/page.tsx` (interruptor +
"Actualizar personalización"); `app/planeacion/page.tsx` (lee la semana persistida); `app/
planeacion/[id]/page.tsx` y `app/hoy/page.tsx` (Capas B/C detrás de `plan.personalizacionActiva`,
`ninoPorId` sobre el roster real, badge "sugerido por RAÍZ" en lo calculado).

**Verificado**: tsc ✓ · build ✓ (23 rutas) · recorrido real en navegador, exactamente la prueba
que pidió el usuario:
- **Personalización OFF** en "Collage del cuerpo" (la actividad de referencia del usuario) → solo
  Capa A + "Qué observar" general, cero secciones individuales.
- **Personalización ON** en la misma actividad → los 2 casos ya escritos a mano (adaptación de
  Sofía/Mateo, foco de Luca/Zayne) aparecen intactos, sin duplicar y sin el badge "sugerido por
  RAÍZ" (correcto: son contenido de la maestra).
- **Caso positivo nuevo (Capa C)**: "Centro de matemáticas: contar partes del cuerpo" (viernes,
  sin Luca hardcodeado ahí) — al calcular, Luca aparece agregado solo, con el badge "sugerido por
  RAÍZ", derivado de que no tiene evidencia de "Correspondencia uno a uno" y sí asiste los
  viernes; Zayne (ya manual) se conserva sin tocar.
- **Caso positivo nuevo (Capa B)**: "Cuento: De pies a cabeza" (miércoles, sin nadie escrito a
  mano) — al calcular, Mateo aparece agregado solo desde su apoyo real (`apoyo-mateo-piso`,
  contexto `movimiento`/`sentarse_quieto`), con el badge "sugerido por RAÍZ".
- **Caso negativo**: "Circuito motor" (lunes, sin tags) con personalización ON → cero secciones
  individuales, ningún ruido.
- `/hoy` refleja exactamente lo mismo que `/planeacion/[id]` para la actividad del día, en ambos
  estados del interruptor.
- Datos de prueba limpiados de localStorage al terminar.

**Pendiente/decisión del usuario**: ninguna — el usuario dijo "si no requieren rehacer la
arquitectura aprobada, puedes proceder" y los 4 ajustes eran aditivos. Queda como nota menor no
bloqueante: `/ninos-foco` sigue sobre `Nino.metaActiva` sin conectar al mecanismo nuevo — se puede
abordar si el usuario lo pide. Solo la Semana 3 tiene contenido tagueado con `contextos`/
`skillsRelacionados`(Collage del cuerpo, Cuento De pies a cabeza, Centro de matemáticas); el resto
de actividades sin tags simplemente nunca genera candidatos automáticos — taguear el resto del
catálogo demo es progresivo, no bloqueante.

## Sesión 6, paso 6 — Observaciones como módulo independiente (CERRADO)
El usuario fue explícito: REUTILIZAR el sistema ya aprobado (`Observacion`/`ObservacionSkill`,
dirigida/espontánea, nota original vs. redacción profesional, 0/1/varios skills, aprobación de la
maestra) — nada de un segundo sistema. El hueco real (confirmado leyendo `/observar` antes de
tocar código): las observaciones NUNCA se guardaban — vivían en estado local del componente y se
perdían al salir; tampoco existía historial en ningún lado ni conexión con actividad/niño foco
desde la entrada.

**5 reglas explícitas del usuario, todas implementadas:**
1. Guardar una observación NUNCA toca `Nino.skills` — verificado en vivo: tras las pruebas,
   `localStorage['raiz_ninos']` seguía sin existir (todo el roster sigue viniendo de
   `NINOS_SEMILLA`), prueba de que ningún camino de `/observar` llama a `guardarNinos`. La
   pantalla "listo" ya no dice "esto ajusta tu próxima planeación" — dice "Nueva evidencia para
   revisar 'X' — tú decides si actualiza su perfil."
2. Una sugerencia de la observación espontánea arranca en `estado: 'sugerido'` (nunca
   pre-aceptada) — se rediseñó la pantalla de sugerencias con botones explícitos Aceptar/Rechazar
   por área; lo que la maestra no toca se GUARDA como `'sugerido'` (verificado en localStorage).
3. "No observado" en una micro-observación (`OpcionRapida.esEvidencia: false`) nunca crea una fila
   de `ObservacionSkill` — la observación se guarda igual (oportunidad registrada), cero evidencia.
4. Datos seed (`OBSERVACIONES_SEMILLA`/`OBSERVACION_SKILLS_SEMILLA`, 4 registros) documentados
   explícitamente como DEMO — mismo patrón de respaldo que `leerNinos()`: solo aparecen cuando
   localStorage está vacío, nunca se mezclan con lo real una vez que la maestra empieza a guardar.
5. `Observacion.autorId` (constante `STAFF_ACTUAL_ID` por ahora, una sola maestra) — reservado
   para cuando exista auth real con varias educadoras, sin mostrarlo todavía en la UI.

**Arquitectura**: `leerObservaciones()/guardarObservaciones()` +
`leerObservacionSkills()/guardarObservacionSkills()` (localStorage, mismo patrón que Niños/
Planeación) + `agregarObservacion()` (append, nunca sobrescribe). Un solo formulario (`/observar`,
envuelto en `Suspense` por `useSearchParams`) con 3 puntos de entrada vía query params —
`ninoId` (salta a "¿qué observaste?"), `+skillId` (+`actividadId`) (entra directo al camino
dirigido con el contexto ya enlazado) — cero lógica duplicada; Hoy/Actividad/Perfil/Observaciones
solo arman el link. Nuevo componente compartido `<FilaObservacion>` (shell.tsx) — MISMA fila en
`/observaciones` (todas) y en el perfil del niño (filtrada), regla del usuario: "no es otro
dataset". Nueva ruta `/observaciones` (CTA + filtros simples de niño/período + empty state sin
niños) y `/observaciones/[id]` (nota original, redacción profesional si existe, skills con su
estado real, evidencia — solo nombre de archivo, nunca URL temporal — y contexto de actividad si
aplica). Perfil del niño gana la sección "Observaciones". Cierre del ciclo: `marcarNinoFocoObservado()`
localiza la actividad en `leerPlaneaciones()` y marca ese niño foco `estadoFoco:'observado'` +
`observationId` cuando la observación nace de él — reutiliza `guardarUnaPlaneacion()` del paso 5,
sin tocar ningún otro campo. `NAV` de `shell.tsx` gana un 4º tab ("Observar").

**Verificado**: tsc ✓ · build ✓ (25 rutas) · los 8 recorridos exactos que pidió el usuario,
probados en navegador con localStorage limpio:
1. Observaciones → nueva → Luca → espontánea → acepté "Conteo 6–8" y dejé "Resolución de
   problemas" sin tocar → persistido con `estado: 'aceptado'` y `estado: 'sugerido'` respectivamente.
2. Observaciones → nueva → Zayne → espontánea → "Guardar sin clasificar" → persistido con cero
   filas de `ObservacionSkill`.
3. Perfil de Luca → "Nueva observación" → `href="/observar?ninoId=luca"` → entra directo a "Sobre
   Luca" sin pasar por la selección de niño.
4. Actividad "Collage del cuerpo" → niño foco Luca (tijeras) → botón de observar con
   `ninoId+actividadId+skillId` → entra directo a la micro-observación de tijeras → "Línea recta
   independiente" → la observación queda con `actividadId: 'mar-principal'` Y el `ninoFoco` de
   Luca en esa actividad queda `estadoFoco: 'observado'` + `observationId` enlazado (Zayne, sin
   tocar, sigue `pendiente`).
5. `/observaciones` (historial general) → aparecen las 3 observaciones nuevas + las 4 semilla,
   ordenadas por fecha.
6. Perfil de Luca → "3 en el historial" (exactamente sus 3: 1 semilla + 2 nuevas) — misma
   información, filtrada.
7. `location.reload()` → todo sigue ahí.
8. `localStorage['raiz_ninos']` nunca se creó durante toda la prueba → confirma que
   `Nino.skills` de ningún niño cambió por registrar observaciones.
Revisión visual a 375px de `/observaciones` (pantalla nueva de tipo "módulo principal" —
secundaria en el sentido de la Regla de Oro 7, sin revisor-visual formal, solo medición): CTA
clara, filtros por niño/período, filas con badge de origen y chips de skill (incluido "sin
revisar" para sugeridos pendientes) — consistente con el resto del kit.

**Pendiente/nota conocida**: el empty state "sin niños" de `/observaciones` y `/observar` no se
pudo verificar visualmente en este entorno — `leerNinos()` cae a `NINOS_SEMILLA` incluso si se
fuerza un array vacío en localStorage (mismo comportamiento ya documentado en rondas anteriores,
no es un bug nuevo de este paso); el código del empty state es correcto y se activará solo cuando
exista una cuenta real sin roster (paso 8, Supabase). `/ninos-foco` (basado en `Nino.metaActiva`)
sigue sin conectarse al nuevo mecanismo de observación con contexto — nota menor ya señalada en
el cierre del paso 5, no bloqueante.

### Sesión 6, paso 6b — Redacción profesional simulada, anonimización y aclaraciones (CERRADO)
El usuario pidió mejorar el recorrido de Observaciones (sin tocar el motor ya aprobado): que RAÍZ
ayude a convertir una nota rápida y coloquial en una observación profesional y objetiva, antes de
analizar skills. Flujo nuevo: escribir/hablar → RAÍZ conserva `notaOriginal` → **"RAÍZ organizó tu
observación"** (nota original + redacción sugerida) → maestra usa/edita/mantiene → RAÍZ analiza
áreas SOBRE la redacción confirmada → aceptar/rechazar/agregar → evidencia → guardar.

**4 precisiones del usuario, todas incorporadas:**
1. "Mantener mi nota" NUNCA copia `notaOriginal` a `redaccionProfesional` — la deja `undefined`
   (pendiente) en vez de arriesgar una nota subjetiva en un reporte futuro.
2. La ambigüedad no siempre bloquea: si ya hay suficientes hechos objetivos, RAÍZ redacta con lo
   que tiene y ofrece la aclaración como OPCIONAL ("¿es relevante? o se excluye") — nunca obliga a
   responder para poder guardar.
3. La entidad es `Evidencia` (`tipo: TipoEvidencia` — hoy solo `foto` real; `trabajo_nino`/
   `audio`/`video`/`documento` reservados sin construirse), no "foto" — `Observacion.
   evidenciaArchivoNombre` se reemplazó por `Observacion.evidencia?: Evidencia`.
4. `anonimizarNombresDeOtros()` vive en `lib/seed-data.ts` como función standalone (recibe
   `ninos`, no acoplada a `/observar`) para poder reutilizarse después en reportes/evaluaciones
   narrativas/My Learning Journey — no se construyó esa reutilización todavía, solo se evitó el
   acople. Sin género estructurado, siempre usa "un compañero" (nunca inventa género).

**Nuevo en `lib/seed-data.ts`** (todo simulación local con reglas controladas — NUNCA IA real,
mismo patrón que `analizarNotaSimulado`): `generarRedaccionProfesionalSimulada()` — anonimiza,
detecta hechos observables por patrón (`detectarHechos`), EXCLUYE por completo etiquetas
subjetivas (`ETIQUETAS_SUBJETIVAS_DEMO`: grosero, malcriado, terco, agresivo...) y generalizaciones
sin instancia concreta (`GENERALIZACIONES_SIN_INSTANCIA_DEMO`: "grita mucho", "siempre...") —
nunca las reformula, las omite — y ofrece aclaración opcional para frases ambiguas de conflicto
(`FRASES_AMBIGUAS_DEMO`) sin inventar el verbo si la maestra no lo confirma. Agrupa los hechos en
oraciones de hasta 3 (`unirHechosEnParrafo`) en vez de una sola oración larga con comas.
`generarRedaccionMicroObservacion()` — plantilla de una frase para el camino rápido de opciones
(regla del usuario: "no hace falta un proceso largo cuando la opción ya es objetiva"), con vista
previa en vivo ("RAÍZ escribirá: …") antes de guardar. `actualizarEstadoObservacionSkill()` —
Aceptar/Rechazar un skill `sugerido` desde una observación YA guardada. Nuevo patrón `colores` en
`CATALOGO_SUGERENCIAS_DEMO` (faltaba pese a que el catálogo de skills ya lo tenía).

**`app/observar/page.tsx`**: nuevo paso `'redaccion'` ("RAÍZ organizó tu observación") compartido
por el camino dirigido de texto libre y el espontáneo (la micro-observación de opciones rápidas
NO pasa por aquí — genera su redacción sola, sin frenar la rapidez). Acciones: ✓ Usar esta
redacción / ✎ Editar (revela textarea) / ↩ Mantener mi nota. El análisis de skills corre sobre
`redaccionConfirmada ?? notaEnRevision` — nunca sobre juicios ya descartados. `<TogleEscribirHablar>`
y `<BloqueEvidencia>` extraídos como componentes locales reutilizados en los 3 puntos de entrada de
texto libre (antes solo existían en la espontánea). "Hablar" sigue deshabilitado, sin simular
transcripción falsa.

**`app/observaciones/[id]/page.tsx`**: la redacción profesional (si existe) es el bloque
PRINCIPAL, con "Ver nota original" para revisar exactamente lo escrito/dictado; skills en estado
`sugerido` ganan botones Aceptar/Rechazar directo ahí. `FilaObservacion` (shell.tsx) también
prioriza la redacción sobre la nota cruda en el resumen del historial.

**Verificado**: tsc ✓ · build ✓ (25 rutas) · prueba en vivo EXACTA con la nota de validación del
usuario ("mateo jugo con bloques y se los metio a la boca despues hizo una pila con 3 bloques,
conto 1 2 3 al hacerlo y dijo amarillo, despues se fue a jugar con luca y se pelearon, mateo es
grosero y grita mucho") — confirmado punto por punto:
1. `notaOriginal` quedó exactamente igual (con los errores de tipeo).
2. "Luca" no aparece en la redacción — quedó "un compañero".
3. "grosero" desapareció, listado en "No incluimos: … (juicio, no hecho observable)".
4. "grita mucho" no se convirtió en nada más específico — excluido igual, con el motivo real
   ("generalización sin un momento concreto").
5. "se pelearon" no generó ninguna acción inventada — excluido con aclaración OPCIONAL ofrecida
   (Gritó/Empujó/Mordió/Quitó un objeto/Lloró + "No es necesario").
6. Los hechos claros quedaron organizados en 2-3 oraciones cortas y coherentes.
7. Elegí "Gritó" en la aclaración → se regeneró incluyendo "Gritó durante una interacción con un
   compañero." y lo quitó de la lista de excluidos.
8. Al analizar, aparecieron 5 áreas (Conteo 6–8, Vocabulario, Reconoce colores, Interacción con
   pares, Regulación emocional) — todas en `sugerido`, ninguna auto-aceptada.
9. Acepté 2, rechacé 1, agregué evidencia (`silueta-mateo.jpg`) y guardé.
10. El detalle mostró la observación profesional primero, con "Ver nota original" funcionando, los
    3 estados de skill correctos, y pude Aceptar "Interacción con pares" directo desde ahí — sin
    tocar `raiz_ninos` (confirmado: la clave nunca se creó en localStorage durante toda la prueba).
Sin regresión verificada en la micro-observación de tijeras (sigue guardando directo, ahora con
redacción automática) y en el historial/perfil (siguen mostrando lo mismo, con la redacción como
resumen). Datos de prueba limpiados de localStorage al terminar.

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
