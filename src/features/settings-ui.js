/**
 * Settings UI System
 *
 * Comprehensive settings interface providing:
 * - Theme customization (54 gradients, 10 effects, 24 textures)
 * - Texture controls (intensity, scale, blend mode)
 * - Quick presets (9 theme presets)
 * - UI mode toggles (ultra-compact, hide feed buttons, overlays)
 * - Compatibility Mode integration
 * - Developer options (debug modes, hide weather)
 * - Data management (export/import, reset, clear)
 *
 * @module features/settings-ui
 */

/**
 * Get Settings tab content HTML
 *
 * Generates comprehensive settings interface with full theme customization,
 * UI mode controls, compatibility mode toggle, and data management tools.
 *
 * Theme Options:
 * - 54 gradient styles (31 black accent + 5 classic + 9 vibrant + 4 metallic + 5 custom)
 * - 10 effect styles (none, metallic, glass, neon, plasma, aurora, crystal, steel, chrome, titanium)
 * - 24 texture overlays grouped by category (Modern Glass, Premium Materials, Tech/Futuristic, Geometric, Special Effects)
 *
 * Texture Controls:
 * - Intensity slider (0-100%)
 * - Scale buttons (small, medium, large)
 * - Blend mode selector (overlay, multiply, screen, soft-light)
 *
 * Quick Presets:
 * - Gaming, Minimal, Vibrant, Dark, Luxury, Steel, Chrome, Titanium, Reset
 *
 * UI Mode Toggles:
 * - Ultra-compact mode
 * - Hide instant feed buttons
 * - Use in-game overlays
 *
 * Compatibility Mode:
 * - Enable/disable toggle with status display
 * - Detailed explanation of functionality
 *
 * Developer Options:
 * - Debug mode toggle
 * - Room debug mode toggle
 * - Hide weather effects toggle
 *
 * Data Management:
 * - Export settings to JSON
 * - Import settings from JSON
 * - Reset pet loadouts
 * - Clear all hotkeys
 *
 * @param {object} dependencies - Injected dependencies
 * @param {object} [dependencies.UnifiedState] - Unified state object with settings data
 * @param {object} [dependencies.CompatibilityMode] - Compatibility mode object with flags
 * @returns {string} HTML content for settings tab
 *
 * @example
 * const html = getSettingsTabContent({ UnifiedState, CompatibilityMode });
 * container.innerHTML = html;
 */
