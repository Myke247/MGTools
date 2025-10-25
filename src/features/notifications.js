/**
 * NOTIFICATION SYSTEM MODULE
 * ====================================================================================
 * All notification-related functionality extracted from monolith
 *
 * @module features/notifications
 *
 * Phase 1 (In Progress):
 * - Core Sound System - ~200 lines
 *   • playNotificationSound() - Web Audio API sound generator
 *   • Basic sound presets (triple, double, single, chime, alert, buzz, ding, chirp)
 *   • Alarm sounds (alarm, continuous alarm with start/stop)
 *   • Epic notification sequence
 *   • playSelectedNotification() - User preference selector
 *
 * Total Extracted: ~0 lines (of ~800-1000 estimated)
 * Progress: 0%
 *
 * Dependencies:
 * - Core: logging (productionLog)
 * - State: UnifiedState (for user preferences)
 * - Browser APIs: Web Audio API, setTimeout
 */

/* ====================================================================================
 * IMPORTS
 * ====================================================================================
 */

// NOTE: These will be available from the global scope when bundled
// In the future, we can import explicitly:
// import { productionLog } from '../core/logging.js';

/* ====================================================================================
 * CORE SOUND SYSTEM (Phase 1)
 * ====================================================================================
 */

/**
 * Play a notification sound using Web Audio API
 * Core sound generator - all other sounds build on this
 *
 * @param {number} frequency - Sound frequency in Hz (default: 800)
 * @param {number} duration - Sound duration in ms (default: 200)
 * @param {number} volume - Volume level 0-1 (default: 0.3)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.getAudioContext] - Get AudioContext function
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function playNotificationSound(frequency = 800, duration = 200, volume = 0.3, dependencies = {}) {
  const {
    getAudioContext = () => new (window.AudioContext || window.webkitAudioContext)(),
    productionLog = console.log
  } = dependencies;

  try {
    const audioContext = getAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration / 1000);

    productionLog(`🔊 [NOTIFICATIONS] Sound played for rare item!`);
  } catch (error) {
    console.error('❌ [NOTIFICATIONS] Failed to play notification sound:', error);
  }
}

/**
 * Play triple beep notification for rare items
 * Descending pitch pattern: 1000Hz → 1000Hz → 1200Hz
 *
 * @param {number} volume - Volume level 0-1 (default: 0.3)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playTripleBeepNotification(volume = 0.3, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  playSoundFn(1000, 250, volume, dependencies);
  setTimeout(() => playSoundFn(1000, 200, volume * 0.8, dependencies), 300);
  setTimeout(() => playSoundFn(1200, 150, volume * 0.6, dependencies), 600);
}

/**
 * Play double beep notification for pet hunger
 * Two identical 600Hz tones
 *
 * @param {number} volume - Volume level 0-1 (default: 0.3)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playDoubleBeepNotification(volume = 0.3, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  playSoundFn(600, 200, volume, dependencies);
  setTimeout(() => playSoundFn(600, 200, volume * 0.9, dependencies), 250);
}

/**
 * Play single beep for ability notifications (subtle)
 * Single 500Hz tone
 *
 * @param {number} volume - Volume level 0-1 (default: 0.2)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playSingleBeepNotification(volume = 0.2, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  playSoundFn(500, 150, volume, dependencies);
}

/**
 * Play chime notification - ascending notes (pleasant)
 * Three ascending tones: 500Hz → 800Hz → 1000Hz
 *
 * @param {number} volume - Volume level 0-1 (default: 0.2)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playChimeNotification(volume = 0.2, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  playSoundFn(500, 100, volume, dependencies);
  setTimeout(() => playSoundFn(800, 100, volume * 0.9, dependencies), 120);
  setTimeout(() => playSoundFn(1000, 120, volume * 0.8, dependencies), 240);
}

/**
 * Play alert notification - urgent descending (attention-grabbing)
 * Two descending tones: 1200Hz → 900Hz
 *
 * @param {number} volume - Volume level 0-1 (default: 0.2)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playAlertNotification(volume = 0.2, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  playSoundFn(1200, 150, volume, dependencies);
  setTimeout(() => playSoundFn(900, 150, volume * 0.9, dependencies), 160);
}

/**
 * Play buzz notification - rapid pulsing (energetic)
 * 8 rapid pulses alternating volume
 *
 * @param {number} volume - Volume level 0-1 (default: 0.2)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playBuzzNotification(volume = 0.2, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  for (let i = 0; i < 8; i++) {
    setTimeout(() => playSoundFn(300, 40, volume * (i % 2 === 0 ? 1 : 0.6), dependencies), i * 50);
  }
}

/**
 * Play ding notification - clean bell-like (clear)
 * Single 2000Hz high-pitched tone
 *
 * @param {number} volume - Volume level 0-1 (default: 0.2)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playDingNotification(volume = 0.2, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  playSoundFn(2000, 180, volume, dependencies);
}

/**
 * Play chirp notification - quick rising chirp (cute)
 * Three ascending tones: 400Hz → 800Hz → 1200Hz
 *
 * @param {number} volume - Volume level 0-1 (default: 0.2)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playChirpNotification(volume = 0.2, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  playSoundFn(400, 80, volume, dependencies);
  setTimeout(() => playSoundFn(800, 60, volume * 0.8, dependencies), 85);
  setTimeout(() => playSoundFn(1200, 40, volume * 0.6, dependencies), 150);
}

/**
 * Play alarm siren notification (very loud and noticeable)
 * 6 alternating high-low siren sounds
 *
 * @param {number} volume - Volume level 0-1 (default: 0.5)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playAlarmNotification(volume = 0.5, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  let count = 0;
  const interval = setInterval(() => {
    // Alternating high-low siren sound
    playSoundFn(count % 2 === 0 ? 1500 : 800, 400, volume, dependencies);
    count++;
    if (count >= 6) clearInterval(interval); // Play 6 times total
  }, 450);
}

// Module-level variable for continuous alarm interval
let continuousAlarmInterval = null;

/**
 * Start continuous warning sound (repeats until acknowledged)
 * Warbling effect between 800Hz and 1200Hz
 *
 * @param {number} volume - Volume level 0-1 (default: 0.4)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function startContinuousAlarm(volume = 0.4, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound, productionLog = console.log } = dependencies;

  if (continuousAlarmInterval) return; // Already playing

  let tone = 800;
  continuousAlarmInterval = setInterval(() => {
    // Warbling effect
    tone = tone === 800 ? 1200 : 800;
    playSoundFn(tone, 300, volume, dependencies);
  }, 350);

  productionLog('🚨 [NOTIFICATIONS] Continuous alarm started - requires acknowledgment!');
}

/**
 * Stop continuous warning sound
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function stopContinuousAlarm(dependencies = {}) {
  const { productionLog = console.log } = dependencies;

  if (continuousAlarmInterval) {
    clearInterval(continuousAlarmInterval);
    continuousAlarmInterval = null;
    productionLog('✅ [NOTIFICATIONS] Continuous alarm stopped');
  }
}

/**
 * Play epic notification (multiple tones in sequence)
 * 11-tone musical sequence with crescendo
 *
 * @param {number} volume - Volume level 0-1 (default: 0.4)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 */
