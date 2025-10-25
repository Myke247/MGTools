/**
 * HOTKEY SYSTEM MODULE
 * ====================================================================================
 * Complete hotkey management system for MGTools
 *
 * @module features/hotkeys
 *
 * Phase 1 (Complete):
 * - Recording & Utilities - ~276 lines
 *   • Module-level state (currentlyRecordingHotkey)
 *   • startRecordingHotkey() - Record game key bindings
 *   • stopRecordingHotkey() - Stop recording and reset UI
 *   • startRecordingHotkeyMGTools() - Record MGTools key bindings
 *   • shouldBlockHotkey() - Comprehensive input field detection
 *   • isTypingInInput() - Legacy alias
 *   • parseKeyCombo() - Parse key combination strings
 *   • getProperKeyCode() - Get KeyboardEvent code for simulation
 *
 * Phase 2 (Pending):
 * - Simulation & Matching - ~86 lines
 *   • matchesKeyCombo() - Check if event matches combo
 *   • simulateKeyDown() - Simulate key press
 *   • simulateKeyUp() - Simulate key release
 *
 * Phase 3 (Pending):
 * - Event Handlers - ~98 lines
 *   • handleHotkeyPress() - Global keydown handler
 *   • handleHotkeyRelease() - Global keyup handler
 *   • initializeHotkeySystem() - Initialize listeners
 *
 * Phase 4 (Pending):
 * - Tab UI - ~84 lines
 *   • setupHotkeysTabHandlers() - Setup UI event handlers
 *
 * Total Planned: ~544 lines (all phases)
 * Progress: ~51% (Phase 1 of 4 complete)
 *
 * Dependencies:
 * - Core: UnifiedState (hotkey config), MGA_saveJSON (persistence)
 * - Logging: productionLog, debugLog
 * - UI: updateTabContent (monolith function - called during recording)
 */

/* ====================================================================================
 * IMPORTS
 * ====================================================================================
 */

// NOTE: These will be available from the global scope when bundled
// In the future, we can import explicitly:
// import { productionLog, debugLog } from '../core/logging.js';

/* ====================================================================================
 * MODULE-LEVEL STATE
 * ====================================================================================
 */

/**
 * Track currently recording hotkey
 * Only one hotkey can be recorded at a time
 *
 * @type {string|null}
 */
let currentlyRecordingHotkey = null;

/* ====================================================================================
 * HOTKEY RECORDING FUNCTIONS (Phase 1)
 * ====================================================================================
 */

/**
 * Start recording a custom hotkey for game actions
 * Detects key combinations (ctrl+alt+shift+key) and checks for conflicts
 *
 * @param {string} key - Hotkey identifier (e.g., 'water', 'harvest', 'feed')
 * @param {HTMLElement} buttonElement - Button element to show recording state
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - JSON save function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.updateTabContent] - Update tab content function
 * @param {Function} [dependencies.stopRecordingHotkey] - Stop recording function (for internal use)
 * @param {Document} [dependencies.targetDocument] - Target document (default: window.document)
 */
