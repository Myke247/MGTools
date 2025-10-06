// ==UserScript==
// @name         MGTools Widgets
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Floating widget system - modular and customizable
// @author       MGTools Team
// @match        https://magiccircle.gg/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

        .mgw-widget {
            font-family: 'JetBrains Mono', monospace;
            position: fixed;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            color: #e5e5e5;
            z-index: 999999;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .mgw-widget:hover {
            border-color: rgba(255, 255, 255, 0.2);
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
        }

        .mgw-widget-header {
            padding: 10px 12px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            user-select: none;
        }

        .mgw-widget-title {
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #888;
        }

        .mgw-widget-controls {
            display: flex;
            gap: 4px;
        }

        .mgw-control-btn {
            width: 18px;
            height: 18px;
            background: transparent;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 4px;
            color: #666;
            font-size: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.15s ease;
        }

        .mgw-control-btn:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(255, 255, 255, 0.2);
            color: #999;
        }

        .mgw-widget-body {
            padding: 12px;
        }

        /* Pets Widget */
        #mgw-pets {
            top: 80px;
            right: 20px;
            width: 240px;
        }

        .mgw-pet {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 8px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 6px;
            margin-bottom: 6px;
            transition: all 0.15s ease;
        }

        .mgw-pet:hover {
            background: rgba(255, 255, 255, 0.05);
            transform: translateX(-2px);
        }

        .mgw-pet-icon {
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }

        .mgw-pet-info {
            flex: 1;
        }

        .mgw-pet-name {
            font-size: 11px;
            font-weight: 500;
            margin-bottom: 2px;
        }

        .mgw-pet-hunger {
            font-size: 9px;
            color: #666;
        }

        /* Stats Widget */
        #mgw-stats {
            top: 80px;
            right: 280px;
            width: 200px;
        }

        .mgw-stat {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .mgw-stat:last-child {
            border-bottom: none;
        }

        .mgw-stat-label {
            font-size: 10px;
            color: #666;
        }

        .mgw-stat-value {
            font-size: 11px;
            font-weight: 500;
            background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Rooms Widget */
        #mgw-rooms {
            bottom: 20px;
            right: 20px;
            width: 180px;
        }

        .mgw-room {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 6px 8px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 4px;
            margin-bottom: 4px;
            font-size: 10px;
            transition: all 0.15s ease;
            cursor: pointer;
        }

        .mgw-room:hover {
            background: rgba(255, 255, 255, 0.08);
        }

        .mgw-room-code {
            font-weight: 600;
            color: #e5e5e5;
        }

        .mgw-room-count {
            color: #666;
        }

        /* Timers Widget */
        #mgw-timers {
            bottom: 20px;
            right: 220px;
            width: 200px;
        }

        .mgw-timer {
            padding: 8px;
            background: rgba(255, 255, 255, 0.03);
            border-radius: 6px;
            margin-bottom: 6px;
        }

        .mgw-timer-label {
            font-size: 9px;
            color: #666;
            margin-bottom: 4px;
        }

        .mgw-timer-value {
            font-size: 16px;
            font-weight: 600;
            background: linear-gradient(135deg, #f59e0b 0%, #dc2626 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        /* Control Panel */
        #mgw-control {
            top: 20px;
            right: 20px;
            width: 48px;
            height: 48px;
            padding: 0;
        }

        #mgw-control .mgw-widget-body {
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .mgw-menu-btn {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 11px;
            color: white;
            font-size: 18px;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .mgw-menu-btn:hover {
            transform: scale(1.1);
        }

        .mgw-menu {
            position: absolute;
            top: 56px;
            right: 0;
            width: 160px;
            background: rgba(10, 10, 10, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            padding: 4px;
            display: none;
        }

        .mgw-menu.active {
            display: block;
            animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(-4px); }
            to { opacity: 1; transform: translateY(0); }
        }

        .mgw-menu-item {
            padding: 8px 10px;
            font-size: 11px;
            color: #999;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .mgw-menu-item:hover {
            background: rgba(255, 255, 255, 0.08);
            color: #e5e5e5;
        }

        .mgw-collapsed {
            width: 48px !important;
            height: 48px !important;
        }

        .mgw-collapsed .mgw-widget-body {
            display: none !important;
        }

        .mgw-collapsed .mgw-widget-title {
            display: none;
        }
    `;

    const widgets = `
        <!-- Control Panel -->
        <div class="mgw-widget" id="mgw-control">
            <div class="mgw-widget-body">
                <button class="mgw-menu-btn">⚡</button>
                <div class="mgw-menu" id="mgw-menu">
                    <div class="mgw-menu-item" data-action="toggle-all">📍 Toggle All</div>
                    <div class="mgw-menu-item" data-action="reset">🔄 Reset Layout</div>
                    <div class="mgw-menu-item" data-action="settings">⚙️ Settings</div>
                </div>
            </div>
        </div>

        <!-- Pets Widget -->
        <div class="mgw-widget" id="mgw-pets">
            <div class="mgw-widget-header">
                <div class="mgw-widget-title">Pets</div>
                <div class="mgw-widget-controls">
                    <div class="mgw-control-btn" data-action="collapse">−</div>
                    <div class="mgw-control-btn" data-action="close">×</div>
                </div>
            </div>
            <div class="mgw-widget-body">
                <div class="mgw-pet">
                    <div class="mgw-pet-icon">🐱</div>
                    <div class="mgw-pet-info">
                        <div class="mgw-pet-name">Mystic Cat</div>
                        <div class="mgw-pet-hunger">Hunger: 85%</div>
                    </div>
                </div>
                <div class="mgw-pet">
                    <div class="mgw-pet-icon">🐶</div>
                    <div class="mgw-pet-info">
                        <div class="mgw-pet-name">Fire Dog</div>
                        <div class="mgw-pet-hunger">Hunger: 92%</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Stats Widget -->
        <div class="mgw-widget" id="mgw-stats">
            <div class="mgw-widget-header">
                <div class="mgw-widget-title">Stats</div>
                <div class="mgw-widget-controls">
                    <div class="mgw-control-btn" data-action="collapse">−</div>
                    <div class="mgw-control-btn" data-action="close">×</div>
                </div>
            </div>
            <div class="mgw-widget-body">
                <div class="mgw-stat">
                    <span class="mgw-stat-label">Gold</span>
                    <span class="mgw-stat-value">125.4K</span>
                </div>
                <div class="mgw-stat">
                    <span class="mgw-stat-label">Essence</span>
                    <span class="mgw-stat-value">2.3M</span>
                </div>
                <div class="mgw-stat">
                    <span class="mgw-stat-label">Garden</span>
                    <span class="mgw-stat-value">450K</span>
                </div>
            </div>
        </div>

        <!-- Rooms Widget -->
        <div class="mgw-widget" id="mgw-rooms">
            <div class="mgw-widget-header">
                <div class="mgw-widget-title">Rooms</div>
                <div class="mgw-widget-controls">
                    <div class="mgw-control-btn" data-action="collapse">−</div>
                    <div class="mgw-control-btn" data-action="close">×</div>
                </div>
            </div>
            <div class="mgw-widget-body">
                <div class="mgw-room">
                    <span class="mgw-room-code">MG1</span>
                    <span class="mgw-room-count">4/6</span>
                </div>
                <div class="mgw-room">
                    <span class="mgw-room-code">MG2</span>
                    <span class="mgw-room-count">0/6</span>
                </div>
                <div class="mgw-room">
                    <span class="mgw-room-code">SLAY</span>
                    <span class="mgw-room-count">6/6</span>
                </div>
            </div>
        </div>

        <!-- Timers Widget -->
        <div class="mgw-widget" id="mgw-timers">
            <div class="mgw-widget-header">
                <div class="mgw-widget-title">Timers</div>
                <div class="mgw-widget-controls">
                    <div class="mgw-control-btn" data-action="collapse">−</div>
                    <div class="mgw-control-btn" data-action="close">×</div>
                </div>
            </div>
            <div class="mgw-widget-body">
                <div class="mgw-timer">
                    <div class="mgw-timer-label">Shop Restock</div>
                    <div class="mgw-timer-value">2:15</div>
                </div>
                <div class="mgw-timer">
                    <div class="mgw-timer-label">Lunar Event</div>
                    <div class="mgw-timer-value">4:30</div>
                </div>
            </div>
        </div>
    `;

    function makeDraggable(element) {
        const header = element.querySelector('.mgw-widget-header');
        if (!header) return;

        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        header.onmousedown = dragMouseDown;

        function dragMouseDown(e) {
            e.preventDefault();
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e) {
            e.preventDefault();
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            element.style.top = (element.offsetTop - pos2) + "px";
            element.style.left = (element.offsetLeft - pos1) + "px";
            element.style.right = 'auto';
            element.style.bottom = 'auto';
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    function init() {
        const style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.innerHTML = widgets;
        document.body.appendChild(container);

        // Make all widgets draggable
        document.querySelectorAll('.mgw-widget').forEach(widget => {
            makeDraggable(widget);

            // Control buttons
            widget.querySelectorAll('.mgw-control-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const action = btn.dataset.action;
                    if (action === 'collapse') {
                        widget.classList.toggle('mgw-collapsed');
                        btn.textContent = widget.classList.contains('mgw-collapsed') ? '+' : '−';
                    } else if (action === 'close') {
                        widget.style.display = 'none';
                    }
                });
            });
        });

        // Control menu
        const menuBtn = document.querySelector('.mgw-menu-btn');
        const menu = document.getElementById('mgw-menu');

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            menu.classList.toggle('active');
        });

        document.addEventListener('click', () => {
            menu.classList.remove('active');
        });

        console.log('✅ MGTools Widgets v2.0.0 loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
