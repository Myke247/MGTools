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
 * Phase 2 (Complete):
 * - Simulation & Matching - ~50 lines
 *   • heldRemappedKeys Map - Track held remapped keys
 *   • matchesKeyCombo() - Check if event matches combo
 *   • simulateKeyDown() - Simulate key press
 *   • simulateKeyUp() - Simulate key release
 *
 * Phase 3 (Complete):
 * - Event Handlers - ~140 lines
 *   • handleHotkeyPress() - Global keydown handler (game key remapping)
 *   • handleHotkeyRelease() - Global keyup handler
 *   • initializeHotkeySystem() - Initialize listeners
 *
 * Phase 4 (Complete):
 * - Tab UI - ~84 lines
 *   • setupHotkeysTabHandlers() - Setup UI event handlers
 *
 * Total Extracted: ~550 lines (ALL 4 PHASES COMPLETE!)
 * Progress: 100% (hotkey system fully extracted!)
 *
 * Dependencies:
 * - Core: UnifiedState (hotkey config), MGA_saveJSON (persistence)
 * - Logging: productionLog, debugLog
 * - UI: updateTabContent (monolith function - called during recording)
 * - Shop: toggleShopWindows (monolith function - called by toggleQuickShop hotkey)
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
 * KEY SIMULATION & MATCHING (Phase 2)
 * ====================================================================================
 */

/**
 * Track which remapped keys are currently held down
 * Maps custom key combo → original key combo
 * Used to ensure proper key release when user lifts a remapped key
 *
 * @type {Map<string, string>}
 */
const heldRemappedKeys = new Map();

/**
 * Check if a KeyboardEvent matches a key combination string
 * Compares modifiers (ctrl, alt, shift) and main key
 *
 * @param {KeyboardEvent} event - Keyboard event to check
 * @param {string} combo - Key combination string (e.g., "ctrl+shift+a")
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.parseKeyCombo] - Key combo parser (default: parseKeyCombo)
 * @returns {boolean} True if event matches combo
 */
export function matchesKeyCombo(event, combo, dependencies = {}) {
  const { parseKeyCombo: parseFn = parseKeyCombo } = dependencies;

  const parsed = parseFn(combo);
  const eventKey = event.key.toLowerCase();

  return (
    event.ctrlKey === parsed.ctrl &&
    event.altKey === parsed.alt &&
    event.shiftKey === parsed.shift &&
    (eventKey === parsed.key || (parsed.key === ' ' && eventKey === ' '))
  );
}

/**
 * Simulate a key press (keydown event)
 * Creates and dispatches a KeyboardEvent with proper code and modifiers
 *
 * @param {string} keyCombo - Key combination to simulate (e.g., "ctrl+shift+a")
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.parseKeyCombo] - Key combo parser (default: parseKeyCombo)
 * @param {Function} [dependencies.getProperKeyCode] - Key code getter (default: getProperKeyCode)
 * @param {Document} [dependencies.targetDocument] - Target document (default: window.document)
 */
export function simulateKeyDown(keyCombo, dependencies = {}) {
  const {
    parseKeyCombo: parseFn = parseKeyCombo,
    getProperKeyCode: getCodeFn = getProperKeyCode,
    targetDocument = typeof window !== 'undefined' ? window.document : null
  } = dependencies;

  const parsed = parseFn(keyCombo);

  // Create keydown event
  const downEvent = new KeyboardEvent('keydown', {
    key: parsed.key,
    code: getCodeFn(parsed.key),
    ctrlKey: parsed.ctrl,
    altKey: parsed.alt,
    shiftKey: parsed.shift,
    bubbles: true,
    cancelable: true,
    repeat: false // First press
  });

  // Dispatch to document (where game listens)
  targetDocument.dispatchEvent(downEvent);
}

/**
 * Simulate a key release (keyup event)
 * Creates and dispatches a KeyboardEvent with proper code and modifiers
 *
 * @param {string} keyCombo - Key combination to simulate (e.g., "ctrl+shift+a")
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.parseKeyCombo] - Key combo parser (default: parseKeyCombo)
 * @param {Function} [dependencies.getProperKeyCode] - Key code getter (default: getProperKeyCode)
 * @param {Document} [dependencies.targetDocument] - Target document (default: window.document)
 */