export function startRecordingHotkey(key, buttonElement, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    productionLog = console.log,
    updateTabContent = typeof window !== 'undefined' && window.updateTabContent,
    stopRecordingHotkey: stopRecordingFn = stopRecordingHotkey,
    targetDocument = typeof window !== 'undefined' ? window.document : null
  } = dependencies;

  if (currentlyRecordingHotkey) return; // Already recording

  currentlyRecordingHotkey = key;
  const originalText = buttonElement.textContent;
  buttonElement.textContent = 'Press any key...';
  buttonElement.style.background = '#ff9900';

  // Add one-time key listener
  const recordHandler = e => {
    e.preventDefault();
    e.stopPropagation();

    // Skip modifier-only keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

    // Allow ESC to cancel
    if (e.key === 'Escape') {
      stopRecordingFn(buttonElement, originalText, dependencies);
      targetDocument.removeEventListener('keydown', recordHandler, true);
      return;
    }

    // Build key combination string
    let keyCombo = '';
    if (e.ctrlKey) keyCombo += 'ctrl+';
    if (e.altKey) keyCombo += 'alt+';
    if (e.shiftKey) keyCombo += 'shift+';

    // Handle special keys
    const keyName = e.key === ' ' ? 'space' : e.key.toLowerCase();
    keyCombo += keyName;

    // Check for conflicts
    const conflicts = [];
    Object.entries(UnifiedState.data.hotkeys.gameKeys).forEach(([k, config]) => {
      if (k !== key && config.custom && config.custom === keyCombo) {
        conflicts.push(config.name);
      }
    });

    if (conflicts.length > 0) {
      alert(`Key "${keyCombo}" is already assigned to: ${conflicts.join(', ')}`);
      stopRecordingFn(buttonElement, originalText, dependencies);
      targetDocument.removeEventListener('keydown', recordHandler, true);
      return;
    }

    // Save the new key
    UnifiedState.data.hotkeys.gameKeys[key].custom = keyCombo;
    MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);

    stopRecordingFn(buttonElement, null, dependencies);
    if (updateTabContent) updateTabContent(); // Refresh display to show new key and reset button
    targetDocument.removeEventListener('keydown', recordHandler, true);

    productionLog(`🎮 [HOTKEYS] Remapped ${key}: ${UnifiedState.data.hotkeys.gameKeys[key].original} → ${keyCombo}`);
  };

  targetDocument.addEventListener('keydown', recordHandler, true);
}

/**
 * Stop hotkey recording and reset UI
 * Clears recording state and restores original button text
 *
 * @param {HTMLElement} buttonElement - Button element to reset
 * @param {string|null} originalText - Original button text to restore (null = keep current text)
 * @param {Object} [dependencies] - Optional dependencies (unused but kept for consistency)
 */
export function stopRecordingHotkey(buttonElement, originalText, dependencies = {}) {
  if (!currentlyRecordingHotkey) return;

  if (originalText) {
    buttonElement.textContent = originalText;
  }
  buttonElement.style.background = '';
  currentlyRecordingHotkey = null;
}

/**
 * Start recording a custom hotkey for MGTools actions
 * Similar to startRecordingHotkey but for MGTools-specific actions (toggleUI, cyclePreset, etc.)
 * Checks for conflicts in both gameKeys and mgToolsKeys
 *
 * @param {string} key - Hotkey identifier (e.g., 'toggleUI', 'cyclePreset')
 * @param {HTMLElement} buttonElement - Button element to show recording state
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - JSON save function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.updateTabContent] - Update tab content function
 * @param {Function} [dependencies.stopRecordingHotkey] - Stop recording function
 * @param {Document} [dependencies.targetDocument] - Target document (default: window.document)
 */
export function startRecordingHotkeyMGTools(key, buttonElement, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    productionLog = console.log,
    updateTabContent = typeof window !== 'undefined' && window.updateTabContent,
    stopRecordingHotkey: stopRecordingFn = stopRecordingHotkey,
    targetDocument = typeof window !== 'undefined' ? window.document : null
  } = dependencies;

  if (currentlyRecordingHotkey) return; // Already recording

  currentlyRecordingHotkey = key;
  const originalText = buttonElement.textContent;
  buttonElement.textContent = 'Press any key...';
  buttonElement.style.background = '#ff9900';

  // Add one-time key listener
  const recordHandler = e => {
    e.preventDefault();
    e.stopPropagation();

    // Skip modifier-only keys
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return;

    // Allow ESC to cancel
    if (e.key === 'Escape') {
      stopRecordingFn(buttonElement, originalText, dependencies);
      targetDocument.removeEventListener('keydown', recordHandler, true);
      return;
    }

    // Build key combination string
    let keyCombo = '';
    if (e.ctrlKey) keyCombo += 'ctrl+';
    if (e.altKey) keyCombo += 'alt+';
    if (e.shiftKey) keyCombo += 'shift+';

    // Handle special keys
    const keyName = e.key === ' ' ? 'space' : e.key.toLowerCase();
    keyCombo += keyName;

    // Check for conflicts in both gameKeys and mgToolsKeys
    const conflicts = [];
    Object.entries(UnifiedState.data.hotkeys.gameKeys).forEach(([k, config]) => {
      if (config.custom && config.custom === keyCombo) {
        conflicts.push(config.name);
      }
    });
    Object.entries(UnifiedState.data.hotkeys.mgToolsKeys).forEach(([k, config]) => {
      if (k !== key && config.custom && config.custom === keyCombo) {
        conflicts.push(config.name);
      }
    });

    if (conflicts.length > 0) {
      alert(`Key "${keyCombo}" is already assigned to: ${conflicts.join(', ')}`);
      stopRecordingFn(buttonElement, originalText, dependencies);
      targetDocument.removeEventListener('keydown', recordHandler, true);
      return;
    }

    // Save the new key
    UnifiedState.data.hotkeys.mgToolsKeys[key].custom = keyCombo;
    MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);

    stopRecordingFn(buttonElement, null, dependencies);
    if (updateTabContent) updateTabContent(); // Refresh display to show new key and reset button
    targetDocument.removeEventListener('keydown', recordHandler, true);

    productionLog(`🎮 [HOTKEYS] Set MGTools key ${key}: ${keyCombo}`);
  };

  targetDocument.addEventListener('keydown', recordHandler, true);
}

