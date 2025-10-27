/**
 * DRAGGABLE & RESIZABLE UTILITIES
 * ====================================================================================
 * Core drag and resize functionality for UI elements
 *
 * @module ui/draggable
 *
 * Complete System (8 Functions):
 * - makeDraggable() - Make element draggable with snap zones and position saving
 * - saveMainHUDPosition() - Save main HUD position to storage
 * - loadMainHUDPosition() - Load saved main HUD position
 * - makeElementResizable() - Make element resizable with visual handle
 * - makeResizable() - Legacy wrapper for backward compatibility
 * - makeToggleButtonDraggable() - Make toggle button draggable with click/drag detection
 * - saveToggleButtonPosition() - Save toggle button position
 * - loadToggleButtonPosition() - Load toggle button position
 *
 * Total: ~494 lines (core UI infrastructure)
 *
 * Features:
 * - Mouse and touch event support
 * - Snap zones with visual feedback (15px threshold)
 * - Viewport boundary constraints
 * - Performance optimizations (will-change, requestAnimationFrame)
 * - Click vs drag detection (3px threshold for toggle button)
 * - Position persistence via GM storage
 * - Professional drag effects (scale, shadow, z-index)
 * - Unified resize system with configurable constraints
 *
 * Dependencies:
 * - Storage: MGA_saveJSON, MGA_loadJSON
 * - Logging: debugLog, debugError
 * - State: UnifiedState (for toggle button)
 * - Utils: isMGAEvent (for toggle button)
 * - DOM: targetDocument, window
 * - Full dependency injection on all functions
 */

/* ====================================================================================
 * MAIN HUD DRAGGING
 * ====================================================================================
 */

/**
 * Make element draggable with snap zones and position saving
 * Supports both mouse and touch events with professional drag effects
 *
 * @param {HTMLElement} element - Element to make draggable
 * @param {HTMLElement} handle - Drag handle element
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Document} [dependencies.targetDocument] - Target document
 * @param {Function} [dependencies.debugLog] - Debug logger
 * @param {Function} [dependencies.debugError] - Error logger
 * @param {Function} [dependencies.saveMainHUDPosition] - Position save function
 */
