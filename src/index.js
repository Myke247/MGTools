/**
 * MGTools - Main Entry Point (Modular Version - Phase F: 95% ACHIEVED!)
 * ==================================================================
 * This file imports ALL extracted modules and provides a unified API.
 *
 * Total Modules: 55
 * Progress: 95.1% extracted (~32,798/34,361 lines)
 * Build System: esbuild (IIFE bundle)
 *
 * Phase F Achievement: 95% TARGET REACHED! 🎉
 * Latest extractions: Memory Management (+400), Platform Detection (+330)
 * Previous: MGTP Overlay (+1,176), Runtime Utilities (+680), Event Handlers (+150)
 *
 * @module index
 * @version 2.0.0
 */

/* ============================================================================
 * PHASE F: COMPLETE MODULE IMPORTS (55 modules)
 * ============================================================================
 */

// ===== Core Infrastructure (9 modules) =====
import * as Storage from './core/storage.js';
import { CONFIG } from './utils/constants.js';
import * as Logging from './core/logging.js';
import * as Compat from './core/compat.js';
import * as Network from './core/network.js';
import * as Atoms from './core/atoms.js';
import * as Environment from './core/environment.js';
import * as ModalDetection from './core/modal-detection.js';
import * as WebSocketManager from './core/websocket-manager.js';
import * as StorageRecovery from './core/storage-recovery.js';

// ===== Utilities (4 modules) =====
import * as RuntimeUtilities from './utils/runtime-utilities.js';
import * as MemoryManagement from './utils/memory-management.js';
import * as PlatformDetection from './utils/platform-detection.js';

// ===== State Management (2 modules) =====
import * as UnifiedState from './state/unified-state.js';
import * as Draggable from './ui/draggable.js'; // Note: draggable is in ui/ folder

// ===== UI Framework (9 modules) =====
import * as UI from './ui/ui.js';
import * as VersionBadge from './ui/version-badge.js';
import * as ConnectionStatus from './ui/connection-status.js';
import * as Overlay from './ui/overlay.js';
import * as ThemeSystem from './ui/theme-system.js';
import * as TooltipSystem from './ui/tooltip-system.js';
import * as TabContent from './ui/tab-content.js';
import * as HotkeyHelp from './ui/hotkey-help.js';
import * as AssetManager from './ui/asset-manager.js';

// ===== Controllers (5 modules) =====
import * as VersionCheckController from './controller/version-check.js';
import * as ShortcutsController from './controller/shortcuts.js';
import * as RoomPollController from './controller/room-poll.js';
import * as AppCoreController from './controller/app-core.js';

// ===== Initialization (5 modules) =====
import * as EarlyTraps from './init/early-traps.js';
import * as LegacyBootstrap from './init/legacy-bootstrap.js';
import * as PublicAPI from './init/public-api.js';
import * as Bootstrap from './init/bootstrap.js';
import * as EventHandlers from './init/event-handlers.js';

// ===== Feature Modules - Core Features (15 modules) =====
import * as Pets from './features/pets.js';
import * as Shop from './features/shop.js';
import * as Notifications from './features/notifications.js';
import * as Hotkeys from './features/hotkeys.js';
import * as Protection from './features/protection.js';
import * as CropHighlighting from './features/crop-highlighting.js';
import * as CropValue from './features/crop-value.js';
import * as AutoFavorite from './features/auto-favorite.js';
import * as ValueManager from './features/value-manager.js';
import * as TimerManager from './features/timer-manager.js';
import * as TurtleTimer from './features/turtle-timer.js';
import * as RoomManager from './features/room-manager.js';
import * as SettingsUI from './features/settings-ui.js';
import * as VersionChecker from './features/version-checker.js';
import * as MGTPOverlay from './features/mgtp-overlay.js';

// ===== Feature Modules - Abilities System (6 modules) =====
import * as AbilitiesData from './features/abilities/abilities-data.js';
import * as AbilitiesUtils from './features/abilities/abilities-utils.js';
import * as AbilitiesUI from './features/abilities/abilities-ui.js';
import * as AbilitiesDisplay from './features/abilities/abilities-display.js';
import * as AbilitiesHandlers from './features/abilities/abilities-handlers.js';
import * as AbilitiesDiagnostics from './features/abilities/abilities-diagnostics.js';

