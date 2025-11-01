/**
 * Theme & Styling System Module
 * Professional theme engine with gradient generation and texture system
 *
 * Features:
 * - 100+ gradient theme definitions (black accent themes, vibrant themes, metallic themes)
 * - Professional texture system (glassmorphism, materials, cyberpunk, geometric patterns)
 * - Theme application to UI elements (dock, sidebar, popouts, overlays)
 * - Cross-window theme synchronization
 * - Dynamic opacity and backdrop filter management
 * - Effect styles (metallic, neon, plasma, holographic, crystal)
 * - Texture intensity and scaling controls
 * - Ultra-compact mode for space-constrained UIs
 * - Dynamic responsive scaling based on viewport width
 *
 * @module ui/theme-system
 * @version 2.1.0
 */

/**
 * Generate complete theme styles based on settings
 * Creates gradient backgrounds, textures, effects, and opacity settings
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.productionLog - Production logging function
 * @param {Object} settings - Theme settings configuration
 * @param {number} settings.opacity - Main panel opacity (0-100)
 * @param {number} settings.popoutOpacity - Popout window opacity (0-100)
 * @param {string} settings.gradientStyle - Selected gradient theme name
 * @param {string} settings.effectStyle - Effect style (metallic, neon, plasma, etc.)
 * @param {string} settings.textureStyle - Texture pattern name
 * @param {number} settings.textureIntensity - Texture opacity multiplier (0-100)
 * @param {string} settings.textureScale - Texture size (small, medium, large)
 * @param {string} settings.textureBlendMode - CSS blend mode for texture
 * @param {boolean} settings.textureAnimated - Enable texture animation
 * @param {boolean} isPopout - Whether this is for a popout window
 * @returns {Object} Complete theme style configuration object
 */
