/**
 * NOTIFICATION SYSTEM MODULE
 * ====================================================================================
 * All notification-related functionality extracted from monolith
 *
 * @module features/notifications
 *
 * Phase 1 (Complete):
 * - Core Sound System - ~200 lines
 *   • playNotificationSound() - Web Audio API sound generator
 *   • Basic sound presets (triple, double, single, chime, alert, buzz, ding, chirp)
 *   • Alarm sounds (alarm, continuous alarm with start/stop)
 *   • Epic notification sequence
 *   • playSelectedNotification() - User preference selector
 *
 * Phase 2 (Complete):
 * - Custom Sound Wrappers - ~120 lines
 *   • playCustomOrDefaultSound() - Core wrapper utility (GM storage integration)
 *   • playGeneralNotificationSound() - General notification wrapper
 *   • playShopNotificationSound() - Shop-specific wrapper
 *   • playWeatherNotificationSound() - Weather-specific wrapper
 *   NOTE: playPetNotificationSound & playAbilityNotificationSound already in pets.js
 *
 * Phase 3 (Complete):
 * - Visual Notifications - ~380 lines
 *   • queueNotification() - Queue system with 2-second batching (~24 lines)
 *   • updateNotificationModal() - Update existing modal (~15 lines)
 *   • generateNotificationListHTML() - Generate queue HTML (~12 lines)
 *   • showBatchedNotificationModal() - Batched modal display (~124 lines)
 *   • dismissAllNotifications() - Dismiss and cleanup (~28 lines)
 *   • showVisualNotification() - Toast/modal with animations (~177 lines)
 *   • Module-level state: notificationQueue, currentNotificationModal, timer
 *
 * Phase 4 (Complete):
 * - Notification Utilities - ~84 lines
 *   • normalizeSpeciesName() - Case-insensitive species name normalization (~3 lines)
 *   • isWatchedItem() - Check if item is on watch list (~23 lines)
 *   • updateLastSeen() - Update last seen timestamp (~12 lines)
 *   • getTimeSinceLastSeen() - Human-readable time since last seen (~26 lines)
 *   • showNotificationToast() - Simple colored toast notifications (~32 lines)
 *
 * Phase 5 (Complete):
 * - UI Tab Content - ~1,205 lines
 *   • getNotificationsTabContent() - HTML generation for settings tab (~592 lines)
 *   • setupNotificationsTabHandlers() - Event handlers for settings tab (~613 lines)
 *
 * Total Extracted: ~1,989 lines (ALL PHASES COMPLETE!)
 * Progress: 100% (notification system fully extracted!)
 *
 * Dependencies:
 * - Core: logging (productionLog)
 * - State: UnifiedState (for user preferences, watch lists, timestamps)
 * - Storage: GM_getValue, MGA_saveJSON (for custom sounds and persistence)
 * - Browser APIs: Web Audio API, Audio(), setTimeout, DOM manipulation
 * - Document: createElement, querySelector, appendChild (for visual notifications)
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
 * CUSTOM SOUND WRAPPERS (Phase 2)
 * ====================================================================================
 */

/**
 * Play custom uploaded sound or fall back to default
 * Core wrapper utility - checks GM storage for custom sounds
 *
 * @param {string} soundType - Sound type identifier (shop, pet, weather, ability)
 * @param {Function} defaultPlayFunc - Default sound function to use if no custom sound
 * @param {number} volume - Volume level 0-1
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.GM_getValue] - GM getValue function
 * @param {Function} [dependencies.startContinuousAlarm] - Continuous alarm function
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function playCustomOrDefaultSound(soundType, defaultPlayFunc, volume, dependencies = {}) {
  const {
    GM_getValue = typeof window !== 'undefined' && window.GM_getValue,
    startContinuousAlarm: startContinuousFn = startContinuousAlarm,
    productionLog = console.log,
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState
  } = dependencies;

  const customSound = GM_getValue(`mgtools_custom_sound_${soundType}`, null);

  if (customSound) {
    // Check if we're in continuous mode - custom sounds can't loop, so use default alarm instead
    const notificationType = UnifiedState.data.settings.notifications.notificationType;
    if (notificationType === 'continuous') {
      productionLog(`🎵 [CUSTOM-SOUND] Continuous mode active - using alarm instead of custom ${soundType} sound`);
      startContinuousFn(volume, dependencies);
      return;
    }

    try {
      const audio = new Audio(customSound);
      audio.volume = volume || 0.3;
      audio.play();
      productionLog(`🎵 [CUSTOM-SOUND] Playing custom ${soundType} sound`);
    } catch (err) {
      console.error(`Failed to play custom ${soundType} sound:`, err);
      defaultPlayFunc(volume);
    }
  } else {
    defaultPlayFunc(volume);
  }
}

/**
 * Play general notification sound based on user settings
 * Used as fallback for custom sounds and for general notifications
 *
 * @param {number} volume - Volume level 0-1
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.playNotificationSound] - Core sound function
 * @param {Function} [dependencies.playTripleBeepNotification] - Triple beep function
 * @param {Function} [dependencies.playAlarmNotification] - Alarm function
 * @param {Function} [dependencies.playEpicNotification] - Epic function
 * @param {Function} [dependencies.startContinuousAlarm] - Continuous alarm function
 */
export function playGeneralNotificationSound(volume, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    playNotificationSound: playSoundFn = playNotificationSound,
    playTripleBeepNotification: playTripleFn = playTripleBeepNotification,
    playAlarmNotification: playAlarmFn = playAlarmNotification,
    playEpicNotification: playEpicFn = playEpicNotification,
    startContinuousAlarm: startContinuousFn = startContinuousAlarm
  } = dependencies;

  const type = UnifiedState.data.settings.notifications.notificationType || 'epic';

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
      playEpicFn(volume, dependencies);
  }
}

/**
 * Play shop notification sound (custom or default)
 * Used for rare item alerts in shop
 *
 * @param {number} volume - Volume level 0-1
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playCustomOrDefaultSound] - Custom sound wrapper
 * @param {Function} [dependencies.playGeneralNotificationSound] - General sound function
 */
export function playShopNotificationSound(volume, dependencies = {}) {
  const {
    playCustomOrDefaultSound: playCustomFn = playCustomOrDefaultSound,
    playGeneralNotificationSound: playGeneralFn = playGeneralNotificationSound
  } = dependencies;

  playCustomFn('shop', playGeneralFn, volume, dependencies);
}

/**
 * Play weather notification sound (custom or default)
 * Used for weather change alerts
 *
 * @param {number} volume - Volume level 0-1
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.playCustomOrDefaultSound] - Custom sound wrapper
 * @param {Function} [dependencies.playGeneralNotificationSound] - General sound function
 */
export function playWeatherNotificationSound(volume, dependencies = {}) {
  const {
    playCustomOrDefaultSound: playCustomFn = playCustomOrDefaultSound,
    playGeneralNotificationSound: playGeneralFn = playGeneralNotificationSound
  } = dependencies;

  playCustomFn('weather', playGeneralFn, volume, dependencies);
}

/* ====================================================================================
 * VISUAL NOTIFICATIONS (Phase 3)
 * ====================================================================================
 */

// Module-level state for notification queue system
let notificationQueue = [];
let currentNotificationModal = null;
let notificationQueueTimer = null;
const NOTIFICATION_BATCH_DELAY = 2000; // 2 seconds to batch notifications

/**
 * Add notification to queue and trigger batched modal display
 * Implements smart batching with 2-second delay to group multiple notifications
 *
 * @param {string} message - Notification message to display
 * @param {boolean} requiresAcknowledgment - Whether notification requires user acknowledgment
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.updateNotificationModal] - Update modal function
 * @param {Function} [dependencies.showBatchedNotificationModal] - Show batched modal function
 */
export function queueNotification(message, requiresAcknowledgment = false, dependencies = {}) {
  const {
    updateNotificationModal: updateModalFn = updateNotificationModal,
    showBatchedNotificationModal: showBatchedFn = showBatchedNotificationModal
  } = dependencies;

  notificationQueue.push({ message, requiresAcknowledgment, timestamp: Date.now() });

  // Clear existing timer and start new one
  if (notificationQueueTimer) {
    clearTimeout(notificationQueueTimer);
  }

  // If there's already a modal open, update it immediately
  if (currentNotificationModal) {
    updateModalFn(dependencies);
    return;
  }

  // Otherwise, batch notifications for a short period
  notificationQueueTimer = setTimeout(() => {
    showBatchedFn(dependencies);
  }, NOTIFICATION_BATCH_DELAY);
}

/**
 * Update existing notification modal with new queued notifications
 * Refreshes count and message list in currently displayed modal
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.generateNotificationListHTML] - Generate list HTML function
 */