/* ====================================================================================
 * INPUT DETECTION UTILITIES (Phase 1)
 * ====================================================================================
 */

/**
 * Check if hotkeys should be blocked (user is typing in an input field)
 * Comprehensive detection for various input types across different environments
 *
 * Detects:
 * - Basic input elements (input, textarea, select)
 * - Chakra UI chat inputs
 * - Contenteditable elements
 * - ARIA role="textbox"
 * - Shadow DOM elements
 * - Discord chat inputs
 * - In-game chat inputs (pattern-based detection)
 * - Chat containers (parent traversal)
 *
 * @param {KeyboardEvent|null} event - Keyboard event to check (null = use activeElement only)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object (for debug mode)
 * @param {Document} [dependencies.targetDocument] - Target document (default: window.document)
 * @returns {boolean} True if hotkeys should be blocked
 */
export function shouldBlockHotkey(event, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    targetDocument = typeof window !== 'undefined' ? window.document : null
  } = dependencies;

  const active = targetDocument.activeElement;
  if (!active) return false;

  // Basic input elements
  const tagName = active.tagName?.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // SPECIFIC CHECK for game's Chakra UI chat input
  if (active.classList?.contains('chakra-input')) {
    if (UnifiedState?.data?.settings?.debugMode) {
      console.log('[FIX_HOTKEYS] Blocking - Chakra UI input detected');
    }
    return true;
  }

  // Contenteditable
  if (active.contentEditable === 'true' || active.isContentEditable) {
    return true;
  }

  // ARIA role
  if (active.getAttribute('role') === 'textbox') {
    return true;
  }

  // Shadow DOM traversal
  if (event && event.composedPath) {
    const path = event.composedPath();
    for (const element of path) {
      if (!element.tagName) continue;

      const tag = element.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        return true;
      }

      if (element.contentEditable === 'true' || element.getAttribute?.('role') === 'textbox') {
        return true;
      }
    }
  }

  // Discord chat detection
  const discordSelectors = [
    '.chat-input-container',
    '[class*="textArea"]',
    '[class*="slateTextArea"]',
    '.markup-input'
  ];

  for (const selector of discordSelectors) {
    try {
      const chatElement = targetDocument.querySelector(selector);
      if (chatElement && chatElement.contains(active)) {
        return true;
      }
    } catch {
      // Ignore selector errors
    }
  }

  // In-game chat detection - check for common game chat patterns
  // Look for input fields that might be chat, even if not marked as such
  const activeClasses = active.className || '';
  const activeId = active.id || '';

  // Check if active element has chat-related classes or IDs
  const chatPatterns = ['chat', 'message', 'input', 'text', 'field', 'edit'];
  const hasChatPattern = chatPatterns.some(
    pattern => activeClasses.toLowerCase().includes(pattern) || activeId.toLowerCase().includes(pattern)
  );

  if (hasChatPattern && (tagName === 'div' || tagName === 'span' || active.isContentEditable)) {
    // Likely a chat input
    console.log('[FIX_HOTKEYS] Blocking hotkey - detected chat input:', {
      tag: tagName,
      classes: activeClasses,
      id: activeId,
      contentEditable: active.contentEditable
    });
    return true;
  }

  // Check parent elements for chat containers
  let parent = active.parentElement;
  let depth = 0;
  while (parent && depth < 5) {
    const parentClasses = parent.className || '';
    const parentId = parent.id || '';

    if (
      chatPatterns.some(
        pattern => parentClasses.toLowerCase().includes(pattern) || parentId.toLowerCase().includes(pattern)
      )
    ) {
      console.log('[FIX_HOTKEYS] Blocking hotkey - active element in chat container:', {
        parentTag: parent.tagName,
        parentClasses,
        parentId,
        activeTag: tagName
      });
      return true;
    }

    parent = parent.parentElement;
    depth++;
  }

  return false;
}

