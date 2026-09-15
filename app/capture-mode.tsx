'use client';

// MODO CAPTURA — solo para tomar screenshots de evidencia/QA a 375px (revisor-visual).
// Lee ?capture=1 de la URL y marca <html data-capture> para que globals.css fuerce visible
// el contenido que normalmente entra con whileInView al hacer scroll. No afecta a usuarios
// reales (nadie visita la landing con ese parámetro) y no cambia el copy ni la estructura.
import { useEffect } from 'react';

export function CaptureMode() {
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('capture') === '1') {
      document.documentElement.setAttribute('data-capture', '1');
    }
  }, []);
  return null;
}
