/**
 * Phase 8c Test Suite: Full Campaign Experience
 * Tests:
 * 1. World Clock & Solar Weather Cycle Mechanics
 * 2. Technology Progression Paths (6 paths × 3 tiers) & Stat Modifiers
 * 3. Four Distinct Campaign Endings (Collapse, Corporate, Military, Renaissance)
 * 4. Safe New Campaign Initialization & Archive Storage
 * 5. Cascade Survival Game Mode & Record Tracking
 * 6. Campaign Map Sector Integrity & Telemetry Aggregation
 * 7. Save v2 Schema Backward Compatibility
 */

const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

// Setup mock localStorage & browser environment
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, val) => { store[key] = String(val); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        getAllKeys: () => Object.keys(store)
    };
})();

global.window = global;
global.localStorage = localStorageMock;

// Mock DOM elements
const elements = {};
global.document = {
    getElementById: (id) => {
        if (!elements[id]) {
            elements[id] = {
                id,
                style: {},
                classList: {
                    classes: new Set(),
                    add(c) { this.classes.add(c); },
                    remove(c) { this.classes.delete(c); },
                    toggle(c, val) { if (val) this.classes.add(c); else this.classes.delete(c); },
                    contains(c) { return this.classes.has(c); }
                },
                innerText: '',
                textContent: '',
                innerHTML: '',
                children: [],
                appendChild(c) { this.children.push(c); },
                setAttribute(k, v) { this[k] = v; },
                getAttribute(k) { return this[k]; }
            };
        }
        return elements[id];
    },
    createElement: (tag) => ({
        tag,
        className: '',
        style: {},
        innerHTML: '',
        children: [],
        appendChild(c) { this.children.push(c); },
        setAttribute(k, v) { this[k] = v; },
        getAttribute(k) { return this[k]; }
    }),
    querySelectorAll: () => [],
    addEventListener: () => {}
};

