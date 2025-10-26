/**
 * Comprehensive Tooltip System Module
 * Provides smart tooltips for MGTools UI elements with positioning and timing control
 *
 * Features:
 * - Automatic positioning with viewport awareness
 * - Configurable show/hide delays
 * - Mouse tracking for smooth movement
 * - Event isolation (doesn't interfere with game tooltips)
 * - Interactive element detection (skips buttons to prevent hover conflicts)
 *
 * @module TooltipSystem
 */

/**
 * Tooltip system styles for animations and special tooltip types
 * @constant {string}
 */
export const TOOLTIP_STYLES = `
@keyframes mga-fade-out {
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-10px); }
}

/* Ensure our estimate/slot-value paragraphs behave as full-width, centered lines
   so they appear centered inside the game's tooltip textbox regardless of container quirks. */
[data-turtletimer-estimate="true"] {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box !important;
  text-align: center !important;       /* centers text inside the tooltip textbox */
  margin: 2px 0 !important;
  padding: 0 !important;
  color: lime !important;
  font-weight: bold !important;
  font-size: 14px !important;
  line-height: 1.25 !important;
}

[data-turtletimer-slot-value="true"] {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box !important;
  text-align: center !important;       /* centers text inside the tooltip textbox */
  margin: 2px 0 !important;
  padding: 0 !important;
  color: #FFD700 !important;
  font-weight: 600 !important;
  font-size: 13px !important;
  line-height: 1.25 !important;
}
`;

/**
 * Create comprehensive tooltip system with smart positioning and timing
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Document} dependencies.targetDocument - Target document for tooltip element
 * @param {Document} dependencies.document - Regular document for event listeners
 * @param {Window} dependencies.window - Window object for positioning
 * @param {Function} dependencies.isMGAEvent - Event isolation check function
 * @returns {object} Tooltip system object with methods
 */