export function updateNotificationModal(dependencies = {}) {
  const { generateNotificationListHTML: generateListFn = generateNotificationListHTML } = dependencies;

  if (!currentNotificationModal) return;

  const messageContainer = currentNotificationModal.querySelector('.notification-messages');
  if (messageContainer) {
    messageContainer.innerHTML = generateListFn();
  }

  const countDisplay = currentNotificationModal.querySelector('.notification-count');
  if (countDisplay) {
    countDisplay.textContent = `${notificationQueue.length} Notification${notificationQueue.length > 1 ? 's' : ''}`;
  }
}

/**
 * Generate HTML for notification queue list
 * Creates styled list items with message and timestamp
 *
 * @returns {string} HTML string for notification list
 */
export function generateNotificationListHTML() {
  return notificationQueue
    .map(
      notif => `
      <div style="margin-bottom: 10px; padding: 10px; background: rgba(255, 255, 255, 0.57); border-radius: 5px; border-left: 3px solid #fff;">
          <div style="font-size: 14px; margin-bottom: 5px;">${notif.message}</div>
          <div style="font-size: 10px; opacity: 0.8;">${new Date(notif.timestamp).toLocaleTimeString()}</div>
      </div>
  `
    )
    .join('');
}

/**
 * Show batched notification modal for queued notifications
 * Creates modal UI with all queued notifications, handles acknowledgment
 * Smart display: single non-ack → toast, multiple non-ack → toasts, any ack → modal
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.targetDocument] - Target document (default: window.document)
 * @param {Function} [dependencies.showVisualNotification] - Show visual notification function
 * @param {Function} [dependencies.generateNotificationListHTML] - Generate list HTML function
 * @param {Function} [dependencies.dismissAllNotifications] - Dismiss all function
 */
export function showBatchedNotificationModal(dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    showVisualNotification: showVisualFn = showVisualNotification,
    generateNotificationListHTML: generateListFn = generateNotificationListHTML,
    dismissAllNotifications: dismissAllFn = dismissAllNotifications
  } = dependencies;

  if (notificationQueue.length === 0) return;

  // Ensure only one modal exists at a time - cleanup any existing modal
  if (currentNotificationModal) {
    dismissAllFn(dependencies);
    // Wait a bit for the dismiss animation to complete
    setTimeout(() => showBatchedNotificationModal(dependencies), 350);
    return;
  }

  const hasAcknowledgmentRequired = notificationQueue.some(n => n.requiresAcknowledgment);

  // If only one notification and no acknowledgment required, use regular notification
  if (notificationQueue.length === 1 && !hasAcknowledgmentRequired) {
    const notif = notificationQueue[0];
    showVisualFn(notif.message, notif.requiresAcknowledgment, dependencies);
    notificationQueue = [];
    return;
  }

  // If multiple notifications but NONE require acknowledgment, show them as simple toasts
  if (!hasAcknowledgmentRequired) {
    // Show each notification as a simple non-blocking toast
    notificationQueue.forEach(notif => {
      showVisualFn(notif.message, false, dependencies);
    });
    notificationQueue = [];
    return;
  }

  // Create batched modal (only if acknowledgment is required)
  const notification = targetDocument.createElement('div');
  notification.className = 'mga-batched-notification';

  notification.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: linear-gradient(135deg, #ff6b6b 0%, #ff0000 100%);
      color: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 20px 60px rgba(255,0,0,0.4), 0 0 100px rgba(255, 0, 0, 0.48);
      z-index: 9999999;
      font-weight: bold;
      animation: mga-modal-entrance 0.5s ease-out;
      border: 3px solid #ffffff;
      text-align: center;
      max-width: 500px;
      max-height: 400px;
      overflow-y: auto;
  `;

  notification.innerHTML = `
      <div class="notification-count" style="font-size: 20px; margin-bottom: 15px;">
          ${notificationQueue.length} Notification${notificationQueue.length > 1 ? 's' : ''}
      </div>
      <div class="notification-messages" style="text-align: left; margin-bottom: 20px; max-height: 200px; overflow-y: auto;">
          ${generateListFn()}
      </div>
      <button class="acknowledge-all-btn" style="
          background: white;
          color: #ff0000;
          border: none;
          padding: 12px 24px;
          border-radius: 5px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transition: all 0.2s;
      ">
          ACKNOWLEDGE ALL (${notificationQueue.length})
      </button>
  `;

  // Add button interactivity
  const ackButton = notification.querySelector('.acknowledge-all-btn');
  ackButton.onmouseover = () => {
    ackButton.style.transform = 'scale(1.05)';
    ackButton.style.boxShadow = '0 6px 15px rgba(0,0,0,0.4)';
  };
  ackButton.onmouseout = () => {
    ackButton.style.transform = 'scale(1)';
    ackButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
  };
  ackButton.onclick = () => {
    dismissAllFn(dependencies);
  };

  // Add backdrop
  const backdrop = targetDocument.createElement('div');
  backdrop.className = 'mga-notification-backdrop';
  backdrop.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 9999998;
      animation: fadeIn 0.3s ease-in;
  `;
  backdrop.onclick = () => {
    backdrop.style.animation = 'flash 0.3s ease-in-out';
  };

  targetDocument.body.appendChild(backdrop);
  targetDocument.body.appendChild(notification);

  currentNotificationModal = notification;

  // NOTE: Don't stop continuous alarm here - it should keep playing until acknowledged
  // The alarm will be stopped when the user clicks the acknowledge button
}

/**
 * Dismiss all queued notifications and cleanup modal
 * Stops continuous alarm, removes modal/backdrop, clears queue
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.targetDocument] - Target document (default: window.document)
 * @param {Function} [dependencies.stopContinuousAlarm] - Stop alarm function
 */
export function dismissAllNotifications(dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    stopContinuousAlarm: stopAlarmFn = stopContinuousAlarm
  } = dependencies;

  stopAlarmFn(dependencies);

  if (currentNotificationModal) {
    const backdrop = targetDocument.querySelector('.mga-notification-backdrop');

    currentNotificationModal.style.animation = 'fadeOut 0.3s ease-out';
    if (backdrop) backdrop.style.animation = 'fadeOut 0.3s ease-out';

    setTimeout(() => {
      if (currentNotificationModal) currentNotificationModal.remove();
      if (backdrop) backdrop.remove();
      currentNotificationModal = null;
    }, 300);
  }

  notificationQueue = [];

  if (notificationQueueTimer) {
    clearTimeout(notificationQueueTimer);
    notificationQueueTimer = null;
  }
}

/**
 * Show visual notification in game (toast or modal)
 * Creates either persistent modal (requires acknowledgment) or auto-dismiss toast
 * Includes CSS animations for smooth entrance/exit
 *
 * @param {string} message - Notification message to display
 * @param {boolean} requiresAcknowledgment - Whether notification requires user acknowledgment
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.targetDocument] - Target document (default: window.document)
 * @param {Function} [dependencies.stopContinuousAlarm] - Stop alarm function
 * @param {Function} [dependencies.dismissAllNotifications] - Dismiss all function
 */