export function getSettingsTabContent(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    CompatibilityMode = typeof window !== 'undefined' && window.CompatibilityMode
  } = dependencies;

  const settings = UnifiedState.data.settings;

  return `
          <div class="mga-section">
              <div class="mga-section-title">Appearance</div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Main HUD Opacity: ${settings.opacity}%
                  </label>
                  <input type="range" class="mga-slider" id="opacity-slider"
                         min="0" max="100" value="${settings.opacity}"
                         style="width: 100%; accent-color: #4a9eff;">
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Pop-out Opacity: ${settings.popoutOpacity}%
                  </label>
                  <input type="range" class="mga-slider" id="popout-opacity-slider"
                         min="0" max="100" value="${settings.popoutOpacity}"
                         style="width: 100%; accent-color: #4a9eff;">
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Gradient Style
                  </label>
                  <select class="mga-select" id="gradient-select" style="margin-bottom: 8px;">
                      <optgroup label="⚫ Black Accent Themes">
                          <option value="black-void" ${settings.gradientStyle === 'black-void' ? 'selected' : ''}>⚫⬛ Pure Void</option>
                          <option value="black-crimson" ${settings.gradientStyle === 'black-crimson' ? 'selected' : ''}>⚫🔴 Midnight Crimson</option>
                          <option value="black-emerald" ${settings.gradientStyle === 'black-emerald' ? 'selected' : ''}>⚫💚 Shadow Emerald</option>
                          <option value="black-royal" ${settings.gradientStyle === 'black-royal' ? 'selected' : ''}>⚫💜 Void Royal</option>
                          <option value="black-gold" ${settings.gradientStyle === 'black-gold' ? 'selected' : ''}>⚫💛 Obsidian Gold</option>
                          <option value="black-ice" ${settings.gradientStyle === 'black-ice' ? 'selected' : ''}>⚫💙 Carbon Ice</option>
                          <option value="black-flame" ${settings.gradientStyle === 'black-flame' ? 'selected' : ''}>⚫🧡 Inferno Black</option>
                          <option value="black-toxic" ${settings.gradientStyle === 'black-toxic' ? 'selected' : ''}>⚫☢️ Toxic Shadow</option>
                          <option value="black-pink" ${settings.gradientStyle === 'black-pink' ? 'selected' : ''}>⚫💗 Noir Pink</option>
                          <option value="black-matrix" ${settings.gradientStyle === 'black-matrix' ? 'selected' : ''}>⚫🟢 Matrix Black</option>
                          <option value="black-sunset" ${settings.gradientStyle === 'black-sunset' ? 'selected' : ''}>⚫🌅 Eclipse Sunset</option>
                          <option value="black-blood" ${settings.gradientStyle === 'black-blood' ? 'selected' : ''}>⚫🩸 Midnight Blood</option>
                          <option value="black-neon" ${settings.gradientStyle === 'black-neon' ? 'selected' : ''}>⚫⚡ Shadow Neon</option>
                          <option value="black-storm" ${settings.gradientStyle === 'black-storm' ? 'selected' : ''}>⚫⛈️ Obsidian Storm</option>
                          <option value="black-sapphire" ${settings.gradientStyle === 'black-sapphire' ? 'selected' : ''}>⚫💠 Void Sapphire</option>
                          <option value="black-aqua" ${settings.gradientStyle === 'black-aqua' ? 'selected' : ''}>⚫🌊 Dark Aqua</option>
                          <option value="black-phantom" ${settings.gradientStyle === 'black-phantom' ? 'selected' : ''}>⚫🪙 Phantom Silver</option>
                          <option value="black-violet" ${settings.gradientStyle === 'black-violet' ? 'selected' : ''}>⚫💜 Deep Violet</option>
                          <option value="black-amber" ${settings.gradientStyle === 'black-amber' ? 'selected' : ''}>⚫🟠 Shadow Amber</option>
                          <option value="black-jade" ${settings.gradientStyle === 'black-jade' ? 'selected' : ''}>⚫🟢 Mystic Jade</option>
                          <option value="black-coral" ${settings.gradientStyle === 'black-coral' ? 'selected' : ''}>⚫🪸 Dark Coral</option>
                          <option value="black-steel" ${settings.gradientStyle === 'black-steel' ? 'selected' : ''}>⚫🔵 Carbon Steel</option>
                          <option value="black-lavender" ${settings.gradientStyle === 'black-lavender' ? 'selected' : ''}>⚫💜 Void Lavender</option>
                          <option value="black-mint" ${settings.gradientStyle === 'black-mint' ? 'selected' : ''}>⚫🌿 Shadow Mint</option>
                          <option value="black-ruby" ${settings.gradientStyle === 'black-ruby' ? 'selected' : ''}>⚫💎 Obsidian Ruby</option>
                          <option value="black-cobalt" ${settings.gradientStyle === 'black-cobalt' ? 'selected' : ''}>⚫🔷 Deep Cobalt</option>
                          <option value="black-bronze" ${settings.gradientStyle === 'black-bronze' ? 'selected' : ''}>⚫🟤 Dark Bronze</option>
                          <option value="black-teal" ${settings.gradientStyle === 'black-teal' ? 'selected' : ''}>⚫🩵 Shadow Teal</option>
                          <option value="black-magenta" ${settings.gradientStyle === 'black-magenta' ? 'selected' : ''}>⚫🩷 Void Magenta</option>
                          <option value="black-lime" ${settings.gradientStyle === 'black-lime' ? 'selected' : ''}>⚫🟢 Electric Lime</option>
                          <option value="black-indigo" ${settings.gradientStyle === 'black-indigo' ? 'selected' : ''}>⚫💙 Midnight Indigo</option>
                      </optgroup>
                      <optgroup label="🌈 Classic Themes">
                          <option value="blue-purple" ${settings.gradientStyle === 'blue-purple' ? 'selected' : ''}>🌌 Blue-Purple</option>
                          <option value="green-blue" ${settings.gradientStyle === 'green-blue' ? 'selected' : ''}>🌊 Green-Blue</option>
                          <option value="red-orange" ${settings.gradientStyle === 'red-orange' ? 'selected' : ''}>🔥 Red-Orange</option>
                          <option value="purple-pink" ${settings.gradientStyle === 'purple-pink' ? 'selected' : ''}>💜 Purple-Pink</option>
                          <option value="gold-yellow" ${settings.gradientStyle === 'gold-yellow' ? 'selected' : ''}>👑 Gold-Yellow</option>
                      </optgroup>
                      <optgroup label="✨ Vibrant Themes">
                          <option value="electric-neon" ${settings.gradientStyle === 'electric-neon' ? 'selected' : ''}>⚡ Electric Neon</option>
                          <option value="sunset-fire" ${settings.gradientStyle === 'sunset-fire' ? 'selected' : ''}>🌅 Sunset Fire</option>
                          <option value="emerald-cyan" ${settings.gradientStyle === 'emerald-cyan' ? 'selected' : ''}>💎 Emerald Cyan</option>
                          <option value="royal-gold" ${settings.gradientStyle === 'royal-gold' ? 'selected' : ''}>🏆 Royal Gold</option>
                          <option value="crimson-blaze" ${settings.gradientStyle === 'crimson-blaze' ? 'selected' : ''}>🔥 Crimson Blaze</option>
                          <option value="ocean-deep" ${settings.gradientStyle === 'ocean-deep' ? 'selected' : ''}>🌊 Ocean Deep</option>
                          <option value="forest-mystique" ${settings.gradientStyle === 'forest-mystique' ? 'selected' : ''}>🌲 Forest Mystique</option>
                          <option value="cosmic-purple" ${settings.gradientStyle === 'cosmic-purple' ? 'selected' : ''}>🌌 Cosmic Purple</option>
                          <option value="rainbow-burst" ${settings.gradientStyle === 'rainbow-burst' ? 'selected' : ''}>🌈 Rainbow Burst</option>
                      </optgroup>
                      <optgroup label="🛡️ Metallic Themes">
                          <option value="steel-blue" ${settings.gradientStyle === 'steel-blue' ? 'selected' : ''}>🛡️ Steel Blue</option>
                          <option value="chrome-silver" ${settings.gradientStyle === 'chrome-silver' ? 'selected' : ''}>⚪ Chrome Silver</option>
                          <option value="titanium-gray" ${settings.gradientStyle === 'titanium-gray' ? 'selected' : ''}>🌫️ Titanium Gray</option>
                          <option value="platinum-white" ${settings.gradientStyle === 'platinum-white' ? 'selected' : ''}>💍 Platinum White</option>
                      </optgroup>
                  </select>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Effect Style
                  </label>
                  <select class="mga-select" id="effect-select">
                      <option value="none" ${settings.effectStyle === 'none' ? 'selected' : ''}>✨ None</option>
                      <option value="metallic" ${settings.effectStyle === 'metallic' ? 'selected' : ''}>⚡ Metallic</option>
                      <option value="glass" ${settings.effectStyle === 'glass' ? 'selected' : ''}>💎 Glass</option>
                      <option value="neon" ${settings.effectStyle === 'neon' ? 'selected' : ''}>🌟 Neon Glow</option>
                      <option value="plasma" ${settings.effectStyle === 'plasma' ? 'selected' : ''}>🔥 Plasma</option>
                      <option value="aurora" ${settings.effectStyle === 'aurora' ? 'selected' : ''}>🌌 Aurora</option>
                      <option value="crystal" ${settings.effectStyle === 'crystal' ? 'selected' : ''}>💠 Crystal</option>
                      <option value="steel" ${settings.effectStyle === 'steel' ? 'selected' : ''}>🛡️ Steel</option>
                      <option value="chrome" ${settings.effectStyle === 'chrome' ? 'selected' : ''}>⚪ Chrome</option>
                      <option value="titanium" ${settings.effectStyle === 'titanium' ? 'selected' : ''}>🌫️ Titanium</option>
                  </select>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Texture Overlay
                  </label>
                  <select class="mga-select" id="texture-select">
                      <option value="none" ${settings.textureStyle === 'none' || !settings.textureStyle ? 'selected' : ''}>🚫 None</option>

                      <optgroup label="🌟 Modern Glass">
                          <option value="frosted-glass" ${settings.textureStyle === 'frosted-glass' ? 'selected' : ''}>❄️ Frosted Glass</option>
                          <option value="crystal-prism" ${settings.textureStyle === 'crystal-prism' ? 'selected' : ''}>💎 Crystal Prism</option>
                          <option value="ice-frost" ${settings.textureStyle === 'ice-frost' ? 'selected' : ''}>🧊 Ice Frost</option>
                          <option value="smoke-flow" ${settings.textureStyle === 'smoke-flow' ? 'selected' : ''}>💨 Smoke Flow</option>
                          <option value="water-ripple" ${settings.textureStyle === 'water-ripple' ? 'selected' : ''}>🌊 Water Ripple</option>
                      </optgroup>

                      <optgroup label="⚙️ Premium Materials">
                          <option value="carbon-fiber-pro" ${settings.textureStyle === 'carbon-fiber-pro' ? 'selected' : ''}>🏁 Carbon Fiber Pro</option>
                          <option value="brushed-aluminum" ${settings.textureStyle === 'brushed-aluminum' ? 'selected' : ''}>⚪ Brushed Aluminum</option>
                          <option value="brushed-titanium" ${settings.textureStyle === 'brushed-titanium' ? 'selected' : ''}>⚫ Brushed Titanium</option>
                          <option value="leather-grain" ${settings.textureStyle === 'leather-grain' ? 'selected' : ''}>🧳 Leather Grain</option>
                          <option value="fabric-weave" ${settings.textureStyle === 'fabric-weave' ? 'selected' : ''}>🧵 Fabric Weave</option>
                          <option value="wood-grain" ${settings.textureStyle === 'wood-grain' ? 'selected' : ''}>🪵 Wood Grain</option>
                      </optgroup>

                      <optgroup label="⚡ Tech/Futuristic">
                          <option value="circuit-board" ${settings.textureStyle === 'circuit-board' ? 'selected' : ''}>🔌 Circuit Board</option>
                          <option value="hexagon-grid-pro" ${settings.textureStyle === 'hexagon-grid-pro' ? 'selected' : ''}>⬡ Hexagon Grid Pro</option>
                          <option value="hologram-scan" ${settings.textureStyle === 'hologram-scan' ? 'selected' : ''}>📡 Hologram Scan</option>
                          <option value="matrix-rain" ${settings.textureStyle === 'matrix-rain' ? 'selected' : ''}>💚 Matrix Rain</option>
                          <option value="energy-waves" ${settings.textureStyle === 'energy-waves' ? 'selected' : ''}>⚡ Energy Waves</option>
                          <option value="cyberpunk-grid" ${settings.textureStyle === 'cyberpunk-grid' ? 'selected' : ''}>🔷 Cyberpunk Grid</option>
                      </optgroup>

                      <optgroup label="📐 Geometric Clean">
                          <option value="dots-pro" ${settings.textureStyle === 'dots-pro' ? 'selected' : ''}>⚫ Dots Professional</option>
                          <option value="grid-pro" ${settings.textureStyle === 'grid-pro' ? 'selected' : ''}>⬜ Grid Professional</option>
                          <option value="diagonal-pro" ${settings.textureStyle === 'diagonal-pro' ? 'selected' : ''}>📐 Diagonal Pro</option>
                          <option value="waves" ${settings.textureStyle === 'waves' ? 'selected' : ''}>〰️ Waves</option>
                          <option value="triangles" ${settings.textureStyle === 'triangles' ? 'selected' : ''}>🔺 Triangles</option>
                          <option value="crosshatch" ${settings.textureStyle === 'crosshatch' ? 'selected' : ''}>✖️ Crosshatch</option>
                      </optgroup>

                      <optgroup label="🎪 Special Effects">
                          <option value="perlin-noise" ${settings.textureStyle === 'perlin-noise' ? 'selected' : ''}>📺 Perlin Noise</option>
                          <option value="gradient-mesh" ${settings.textureStyle === 'gradient-mesh' ? 'selected' : ''}>🌈 Gradient Mesh</option>
                      </optgroup>
                  </select>
              </div>

              <!-- Texture Intensity Slider -->
              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                      <span>Texture Intensity</span>
                      <span id="texture-intensity-value" style="color: #4a9eff; font-weight: 600;">${settings.textureIntensity !== undefined ? settings.textureIntensity : 75}%</span>
                  </label>
                  <input type="range" id="texture-intensity-slider" min="0" max="100" value="${settings.textureIntensity !== undefined ? settings.textureIntensity : 75}"
                         style="width: 100%; height: 6px; border-radius: 3px; background: linear-gradient(90deg, rgba(74, 158, 255, 0.48) 0%, rgba(74,158,255,0.8) 100%); outline: none; cursor: pointer;">
              </div>

              <!-- Texture Scale Control -->
              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Texture Scale
                  </label>
                  <div style="display: flex; gap: 8px;">
                      <button class="mga-btn mga-btn-sm texture-scale-btn" data-scale="small" style="flex: 1; ${settings.textureScale === 'small' ? 'background: #4a9eff; color: white;' : ''}">Small</button>
                      <button class="mga-btn mga-btn-sm texture-scale-btn" data-scale="medium" style="flex: 1; ${settings.textureScale === 'medium' || !settings.textureScale ? 'background: #4a9eff; color: white;' : ''}">Medium</button>
                      <button class="mga-btn mga-btn-sm texture-scale-btn" data-scale="large" style="flex: 1; ${settings.textureScale === 'large' ? 'background: #4a9eff; color: white;' : ''}">Large</button>
                  </div>
              </div>

              <!-- Blend Mode Selector -->
              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Blend Mode
                  </label>
                  <select class="mga-select" id="texture-blend-mode">
                      <option value="overlay" ${settings.textureBlendMode === 'overlay' || !settings.textureBlendMode ? 'selected' : ''}>Overlay (Balanced)</option>
                      <option value="multiply" ${settings.textureBlendMode === 'multiply' ? 'selected' : ''}>Multiply (Darken)</option>
                      <option value="screen" ${settings.textureBlendMode === 'screen' ? 'selected' : ''}>Screen (Lighten)</option>
                      <option value="soft-light" ${settings.textureBlendMode === 'soft-light' ? 'selected' : ''}>Soft Light (Subtle)</option>
                  </select>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">Quick Presets</div>
              <div class="mga-grid">
                  <button class="mga-btn mga-btn-sm" data-preset="gaming">🎮 Gaming</button>
                  <button class="mga-btn mga-btn-sm" data-preset="minimal">⚪ Minimal</button>
                  <button class="mga-btn mga-btn-sm" data-preset="vibrant">🌈 Vibrant</button>
                  <button class="mga-btn mga-btn-sm" data-preset="dark">⚫ Dark</button>
                  <button class="mga-btn mga-btn-sm" data-preset="luxury">✨ Luxury</button>
                  <button class="mga-btn mga-btn-sm" data-preset="steel">🛡️ Steel</button>
                  <button class="mga-btn mga-btn-sm" data-preset="chrome">⚪ Chrome</button>
                  <button class="mga-btn mga-btn-sm" data-preset="titanium">🌫️ Titanium</button>
                  <button class="mga-btn mga-btn-sm" data-preset="reset">🔄 Reset</button>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">UI Mode</div>
              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="ultra-compact-checkbox" class="mga-checkbox"
                             ${settings.ultraCompactMode ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>📱 Ultra-compact mode</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      Maximum space efficiency with condensed layouts and smaller text.
                  </p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">Pet Interface</div>
              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="hide-feed-buttons-checkbox" class="mga-checkbox"
                             ${settings.hideFeedButtons ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🍃 Hide instant feed buttons</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      Hide the 3 quick-feed buttons next to active pet avatars. Applies immediately without page reload.
                  </p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">Pop-out Behavior</div>
              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="use-overlays-checkbox" class="mga-checkbox"
                             ${settings.useInGameOverlays ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🎮 Use in-game overlays instead of separate windows</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      When enabled, tabs will open as draggable overlays within the game window instead of separate browser windows.
                  </p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🛡️ Compatibility Mode</div>
              <div style="margin-bottom: 16px;">
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px;
                              background: ${typeof CompatibilityMode !== 'undefined' && CompatibilityMode.flags.enabled ? 'rgba(34, 197, 94, 0.30)' : 'rgba(255, 255, 255, 0.05)'};
                              border: 1px solid ${typeof CompatibilityMode !== 'undefined' && CompatibilityMode.flags.enabled ? 'rgba(34, 197, 94, 0.3)' : 'rgba(255, 255, 255, 0.57)'};
                              border-radius: 8px; margin-bottom: 12px;">
                      <div>
                          <div style="font-weight: 600; margin-bottom: 4px;">
                              ${typeof CompatibilityMode !== 'undefined' && CompatibilityMode.flags.enabled ? '✅ Enabled' : '⚪ Disabled'}
                          </div>
                          <div style="font-size: 11px; color: #aaa;">
                              ${
                                typeof CompatibilityMode !== 'undefined' && CompatibilityMode.flags.enabled
                                  ? 'Reason: ' + (CompatibilityMode.detectionReason || 'manual')
                                  : 'Auto-detects CSP restrictions'
                              }
                          </div>
                      </div>
                      <button id="compat-toggle-btn" class="mga-btn mga-btn-sm"
                              style="padding: 8px 16px; font-size: 12px; min-width: 100px;">
                          ${typeof CompatibilityMode !== 'undefined' && CompatibilityMode.flags.enabled ? 'Disable' : 'Force Enable'}
                      </button>
                  </div>
                  <p style="font-size: 11px; color: #aaa; line-height: 1.6;">
                      <strong>What it does:</strong><br>
                      • Bypasses CSP restrictions for Discord/managed devices<br>
                      • Uses system fonts instead of Google Fonts<br>
                      • Forces WebSocket reconnection even when tab is hidden<br>
                      • Uses GM_xmlhttpRequest for external network requests<br>
                      <br>
                      <strong>When to use:</strong><br>
                      • Playing in Discord Activities<br>
                      • Work/school computers with strict security policies<br>
                      • Browser extensions or embeds<br>
                      <br>
                      <em style="opacity: 0.7;">Note: Changes require page refresh</em>
                  </p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">Developer Options</div>
              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="debug-mode-checkbox" class="mga-checkbox"
                             ${settings.debugMode ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🐛 Enable Debug Mode</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      Shows detailed console logs for troubleshooting pet hunger, notifications, and more.
                  </p>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="room-debug-mode-checkbox" class="mga-checkbox"
                             ${settings.roomDebugMode ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🌐 Enable Room Debug Mode</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      Shows detailed console logs for room API requests and player count fetching.
                  </p>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="hide-weather-checkbox" class="mga-checkbox"
                             ${settings.hideWeather ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🌧️ Hide Weather Effects</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      Hide visual weather effects like snow, rain, and other weather animations for better performance.
                  </p>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">Data Management</div>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <button class="mga-btn mga-btn-sm" id="export-settings-btn">Export Settings</button>
                  <button class="mga-btn mga-btn-sm" id="import-settings-btn">Import Settings</button>
                  <button class="mga-btn mga-btn-sm" id="reset-loadouts-btn" style="background: #dc2626;">Reset Pet Loadouts</button>
                  <button class="mga-btn mga-btn-sm" id="clear-hotkeys-btn" style="background: #ea580c;">Clear All Hotkeys</button>
              </div>
              <p style="font-size: 11px; color: #aaa; margin-top: 4px;">
                  Reset button clears all saved pet loadouts. Clear hotkeys button removes all preset hotkey assignments.
              </p>
          </div>
      `;
}

