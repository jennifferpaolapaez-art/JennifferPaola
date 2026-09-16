'use client';

// Landing de RAIZ — compuesta desde el KIT CANÓNICO (plantillas-codigo/landing/).
// Copy trazado a docs/copy/landing.md ← FICHA-AVATAR.md. Tokens en components/landing/tokens.css
// ← FICHA-ARTE.md. Estructura de 10 secciones inmutable (19-PAGINA-DE-VENTAS.md).
// v2 — elevación visual pedida por el usuario (dirección de arte, riqueza de color,
// demo real del producto) tras rechazar la v1. Ver ESTADO.md "Sesión 3 — revisión v2".

import { useState, type CSSProperties, type ReactNode } from 'react';
import { Clock, Brain, Users, ImageOff } from 'lucide-react';
import { Hero } from '@/components/landing/Hero';
import { Problema } from '@/components/landing/Problema';
import { Agitacion } from '@/components/landing/Agitacion';
import { Solucion } from '@/components/landing/Solucion';
import { AppPorDentro } from '@/components/landing/AppPorDentro';
import { Oferta } from '@/components/landing/Oferta';
import { Garantia } from '@/components/landing/Garantia';
import { Faq } from '@/components/landing/Faq';
import { CtaFinal } from '@/components/landing/CtaFinal';
import { FooterLegal } from '@/components/landing/FooterLegal';
import { StickyCtaMobile } from '@/components/landing/ui';

// Modelo 2 (onboarding-first, decidido en Sesión 1 con 02C): el CTA lleva a
// /onboarding, nunca al checkout desde el hero.
const CTA_HREF = '/onboarding';
const CTA_LABEL = 'Crear mi primera semana gratis';

/** Envuelve una sección con un fondo propio (riqueza de color pedida por el usuario:
 * cada sección tiene identidad, sin volverse arcoíris — max 3 tintes en toda la página).
 * Pinta un color REAL (no solo redefine variables) para que funcione tanto sobre
 * secciones 'base' (transparentes) como 'elevada' (que pintan --surface encima). */
function Tint({ bg, surface, children }: { bg: string; surface: string; children: ReactNode }) {
  return (
    <div style={{ '--bg': bg, '--surface': surface, background: 'var(--bg)' } as CSSProperties}>
      {children}
    </div>
  );
}

/** Fix del revisor (ronda 2, defecto #1): CtaFinal invierte a fondo oscuro (--text-primary)
 * pero el acento [acento]/CtaButton seguían usando --accent (Deep Teal), casi invisible
 * sobre ese mismo oscuro (~1.6:1). Butter Yellow es el acento luminoso de la ficha para
 * momentos "aha" — aquí se usa SOLO en este bloque, vía override local de --accent. */