export function makeDraggable(element, handle, dependencies = {}) {
  const {
    targetDocument = typeof document !== 'undefined' ? document : null,
    debugLog = () => {},
    saveMainHUDPosition: savePositionFn = null
  } = dependencies;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  handle.style.cursor = 'grab';

  // Shared drag start logic for both mouse and touch
  const startDrag = (clientX, clientY, event) => {
    if (event.target.tagName === 'BUTTON') return;
    // Don't start drag if clicking resize handle
    if (event.target.classList && event.target.classList.contains('mga-resize-handle')) return;

    event.preventDefault();
    event.stopPropagation();

    isDragging = true;
    startX = clientX;
    startY = clientY;

    const rect = element.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    // Clear conflicting positioning properties before dragging
    // This prevents stretching when element has both top/bottom or left/right set
    element.style.bottom = '';
    element.style.right = '';

    // Professional drag start effects with will-change for performance
    element.style.willChange = 'transform';
    element.style.transition = 'none';
    element.style.transform = 'scale(1.01)';
    element.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
    element.style.zIndex = '999999';
    handle.style.cursor = 'grabbing';

    targetDocument.body.style.userSelect = 'none';

    debugLog('OVERLAY_LIFECYCLE', 'Started dragging main HUD', {
      elementClass: element.className,
      startPosition: { left: startLeft, top: startTop }
    });
  };

  // Shared drag move logic
  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return;

    const deltaX = clientX - startX;
    const deltaY = clientY - startY;

    // Enhanced boundary constraints with snap zones
    const snapZone = 15;
    let newLeft = startLeft + deltaX;
    let newTop = startTop + deltaY;

    // Viewport constraints
    newLeft = Math.max(0, Math.min(window.innerWidth - element.offsetWidth, newLeft));
    newTop = Math.max(0, Math.min(window.innerHeight - element.offsetHeight, newTop));

    // Snap to edges with visual feedback
    if (newLeft < snapZone) {
      newLeft = 0;
      element.style.borderLeft = '2px solid rgba(74, 158, 255, 0.5)';
    } else if (newLeft > window.innerWidth - element.offsetWidth - snapZone) {
      newLeft = window.innerWidth - element.offsetWidth;
      element.style.borderRight = '2px solid rgba(74, 158, 255, 0.5)';
    } else {
      element.style.borderLeft = '';
      element.style.borderRight = '';
    }

    if (newTop < snapZone) {
      newTop = 0;
      element.style.borderTop = '2px solid rgba(74, 158, 255, 0.5)';
    } else if (newTop > window.innerHeight - element.offsetHeight - snapZone) {
      newTop = window.innerHeight - element.offsetHeight;
      element.style.borderBottom = '2px solid rgba(74, 158, 255, 0.5)';
    } else {
      element.style.borderTop = '';
      element.style.borderBottom = '';
    }

    // Use direct positioning for more reliable movement
    element.style.left = `${newLeft}px`;
    element.style.top = `${newTop}px`;
    // Clear conflicting properties during drag (matches Live-Beta behavior)
    element.style.transform = 'none';
    element.style.bottom = 'auto';
    element.style.right = 'auto';
  };

  // Shared drag end logic
  const endDrag = () => {
    if (isDragging) {
      isDragging = false;

      // Clean up styles
      element.style.transition = 'all 0.2s ease';
      element.style.transform = 'scale(1)';
      element.style.boxShadow = 'var(--panel-shadow, 0 4px 12px rgba(0, 0, 0, 0.40))';
      element.style.zIndex = '';
      element.style.borderTop = '';
      element.style.borderBottom = '';
      element.style.borderLeft = '';
      element.style.borderRight = '';
      element.style.willChange = 'auto';

      handle.style.cursor = 'grab';
      targetDocument.body.style.userSelect = '';

      // Save position (use getBoundingClientRect for numeric values, not style strings)
      const rect = element.getBoundingClientRect();
      const finalPosition = {
        left: rect.left,
        top: rect.top
      };

      if (savePositionFn) {
        savePositionFn(finalPosition);
      }

      debugLog('OVERLAY_LIFECYCLE', 'Finished dragging main HUD', {
        elementClass: element.className,
        finalPosition
      });
    }
  };

  // Mouse event handlers
  handle.addEventListener('mousedown', e => {
    startDrag(e.clientX, e.clientY, e);
  });

  targetDocument.addEventListener('mousemove', e => {
    handleDragMove(e.clientX, e.clientY);
  });

  targetDocument.addEventListener('mouseup', () => {
    endDrag();
  });

  // Touch event handlers
  handle.addEventListener(
    'touchstart',
    e => {
      if (e.touches.length === 1) {
        const touch = e.touches[0];
        startDrag(touch.clientX, touch.clientY, e);
      }
    },
    { passive: false }
  );

  targetDocument.addEventListener(
    'touchmove',
    e => {
      if (isDragging && e.touches.length === 1) {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
        e.preventDefault(); // Prevent scrolling while dragging
      }
    },
    { passive: false }
  );

  targetDocument.addEventListener('touchend', () => {
    endDrag();
  });

  targetDocument.addEventListener('touchcancel', () => {
    endDrag();
  });
}

/**
 * Save main HUD position to storage
 *
 * @param {Object} position - Position object with left/top properties
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.MGA_saveJSON] - Storage save function
 * @param {Function} [dependencies.debugLog] - Debug logger
 * @param {Function} [dependencies.debugError] - Error logger
 */
export function saveMainHUDPosition(position, dependencies = {}) {
  const { MGA_saveJSON = null, debugLog = () => {}, debugError = () => {} } = dependencies;

  try {
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_mainHUDPosition', position);
    }
    debugLog('OVERLAY_LIFECYCLE', 'Saved main HUD position', { position });
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to save main HUD position', error, { position });
  }
}

/**
 * Load main HUD position on startup
 * Validates position to ensure it's within viewport bounds
 *
 * @param {HTMLElement} element - Element to position
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.MGA_loadJSON] - Storage load function
 * @param {Function} [dependencies.debugLog] - Debug logger
 * @param {Function} [dependencies.debugError] - Error logger
 */