export function simulateKeyUp(keyCombo, dependencies = {}) {
  const {
    parseKeyCombo: parseFn = parseKeyCombo,
    getProperKeyCode: getCodeFn = getProperKeyCode,
    targetDocument = typeof window !== 'undefined' ? window.document : null
  } = dependencies;

  const parsed = parseFn(keyCombo);

  // Create keyup event
  const upEvent = new KeyboardEvent('keyup', {
    key: parsed.key,
    code: getCodeFn(parsed.key),
    ctrlKey: parsed.ctrl,
    altKey: parsed.alt,
    shiftKey: parsed.shift,
    bubbles: true,
    cancelable: true
  });

  targetDocument.dispatchEvent(upEvent);
}

/* ====================================================================================
 * HOTKEY EVENT HANDLERS (Phase 3)
 * ====================================================================================
 */

/**
 * Global keydown/keyup handler for hotkey system
 * Handles:
 * - ESC to close sidebar (always active)
 * - Blocking hotkeys when typing in inputs
 * - Remapping custom keys to original game keys
 * - Triggering script functions (toggleQuickShop)
 * - Suppressing original keys that have been remapped
 *
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.shouldBlockHotkey] - Input detection function
 * @param {Function} [dependencies.matchesKeyCombo] - Key combo matcher
 * @param {Function} [dependencies.simulateKeyDown] - Key simulation function
 * @param {Function} [dependencies.simulateKeyUp] - Key simulation function
 * @param {Function} [dependencies.toggleShopWindows] - Shop window toggle function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Document} [dependencies.targetDocument] - Target document
 */
export function handleHotkeyPress(e, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    shouldBlockHotkey: shouldBlockFn = shouldBlockHotkey,
    matchesKeyCombo: matchesFn = matchesKeyCombo,
    simulateKeyDown: simDownFn = simulateKeyDown,
    simulateKeyUp: simUpFn = simulateKeyUp,
    toggleShopWindows = typeof window !== 'undefined' && window.toggleShopWindows,
    productionLog = console.log,
    targetDocument = typeof window !== 'undefined' ? window.document : null
  } = dependencies;

  // ESC key closes sidebar (always active, even if hotkeys disabled)
  if (e.key === 'Escape' && e.type === 'keydown') {
    const sidebar = targetDocument.getElementById('mgh-sidebar');
    if (sidebar && sidebar.classList.contains('open')) {
      sidebar.classList.remove('open');
      e.preventDefault();
      e.stopPropagation();
      return;
    }
  }

  // Skip if disabled, typing in input, recording a hotkey, or in room search/add room inputs
  const isRoomSearch = e.target && e.target.id === 'room-search-input';
  const isAddRoomInput = e.target && e.target.id === 'add-room-input';
  const isRoomSearchFocused = targetDocument.activeElement && targetDocument.activeElement.id === 'room-search-input';
  const isAddRoomFocused = targetDocument.activeElement && targetDocument.activeElement.id === 'add-room-input';

  // CRITICAL: Skip simulated events to prevent infinite loops
  // Simulated events have isTrusted: false, real user keypresses have isTrusted: true
  if (!e.isTrusted) return;

  // Block hotkeys when typing in inputs (enhanced with shadow DOM support)
  if (shouldBlockFn(e, dependencies)) {
    // CRITICAL: Stop event from reaching game's hotkey handler
    // DO NOT use preventDefault() - that blocks typing in the input!
    // stopImmediatePropagation() prevents OTHER handlers from seeing this event
    // EXCEPTION: Allow Enter key to reach game's chat handler for message submission
    if (e.key !== 'Enter') {
      e.stopImmediatePropagation();
    }

    // Log when hotkey is blocked (helps diagnose chat detection issues)
    if (UnifiedState.data.settings?.debugMode) {
      const active = targetDocument.activeElement;
      console.log('[FIX_HOTKEYS] Hotkey blocked - typing detected:', {
        key: e.key,
        tag: active?.tagName,
        id: active?.id,
        classes: active?.className,
        contentEditable: active?.contentEditable
      });
    }
    return;
  }

  if (
    !UnifiedState.data.hotkeys.enabled ||
    currentlyRecordingHotkey ||
    isRoomSearch ||
    isRoomSearchFocused ||
    isAddRoomInput ||
    isAddRoomFocused
  )
    return;

  const isKeyDown = e.type === 'keydown';
  const isKeyUp = e.type === 'keyup';

  // STEP 1: Check each remapped key (custom → original)
  for (const [action, config] of Object.entries(UnifiedState.data.hotkeys.gameKeys)) {
    if (config.custom) {
      // Check if pressed key matches custom mapping
      if (matchesFn(e, config.custom, dependencies)) {
        e.preventDefault();
        e.stopPropagation();

        // Special handling for script functions (not game keys)
        if (action === 'toggleQuickShop') {
          if (isKeyDown && !e.repeat) {
            if (toggleShopWindows) toggleShopWindows();
            if (UnifiedState.data.settings.debugMode) {
              productionLog(`🎮 [HOTKEYS] Triggered Quick Shop toggle via ${config.custom}`);
            }
          }
          return false;
        }

        if (isKeyDown) {
          // Only simulate keydown once per hold (ignore repeat events)
          if (!e.repeat) {
            simDownFn(config.original, dependencies);
            heldRemappedKeys.set(config.custom, config.original);
            if (UnifiedState.data.settings.debugMode) {
              productionLog(`🎮 [HOTKEYS] Remapped keydown ${config.custom} → ${config.original} (${config.name})`);
            }
          }
        } else if (isKeyUp) {
          // Simulate keyup when released
          simUpFn(config.original, dependencies);
          heldRemappedKeys.delete(config.custom);
          if (UnifiedState.data.settings.debugMode) {
            productionLog(`🎮 [HOTKEYS] Remapped keyup ${config.custom} → ${config.original} (${config.name})`);
          }
        }
        return false;
      }
    }
  }

  // STEP 2: Check for non-remapped script functions using original key
  for (const [action, config] of Object.entries(UnifiedState.data.hotkeys.gameKeys)) {
    if (!config.custom && action === 'toggleQuickShop') {
      if (matchesFn(e, config.original, dependencies)) {
        if (isKeyDown && !e.repeat) {
          e.preventDefault();
          e.stopPropagation();
          if (toggleShopWindows) toggleShopWindows();
          if (UnifiedState.data.settings.debugMode) {
            productionLog(`🎮 [HOTKEYS] Triggered Quick Shop toggle via ${config.original}`);
          }
          return false;
        }
      }
    }
  }

  // STEP 3: Suppress original keys that have been remapped
  for (const [action, config] of Object.entries(UnifiedState.data.hotkeys.gameKeys)) {
    if (config.custom && matchesFn(e, config.original, dependencies)) {
      // Original key has been remapped, suppress it
      e.preventDefault();
      e.stopPropagation();
      if (UnifiedState.data.settings.debugMode && !e.repeat) {
        productionLog(`🚫 [HOTKEYS] Suppressed ${config.original} (remapped to ${config.custom} for ${config.name})`);
      }
      return false;
    }
  }
}