/**
 * Legacy alias for shouldBlockHotkey
 * Maintained for backwards compatibility with existing code
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @returns {boolean} True if user is typing in an input
 */
export function isTypingInInput(dependencies = {}) {
  return shouldBlockHotkey(null, dependencies);
}

/* ====================================================================================
 * KEY PARSING UTILITIES (Phase 1)
 * ====================================================================================
 */

/**
 * Parse a key combination string into modifiers and key
 * Handles format: "ctrl+alt+shift+key" or just "key"
 *
 * @param {string} combo - Key combination string (e.g., "ctrl+shift+a", "space")
 * @returns {Object} Parsed key combo with modifiers and key
 * @returns {boolean} return.ctrl - Ctrl key pressed
 * @returns {boolean} return.alt - Alt key pressed
 * @returns {boolean} return.shift - Shift key pressed
 * @returns {string} return.key - Main key (space is converted to ' ')
 */
export function parseKeyCombo(combo) {
  const parts = combo.toLowerCase().split('+');
  return {
    ctrl: parts.includes('ctrl'),
    alt: parts.includes('alt'),
    shift: parts.includes('shift'),
    key: parts[parts.length - 1] === 'space' ? ' ' : parts[parts.length - 1]
  };
}

/**
 * Get the proper KeyboardEvent code for a given key
 * Used for simulating keyboard events with correct codes
 *
 * Maps key names to KeyboardEvent.code values:
 * - Special keys (space, enter, arrows, etc.)
 * - F-keys (F1-F12)
 * - Numbers (Digit0-Digit9)
 * - Letters (KeyA-KeyZ)
 * - Symbols (Minus, Equal, BracketLeft, etc.)
 *
 * @param {string} key - Key name (e.g., "a", "space", "f1", "enter")
 * @returns {string} KeyboardEvent code (e.g., "KeyA", "Space", "F1", "Enter")
 */
export function getProperKeyCode(key) {
  // Handle special keys
  const codeMap = {
    ' ': 'Space',
    space: 'Space',
    enter: 'Enter',
    tab: 'Tab',
    escape: 'Escape',
    backspace: 'Backspace',
    delete: 'Delete',
    arrowup: 'ArrowUp',
    arrowdown: 'ArrowDown',
    arrowleft: 'ArrowLeft',
    arrowright: 'ArrowRight',
    home: 'Home',
    end: 'End',
    pageup: 'PageUp',
    pagedown: 'PageDown',
    '-': 'Minus',
    '=': 'Equal',
    '[': 'BracketLeft',
    ']': 'BracketRight',
    ';': 'Semicolon',
    "'": 'Quote',
    ',': 'Comma',
    '.': 'Period',
    '/': 'Slash',
    '\\': 'Backslash',
    '`': 'Backquote'
  };

  const lowerKey = key.toLowerCase();

  // Check special keys map
  if (codeMap[lowerKey]) return codeMap[lowerKey];

  // F-keys
  if (/^f([1-9]|1[0-2])$/.test(lowerKey)) {
    return 'F' + lowerKey.substring(1);
  }

  // Numbers
  if (/^[0-9]$/.test(key)) {
    return 'Digit' + key;
  }

  // Letters
  if (/^[a-z]$/i.test(key)) {
    return 'Key' + key.toUpperCase();
  }

  // Fallback - just capitalize
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Recording Functions
  startRecordingHotkey,
  stopRecordingHotkey,
  startRecordingHotkeyMGTools,

  // Input Detection
  shouldBlockHotkey,
  isTypingInInput,

  // Key Parsing Utilities
  parseKeyCombo,
  getProperKeyCode
};
