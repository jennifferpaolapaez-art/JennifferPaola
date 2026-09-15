'use client';

// Landing de RAIZ — compuesta desde el KIT CANÓNICO (plantillas-codigo/landing/).
// Copy trazado a docs/copy/landing.md ← FICHA-AVATAR.md. Tokens en components/landing/tokens.css
// ← FICHA-ARTE.md. Estructura de 10 secciones inmutable (19-PAGINA-DE-VENTAS.md).

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

export default function LandingRaiz() {
  return (
    <div className="min-h-dvh bg-[var(--bg)] text-[var(--text-primary)] [font-family:var(--font-body)]">
      {/* 1. HERO */}
      <Hero
        appName="Raíz"
        loginHref="/entrar"
        h1Marked="Tu semana ya sabe qué necesita [acento]cada uno de tus niños[/acento]"
        subtitleMarked="La Memoria del Salón conecta lo que sabes de cada niño con [b]tu próxima planeación[/b]."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        socialProof={<span>Creada por quien vivió el caos de planear cada semana en un salón real.</span>}
        visualPlaceholderSugerencia="captura de la pantalla Hoy con la diferenciación por edad ya generada"
      />

      {/* 2. PROBLEMA */}
      <Problema
        titulo="¿Te suena?"
        preguntas={[
          { icon: Clock, textoMarked: '¿Terminas el domingo planeando en vez de descansar?' },
          { icon: Brain, textoMarked: '¿Sabes lo que necesita cada niño, pero no tienes dónde tenerlo todo junto?' },
          { icon: Users, textoMarked: '¿Sientes que armas cuatro planeaciones distintas para un solo grupo de edades mixtas?' },
          { icon: ImageOff, textoMarked: '¿Te preocupa que la próxima observación se pierda entre fotos y notas sueltas?' },
        ]}
      />

      {/* 3. AGITACIÓN */}
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

      {/* 4. SOLUCIÓN */}
      <Solucion
        tituloMarked="Tu semana, [acento]adaptada a cada niño[/acento] antes de escribirla"
        mecanismo="la Memoria del Salón"
        bigIdeaMarked="No te falta dedicación — te falta una herramienta que recuerde. [b]La Memoria del Salón[/b] conecta lo que sabes de cada niño con lo que haces mañana."
        pasos={[
          { titulo: 'Cuéntale a RAIZ', detalle: 'Perfil, edades y skills de tu grupo, una sola vez.' },
          { titulo: 'La Memoria decide', detalle: 'Cruza tu tema semanal con lo que cada niño necesita.' },
          { titulo: 'Enseñas con foco', detalle: 'Plan diferenciado por edad, listo para tu salón.' },
        ]}
        antesDespues={{
          labelAntes: 'Antes',
          antes: 'Una planeación genérica que adaptas tú sola, niño por niño.',
          labelDespues: 'Después',
          despues: 'Una semana que ya trae la diferenciación y el foco de cada niño.',
        }}
      />

      {/* 5. LA APP POR DENTRO — placeholders honestos (app interna aún no construida) */}
      <AppPorDentro
        tituloMarked="Tu salón, [acento]siempre a la vista[/acento]"
        frames={[
          { label: 'Configura tu programa y metodología', nombrePantalla: 'Onboarding' },
          { label: 'Tu semana con foco por niño', nombrePantalla: 'Planeación semanal' },
          { label: 'Lo que hoy toca enseñar', nombrePantalla: 'Hoy' },
          { label: 'El perfil vivo de cada niño', nombrePantalla: 'Perfil del niño' },
        ]}
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
      />

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
        anual={{
          nombre: 'Anual',
          badge: 'MÁS POPULAR',
          precioMes: '$16.66',
          totalAnual: 'Se cobra $199.90/año',
          ahorro: '2 meses gratis (~17%)',
          descomposicionDia: 'menos de $0.56 al día',
          ctaLabel: 'Empezar mis 7 días gratis',
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
          ctaLabel: 'Elegir mensual',
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
              'ChatGPT genera una actividad suelta. RAIZ conoce a tu grupo, tus niños, sus skills y tu inventario real — y lo usa en cada planeación.',
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
        h2Marked="Imagina tu domingo [acento]sin planear[/acento]"
        futurePacingMarked="Te sientas, RAIZ ya sabe qué necesita cada niño, y tu semana está lista en minutos."
        ctaLabel={CTA_LABEL}
        ctaHref={CTA_HREF}
        recap="Garantía de tu Primera Semana · 7 días gratis"
        psMarked="PS: RAIZ convierte lo que sabes de cada niño en lo que haces mañana, con [b]la Memoria del Salón[/b]. Hoy entras con 7 días gratis y la Garantía de tu Primera Semana."
      />

      {/* 10. FOOTER LEGAL */}
      <FooterLegal
        appName="RAIZ"
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
