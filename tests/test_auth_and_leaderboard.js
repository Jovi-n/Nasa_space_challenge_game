/**
 * AUTOMATED TEST SUITE: AUTHENTICATION & REAL-PLAYER LEADERBOARD
 * 
 * Verifies:
 * 1. Commander Callsign Registration & PIN Security
 * 2. Login Verification & Session Persistence
 * 3. Leaderboard Filtering (guarantees ONLY real players who played appear)
 * 4. Submission of Real Mission Scores
 * 5. Rank Sorting & Leaderboard Cleanliness
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// Mock localStorage
const localStorageMock = (function() {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; }
    };
})();

// Sandbox setup
const sandbox = {
    window: {
        addEventListener: () => {},
        dispatchEvent: () => {},
        location: { origin: 'http://localhost:8080' }
    },
    localStorage: localStorageMock,
    console: console,
    CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } }
};
sandbox.global = sandbox.window;
vm.createContext(sandbox);

// 1. Load Data
const dataJs = fs.readFileSync(path.join(__dirname, '../js/data.js'), 'utf8') + '\n;window.OrbitalStorage = OrbitalStorage;';
vm.runInContext(dataJs, sandbox);

// 2. Load Leaderboard Service
const authJs = fs.readFileSync(path.join(__dirname, '../js/leaderboard-service.js'), 'utf8');
vm.runInContext(authJs, sandbox);

console.log('=== TEST SUITE: AUTHENTICATION & REAL LEADERBOARD ===\n');

async function runTests() {
    const OrbitalAuth = sandbox.window.OrbitalAuth;
    const LeaderboardService = sandbox.window.LeaderboardService;

    assert(OrbitalAuth, 'OrbitalAuth must be loaded');
    assert(LeaderboardService, 'LeaderboardService must be loaded');

    // -------------------------------------------------------------------------
    // TEST 1: Registration Validation
    // -------------------------------------------------------------------------
    console.log('--- TEST 1: Callsign & PIN Registration Validation ---');
    
    // Too short
    await assert.rejects(async () => {
        await OrbitalAuth.register('A', '1234');
    }, /Callsign must be between 3 and 16/);

    // Invalid characters
    await assert.rejects(async () => {
        await OrbitalAuth.register('Pilot$$$', '1234');
    }, /Callsign can only contain/);

    // Short PIN
    await assert.rejects(async () => {
        await OrbitalAuth.register('Phoenix', '12');
    }, /Security PIN must be at least 4/);

    // Valid Registration
    const regResult = await OrbitalAuth.register('Astra', '9876');
    assert(regResult.success, 'Registration must succeed');
    assert.strictEqual(regResult.user.callsign, 'Astra');
    assert.strictEqual(OrbitalAuth.getCurrentUser().callsign, 'Astra');
    assert.strictEqual(OrbitalAuth.isAuthenticated(), true);

    console.log('PASS: Callsign registration and PIN validation working correctly.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Login & Duplicate Registration Prevention
    // -------------------------------------------------------------------------
    console.log('--- TEST 2: Login & Authentication Security ---');

    // Duplicate registration should fail
    await assert.rejects(async () => {
        await OrbitalAuth.register('Astra', '1111');
    }, /already registered/);

    // Logout
    OrbitalAuth.logout();
    assert.strictEqual(OrbitalAuth.isAuthenticated(), false);
    assert.strictEqual(OrbitalAuth.getCurrentUser().callsign, 'Cadet');

    // Wrong PIN
    await assert.rejects(async () => {
        await OrbitalAuth.login('Astra', 'wrongpin');
    }, /Incorrect Security PIN/);

    // Unknown User
    await assert.rejects(async () => {
        await OrbitalAuth.login('GhostPilot', '1234');
    }, /Callsign not found/);

    // Correct Login
    const loginResult = await OrbitalAuth.login('Astra', '9876');
    assert(loginResult.success, 'Login must succeed');
    assert.strictEqual(OrbitalAuth.getCurrentUser().callsign, 'Astra');
    assert.strictEqual(OrbitalAuth.isAuthenticated(), true);

    console.log('PASS: Login verification and security checks passed.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Real Players Only (Mock / Archive Records Filtered Out)
    // -------------------------------------------------------------------------
    console.log('--- TEST 3: Leaderboard Real-Player Filtering ---');

    const rawRecords = [
        { name: 'Cmdr. Shepard', score: 18450, debris: 74, mission: 'GEO Graveyard', date: 'Archive Record' },
        { name: 'Dr. Ryan Stone', score: 14200, debris: 58, mission: 'Kessler Storm', date: 'Archive Record' },
        { name: 'Capt. Cooper', score: 11900, debris: 46, mission: 'Polar Orbit', date: 'Archive Record' },
        { name: 'Aegis Vanguard', score: 8500, debris: 35, mission: 'LEO Corridor', date: 'Archive Record' },
        { name: 'RealPlayerOne', score: 12500, debris: 40, mission: 'LEO Corridor', date: '2026-11-17', status: 'CLEARED' }
    ];

    const cleaned = LeaderboardService.cleanRealRecords(rawRecords);
    assert.strictEqual(cleaned.length, 1, 'Only real player should survive filtering');
    assert.strictEqual(cleaned[0].name, 'RealPlayerOne');
    assert.strictEqual(cleaned[0].score, 12500);

    console.log('PASS: Archive records and preset mock commanders completely filtered out.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Score Submission & Ranking
    // -------------------------------------------------------------------------
    console.log('--- TEST 4: Real Mission Score Submission & Sorting ---');

    // Submit first run for Astra
    const sub1 = await LeaderboardService.submitScore({
        name: 'Astra',
        score: 15400,
        debris: 28,
        mission: 'LEO Station Corridor',
        status: 'CLEARED'
    });
    assert(sub1.success, 'Submission must succeed');
    assert.strictEqual(sub1.records.length, 1);
    assert.strictEqual(sub1.records[0].name, 'Astra');

    // Register second player: Orion
    await OrbitalAuth.register('Orion', '5555');
    const sub2 = await LeaderboardService.submitScore({
        name: 'Orion',
        score: 22800,
        debris: 42,
        mission: 'GEO Graveyard',
        status: 'CLEARED'
    });
    assert(sub2.success, 'Orion submission must succeed');
    assert.strictEqual(sub2.records.length, 2);

    // Orion should be Rank #01 (higher score)
    assert.strictEqual(sub2.records[0].name, 'Orion');
    assert.strictEqual(sub2.records[0].score, 22800);
    assert.strictEqual(sub2.records[1].name, 'Astra');
    assert.strictEqual(sub2.records[1].score, 15400);

    console.log('PASS: Real scores correctly submitted, ranked, and ordered descending.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Default Save Initial State
    // -------------------------------------------------------------------------
    console.log('--- TEST 5: Default Save Leaderboard Cleanliness ---');
    const defaultSave = sandbox.window.OrbitalStorage.getDefaultSave();
    assert(Array.isArray(defaultSave.leaderboard), 'leaderboard must be an array');
    assert.strictEqual(defaultSave.leaderboard.length, 0, 'Default save must have 0 fake entries');
    console.log('PASS: Default save starts completely pristine with 0 fake entries.\n');

    console.log('=====================================================');
    console.log('ALL AUTHENTICATION & LEADERBOARD TESTS PASSED (100%)!');
    console.log('=====================================================');
}

runTests().catch(err => {
    console.error('TEST SUITE FAILED:', err);
    process.exit(1);
});
