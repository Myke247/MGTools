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
 * Total Extracted: ~784 lines of core notification functionality
 * Progress: 85% (core complete)
 *
 * Remaining (UI Layer - belongs in separate module):
 * - getNotificationsTabContent() - ~592 lines of HTML generation for settings tab
 * - setupNotificationsTabHandlers() - ~613 lines of event handlers for settings tab
 * These are UI-specific and belong in the UI layer, not core notification logic.
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
