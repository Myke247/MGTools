// ==UserScript==
// @name         MGTools
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  All-in-one assistant for Magic Garden with beautiful unified UI (Enhanced Discord Support!)
// @author       Unified Script
// @updateURL    https://github.com/Myke247/MGTools/raw/refs/heads/Live-Beta/MGTools.user.js
// @downloadURL  https://github.com/Myke247/MGTools/raw/refs/heads/Live-Beta/MGTools.user.js
// @match        https://magiccircle.gg/r/*
// @match        https://magicgarden.gg/r/*
// @match        https://starweaver.org/r/*
// @match        https://1227719606223765687.discordsays.com/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @grant        GM_addElement
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_deleteValue
// @connect      raw.githubusercontent.com
// @connect      *
// @run-at       document-end
// ==/UserScript==

/**
 * MGTools - Main Entry Point (Modular Version - Phase 2)
 * =======================================================
 * This file will eventually import all extracted modules.
 * For now, during Phase 2, we're extracting modules incrementally.
 *
 * Current Status:
 * - Module 1: core/storage.js ✅ EXTRACTED (977 lines)
 * - Module 2: utils/constants.js ✅ EXTRACTED (196 lines)
 * - Module 3: core/logging.js ✅ EXTRACTED (162 lines)
 * - Module 4: core/compat.js ✅ EXTRACTED (278 lines)
 * - Module 5-13: Pending extraction
 *
 * Build Strategy:
 * - Continue using mgtools.user.js as source (mirror build)
 * - Extract modules into src/* for future use
 * - Once all modules extracted, switch to esbuild bundling
 *
 * This file is currently a placeholder and will become the real
 * entry point once all modules are extracted.
 */

/* ============================================================================
 * PHASE 3B: MODULE STITCHING (esbuild artifact only, non-shipping)
 * ============================================================================
 */

// ===== Stitched exports for esbuild artifact (Phase 3B) =====
import * as Storage from './core/storage.js';
import { CONFIG } from './utils/constants.js';
import * as Log from './core/logging.js';
import * as Compat from './core/compat.js';
import * as Network from './core/network.js';
import * as State from './state/unified-state.js';
import * as UI from './ui/ui.js';
import * as VersionUI from './ui/version-badge.js';
import * as ConnUI from './ui/connection-status.js';
import * as VersionCtl from './controller/version-check.js';
import * as InputsCtl from './controller/shortcuts.js';
import * as RoomPollCtl from './controller/room-poll.js';
import * as AppCore from './controller/app-core.js';
import * as Bootstrap from './init/bootstrap.js';

// Assemble a single object for optional testing in the esbuild artifact
export const MGTools = {
  Storage, CONFIG, Log, Compat, Network, State, UI, VersionUI, ConnUI,
  VersionCtl, InputsCtl, RoomPollCtl, AppCore, Bootstrap
};

// Optional local test hook (ESBUILD ARTIFACT ONLY):
// Opt in by setting localStorage.MGTOOLS_ESBUILD_ENABLE = "1" in the browser console.
// This keeps the shipping mirror build unchanged.
try {
  if (typeof window !== 'undefined' &&
      window.localStorage?.getItem('MGTOOLS_ESBUILD_ENABLE') === '1') {
    // No-op "init" that mirrors current bootstrap sequencing but only when opt-in is set.
    // Avoids side effects until you explicitly enable.
    MGTools.Log.Logger.info('PHASE3B', '[Phase3B] Opt-in enabled — esbuild artifact active');
    // Wrap in microtask to avoid blocking and keep side effects evident:
    Promise.resolve().then(() => {
      if (MGTools.Bootstrap?.bootstrapStart) {
        MGTools.Log.Logger.info('PHASE3B', 'Calling bootstrapStart()');
        MGTools.Bootstrap.bootstrapStart({
          roomIdOrCode: 'test-room',
          pollIntervalMs: 5000,
          jitterMs: 500
        });
      }
    });
  }
} catch (e) {
  // Never throw from entry; log only
  console && console.warn && console.warn('Phase3B toggle check failed:', e);
}
// ===== End Phase 3B stitching =====