export function loadMainHUDPosition(element, dependencies = {}) {
  const { MGA_loadJSON = null, debugLog = () => {}, debugError = () => {} } = dependencies;

  try {
    if (!MGA_loadJSON) return;

    const savedPosition = MGA_loadJSON('MGA_mainHUDPosition', null);
    if (savedPosition && savedPosition.left && savedPosition.top) {
      const leftPx = parseInt(savedPosition.left);
      const topPx = parseInt(savedPosition.top);

      if (
        !isNaN(leftPx) &&
        !isNaN(topPx) &&
        leftPx >= 0 &&
        topPx >= 0 &&
        leftPx < window.innerWidth &&
        topPx < window.innerHeight
      ) {
        element.style.left = savedPosition.left;
        element.style.top = savedPosition.top;

        debugLog('OVERLAY_LIFECYCLE', 'Restored main HUD position', { position: savedPosition });
      }
    }
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to load main HUD position', error);
  }
}

/* ====================================================================================
 * UNIFIED RESIZE SYSTEM
 * ====================================================================================
 */

/**
 * Make element resizable with visual handle
 * Creates a resize handle in bottom-right corner with configurable constraints
 *
 * @param {HTMLElement} element - Element to make resizable
 * @param {Object} [options] - Resize options
 * @param {number} [options.minWidth=300] - Minimum width in pixels
 * @param {number} [options.minHeight=250] - Minimum height in pixels
 * @param {number} [options.maxWidth] - Maximum width (defaults to 90% viewport)
 * @param {number} [options.maxHeight] - Maximum height (defaults to 90% viewport)
 * @param {number} [options.handleSize=12] - Resize handle size in pixels
 * @param {boolean} [options.showHandleOnHover=true] - Show handle only on hover
 * @returns {HTMLElement} The created resize handle element
 */
export function makeElementResizable(element, options = {}) {
  const {
    minWidth = 300,
    minHeight = 250,
    maxWidth = window.innerWidth * 0.9,
    maxHeight = window.innerHeight * 0.9,
    handleSize = 12,
    showHandleOnHover = true
  } = options;

  // Check if element already has a resize handle - remove it to prevent duplicates
  const existingHandle = element.querySelector('.mga-resize-handle');
  if (existingHandle) {
    existingHandle.remove();
  }

  // Create resize handle
  const resizeHandle = document.createElement('div');
  resizeHandle.className = 'mga-resize-handle';
  resizeHandle.title = 'Drag to resize';
  resizeHandle.style.cssText = `
      position: absolute;
      bottom: 0;
      right: 0;
      width: ${handleSize}px;
      height: ${handleSize}px;
      cursor: se-resize;
      background: linear-gradient(-45deg, transparent 35%, rgba(74, 158, 255, 0.7) 45%, rgba(74, 158, 255, 0.9) 50%, rgba(74, 158, 255, 0.7) 55%, transparent 65%);
      border-radius: 0 0 4px 0;
      opacity: ${showHandleOnHover ? '0.5' : '0.7'};
      transition: opacity 0.2s ease, background 0.2s ease;
      z-index: 10;
      pointer-events: auto;
  `;
  element.appendChild(resizeHandle);

  if (showHandleOnHover) {
    element.addEventListener('mouseenter', () => {
      resizeHandle.style.opacity = '1.0';
    });
    element.addEventListener('mouseleave', () => {
      if (!element.hasAttribute('data-resizing')) {
        resizeHandle.style.opacity = '0.5';
      }
    });
  }

  let isResizing = false;
  let startX, startY, startWidth, startHeight;
  let rafId = null;

  const onMouseMove = e => {
    if (!isResizing) return;

    // Throttle with rAF for smoothness
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + (e.clientX - startX)));
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + (e.clientY - startY)));
      element.style.width = `${newWidth}px`;
      element.style.height = `${newHeight}px`;
    });
  };

  const stopResizing = () => {
    if (!isResizing) return;
    isResizing = false;
    element.removeAttribute('data-resizing');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    resizeHandle.style.opacity = showHandleOnHover ? '0.5' : '0.7';

    // Unbind listeners safely
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', stopResizing);
  };

  resizeHandle.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();

    isResizing = true;
    element.setAttribute('data-resizing', 'true');

    startX = e.clientX;
    startY = e.clientY;
    startWidth = element.offsetWidth;
    startHeight = element.offsetHeight;

    document.body.style.cursor = 'se-resize';
    document.body.style.userSelect = 'none';

    // Bind move/up only for duration of resize
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', stopResizing);
  });

  return resizeHandle;
}