/**
 * Global keyup handler for hotkey system
 * Delegates to handleHotkeyPress which checks e.type
 *
 * @param {KeyboardEvent} e - Keyboard event
 * @param {Object} [dependencies] - Optional dependencies (passed to handleHotkeyPress)
 */
export function handleHotkeyRelease(e, dependencies = {}) {
  // Just call the same handler - it checks e.type
  const { handleHotkeyPress: handleFn = handleHotkeyPress } = dependencies;
  handleFn(e, dependencies);
}

/**
 * Initialize hotkey system by installing global event listeners
 * Listens for keydown and keyup events in capture phase (highest priority)
 *
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.handleHotkeyPress] - Keydown handler
 * @param {Function} [dependencies.handleHotkeyRelease] - Keyup handler
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Document} [dependencies.targetDocument] - Target document
 */
export function initializeHotkeySystem(dependencies = {}) {
  const {
    handleHotkeyPress: handlePressFn = handleHotkeyPress,
    handleHotkeyRelease: handleReleaseFn = handleHotkeyRelease,
    productionLog = console.log,
    targetDocument = typeof window !== 'undefined' ? window.document : null
  } = dependencies;

  targetDocument.addEventListener('keydown', e => handlePressFn(e, dependencies), true);
  targetDocument.addEventListener('keyup', e => handleReleaseFn(e, dependencies), true);
  productionLog('🎮 [HOTKEYS] Key interception system installed (keydown + keyup)');
}

/* ====================================================================================
 * HOTKEY TAB UI (Phase 4)
 * ====================================================================================
 */

/**
 * Setup event handlers for hotkey settings tab
 * Handles:
 * - Enable/disable checkbox
 * - Game hotkey rebind buttons
 * - MGTools hotkey rebind buttons
 * - Reset individual hotkeys
 * - Reset all hotkeys
 * - Export hotkey configuration
 *
 * @param {Document|HTMLElement} [context] - Context to search for elements (default: document)
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - JSON save function
 * @param {Function} [dependencies.productionLog] - Production logging function
 * @param {Function} [dependencies.startRecordingHotkey] - Start recording game hotkey
 * @param {Function} [dependencies.startRecordingHotkeyMGTools] - Start recording MGTools hotkey
 * @param {Function} [dependencies.updateTabContent] - Update tab content function
 */