export function generateThemeStyles(deps, settings, isPopout = false) {
  // Use different opacity based on window type
  const opacity = isPopout ? settings.popoutOpacity / 100 : settings.opacity / 100;

  // Use actual opacity value (0.0 to 1.0)
  const effectiveOpacity = opacity;

  // Define gradient styles - ALL themes now use effectiveOpacity for true 100% support
  const gradients = {
    // ⚫ BLACK ACCENT THEMES (Solid backgrounds with vibrant accent colors)
    'black-crimson':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(26, 0, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-emerald':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 26, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-royal':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(13, 0, 21, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-gold':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(26, 20, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-ice':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 13, 26, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-flame':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(26, 13, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-toxic':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(10, 26, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-pink':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(26, 0, 20, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-matrix':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 17, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-sunset':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(26, 10, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-blood':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(40, 0, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-neon':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 20, 30, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-storm':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(10, 0, 30, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-sapphire':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 10, 40, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-aqua':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 25, 25, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-phantom':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(20, 20, 20, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-void':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(10, 10, 10, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-violet':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(20, 0, 30, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-amber':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(30, 22, 0, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-jade':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 20, 15, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-coral':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(30, 15, 10, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-steel':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(10, 20, 25, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-lavender':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(20, 15, 25, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-mint':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(5, 20, 15, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-ruby':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(30, 0, 10, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-cobalt':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 10, 25, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-bronze':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(25, 15, 8, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-teal':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(0, 18, 18, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-magenta':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(25, 0, 25, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-lime':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(8, 25, 8, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',
    'black-indigo':
      'linear-gradient(135deg, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 0%, rgba(10, 0, 20, ' +
      effectiveOpacity +
      ') 50%, rgba(0, 0, 0, ' +
      effectiveOpacity +
      ') 100%)',

    // 🌈 ORIGINAL THEMES
    'blue-purple':
      'linear-gradient(135deg, rgba(20, 20, 35, ' +
      effectiveOpacity +
      ') 0%, rgba(30, 30, 50, ' +
      effectiveOpacity +
      ') 100%)',
    'green-blue':
      'linear-gradient(135deg, rgba(20, 35, 20, ' +
      effectiveOpacity +
      ') 0%, rgba(30, 40, 60, ' +
      effectiveOpacity +
      ') 100%)',
    'red-orange':
      'linear-gradient(135deg, rgba(35, 20, 20, ' +
      effectiveOpacity +
      ') 0%, rgba(50, 35, 30, ' +
      effectiveOpacity +
      ') 100%)',
    'purple-pink':
      'linear-gradient(135deg, rgba(35, 20, 35, ' +
      effectiveOpacity +
      ') 0%, rgba(50, 30, 45, ' +
      effectiveOpacity +
      ') 100%)',
    'gold-yellow':
      'linear-gradient(135deg, rgba(35, 30, 20, ' +
      effectiveOpacity +
      ') 0%, rgba(45, 40, 25, ' +
      effectiveOpacity +
      ') 100%)',
    // New vibrant gradients - using effectiveOpacity for better high-level opacity
    'electric-neon':
      'linear-gradient(135deg, rgba(0, 100, 255, ' +
      effectiveOpacity * 0.3 +
      ') 0%, rgba(147, 51, 234, ' +
      effectiveOpacity * 0.4 +
      ') 100%)',
    'sunset-fire':
      'linear-gradient(135deg, rgba(255, 94, 77, ' +
      effectiveOpacity * 0.3 +
      ') 0%, rgba(255, 154, 0, ' +
      effectiveOpacity * 0.4 +
      ') 100%)',
    'emerald-cyan':
      'linear-gradient(135deg, rgba(16, 185, 129, ' +
      effectiveOpacity * 0.3 +
      ') 0%, rgba(6, 182, 212, ' +
      effectiveOpacity * 0.4 +
      ') 100%)',
    'royal-gold':
      'linear-gradient(135deg, rgba(139, 69, 19, ' +
      effectiveOpacity * 0.4 +
      ') 0%, rgba(255, 215, 0, ' +
      effectiveOpacity * 0.3 +
      ') 100%)',
    'crimson-blaze':
      'linear-gradient(135deg, rgba(220, 38, 127, ' +
      effectiveOpacity * 0.3 +
      ') 0%, rgba(249, 115, 22, ' +
      effectiveOpacity * 0.4 +
      ') 100%)',
    'ocean-deep':
      'linear-gradient(135deg, rgba(15, 23, 42, ' +
      effectiveOpacity * 0.8 +
      ') 0%, rgba(30, 64, 175, ' +
      effectiveOpacity * 0.6 +
      ') 100%)',
    'forest-mystique':
      'linear-gradient(135deg, rgba(20, 83, 45, ' +
      effectiveOpacity * 0.6 +
      ') 0%, rgba(34, 197, 94, ' +
      effectiveOpacity * 0.4 +
      ') 100%)',
    'cosmic-purple':
      'linear-gradient(135deg, rgba(88, 28, 135, ' +
      effectiveOpacity * 0.6 +
      ') 0%, rgba(168, 85, 247, ' +
      effectiveOpacity * 0.4 +
      ') 100%)',
    'rainbow-burst':
      'linear-gradient(135deg, rgba(239, 68, 68, ' +
      effectiveOpacity * 0.25 +
      ') 0%, rgba(245, 158, 11, ' +
      effectiveOpacity * 0.25 +
      ') 25%, rgba(34, 197, 94, ' +
      effectiveOpacity * 0.25 +
      ') 50%, rgba(59, 130, 246, ' +
      effectiveOpacity * 0.25 +
      ') 75%, rgba(147, 51, 234, ' +
      effectiveOpacity * 0.25 +
      ') 100%)',
    // Premium metallic themes - FIXED for visibility with darker, richer tones
    'steel-blue':
      'linear-gradient(135deg, rgba(30, 41, 59, ' +
      effectiveOpacity * 0.95 +
      ') 0%, rgba(51, 65, 85, ' +
      effectiveOpacity * 0.9 +
      ') 25%, rgba(71, 85, 105, ' +
      effectiveOpacity * 0.85 +
      ') 50%, rgba(30, 58, 138, ' +
      effectiveOpacity * 0.8 +
      ') 100%)',
    'chrome-silver':
      'linear-gradient(135deg, rgba(55, 65, 81, ' +
      effectiveOpacity * 0.9 +
      ') 0%, rgba(75, 85, 99, ' +
      effectiveOpacity * 0.85 +
      ') 25%, rgba(100, 116, 139, ' +
      effectiveOpacity * 0.8 +
      ') 50%, rgba(71, 85, 105, ' +
      effectiveOpacity * 0.9 +
      ') 100%)',
    'titanium-gray':
      'linear-gradient(135deg, rgba(31, 41, 55, ' +
      effectiveOpacity * 0.95 +
      ') 0%, rgba(55, 65, 81, ' +
      effectiveOpacity * 0.9 +
      ') 25%, rgba(75, 85, 99, ' +
      effectiveOpacity * 0.85 +
      ') 50%, rgba(107, 114, 128, ' +
      effectiveOpacity * 0.8 +
      ') 100%)',
    'platinum-white':
      'linear-gradient(135deg, rgba(75, 85, 99, ' +
      effectiveOpacity * 0.85 +
      ') 0%, rgba(100, 116, 139, ' +
      effectiveOpacity * 0.8 +
      ') 25%, rgba(148, 163, 184, ' +
      effectiveOpacity * 0.75 +
      ') 50%, rgba(156, 163, 175, ' +
      effectiveOpacity * 0.7 +
      ') 100%)'
  };

  const background = gradients[settings.gradientStyle] || gradients['blue-purple'];

  // Generate effect styles for the current theme
  let boxShadow = '0 10px 40px rgba(0, 0, 0, 0.5)';
  let borderShadow = '';

  switch (settings.effectStyle) {
    case 'metallic':
      boxShadow = `
                0 10px 40px rgba(0, 0, 0, 0.5),
                inset 0 1px 0 rgba(255, 255, 255, 0.57),
                inset 0 -1px 0 rgba(0, 0, 0, 0.48)
            `;
      break;
    case 'neon':
      borderShadow = `0 0 20px rgba(74, 158, 255, ${effectiveOpacity * 0.6})`;
      boxShadow = `
                0 10px 40px rgba(0, 0, 0, 0.5),
                ${borderShadow}
            `;
      break;
    case 'plasma':
      borderShadow = `0 0 30px rgba(147, 51, 234, ${effectiveOpacity * 0.5})`;
      boxShadow = `
                0 10px 40px rgba(0, 0, 0, 0.5),
                ${borderShadow}
            `;
      break;
    case 'holographic':
      boxShadow = `
                0 10px 40px rgba(0, 0, 0, 0.5),
                0 0 40px rgba(255, 255, 255, ${effectiveOpacity * 0.1}),
                inset 0 1px 0 rgba(255, 255, 255, 0.73)
            `;
      break;
    case 'crystal':
      boxShadow = `
                0 10px 40px rgba(0, 0, 0, 0.5),
                0 0 20px rgba(255, 255, 255, ${effectiveOpacity * 0.1}),
                inset 0 1px 0 rgba(255, 255, 255, 0.3),
                inset 0 -1px 0 rgba(0, 0, 0, 0.30)
            `;
      break;
  }

  // Accent colors for black themes
  const accentColors = {
    'black-void': { color: '#1a1a1a', glow: 'rgba(26, 26, 26, 0.3)', text: '#2a2a2a' },
    'black-crimson': { color: '#DC143C', glow: 'rgba(220, 20, 60, 0.5)', text: '#FF6B6B' },
    'black-emerald': { color: '#50C878', glow: 'rgba(80, 200, 120, 0.5)', text: '#90EE90' },
    'black-royal': { color: '#9D4EDD', glow: 'rgba(157, 78, 221, 0.5)', text: '#DDA0DD' },
    'black-gold': { color: '#FFD700', glow: 'rgba(255, 215, 0, 0.5)', text: '#FFD700' },
    'black-ice': { color: '#00FFFF', glow: 'rgba(0, 255, 255, 0.5)', text: '#B0E0E6' },
    'black-flame': { color: '#FF4500', glow: 'rgba(255, 69, 0, 0.5)', text: '#FF7F50' },
    'black-toxic': { color: '#7FFF00', glow: 'rgba(127, 255, 0, 0.5)', text: '#9ACD32' },
    'black-pink': { color: '#FF1493', glow: 'rgba(255, 20, 147, 0.5)', text: '#FFB6C1' },
    'black-matrix': { color: '#00FF00', glow: 'rgba(0, 255, 0, 0.8)', text: '#00FF00' },
    'black-sunset': { color: '#FF6B35', glow: 'rgba(255, 107, 53, 0.6)', text: '#FFA500' },
    'black-blood': { color: '#8B0000', glow: 'rgba(139, 0, 0, 0.7)', text: '#CD5C5C' },
    'black-neon': { color: '#00CED1', glow: 'rgba(0, 206, 209, 0.8)', text: '#AFEEEE' },
    'black-storm': { color: '#483D8B', glow: 'rgba(72, 61, 139, 0.6)', text: '#9370DB' },
    'black-sapphire': { color: '#0F52BA', glow: 'rgba(15, 82, 186, 0.7)', text: '#4169E1' },
    'black-aqua': { color: '#008B8B', glow: 'rgba(0, 139, 139, 0.6)', text: '#48D1CC' },
    'black-phantom': { color: '#C0C0C0', glow: 'rgba(192, 192, 192, 0.4)', text: '#DCDCDC' },
    'black-violet': { color: '#8A2BE2', glow: 'rgba(138, 43, 226, 0.6)', text: '#9370DB' },
    'black-amber': { color: '#FFBF00', glow: 'rgba(255, 191, 0, 0.5)', text: '#FFC125' },
    'black-jade': { color: '#00A86B', glow: 'rgba(0, 168, 107, 0.6)', text: '#5FD3A6' },
    'black-coral': { color: '#FF7F50', glow: 'rgba(255, 127, 80, 0.5)', text: '#FFA07A' },
    'black-steel': { color: '#4682B4', glow: 'rgba(70, 130, 180, 0.5)', text: '#87CEEB' },
    'black-lavender': { color: '#B57EDC', glow: 'rgba(181, 126, 220, 0.5)', text: '#DDA0DD' },
    'black-mint': { color: '#3EB489', glow: 'rgba(62, 180, 137, 0.6)', text: '#98FB98' },
    'black-ruby': { color: '#E0115F', glow: 'rgba(224, 17, 95, 0.6)', text: '#FF1493' },
    'black-cobalt': { color: '#0047AB', glow: 'rgba(0, 71, 171, 0.7)', text: '#4169E1' },
    'black-bronze': { color: '#CD7F32', glow: 'rgba(205, 127, 50, 0.6)', text: '#D2691E' },
    'black-teal': { color: '#008080', glow: 'rgba(0, 128, 128, 0.6)', text: '#20B2AA' },
    'black-magenta': { color: '#FF00FF', glow: 'rgba(255, 0, 255, 0.6)', text: '#FF69B4' },
    'black-lime': { color: '#32CD32', glow: 'rgba(50, 205, 50, 0.6)', text: '#7FFF00' },
    'black-indigo': { color: '#4B0082', glow: 'rgba(75, 0, 130, 0.6)', text: '#8B00FF' }
  };

  const accent = accentColors[settings.gradientStyle] || null;

  // Texture patterns (CSS background-image overlays)
  // ========== PROFESSIONAL TEXTURE SYSTEM 2.0 ==========
  // 25 premium patterns with proper visibility (0.12-0.25 opacity)
  const textures = {
    none: '',

    // ===== MODERN GLASS (Apple iOS Glassmorphism) =====
    'frosted-glass': `
            radial-gradient(circle at 35% 35%, rgba(74, 158, 255, 0.25), transparent 60%),
            radial-gradient(circle at 65% 65%, rgba(0, 217, 255, 0.20), transparent 55%),
            radial-gradient(circle at 20% 80%, rgba(147, 197, 253, 0.18), transparent 45%),
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E"),
            linear-gradient(135deg, rgba(255, 255, 255, 0.12), rgba(200, 230, 255, 0.08))
        `,
    'crystal-prism': `
            linear-gradient(45deg, rgba(74, 158, 255, 0.35) 0%, transparent 50%, rgba(147, 51, 234, 0.28) 100%),
            linear-gradient(-45deg, transparent 0%, rgba(0, 217, 255, 0.30) 50%, transparent 100%),
            radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.25), transparent 60%),
            radial-gradient(circle at 30% 70%, rgba(139, 92, 246, 0.18), transparent 50%)
        `,
    'ice-frost': `
            radial-gradient(circle at 20% 30%, rgba(147, 197, 253, 0.40) 0%, transparent 4%),
            radial-gradient(circle at 60% 70%, rgba(191, 219, 254, 0.35) 0%, transparent 5%),
            radial-gradient(circle at 80% 20%, rgba(224, 242, 254, 0.38) 0%, transparent 3%),
            radial-gradient(circle at 40% 50%, rgba(59, 130, 246, 0.22) 0%, transparent 8%),
            linear-gradient(to bottom, rgba(219, 234, 254, 0.15), rgba(147, 197, 253, 0.08))
        `,
    'smoke-flow': `
            radial-gradient(ellipse at 0% 0%, rgba(96, 165, 250, 0.35), transparent 55%),
            radial-gradient(ellipse at 100% 100%, rgba(147, 197, 253, 0.28), transparent 60%),
            radial-gradient(ellipse at 50% 50%, rgba(191, 219, 254, 0.25), transparent 45%),
            radial-gradient(ellipse at 30% 70%, rgba(59, 130, 246, 0.18), transparent 50%)
        `,
    'water-ripple': `
            radial-gradient(circle, rgba(6, 182, 212, 0.30) 3px, transparent 3px),
            radial-gradient(circle, rgba(34, 211, 238, 0.25) 2px, transparent 2px),
            radial-gradient(circle, rgba(103, 232, 249, 0.18) 1.5px, transparent 1.5px),
            linear-gradient(to bottom, rgba(165, 243, 252, 0.12), rgba(6, 182, 212, 0.08))
        `,

    // ===== PREMIUM MATERIALS (Photorealistic Luxury) =====
    'carbon-fiber-pro': `
            repeating-linear-gradient(0deg,
                rgba(59, 130, 246, 0.15) 0px,
                rgba(147, 51, 234, 0.35) 1px,
                rgba(99, 102, 241, 0.28) 2px,
                rgba(139, 92, 246, 0.12) 3px,
                transparent 4px),
            repeating-linear-gradient(90deg,
                rgba(30, 58, 138, 0.18) 0px,
                rgba(67, 56, 202, 0.32) 1px,
                rgba(79, 70, 229, 0.25) 2px,
                rgba(99, 102, 241, 0.15) 3px,
                transparent 4px),
            linear-gradient(135deg, rgba(30, 27, 75, 0.20), rgba(67, 56, 202, 0.10))
        `,
    'brushed-aluminum': `
            repeating-linear-gradient(90deg,
                rgba(226, 232, 240, 0.35) 0px,
                rgba(203, 213, 225, 0.45) 0.5px,
                rgba(226, 232, 240, 0.38) 1px,
                rgba(241, 245, 249, 0.28) 1.5px,
                rgba(203, 213, 225, 0.32) 2px),
            linear-gradient(180deg, rgba(248, 250, 252, 0.18), rgba(226, 232, 240, 0.25)),
            radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.15), transparent 60%)
        `,
    'brushed-titanium': `
            repeating-linear-gradient(45deg,
                rgba(251, 191, 36, 0.30) 0px,
                rgba(217, 119, 6, 0.40) 1px,
                rgba(245, 158, 11, 0.35) 2px,
                rgba(251, 191, 36, 0.25) 3px),
            linear-gradient(135deg, rgba(217, 119, 6, 0.18), rgba(251, 191, 36, 0.12)),
            radial-gradient(circle at 40% 40%, rgba(252, 211, 77, 0.20), transparent 55%)
        `,
    'leather-grain': `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='turbulence'%3E%3CfeTurbulence type='turbulence' baseFrequency='2.2' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23turbulence)' opacity='0.28'/%3E%3C/svg%3E"),
            radial-gradient(circle at 60% 40%, rgba(127, 29, 29, 0.35), transparent 65%),
            radial-gradient(circle at 30% 70%, rgba(153, 27, 27, 0.28), transparent 60%),
            linear-gradient(135deg, rgba(185, 28, 28, 0.22), rgba(127, 29, 29, 0.18))
        `,
    'fabric-weave': `
            repeating-linear-gradient(0deg, rgba(148, 163, 184, 0.35) 0px, transparent 1px, transparent 3px),
            repeating-linear-gradient(90deg, rgba(148, 163, 184, 0.35) 0px, transparent 1px, transparent 3px),
            linear-gradient(45deg, rgba(203, 213, 225, 0.15) 25%, transparent 25%, transparent 75%, rgba(203, 213, 225, 0.15) 75%),
            linear-gradient(45deg, rgba(226, 232, 240, 0.12), rgba(203, 213, 225, 0.08))
        `,
    'wood-grain': `
            linear-gradient(90deg,
                rgba(217, 119, 6, 0.28) 0%,
                rgba(251, 146, 60, 0.35) 8%,
                rgba(217, 119, 6, 0.25) 16%,
                rgba(234, 88, 12, 0.32) 24%,
                rgba(251, 146, 60, 0.28) 32%,
                rgba(217, 119, 6, 0.30) 40%),
            repeating-linear-gradient(90deg, transparent 0px, rgba(180, 83, 9, 0.18) 1px, transparent 2px),
            linear-gradient(180deg, rgba(251, 191, 36, 0.15), rgba(217, 119, 6, 0.10))
        `,

    // ===== TECH/FUTURISTIC (Cyberpunk Neon) =====
    'circuit-board': `
            linear-gradient(rgba(34, 197, 94, 0.32) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34, 197, 94, 0.32) 1px, transparent 1px),
            linear-gradient(rgba(16, 185, 129, 0.25) 2px, transparent 2px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.25) 2px, transparent 2px),
            radial-gradient(circle at 25% 25%, rgba(52, 211, 153, 0.20), transparent 15%),
            radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.18), transparent 15%),
            linear-gradient(135deg, rgba(6, 78, 59, 0.15), rgba(20, 83, 45, 0.10))
        `,
    'hexagon-grid-pro': `
            repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(6, 182, 212, 0.38) 22px, rgba(14, 165, 233, 0.38) 23px),
            repeating-linear-gradient(60deg, transparent, transparent 22px, rgba(34, 211, 238, 0.32) 22px, rgba(6, 182, 212, 0.32) 23px),
            repeating-linear-gradient(120deg, transparent, transparent 22px, rgba(56, 189, 248, 0.32) 22px, rgba(14, 165, 233, 0.32) 23px),
            radial-gradient(circle at 50% 50%, rgba(125, 211, 252, 0.18), transparent 50%)
        `,
    'hologram-scan': `
            repeating-linear-gradient(0deg,
                transparent 0px,
                rgba(6, 182, 212, 0.22) 1px,
                rgba(236, 72, 153, 0.32) 2px,
                rgba(6, 182, 212, 0.22) 3px,
                transparent 4px),
            linear-gradient(90deg, rgba(236, 72, 153, 0.15), rgba(6, 182, 212, 0.15), rgba(236, 72, 153, 0.15)),
            radial-gradient(circle at 50% 50%, rgba(236, 72, 153, 0.18), transparent 60%)
        `,
    'matrix-rain': `
            linear-gradient(rgba(34, 197, 94, 0.35) 2px, transparent 2px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.28) 1px, transparent 1px),
            radial-gradient(circle at 30% 40%, rgba(52, 211, 153, 0.20), transparent 50%),
            linear-gradient(180deg, rgba(34, 197, 94, 0.12), rgba(6, 78, 59, 0.08))
        `,
    'energy-waves': `
            radial-gradient(ellipse at 50% 0%, rgba(59, 130, 246, 0.40), transparent 45%),
            radial-gradient(ellipse at 50% 100%, rgba(96, 165, 250, 0.38), transparent 45%),
            radial-gradient(ellipse at 50% 50%, rgba(147, 197, 253, 0.28), transparent 35%),
            radial-gradient(ellipse at 0% 50%, rgba(29, 78, 216, 0.22), transparent 40%),
            radial-gradient(ellipse at 100% 50%, rgba(37, 99, 235, 0.22), transparent 40%)
        `,
    'cyberpunk-grid': `
            linear-gradient(rgba(236, 72, 153, 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.35) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.25), transparent 65%),
            linear-gradient(135deg, rgba(236, 72, 153, 0.12), rgba(6, 182, 212, 0.12))
        `,

    // ===== GEOMETRIC CLEAN (Swiss Design) =====
    'dots-pro': `
            radial-gradient(circle, rgba(100, 116, 139, 0.40) 2px, transparent 2px),
            radial-gradient(circle, rgba(148, 163, 184, 0.20) 1px, transparent 1px),
            linear-gradient(to bottom right, rgba(203, 213, 225, 0.10), rgba(148, 163, 184, 0.08))
        `,
    'grid-pro': `
            linear-gradient(rgba(100, 116, 139, 0.35) 1px, transparent 1px),
            linear-gradient(90deg, rgba(100, 116, 139, 0.35) 1px, transparent 1px),
            linear-gradient(rgba(148, 163, 184, 0.15) 1px, transparent 1px),
            linear-gradient(90deg, rgba(148, 163, 184, 0.15) 1px, transparent 1px)
        `,
    'diagonal-pro': `
            repeating-linear-gradient(45deg,
                transparent,
                transparent 18px,
                rgba(100, 116, 139, 0.32) 18px,
                rgba(148, 163, 184, 0.28) 19px,
                transparent 20px),
            linear-gradient(135deg, rgba(203, 213, 225, 0.10), rgba(148, 163, 184, 0.05))
        `,
    waves: `
            repeating-radial-gradient(circle at 50% 50%,
                transparent 0px,
                rgba(100, 116, 139, 0.30) 12px,
                transparent 24px),
            radial-gradient(circle at 50% 50%, rgba(148, 163, 184, 0.18), transparent 60%)
        `,
    triangles: `
            linear-gradient(45deg, rgba(100, 116, 139, 0.35) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(100, 116, 139, 0.35) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(148, 163, 184, 0.28) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(148, 163, 184, 0.28) 75%)
        `,
    crosshatch: `
            repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(100, 116, 139, 0.32) 4px, rgba(100, 116, 139, 0.32) 5px),
            repeating-linear-gradient(90deg, transparent, transparent 4px, rgba(148, 163, 184, 0.28) 4px, rgba(148, 163, 184, 0.28) 5px)
        `,

    // ===== SPECIAL EFFECTS (Atmospheric) =====
    'perlin-noise': `
            url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='perlin'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0.3 0 0 0 0.4, 0 0.4 0 0 0.5, 0 0 0.5 0 0.6, 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23perlin)'/%3E%3C/svg%3E"),
            radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.15), transparent 70%)
        `,
    'gradient-mesh': `
            radial-gradient(circle at 25% 25%, rgba(139, 92, 246, 0.35), transparent 55%),
            radial-gradient(circle at 75% 25%, rgba(59, 130, 246, 0.32), transparent 55%),
            radial-gradient(circle at 25% 75%, rgba(236, 72, 153, 0.30), transparent 55%),
            radial-gradient(circle at 75% 75%, rgba(6, 182, 212, 0.28), transparent 55%),
            linear-gradient(135deg, rgba(167, 139, 250, 0.12), rgba(96, 165, 250, 0.12))
        `
  };

  const textureBackgroundSize = {
    'frosted-glass': '100% 100%, 100% 100%, 100% 100%, cover, 100% 100%',
    'crystal-prism': '100% 100%, 100% 100%, 100% 100%, 100% 100%',
    'ice-frost': '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%',
    'smoke-flow': '100% 100%, 100% 100%, 100% 100%, 100% 100%',
    'water-ripple': '30px 30px, 50px 50px, 40px 40px, 100% 100%',
    'carbon-fiber-pro': '6px 6px, 6px 6px, 100% 100%',
    'brushed-aluminum': '2px 100%, 100% 100%, 100% 100%',
    'brushed-titanium': '3px 3px, 100% 100%, 100% 100%',
    'leather-grain': 'cover, 100% 100%, 100% 100%, 100% 100%',
    'fabric-weave': '4px 4px, 4px 4px, 30px 30px, 100% 100%',
    'wood-grain': '100% 40px, 100% 2px, 100% 100%',
    'circuit-board': '40px 40px, 40px 40px, 120px 120px, 120px 120px, 100% 100%, 100% 100%, 100% 100%',
    'hexagon-grid-pro': '100% 100%, 100% 100%, 100% 100%, 100% 100%',
    'hologram-scan': '100% 5px, 100% 100%, 100% 100%',
    'matrix-rain': '2px 20px, 10px 10px, 100% 100%, 100% 100%',
    'energy-waves': '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%',
    'cyberpunk-grid': '50px 50px, 50px 50px, 100% 100%, 100% 100%',
    'dots-pro': '25px 25px, 20px 20px, 100% 100%',
    'grid-pro': '30px 30px, 30px 30px, 60px 60px, 60px 60px',
    'diagonal-pro': '100% 100%, 100% 100%',
    waves: '100% 100%, 100% 100%',
    triangles: '30px 30px, 30px 30px, 30px 30px, 30px 30px',
    crosshatch: '100% 100%, 100% 100%',
    'perlin-noise': 'cover, 100% 100%',
    'gradient-mesh': '100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%'
  };

  const textureStyle = settings.textureStyle || 'none';
  let texturePattern = textures[textureStyle] || '';
  let textureBgSize = textureBackgroundSize[textureStyle] || 'auto';

  // Apply intensity multiplier to texture opacity
  const textureIntensity = settings.textureIntensity !== undefined ? settings.textureIntensity : 75;
  const intensityMultiplier = textureIntensity / 100; // 0-100% direct mapping

  if (texturePattern && intensityMultiplier !== 1.0) {
    // Multiply all rgba() opacity values by intensity multiplier
    texturePattern = texturePattern.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([0-9.]+)\)/g, (match, r, g, b, a) => {
      const newAlpha = Math.min(1, parseFloat(a) * intensityMultiplier);
      return `rgba(${r}, ${g}, ${b}, ${newAlpha.toFixed(3)})`;
    });

    // Also handle SVG opacity attributes
    texturePattern = texturePattern.replace(/opacity='([0-9.]+)'/g, (match, a) => {
      const newAlpha = Math.min(1, parseFloat(a) * intensityMultiplier);
      return `opacity='${newAlpha.toFixed(2)}'`;
    });
  }

  // Apply scale multiplier to texture background-size
  const textureScale = settings.textureScale || 'medium';
  const scaleMultipliers = { small: 0.5, medium: 1.0, large: 2.0 };
  const scaleMultiplier = scaleMultipliers[textureScale];

  if (textureBgSize !== 'cover' && textureBgSize !== 'auto' && scaleMultiplier !== 1.0) {
    // Scale pixel/percentage values
    textureBgSize = textureBgSize.replace(/(\d+)(px|%)/g, (match, value, unit) => {
      const scaled = Math.round(parseFloat(value) * scaleMultiplier);
      return scaled + unit;
    });
  }

  // Get blend mode
  const textureBlendMode = settings.textureBlendMode || 'overlay';

  // Get animation setting
  const textureAnimated = settings.textureAnimated || false;

  return {
    background,
    boxShadow,
    opacity: isPopout ? settings.popoutOpacity : settings.opacity,
    effectiveOpacity: effectiveOpacity,
    gradientStyle: settings.gradientStyle,
    effectStyle: settings.effectStyle,
    textureStyle: textureStyle,
    texturePattern: texturePattern,
    textureBackgroundSize: textureBgSize,
    textureBlendMode: textureBlendMode,
    textureAnimated: textureAnimated,
    isPopout: isPopout,
    accentColor: accent ? accent.color : '#4a9eff',
    accentGlow: accent ? accent.glow : 'rgba(74, 158, 255, 0.5)',
    accentText: accent ? accent.text : '#FFFFFF'
  };
}

/**
 * Apply theme styles to a DOM element
 * Handles opacity, textures, effects, and special cases
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.productionLog - Production logging function
 * @param {HTMLElement} element - DOM element to apply theme to
 * @param {Object} themeStyles - Theme configuration from generateThemeStyles()
 */
export function applyThemeToElement(deps, element, themeStyles) {
  if (!element || !themeStyles) return;

  const opacity = themeStyles.opacity / 100;

  // Handle true 0% opacity - completely transparent
  if (opacity === 0) {
    element.style.background = 'transparent';
    element.style.boxShadow = 'none';
    element.style.backdropFilter = 'none';
    element.style.border = 'none';
    deps.productionLog('Applied true 0% opacity - completely transparent');
    return;
  }

  // Handle all opacity levels (1-100%) with same logic
  // Layer texture over gradient if texture is enabled
  if (themeStyles.texturePattern) {
    element.style.background = `${themeStyles.texturePattern}, ${themeStyles.background}`;
    element.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
    element.style.backgroundBlendMode = `${themeStyles.textureBlendMode}, normal`;

    // Add animation class if enabled for supported textures
    const animatedTextures = ['smoke-flow', 'hologram-scan', 'energy-waves', 'water-ripple'];
    if (themeStyles.textureAnimated && animatedTextures.includes(themeStyles.textureStyle)) {
      element.classList.add('mga-texture-animated');
    } else {
      element.classList.remove('mga-texture-animated');
    }
  } else {
    element.style.background = themeStyles.background;
    element.style.backgroundBlendMode = '';
    element.classList.remove('mga-texture-animated');
  }

  // Apply box shadow and borders
  const isBlackTheme = themeStyles.gradientStyle && themeStyles.gradientStyle.startsWith('black-');
  if (isBlackTheme && themeStyles.accentColor) {
    element.style.boxShadow = `0 10px 40px rgba(0, 0, 0, 0.8), 0 0 30px ${themeStyles.accentGlow}`;
    element.style.border = `1px solid ${themeStyles.accentColor}`;
  } else {
    element.style.boxShadow = themeStyles.boxShadow;
    element.style.border = `1px solid rgba(255, 255, 255, ${Math.max(0.05, opacity * 0.15)})`;
  }

  // Backdrop filter: disable at 100% for solid appearance, scale with opacity otherwise
  if (opacity >= 1.0) {
    element.style.backdropFilter = 'none';
  } else if (opacity > 0.05) {
    const blurIntensity = Math.max(2, Math.min(12, 12 * opacity));
    element.style.backdropFilter = `blur(${blurIntensity}px)`;
  } else {
    element.style.backdropFilter = 'none';
  }

  // Set theme-aware CSS custom properties for dynamic elements
  const effectiveOpacity = themeStyles.effectiveOpacity || opacity;
  const accentColor = getAccentColorForTheme(themeStyles.gradientStyle, effectiveOpacity);

  element.style.setProperty('--theme-accent-bg', accentColor.background);
  element.style.setProperty('--theme-accent-border', accentColor.border);

  // Apply dynamic scaling if this is an overlay
  if (element.classList.contains('mga-overlay') || (element.id && element.id.includes('overlay'))) {
    const width = element.offsetWidth || 400;
    const scale = calculateScale(width);
    element.style.setProperty('--panel-scale', scale);
  }
}

/**
 * Calculate responsive scale factor based on width
 * Used for adaptive UI scaling
 *
 * @param {number} width - Element width in pixels
 * @returns {number} Scale factor (0.8 to 1.05)
 */
export function calculateScale(width) {
  let scale = 1;
  if (width < 350) {
    scale = 0.8;
  } else if (width < 450) {
    scale = 0.85;
  } else if (width < 550) {
    scale = 0.9;
  } else if (width < 650) {
    scale = 0.95;
  } else if (width >= 800) {
    scale = 1.05;
  }
  return scale;
}

/**
 * Get accent color configuration for a specific theme
 * Returns background gradient and border color for theme-specific styling
 *
 * @param {string} gradientStyle - Name of the gradient theme
 * @param {number} opacity - Effective opacity value (0.0 to 1.0)
 * @returns {Object} Accent color configuration {background, border}
 */
export function getAccentColorForTheme(gradientStyle, opacity) {
  // Define accent colors based on the current theme
  const accentColors = {
    'blue-purple': {
      background: `linear-gradient(135deg, rgba(74, 158, 255, ${opacity * 0.1}) 0%, rgba(147, 51, 234, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(74, 158, 255, ${opacity * 0.3})`
    },
    'green-blue': {
      background: `linear-gradient(135deg, rgba(34, 197, 94, ${opacity * 0.1}) 0%, rgba(59, 130, 246, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(34, 197, 94, ${opacity * 0.3})`
    },
    'red-orange': {
      background: `linear-gradient(135deg, rgba(239, 68, 68, ${opacity * 0.1}) 0%, rgba(249, 115, 22, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(239, 68, 68, ${opacity * 0.3})`
    },
    'purple-pink': {
      background: `linear-gradient(135deg, rgba(168, 85, 247, ${opacity * 0.1}) 0%, rgba(236, 72, 153, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(168, 85, 247, ${opacity * 0.3})`
    },
    'gold-yellow': {
      background: `linear-gradient(135deg, rgba(255, 215, 0, ${opacity * 0.1}) 0%, rgba(245, 158, 11, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(255, 215, 0, ${opacity * 0.3})`
    },
    'steel-blue': {
      background: `linear-gradient(135deg, rgba(30, 58, 138, ${opacity * 0.1}) 0%, rgba(51, 65, 85, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(30, 58, 138, ${opacity * 0.3})`
    },
    'chrome-silver': {
      background: `linear-gradient(135deg, rgba(203, 213, 225, ${opacity * 0.1}) 0%, rgba(148, 163, 184, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(203, 213, 225, ${opacity * 0.3})`
    },
    'titanium-gray': {
      background: `linear-gradient(135deg, rgba(107, 114, 128, ${opacity * 0.1}) 0%, rgba(156, 163, 175, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(107, 114, 128, ${opacity * 0.3})`
    },
    'electric-neon': {
      background: `linear-gradient(135deg, rgba(0, 100, 255, ${opacity * 0.1}) 0%, rgba(147, 51, 234, ${
        opacity * 0.1
      }) 100%)`,
      border: `rgba(0, 100, 255, ${opacity * 0.3})`
    },
    'rainbow-burst': {
      background: `linear-gradient(135deg, rgba(239, 68, 68, ${opacity * 0.08}) 0%, rgba(245, 158, 11, ${
        opacity * 0.08
      }) 25%, rgba(34, 197, 94, ${opacity * 0.08}) 50%, rgba(59, 130, 246, ${opacity * 0.08}) 75%, rgba(147, 51, 234, ${
        opacity * 0.08
      }) 100%)`,
      border: `rgba(147, 51, 234, ${opacity * 0.3})`
    }
  };

  return accentColors[gradientStyle] || accentColors['blue-purple'];
}

/**
 * Apply theme to dock element
 * Handles standard gradient themes with textures and effects
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.document - Document object for DOM queries
 * @param {Object} themeStyles - Theme configuration
 */
export function applyThemeToDock(deps, themeStyles) {
  const dock = deps.document.querySelector('#mgh-dock');
  if (!dock) return;

  // Apply theme background, border, and effects to dock
  dock.style.background = themeStyles.background;
  dock.style.border = `1px solid rgba(255, 255, 255, ${(themeStyles.opacity / 100) * 0.15})`;
  dock.style.boxShadow = themeStyles.boxShadow;
  dock.style.backdropFilter = 'blur(20px)';
}

/**
 * Apply accent colors to dock for black themes
 * Handles special styling for black accent themes
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.document - Document object for DOM queries
 * @param {Object} themeStyles - Theme configuration with accent colors
 */
export function applyAccentToDock(deps, themeStyles) {
  const dock = deps.document.querySelector('#mgh-dock');
  if (!dock) return;

  // Use actual user opacity setting
  const opacity = themeStyles.opacity / 100;

  // Apply black background with user-controlled opacity
  dock.style.background = `rgba(0, 0, 0, ${opacity})`;
  dock.style.border = `1px solid ${themeStyles.accentColor}`;

  // Combine base shadow with accent glow - enhanced by effect style
  let accentShadow = `0 8px 24px rgba(0, 0, 0, 0.8), 0 0 20px ${themeStyles.accentGlow}`;

  // Add effect-specific enhancements to the accent glow
  if (themeStyles.effectStyle === 'neon' || themeStyles.effectStyle === 'plasma') {
    accentShadow += `, 0 0 40px ${themeStyles.accentGlow}`;
  } else if (themeStyles.effectStyle === 'metallic' || themeStyles.effectStyle === 'steel') {
    accentShadow += `, inset 0 1px 0 rgba(255, 255, 255, 0.57)`;
  } else if (themeStyles.effectStyle === 'crystal' || themeStyles.effectStyle === 'glass') {
    accentShadow += `, 0 0 30px ${themeStyles.accentGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.73)`;
  }

  dock.style.boxShadow = accentShadow;

  // Scale backdrop blur with opacity, but disable at 100% for solid appearance
  if (opacity >= 1.0) {
    dock.style.backdropFilter = 'none';
  } else if (opacity > 0.05) {
    const blurIntensity = Math.max(2, Math.min(20, 20 * opacity));
    dock.style.backdropFilter = `blur(${blurIntensity}px)`;
  } else {
    dock.style.backdropFilter = 'none';
  }

  // Use CSS variables for hover effects (better performance)
  dock.style.setProperty('--accent-color', themeStyles.accentColor);
  dock.style.setProperty('--accent-glow', themeStyles.accentGlow);
}

/**
 * Apply theme to sidebar element
 * Handles standard gradient themes with textures
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.document - Document object for DOM queries
 * @param {Object} themeStyles - Theme configuration
 */
export function applyThemeToSidebar(deps, themeStyles) {
  const sidebar = deps.document.querySelector('#mgh-sidebar');
  if (!sidebar) return;

  // Apply theme background with textures, border, and effects to sidebar
  if (themeStyles.texturePattern) {
    sidebar.style.background = `${themeStyles.texturePattern}, ${themeStyles.background}`;
    sidebar.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
  } else {
    sidebar.style.background = themeStyles.background;
  }
  sidebar.style.borderRight = `1px solid rgba(255, 255, 255, ${(themeStyles.opacity / 100) * 0.15})`;
  sidebar.style.boxShadow = `4px 0 24px rgba(0, 0, 0, 0.6), ${themeStyles.boxShadow}`;
  sidebar.style.backdropFilter = 'blur(20px)';

  // Style sidebar header with textures
  const header = sidebar.querySelector('.mgh-sidebar-header');
  if (header) {
    if (themeStyles.texturePattern) {
      header.style.background = `${themeStyles.texturePattern}, ${themeStyles.background}`;
      header.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
    } else {
      header.style.background = themeStyles.background;
    }
    header.style.borderBottom = `1px solid rgba(255, 255, 255, ${(themeStyles.opacity / 100) * 0.2})`;
  }

  // Remove accent-specific CSS if it exists
  const existingStyle = deps.document.getElementById('accent-theme-styles');
  if (existingStyle) existingStyle.remove();
}

/**
 * Apply accent colors to sidebar for black themes
 * Injects dynamic CSS for hover effects and element styling
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.document - Document object for DOM queries and style injection
 * @param {Object} themeStyles - Theme configuration with accent colors
 */
export function applyAccentToSidebar(deps, themeStyles) {
  const sidebar = deps.document.querySelector('#mgh-sidebar');
  if (!sidebar) return;

  // Use actual user opacity setting
  const opacity = themeStyles.opacity / 100;

  // Apply solid black background with user-controlled opacity (no gradient tricks)
  if (themeStyles.texturePattern) {
    sidebar.style.background = `${themeStyles.texturePattern}, rgba(0, 0, 0, ${opacity})`;
    sidebar.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
  } else {
    sidebar.style.background = `rgba(0, 0, 0, ${opacity})`;
  }
  sidebar.style.borderRight = `2px solid ${themeStyles.accentColor}`;

  // Scale backdrop blur with opacity, but disable at 100% for solid appearance
  if (opacity >= 1.0) {
    sidebar.style.backdropFilter = 'none';
  } else if (opacity > 0.05) {
    const blurIntensity = Math.max(2, Math.min(20, 20 * opacity));
    sidebar.style.backdropFilter = `blur(${blurIntensity}px)`;
  } else {
    sidebar.style.backdropFilter = 'none';
  }

  // Enhanced shadow with effect-specific styling
  let sidebarShadow = `4px 0 24px rgba(0, 0, 0, 0.6), 0 0 20px ${themeStyles.accentGlow}`;

  // Add effect-specific enhancements
  if (themeStyles.effectStyle === 'neon' || themeStyles.effectStyle === 'plasma') {
    sidebarShadow += `, 0 0 40px ${themeStyles.accentGlow}`;
  } else if (themeStyles.effectStyle === 'crystal' || themeStyles.effectStyle === 'glass') {
    sidebarShadow += `, inset 0 1px 0 rgba(255, 255, 255, 0.57)`;
  }

  sidebar.style.boxShadow = sidebarShadow;

  // Style sidebar header with accent gradient and opacity
  const header = sidebar.querySelector('.mgh-sidebar-header');
  if (header) {
    header.style.background = `linear-gradient(90deg, rgba(0, 0, 0, ${opacity}) 0%, ${themeStyles.accentColor} 100%)`;
    header.style.borderBottom = `2px solid ${themeStyles.accentColor}`;

    // Enhanced header glow based on effect
    let headerGlow = `0 2px 20px ${themeStyles.accentGlow}`;
    if (themeStyles.effectStyle === 'neon' || themeStyles.effectStyle === 'plasma') {
      headerGlow += `, 0 0 30px ${themeStyles.accentGlow}`;
    }
    header.style.boxShadow = headerGlow;
  }

  // Use CSS variables for dynamic styling (better performance than event listeners)
  sidebar.style.setProperty('--accent-color', themeStyles.accentColor);
  sidebar.style.setProperty('--accent-glow', themeStyles.accentGlow);

  // Inject dynamic CSS for hover effects and other elements
  const style = deps.document.createElement('style');
  style.id = 'accent-theme-styles';
  const existingStyle = deps.document.getElementById('accent-theme-styles');
  if (existingStyle) existingStyle.remove();

  style.textContent = `
        /* Sidebar sections - ONLY MGTools elements */
        #mgh-sidebar .mga-section {
            background: ${themeStyles.accentColor}05;
            border: 1px solid ${themeStyles.accentColor}33;
        }

        /* Buttons - ONLY in sidebar */
        #mgh-sidebar button.mga-button,
        #mgh-sidebar button.mga-btn {
            background: linear-gradient(135deg, ${themeStyles.accentColor}AA, ${themeStyles.accentColor});
            border: 1px solid ${themeStyles.accentColor};
        }
        #mgh-sidebar button.mga-button:hover,
        #mgh-sidebar button.mga-btn:hover {
            background: linear-gradient(135deg, ${themeStyles.accentColor}, ${themeStyles.accentColor}FF);
            box-shadow: 0 0 15px ${themeStyles.accentGlow};
        }

        /* Inputs - ONLY mga-prefixed classes */
        #mgh-sidebar input.mga-slider,
        #mgh-sidebar select.mga-select,
        #mgh-sidebar textarea.mga-textarea {
            border-color: ${themeStyles.accentColor}66;
        }
        #mgh-sidebar input.mga-slider:focus,
        #mgh-sidebar select.mga-select:focus,
        #mgh-sidebar textarea.mga-textarea:focus {
            border-color: ${themeStyles.accentColor};
            box-shadow: 0 0 10px ${themeStyles.accentGlow};
        }

        /* Scrollbar - ONLY sidebar scrollbar */
        #mgh-sidebar .mgh-sidebar-body::-webkit-scrollbar-thumb {
            background: linear-gradient(180deg, ${themeStyles.accentColor}, ${themeStyles.accentColor}AA);
        }
        #mgh-sidebar .mgh-sidebar-body::-webkit-scrollbar-thumb:hover {
            background: ${themeStyles.accentColor};
        }
    `;
  deps.document.head.appendChild(style);
}

/**
 * Apply theme to popout widget element
 * Handles both black accent themes and standard gradient themes
 *
 * @param {Object} deps - Dependencies object (currently unused but kept for consistency)
 * @param {HTMLElement} popout - Popout widget element
 * @param {Object} themeStyles - Theme configuration
 */
export function applyThemeToPopoutWidget(deps, popout, themeStyles) {
  if (!popout || !themeStyles) return;

  const isBlackTheme = themeStyles.gradientStyle && themeStyles.gradientStyle.startsWith('black-');

  // Use popout opacity setting (note: themeStyles is generated with isPopout flag)
  const opacity = themeStyles.opacity / 100;

  if (isBlackTheme && themeStyles.accentColor) {
    // Black themes: black background with user opacity and vibrant accents
    if (themeStyles.texturePattern) {
      popout.style.background = `${themeStyles.texturePattern}, rgba(0, 0, 0, ${opacity})`;
      popout.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
    } else {
      popout.style.background = `rgba(0, 0, 0, ${opacity})`;
    }
    popout.style.border = `1px solid ${themeStyles.accentColor}`;

    // Enhanced shadow with effect-specific styling
    let shadow = `0 8px 32px rgba(0, 0, 0, 0.6), 0 0 20px ${themeStyles.accentGlow}`;

    // Add effect-specific enhancements
    if (themeStyles.effectStyle === 'neon' || themeStyles.effectStyle === 'plasma') {
      shadow += `, 0 0 40px ${themeStyles.accentGlow}`;
    } else if (themeStyles.effectStyle === 'metallic' || themeStyles.effectStyle === 'steel') {
      shadow += `, inset 0 1px 0 rgba(255, 255, 255, 0.57)`;
    } else if (themeStyles.effectStyle === 'crystal' || themeStyles.effectStyle === 'glass') {
      shadow += `, 0 0 30px ${themeStyles.accentGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.73)`;
    }

    popout.style.boxShadow = shadow;

    // Style header with accent gradient and opacity
    const header = popout.querySelector('.mgh-popout-header');
    if (header) {
      header.style.background = `linear-gradient(90deg, rgba(0, 0, 0, ${opacity}) 0%, ${themeStyles.accentColor} 100%)`;
      header.style.borderBottom = `1px solid ${themeStyles.accentColor}`;

      // Enhanced header glow based on effect
      let headerGlow = `0 2px 20px ${themeStyles.accentGlow}`;
      if (themeStyles.effectStyle === 'neon' || themeStyles.effectStyle === 'plasma') {
        headerGlow += `, 0 0 30px ${themeStyles.accentGlow}`;
      }
      header.style.boxShadow = headerGlow;
    }

    // Body background with opacity for black themes
    const body = popout.querySelector('.mgh-popout-body');
    if (body) {
      if (themeStyles.texturePattern) {
        body.style.background = `${themeStyles.texturePattern}, rgba(0, 0, 0, ${opacity})`;
        body.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
      } else {
        body.style.background = `rgba(0, 0, 0, ${opacity})`;
      }
    }
  } else {
    // Regular themes: use gradient background with textures
    if (themeStyles.texturePattern) {
      popout.style.background = `${themeStyles.texturePattern}, ${themeStyles.background}`;
      popout.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
    } else {
      popout.style.background = themeStyles.background;
    }
    popout.style.border = `1px solid rgba(255, 255, 255, ${(themeStyles.opacity / 100) * 0.15})`;
    popout.style.boxShadow = themeStyles.boxShadow;

    // Style header
    const header = popout.querySelector('.mgh-popout-header');
    if (header) {
      if (themeStyles.texturePattern) {
        header.style.background = `${themeStyles.texturePattern}, ${themeStyles.background}`;
        header.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
      } else {
        header.style.background = themeStyles.background;
      }
      header.style.borderBottom = `1px solid rgba(255, 255, 255, ${(themeStyles.opacity / 100) * 0.2})`;
    }

    // Keep body background solid for content readability
    const body = popout.querySelector('.mgh-popout-body');
    if (body) {
      if (themeStyles.texturePattern) {
        body.style.background = `${themeStyles.texturePattern}, ${themeStyles.background}`;
        body.style.backgroundSize = `${themeStyles.textureBackgroundSize}, cover`;
      } else {
        body.style.background = themeStyles.background; // Match theme gradient
      }
    }
  }

  popout.style.backdropFilter = 'blur(20px)';
}

/**
 * Apply ultra-compact mode to panel element
 * Reduces spacing, font sizes, and overall dimensions
 *
 * @param {Object} deps - Dependencies object
 * @param {Function} deps.productionLog - Production logging function
 * @param {Function} deps.updateTabContent - Function to refresh tab content
 * @param {HTMLElement} panel - Panel element to modify
 * @param {Object} state - State object containing activeTab
 * @param {boolean} enabled - Whether to enable or disable ultra-compact mode
 */
export function applyUltraCompactMode(deps, panel, state, enabled) {
  if (!panel) return;

  if (enabled) {
    // Apply ultra-compact styles
    panel.style.cssText += `
            --mga-font-size: 11px;
            --mga-section-padding: 6px;
            --mga-header-padding: 8px 12px;
            --mga-button-padding: 4px 8px;
            --mga-input-padding: 4px 6px;
            --mga-tab-height: 32px;
            --mga-spacing: 4px;
            min-width: 250px;
            font-size: 11px;
        `;

    // Add ultra-compact class for specific styling
    panel.classList.add('mga-ultra-compact');

    // Reduce overall panel size
    const currentWidth = parseInt(panel.style.width) || 800;
    const currentHeight = parseInt(panel.style.height) || 600;
    panel.style.width = Math.max(250, currentWidth * 0.7) + 'px';
    panel.style.height = Math.max(300, currentHeight * 0.8) + 'px';
  } else {
    // Remove ultra-compact styles
    panel.classList.remove('mga-ultra-compact');

    // Restore normal CSS variables
    panel.style.cssText = panel.style.cssText.replace(/--mga-[^;]+;/g, '');

    // Restore normal size - remove restrictions
    panel.style.minWidth = '250px';
    panel.style.maxWidth = '';
    panel.style.fontSize = '13px';
  }

  // Force re-render of current tab to apply new styles
  if (state.activeTab && deps.updateTabContent) {
    deps.updateTabContent();
  }

  deps.productionLog(`Ultra-compact mode ${enabled ? 'applied' : 'removed'}`);
}

/**
 * Apply dynamic scaling to element based on width
 * Uses cached scale calculations for performance
 *
 * @param {HTMLElement} element - Element to apply scaling to
 * @param {number} width - Element width in pixels
 * @param {Map} scaleCache - Cache for scale calculations
 */
export function applyDynamicScaling(element, width, scaleCache) {
  // Don't override ultra-compact mode
  if (element.classList.contains('mga-ultra-compact')) {
    return;
  }

  // Use cached scale if available for this width range
  const widthRange = Math.floor(width / 50) * 50; // Round to nearest 50px
  let scale = scaleCache.get(widthRange);

  if (scale === undefined) {
    // Calculate scale only once per range
    scale = calculateScale(width);
    scaleCache.set(widthRange, scale);
  }

  // Only update if scale changed (avoid string conversion cost)
  const lastScale = element._lastScale;
  if (lastScale !== scale) {
    element._lastScale = scale;
    element.style.setProperty('--panel-scale', scale);
  }
}

/**
 * Update tab responsiveness by scrolling active tab into view
 * Ensures active tab is visible when tabs overflow container
 *
 * @param {HTMLElement} element - Container element with tabs
 */
export function updateTabResponsiveness(element) {
  // This function handles scrolling the active tab into view if needed
  const tabs = element.querySelectorAll('.mga-tab');
  const tabsContainer = element.querySelector('.mga-tabs');

  if (!tabsContainer || tabs.length === 0) return;

  // Ensure active tab is visible by scrolling if necessary
  const activeTab = element.querySelector('.mga-tab.active');
  if (activeTab && tabsContainer.scrollWidth > tabsContainer.clientWidth) {
    const tabRect = activeTab.getBoundingClientRect();
    const containerRect = tabsContainer.getBoundingClientRect();

    if (tabRect.right > containerRect.right) {
      tabsContainer.scrollLeft += tabRect.right - containerRect.right + 10;
    } else if (tabRect.left < containerRect.left) {
      tabsContainer.scrollLeft -= containerRect.left - tabRect.left + 10;
    }
  }
}

/**
 * Sync theme to all popout windows
 * Updates theme styling across all open popout widgets
 *
 * @param {Object} deps - Dependencies object
 * @param {Document} deps.targetDocument - Target document
 * @param {Object} deps.UnifiedState - Unified state object with settings
 * @param {Function} deps.generateThemeStyles - Theme style generator
 * @param {Function} deps.applyThemeToPopoutWidget - Apply theme to popout
 * @returns {void}
 */
export function syncThemeToAllWindows(deps = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    generateThemeStyles: generateTheme = generateThemeStyles,
    applyThemeToPopoutWidget: applyTheme = applyThemeToPopoutWidget
  } = deps;

  if (!targetDocument || !UnifiedState) return;

  try {
    // Get current theme settings
    const settings = UnifiedState.data?.settings;
    if (!settings) return;

    // Generate theme styles for popouts (using popout opacity)
    const themeStyles = generateTheme(deps, settings, true);
    if (!themeStyles) return;

    // Find all popout windows
    const popouts = targetDocument.querySelectorAll('.mga-popout-window');

    // Apply theme to each popout
    popouts.forEach(popout => {
      if (popout && popout.isConnected) {
        applyTheme(deps, popout, themeStyles);
      }
    });
  } catch (error) {
    console.error('[MGTools] Failed to sync theme to windows:', error);
  }
}
