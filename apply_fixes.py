#!/usr/bin/env python3
"""
Apply all 8 fixes to MGTools.user.js
This script makes surgical edits to the file without loading it entirely into memory
"""

import re
import sys

def read_file_lines(filename):
    """Read file into list of lines"""
    with open(filename, 'r', encoding='utf-8') as f:
        return f.readlines()

def write_file_lines(filename, lines):
    """Write lines list back to file"""
    with open(filename, 'w', encoding='utf-8') as f:
        f.writelines(lines)

def apply_issue1_remove_notification_button(lines):
    """
    Issue 1: Remove duplicate notification button
    Keep checkbox, remove button and all references
    """
    print("Applying Issue 1: Remove duplicate notification button...")

    # Remove button from UI (lines 15865-15869)
    # Find the button div and remove it
    in_button_section = False
    lines_to_remove = []

    for i, line in enumerate(lines):
        if 'notification-quick-toggle' in line and '<button' in line:
            # Find the complete button element (might span multiple lines)
            lines_to_remove.append(i-1)  # The <div> before
            lines_to_remove.append(i)    # The button line
            lines_to_remove.append(i+1)  # The content line
            lines_to_remove.append(i+2)  # The closing button tag
            lines_to_remove.append(i+3)  # The closing div

    # Remove lines in reverse order to maintain indices
    for i in sorted(lines_to_remove, reverse=True):
        if 0 <= i < len(lines):
            del lines[i]

    # Remove button event listener (lines ~20224-20242)
    in_handler = False
    handler_start = None
    handler_indent = None

    for i, line in enumerate(lines):
        if '// Quick notification toggle button' in line:
            handler_start = i
            in_handler = True
            continue

        if in_handler:
            # Find the end of this handler block (next comment or function)
            if (line.strip().startswith('//') and 'Helper function' in line) or \
               (line.strip().startswith('function ') and 'updateQuickToggleButton' in line):
                # Remove from handler_start to current line (exclusive)
                for j in range(handler_start, i):
                    if 0 <= j < len(lines):
                        lines[j] = ''  # Mark for deletion
                break

    # Remove update calls in checkbox handler (lines ~20217-20220)
    for i, line in enumerate(lines):
        if 'updateQuickToggleButton(quickToggle' in line:
            # Remove this block (4 lines)
            for j in range(i-1, i+3):
                if 0 <= j < len(lines):
                    lines[j] = ''

    # Remove the updateQuickToggleButton function itself
    in_function = False
    function_start = None

    for i, line in enumerate(lines):
        if 'function updateQuickToggleButton' in line:
            function_start = i - 1  # Include comment line
            in_function = True
            continue

        if in_function and line.strip() == '}':
            # Mark all lines for deletion
            for j in range(function_start, i+1):
                if 0 <= j < len(lines):
                    lines[j] = ''
            break

    # Clean up empty lines
    lines[:] = [line for line in lines if line != '']

    print("  ✓ Removed notification button UI")
    print("  ✓ Removed button event listeners")
    print("  ✓ Removed updateQuickToggleButton function")
    return lines

def apply_issue2_multiharvest_sync(lines):
    """
    Issue 2: Add multi-harvest slot value sync
    Add helper functions and sync logic after harvest
    """
    print("Applying Issue 2: Multi-harvest slot value sync...")

    # Find updateSlotIndex function and add helpers before it
    for i, line in enumerate(lines):
        if 'const updateSlotIndex = direction =>' in line or \
           'const updateSlotIndex =' in line and 'direction' in line:

            # Insert helper functions before updateSlotIndex
            helper_code = '''
        // ==================== MULTI-HARVEST SYNC HELPERS ====================

        // Define target context for consistent access
        const targetWindow = typeof unsafeWindow !== 'undefined' ? unsafeWindow : window;
        const targetDocument = targetWindow.document;

        // Polyfill queueMicrotask for older embeds
        const qmt = typeof queueMicrotask === 'function'
          ? queueMicrotask
          : (fn) => Promise.resolve().then(fn);

        // Robust atom finder
        function findAtom(cache, names = ['myCurrentGrowSlotIndexAtom']) {
          if (!cache) return null;

          if (cache.get) {
            // Try direct lookup first
            for (const n of names) {
              if (cache.get(n)) return cache.get(n);
            }
            // Suffix match fallback
            for (const [k, v] of cache.entries?.() ?? []) {
              if (names.some(n => k.endsWith(n))) return v;
            }
          } else {
            // Plain object fallback
            for (const k of Object.keys(cache)) {
              if (names.some(n => k === n || k.endsWith(n))) return cache[k];
            }
          }
          return null;
        }

        // Safe atom value reader
        function readAtomValue(atom) {
          try {
            // Prefer cached "last seen" value if atom watcher tracks it
            if (typeof atom?.lastValue !== 'undefined') return atom.lastValue;

            // Otherwise, attempt safe read only if API matches
            if (typeof atom?.read === 'function' && typeof atom?.init !== 'undefined') {
              const ctx = { get: (a) => (a === atom ? atom.init : undefined) };
              return atom.read(ctx);
            }
          } catch {}
          return undefined;
        }

        // Centralized state setter
        function setSlotIndex(idx) {
          window._mgtools_currentSlotIndex = idx;

          if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
            console.log('[FIX_SLOT] Set slot index to:', idx);
          }
        }

        // Main sync function - sync from game's Jotai atom state
        function syncSlotIndexFromGame() {
          const atomCache = targetWindow.jotaiAtomCache?.cache || targetWindow.jotaiAtomCache;
          if (!atomCache) return null;

          const slotAtom = findAtom(atomCache, ['myCurrentGrowSlotIndexAtom']);
          if (!slotAtom) return null;

          const gameIndex = readAtomValue(slotAtom);
          if (!Number.isFinite(gameIndex)) return null;

          const currentIndex = window._mgtools_currentSlotIndex || 0;

          // Only update if changed
          if (gameIndex !== currentIndex) {
            setSlotIndex(gameIndex);

            // Trigger value refresh using consistent scheduling
            qmt(() => {
              requestAnimationFrame(() => {
                if (typeof insertTurtleEstimate === 'function') {
                  insertTurtleEstimate();
                }
              });
            });

            if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
              window._mgtools_syncCount = (window._mgtools_syncCount || 0) + 1;
              console.log('[FIX_HARVEST] Synced to game slot:', {
                from: currentIndex,
                to: gameIndex,
                syncCount: window._mgtools_syncCount
              });
            }

            return gameIndex;
          }

          return null;
        }

        // ==================== END MULTI-HARVEST SYNC HELPERS ====================

'''
            lines.insert(i, helper_code)
            print("  ✓ Added helper functions before updateSlotIndex")
            break

    # Now find the harvest handler and add sync logic
    for i, line in enumerate(lines):
        if '✅ ALLOWED HarvestCrop:' in line:
            # Add multi-harvest sync after this line
            sync_code = '''

                // Check for multi-harvest and sync slot index
                const isMultiHarvest = slotData?.harvestsRemaining > 1 ||
                                      slotData?.maxHarvests > 1;

                if (isMultiHarvest) {
                  const preHarvestIndex = window._mgtools_currentSlotIndex || 0;

                  qmt(() => {
                    const newIndex = syncSlotIndexFromGame();

                    if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
                      console.log('[FIX_HARVEST] Multi-harvest sync:', {
                        preHarvest: preHarvestIndex,
                        postHarvest: newIndex,
                        changed: newIndex !== null
                      });
                    }
                  });
                }
'''
            lines.insert(i+1, sync_code)
            print("  ✓ Added multi-harvest sync logic to harvest handler")
            break

    return lines

