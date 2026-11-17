/**
 * Illustrations vectorielles internes.
 * Les chaînes SVG sont des constantes de confiance, sans interpolation de
 * données utilisateur. Elles sont injectées via la propriété `html` de h().
 */

const HERO_SVG = `
<svg viewBox="0 0 520 620" role="img" aria-label="Porte d’archive entrouverte dans un cercle de lumière" class="hero-svg">
  <defs>
    <radialGradient id="hero-glow" cx="50%" cy="44%" r="52%">
      <stop offset="0%" stop-color="#E5A13A" stop-opacity="0.20"/>
      <stop offset="45%" stop-color="#E5A13A" stop-opacity="0.05"/>
      <stop offset="100%" stop-color="#E5A13A" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="hero-door" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#202938"/>
      <stop offset="55%" stop-color="#141923"/>
      <stop offset="100%" stop-color="#090B10"/>
    </linearGradient>
    <linearGradient id="hero-edge" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E5A13A" stop-opacity="0.9"/>
      <stop offset="60%" stop-color="#E5A13A" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#55B8C9" stop-opacity="0.5"/>
    </linearGradient>
    <filter id="hero-soft" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="8"/>
    </filter>
  </defs>
  <rect width="520" height="620" fill="transparent"/>
  <circle cx="260" cy="292" r="260" fill="url(#hero-glow)"/>
  <g class="hero-rings" fill="none" stroke="#55B8C9">
    <circle cx="260" cy="292" r="236" stroke-opacity="0.08"/>
    <circle cx="260" cy="292" r="204" stroke-opacity="0.10" stroke-dasharray="2 10"/>
    <circle cx="260" cy="292" r="172" stroke-opacity="0.12"/>
    <circle cx="260" cy="292" r="140" stroke-opacity="0.08" stroke-dasharray="1 8"/>
  </g>
  <g class="hero-ticks" stroke="#E5A13A" stroke-opacity="0.55">
    <path d="M260 38v18M260 528v18M6 292h18M496 292h18"/>
    <path d="M80 112l12 12M440 460l12 12M440 112l-12 12M80 460l-12 12" stroke-opacity="0.28"/>
  </g>
  <g class="hero-door">
    <path d="M196 518V184a64 64 0 0 1 128 0v334" fill="url(#hero-door)" stroke="url(#hero-edge)" stroke-width="1.4"/>
    <path d="M210 512V190a50 50 0 0 1 100 0v322" fill="#090B10" stroke="#202938" stroke-width="1"/>
    <path d="M260 190v322" stroke="#E5A13A" stroke-opacity="0.25" stroke-width="1"/>
    <path d="M236 340a24 24 0 1 1 48 0c0 14-9 22-16 30v26h-16v-26c-7-8-16-16-16-30Z" fill="none" stroke="#E5A13A" stroke-opacity="0.8" stroke-width="1.6"/>
    <circle cx="260" cy="338" r="7" fill="#E5A13A" fill-opacity="0.65"/>
    <path d="M260 366v20" stroke="#E5A13A" stroke-opacity="0.5" stroke-width="1.4"/>
  </g>
  <g class="hero-scan" stroke="#55B8C9" stroke-opacity="0.18">
    <path d="M128 292h264M150 392h220M172 492h176" stroke-dasharray="3 9"/>
  </g>
  <g class="hero-particles" fill="#E7EAF0">
    <circle cx="122" cy="196" r="1.4" opacity="0.5"/>
    <circle cx="402" cy="158" r="1.1" opacity="0.35"/>
    <circle cx="358" cy="420" r="1.6" opacity="0.4"/>
    <circle cx="152" cy="452" r="1.2" opacity="0.3"/>
    <circle cx="316" cy="92" r="1.0" opacity="0.45"/>
    <circle cx="208" cy="112" r="1.2" opacity="0.25"/>
    <circle cx="430" cy="312" r="1.5" opacity="0.3"/>
    <circle cx="92" cy="330" r="1.1" opacity="0.35"/>
  </g>
  <text x="260" y="590" text-anchor="middle" class="hero-code" fill="#55B8C9" fill-opacity="0.55" font-family="monospace" font-size="11" letter-spacing="6">1017</text>
</svg>`;