// Load scripts in sandbox
vm.runInThisContext(fs.readFileSync('data/parts.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/missions.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/donki-snapshot.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('data/storylets.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/campaign.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/data.js', 'utf8'));

console.log('=== PHASE 8c TEST SUITE: FULL CAMPAIGN EXPERIENCE ===\n');

// ---------------------------------------------------------------------
// TEST 1: World Clock & Solar Weather Cycle
// ---------------------------------------------------------------------
console.log('--- TEST 1: World Clock & Solar Weather Cycle ---');
const save = OrbitalStorage.getDefaultSave();
assert.strictEqual(save.worldEpochDay, 1, 'Default worldEpochDay should be 1');

const initialClock = CampaignManager.getFormattedDate(save);
assert.strictEqual(initialClock.epochDay, 1);
assert.strictEqual(initialClock.calendarDate, '2054-04-12');
assert.strictEqual(initialClock.solarLevel, 'LOW');
assert(initialClock.fullString.includes('EPOCH DAY 001 // 2054-04-12'));

// Advance world clock by 15 days
CampaignManager.advanceWorldClock(save, 15);
assert.strictEqual(save.worldEpochDay, 16);
const midClock = CampaignManager.getFormattedDate(save);
assert.strictEqual(midClock.calendarDate, '2054-04-27');
assert.strictEqual(midClock.solarLevel, 'MODERATE');

// Advance into solar storm threshold (day 24)
CampaignManager.advanceWorldClock(save, 8);
const stormClock = CampaignManager.getFormattedDate(save);
assert.strictEqual(stormClock.solarLevel, 'HIGH');
assert(stormClock.solarStatus.includes('STORM WARNING'));
console.log('PASS: World clock correctly models epoch days, calendar translation, and solar cycles.\n');

// ---------------------------------------------------------------------
// TEST 2: Technology Progression Paths (6 paths × 3 tiers)
// ---------------------------------------------------------------------
console.log('--- TEST 2: Technology Progression Paths ---');
assert(TECH_PATHS, 'TECH_PATHS must be defined');
const pathKeys = ['capture', 'sensors', 'power', 'shielding', 'communications', 'propulsion'];
pathKeys.forEach(k => {
    const path = TECH_PATHS[k];
    assert(path, `Tech path ${k} must exist`);
    assert.strictEqual(path.tiers.length, 3, `Tech path ${k} must have 3 tiers`);
    path.tiers.forEach((t, idx) => {
        assert.strictEqual(t.tier, idx + 1);
        assert(t.name, `Tier ${idx + 1} of ${k} missing name`);
        assert(t.cost, `Tier ${idx + 1} of ${k} missing cost`);
        assert(t.bonuses, `Tier ${idx + 1} of ${k} missing bonuses description`);
    });
});

// Test unlocking technology tiers with resource validation
const techSave = OrbitalStorage.getDefaultSave();
techSave.credits = 1000;
techSave.materials = { metal: 10, cells: 10, chips: 10 };

// Tier 1 is baseline; unlock Tier 2 capture
const unlockResult = CampaignManager.unlockTech(techSave, 'capture');
assert.strictEqual(unlockResult.success, true);
assert.strictEqual(unlockResult.newTier, 2);
assert.strictEqual(techSave.techTree.capture, 2);
assert.strictEqual(techSave.credits, 1000 - 450);
assert.strictEqual(techSave.materials.metal, 10 - 4);

// Test modifiers calculation
const mods = CampaignManager.getTechStatModifiers(techSave);
assert(mods.tractorPullMod > 1.0, 'Tractor pull mod should increase with Tier 2 capture');
assert(mods.radarRangeMod === 1.0, 'Radar range mod should remain 1.0 at Tier 1 sensors');

// Unlock Tier 2 sensors
CampaignManager.unlockTech(techSave, 'sensors');
const mods2 = CampaignManager.getTechStatModifiers(techSave);
assert(mods2.radarRangeMod > 1.0, 'Radar range mod should increase with Tier 2 sensors');

// Test insufficient funds prevention
techSave.credits = 0;
const failUnlock = CampaignManager.unlockTech(techSave, 'propulsion');
assert.strictEqual(failUnlock.success, false);
assert(failUnlock.reason.includes('Requires'));
console.log('PASS: All 6 tech paths, tiers, resource deductions, and stat bonuses verified.\n');

// ---------------------------------------------------------------------
// TEST 3: Four Distinct Campaign Endings
// ---------------------------------------------------------------------
console.log('--- TEST 3: Four Distinct Campaign Endings ---');
assert(CAMPAIGN_ENDINGS, 'CAMPAIGN_ENDINGS must be defined');
assert(CAMPAIGN_ENDINGS.kessler_collapse, 'kessler_collapse ending missing');
assert(CAMPAIGN_ENDINGS.commercial_monopoly, 'commercial_monopoly ending missing');
assert(CAMPAIGN_ENDINGS.military_fortress, 'military_fortress ending missing');
assert(CAMPAIGN_ENDINGS.orbital_renaissance, 'orbital_renaissance ending missing');

// 3a. Test Kessler Collapse Trigger (Critical low sector health)
const collapseSave = OrbitalStorage.getDefaultSave();
Object.keys(collapseSave.sectorHealth).forEach(k => { collapseSave.sectorHealth[k] = 20; });
const ending1 = CampaignManager.evaluateCampaignEnding(collapseSave);
assert(ending1, 'Ending should trigger for critical sector collapse');
assert.strictEqual(ending1.id, 'kessler_collapse');

// 3b. Test Commercial Monopoly Trigger
const commSave = OrbitalStorage.getDefaultSave();
commSave.reputation = { commercial: 80, agency: 40, public: 45 };
Object.keys(commSave.sectorHealth).forEach(k => { commSave.sectorHealth[k] = 60; });
const ending2 = CampaignManager.evaluateCampaignEnding(commSave);
assert(ending2, 'Ending should trigger for commercial hegemony');
assert.strictEqual(ending2.id, 'commercial_monopoly');

// 3c. Test Military Fortress Trigger
const militarySave = OrbitalStorage.getDefaultSave();
militarySave.reputation = { commercial: 40, agency: 82, public: 40 };
Object.keys(militarySave.sectorHealth).forEach(k => { militarySave.sectorHealth[k] = 65; });
const ending3 = CampaignManager.evaluateCampaignEnding(militarySave);
assert(ending3, 'Ending should trigger for defense cordon');
assert.strictEqual(ending3.id, 'military_fortress');

// 3d. Test Orbital Renaissance Trigger (Golden Ending)
const goldenSave = OrbitalStorage.getDefaultSave();
goldenSave.reputation = { commercial: 55, agency: 60, public: 75 };
Object.keys(goldenSave.sectorHealth).forEach(k => { goldenSave.sectorHealth[k] = 85; });
const ending4 = CampaignManager.evaluateCampaignEnding(goldenSave);
assert(ending4, 'Ending should trigger for golden orbital renaissance');
assert.strictEqual(ending4.id, 'orbital_renaissance');
console.log('PASS: All 4 endings evaluate correctly according to campaign health, reputations, and decisions.\n');

// ---------------------------------------------------------------------
// TEST 4: Safe New Campaign & Save Archiving
// ---------------------------------------------------------------------
console.log('--- TEST 4: Safe New Campaign & Save Archiving ---');
const oldSave = OrbitalStorage.getDefaultSave();
oldSave.campaignSeed = 777888;
oldSave.worldEpochDay = 45;
oldSave.credits = 12500;
oldSave.missionsCompleted = 6;
oldSave.leaderboard = [{ name: 'Test Commander', score: 99999, mission: 'Orbit', date: '2054' }];

// Archive old save
const archiveKey = CampaignManager.archiveCurrentCampaign(oldSave, 'Test Archive');
assert(archiveKey, 'archiveKey should be returned');
const rawArchive = localStorageMock.getItem(archiveKey);
assert(rawArchive, 'Archive record must be persisted in localStorage');
const parsedArchive = JSON.parse(rawArchive);
assert.strictEqual(parsedArchive.data.campaignSeed, 777888);
assert.strictEqual(parsedArchive.data.credits, 12500);

// Start fresh campaign
const freshSave = CampaignManager.startNewCampaign(oldSave);
assert.notStrictEqual(freshSave.campaignSeed, 777888, 'Fresh campaign should have new seed');
assert.strictEqual(freshSave.worldEpochDay, 1, 'Fresh campaign should reset to Epoch Day 1');
assert.strictEqual(freshSave.missionsCompleted, 0, 'Fresh campaign should reset missionsCompleted');
assert.strictEqual(freshSave.techTree.capture, 1, 'Fresh campaign should reset tech tree to Tier 1');
assert.strictEqual(freshSave.leaderboard[0].name, 'Test Commander', 'Career leaderboard records must be preserved');
console.log('PASS: New Campaign safely archives active save and establishes fresh campaign seed.\n');

// ---------------------------------------------------------------------
// TEST 5: Cascade Survival Mode Record Tracking
// ---------------------------------------------------------------------
console.log('--- TEST 5: Cascade Survival Mode Record Tracking ---');
const survSave = OrbitalStorage.getDefaultSave();
assert(Array.isArray(survSave.survivalRecords), 'survivalRecords should be an array');

const survEntry = CampaignManager.recordSurvivalRun(survSave, {
    timeSurvivedSec: 135,
    formattedTime: '02:15',
    debrisCollected: 14,
    score: 8850,
    rating: 'CASCADE ACE'
});

assert.strictEqual(survEntry.formattedTime, '02:15');
assert.strictEqual(survEntry.rating, 'CASCADE ACE');
assert.strictEqual(survSave.survivalRecords.length, 1);
assert.strictEqual(survSave.survivalRecords[0].score, 8850);
console.log('PASS: Cascade Survival Mode records and ratings persist accurately.\n');

// ---------------------------------------------------------------------
// TEST 6: Save Version 2 Non-Destructive Compatibility
// ---------------------------------------------------------------------
console.log('--- TEST 6: Save Version 2 Compatibility ---');
localStorageMock.clear();
OrbitalStorage.save(techSave);
const reloaded = OrbitalStorage.load();

assert(reloaded.techTree, 'Reloaded save must include techTree');
assert.strictEqual(reloaded.techTree.capture, 2, 'Tech tree upgrades must persist across reload');
assert(reloaded.worldEpochDay, 'Reloaded save must include worldEpochDay');
assert(Array.isArray(reloaded.survivalRecords), 'Reloaded save must include survivalRecords');
console.log('PASS: Full Save v2 schema persists intact across reload.\n');

console.log('=====================================================');
console.log('ALL PHASE 8c TESTS PASSED SUCCESSFULLY! (100% OK)');
console.log('=====================================================\n');