/**
 * Legacy function for backward compatibility
 * Wrapper around makeElementResizable()
 *
 * @param {HTMLElement} element - Element to make resizable
 * @param {HTMLElement} [handle] - Legacy handle parameter (ignored)
 * @returns {HTMLElement} The created resize handle
 */
export function makeResizable(element, handle) {
  // If a handle is provided, we're using the old system - just add simple resize
  if (handle) {
    return makeElementResizable(element, { showHandleOnHover: false });
  }
  return makeElementResizable(element);
}

/* ====================================================================================
 * TOGGLE BUTTON DRAGGING
 * ====================================================================================
 */

/**
 * Make toggle button draggable with click/drag detection
 * Differentiates between clicks (toggle panel) and drags (reposition button)
 * Uses 3px movement threshold to determine drag intent
 *
 * @param {HTMLElement} toggleBtn - Toggle button element
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.isMGAEvent] - Event validation function
 * @param {Function} [dependencies.debugLog] - Debug logger
 * @param {Function} [dependencies.saveToggleButtonPosition] - Position save function
 * @param {Object} [dependencies.UnifiedState] - Unified state object
 * @param {Function} [dependencies.MGA_saveJSON] - Storage save function
 */
export function makeToggleButtonDraggable(toggleBtn, dependencies = {}) {
  const {
    isMGAEvent = () => true,
    debugLog = () => {},
    saveToggleButtonPosition: savePositionFn = null,
    UnifiedState = null,
    MGA_saveJSON = null
  } = dependencies;

  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;
  let clickStarted = false;
  let currentX = 0;
  let currentY = 0;

  toggleBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    e.stopPropagation();

    clickStarted = true;
    isDragging = false; // Don't start dragging immediately
    startX = e.clientX;
    startY = e.clientY;
    currentX = startX;
    currentY = startY;

    const rect = toggleBtn.getBoundingClientRect();
    startLeft = rect.left;
    startTop = rect.top;

    // Add will-change for better performance
    toggleBtn.style.willChange = 'transform';
    toggleBtn.style.cursor = 'grabbing';
  });

  document.addEventListener('pointermove', e => {
    if (!clickStarted) return;

    // Once dragging starts, don't check for MGA events to prevent dropping
    if (!isDragging) {
      // Only check isMGAEvent before drag starts
      if (!isMGAEvent(e)) {
        return;
      }
    }

    currentX = e.clientX;
    currentY = e.clientY;

    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);

    // Only start dragging if mouse moved more than 3px (more responsive)
    if (!isDragging && (deltaX > 3 || deltaY > 3)) {
      isDragging = true;
      toggleBtn.style.transition = 'none';
      toggleBtn.style.boxShadow = '0 8px 32px rgba(74, 158, 255, 0.6)';
      toggleBtn.style.zIndex = '999999';
      // Capture pointer for reliable tracking
      toggleBtn.setPointerCapture(e.pointerId);
    }

    if (isDragging) {
      // Direct position update without transform
      const moveX = currentX - startX;
      const moveY = currentY - startY;

      let newLeft = startLeft + moveX;
      let newTop = startTop + moveY;

      // Constrain within viewport with padding
      const padding = 10;
      newLeft = Math.max(padding, Math.min(window.innerWidth - toggleBtn.offsetWidth - padding, newLeft));
      newTop = Math.max(padding, Math.min(window.innerHeight - toggleBtn.offsetHeight - padding, newTop));

      // Use direct positioning instead of transform for more reliable movement
      toggleBtn.style.right = '';
      toggleBtn.style.bottom = '';
      toggleBtn.style.left = `${newLeft}px`;
      toggleBtn.style.top = `${newTop}px`;
    }
  });

  document.addEventListener('pointerup', e => {
    if (clickStarted) {
      // Once drag is active, don't check MGA event
      if (!isDragging && !isMGAEvent(e)) {
        return;
      }

      if (isDragging) {
        // Release pointer capture
        toggleBtn.releasePointerCapture(e.pointerId);

        // Finish dragging
        isDragging = false;
        toggleBtn.style.transition = 'all 0.2s ease';
        toggleBtn.style.boxShadow = '0 4px 20px rgba(74, 158, 255, 0.4)';
        toggleBtn.style.zIndex = '999998';
        toggleBtn.style.cursor = 'grab';
        toggleBtn.style.willChange = 'auto';

        // Save position (already applied directly)
        const finalPosition = {
          left: toggleBtn.style.left,
          top: toggleBtn.style.top,
          right: '', // Clear right positioning
          bottom: '' // Clear bottom positioning
        };

        if (savePositionFn) {
          savePositionFn(finalPosition);
        }

        debugLog('OVERLAY_LIFECYCLE', 'Toggle button dragged to new position', finalPosition);
      } else {
        // This was a click, not a drag - trigger the toggle functionality
        toggleBtn.style.willChange = 'auto';
        toggleBtn.style.cursor = 'grab';

        if (UnifiedState && UnifiedState.panels && UnifiedState.panels.main) {
          const panel = UnifiedState.panels.main;
          const isCurrentlyVisible = panel.style.display !== 'none';
          const newVisibility = !isCurrentlyVisible;

          panel.style.display = newVisibility ? 'block' : 'none';

          // Hide any stuck tooltips when panel is toggled
          if (window.MGA_Tooltips && window.MGA_Tooltips.hide) {
            window.MGA_Tooltips.hide();
          }

          // Save visibility state
          if (UnifiedState.data && UnifiedState.data.settings && MGA_saveJSON) {
            UnifiedState.data.settings.panelVisible = newVisibility;
            MGA_saveJSON('MGA_data', UnifiedState.data);
          }

          debugLog('OVERLAY_LIFECYCLE', `Panel toggled: ${newVisibility ? 'visible' : 'hidden'}`);
        }
      }

      clickStarted = false;
    }
  });
}

