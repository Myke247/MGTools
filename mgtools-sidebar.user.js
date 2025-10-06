// ==UserScript==
// @name         MGTools Sidebar
// @namespace    http://tampermonkey.net/
// @version      2.0.0
// @description  Ultra-minimal sidebar design - sleek and professional
// @author       MGTools Team
// @match        https://magiccircle.gg/*
// @grant        GM_setValue
// @grant        GM_getValue
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const styles = `
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap');

        #mgtools-sidebar {
            font-family: 'Space Grotesk', monospace;
            position: fixed;
            right: 0;
            top: 0;
            width: 64px;
            height: 100vh;
            background: linear-gradient(180deg, #0f0f0f 0%, #050505 100%);
            border-left: 1px solid #1a1a1a;
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px 0;
            gap: 8px;
            z-index: 999999;
            transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        #mgtools-sidebar.expanded {
            width: 320px;
        }

        .mgs-logo {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 14px;
            color: white;
            cursor: pointer;
            transition: transform 0.2s ease;
        }

        .mgs-logo:hover {
            transform: scale(1.1);
        }

        .mgs-divider {
            width: 32px;
            height: 1px;
            background: #1a1a1a;
            margin: 8px 0;
        }

        .mgs-nav-item {
            width: 40px;
            height: 40px;
            background: transparent;
            border: 1px solid transparent;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #666;
            cursor: pointer;
            position: relative;
            transition: all 0.2s ease;
        }

        .mgs-nav-item:hover {
            background: #1a1a1a;
            border-color: #2a2a2a;
            color: #999;
        }

        .mgs-nav-item.active {
            background: #1a1a1a;
            border-color: #667eea;
            color: #667eea;
        }

        .mgs-nav-item::after {
            content: attr(data-label);
            position: absolute;
            right: 56px;
            background: #1a1a1a;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 11px;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.2s ease;
        }

        .mgs-nav-item:hover::after {
            opacity: 1;
        }

        .mgs-content {
            position: absolute;
            left: 64px;
            top: 0;
            width: 256px;
            height: 100vh;
            background: #0a0a0a;
            border-left: 1px solid #1a1a1a;
            padding: 20px;
            overflow-y: auto;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
        }

        #mgtools-sidebar.expanded .mgs-content {
            opacity: 1;
            pointer-events: auto;
        }

        .mgs-section {
            margin-bottom: 24px;
        }

        .mgs-section-title {
            font-size: 10px;
            font-weight: 600;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
        }

        .mgs-item {
            padding: 8px 12px;
            background: #0f0f0f;
            border: 1px solid #1a1a1a;
            border-radius: 6px;
            margin-bottom: 6px;
            font-size: 11px;
            transition: all 0.15s ease;
        }

        .mgs-item:hover {
            background: #141414;
            border-color: #2a2a2a;
            transform: translateX(-2px);
        }

        .mgs-stat-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .mgs-stat-label {
            color: #666;
            font-size: 10px;
        }

        .mgs-stat-value {
            color: #e5e5e5;
            font-size: 11px;
            font-weight: 500;
        }

        .mgs-btn {
            width: 100%;
            padding: 8px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 11px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
        }

        .mgs-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .mgs-badge {
            position: absolute;
            top: -4px;
            right: -4px;
            width: 16px;
            height: 16px;
            background: #ef4444;
            border-radius: 50%;
            font-size: 9px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: 600;
        }

        ::-webkit-scrollbar {
            width: 4px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: #1a1a1a;
            border-radius: 2px;
        }
    `;

    const html = `
        <div id="mgtools-sidebar">
            <div class="mgs-logo">MG</div>
            <div class="mgs-divider"></div>

            <div class="mgs-nav-item active" data-section="pets" data-label="Pets">
                <span style="font-size: 16px;">🐾</span>
            </div>
            <div class="mgs-nav-item" data-section="seeds" data-label="Seeds">
                <span style="font-size: 16px;">🌱</span>
            </div>
            <div class="mgs-nav-item" data-section="values" data-label="Values">
                <span style="font-size: 16px;">💎</span>
            </div>
            <div class="mgs-nav-item" data-section="rooms" data-label="Rooms">
                <span style="font-size: 16px;">🚪</span>
                <div class="mgs-badge">3</div>
            </div>
            <div class="mgs-nav-item" data-section="timers" data-label="Timers">
                <span style="font-size: 16px;">⏰</span>
            </div>

            <div class="mgs-content" id="mgs-content">
                <div class="mgs-section">
                    <div class="mgs-section-title">Active Pets</div>
                    <div class="mgs-item">
                        <div style="font-weight: 600; margin-bottom: 4px;">Mystic Cat</div>
                        <div class="mgs-stat-row">
                            <span class="mgs-stat-label">Hunger</span>
                            <span class="mgs-stat-value">85%</span>
                        </div>
                    </div>
                    <div class="mgs-item">
                        <div style="font-weight: 600; margin-bottom: 4px;">Fire Dog</div>
                        <div class="mgs-stat-row">
                            <span class="mgs-stat-label">Hunger</span>
                            <span class="mgs-stat-value">92%</span>
                        </div>
                    </div>
                </div>

                <div class="mgs-section">
                    <div class="mgs-section-title">Presets</div>
                    <button class="mgs-btn">Load Farming</button>
                </div>
            </div>
        </div>
    `;

    function init() {
        const style = document.createElement('style');
        style.textContent = styles;
        document.head.appendChild(style);

        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container.firstElementChild);

        const sidebar = document.getElementById('mgtools-sidebar');
        const logo = sidebar.querySelector('.mgs-logo');
        const navItems = sidebar.querySelectorAll('.mgs-nav-item');

        logo.addEventListener('click', () => {
            sidebar.classList.toggle('expanded');
        });

        navItems.forEach(item => {
            item.addEventListener('click', () => {
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                sidebar.classList.add('expanded');
            });
        });

        console.log('✅ MGTools Sidebar v2.0.0 loaded');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
