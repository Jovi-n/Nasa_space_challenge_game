/**
 * Automated Test Suite for Main Menu Mission Board Button and F3 Telemetry Overlay
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Simple DOM environment mock
function createMockDOM() {
    const listeners = {};
    const elements = {};

    function createElement(tag, id = '', className = '') {
        const classList = new Set(className ? className.split(' ').filter(Boolean) : []);
        const el = {
            tagName: tag.toUpperCase(),
            id: id,
            className: className,
            classList: {
                add: (c) => classList.add(c),
                remove: (c) => classList.delete(c),
                toggle: (c, force) => {
                    if (force === undefined) {
                        if (classList.has(c)) { classList.delete(c); return false; }
                        else { classList.add(c); return true; }
                    } else if (force) {
                        classList.add(c); return true;
                    } else {
                        classList.delete(c); return false;
                    }
                },
                contains: (c) => classList.has(c)
            },
            style: {},
            dataset: {},
            _children: [],
            get children() { return this._children; },
            set children(val) { this._children = val; },
            _innerHTML: '',
            get innerHTML() { return this._innerHTML; },
            set innerHTML(val) {
                this._innerHTML = val;
                if (!val) this._children = [];
            },
            innerText: '',
            textContent: '',
            _listeners: {},
            addEventListener: function(event, fn) {
                if (!this._listeners[event]) this._listeners[event] = [];
                this._listeners[event].push(fn);
            },
            click: function() {
                const event = {
                    type: 'click',
                    target: this,
                    defaultPrevented: false,
                    preventDefault: () => { event.defaultPrevented = true; },
                    stopPropagation: () => {}
                };
                if (this._listeners['click']) {
                    this._listeners['click'].forEach(fn => fn(event));
                }
                // Bubble to document
                if (global.document && global.document._listeners['click']) {
                    global.document._listeners['click'].forEach(fn => fn(event));
                }
            },
            closest: function(selector) {
                if (selector.includes(',')) {
                    const parts = selector.split(',').map(s => s.trim());
                    for (const p of parts) {
                        const match = this.closest(p);
                        if (match) return match;
                    }
                    return null;
                }
                if (selector.startsWith('#')) {
                    const targetId = selector.slice(1);
                    if (this.id === targetId) return this;
                    return null;
                }
                if (selector.startsWith('.')) {
                    const targetClass = selector.slice(1);
                    if (this.classList.contains(targetClass)) return this;
                    return null;
                }
                return null;
            },
            getAttribute: function(attr) {
                return this[attr] || (this.dataset ? this.dataset[attr.replace('data-', '')] : null);
            },
            setAttribute: function(attr, val) {
                this[attr] = val;
            },
            appendChild: function(child) {
                this._children.push(child);
            },
            querySelectorAll: function() { return []; },
            querySelector: function() { return null; }
        };
        if (id) elements[id] = el;
        return el;
    }

    // Key screen elements from index.html
    const screenMainMenu = createElement('div', 'screen-main-menu', 'screen-layer');
    const btnMenuContracts = createElement('button', 'btn-menu-contracts', 'btn-primary');
    const screenMissionBoard = createElement('div', 'screen-mission-board', 'screen-layer hidden');
    const contractsCardGrid = createElement('div', 'contracts-card-grid', 'contracts-card-grid');
    const btnBoardReturn = createElement('button', 'btn-board-return', 'btn-secondary');
    const hudOverlay = createElement('div', 'hud-overlay', 'hud-layer hidden');
    const hudF3Debug = createElement('div', 'hud-f3-debug', 'hud-f3-debug hidden');
    const btnToggleF3Hud = createElement('button', 'btn-toggle-f3-hud', 'hud-f3-btn');
    const btnF3Hint = createElement('span', 'btn-f3-hint', 'kbd-btn');

    const documentMock = {
        readyState: 'complete',
        _listeners: {},
        addEventListener: function(event, fn) {
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(fn);
        },
        getElementById: function(id) {
            return elements[id] || null;
        },
        querySelectorAll: function(selector) {
            if (selector.includes('.screen-layer')) {
                return [screenMainMenu, screenMissionBoard];
            }
            if (selector === '.step-tab-btn' || selector === '.design-step-view') {
                return [];
            }
            if (selector === '.btn-close-modal') {
                return [];
            }
            return [];
        },
        querySelector: function(selector) {
            return null;
        },
        createElement: function(tag) {
            return createElement(tag);
        }
    };

    return { elements, documentMock };
}

async function runTests() {
    console.log('--- RUNNING MAIN MENU & F3 TELEMETRY TESTS ---');
    const { elements, documentMock } = createMockDOM();

    // Setup global window / document mocks
    global.window = {
        addEventListener: function(event, fn, capture) {
            if (!this._listeners) this._listeners = {};
            if (!this._listeners[event]) this._listeners[event] = [];
            this._listeners[event].push(fn);
        },
        _listeners: {},
        innerWidth: 1280,
        innerHeight: 720,
        soundSystem: {
            playUiClick: () => {},
            resume: () => {},
            playAlert: () => {}
        },
        localStorage: {
            _store: {},
            getItem: function(k) { return this._store[k] || null; },
            setItem: function(k, v) { this._store[k] = String(v); },
            removeItem: function(k) { delete this._store[k]; }
        }
    };
    global.document = documentMock;
    global.localStorage = global.window.localStorage;

    // Load prerequisites
    eval(fs.readFileSync(path.join(__dirname, '../data/parts.js'), 'utf8'));
    global.PARTS_DATA = global.window.PARTS_DATA;
    eval(fs.readFileSync(path.join(__dirname, '../data/missions.js'), 'utf8'));
    global.MISSIONS_DATA = global.window.MISSIONS_DATA;
    eval(fs.readFileSync(path.join(__dirname, '../data/donki-snapshot.js'), 'utf8'));
    eval(fs.readFileSync(path.join(__dirname, '../js/campaign.js'), 'utf8'));
    eval(fs.readFileSync(path.join(__dirname, '../js/audio.js'), 'utf8'));
    eval(fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8'));
    global.OrbitalStorage = global.window.OrbitalStorage;
    global.GAME_DATA = global.window.GAME_DATA;
    global.CampaignManager = global.window.CampaignManager;
    global.CONTRACT_OBJECTIVES = global.window.CONTRACT_OBJECTIVES;
    global.CONTRACT_MODIFIERS = global.window.CONTRACT_MODIFIERS;
    eval(fs.readFileSync(path.join(__dirname, '../js/director.js'), 'utf8'));
    global.MissionDirector = global.window.MissionDirector;
    eval(fs.readFileSync(path.join(__dirname, '../js/ui.js'), 'utf8'));

    // Test 1: UIController auto-initialized even if readyState is 'complete'
    assert(global.window.uiController, 'UIController should be instantiated automatically');
    assert(typeof global.window.openMissionBoard === 'function', 'window.openMissionBoard must be a defined function');
    assert(typeof global.window.toggleTelemetryOverlay === 'function', 'window.toggleTelemetryOverlay must be a defined function');
    console.log('[PASS] Test 1: UIController & global helpers initialized');

    // Test 2: Main Menu #btn-menu-contracts click transitions to Mission Board
    assert(elements['screen-mission-board'].classList.contains('hidden'), 'Mission Board should initially be hidden');
    elements['btn-menu-contracts'].click();
    assert(!elements['screen-mission-board'].classList.contains('hidden'), 'Mission Board should be visible after clicking contracts button');
    assert(elements['screen-main-menu'].classList.contains('hidden'), 'Main Menu should be hidden when Mission Board is active');
    console.log('[PASS] Test 2: Main Menu Mission Board button click navigates to #screen-mission-board');

    // Test 3: Contracts pool populated
    assert(elements['contracts-card-grid'].children.length === 3, `Contracts card grid should have 3 cards, found ${elements['contracts-card-grid'].children.length}`);
    console.log('[PASS] Test 3: 3 procedural contract cards successfully generated and rendered');

    // Test 4: Return button from Mission Board to Main Menu
    elements['btn-board-return'].click();
    assert(!elements['screen-main-menu'].classList.contains('hidden'), 'Main Menu should be visible after clicking return');
    assert(elements['screen-mission-board'].classList.contains('hidden'), 'Mission Board should be hidden');
    console.log('[PASS] Test 4: Return to Main Menu works reliably');

    // Test 5: window.openMissionBoard() direct programmatic call
    global.window.openMissionBoard();
    assert(!elements['screen-mission-board'].classList.contains('hidden'), 'Mission Board should be open via window.openMissionBoard');
    console.log('[PASS] Test 5: window.openMissionBoard() works directly');

    // Test 6: F3 Telemetry toggle in Menu mode
    assert(elements['hud-f3-debug'].classList.contains('hidden'), 'F3 Debug overlay should start hidden');
    global.window.toggleTelemetryOverlay();
    assert(!elements['hud-f3-debug'].classList.contains('hidden'), 'F3 Debug overlay should be visible after toggle');
    assert(elements['hud-f3-debug'].innerHTML.includes('SYSTEM &amp; ENGINE TELEMETRY'), 'F3 overlay should contain telemetry in menu mode');
    global.window.toggleTelemetryOverlay();
    assert(elements['hud-f3-debug'].classList.contains('hidden'), 'F3 Debug overlay should be hidden after second toggle');
    console.log('[PASS] Test 6: F3 Telemetry toggles system/engine overlay in Menu mode');

    // Test 7: HUD F3 button & controls hint toggle F3 overlay
    elements['btn-toggle-f3-hud'].click();
    assert(!elements['hud-f3-debug'].classList.contains('hidden'), 'Clicking #btn-toggle-f3-hud should open F3 overlay');
    global.window._lastTelemetryToggle = 0;
    elements['btn-f3-hint'].click();
    assert(elements['hud-f3-debug'].classList.contains('hidden'), 'Clicking #btn-f3-hint should close F3 overlay');

    // Test 7b: Backtick (`) key & Global Telemetry button
    global.window._lastTelemetryToggle = 0;
    const backtickEvent = { key: '`', code: 'Backquote', keyCode: 192, defaultPrevented: false, preventDefault: () => { backtickEvent.defaultPrevented = true; }, stopPropagation: () => {} };
    if (global.window._listeners && global.window._listeners['keydown']) {
        global.window._listeners['keydown'].forEach(fn => fn(backtickEvent));
    }
    assert(!elements['hud-f3-debug'].classList.contains('hidden'), 'Pressing ` (backtick) should toggle telemetry without Fn key');
    assert(backtickEvent.defaultPrevented, 'Backtick event should have defaultPrevented');
    global.window._lastTelemetryToggle = 0;
    global.window.toggleTelemetryOverlay();

    // Test 7c: 'T' key toggle (universal non-dead key for laptops)
    global.window._lastTelemetryToggle = 0;
    const tKeyEvent = { key: 't', code: 'KeyT', keyCode: 84, defaultPrevented: false, preventDefault: () => { tKeyEvent.defaultPrevented = true; }, stopPropagation: () => {} };
    if (global.window._listeners && global.window._listeners['keydown']) {
        global.window._listeners['keydown'].forEach(fn => fn(tKeyEvent));
    }
    assert(!elements['hud-f3-debug'].classList.contains('hidden'), 'Pressing T key should toggle telemetry without Fn key');
    assert(tKeyEvent.defaultPrevented, 'T key event should have defaultPrevented');
    global.window._lastTelemetryToggle = 0;
    global.window.toggleTelemetryOverlay();
    global.window._lastTelemetryToggle = 0;
    console.log('[PASS] Test 7: HUD F3 button, controls hint, backtick (`), and T key work as interactive toggles');

    // Test 8: F3 Telemetry with active Flight Director
    const mockScene = {
        hazardGroup: { countActive: () => 3 },
        debrisGroup: { countActive: () => 5 },
        game: { loop: { actualFps: 59.9 } },
        missionConfig: { difficulty: 'standard' },
        kesslerRisk: 12
    };
    const director = new MissionDirector(mockScene);
    global.window.uiController.currentScene = mockScene;
    mockScene.director = director;

    global.window.toggleTelemetryOverlay();
    assert(!elements['hud-f3-debug'].classList.contains('hidden'), 'F3 overlay should be open for live flight');
    assert(elements['hud-f3-debug'].innerHTML.includes('FLIGHT DIRECTOR TELEMETRY'), 'F3 overlay should show live Flight Director telemetry');
    assert(elements['hud-f3-debug'].innerHTML.includes('3 Hazards'), 'F3 overlay should report active hazards count');

    global.window.toggleTelemetryOverlay();
    assert(elements['hud-f3-debug'].classList.contains('hidden'), 'F3 overlay should close on second toggle');
    console.log('[PASS] Test 8: F3 Telemetry works with active Flight Director in-flight');

    console.log('\n>>> ALL 8 MENU & F3 TESTS PASSED PERFECTLY! <<<');
}

runTests().catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
});
