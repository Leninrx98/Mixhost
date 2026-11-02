import React from 'react';

export default function MixiAvatar({
  config = {},
  expression = 'idle', // 'idle' | 'laugh' | 'surprised' | 'angry' | 'wink' | 'crying'
  size = 64,
  className = ''
}) {
  const {
    bodyColor = '#8B5CF6',    // Púrpura base vibrante
    spotsColor = '#5B21B6',   // Lunares púrpura oscuro
    eyeColor = '#A855F7',     // Iris violeta
    hat = 'none',             // 'none' | 'snapback'
    headphones = false,       // true | false
    glasses = false           // true | false
  } = config;

  const STROKE_COLOR = '#0F172A'; // Contorno negro grueso estilo Sticker / MOBA
  const STROKE_WIDTH = '3.5';

  return (
    <div 
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full drop-shadow-2xl overflow-visible"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            @keyframes tearFlow {
              0% { transform: translateY(0) scaleY(0.8); opacity: 0.9; }
              50% { transform: translateY(5px) scaleY(1.1); opacity: 1; }
              100% { transform: translateY(10px) scaleY(0.9); opacity: 0.4; }
            }
            .tear-anim {
              animation: tearFlow 0.75s infinite linear;
            }
          `}
        </style>

        {/* === SOMBRA DE FONDO STICKER === */}
        <ellipse cx="60" cy="112" rx="44" ry="7" fill="#0F172A" fillOpacity="0.45" />

        {/* === TENTÁCULOS INFERIORES (MANITAS STICKER CHIBI) === */}
        <g id="tentacles" fill={bodyColor} stroke={STROKE_COLOR} strokeWidth={STROKE_WIDTH} strokeLinejoin="round" strokeLinecap="round">
          {/* Tentáculo izq fuera */}
          <path d="M 18 78 C 8 84, 4 102, 18 106 C 30 108, 34 92, 38 84 Z" />
          {/* Manita izq centro */}
          <path d="M 32 84 C 26 98, 32 110, 46 108 C 54 106, 50 90, 48 84 Z" />
          {/* Manita der centro */}
          <path d="M 72 84 C 70 90, 66 106, 74 108 C 88 110, 94 98, 88 84 Z" />
          {/* Tentáculo der fuera */}
          <path d="M 82 84 C 86 92, 90 108, 102 106 C 116 102, 112 84, 102 78 Z" />
        </g>

        {/* === CUERPO / CABEZA REDONDA === */}
        <path
          d="M 60 12 C 24 12, 10 36, 10 66 C 10 88, 26 94, 60 94 C 94 94, 110 88, 110 66 C 110 36, 96 12, 60 12 Z"
          fill={bodyColor}
          stroke={STROKE_COLOR}
          strokeWidth={STROKE_WIDTH}
          strokeLinejoin="round"
        />

        {/* === LUNARES DISTRIBUIDOS EXACTOS A LA IA === */}
        <g id="spots" fill={spotsColor} opacity="0.85">
          <circle cx="34" cy="28" r="5" />
          <circle cx="48" cy="18" r="4" />
          <circle cx="84" cy="30" r="5" />
          <circle cx="72" cy="18" r="3.5" />
          <circle cx="22" cy="52" r="4.5" />
          <circle cx="98" cy="52" r="4.5" />
          <circle cx="36" cy="74" r="3.5" />
          <circle cx="84" cy="74" r="3.5" />
        </g>

        {/* === OJOS ANIME CON DOBLE DESTELLO === */}
        <g id="eyes">
          {expression === 'crying' ? (
            /* Emote Llorando (Dyrroth Style) */
            <>
              <path d="M 32 48 Q 44 36 56 48" stroke={STROKE_COLOR} strokeWidth="5.5" strokeLinecap="round" fill="none" />
              <path d="M 64 48 Q 76 36 88 48" stroke={STROKE_COLOR} strokeWidth="5.5" strokeLinecap="round" fill="none" />

              {/* Cascada de lágrimas animada */}
              <g className="tear-anim">
                <path d="M 38 50 C 36 66, 36 80, 42 92 C 48 80, 48 66, 46 50 Z" fill="#38BDF8" stroke={STROKE_COLOR} strokeWidth="1.5" />
                <path d="M 76 50 C 74 66, 74 80, 78 92 C 84 80, 84 66, 82 50 Z" fill="#38BDF8" stroke={STROKE_COLOR} strokeWidth="1.5" />
              </g>

              <circle cx="26" cy="80" r="3" fill="#38BDF8" stroke={STROKE_COLOR} strokeWidth="1" />
              <circle cx="94" cy="80" r="3" fill="#38BDF8" stroke={STROKE_COLOR} strokeWidth="1" />
            </>
          ) : expression === 'angry' ? (
            /* Emote Enojado */
            <>
              <ellipse cx="44" cy="54" rx="11" ry="13" fill="white" stroke={STROKE_COLOR} strokeWidth="2.5" />
              <ellipse cx="44" cy="55" rx="6" ry="7" fill={eyeColor} />
              <path d="M 28 38 L 58 48" stroke={STROKE_COLOR} strokeWidth="5.5" strokeLinecap="round" />

              <ellipse cx="76" cy="54" rx="11" ry="13" fill="white" stroke={STROKE_COLOR} strokeWidth="2.5" />
              <ellipse cx="76" cy="55" rx="6" ry="7" fill={eyeColor} />
              <path d="M 92 38 L 62 48" stroke={STROKE_COLOR} strokeWidth="5.5" strokeLinecap="round" />
            </>
          ) : expression === 'wink' ? (
            /* Guiño */
            <>
              <ellipse cx="43" cy="53" rx="13" ry="16" fill="white" stroke={STROKE_COLOR} strokeWidth="2.5" />
              <ellipse cx="43" cy="54" rx="7" ry="9" fill={eyeColor} />
              <circle cx="39" cy="46" r="3.5" fill="white" />
              <path d="M 64 54 Q 76 40 88 54" stroke={STROKE_COLOR} strokeWidth="5.5" strokeLinecap="round" fill="none" />
            </>
          ) : (
            /* Normal Chibi con doble destello */
            <>
              <ellipse cx="43" cy="53" rx="13" ry="16" fill="white" stroke={STROKE_COLOR} strokeWidth="2.5" />
              <ellipse cx="43" cy="54" rx="7" ry="9.5" fill={eyeColor} stroke={STROKE_COLOR} strokeWidth="1.5" />
              <circle cx="43" cy="55" r="4" fill={STROKE_COLOR} />
              <circle cx="39" cy="46" r="4" fill="white" />
              <circle cx="46" cy="58" r="1.5" fill="white" />

              <ellipse cx="77" cy="53" rx="13" ry="16" fill="white" stroke={STROKE_COLOR} strokeWidth="2.5" />
              <ellipse cx="77" cy="54" rx="7" ry="9.5" fill={eyeColor} stroke={STROKE_COLOR} strokeWidth="1.5" />
              <circle cx="77" cy="55" r="4" fill={STROKE_COLOR} />
              <circle cx="73" cy="46" r="4" fill="white" />
              <circle cx="80" cy="58" r="1.5" fill="white" />
            </>
          )}
        </g>

        {/* === BOCA ESTILO STICKER === */}
        <g id="mouth">
          {expression === 'crying' ? (
            <path d="M 44 68 Q 60 92 76 68 Z" fill="#F43F5E" stroke={STROKE_COLOR} strokeWidth="3" strokeLinejoin="round" />
          ) : expression === 'angry' ? (
            <path d="M 46 76 Q 60 68 74 76 Z" fill="#0F172A" stroke={STROKE_COLOR} strokeWidth="3" strokeLinejoin="round" />
          ) : (
            <path d="M 46 70 Q 60 88 74 70 Z" fill="#E11D48" stroke={STROKE_COLOR} strokeWidth="3" strokeLinejoin="round" />
          )}
        </g>

        {/* === ACCESORIO: LENTES DE MARCO NEGRO === */}
        {glasses && (
          <g id="glasses" stroke={STROKE_COLOR} strokeWidth="3.5" fill="none">
            <rect x="24" y="36" width="34" height="30" rx="10" fill={STROKE_COLOR} fillOpacity="0.3" />
            <rect x="62" y="36" width="34" height="30" rx="10" fill={STROKE_COLOR} fillOpacity="0.3" />
            <line x1="58" y1="48" x2="62" y2="48" strokeWidth="4" />
            <line x1="24" y1="46" x2="12" y2="42" strokeWidth="3.5" />
            <line x1="96" y1="46" x2="108" y2="42" strokeWidth="3.5" />
          </g>
        )}

        {/* === ACCESORIO: AUDÍFONOS GAMER CON NEÓN A LOS LADOS === */}
        {headphones && (
          <g id="headphones">
            <path d="M 12 54 A 50 50 0 0 1 108 54" stroke={STROKE_COLOR} strokeWidth="10" strokeLinecap="round" fill="none" />
            <path d="M 12 54 A 50 50 0 0 1 108 54" stroke="#1E293B" strokeWidth="6" strokeLinecap="round" fill="none" />
            
            <rect x="2" y="40" width="16" height="34" rx="8" fill="#0F172A" stroke={STROKE_COLOR} strokeWidth="3" />
            <rect x="5" y="44" width="10" height="26" rx="5" fill="#38BDF8" />
            
            <rect x="102" y="40" width="16" height="34" rx="8" fill="#0F172A" stroke={STROKE_COLOR} strokeWidth="3" />
            <rect x="105" y="44" width="10" height="26" rx="5" fill="#38BDF8" />
          </g>
        )}

        {/* === ACCESORIO: GORRA SNAPBACK CON LA "M" === */}
        {hat === 'snapback' && (
          <g id="hat">
            <path d="M 18 34 C 22 6, 98 6, 102 34 Z" fill="#1E293B" stroke={STROKE_COLOR} strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M 10 34 C 48 40, 72 40, 110 34 L 116 40 C 72 48, 48 48, 4 40 Z" fill="#0F172A" stroke={STROKE_COLOR} strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M 52 24 L 56 16 L 60 21 L 64 16 L 68 24" stroke="#A855F7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </g>
        )}
      </svg>
    </div>
  );
}