export function showVisualNotification(message, requiresAcknowledgment = false, dependencies = {}) {
  const {
    targetDocument = typeof window !== 'undefined' ? window.document : null,
    stopContinuousAlarm: stopAlarmFn = stopContinuousAlarm,
    dismissAllNotifications: dismissAllFn = dismissAllNotifications
  } = dependencies;

  // Ensure only one modal exists at a time for acknowledgment-required notifications
  if (requiresAcknowledgment && currentNotificationModal) {
    dismissAllFn(dependencies);
    // Wait a bit for the dismiss animation to complete
    setTimeout(() => showVisualNotification(message, requiresAcknowledgment, dependencies), 350);
    return;
  }

  const notification = targetDocument.createElement('div');

  if (requiresAcknowledgment) {
    // Create persistent modal that requires acknowledgment
    notification.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: linear-gradient(135deg, #ff6b6b 0%, #ff0000 100%);
          color: white;
          padding: 30px;
          border-radius: 15px;
          box-shadow: 0 20px 60px rgba(255,0,0,0.4), 0 0 100px rgba(255, 0, 0, 0.48);
          z-index: 9999999;
          font-weight: bold;
          font-size: 20px;
          animation: mga-modal-entrance 0.5s ease-out;
          border: 3px solid #ffffff;
          text-align: center;
          min-width: 400px;
      `;

    // Create message div
    const messageDiv = targetDocument.createElement('div');
    messageDiv.textContent = message;
    messageDiv.style.marginBottom = '20px';
    notification.appendChild(messageDiv);

    // Create acknowledge button
    const ackButton = targetDocument.createElement('button');
    ackButton.textContent = 'ACKNOWLEDGE (Stop Alarm)';
    ackButton.style.cssText = `
          background: white;
          color: #ff0000;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          transition: all 0.2s;
      `;
    ackButton.onmouseover = () => {
      ackButton.style.transform = 'scale(1.05)';
      ackButton.style.boxShadow = '0 6px 15px rgba(0,0,0,0.4)';
    };
    ackButton.onmouseout = () => {
      ackButton.style.transform = 'scale(1)';
      ackButton.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
    };
    ackButton.onclick = () => {
      stopAlarmFn(dependencies);
      notification.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    };
    notification.appendChild(ackButton);

    // Add backdrop
    const backdrop = targetDocument.createElement('div');
    backdrop.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.7);
          z-index: 9999998;
          animation: fadeIn 0.3s ease-in;
      `;
    backdrop.onclick = () => {
      backdrop.style.animation = 'flash 0.3s ease-in-out';
    };
    targetDocument.body.appendChild(backdrop);

    // Append notification to body
    targetDocument.body.appendChild(notification);

    // Set as current modal for tracking
    currentNotificationModal = notification;

    // Link backdrop removal to button click
    ackButton.onclick = () => {
      stopAlarmFn(dependencies);
      notification.style.animation = 'fadeOut 0.3s ease-out';
      backdrop.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => {
        notification.remove();
        backdrop.remove();
        currentNotificationModal = null;
      }, 300);
    };
  } else {
    // Regular auto-dismiss notification
    notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 20px;
          border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.3);
          z-index: 999999;
          font-weight: bold;
          font-size: 16px;
          animation: slideInRight 0.5s ease-out;
          border: 2px solid rgba(255,255,255,0.3);
      `;
    notification.textContent = message;

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.5s ease-out';
      setTimeout(() => notification.remove(), 500);
    }, 5000);
  }

  // Add animation styles if not exists
  if (!targetDocument.getElementById('mga-notification-animations')) {
    const style = targetDocument.createElement('style');
    style.id = 'mga-notification-animations';
    style.textContent = `
          @keyframes slideInRight {
              from { transform: translateX(100%); opacity: 0; }
              to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideOutRight {
              from { transform: translateX(0); opacity: 1; }
              to { transform: translateX(100%); opacity: 0; }
          }
          @keyframes mga-notification-pulse {
              from { transform: translate(-50%, -50%) scale(1); }
              to { transform: translate(-50%, -50%) scale(1.05); }
          }
          @keyframes mga-modal-entrance {
              from {
                  opacity: 0;
                  transform: translate(-50%, -50%) scale(0.8);
              }
              to {
                  opacity: 1;
                  transform: translate(-50%, -50%) scale(1);
              }
          }
          @keyframes fadeIn {
              from { opacity: 0; }
              to { opacity: 1; }
          }
          @keyframes fadeOut {
              from { opacity: 1; }
              to { opacity: 0; }
          }
          @keyframes flash {
              0%, 100% { background: rgba(0, 0, 0, 0.7); }
              50% { background: rgba(255, 0, 0, 0.3); }
          }
      `;
    targetDocument.head.appendChild(style);
  }

  targetDocument.body.appendChild(notification);
}

/* ====================================================================================
 * NOTIFICATION UTILITIES (Phase 4)
 * ====================================================================================
 */

/**
 * Normalize species name for case-insensitive comparison
 * Trims and lowercases species names for consistent matching
 *
 * @param {string} name - Species name to normalize
 * @returns {string} Normalized species name (lowercase, trimmed)
 */
export function normalizeSpeciesName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.trim().toLowerCase();
}

/**
 * Check if item is on the watch list
 * Handles name variations for celestial seeds (DawnCelestial → Dawnbinder)
 *
 * @param {string} itemId - Item ID to check
 * @param {string} type - Item type (seed, egg, decor)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.normalizeSpeciesName] - Species name normalizer
 * @returns {boolean} True if item is watched
 */
export function isWatchedItem(itemId, type = 'seed', dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    normalizeSpeciesName: normalizeFn = normalizeSpeciesName
  } = dependencies;

  const notifications = UnifiedState.data.settings.notifications;
  if (type === 'seed') {
    // Handle name variations for celestial seeds
    // Shop uses "DawnCelestial" and "MoonCelestial" but UI uses "Dawnbinder" and "Moonbinder"
    const nameMap = {
      DawnCelestial: 'Dawnbinder',
      MoonCelestial: 'Moonbinder'
    };
    const checkId = nameMap[itemId] || itemId;

    // Case-insensitive matching for seeds
    const normalizedItemId = normalizeFn(checkId);
    return notifications.watchedSeeds.some(watched => normalizeFn(watched) === normalizedItemId);
  } else if (type === 'egg') {
    return notifications.watchedEggs.includes(itemId);
  }
  return false;
}

/**
 * Update last seen timestamp for an item
 * Saves timestamp to persistent storage for tracking rare item appearances
 *
 * @param {string} itemId - Item ID to update
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - JSON save function
 * @param {Function} [dependencies.productionLog] - Production logging function
 */
export function updateLastSeen(itemId, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    productionLog = console.log
  } = dependencies;

  const notifications = UnifiedState.data.settings.notifications;
  notifications.lastSeenTimestamps[itemId] = Date.now();
  MGA_saveJSON('MGA_data', UnifiedState.data);
  productionLog(`📅 [NOTIFICATIONS] Updated last seen for ${itemId}`);
}

/**
 * Get time since item was last seen (human readable format)
 * Handles name mapping for celestial seeds
 *
 * @param {string} itemId - Item ID to check
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @returns {string} Human-readable time string (e.g. "2 days ago", "Never seen")
 */
export function getTimeSinceLastSeen(itemId, dependencies = {}) {
  const { UnifiedState = typeof window !== 'undefined' && window.UnifiedState } = dependencies;

  const notifications = UnifiedState.data.settings.notifications;

  // Map UI names to shop IDs for celestial seeds
  // UI shows "Moonbinder" but shop stores as "MoonCelestial"
  const reverseNameMap = {
    Moonbinder: 'MoonCelestial',
    Dawnbinder: 'DawnCelestial'
  };
  const lookupId = reverseNameMap[itemId] || itemId;

  const timestamp = notifications.lastSeenTimestamps[lookupId];
  if (!timestamp) return 'Never seen';

  const diff = Date.now() - timestamp;
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;

  const minutes = Math.floor(diff / (1000 * 60));
  return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
}

/**
 * Show simple notification toast (info/success/warning)
 * Displays colored toast in top-right corner, auto-dismisses after 5 seconds
 *
 * @param {string} message - Message to display
 * @param {string} type - Toast type (info, success, warning)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.targetDocument] - Target document (default: window.document)
 */
export function showNotificationToast(message, type = 'info', dependencies = {}) {
  const { targetDocument = typeof window !== 'undefined' ? window.document : null } = dependencies;

  try {
    const toast = targetDocument.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
          position: fixed;
          top: 80px;
          right: 20px;
          padding: 12px 20px;
          background: ${type === 'warning' ? 'rgba(255, 165, 0, 0.9)' : type === 'success' ? 'rgba(76, 175, 80, 0.9)' : 'rgba(33, 150, 243, 0.9)'};
          color: white;
          border-radius: 8px;
          font-size: 14px;
          font-weight: bold;
          z-index: 2147483647;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          max-width: 300px;
          word-wrap: break-word;
          transition: opacity 0.3s ease;
      `;

    targetDocument.body.appendChild(toast);

    // Fade out and remove after 5 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 5000);
  } catch (error) {
    console.error('❌ [TOAST] Error showing notification toast:', error);
  }
}

/* ====================================================================================
 * UI TAB CONTENT (Phase 5)
 * ====================================================================================
 */

/**
 * Generate notifications tab HTML content
 * Creates settings tab content with all notification configuration options
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Array} [dependencies.DECOR_ITEMS] - Decor items constant
 * @returns {string} HTML content for notifications tab
 */