export function createTooltipSystem(dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    document: doc = typeof document !== 'undefined' ? document : null,
    window: win = typeof window !== 'undefined' ? window : null,
    isMGAEvent = () => true
  } = dependencies;

  if (!targetDocument || !doc || !win) {
    // Return stub tooltip system
    return {
      init: () => {},
      show: () => {},
      hide: () => {},
      position: () => {},
      addToElement: () => {},
      removeFromElement: () => {},
      destroy: () => {}
    };
  }

  // Module-level state
  const state = {
    tooltip: null,
    showTimeout: null,
    hideTimeout: null,
    currentEvent: null // Store current mouse event for positioning
  };

  /**
   * Handle mouse enter event on tooltip elements
   * @param {MouseEvent} e - Mouse event
   */
  function handleMouseEnter(e) {
    const element = e.target?.closest?.('[data-tooltip]');
    if (!element) return;

    // Don't interfere with button interactions - check if target is a button or interactive element
    if (
      e.target &&
      typeof e.target.matches === 'function' &&
      (e.target.matches('button, input, select, .mga-btn') || e.target.closest('button, .mga-btn'))
    ) {
      return; // Skip tooltip for interactive elements to prevent hover interference
    }

    const text = element.dataset.tooltip;
    const delay = element.dataset.tooltipDelay || 500;

    // Store the event for positioning
    state.currentEvent = e;

    state.showTimeout = setTimeout(
      () => {
        show(element, text);
      },
      parseInt(delay, 10)
    );
  }

  /**
   * Handle mouse leave event on tooltip elements
   * @param {MouseEvent} e - Mouse event
   */
  function handleMouseLeave(e) {
    const element = e.target?.closest?.('[data-tooltip]');
    if (!element) return;

    clearTimeout(state.showTimeout);
    hide();
  }

  /**
   * Handle mouse move event for tooltip positioning
   * @param {MouseEvent} e - Mouse event
   */
  function handleMouseMove(e) {
    // CRITICAL: Only handle MGA-related tooltip events
    if (!isMGAEvent(e)) {
      return;
    }

    // Don't interfere with button hover states
    if (
      e.target &&
      typeof e.target.matches === 'function' &&
      (e.target.matches('button, input, select, .mga-btn') || e.target.closest('button, .mga-btn'))
    ) {
      return;
    }

    // Update current event for positioning
    state.currentEvent = e;

    if (state.tooltip && state.tooltip.classList.contains('show')) {
      // Check if we're still over a tooltip element
      const tooltipElement = e.target?.closest?.('[data-tooltip]');
      if (!tooltipElement) {
        hide();
        return;
      }
      position(e);
    }
  }

  /**
   * Show tooltip with given text
   * @param {HTMLElement} element - Element that triggered tooltip
   * @param {string} text - Tooltip text to display
   */
  function show(element, text) {
    const { tooltip } = state;
    tooltip.textContent = text;

    // BUGFIX: Position immediately before showing to prevent flash at (0,0)
    if (state.currentEvent) {
      position(state.currentEvent);
    }

    tooltip.classList.add('show');
  }

  /**
   * Hide tooltip and reset position
   */
  function hide() {
    const { tooltip } = state;
    tooltip.classList.remove('show');

    // BUGFIX: Reset position to prevent stuck tooltips
    tooltip.style.left = '-9999px';
    tooltip.style.top = '-9999px';
    state.currentEvent = null;
  }

  /**
   * Position tooltip relative to cursor with viewport awareness
   * @param {MouseEvent} e - Mouse event
   */
  function position(e) {
    const { tooltip } = state;
    const rect = tooltip.getBoundingClientRect();
    const padding = 10;

    let x = e.clientX + padding;
    let y = e.clientY - rect.height - padding;

    // Adjust if tooltip goes off screen
    if (x + rect.width > win.innerWidth) {
      x = e.clientX - rect.width - padding;
    }
    if (y < 0) {
      y = e.clientY + padding;
    }

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }

  /**
   * Add tooltip to an element
   * @param {HTMLElement} element - Element to add tooltip to
   * @param {string} text - Tooltip text
   * @param {object} options - Tooltip options
   * @param {number} options.delay - Show delay in milliseconds
   */
  function addToElement(element, text, options = {}) {
    if (!element) return;
    element.setAttribute('data-tooltip', text);
    if (options.delay) element.setAttribute('data-tooltip-delay', options.delay);
  }

  /**
   * Remove tooltip from an element
   * @param {HTMLElement} element - Element to remove tooltip from
   */
  function removeFromElement(element) {
    if (!element) return;
    element.removeAttribute('data-tooltip');
    element.removeAttribute('data-tooltip-delay');
  }

  /**
   * Initialize tooltip system
   * Creates tooltip element and sets up event listeners
   */
  function init() {
    // Create tooltip element
    if (!state.tooltip) {
      state.tooltip = targetDocument.createElement('div');
      state.tooltip.className = 'mga-tooltip';
      targetDocument.body.appendChild(state.tooltip);
    }

    // Add event listeners to all elements with tooltip data
    doc.addEventListener('mouseenter', handleMouseEnter, true);
    doc.addEventListener('mouseleave', handleMouseLeave, true);
    doc.addEventListener('mousemove', handleMouseMove, true);
  }

  /**
   * Destroy tooltip system and cleanup
   * Removes event listeners and tooltip element
   */
  function destroy() {
    // Remove event listeners
    doc.removeEventListener('mouseenter', handleMouseEnter, true);
    doc.removeEventListener('mouseleave', handleMouseLeave, true);
    doc.removeEventListener('mousemove', handleMouseMove, true);

    // Remove tooltip element
    if (state.tooltip && state.tooltip.parentNode) {
      state.tooltip.parentNode.removeChild(state.tooltip);
    }

    // Clear timeouts
    clearTimeout(state.showTimeout);
    clearTimeout(state.hideTimeout);

    // Reset state
    state.tooltip = null;
    state.showTimeout = null;
    state.hideTimeout = null;
    state.currentEvent = null;
  }

  // Return public API
  return {
    init,
    show,
    hide,
    position,
    addToElement,
    removeFromElement,
    destroy
  };
}

/**
 * Initialize tooltip system and inject styles
 * Convenience function that creates tooltip system and adds styles to document
 *
 * @param {object} dependencies - Injected dependencies
 * @param {Document} dependencies.targetDocument - Target document for tooltip element
 * @param {Document} dependencies.document - Regular document for event listeners
 * @param {Window} dependencies.window - Window object for positioning
 * @param {Function} dependencies.isMGAEvent - Event isolation check function
 * @returns {object} Tooltip system instance
 */
export function initializeTooltipSystem(dependencies = {}) {
  const { targetDocument = typeof document !== 'undefined' ? document : null } = dependencies;

  // Create tooltip system
  const tooltipSystem = createTooltipSystem(dependencies);

  // Initialize
  tooltipSystem.init();

  // Inject styles
  if (targetDocument) {
    const styleSheet = targetDocument.createElement('style');
    styleSheet.textContent = TOOLTIP_STYLES;
    targetDocument.head.appendChild(styleSheet);
  }

  return tooltipSystem;
}