/**
 * Setup Settings tab event handlers
 *
 * Attaches event listeners for all settings controls including:
 * - Compatibility Mode toggle
 * - Opacity sliders (main HUD + popout)
 * - Theme selectors (gradient, effect, texture)
 * - Texture controls (intensity, scale, blend mode)
 * - Quick preset buttons
 * - UI mode checkboxes
 * - Developer options
 * - Data management buttons (export, import, reset, clear)
 *
 * Handler Behavior:
 * - All changes auto-save to storage via MGA_saveJSON
 * - Theme changes apply immediately
 * - Ultra-compact mode applies on toggle
 * - Feed button visibility toggles instantly
 * - Weather effects apply on toggle
 * - Import/export use browser file APIs
 * - Reset/clear require confirmation
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Element} [dependencies.context=document] - DOM context for querySelector (document or custom element)
 * @param {object} [dependencies.UnifiedState] - Unified state object for data access
 * @param {object} [dependencies.CompatibilityMode] - Compatibility mode object
 * @param {Function} [dependencies.applyTheme] - Theme application function
 * @param {Function} [dependencies.syncThemeToAllWindows] - Cross-window theme sync function
 * @param {Function} [dependencies.applyPreset] - Preset application function
 * @param {Function} [dependencies.applyUltraCompactMode] - Ultra compact mode function
 * @param {Function} [dependencies.applyWeatherSetting] - Weather setting function
 * @param {Function} [dependencies.MGA_saveJSON] - Settings persistence function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.logInfo] - Info logging function
 * @param {Document} [dependencies.targetDocument] - Target document for DOM manipulation
 * @param {Function} [dependencies.updateTabContent] - Tab content update function
 * @param {Function} [dependencies.showNotificationToast] - Toast notification function
 * @param {Storage} [dependencies.localStorage] - Browser localStorage
 * @param {Window} [dependencies.window] - Browser window object
 * @param {Function} [dependencies.alert] - Browser alert function
 * @param {Function} [dependencies.confirm] - Browser confirm function
 * @param {object} [dependencies.URL] - Browser URL API
 * @param {object} [dependencies.Blob] - Browser Blob API
 * @param {object} [dependencies.FileReader] - Browser FileReader API
 * @param {Console} [dependencies.console] - Browser console
 *
 * @example
 * setupSettingsTabHandlers({
 *   context: document,
 *   UnifiedState,
 *   CompatibilityMode,
 *   applyTheme,
 *   syncThemeToAllWindows,
 *   applyPreset,
 *   MGA_saveJSON,
 *   productionLog
 * });
 */