export function playEpicNotification(volume = 0.4, dependencies = {}) {
  const { playNotificationSound: playSoundFn = playNotificationSound } = dependencies;

  const sequence = [
    [400, 100],
    [500, 100],
    [600, 100],
    [800, 150],
    [1000, 200],
    [1200, 150],
    [1000, 150],
    [1200, 200],
    [1500, 300],
    [1200, 100],
    [1500, 400]
  ];

  let delay = 0;
  sequence.forEach(([freq, dur]) => {
    setTimeout(() => playSoundFn(freq, dur, volume, dependencies), delay);
    delay += dur + 50;
  });
}

/**
 * Play selected notification type based on user settings
 * Switches between different sound types
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 * @param {Function} [dependencies.playTripleBeepNotification] - Triple beep function
 * @param {Function} [dependencies.playAlarmNotification] - Alarm function
 * @param {Function} [dependencies.playEpicNotification] - Epic function
 * @param {Function} [dependencies.startContinuousAlarm] - Continuous alarm function
 */
export function playSelectedNotification(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    productionLog = console.log,
    playNotificationSound: playSoundFn = playNotificationSound,
    playTripleBeepNotification: playTripleFn = playTripleBeepNotification,
    playAlarmNotification: playAlarmFn = playAlarmNotification,
    playEpicNotification: playEpicFn = playEpicNotification,
    startContinuousAlarm: startContinuousFn = startContinuousAlarm
  } = dependencies;

  const notifications = UnifiedState.data.settings.notifications;
  const volume = notifications.volume || 0.3;
  const type = notifications.notificationType || 'triple';

  productionLog(`🔊 [NOTIFICATIONS] Playing ${type} notification at ${Math.round(volume * 100)}% volume`);

  switch (type) {
    case 'simple':
      playSoundFn(1000, 300, volume, dependencies);
      break;
    case 'triple':
      playTripleFn(volume, dependencies);
      break;
    case 'alarm':
      playAlarmFn(volume, dependencies);
      break;
    case 'epic':
      playEpicFn(volume, dependencies);
      break;
    case 'continuous':
      startContinuousFn(volume, dependencies);
      break;
    default:
      playTripleFn(volume, dependencies);
  }
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Core Sound System (Phase 1)
  playNotificationSound,
  playTripleBeepNotification,
  playDoubleBeepNotification,
  playSingleBeepNotification,
  playChimeNotification,
  playAlertNotification,
  playBuzzNotification,
  playDingNotification,
  playChirpNotification,
  playAlarmNotification,
  startContinuousAlarm,
  stopContinuousAlarm,
  playEpicNotification,
  playSelectedNotification
};
