// ==UserScript==
// @name         MGTools Lite
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Professional dashboard for Magic Garden - Clean, fast, beautiful
// @author       MGTools Team
// @match        https://magiccircle.gg/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_listValues
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // ==================== STORAGE ====================
    const storage = {
        get: (key, defaultValue = null) => {
            try {
                const value = GM_getValue(key);
                return value !== undefined ? JSON.parse(value) : defaultValue;
            } catch {
                return defaultValue;
            }
        },
        set: (key, value) => {
            try {
                GM_setValue(key, JSON.stringify(value));
                return true;
            } catch {
                return false;
            }
        }
    };

    // ==================== STATE ====================
    const state = {
        petPresets: storage.get('mgtools_petPresets', {}),
        seedsToDelete: storage.get('mgtools_seedsToDelete', []),
        expandedCards: storage.get('mgtools_expandedCards', {
            pets: true,
            seeds: true,
            values: true,
            rooms: true,
            timers: true
        }),
        activePets: [],
        currentRoom: null
    };

    // ==================== PROFESSIONAL CSS ====================
    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');

        :root {
            --bg-primary: #0a0a0a;
            --bg-secondary: #141414;
            --bg-tertiary: #1a1a1a;
            --bg-hover: #222;
            --border: #2a2a2a;
            --border-hover: #3a3a3a;
            --text-primary: #e5e5e5;
            --text-secondary: #a0a0a0;
            --text-tertiary: #6b6b6b;
            --accent: #4a9eff;
            --accent-hover: #6bb0ff;
            --success: #22c55e;
            --warning: #f59e0b;
            --danger: #ef4444;
            --radius: 8px;
            --shadow: 0 2px 8px rgba(0,0,0,0.3);
            --shadow-lg: 0 8px 24px rgba(0,0,0,0.4);
        }

        #mgtools-lite {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 12px;
            position: fixed;
            top: 20px;
            right: 20px;
            width: 900px;
            max-height: calc(100vh - 40px);
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            color: var(--text-primary);
            z-index: 999999;
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #mgtools-lite.collapsed {
            width: 48px;
            height: 48px;
        }

        /* Header */
        .mgl-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 12px 16px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border);
            cursor: move;
            user-select: none;
        }

        .mgl-title {
            font-size: 13px;
            font-weight: 600;
            letter-spacing: 0.3px;
            color: var(--text-primary);
        }

        .mgl-controls {
            display: flex;
            gap: 8px;
        }

        .mgl-btn-icon {
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: transparent;
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-secondary);
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .mgl-btn-icon:hover {
            background: var(--bg-hover);
            border-color: var(--border-hover);
            color: var(--text-primary);
            transform: translateY(-1px);
        }

        .mgl-btn-icon:active {
            transform: translateY(0);
        }

        /* Dashboard Grid */
        .mgl-dashboard {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            padding: 12px;
            max-height: calc(100vh - 120px);
            overflow-y: auto;
        }

        .mgl-dashboard::-webkit-scrollbar {
            width: 6px;
        }

        .mgl-dashboard::-webkit-scrollbar-track {
            background: var(--bg-primary);
        }

        .mgl-dashboard::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 3px;
        }

        .mgl-dashboard::-webkit-scrollbar-thumb:hover {
            background: var(--border-hover);
        }

        /* Cards */
        .mgl-card {
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            transition: all 0.2s ease;
        }

        .mgl-card:hover {
            border-color: var(--border-hover);
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .mgl-card-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border);
            cursor: pointer;
            user-select: none;
            transition: background 0.15s ease;
        }

        .mgl-card-header:hover {
            background: var(--bg-hover);
        }

        .mgl-card-title {
            font-size: 11px;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            color: var(--text-secondary);
        }

        .mgl-card-toggle {
            width: 16px;
            height: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--text-tertiary);
            transition: all 0.2s ease;
        }

        .mgl-card.collapsed .mgl-card-toggle {
            transform: rotate(-90deg);
        }

        .mgl-card-body {
            padding: 12px;
            max-height: 250px;
            overflow-y: auto;
            transition: max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mgl-card.collapsed .mgl-card-body {
            max-height: 0;
            padding: 0;
            overflow: hidden;
        }

        .mgl-card-body::-webkit-scrollbar {
            width: 4px;
        }

        .mgl-card-body::-webkit-scrollbar-track {
            background: transparent;
        }

        .mgl-card-body::-webkit-scrollbar-thumb {
            background: var(--border);
            border-radius: 2px;
        }

        /* Stat Display */
        .mgl-stat {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 0;
            font-size: 11px;
        }

        .mgl-stat-label {
            color: var(--text-tertiary);
        }

        .mgl-stat-value {
            color: var(--text-primary);
            font-weight: 500;
        }

        /* Buttons */
        .mgl-btn {
            padding: 6px 12px;
            background: var(--accent);
            border: none;
            border-radius: 4px;
            color: white;
            font-size: 11px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.15s ease;
            white-space: nowrap;
        }

        .mgl-btn:hover {
            background: var(--accent-hover);
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(74, 158, 255, 0.3);
        }

        .mgl-btn:active {
            transform: translateY(0);
        }

        .mgl-btn-sm {
            padding: 4px 8px;
            font-size: 10px;
        }

        .mgl-btn-danger {
            background: var(--danger);
        }

        .mgl-btn-danger:hover {
            background: #dc2626;
            box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }

        /* Select */
        .mgl-select {
            width: 100%;
            padding: 6px 8px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-primary);
            font-size: 11px;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .mgl-select:hover {
            border-color: var(--border-hover);
        }

        .mgl-select:focus {
            outline: none;
            border-color: var(--accent);
        }

        /* Checkbox */
        .mgl-checkbox {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 0;
            cursor: pointer;
            user-select: none;
            transition: color 0.15s ease;
        }

        .mgl-checkbox:hover {
            color: var(--text-primary);
        }

        .mgl-checkbox input {
            width: 14px;
            height: 14px;
            cursor: pointer;
        }

        /* Pet Item */
        .mgl-pet-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 4px;
            margin-bottom: 4px;
            transition: all 0.15s ease;
        }

        .mgl-pet-item:hover {
            background: var(--bg-hover);
            border-color: var(--border-hover);
        }

        .mgl-pet-name {
            font-size: 11px;
            font-weight: 500;
            color: var(--text-primary);
        }

        .mgl-pet-hunger {
            font-size: 10px;
            color: var(--text-tertiary);
        }

        /* Room Item */
        .mgl-room-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            border-radius: 4px;
            margin-bottom: 4px;
            transition: all 0.15s ease;
        }

        .mgl-room-item:hover {
            background: var(--bg-hover);
            border-color: var(--border-hover);
        }

        .mgl-room-code {
            font-size: 11px;
            font-weight: 600;
            color: var(--text-primary);
        }

        .mgl-room-count {
            font-size: 10px;
            padding: 2px 6px;
            background: var(--bg-primary);
            border-radius: 3px;
        }

        /* Settings Dropdown */
        .mgl-settings-dropdown {
            position: absolute;
            top: 48px;
            right: 12px;
            width: 280px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            box-shadow: var(--shadow-lg);
            padding: 12px;
            display: none;
            z-index: 1000000;
        }

        .mgl-settings-dropdown.active {
            display: block;
            animation: slideDown 0.2s ease;
        }

        @keyframes slideDown {
            from {
                opacity: 0;
                transform: translateY(-8px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .mgl-setting-item {
            margin-bottom: 12px;
        }

        .mgl-setting-label {
            font-size: 10px;
            color: var(--text-tertiary);
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
    `;

    // ==================== UI CREATION ====================
    function createUI() {
        // Add styles
        const styleEl = document.createElement('style');
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);

        // Create main container
        const container = document.createElement('div');
        container.id = 'mgtools-lite';
        container.innerHTML = `
            <div class="mgl-header">
                <div class="mgl-title">MGTOOLS LITE</div>
                <div class="mgl-controls">
                    <button class="mgl-btn-icon" id="mgl-settings-btn" title="Settings">⚙</button>
                    <button class="mgl-btn-icon" id="mgl-help-btn" title="Help">?</button>
                    <button class="mgl-btn-icon" id="mgl-minimize-btn" title="Minimize">−</button>
                </div>
            </div>
            <div class="mgl-dashboard">
                ${createPetsCard()}
                ${createSeedsCard()}
                ${createValuesCard()}
                ${createRoomsCard()}
                ${createTimersCard()}
                ${createAbilitiesCard()}
            </div>
            <div class="mgl-settings-dropdown" id="mgl-settings-dropdown">
                <div class="mgl-setting-item">
                    <div class="mgl-setting-label">Theme</div>
                    <select class="mgl-select">
                        <option>Dark (Default)</option>
                        <option>Light</option>
                        <option>Auto</option>
                    </select>
                </div>
                <div class="mgl-setting-item">
                    <div class="mgl-setting-label">Opacity</div>
                    <input type="range" min="50" max="100" value="95" style="width: 100%;">
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // Setup interactions
        setupCardToggles();
        setupMinimize();
        setupSettings();
        makeDraggable(container);
    }

    // ==================== CARD CREATORS ====================
    function createPetsCard() {
        const presets = Object.keys(state.petPresets);
        const isExpanded = state.expandedCards.pets;

        return `
            <div class="mgl-card ${isExpanded ? '' : 'collapsed'}" data-card="pets">
                <div class="mgl-card-header">
                    <div class="mgl-card-title">Pets (${state.activePets.length} Active)</div>
                    <div class="mgl-card-toggle">▼</div>
                </div>
                <div class="mgl-card-body">
                    ${state.activePets.length > 0 ? state.activePets.map(pet => `
                        <div class="mgl-pet-item">
                            <div>
                                <div class="mgl-pet-name">${pet.customName || pet.species}</div>
                                <div class="mgl-pet-hunger">Hunger: ${Math.round(pet.hunger || 0)}%</div>
                            </div>
                        </div>
                    `).join('') : '<div style="color: var(--text-tertiary); font-size: 11px;">No active pets</div>'}

                    ${presets.length > 0 ? `
                        <select class="mgl-select" style="margin-top: 8px;">
                            <option value="">Load Preset...</option>
                            ${presets.map(name => `<option value="${name}">${name}</option>`).join('')}
                        </select>
                    ` : ''}
                </div>
            </div>
        `;
    }

    function createSeedsCard() {
        const isExpanded = state.expandedCards.seeds;
        const seeds = ['Carrot', 'Wheat', 'Corn', 'Tomato', 'Strawberry'];

        return `
            <div class="mgl-card ${isExpanded ? '' : 'collapsed'}" data-card="seeds">
                <div class="mgl-card-header">
                    <div class="mgl-card-title">Seed Deletion (${state.seedsToDelete.length})</div>
                    <div class="mgl-card-toggle">▼</div>
                </div>
                <div class="mgl-card-body">
                    ${seeds.map(seed => `
                        <label class="mgl-checkbox">
                            <input type="checkbox" ${state.seedsToDelete.includes(seed) ? 'checked' : ''} value="${seed}">
                            <span>${seed}</span>
                        </label>
                    `).join('')}
                    <button class="mgl-btn mgl-btn-sm mgl-btn-danger" style="width: 100%; margin-top: 8px;">
                        Delete Selected (${state.seedsToDelete.length})
                    </button>
                </div>
            </div>
        `;
    }

    function createValuesCard() {
        const isExpanded = state.expandedCards.values;

        return `
            <div class="mgl-card ${isExpanded ? '' : 'collapsed'}" data-card="values">
                <div class="mgl-card-header">
                    <div class="mgl-card-title">Values & Stats</div>
                    <div class="mgl-card-toggle">▼</div>
                </div>
                <div class="mgl-card-body">
                    <div class="mgl-stat">
                        <span class="mgl-stat-label">Gold</span>
                        <span class="mgl-stat-value">125,430</span>
                    </div>
                    <div class="mgl-stat">
                        <span class="mgl-stat-label">Essence</span>
                        <span class="mgl-stat-value">2.3M</span>
                    </div>
                    <div class="mgl-stat">
                        <span class="mgl-stat-label">Garden Value</span>
                        <span class="mgl-stat-value">450K</span>
                    </div>
                    <div class="mgl-stat">
                        <span class="mgl-stat-label">Inventory</span>
                        <span class="mgl-stat-value">89K</span>
                    </div>
                </div>
            </div>
        `;
    }

    function createRoomsCard() {
        const isExpanded = state.expandedCards.rooms;
        const rooms = ['MG1', 'MG2', 'MG3', 'MG4', 'MG5', 'SLAY'];

        return `
            <div class="mgl-card ${isExpanded ? '' : 'collapsed'}" data-card="rooms">
                <div class="mgl-card-header">
                    <div class="mgl-card-title">Room Status</div>
                    <div class="mgl-card-toggle">▼</div>
                </div>
                <div class="mgl-card-body">
                    ${rooms.map(room => `
                        <div class="mgl-room-item">
                            <span class="mgl-room-code">${room}</span>
                            <div style="display: flex; align-items: center; gap: 8px;">
                                <span class="mgl-room-count">0/6</span>
                                <button class="mgl-btn mgl-btn-sm">Join</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    function createTimersCard() {
        const isExpanded = state.expandedCards.timers;

        return `
            <div class="mgl-card ${isExpanded ? '' : 'collapsed'}" data-card="timers">
                <div class="mgl-card-header">
                    <div class="mgl-card-title">Timers</div>
                    <div class="mgl-card-toggle">▼</div>
                </div>
                <div class="mgl-card-body">
                    <div class="mgl-stat">
                        <span class="mgl-stat-label">Next Shop Restock</span>
                        <span class="mgl-stat-value">2h 15m</span>
                    </div>
                    <div class="mgl-stat">
                        <span class="mgl-stat-label">Next Egg Restock</span>
                        <span class="mgl-stat-value">45m</span>
                    </div>
                    <div class="mgl-stat">
                        <span class="mgl-stat-label">Lunar Event</span>
                        <span class="mgl-stat-value">4h 30m</span>
                    </div>
                </div>
            </div>
        `;
    }

    function createAbilitiesCard() {
        const isExpanded = state.expandedCards.abilities !== false;

        return `
            <div class="mgl-card ${isExpanded ? '' : 'collapsed'}" data-card="abilities">
                <div class="mgl-card-header">
                    <div class="mgl-card-title">Recent Abilities</div>
                    <div class="mgl-card-toggle">▼</div>
                </div>
                <div class="mgl-card-body">
                    <div style="color: var(--text-tertiary); font-size: 11px;">No recent abilities</div>
                </div>
            </div>
        `;
    }

    // ==================== INTERACTIONS ====================
    function setupCardToggles() {
        document.querySelectorAll('.mgl-card-header').forEach(header => {
            header.addEventListener('click', (e) => {
                const card = e.target.closest('.mgl-card');
                const cardName = card.dataset.card;

                card.classList.toggle('collapsed');
                state.expandedCards[cardName] = !card.classList.contains('collapsed');
                storage.set('mgtools_expandedCards', state.expandedCards);

                // Satisfying click feedback
                card.style.transform = 'scale(0.98)';
                setTimeout(() => card.style.transform = '', 100);
            });
        });
    }

    function setupMinimize() {
        const btn = document.getElementById('mgl-minimize-btn');
        const container = document.getElementById('mgtools-lite');

        btn.addEventListener('click', () => {
            container.classList.toggle('collapsed');
            btn.textContent = container.classList.contains('collapsed') ? '+' : '−';
        });
    }

    function setupSettings() {
        const btn = document.getElementById('mgl-settings-btn');
        const dropdown = document.getElementById('mgl-settings-dropdown');

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.contains(e.target) && e.target !== btn) {
                dropdown.classList.remove('active');
            }
        });
    }

    function makeDraggable(element) {
        const header = element.querySelector('.mgl-header');
        let isDragging = false;
        let currentX, currentY, initialX, initialY;

        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.mgl-controls')) return;
            isDragging = true;
            initialX = e.clientX - element.offsetLeft;
            initialY = e.clientY - element.offsetTop;
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            element.style.left = currentX + 'px';
            element.style.top = currentY + 'px';
            element.style.right = 'auto';
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
    }

    // ==================== INITIALIZATION ====================
    function init() {
        // Wait for page to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', createUI);
        } else {
            createUI();
        }

        console.log('✅ MGTools Lite v2.0.0 loaded');
    }

    init();
})();