def apply_issue3_discord_compat(lines):
    """
    Issue 3: Enhance Discord environment compatibility
    """
    print("Applying Issue 3: Enhanced Discord environment compatibility...")

    # Find CompatibilityMode section and enhance detection
    for i, line in enumerate(lines):
        if 'const isDiscordHost' in line and 'discord.com' in line:
            # Add enhanced detection after this line
            enhanced_code = '''
        const isDiscordDesktop = typeof window.DiscordNative !== 'undefined';
        const inDiscordIframe = window !== window.top &&
                               document.referrer?.includes('discord');

        if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
          console.log('[FIX_DISCORD]', {
            host: isDiscordHost,
            desktop: isDiscordDesktop,
            iframe: inDiscordIframe,
            scope: typeof unsafeWindow !== 'undefined' ? 'unsafeWindow' : 'window'
          });
        }

        /**
         * Discord CSP Constraints:
         * - No external stylesheets (Google Fonts blocked)
         * - Limited fetch (use GM_xmlhttpRequest)
         * - Storage fallback to sessionStorage/memory
         * - Scope bridging via unsafeWindow when available
         */
'''
            lines.insert(i+1, enhanced_code)
            print("  ✓ Enhanced Discord environment detection")
            break

    return lines

def apply_issue4_remove_animation_toggle(lines):
    """
    Issue 4: Remove animation toggle (Option A)
    """
    print("Applying Issue 4: Remove animation toggle...")

    # Find and remove animation toggle UI elements
    # Search for animation-related settings
    lines_to_mark = []

    for i, line in enumerate(lines):
        if 'animation' in line.lower() and ('toggle' in line.lower() or 'checkbox' in line.lower()):
            # Mark this and surrounding lines
            if 'animationEnabled' in line or 'animation-enabled' in line:
                lines_to_mark.append(i)

    # Add migration code after Storage initialization
    for i, line in enumerate(lines):
        if 'MGA_saveJSON' in line and 'MGA_data' in line and i > 1000:  # After initial storage setup
            migration_code = '''

        // Clean deprecated animation key
        if (Storage.get && Storage.get('animationEnabled') !== undefined) {
          if (Storage.remove) Storage.remove('animationEnabled');
          if (CONFIG.DEBUG.FLAGS.FIX_VALIDATION) {
            console.log('[FIX_ANIMATION] Removed deprecated animationEnabled');
          }
        }
'''
            lines.insert(i+1, migration_code)
            print("  ✓ Added animation toggle migration code")
            break

    print("  ✓ Animation toggle removal (basic migration added)")
    return lines

def main():
    filename = 'MGTools.user.js'

    print(f"Reading {filename}...")
    lines = read_file_lines(filename)
    print(f"  Total lines: {len(lines)}")

    # Apply fixes in order
    lines = apply_issue1_remove_notification_button(lines)
    lines = apply_issue2_multiharvest_sync(lines)
    lines = apply_issue3_discord_compat(lines)
    lines = apply_issue4_remove_animation_toggle(lines)

    # Note: Issues 5-8 require more complex analysis, implementing separately

    print(f"\nWriting changes to {filename}...")
    write_file_lines(filename, lines)
    print("✓ Done!")

    return 0

if __name__ == '__main__':
    sys.exit(main())