/* ============================================================================
 * UNIFIED API EXPORT
 * ============================================================================
 * Organizes all 55 modules into a structured namespace
 */

export const MGTools = {
  // Core Infrastructure
  Core: {
    Storage,
    Logging,
    Compat,
    Network,
    Atoms,
    Environment,
    ModalDetection,
    WebSocketManager,
    StorageRecovery
  },

  // Configuration & Utilities
  Config: CONFIG,
  Utils: {
    RuntimeUtilities,
    MemoryManagement,
    PlatformDetection
  },

  // State Management
  State: {
    UnifiedState,
    Draggable
  },

  // UI Framework
  UI: {
    UI,
    VersionBadge,
    ConnectionStatus,
    Overlay,
    ThemeSystem,
    TooltipSystem,
    TabContent,
    HotkeyHelp,
    AssetManager
  },

  // Controllers
  Controllers: {
    VersionCheck: VersionCheckController,
    Shortcuts: ShortcutsController,
    RoomPoll: RoomPollController,
    AppCore: AppCoreController
  },

  // Initialization
  Init: {
    EarlyTraps,
    LegacyBootstrap,
    PublicAPI,
    Bootstrap,
    EventHandlers
  },

  // Feature Modules
  Features: {
    // Core Features
    Pets,
    Shop,
    Notifications,
    Hotkeys,
    Protection,
    CropHighlighting,
    CropValue,
    AutoFavorite,
    ValueManager,
    TimerManager,
    TurtleTimer,
    RoomManager,
    SettingsUI,
    VersionChecker,
    MGTPOverlay,

    // Abilities System
    Abilities: {
      Data: AbilitiesData,
      Utils: AbilitiesUtils,
      UI: AbilitiesUI,
      Display: AbilitiesDisplay,
      Handlers: AbilitiesHandlers,
      Diagnostics: AbilitiesDiagnostics
    }
  },

  // Metadata
  _meta: {
    version: '2.0.0',
    buildType: 'modular',
    modulesCount: 55,
    phase: 'F',
    extractionProgress: '95.1%'
  }
};

/* ============================================================================
 * OPT-IN BOOTSTRAP (esbuild artifact only)
 * ============================================================================
 * Enable by setting localStorage.MGTOOLS_ESBUILD_ENABLE = "1"
 * This allows testing the modular build without interfering with the shipping monolith
 */

try {
  if (typeof window !== 'undefined' && window.localStorage?.getItem('MGTOOLS_ESBUILD_ENABLE') === '1') {
    // Install early traps first (CRITICAL for RoomConnection capture)
    if (EarlyTraps?.installAllEarlyTraps) {
      EarlyTraps.installAllEarlyTraps({
        unsafeWindow: typeof unsafeWindow !== 'undefined' ? unsafeWindow : null,
        window,
        document,
        console
      });
      console.log('[MGTools Modular] Early traps installed');
    }

    // Initialize compatibility mode
    if (Compat?.CompatibilityMode?.detect) {
      Compat.CompatibilityMode.detect();
      console.log('[MGTools Modular] Compatibility mode detected');
    }

    // Initialize asset manager
    if (AssetManager?.initializeAssetManager) {
      const assetManager = AssetManager.initializeAssetManager({
        CompatibilityMode: Compat?.CompatibilityMode,
        Logger: Logging?.Logger
      });
      console.log('[MGTools Modular] AssetManager initialized');

      // Expose globally for access
      window.MGToolsAssetManager = assetManager;
    }

    // Initialize MGTP Overlay
    if (MGTPOverlay?.initializeMGTPOverlay) {
      MGTPOverlay.initializeMGTPOverlay({
        targetDocument: document,
        targetWindow: window,
        unsafeWindow: typeof unsafeWindow !== 'undefined' ? unsafeWindow : null,
        CompatibilityMode: Compat?.CompatibilityMode,
        logInfo: Logging?.Logger?.info,
        logWarn: Logging?.Logger?.warn,
        logDebug: Logging?.Logger?.debug,
        productionLog: Logging?.Logger?.productionLog,
        productionWarn: Logging?.Logger?.productionWarn,
        productionError: Logging?.Logger?.productionError
      });
      console.log('[MGTools Modular] MGTP Overlay initialized');
    }

    // Log successful module load
    console.log('[MGTools Modular] ✅ All 55 modules loaded successfully');
    console.log('[MGTools Modular] Phase F: 95% TARGET ACHIEVED! (95.1% progress) 🎉');
    console.log('[MGTools Modular] To bootstrap the application, call MGTools.Init.Bootstrap functions');
    console.log('[MGTools Modular] Available in window.MGTools');

    // Expose to window for debugging
    window.MGTools = MGTools;
  }
} catch (e) {
  // Never throw from entry; log only
  console && console.warn && console.warn('[MGTools Modular] Bootstrap toggle check failed:', e);
}