/**
 * Save toggle button position to storage
 *
 * @param {Object} position - Position object with left/top/right/bottom properties
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.MGA_saveJSON] - Storage save function
 * @param {Function} [dependencies.debugLog] - Debug logger
 * @param {Function} [dependencies.debugError] - Error logger
 */
export function saveToggleButtonPosition(position, dependencies = {}) {
  const { MGA_saveJSON = null, debugLog = () => {}, debugError = () => {} } = dependencies;

  try {
    if (MGA_saveJSON) {
      MGA_saveJSON('MGA_toggleButtonPosition', position);
    }
    debugLog('OVERLAY_LIFECYCLE', 'Saved toggle button position', { position });
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to save toggle button position', error, { position });
  }
}

/**
 * Load toggle button position on startup
 * Validates position to ensure it's within viewport bounds
 *
 * @param {HTMLElement} toggleBtn - Toggle button element
 * @param {Object} [dependencies] - Optional dependencies
 * @param {Function} [dependencies.MGA_loadJSON] - Storage load function
 * @param {Function} [dependencies.debugLog] - Debug logger
 * @param {Function} [dependencies.debugError] - Error logger
 */
export function loadToggleButtonPosition(toggleBtn, dependencies = {}) {
  const { MGA_loadJSON = null, debugLog = () => {}, debugError = () => {} } = dependencies;

  try {
    if (!MGA_loadJSON) return;

    const savedPosition = MGA_loadJSON('MGA_toggleButtonPosition', null);
    if (savedPosition) {
      if (savedPosition.left && savedPosition.top) {
        const leftPx = parseInt(savedPosition.left);
        const topPx = parseInt(savedPosition.top);

        if (
          !isNaN(leftPx) &&
          !isNaN(topPx) &&
          leftPx >= 0 &&
          topPx >= 0 &&
          leftPx < window.innerWidth &&
          topPx < window.innerHeight
        ) {
          toggleBtn.style.right = '';
          toggleBtn.style.bottom = '';
          toggleBtn.style.left = savedPosition.left;
          toggleBtn.style.top = savedPosition.top;

          debugLog('OVERLAY_LIFECYCLE', 'Restored toggle button position', { position: savedPosition });
        }
      }
    }
  } catch (error) {
    debugError('OVERLAY_LIFECYCLE', 'Failed to load toggle button position', error);
  }
}

/* ====================================================================================
 * MODULE EXPORTS
 * ====================================================================================
 */

export default {
  // Main HUD Dragging
  makeDraggable,
  saveMainHUDPosition,
  loadMainHUDPosition,

  // Resize System
  makeElementResizable,
  makeResizable,

  // Toggle Button
  makeToggleButtonDraggable,
  saveToggleButtonPosition,
  loadToggleButtonPosition
};