export default function LandingRaiz() {
  // Fix revisor-visual (ronda 5): Hero ocultaba la imagen rota (hueco silencioso) mientras
  // AppPorDentro caía a su placeholder honesto — patrón inconsistente entre ambos. Ahora Hero
  // hace lo mismo: si /mockups/hero.png falla, se pasa visual=undefined y el propio componente
  // muestra su placeholder honesto ya existente (cámara + sugerencia), no un hueco vacío.
  const [heroVisualRoto, setHeroVisualRoto] = useState(false);

  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)]">
      {/* 1. HERO */}
      <Hero
        appName=""
        logo={<img src="/brand/raiz-logo.svg" alt="Raíz" className="h-8 w-auto md:h-9" />}
        loginHref="/entrar"
        h1Marked="Deja de cargar a todos tus niños [acento]en la cabeza[/acento]"
        subtitleMarked="La Memoria del Salón conecta lo que sabes de cada niño con tu planeación."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        socialProof={
          <span className="inline-flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--accent)_18%,transparent)] bg-[color-mix(in_oklab,var(--accent)_6%,transparent)] px-4 py-2 text-[13px] font-medium text-[var(--text-primary)]">
            <span aria-hidden="true" className="inline-block size-[7px] rounded-full bg-[var(--accent-2)]" />
            Creada por el equipo de Creciendo Bilingüe, desde salones reales de primera infancia.
          </span>
        }
        visualPlaceholderSugerencia="captura de la pantalla Hoy con la diferenciación por edad ya generada"
        visual={
          heroVisualRoto ? undefined : (
            <img
              src="/mockups/hero.png"
              alt="Pantalla Hoy de RAIZ: la actividad Collage del cuerpo adaptada a Infant, Toddler, Preschool y Pre-K, con el foco individual de Luca en tijeras y Zayne en números, y los materiales ya disponibles en el Centro de Ciencias."
              onError={() => setHeroVisualRoto(true)}
              className="h-auto w-full"
            />
          )
        }
      />

      {/* 2. PROBLEMA + 3. AGITACIÓN — un solo movimiento visual, tinte blush coral suave */}
      <Tint bg="#FDF4F1" surface="#FAEBE5">
        <Problema
          titulo="¿Te suena?"
          preguntas={[
            {
              icon: Clock,
              textoMarked: '¿Terminas planeando cuando ya deberías haber cerrado el día?',
              tint: 'coral',
            },
            {
              icon: Brain,
              textoMarked: '¿Sabes lo que necesita cada niño, pero no puedes tenerlo todo en la cabeza?',
              tint: 'coral',
            },
            {
              icon: Users,
              textoMarked: '¿Una actividad termina convertida en cuatro versiones distintas?',
              tint: 'coral',
            },
            {
              icon: ImageOff,
              textoMarked: '¿Cuando llega el reporte ya intentas recordar qué pasó hace semanas?',
              tint: 'coral',
            },
          ]}
        />
        <Agitacion
          frases={[
            'Cada semana pierdes horas de tu domingo reconstruyendo lo que ya sabías de memoria.',
            'En seis meses eso suma [acento]decenas de horas[/acento] que no vuelven — y ningún niño recibe más seguimiento por eso.',
            'Pinterest, TPT y ChatGPT te dan actividades sueltas: [b]ninguno recuerda a tu grupo[/b].',
          ]}
          contraste={{
            labelHoy: 'Hoy',
            hoy: 'Reconstruyes cada semana desde cero, con seis pestañas abiertas.',
            labelFuturo: 'En 6 meses, si nada cambia',
            futuro: 'El mismo domingo perdido — con seis meses menos.',
          }}
        />
      </Tint>

      {/* 4. SOLUCIÓN — el ciclo RAÍZ (conoce → planea → observa → avanza), tinte sage pálido */}
      <Tint bg="#EFF2E8" surface="#F5F7EF">
        <Solucion
          tituloMarked="Tu semana, [acento]adaptada a cada niño[/acento] antes de escribirla"
          mecanismo="la Memoria del Salón"
          bigIdeaMarked="No te falta dedicación — te falta una herramienta que recuerde. [b]La Memoria del Salón[/b] conecta lo que sabes de cada niño con lo que haces mañana."
          pasos={[
            { titulo: 'Conoce', detalle: 'Perfil, edades y habilidades de tu grupo, una sola vez.', tint: 'teal' },
            { titulo: 'Planea', detalle: 'Cruza tu tema semanal con lo que cada niño necesita.', tint: 'butter' },
            { titulo: 'Observa', detalle: 'Notas y evidencia del día, en segundos.', tint: 'coral' },
            { titulo: 'Avanza', detalle: 'Cada observación mejora tu próxima planeación.', tint: 'sage' },
          ]}
          antesDespues={{
            labelAntes: 'Antes',
            antes: 'Una planeación genérica que adaptas tú sola, niño por niño.',
            labelDespues: 'Con RAIZ',
            despues: 'Una semana que ya trae la diferenciación y el foco de cada niño.',
          }}
          foto={{
            src: '/fotos/educadora-hero.png',
            alt: 'Educadora leyendo un cuento a un grupo de niños pequeños de distintas edades, sentados en el piso de un salón cálido y luminoso.',
          }}
        />
      </Tint>

      {/* 5. LA APP POR DENTRO — demo real (mockups del sistema, no captura de producción
          todavía), tinte butter cálido pendiente en ESTADO.md hasta tener screenshots reales */}
      <Tint bg="#FBF2D9" surface="#FDF7E7">
        <AppPorDentro
          tituloMarked="Tu salón, [acento]siempre a la vista[/acento]"
          frames={[
            {
              src: '/mockups/frame-hoy.png',
              label: 'Una experiencia. Cuatro niveles.',
              nombrePantalla: 'Hoy',
            },
            {
              src: '/mockups/frame-foco.png',
              label: 'Recuerda qué necesita cada niño.',
              nombrePantalla: 'Niños foco',
            },
            {
              src: '/mockups/frame-semana.png',
              label: 'Lo de hoy mejora lo que planeas mañana.',
              nombrePantalla: 'Planeación semanal',
            },
            {
              src: '/mockups/frame-perfil.png',
              label: 'Conoce a cada niño, no solo a su grupo.',
              nombrePantalla: 'Perfil del niño',
            },
          ]}
          ctaLabel={CTA_LABEL}
          ctaHref={CTA_HREF}
        />
      </Tint>

      {/* 6. OFERTA — anual primero, trial 7 días en ambas */}
      <Oferta
        tituloMarked="Empieza gratis. Sigue por [acento]menos de $0.56 al día[/acento]"
        trialDias={7}
        stack={{
          lineas: [
            { resultado: 'RAIZ Base — planeación semanal diferenciada (12 meses)', valor: '$240' },
            { resultado: 'Perfil y ruta de habilidades de cada niño', valor: '$60' },
            { resultado: 'Reformulación profesional de observaciones', valor: '$40' },
          ],
          totalTachado: '$340',
          nota: 'Hoy: $16.66/mes (se cobra $199.90/año)',
        }}
        garantiaNota="Respaldado por la Garantía de tu Primera Semana — 15 días"
        anual={{
          nombre: 'Anual',
          badge: 'MEJOR VALOR',
          precioMes: '$16.66',
          totalAnual: 'Se cobra $199.90/año',
          ahorro: '2 meses gratis (~17%)',
          descomposicionDia: 'menos de $0.56 al día',
          ctaLabel: CTA_LABEL,
          ctaHref: CTA_HREF,
          features: [
            'Planeación semanal diferenciada por edad',
            'Perfil y ruta de habilidades de cada niño',
            'Observaciones reformuladas profesionalmente',
            'Historial completo del salón',
          ],
        }}
        mensual={{
          nombre: 'Mensual',
          precioMes: '$19.99',
          ctaLabel: CTA_LABEL,
          ctaHref: CTA_HREF,
          features: [
            'Planeación semanal diferenciada por edad',
            'Perfil y ruta de habilidades de cada niño',
            'Observaciones reformuladas profesionalmente',
            'Cancelas cuando quieras',
          ],
        }}
      />

      {/* 7. GARANTÍA — 15 días, siempre > los 7 de prueba (FICHA-MERCADO §4) */}
      <Garantia
        nombre="la Garantía de tu Primera Semana"
        condicionMarked="Si en tus primeros 15 días RAIZ no te entrega una semana [b]realmente diferenciada para tu grupo[/b], escribes un correo y te devolvemos todo. Sin preguntas."
        pisoLegal="Respaldada por la garantía Hotmart de 15 días"
      />

      {/* 8. FAQ */}
      <Faq
        items={[
          {
            pregunta: '¿Necesito tiempo para configurar todo esto?',
            respuestaMarked:
              'No: armas tu primera semana en tu primera sesión. RAIZ [b]devuelve valor de inmediato[/b], no te pide configurar todo antes de ver algo.',
          },
          {
            pregunta: '¿Por qué no simplemente usar ChatGPT?',
            respuestaMarked:
              'ChatGPT genera una actividad suelta. RAIZ conoce a tu grupo, tus niños, sus habilidades y tu inventario real — y lo usa en cada planeación.',
          },
          {
            pregunta: 'Ya tengo un currículo, ¿tengo que dejarlo?',
            respuestaMarked:
              'No. RAIZ mejora y adapta el currículo que ya usas, no te obliga a reemplazarlo.',
          },
          {
            pregunta: '¿La IA decide por mí o evalúa a mis niños?',
            respuestaMarked:
              'Nunca. RAIZ sugiere y tú confirmas — [b]ninguna meta se marca como lograda[/b] sin tu aprobación.',
          },
          {
            pregunta: '¿Es caro?',
            respuestaMarked:
              'Menos de $1 al día. Cuesta menos que una hoja de TPT a la semana, y trabaja para ti todos los días.',
          },
        ]}
      />

      {/* 9. CTA FINAL EMOCIONAL */}
      <CtaFinal
        h2Marked="Cierra tu día [acento]sabiendo qué sigue mañana[/acento]"
        futurePacingMarked="Te sientas, RAIZ ya sabe qué necesita cada niño, y tu semana está lista en minutos."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        recap="7 días de prueba gratis · Garantía de 15 días al pagar"
        psMarked="PS: RAIZ convierte lo que sabes de cada niño en lo que haces mañana, con [b]la Memoria del Salón[/b]. Entras hoy con 7 días gratis."
      />

      {/* 10. FOOTER LEGAL */}
      <FooterLegal
        appName="RAIZ"
        logo={<img src="/brand/raiz-logo.svg" alt="Raíz" className="h-6 w-auto" />}
        soporteEmail="hola@raizapp.com"
        enlaces={[
          { label: 'Privacidad', href: '/privacidad' },
          { label: 'Términos y Condiciones', href: '/terminos' },
          { label: 'Reembolsos', href: '/reembolsos' },
          { label: 'Aviso de IA', href: '/aviso-ia' },
        ]}
      />

      <StickyCtaMobile labelComercial={CTA_LABEL} href={CTA_HREF} />
    </div>
  );
}