export function getNotificationsTabContent(dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    DECOR_ITEMS = typeof window !== 'undefined' && window.DECOR_ITEMS ? window.DECOR_ITEMS : []
  } = dependencies;

  const settings = UnifiedState.data.settings;

  // Ensure new notification properties exist (for backwards compatibility with old saved data)
  if (!settings.notifications.petHungerEnabled && settings.notifications.petHungerEnabled !== false) {
    settings.notifications.petHungerEnabled = false;
  }
  if (!settings.notifications.petHungerThreshold) {
    settings.notifications.petHungerThreshold = 20;
  }
  if (
    !settings.notifications.abilityNotificationsEnabled &&
    settings.notifications.abilityNotificationsEnabled !== false
  ) {
    settings.notifications.abilityNotificationsEnabled = false;
  }
  if (!settings.notifications.watchedAbilities) {
    settings.notifications.watchedAbilities = [];
  }
  if (!settings.notifications.watchedAbilityCategories) {
    settings.notifications.watchedAbilityCategories = {
      xpBoost: true,
      cropSizeBoost: true,
      selling: true,
      harvesting: true,
      growthSpeed: true,
      specialMutations: true,
      other: true
    };
  }
  if (
    !settings.notifications.weatherNotificationsEnabled &&
    settings.notifications.weatherNotificationsEnabled !== false
  ) {
    settings.notifications.weatherNotificationsEnabled = false;
  }
  if (!settings.notifications.watchedDecor) {
    settings.notifications.watchedDecor = [];
  }
  if (!settings.notifications.watchedWeatherEvents) {
    settings.notifications.watchedWeatherEvents = ['Snow', 'Rain', 'AmberMoon', 'Dawn'];
  }
  if (!settings.notifications.abilityNotificationSound) {
    settings.notifications.abilityNotificationSound = 'single';
  }
  if (settings.notifications.abilityNotificationVolume === undefined) {
    settings.notifications.abilityNotificationVolume = 0.2;
  }
  // Ensure continuousEnabled is explicitly false if undefined
  if (settings.notifications.continuousEnabled === undefined || settings.notifications.continuousEnabled === null) {
    settings.notifications.continuousEnabled = false;
  }
  // Ensure debugMode exists
  if (settings.debugMode === undefined) {
    settings.debugMode = false;
  }

  return `
          <div class="mga-section">
              <div class="mga-section-title">🔔 Shop Alert Notifications</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Get audio and visual alerts when rare seeds or eggs appear in the shop.
              </p>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="notifications-enabled-checkbox" class="mga-checkbox"
                             ${settings.notifications.enabled ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🔊 Enable Notifications</span>
                  </label>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Volume: ${Math.round(settings.notifications.volume * 100)}%
                  </label>
                  <input type="range" class="mga-slider" id="notification-volume-slider"
                         min="0" max="100" value="${settings.notifications.volume * 100}"
                         style="width: 100%; accent-color: #4a9eff;">
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="notification-continuous-checkbox" class="mga-checkbox"
                             ${settings.notifications.continuousEnabled ? 'checked' : ''}
                             style="accent-color: #ff9900;">
                      <span>⚠️ Enable Continuous Mode</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      Allows selection of continuous notification type that plays until acknowledged.
                  </p>
              </div>
              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Notification Sound Type
                  </label>
                  <select class="mga-select" id="notification-type-select">
                      <option value="simple" ${settings.notifications.notificationType === 'simple' ? 'selected' : ''}>🔊 Simple Beep</option>
                      <option value="triple" ${settings.notifications.notificationType === 'triple' ? 'selected' : ''}>🔔 Triple Beep</option>
                      <option value="alarm" ${settings.notifications.notificationType === 'alarm' ? 'selected' : ''}>🚨 Alarm Siren</option>
                      <option value="epic" ${settings.notifications.notificationType === 'epic' ? 'selected' : ''}>🎵 Epic Fanfare</option>
                      <option value="continuous" ${settings.notifications.notificationType === 'continuous' ? 'selected' : ''} ${!settings.notifications.continuousEnabled ? 'disabled' : ''}>⚠️ Continuous (Until Acknowledged)</option>
                  </select>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="notification-acknowledgment-checkbox" class="mga-checkbox"
                             ${settings.notifications.requiresAcknowledgment ? 'checked' : ''}
                             style="accent-color: #ff4444;">
                      <span>🚨 Require acknowledgment (persistent alert)</span>
                  </label>
                  <p style="font-size: 11px; color: #aaa; margin: 4px 0 0 26px;">
                      When enabled, notifications will show a modal that must be clicked to dismiss.
                  </p>
              </div>

              <div style="margin-bottom: 12px;">
                  <button class="mga-btn mga-btn-sm" id="test-notification-btn" style="background: #4a5568;">
                      🔔 Test Notification
                  </button>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🎵 Custom Notification Sounds</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Upload your own .mp3/.wav/.ogg files to replace default beep sounds. Max 2MB per file.
              </p>

              <div id="custom-sounds-container" style="display: grid; gap: 12px;">
                  <!-- Custom sound upload controls will be populated by setupNotificationsTabHandlers -->
              </div>
          </div>

          <div class="mga-section">
              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Watched Seeds
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                      ${[
                        'Carrot',
                        'Strawberry',
                        'Aloe',
                        'Blueberry',
                        'Apple',
                        'Tulip',
                        'Tomato',
                        'Daffodil',
                        'Corn',
                        'Watermelon',
                        'Pumpkin',
                        'Echeveria',
                        'Coconut',
                        'Banana',
                        'Lily',
                        'BurrosTail',
                        'Mushroom',
                        'Cactus',
                        'Bamboo',
                        'Grape',
                        'Pepper',
                        'Lemon',
                        'PassionFruit',
                        'DragonFruit',
                        'Lychee',
                        'Sunflower',
                        'Starweaver',
                        'Dawnbinder',
                        'Moonbinder'
                      ]
                        .map(
                          seed => `
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-${seed.toLowerCase()}" class="mga-checkbox"
                                   ${settings.notifications.watchedSeeds.includes(seed) ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>${seed === 'BurrosTail' ? "🌱 Burro's Tail" : seed === 'Dawnbinder' ? '🌅 Dawnbinder' : seed === 'Moonbinder' ? '🌙 Moonbinder' : seed === 'Starweaver' ? '⭐ Starweaver' : '🌱 ' + seed}</span>
                        </label>
                    `
                        )
                        .join('')}
                  </div>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Watched Eggs
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                      ${['CommonEgg', 'UncommonEgg', 'RareEgg', 'LegendaryEgg', 'MythicalEgg']
                        .map(
                          egg => `
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-${egg.toLowerCase().replace('egg', '-egg')}" class="mga-checkbox"
                                   ${settings.notifications.watchedEggs.includes(egg) ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>🥚 ${egg.replace('Egg', ' Egg')}</span>
                        </label>
                    `
                        )
                        .join('')}
                  </div>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Watched Decor (Hourly Shop)
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                      ${DECOR_ITEMS.map(
                        decor => `
                          <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                              <input type="checkbox" id="watch-decor-${decor.id.toLowerCase()}" class="mga-checkbox"
                                     ${settings.notifications.watchedDecor.includes(decor.id) ? 'checked' : ''}
                                     style="accent-color: #4a9eff; transform: scale(0.8);">
                              <span>🎨 ${decor.name}</span>
                          </label>
                      `
                      ).join('')}
                  </div>
              </div>

              <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.15); border-radius: 4px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px; font-size: 12px;">
                      Last Seen
                  </label>
                  <div id="last-seen-display" style="font-size: 11px; color: #888; line-height: 1.3;">
                      Loading...
                  </div>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🐾 Pet Hunger Alerts</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Get notified when your pets' hunger drops below a threshold.
              </p>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="pet-hunger-enabled" class="mga-checkbox"
                             ${settings.notifications.petHungerEnabled ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🔊 Enable Pet Hunger Notifications</span>
                  </label>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Alert when hunger below: ${settings.notifications.petHungerThreshold || 20}%
                  </label>
                  <input type="range" class="mga-slider" id="pet-hunger-threshold"
                         min="5" max="50" step="5" value="${settings.notifications.petHungerThreshold || 20}"
                         style="width: 100%; accent-color: #ff9900;">
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">✨ Ability Trigger Alerts</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Get notified when your pets trigger abilities. Leave all unchecked to be notified for all abilities.
              </p>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="ability-notifications-enabled" class="mga-checkbox"
                             ${settings.notifications.abilityNotificationsEnabled ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🔊 Enable Ability Notifications</span>
                  </label>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Ability Sound Type
                  </label>
                  <select class="mga-select" id="ability-notification-sound-select"
                          style="width: 100%; padding: 8px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255, 255, 255, 0.57); border-radius: 4px; color: white; font-size: 12px;">
                      <option value="single" ${settings.notifications.abilityNotificationSound === 'single' ? 'selected' : ''}>🔊 Single Beep (Subtle)</option>
                      <option value="double" ${settings.notifications.abilityNotificationSound === 'double' ? 'selected' : ''}>🔔 Double Beep</option>
                      <option value="triple" ${settings.notifications.abilityNotificationSound === 'triple' ? 'selected' : ''}>🎵 Triple Beep</option>
                      <option value="chime" ${settings.notifications.abilityNotificationSound === 'chime' ? 'selected' : ''}>🎐 Chime (Pleasant)</option>
                      <option value="alert" ${settings.notifications.abilityNotificationSound === 'alert' ? 'selected' : ''}>🚨 Alert (Urgent)</option>
                      <option value="buzz" ${settings.notifications.abilityNotificationSound === 'buzz' ? 'selected' : ''}>📳 Buzz (Energetic)</option>
                      <option value="ding" ${settings.notifications.abilityNotificationSound === 'ding' ? 'selected' : ''}>🔔 Ding (Clear)</option>
                      <option value="chirp" ${settings.notifications.abilityNotificationSound === 'chirp' ? 'selected' : ''}>🐦 Chirp (Cute)</option>
                      <option value="epic" ${settings.notifications.abilityNotificationSound === 'epic' ? 'selected' : ''}>🎵 Epic Fanfare</option>
                  </select>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 4px;">
                      Ability Alert Volume: ${Math.round((settings.notifications.abilityNotificationVolume || 0.2) * 100)}%
                  </label>
                  <input type="range" class="mga-slider" id="ability-notification-volume-slider"
                         min="0" max="100" value="${(settings.notifications.abilityNotificationVolume || 0.2) * 100}"
                         style="width: 100%; accent-color: #9f7aea;">
              </div>

              <div style="margin-bottom: 16px; padding-top: 12px; border-top: 1px solid rgba(255, 255, 255, 0.57);">
                  <label class="mga-label" style="display: block; margin-bottom: 8px; font-weight: 600;">
                      📋 Which Abilities to Notify For
                  </label>
                  <p style="font-size: 11px; color: #888; margin-bottom: 8px;">
                      Select individual abilities that will trigger notifications. All abilities start enabled by default.
                  </p>

                  <div style="display: flex; gap: 8px; margin-bottom: 12px;">
                      <button id="select-all-individual-abilities" class="mga-btn mga-btn-secondary" style="flex: 1; padding: 6px; font-size: 11px;">Select All</button>
                      <button id="select-none-individual-abilities" class="mga-btn mga-btn-secondary" style="flex: 1; padding: 6px; font-size: 11px;">Select None</button>
                  </div>

                  <input type="text" id="ability-search-box" placeholder="🔍 Search abilities..."
                         style="width: 100%; padding: 8px; margin-bottom: 12px; background: rgba(255,255,255,0.15); border: 1px solid rgba(255, 255, 255, 0.57); border-radius: 4px; color: #fff; font-size: 12px;">

                  <div id="individual-abilities-notification-list" style="display: grid; grid-template-columns: 1fr; gap: 4px; max-height: 400px; overflow-y: auto; padding: 4px;">
                      <!-- Ability checkboxes will be populated by handler -->
                  </div>
              </div>
          </div>

          <div class="mga-section">
              <div class="mga-section-title">🌤️ Weather Event Alerts</div>
              <p style="font-size: 11px; color: #aaa; margin-bottom: 12px;">
                  Get notified when weather events occur in the game.
              </p>

              <div style="margin-bottom: 12px;">
                  <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                      <input type="checkbox" id="weather-notifications-enabled" class="mga-checkbox"
                             ${settings.notifications.weatherNotificationsEnabled ? 'checked' : ''}
                             style="accent-color: #4a9eff;">
                      <span>🔊 Enable Weather Notifications</span>
                  </label>
              </div>

              <div style="margin-bottom: 12px;">
                  <label class="mga-label" style="display: block; margin-bottom: 8px;">
                      Watched Weather Events
                  </label>
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 4px;">
                      ${['Snow', 'Rain', 'AmberMoon', 'Dawn']
                        .map(
                          (weather, idx) => `
                        <label class="mga-checkbox-label" style="display: flex; align-items: center; gap: 4px; font-size: 12px;">
                            <input type="checkbox" id="watch-${weather.toLowerCase().replace('ambermoon', 'amber-moon')}" class="mga-checkbox"
                                   ${settings.notifications.watchedWeatherEvents.includes(weather) ? 'checked' : ''}
                                   style="accent-color: #4a9eff; transform: scale(0.8);">
                            <span>${idx === 0 ? '❄️' : idx === 1 ? '🌧️' : idx === 2 ? '🌙' : '🌅'} ${weather === 'AmberMoon' ? 'Amber Moon' : weather}</span>
                        </label>
                    `
                        )
                        .join('')}
                  </div>
              </div>
          </div>
      `;
}

/**
 * Setup notifications tab event handlers
 * Configures all event listeners for notification settings controls
 * Handles shop alerts, pet hunger, ability triggers, weather events, and custom sounds
 *
 * @param {Document|Element} context - DOM context to search for elements (default: document)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - JSON save function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.productionWarn] - Production warning function
 * @param {Function} [dependencies.playSelectedNotification] - Play selected notification function
 * @param {Function} [dependencies.queueNotification] - Queue notification function
 * @param {Function} [dependencies.showVisualNotification] - Show visual notification function
 * @param {Function} [dependencies.getTimeSinceLastSeen] - Get time since last seen function
 * @param {Function} [dependencies.scanAndAlertHungryPets] - Scan and alert hungry pets function
 * @param {Array} [dependencies.DECOR_ITEMS] - Decor items constant
 * @param {Function} [dependencies.GM_getValue] - GM getValue function
 * @param {Function} [dependencies.GM_setValue] - GM setValue function
 * @param {Function} [dependencies.GM_deleteValue] - GM deleteValue function
 */
export function setupNotificationsTabHandlers(context = document, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    productionLog = console.log,
    productionWarn = console.warn,
    playSelectedNotification: playSelectedFn = playSelectedNotification,
    queueNotification: queueNotificationFn = queueNotification,
    showVisualNotification: showVisualFn = showVisualNotification,
    getTimeSinceLastSeen: getTimeSinceFn = getTimeSinceLastSeen,
    scanAndAlertHungryPets = typeof window !== 'undefined' && window.scanAndAlertHungryPets,
    DECOR_ITEMS = typeof window !== 'undefined' && window.DECOR_ITEMS ? window.DECOR_ITEMS : [],
    GM_getValue = typeof window !== 'undefined' && window.GM_getValue,
    GM_setValue = typeof window !== 'undefined' && window.GM_setValue,
    GM_deleteValue = typeof window !== 'undefined' && window.GM_deleteValue
  } = dependencies;

  // Notification enabled checkbox
  const notificationEnabledCheckbox = context.querySelector('#notifications-enabled-checkbox');
  if (notificationEnabledCheckbox && !notificationEnabledCheckbox.hasAttribute('data-handler-setup')) {
    notificationEnabledCheckbox.setAttribute('data-handler-setup', 'true');
    notificationEnabledCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.notifications.enabled = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🔔 [NOTIFICATIONS] ${e.target.checked ? 'Enabled' : 'Disabled'} notifications`);
    });
  }

  // Volume slider
  const volumeSlider = context.querySelector('#notification-volume-slider');
  if (volumeSlider && !volumeSlider.hasAttribute('data-handler-setup')) {
    volumeSlider.setAttribute('data-handler-setup', 'true');
    volumeSlider.addEventListener('input', e => {
      const volume = parseInt(e.target.value) / 100;
      UnifiedState.data.settings.notifications.volume = volume;
      // Update label
      const label = volumeSlider.previousElementSibling;
      label.textContent = `Volume: ${Math.round(volume * 100)}%`;
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Enable Continuous Mode checkbox
  const continuousCheckbox = context.querySelector('#notification-continuous-checkbox');
  if (continuousCheckbox && !continuousCheckbox.hasAttribute('data-handler-setup')) {
    continuousCheckbox.setAttribute('data-handler-setup', 'true');

    // On load: if continuous is already enabled, lock acknowledgment checkbox
    if (UnifiedState.data.settings.notifications.continuousEnabled) {
      const acknowledgmentCheckbox = context.querySelector('#notification-acknowledgment-checkbox');
      if (acknowledgmentCheckbox) {
        acknowledgmentCheckbox.checked = true;
        acknowledgmentCheckbox.disabled = true;
        UnifiedState.data.settings.notifications.requiresAcknowledgment = true;
      }

      // CRITICAL: Also ensure dropdown is set to continuous if checkbox is checked
      const notificationTypeSelect = context.querySelector('#notification-type-select');
      if (notificationTypeSelect) {
        notificationTypeSelect.value = 'continuous';
        UnifiedState.data.settings.notifications.notificationType = 'continuous';
        productionLog('🔊 [NOTIFICATIONS] Auto-selected continuous in dropdown (checkbox was checked on load)');
      }
    }

    continuousCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.notifications.continuousEnabled = e.target.checked;

      // When enabling continuous mode, force acknowledgment to be enabled AND disabled (locked)
      const acknowledgmentCheckbox = context.querySelector('#notification-acknowledgment-checkbox');
      if (acknowledgmentCheckbox) {
        if (e.target.checked) {
          acknowledgmentCheckbox.checked = true;
          acknowledgmentCheckbox.disabled = true; // Lock it on
          UnifiedState.data.settings.notifications.requiresAcknowledgment = true;
          productionLog(`🚨 [NOTIFICATIONS] Auto-enabled and locked acknowledgment (required for continuous alarms)`);
        } else {
          acknowledgmentCheckbox.disabled = false; // Unlock when continuous is off
        }
      }

      // Update dropdown state
      const notificationTypeSelect = context.querySelector('#notification-type-select');
      if (notificationTypeSelect) {
        const continuousOption = notificationTypeSelect.querySelector('option[value="continuous"]');
        if (continuousOption) {
          continuousOption.disabled = !e.target.checked;

          if (e.target.checked) {
            // When checking: Save current selection and auto-select continuous
            if (notificationTypeSelect.value !== 'continuous') {
              UnifiedState.data.settings.notifications.previousNotificationType = notificationTypeSelect.value;
              notificationTypeSelect.value = 'continuous';
              UnifiedState.data.settings.notifications.notificationType = 'continuous';
              productionLog(
                `🔊 [NOTIFICATIONS] Saved previous type (${UnifiedState.data.settings.notifications.previousNotificationType}), auto-selected continuous`
              );
            }
          } else {
            // When unchecking: Restore previous selection (or default to epic)
            if (notificationTypeSelect.value === 'continuous') {
              const previousType = UnifiedState.data.settings.notifications.previousNotificationType || 'epic';
              notificationTypeSelect.value = previousType;
              UnifiedState.data.settings.notifications.notificationType = previousType;
              productionLog(`🔊 [NOTIFICATIONS] Continuous mode disabled, reverted to ${previousType}`);
            }
          }
        }
      }

      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`⚠️ [NOTIFICATIONS] Continuous mode enabled: ${e.target.checked}`);
    });
  }

  // Notification type selector
  const notificationTypeSelect = context.querySelector('#notification-type-select');
  if (notificationTypeSelect && !notificationTypeSelect.hasAttribute('data-handler-setup')) {
    notificationTypeSelect.setAttribute('data-handler-setup', 'true');

    // Explicitly restore saved value (defensive - ensures dropdown matches saved state)
    const savedNotificationType = UnifiedState.data.settings.notifications.notificationType || 'epic';
    notificationTypeSelect.value = savedNotificationType;
    productionLog(`🔊 [NOTIFICATIONS] Restored notification type to: ${savedNotificationType}`);

    // On load: if continuous type is selected, lock acknowledgment checkbox
    if (UnifiedState.data.settings.notifications.notificationType === 'continuous') {
      const acknowledgmentCheckbox = context.querySelector('#notification-acknowledgment-checkbox');
      if (acknowledgmentCheckbox) {
        acknowledgmentCheckbox.checked = true;
        acknowledgmentCheckbox.disabled = true;
        UnifiedState.data.settings.notifications.requiresAcknowledgment = true;
      }
    }

    notificationTypeSelect.addEventListener('change', e => {
      // Prevent selecting continuous if not enabled
      if (e.target.value === 'continuous' && !UnifiedState.data.settings.notifications.continuousEnabled) {
        e.target.value = UnifiedState.data.settings.notifications.notificationType || 'epic';
        productionWarn(`⚠️ [NOTIFICATIONS] Cannot select continuous mode - please enable it first`);
        showVisualFn('⚠️ Please enable Continuous Mode checkbox first', false, dependencies);
        return;
      }

      UnifiedState.data.settings.notifications.notificationType = e.target.value;

      // When selecting continuous, force acknowledgment to be enabled AND locked
      const acknowledgmentCheckbox = context.querySelector('#notification-acknowledgment-checkbox');
      if (acknowledgmentCheckbox) {
        if (e.target.value === 'continuous') {
          acknowledgmentCheckbox.checked = true;
          acknowledgmentCheckbox.disabled = true; // Lock it on
          UnifiedState.data.settings.notifications.requiresAcknowledgment = true;
          productionLog(`🚨 [NOTIFICATIONS] Auto-enabled and locked acknowledgment (required for continuous alarms)`);
        } else {
          // When changing away from continuous, unlock the acknowledgment checkbox
          // (unless continuous mode checkbox is still enabled)
          if (!UnifiedState.data.settings.notifications.continuousEnabled) {
            acknowledgmentCheckbox.disabled = false;
          }
        }
      }

      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🔊 [NOTIFICATIONS] Sound type changed to: ${e.target.value}`);
    });
  }

  // Acknowledgment required checkbox
  const acknowledgmentCheckbox = context.querySelector('#notification-acknowledgment-checkbox');
  if (acknowledgmentCheckbox && !acknowledgmentCheckbox.hasAttribute('data-handler-setup')) {
    acknowledgmentCheckbox.setAttribute('data-handler-setup', 'true');

    // Explicitly restore saved value
    acknowledgmentCheckbox.checked = UnifiedState.data.settings.notifications.requiresAcknowledgment || false;
    productionLog(`🚨 [NOTIFICATIONS] Restored acknowledgment checkbox to: ${acknowledgmentCheckbox.checked}`);

    acknowledgmentCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.notifications.requiresAcknowledgment = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🚨 [NOTIFICATIONS] Require acknowledgment: ${e.target.checked}`);
    });
  }

  // Test notification button
  const testNotificationBtn = context.querySelector('#test-notification-btn');
  if (testNotificationBtn && !testNotificationBtn.hasAttribute('data-handler-setup')) {
    testNotificationBtn.setAttribute('data-handler-setup', 'true');
    testNotificationBtn.addEventListener('click', () => {
      const notifications = UnifiedState.data.settings.notifications;
      playSelectedFn(dependencies);
      queueNotificationFn(
        '🔔 Test notification - This is how alerts will look!',
        notifications.requiresAcknowledgment,
        dependencies
      );
      productionLog(
        `🔔 [NOTIFICATIONS] Test notification played - Type: ${notifications.notificationType}, Volume: ${Math.round(notifications.volume * 100)}%, Acknowledgment: ${notifications.requiresAcknowledgment}`
      );
    });
  }

  // Seed watch checkboxes
  const seedWatchMap = {
    'watch-carrot': 'Carrot',
    'watch-strawberry': 'Strawberry',
    'watch-aloe': 'Aloe',
    'watch-blueberry': 'Blueberry',
    'watch-apple': 'Apple',
    'watch-tulip': 'Tulip',
    'watch-tomato': 'Tomato',
    'watch-daffodil': 'Daffodil',
    'watch-corn': 'Corn',
    'watch-watermelon': 'Watermelon',
    'watch-pumpkin': 'Pumpkin',
    'watch-echeveria': 'Echeveria',
    'watch-coconut': 'Coconut',
    'watch-banana': 'Banana',
    'watch-lily': 'Lily',
    'watch-burrostail': 'BurrosTail',
    'watch-mushroom': 'Mushroom',
    'watch-cactus': 'Cactus',
    'watch-bamboo': 'Bamboo',
    'watch-grape': 'Grape',
    'watch-pepper': 'Pepper',
    'watch-lemon': 'Lemon',
    'watch-passionfruit': 'PassionFruit',
    'watch-dragonfruit': 'DragonFruit',
    'watch-lychee': 'Lychee',
    'watch-sunflower': 'Sunflower',
    'watch-starweaver': 'Starweaver',
    'watch-dawnbinder': 'Dawnbinder',
    'watch-moonbinder': 'Moonbinder'
  };

  Object.entries(seedWatchMap).forEach(([checkboxId, seedId]) => {
    const checkbox = context.querySelector(`#${checkboxId}`);
    if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
      checkbox.setAttribute('data-handler-setup', 'true');
      checkbox.addEventListener('change', e => {
        const notifications = UnifiedState.data.settings.notifications;
        if (e.target.checked) {
          if (!notifications.watchedSeeds.includes(seedId)) {
            notifications.watchedSeeds.push(seedId);
          }
        } else {
          notifications.watchedSeeds = notifications.watchedSeeds.filter(id => id !== seedId);
        }
        MGA_saveJSON('MGA_data', UnifiedState.data);
        productionLog(`🌱 [NOTIFICATIONS] ${e.target.checked ? 'Added' : 'Removed'} ${seedId} to/from watch list`);
        updateLastSeenDisplay();
      });
    }
  });

  // Egg watch checkboxes
  const eggWatchMap = {
    'watch-common-egg': 'CommonEgg',
    'watch-uncommon-egg': 'UncommonEgg',
    'watch-rare-egg': 'RareEgg',
    'watch-legendary-egg': 'LegendaryEgg',
    'watch-mythical-egg': 'MythicalEgg'
  };

  Object.entries(eggWatchMap).forEach(([checkboxId, eggId]) => {
    const checkbox = context.querySelector(`#${checkboxId}`);
    if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
      checkbox.setAttribute('data-handler-setup', 'true');
      checkbox.addEventListener('change', e => {
        const notifications = UnifiedState.data.settings.notifications;
        if (e.target.checked) {
          if (!notifications.watchedEggs.includes(eggId)) {
            notifications.watchedEggs.push(eggId);
          }
        } else {
          notifications.watchedEggs = notifications.watchedEggs.filter(id => id !== eggId);
        }
        MGA_saveJSON('MGA_data', UnifiedState.data);
        productionLog(`🥚 [NOTIFICATIONS] ${e.target.checked ? 'Added' : 'Removed'} ${eggId} to/from watch list`);
        updateLastSeenDisplay();
      });
    }
  });

  // Decor watch checkboxes
  DECOR_ITEMS.forEach(decor => {
    const checkboxId = `watch-decor-${decor.id.toLowerCase()}`;
    const checkbox = context.querySelector(`#${checkboxId}`);
    if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
      checkbox.setAttribute('data-handler-setup', 'true');
      checkbox.addEventListener('change', e => {
        const notifications = UnifiedState.data.settings.notifications;
        if (e.target.checked) {
          if (!notifications.watchedDecor.includes(decor.id)) {
            notifications.watchedDecor.push(decor.id);
          }
        } else {
          notifications.watchedDecor = notifications.watchedDecor.filter(id => id !== decor.id);
        }
        MGA_saveJSON('MGA_data', UnifiedState.data);
        productionLog(`🎨 [NOTIFICATIONS] ${e.target.checked ? 'Added' : 'Removed'} ${decor.id} to/from watch list`);
        updateLastSeenDisplay();
      });
    }
  });

  // Update last seen display function
  function updateLastSeenDisplay() {
    const lastSeenDisplay = context.querySelector('#last-seen-display');
    if (!lastSeenDisplay) return;

    const notifications = UnifiedState.data.settings.notifications;
    const allWatched = [...notifications.watchedSeeds, ...notifications.watchedEggs, ...notifications.watchedDecor];

    if (allWatched.length === 0) {
      lastSeenDisplay.innerHTML = 'No items being watched';
      return;
    }

    let html = '';
    allWatched.forEach(itemId => {
      const timeSince = getTimeSinceFn(itemId, dependencies);
      html += `<div>${itemId}: ${timeSince}</div>`;
    });

    lastSeenDisplay.innerHTML = html;
  }

  // Initial last seen update
  updateLastSeenDisplay();

  // Update last seen display every 30 seconds
  setInterval(updateLastSeenDisplay, 30000);

  // ==================== NEW NOTIFICATION HANDLERS ====================

  // Pet hunger enabled checkbox
  const petHungerCheckbox = context.querySelector('#pet-hunger-enabled');
  if (petHungerCheckbox && !petHungerCheckbox.hasAttribute('data-handler-setup')) {
    petHungerCheckbox.setAttribute('data-handler-setup', 'true');
    petHungerCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.notifications.petHungerEnabled = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🐾 [PET-HUNGER] ${e.target.checked ? 'Enabled' : 'Disabled'} pet hunger notifications`);

      // BUGFIX: Scan for currently hungry pets when enabling alerts
      if (e.target.checked && scanAndAlertHungryPets) {
        // Delay slightly to ensure atoms are available
        setTimeout(() => {
          scanAndAlertHungryPets();
        }, 500);
      }
    });
  }

  // Pet hunger threshold slider
  const petHungerThreshold = context.querySelector('#pet-hunger-threshold');
  if (petHungerThreshold && !petHungerThreshold.hasAttribute('data-handler-setup')) {
    petHungerThreshold.setAttribute('data-handler-setup', 'true');
    petHungerThreshold.addEventListener('input', e => {
      const threshold = parseInt(e.target.value);
      UnifiedState.data.settings.notifications.petHungerThreshold = threshold;
      // Update label
      const label = petHungerThreshold.previousElementSibling;
      label.textContent = `Alert when hunger below: ${threshold}%`;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🐾 [PET-HUNGER] Threshold set to ${threshold}%`);
    });
  }

  // Ability notifications enabled checkbox
  const abilityNotificationsCheckbox = context.querySelector('#ability-notifications-enabled');
  if (abilityNotificationsCheckbox && !abilityNotificationsCheckbox.hasAttribute('data-handler-setup')) {
    abilityNotificationsCheckbox.setAttribute('data-handler-setup', 'true');
    abilityNotificationsCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.notifications.abilityNotificationsEnabled = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`✨ [ABILITY-NOTIFY] ${e.target.checked ? 'Enabled' : 'Disabled'} ability notifications`);
    });
  }

  // Ability notification sound type selector
  const abilityNotificationSoundSelect = context.querySelector('#ability-notification-sound-select');
  if (abilityNotificationSoundSelect && !abilityNotificationSoundSelect.hasAttribute('data-handler-setup')) {
    abilityNotificationSoundSelect.setAttribute('data-handler-setup', 'true');
    abilityNotificationSoundSelect.addEventListener('change', e => {
      UnifiedState.data.settings.notifications.abilityNotificationSound = e.target.value;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`✨ [ABILITY-NOTIFY] Sound type changed to: ${e.target.value}`);
    });
  }

  // Ability notification volume slider
  const abilityVolumeSlider = context.querySelector('#ability-notification-volume-slider');
  if (abilityVolumeSlider && !abilityVolumeSlider.hasAttribute('data-handler-setup')) {
    abilityVolumeSlider.setAttribute('data-handler-setup', 'true');
    abilityVolumeSlider.addEventListener('input', e => {
      const volume = parseInt(e.target.value) / 100;
      UnifiedState.data.settings.notifications.abilityNotificationVolume = volume;
      // Update label
      const label = abilityVolumeSlider.previousElementSibling;
      label.textContent = `Ability Alert Volume: ${Math.round(volume * 100)}%`;
      MGA_saveJSON('MGA_data', UnifiedState.data);
    });
  }

  // Individual ability checkboxes
  const individualAbilityCheckboxes = context.querySelectorAll('.individual-ability-checkbox');
  individualAbilityCheckboxes.forEach(checkbox => {
    if (!checkbox.hasAttribute('data-handler-setup')) {
      checkbox.setAttribute('data-handler-setup', 'true');
      checkbox.addEventListener('change', e => {
        const abilityName = e.target.dataset.abilityName;
        if (!UnifiedState.data.settings.notifications.watchedAbilities) {
          UnifiedState.data.settings.notifications.watchedAbilities = [];
        }

        if (e.target.checked) {
          // Add to watched list
          if (!UnifiedState.data.settings.notifications.watchedAbilities.includes(abilityName)) {
            UnifiedState.data.settings.notifications.watchedAbilities.push(abilityName);
          }
        } else {
          // Remove from watched list
          const index = UnifiedState.data.settings.notifications.watchedAbilities.indexOf(abilityName);
          if (index > -1) {
            UnifiedState.data.settings.notifications.watchedAbilities.splice(index, 1);
          }
        }

        MGA_saveJSON('MGA_data', UnifiedState.data);
        productionLog(`✨ [ABILITY-NOTIFY] ${abilityName}: ${e.target.checked ? 'Enabled' : 'Disabled'}`);
      });
    }
  });

  // Ability search box
  const abilitySearchBox = context.querySelector('#ability-search-box');
  if (abilitySearchBox && !abilitySearchBox.hasAttribute('data-handler-setup')) {
    abilitySearchBox.setAttribute('data-handler-setup', 'true');
    abilitySearchBox.addEventListener('input', e => {
      const query = e.target.value.toLowerCase();
      const items = context.querySelectorAll('.ability-checkbox-item');
      items.forEach(item => {
        const abilityName = item.dataset.ability.toLowerCase();
        item.style.display = abilityName.includes(query) ? 'flex' : 'none';
      });
    });
  }

  // Select All individual abilities button
  const selectAllIndividualAbilities = context.querySelector('#select-all-individual-abilities');
  if (selectAllIndividualAbilities && !selectAllIndividualAbilities.hasAttribute('data-handler-setup')) {
    selectAllIndividualAbilities.setAttribute('data-handler-setup', 'true');
    selectAllIndividualAbilities.addEventListener('click', () => {
      // Empty array means all abilities enabled (backward compatibility)
      UnifiedState.data.settings.notifications.watchedAbilities = [];

      // Update all checkboxes
      context.querySelectorAll('.individual-ability-checkbox').forEach(checkbox => {
        checkbox.checked = true;
      });

      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog('✨ [ABILITY-NOTIFY] Enabled all abilities');
    });
  }

  // Select None individual abilities button
  const selectNoneIndividualAbilities = context.querySelector('#select-none-individual-abilities');
  if (selectNoneIndividualAbilities && !selectNoneIndividualAbilities.hasAttribute('data-handler-setup')) {
    selectNoneIndividualAbilities.setAttribute('data-handler-setup', 'true');
    selectNoneIndividualAbilities.addEventListener('click', () => {
      // Get all ability names
      const allAbilities = [];
      context.querySelectorAll('.individual-ability-checkbox').forEach(checkbox => {
        allAbilities.push(checkbox.dataset.abilityName);
      });

      // Set watchedAbilities to opposite - if we want none, we list all then check against not-in-list
      // Actually, better approach: use a special flag or empty means all, populated means only those
      // For "none", we need a way to indicate "empty set of abilities"
      // Let's use: populated array with abilities = only those; empty array = all; null = none
      UnifiedState.data.settings.notifications.watchedAbilities = ['__NONE__']; // Special marker

      // Update all checkboxes
      context.querySelectorAll('.individual-ability-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });

      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog('✨ [ABILITY-NOTIFY] Disabled all abilities');
    });
  }

  // Weather notifications enabled checkbox
  const weatherNotificationsCheckbox = context.querySelector('#weather-notifications-enabled');
  if (weatherNotificationsCheckbox && !weatherNotificationsCheckbox.hasAttribute('data-handler-setup')) {
    weatherNotificationsCheckbox.setAttribute('data-handler-setup', 'true');
    weatherNotificationsCheckbox.addEventListener('change', e => {
      UnifiedState.data.settings.notifications.weatherNotificationsEnabled = e.target.checked;
      MGA_saveJSON('MGA_data', UnifiedState.data);
      productionLog(`🌤️ [WEATHER] ${e.target.checked ? 'Enabled' : 'Disabled'} weather notifications`);
    });
  }

  // Weather event checkboxes
  const weatherEventMap = {
    'watch-snow': 'Snow',
    'watch-rain': 'Rain',
    'watch-amber-moon': 'AmberMoon',
    'watch-dawn': 'Dawn'
  };

  Object.entries(weatherEventMap).forEach(([checkboxId, eventName]) => {
    const checkbox = context.querySelector(`#${checkboxId}`);
    if (checkbox && !checkbox.hasAttribute('data-handler-setup')) {
      checkbox.setAttribute('data-handler-setup', 'true');
      checkbox.addEventListener('change', e => {
        const watchedEvents = UnifiedState.data.settings.notifications.watchedWeatherEvents;
        if (e.target.checked) {
          if (!watchedEvents.includes(eventName)) {
            watchedEvents.push(eventName);
          }
        } else {
          const idx = watchedEvents.indexOf(eventName);
          if (idx > -1) watchedEvents.splice(idx, 1);
        }
        MGA_saveJSON('MGA_data', UnifiedState.data);
        productionLog(`🌤️ [WEATHER] ${e.target.checked ? 'Added' : 'Removed'} ${eventName} to/from watch list`);
      });
    }
  });

  // ========== CUSTOM NOTIFICATION SOUNDS ==========
  const customSoundsContainer = context.querySelector('#custom-sounds-container');
  if (customSoundsContainer && !customSoundsContainer.hasAttribute('data-handler-setup')) {
    customSoundsContainer.setAttribute('data-handler-setup', 'true');

    const soundTypes = [
      { id: 'shop', label: '🛒 Shop Alerts' },
      { id: 'pet', label: '🐾 Pet Hunger' },
      { id: 'ability', label: '⚡ Ability Triggers' },
      { id: 'weather', label: '🌤️ Weather Events' }
    ];

    soundTypes.forEach(type => {
      const hasCustom = GM_getValue(`mgtools_custom_sound_${type.id}`, null) !== null;

      const controlDiv = document.createElement('div');
      controlDiv.style.cssText =
        'border: 1px solid rgba(255, 255, 255, 0.57); padding: 10px; border-radius: 6px; background: rgba(0, 0, 0, 0.48);';
      controlDiv.innerHTML = `
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                      <label class="mga-label" style="margin: 0;">${type.label}</label>
                      <span id="custom-sound-status-${type.id}" style="font-size: 10px; color: ${hasCustom ? '#10b981' : '#666'};">
                          ${hasCustom ? '✓ Custom' : '○ Default'}
                      </span>
                  </div>
                  <div style="display: flex; gap: 6px;">
                      <input type="file" accept="audio/*" id="upload-sound-${type.id}" style="display: none;">
                      <button class="mga-btn mga-btn-sm" id="upload-btn-${type.id}" style="flex: 1; background: #4a9eff; font-size: 11px; padding: 6px;">📁 Upload</button>
                      <button class="mga-btn mga-btn-sm" id="test-btn-${type.id}" style="flex: 0.6; background: #10b981; font-size: 11px; padding: 6px;">▶️ Test</button>
                      <button class="mga-btn mga-btn-sm" id="delete-btn-${type.id}" style="flex: 0.6; background: ${hasCustom ? '#ef4444' : '#666'}; font-size: 11px; padding: 6px;" ${!hasCustom ? 'disabled' : ''}>🗑️</button>
                  </div>
              `;
      customSoundsContainer.appendChild(controlDiv);

      const uploadBtn = controlDiv.querySelector(`#upload-btn-${type.id}`);
      const fileInput = controlDiv.querySelector(`#upload-sound-${type.id}`);
      uploadBtn.addEventListener('click', () => fileInput.click());

      fileInput.addEventListener('change', e => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
          alert('❌ File too large! Max 2MB');
          return;
        }
        if (!file.type.startsWith('audio/')) {
          alert('❌ Please upload an audio file');
          return;
        }

        const reader = new FileReader();
        reader.onload = event => {
          GM_setValue(`mgtools_custom_sound_${type.id}`, event.target.result);
          controlDiv.querySelector(`#custom-sound-status-${type.id}`).textContent = '✓ Custom';
          controlDiv.querySelector(`#custom-sound-status-${type.id}`).style.color = '#10b981';
          const delBtn = controlDiv.querySelector(`#delete-btn-${type.id}`);
          delBtn.disabled = false;
          delBtn.style.background = '#ef4444';
          productionLog(`🎵 [CUSTOM-SOUND] Uploaded: ${type.id}`);
          alert(`✅ Custom sound uploaded!`);
        };
        reader.readAsDataURL(file);
      });

      controlDiv.querySelector(`#test-btn-${type.id}`).addEventListener('click', () => {
        const customSound = GM_getValue(`mgtools_custom_sound_${type.id}`, null);
        const volume = UnifiedState.data.settings.notifications.volume || 0.3;
        if (customSound) {
          const audio = new Audio(customSound);
          audio.volume = volume;
          audio.play();
        } else {
          playSelectedFn(dependencies);
        }
      });

      controlDiv.querySelector(`#delete-btn-${type.id}`).addEventListener('click', () => {
        if (confirm(`Delete custom sound for ${type.label}?`)) {
          GM_deleteValue(`mgtools_custom_sound_${type.id}`);
          controlDiv.querySelector(`#custom-sound-status-${type.id}`).textContent = '○ Default';
          controlDiv.querySelector(`#custom-sound-status-${type.id}`).style.color = '#666';
          const delBtn = controlDiv.querySelector(`#delete-btn-${type.id}`);
          delBtn.disabled = true;
          delBtn.style.background = '#666';
          alert(`✅ Reverted to default sound`);
        }
      });
    });
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
  playSelectedNotification,

  // Custom Sound Wrappers (Phase 2)
  playCustomOrDefaultSound,
  playGeneralNotificationSound,
  playShopNotificationSound,
  playWeatherNotificationSound,

  // Visual Notifications (Phase 3)
  queueNotification,
  updateNotificationModal,
  generateNotificationListHTML,
  showBatchedNotificationModal,
  dismissAllNotifications,
  showVisualNotification,

  // Notification Utilities (Phase 4)
  normalizeSpeciesName,
  isWatchedItem,
  updateLastSeen,
  getTimeSinceLastSeen,
  showNotificationToast
};