/* ============================================================================
 * MODULE SUMMARY
 * ============================================================================
 *
 * Phase F Achievement: 55 Modules Extracted (95.1% of monolith) 🎉
 *
 * Core Infrastructure (9):
 *  1. Storage           - Unified storage abstraction (GM/localStorage/session/memory)
 *  2. Logging           - Production & debug logging system
 *  3. Compat            - Browser compatibility & CSP handling
 *  4. Network           - API calls with CSP bypass
 *  5. Atoms             - Jotai atom state management
 *  6. Environment       - Environment detection
 *  7. ModalDetection    - Modal spam prevention
 *  8. WebSocketManager  - Auto-reconnect WebSocket
 *  9. StorageRecovery   - Data recovery & backup
 *
 * Utilities (3):
 * 10. RuntimeUtilities  - Runtime helpers (intervals, cache, atoms, slot tracking)
 * 11. MemoryManagement  - Cleanup, debounced save, log archiving, DOM pooling
 * 12. PlatformDetection - Environment & platform detection, browser features
 *
 * State Management (2):
 * 13. UnifiedState      - Central state management
 * 14. Draggable         - Draggable/resizable UI components
 *
 * UI Framework (9):
 * 15. UI                - Main UI creation
 * 16. VersionBadge      - Version badge UI
 * 17. ConnectionStatus  - Connection HUD
 * 18. Overlay           - In-game overlay system
 * 19. ThemeSystem       - Theme & styling engine
 * 20. TooltipSystem     - Tooltip system
 * 21. TabContent        - Tab content generators
 * 22. HotkeyHelp        - Hotkey help display
 * 23. AssetManager      - Asset loading with CSP compatibility
 *
 * Controllers (4):
 * 24. VersionCheck      - Version checking UI
 * 25. Shortcuts         - Hotkey management
 * 26. RoomPoll          - Room polling
 * 27. AppCore           - Core app controller
 *
 * Initialization (5):
 * 28. EarlyTraps        - Early RoomConnection trap & CSP guard
 * 29. LegacyBootstrap   - Legacy initialization system
 * 30. PublicAPI         - Public API & persistence
 * 31. Bootstrap         - Main initialization
 * 32. EventHandlers     - Auto-save & cleanup handlers
 *
 * Core Features (15):
 * 33. Pets              - Pet management system
 * 34. Shop              - Shop monitoring & notifications
 * 35. Notifications     - Notification system
 * 36. Hotkeys           - Custom hotkeys
 * 37. Protection        - Crop/pet/decor protection
 * 38. CropHighlighting  - Crop highlighting
 * 39. CropValue         - Crop value & turtle timer
 * 40. AutoFavorite      - Auto-favorite system
 * 41. ValueManager      - Enhanced value manager
 * 42. TimerManager      - Timer management
 * 43. TurtleTimer       - Turtle timer system
 * 44. RoomManager       - Room registry & Firebase
 * 45. SettingsUI        - Settings UI
 * 46. VersionChecker    - GitHub version check
 * 47. MGTPOverlay       - MGTP overlay system (slot/estimate, ability logs, rooms, WebSocket)
 *
 * Abilities System (6):
 * 48. AbilitiesData     - Constants & utilities
 * 49. AbilitiesUtils    - Helper functions
 * 50. AbilitiesUI       - UI generation
 * 51. AbilitiesDisplay  - Display logic & caching
 * 52. AbilitiesHandlers - Event handlers
 * 53. AbilitiesDiagnostics - Diagnostic tools
 *
 * Additional (2):
 * 54. Constants         - Global constants
 * 55. Index (this file) - Main entry point
 *
 * ============================================================================
 */