export function setupSettingsTabHandlers(dependencies = {}) {
  const {
    context = typeof document !== 'undefined' ? document : null,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    CompatibilityMode = typeof window !== 'undefined' && window.CompatibilityMode,
    applyTheme = typeof window !== 'undefined' && window.applyTheme,
    syncThemeToAllWindows = typeof window !== 'undefined' && window.syncThemeToAllWindows,
    applyPreset = typeof window !== 'undefined' && window.applyPreset,
    applyUltraCompactMode = typeof window !== 'undefined' && window.applyUltraCompactMode,
    applyWeatherSetting = typeof window !== 'undefined' && window.applyWeatherSetting,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    productionLog = typeof window !== 'undefined' && window.productionLog ? window.productionLog : () => {},
    logInfo = typeof window !== 'undefined' && window.logInfo ? window.logInfo : () => {},
    targetDocument = typeof window !== 'undefined' && typeof document !== 'undefined' ? document : null,
    updateTabContent = typeof window !== 'undefined' && window.updateTabContent,
    showNotificationToast = typeof window !== 'undefined' && window.showNotificationToast,
    localStorage: storage = typeof window !== 'undefined' && window.localStorage ? window.localStorage : null,
    window: win = typeof window !== 'undefined' ? window : null,
    alert: alertFn = typeof window !== 'undefined' && window.alert ? window.alert : () => {},
    confirm: confirmFn = typeof window !== 'undefined' && window.confirm ? window.confirm : () => false,
    URL: URLClass = typeof window !== 'undefined' && window.URL ? window.URL : null,
    Blob: BlobClass = typeof window !== 'undefined' && window.Blob ? window.Blob : null,
    FileReader: FileReaderClass = typeof window !== 'undefined' && window.FileReader ? window.FileReader : null,
    console: consoleFn = typeof console !== 'undefined' ? console : { log: () => {}, error: () => {} }
  } = dependencies;

  consoleFn.log('🚨 [CRITICAL-DEBUG] setupSettingsTabHandlers ENTERED');
  productionLog('⚙️ [SETTINGS] setupSettingsTabHandlers called', {
    context: context === (typeof document !== 'undefined' ? document : null) ? 'document' : 'custom'
  });
  consoleFn.log(
    '🚨 [CRITICAL-DEBUG] Context type:',
    context === (typeof document !== 'undefined' ? document : null) ? 'DOCUMENT' : 'ELEMENT',
    context
  );

  // Compatibility Mode toggle button
  const compatToggleBtn = context.querySelector('#compat-toggle-btn');
  if (compatToggleBtn && typeof CompatibilityMode !== 'undefined') {
    compatToggleBtn.addEventListener('click', () => {
      if (CompatibilityMode.flags.enabled) {
        // Disable compatibility mode
        CompatibilityMode.disableCompat();
        logInfo('COMPAT', 'User disabled compatibility mode - reload required');
        alertFn('Compatibility Mode disabled. Please refresh the page for changes to take effect.');
      } else {
        // Enable compatibility mode
        try {
          storage.setItem('mgtools_compat_forced', 'true');
          storage.removeItem('mgtools_compat_disabled');
          logInfo('COMPAT', 'User enabled compatibility mode - reload required');
          alertFn('Compatibility Mode enabled. Please refresh the page for changes to take effect.');
        } catch (e) {
          alertFn('Unable to save compatibility mode setting. Your browser may have storage restrictions.');
        }
      }

      // Offer to reload
      if (confirmFn('Would you like to reload the page now?')) {
        win.location.reload();
      }
    });
  }

  // Opacity slider
  const opacitySlider = context.querySelector('#opacity-slider');
  if (opacitySlider) {
    opacitySlider.addEventListener('input', e => {
      const opacity = parseInt(e.target.value);
      UnifiedState.data.settings.opacity = opacity;
      applyTheme();
      // Update label
      const label = opacitySlider.previousElementSibling;
      label.textContent = `Main HUD Opacity: ${opacity}%`;
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Pop-out opacity slider
  const popoutOpacitySlider = context.querySelector('#popout-opacity-slider');
  if (popoutOpacitySlider) {
    popoutOpacitySlider.addEventListener('input', e => {
      const popoutOpacity = parseInt(e.target.value);
      UnifiedState.data.settings.popoutOpacity = popoutOpacity;
      syncThemeToAllWindows(); // Apply theme to pop-out windows only
      // Update label
      const label = popoutOpacitySlider.previousElementSibling;
      label.textContent = `Pop-out Opacity: ${popoutOpacity}%`;
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Gradient select
  const gradientSelect = context.querySelector('#gradient-select');
  if (gradientSelect) {
    gradientSelect.addEventListener('change', e => {
      UnifiedState.data.settings.gradientStyle = e.target.value;
      applyTheme();
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Effect select
  const effectSelect = context.querySelector('#effect-select');
  if (effectSelect) {
    effectSelect.addEventListener('change', e => {
      UnifiedState.data.settings.effectStyle = e.target.value;
      applyTheme();
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Theme preset buttons
  const themePresetButtons = context.querySelectorAll('[data-preset]');
  themePresetButtons.forEach(btn => {
    if (!btn.hasAttribute('data-handler-setup')) {
      btn.setAttribute('data-handler-setup', 'true');
      btn.addEventListener('click', e => {
        const presetName = e.target.dataset.preset;

        // Apply the preset
        applyPreset(presetName);

        // Apply theme immediately
        applyTheme();

        // Save the settings
        MGA_saveJSON('MGA_data', UnifiedState.data);

        // Update UI elements to reflect new values
        // Update opacity slider
        const opacitySlider = context.querySelector('#opacity-slider');
        if (opacitySlider) {
          opacitySlider.value = UnifiedState.data.settings.opacity;
          const label = opacitySlider.previousElementSibling;
          if (label) {
            label.textContent = `Main HUD Opacity: ${UnifiedState.data.settings.opacity}%`;
          }
        }

        // Update gradient select
        const gradientSelect = context.querySelector('#gradient-select');
        if (gradientSelect) {
          gradientSelect.value = UnifiedState.data.settings.gradientStyle;
        }

        // Update effect select
        const effectSelect = context.querySelector('#effect-select');
        if (effectSelect) {
          effectSelect.value = UnifiedState.data.settings.effectStyle;
        }

        productionLog(`🎨 Applied theme preset: ${presetName}`);
      });
    }
  });

  // Texture select
  const textureSelect = context.querySelector('#texture-select');
  if (textureSelect) {
    textureSelect.addEventListener('change', e => {
      UnifiedState.data.settings.textureStyle = e.target.value;
      applyTheme();
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Texture intensity slider
  const intensitySlider = context.querySelector('#texture-intensity-slider');
  const intensityValue = context.querySelector('#texture-intensity-value');
  if (intensitySlider && intensityValue) {
    intensitySlider.addEventListener('input', e => {
      const value = e.target.value;
      intensityValue.textContent = value + '%';
      UnifiedState.data.settings.textureIntensity = parseInt(value);
      applyTheme();
    });
    intensitySlider.addEventListener('change', e => {
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Texture scale buttons
  const scaleButtons = context.querySelectorAll('.texture-scale-btn');
  if (scaleButtons.length > 0) {
    scaleButtons.forEach(btn => {
      btn.addEventListener('click', e => {
        const scale = e.target.dataset.scale;
        UnifiedState.data.settings.textureScale = scale;

        // Update button styles
        scaleButtons.forEach(b => {
          b.style.background = '';
          b.style.color = '';
        });
        e.target.style.background = '#4a9eff';
        e.target.style.color = 'white';

        applyTheme();
        MGA_saveJSON('MGA_data', UnifiedState.data);
      });
    });
  }

  // Texture blend mode selector
  const blendModeSelect = context.querySelector('#texture-blend-mode');
  if (blendModeSelect) {
    blendModeSelect.addEventListener('change', e => {
      UnifiedState.data.settings.textureBlendMode = e.target.value;
      applyTheme();
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Ultra-compact mode checkbox
  const ultraCompactCheckbox = context.querySelector('#ultra-compact-checkbox');
  if (ultraCompactCheckbox) {
    // Remove any existing listeners by cloning
    const newCheckbox = ultraCompactCheckbox.cloneNode(true);
    ultraCompactCheckbox.parentNode.replaceChild(newCheckbox, ultraCompactCheckbox);

    newCheckbox.addEventListener('change', e => {
      e.stopPropagation();
      UnifiedState.data.settings.ultraCompactMode = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      applyUltraCompactMode(e.target.checked);
      productionLog(`📱 Ultra-compact mode ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // FIX ISSUE B: Hide feed buttons checkbox
  const hideFeedButtonsCheckbox = context.querySelector('#hide-feed-buttons-checkbox');
  if (hideFeedButtonsCheckbox) {
    hideFeedButtonsCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.hideFeedButtons = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);

      // Toggle visibility immediately
      const allFeedButtons = targetDocument.querySelectorAll('.mgtools-instant-feed-btn');
      allFeedButtons.forEach(btn => {
        btn.style.setProperty('display', e.target.checked ? 'none' : 'block', 'important');
      });

      consoleFn.log(`[MGTOOLS-FIX-B] Feed buttons ${e.target.checked ? 'hidden' : 'shown'}`);
      productionLog(`🍃 Instant feed buttons ${e.target.checked ? 'hidden' : 'shown'}`);
    });
  }

  // Overlay mode checkbox
  const overlayCheckbox = context.querySelector('#use-overlays-checkbox');
  if (overlayCheckbox) {
    overlayCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.useInGameOverlays = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🎮 Overlay mode ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // Debug mode checkbox
  const debugModeCheckbox = context.querySelector('#debug-mode-checkbox');
  if (debugModeCheckbox) {
    debugModeCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.debugMode = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🐛 Debug mode ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // Room debug mode checkbox
  const roomDebugModeCheckbox = context.querySelector('#room-debug-mode-checkbox');
  if (roomDebugModeCheckbox) {
    roomDebugModeCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.roomDebugMode = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      consoleFn.log(`[MGTools] Room debug mode ${e.target.checked ? 'enabled' : 'disabled'}`);
    });
  }

  // Preset buttons (duplicate handler from theme preset buttons above, line 23152-23158 in original)
  context.querySelectorAll('[data-preset]').forEach(btn => {
    btn.addEventListener('click', e => {
      const preset = e.target.dataset.preset;
      applyPreset(preset);
    });
  });

  // Export/Import
  const exportBtn = context.querySelector('#export-settings-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const data = JSON.stringify(UnifiedState.data, null, 2);
      const blob = new BlobClass([data], { type: 'application/json' });
      const link = targetDocument.createElement('a');
      link.href = URLClass.createObjectURL(blob);
      link.download = 'MGA_Settings.json';
      link.click();
    });
  }

  // Import settings handler
  const importBtn = context.querySelector('#import-settings-btn');
  if (importBtn) {
    importBtn.addEventListener('click', () => {
      const fileInput = targetDocument.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReaderClass();
        reader.onload = event => {
          try {
            const importedData = JSON.parse(event.target.result);

            // Validate it's a data object
            if (typeof importedData !== 'object' || importedData === null) {
              throw new Error('Invalid data format');
            }

            // Merge imported data with current data (preserve any new data not in import)
            UnifiedState.data = { ...UnifiedState.data, ...importedData };

            // Save to storage
            MGA_saveJSON('MGA_data', UnifiedState.data);

            // Apply theme immediately
            applyTheme();

            // Apply other settings
            if (UnifiedState.data.settings.ultraCompactMode) {
              applyUltraCompactMode(true);
            }

            productionLog('✅ Settings imported successfully!');
            showNotificationToast('✅ Settings imported and applied!', 'success');

            // Refresh UI to show updated settings
            if (UnifiedState.activeTab === 'settings') {
              updateTabContent();
            }
          } catch (error) {
            consoleFn.error('Failed to import settings:', error);
            showNotificationToast('❌ Failed to import settings. Invalid file format.', 'error');
          }
        };
        reader.readAsText(file);
      });
      fileInput.click();
    });
  }

  // Reset pet loadouts handler
  const resetLoadoutsBtn = context.querySelector('#reset-loadouts-btn');
  if (resetLoadoutsBtn) {
    resetLoadoutsBtn.addEventListener('click', () => {
      if (confirmFn('Are you sure you want to reset all pet loadouts? This cannot be undone.')) {
        UnifiedState.data.petPresets = {};
        UnifiedState.data.petPresetHotkeys = {};
        UnifiedState.data.petPresetsOrder = [];
        MGA_saveJSON('MGA_petPresets', UnifiedState.data.petPresets);
        MGA_saveJSON('MGA_petPresetHotkeys', UnifiedState.data.petPresetHotkeys);
        MGA_saveJSON('MGA_petPresetsOrder', UnifiedState.data.petPresetsOrder);
        productionLog('[SETTINGS] Pet loadouts and hotkeys have been reset');
        // Update the UI if we're in the pets tab
        if (UnifiedState.activeTab === 'pets') {
          updateTabContent();
        }
        productionLog('[SETTINGS] Pet loadouts have been reset successfully');
      }
    });
  }

  // Clear all pet hotkeys handler
  const clearHotkeysBtn = context.querySelector('#clear-hotkeys-btn');
  if (clearHotkeysBtn) {
    clearHotkeysBtn.addEventListener('click', () => {
      if (confirmFn('Clear all pet preset hotkeys? This will not delete your presets, only the hotkey assignments.')) {
        UnifiedState.data.petPresetHotkeys = {};
        MGA_saveJSON('MGA_petPresetHotkeys', UnifiedState.data.petPresetHotkeys);
        productionLog('[SETTINGS] All pet preset hotkeys cleared');
        // Update the UI if we're in the pets tab
        if (UnifiedState.activeTab === 'pets') {
          updateTabContent();
        }
        alertFn('All pet preset hotkeys have been cleared. You can now assign new hotkeys without conflicts.');
      }
    });
  }

  // Weather effects checkbox
  const weatherCheckbox = context.querySelector('#hide-weather-checkbox');
  if (weatherCheckbox && !weatherCheckbox.hasAttribute('data-handler-setup')) {
    weatherCheckbox.setAttribute('data-handler-setup', 'true');
    try {
      weatherCheckbox.checked = !!(
        UnifiedState &&
        UnifiedState.data &&
        UnifiedState.data.settings &&
        UnifiedState.data.settings.hideWeather
      );
    } catch (_) {}
    const cloned = weatherCheckbox.cloneNode(true);
    weatherCheckbox.parentNode.replaceChild(cloned, weatherCheckbox);
    cloned.addEventListener('change', e => {
      if (!UnifiedState || !UnifiedState.data || !UnifiedState.data.settings) return;
      UnifiedState.data.settings.hideWeather = !!e.target.checked;
      try {
        MGA_saveJSON('MGA_data', UnifiedState.data);
      } catch (err) {
        consoleFn.error('Weather save failed:', err);
      }
      try {
        applyWeatherSetting();
      } catch (err) {
        consoleFn.error('applyWeatherSetting failed:', err);
      }
      productionLog(`🌧️ [WEATHER] Toggle set to ${e.target.checked ? 'HIDE' : 'SHOW'}`);
    });
  }
}