const PHOTO_SVGS = {
  corridor: `
  <svg viewBox="0 0 320 180" aria-hidden="true">
    <defs>
      <linearGradient id="corr-floor" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#202938"/><stop offset="100%" stop-color="#090B10"/>
      </linearGradient>
    </defs>
    <rect width="320" height="180" fill="#090B10"/>
    <path d="M0 180 120 96h80l120 84Z" fill="url(#corr-floor)"/>
    <path d="M0 0 120 96M320 0 200 96" stroke="#202938" stroke-width="1"/>
    <rect x="132" y="62" width="56" height="76" fill="#141923" stroke="#55B8C9" stroke-opacity="0.4"/>
    <rect x="140" y="70" width="40" height="60" fill="#090B10" stroke="#55B8C9" stroke-opacity="0.2"/>
    <g fill="#E7EAF0" opacity="0.7">
      <rect x="38" y="18" width="34" height="5" rx="2"/>
      <rect x="248" y="18" width="34" height="5" rx="2"/>
      <rect x="58" y="34" width="22" height="4" rx="2" opacity="0.5"/>
      <rect x="240" y="34" width="22" height="4" rx="2" opacity="0.5"/>
    </g>
    <path d="M126 142h68M142 150h36" stroke="#E5A13A" stroke-opacity="0.35"/>
    <text x="10" y="172" fill="#55B8C9" font-family="monospace" font-size="7" opacity="0.6">22:12 / AILE EST</text>
  </svg>`,
  chamber: `
  <svg viewBox="0 0 320 180" aria-hidden="true">
    <rect width="320" height="180" fill="#090B10"/>
    <path d="M0 0h320v180H0Z" fill="#141923" opacity="0.6"/>
    <rect x="28" y="36" width="88" height="108" fill="#202938" stroke="#E7EAF0" stroke-opacity="0.12"/>
    <path d="M36 44h72v92H36Z" fill="#090B10"/>
    <path d="M44 52l56 76M100 52l-56 76" stroke="#55B8C9" stroke-opacity="0.18"/>
    <path d="M156 144v-28a24 24 0 0 1 48 0v28" fill="#141923" stroke="#E7EAF0" stroke-opacity="0.18"/>
    <path d="M168 144v-22a12 12 0 0 1 24 0v22" fill="#202938"/>
    <rect x="244" y="52" width="48" height="64" fill="#090B10" stroke="#202938"/>
    <circle cx="268" cy="60" r="3" fill="#D9534F"/>
    <circle cx="268" cy="60" r="8" fill="#D9534F" opacity="0.16"/>
    <path d="M244 116h48M232 132h72" stroke="#E5A13A" stroke-opacity="0.25"/>
    <text x="10" y="172" fill="#55B8C9" font-family="monospace" font-size="7" opacity="0.6">22:10 / CHAMBRE 14</text>
  </svg>`,
  terminal: `
  <svg viewBox="0 0 320 180" aria-hidden="true">
    <rect width="320" height="180" fill="#090B10"/>
    <rect x="42" y="52" width="126" height="82" rx="4" fill="#141923" stroke="#55B8C9" stroke-opacity="0.35"/>
    <rect x="52" y="62" width="106" height="62" fill="#090B10"/>
    <path d="M60 74h52M60 84h76M60 94h44M60 104h64" stroke="#55B8C9" stroke-opacity="0.5" stroke-width="2"/>
    <path d="M42 134h126M70 142h70" stroke="#202938" stroke-width="3"/>
    <rect x="194" y="96" width="86" height="42" rx="3" fill="#141923" stroke="#202938"/>
    <path d="M202 108h44M202 118h30" stroke="#E5A13A" stroke-opacity="0.45" stroke-width="2"/>
    <circle cx="268" cy="108" r="4" fill="#D9534F"/>
    <text x="10" y="172" fill="#55B8C9" font-family="monospace" font-size="7" opacity="0.6">22:10 / SALLE DE CONTRÔLE</text>
  </svg>`,
  exterior: `
  <svg viewBox="0 0 320 180" aria-hidden="true">
    <rect width="320" height="180" fill="#090B10"/>
    <circle cx="272" cy="34" r="12" fill="#E7EAF0" opacity="0.12"/>
    <path d="M0 180V96h36V64h28v116M64 180V80h52v100M116 180V102h40v78M156 180V72h58v108M214 180V88h44v92M258 180V62h34v118M292 180V104h28v76" fill="#141923" stroke="#202938"/>
    <g fill="#E5A13A" opacity="0.35">
      <rect x="74" y="94" width="8" height="6"/><rect x="90" y="94" width="8" height="6"/>
      <rect x="168" y="86" width="8" height="6"/><rect x="184" y="86" width="8" height="6"/>
    </g>
    <g fill="#55B8C9" opacity="0.25">
      <rect x="226" y="102" width="8" height="6"/><rect x="242" y="102" width="8" height="6"/>
      <rect x="270" y="76" width="8" height="6"/>
    </g>
    <path d="M0 160h320" stroke="#202938"/>
    <text x="10" y="172" fill="#55B8C9" font-family="monospace" font-size="7" opacity="0.6">23:20 / EXTÉRIEUR</text>
  </svg>`
};

export function heroArt() {
  return {
    node: document.createRange().createContextualFragment(HERO_SVG),
    markup: HERO_SVG
  };
}

export function mountHero(container) {
  if (!container) return;
  // Contenu de confiance, constant.
  container.innerHTML = HERO_SVG;
}

export function photoArt(kind) {
  return {
    node: document.createRange().createContextualFragment(PHOTO_SVGS[kind] || PHOTO_SVGS.corridor),
    markup: PHOTO_SVGS[kind] || PHOTO_SVGS.corridor
  };
}

export function mountPhoto(container, kind) {
  if (!container) return;
  container.innerHTML = PHOTO_SVGS[kind] || PHOTO_SVGS.corridor;
}