export function setupHotkeysTabHandlers(context = document, dependencies = {}) {
  const {
    UnifiedState = typeof window !== 'undefined' && window.UnifiedState,
    MGA_saveJSON = typeof window !== 'undefined' && window.MGA_saveJSON,
    productionLog = console.log,
    startRecordingHotkey: startRecordingFn = startRecordingHotkey,
    startRecordingHotkeyMGTools: startRecordingMGToolsFn = startRecordingHotkeyMGTools,
    updateTabContent = typeof window !== 'undefined' && window.updateTabContent
  } = dependencies;

  // Enable/disable checkbox
  const enableCheckbox = context.querySelector('#hotkeys-enabled');
  if (enableCheckbox) {
    enableCheckbox.addEventListener('change', e => {
      UnifiedState.data.hotkeys.enabled = e.target.checked;
      MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);
      productionLog(`🎮 [HOTKEYS] ${e.target.checked ? 'Enabled' : 'Disabled'}`);
    });
  }

  // Hotkey buttons
  context.querySelectorAll('.hotkey-button').forEach(button => {
    button.addEventListener('click', function () {
      const key = this.dataset.key;
      startRecordingFn(key, this, dependencies);
    });
  });

  // Reset buttons
  context.querySelectorAll('.hotkey-reset').forEach(button => {
    button.addEventListener('click', function () {
      const key = this.dataset.key;
      UnifiedState.data.hotkeys.gameKeys[key].custom = null;
      MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);
      if (updateTabContent) updateTabContent(); // Refresh display
      productionLog(`🎮 [HOTKEYS] Reset ${key} to default`);
    });
  });

  // MGTools hotkey buttons
  context.querySelectorAll('.hotkey-button-mgtools').forEach(button => {
    button.addEventListener('click', function () {
      const key = this.dataset.key;
      startRecordingMGToolsFn(key, this, dependencies);
    });
  });

  // MGTools reset buttons
  context.querySelectorAll('.hotkey-reset-mgtools').forEach(button => {
    button.addEventListener('click', function () {
      const key = this.dataset.key;
      UnifiedState.data.hotkeys.mgToolsKeys[key].custom = null;
      MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);
      if (updateTabContent) updateTabContent(); // Refresh display
      productionLog(`🎮 [HOTKEYS] Reset MGTools key ${key} to default`);
    });
  });

  // Reset all button
  const resetAllBtn = context.querySelector('#hotkeys-reset-all');
  if (resetAllBtn) {
    resetAllBtn.addEventListener('click', () => {
      if (confirm('Reset all hotkeys to defaults?')) {
        Object.keys(UnifiedState.data.hotkeys.gameKeys).forEach(key => {
          UnifiedState.data.hotkeys.gameKeys[key].custom = null;
        });
        Object.keys(UnifiedState.data.hotkeys.mgToolsKeys).forEach(key => {
          UnifiedState.data.hotkeys.mgToolsKeys[key].custom = null;
        });
        MGA_saveJSON('MGA_hotkeys', UnifiedState.data.hotkeys);
        if (updateTabContent) updateTabContent();
        productionLog('🎮 [HOTKEYS] Reset all hotkeys to defaults');
      }
    });
  }

  // Export button
  const exportBtn = context.querySelector('#hotkeys-export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const exportData = {};
      Object.entries(UnifiedState.data.hotkeys.gameKeys).forEach(([key, config]) => {
        if (config.custom) {
          exportData[key] = config.custom;
        }
      });
      const json = JSON.stringify(exportData, null, 2);
      navigator.clipboard.writeText(json);
      alert('Hotkey configuration copied to clipboard!');
    });
  }
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Recording Functions (Phase 1)
  startRecordingHotkey,
  stopRecordingHotkey,
  startRecordingHotkeyMGTools,

  // Input Detection (Phase 1)
  shouldBlockHotkey,
  isTypingInInput,

  // Key Parsing Utilities (Phase 1)
  parseKeyCombo,
  getProperKeyCode,

  // Key Simulation & Matching (Phase 2)
  matchesKeyCombo,
  simulateKeyDown,
  simulateKeyUp,

  // Event Handlers (Phase 3)
  handleHotkeyPress,
  handleHotkeyRelease,
  initializeHotkeySystem,

  // Tab UI (Phase 4)
  setupHotkeysTabHandlers
};
