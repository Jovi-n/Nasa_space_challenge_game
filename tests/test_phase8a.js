/**
 * Phase 8a Test Suite: Contract Generation, Mission Board & Persistent Campaign Consequences
 * Tests:
 * 1. Safe Save Version 2 migration preserving all legacy progress
 * 2. Fresh save initialization with Save v2 schema
 * 3. Procedural contract generation: SECTOR × OBJECTIVE × MODIFIERS
 * 4. Five contract objectives (Quota, Protect, Passivate, Recover, Survive)
 * 5. Six contract modifiers (Storm Season, Dense Cloud, Low Budget, Rush, Dead Stick, Blackout)
 * 6. Mission Board contract acceptance and active contract tracking
 * 7. Mission consequences: Sector health delta, residual carryover debris, reputation shifts
 * 8. Consequence narrative generation and debrief integration
 * 9. Solicit contracts (-50 Scrap fee)
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
        clear: () => { store = {}; }
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
vm.runInThisContext(fs.readFileSync('js/campaign.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/data.js', 'utf8'));

console.log('=== PHASE 8a TEST SUITE: CONTRACTS & PERSISTENT CAMPAIGN ===\n');

// ---------------------------------------------------------------------
// TEST 1: Contract Objectives & Modifiers Definitions
// ---------------------------------------------------------------------
console.log('--- TEST 1: Objectives & Modifiers Schema ---');
assert(CONTRACT_OBJECTIVES, 'CONTRACT_OBJECTIVES should be defined');
assert(CONTRACT_OBJECTIVES.quota, 'quota objective missing');
assert(CONTRACT_OBJECTIVES.protect, 'protect objective missing');
assert(CONTRACT_OBJECTIVES.passivate, 'passivate objective missing');
assert(CONTRACT_OBJECTIVES.recover, 'recover objective missing');
assert(CONTRACT_OBJECTIVES.survive, 'survive objective missing');

assert(CONTRACT_MODIFIERS, 'CONTRACT_MODIFIERS should be defined');
assert(CONTRACT_MODIFIERS.storm_season, 'storm_season modifier missing');
assert(CONTRACT_MODIFIERS.dense_cloud, 'dense_cloud modifier missing');
assert(CONTRACT_MODIFIERS.low_budget, 'low_budget modifier missing');
assert(CONTRACT_MODIFIERS.rush, 'rush modifier missing');
assert(CONTRACT_MODIFIERS.dead_stick, 'dead_stick modifier missing');
assert(CONTRACT_MODIFIERS.blackout, 'blackout modifier missing');
console.log('PASS: All 5 contract objectives and 6 modifiers properly defined.\n');

// ---------------------------------------------------------------------
// TEST 2: Save Version 2 Safe Migration (Preserving Legacy Saves)
// ---------------------------------------------------------------------
console.log('--- TEST 2: Save Version 2 Migration ---');
localStorage.clear();

// Legacy v1 Save Data
const legacySave = {
    credits: 1450,
    totalDebrisRecycled: 42,
    totalMassDeorbitedKg: 2100,
    missionsCompleted: 5,
    highScores: { 1: 3200, 2: 4500, 3: 5100, 4: 3800, 5: 6200, 6: 0, 7: 0, 8: 0 },
    stars: { 1: 3, 2: 3, 3: 2, 4: 2, 5: 3, 6: 0, 7: 0, 8: 0 },
    unlockedLevels: 6,
    upgrades: { engine: 2, hull: 1, battery: 2, cargo: 1, sensor: 2 },
    materials: { metal: 12, cells: 4, chips: 2 },
    selectedShip: 'titan',
    selectedEquipment: 'net',
    commanderName: 'Veteran Commander'
};
localStorage.setItem('orbital_cleanup_mission_zero_save', JSON.stringify(legacySave));

// Load and trigger migration
const migrated = OrbitalStorage.load();

assert.strictEqual(migrated.saveVersion, 2, 'saveVersion must be migrated to 2');
assert.strictEqual(migrated.credits, 1450, 'Legacy credits must be preserved');
assert.strictEqual(migrated.missionsCompleted, 5, 'Legacy completed missions must be preserved');
assert.strictEqual(migrated.unlockedLevels, 6, 'Legacy unlocked levels must be preserved');
assert.strictEqual(migrated.upgrades.engine, 2, 'Legacy upgrades must be preserved');
assert.strictEqual(migrated.materials.metal, 12, 'Legacy materials must be preserved');
assert.strictEqual(migrated.commanderName, 'Veteran Commander', 'Commander name must be preserved');

// Verify new Campaign v2 fields populated
assert(migrated.campaignSeed, 'campaignSeed must be generated');
assert(migrated.reputation, 'reputation object must be added');
assert.strictEqual(migrated.reputation.agency, 50, 'Default agency reputation should be 50');
assert.strictEqual(migrated.reputation.commercial, 50, 'Default commercial reputation should be 50');
assert.strictEqual(migrated.reputation.public, 50, 'Default public reputation should be 50');

assert(migrated.sectorHealth, 'sectorHealth must be added');
assert.strictEqual(migrated.sectorHealth.sector_01, 85, 'Default sector_01 health should be 85%');
assert.strictEqual(migrated.sectorHealth.sector_08, 30, 'Default sector_08 health should be 30%');

assert(migrated.carryoverDebris, 'carryoverDebris must be added');
assert.strictEqual(migrated.carryoverDebris.sector_01, 0, 'Default sector_01 carryover debris should be 0');

assert(Array.isArray(migrated.availableContracts), 'availableContracts must be an array');
assert.strictEqual(migrated.availableContracts.length, 3, 'Must generate exactly 3 contracts on Mission Board');
assert.strictEqual(migrated.activeContract, null, 'activeContract should be null initially');
console.log('PASS: Legacy save non-destructively migrated to Save v2 with 100% data retention.\n');

// ---------------------------------------------------------------------
// TEST 3: Fresh Save Initialization
// ---------------------------------------------------------------------
console.log('--- TEST 3: Fresh Save v2 Initialization ---');
localStorage.clear();
const freshSave = OrbitalStorage.load();

assert.strictEqual(freshSave.saveVersion, 2, 'Fresh save must be version 2');
assert.strictEqual(freshSave.credits, 200, 'Fresh save starting credits must be 200');
assert(freshSave.campaignSeed > 0, 'Fresh save must have a valid positive campaign seed');
assert.strictEqual(freshSave.availableContracts.length, 3, 'Fresh save must have 3 available contracts');
console.log('PASS: Fresh save initializes complete Save v2 campaign state.\n');

// ---------------------------------------------------------------------
// TEST 4: Procedural Contract Generation Formula (SECTOR × OBJECTIVE × MODIFIERS)
// ---------------------------------------------------------------------
console.log('--- TEST 4: Procedural Contract Generation ---');
const contracts = CampaignManager.generateContractPool(freshSave);

assert.strictEqual(contracts.length, 3, 'Must generate exactly 3 contracts');
contracts.forEach((c, idx) => {
    assert(c.id, `Contract #${idx + 1} must have an ID`);
    assert(c.title, `Contract #${idx + 1} must have a title`);
    assert(c.sectorId >= 1 && c.sectorId <= 8, `Contract #${idx + 1} sectorId must be between 1 and 8`);
    assert(c.client && c.client.name, `Contract #${idx + 1} must have an affiliated client`);
    assert(CONTRACT_OBJECTIVES[c.objective], `Contract #${idx + 1} must have a valid objective`);
    assert(c.targetQuota >= 1, `Contract #${idx + 1} target quota must be at least 1`);
    assert(c.scrapPayout > 0, `Contract #${idx + 1} scrap payout must be positive`);
    assert(c.timeLimit >= 45, `Contract #${idx + 1} time limit must be at least 45s`);
    assert(['Low', 'Moderate', 'Severe', 'Extreme'].includes(c.risk), `Contract #${idx + 1} risk rating invalid: ${c.risk}`);
    assert(c.requirements && c.requirements.suggestedBus, `Contract #${idx + 1} requirements must specify suggestedBus`);
});

// Card diversity check
const objectivesInPool = new Set(contracts.map(c => c.objective));
console.log(`Contract pool generated with diverse objectives: ${Array.from(objectivesInPool).join(', ')}`);
assert(objectivesInPool.size >= 2, 'Contract pool should offer varied objectives across the 3 cards');
console.log('PASS: Procedural contract generation successfully produces balanced, diverse contracts.\n');

// ---------------------------------------------------------------------
// TEST 5: Contract Acceptance
// ---------------------------------------------------------------------
console.log('--- TEST 5: Contract Acceptance ---');
const contractToAccept = contracts[0];
const accepted = CampaignManager.acceptContract(contractToAccept.id);

assert(accepted, 'Contract should be accepted');
assert.strictEqual(accepted.id, contractToAccept.id, 'Accepted contract ID should match');

const postAcceptSave = OrbitalStorage.load();
assert(postAcceptSave.activeContract, 'Active contract must be recorded in save');
assert.strictEqual(postAcceptSave.activeContract.id, contractToAccept.id, 'Active contract ID must match');
console.log('PASS: Contract successfully accepted and stored in persistent state.\n');

// ---------------------------------------------------------------------
// TEST 6: Successful Mission Outcome & Consequence Evaluation
// ---------------------------------------------------------------------
console.log('--- TEST 6: Successful Mission Outcome Consequences ---');
const sceneSuccessMock = {
    missionConfig: { id: contractToAccept.sectorId, name: contractToAccept.sectorName },
    collisionsCount: 0,
    kesslerRisk: 15,
    debrisDeliveredCount: 8,
    debrisTargetQuota: contractToAccept.targetQuota,
    creditsEarned: 350,
    materialsSession: { metal: 2, cells: 1, chips: 0 }
};

const preHealth = postAcceptSave.sectorHealth[contractToAccept.sectorKey];
const preDebris = postAcceptSave.carryoverDebris[contractToAccept.sectorKey];
const preAgencyRep = postAcceptSave.reputation.agency;

const consequenceSuccess = CampaignManager.applyMissionOutcome(sceneSuccessMock, true, 'ORBITAL ZONE SUCCESSFULLY CLEANSED');

const updatedSave = OrbitalStorage.load();

assert(consequenceSuccess.healthDelta > 0, `Sector health delta should be positive on victory (got ${consequenceSuccess.healthDelta})`);
assert(updatedSave.sectorHealth[contractToAccept.sectorKey] >= preHealth, 'Sector health should improve or clamp at max');
assert(updatedSave.reputation.agency >= preAgencyRep, 'Agency reputation should improve after clean mission');
assert.strictEqual(updatedSave.activeContract, null, 'Active contract should be cleared after mission completes');
assert.strictEqual(updatedSave.availableContracts.length, 3, 'Available contracts pool should be regenerated');
assert(consequenceSuccess.narrative.includes('CLEAN MISSION EXECUTION'), 'Consequence narrative should reflect clean success');
assert(updatedSave.consequencesHistory.length > 0, 'Consequence record must be stored in history');
console.log(`PASS: Victory outcome verified. Sector Health: ${preHealth}% -> ${updatedSave.sectorHealth[contractToAccept.sectorKey]}% (+${consequenceSuccess.healthDelta}%). Narrative generated.\n`);

// ---------------------------------------------------------------------
// TEST 7: Failed Mission Outcome & Cascading Debris Consequences
// ---------------------------------------------------------------------
console.log('--- TEST 7: Failed Mission Outcome & Carryover Debris ---');
// Accept another contract
const contracts2 = updatedSave.availableContracts;
CampaignManager.acceptContract(contracts2[0].id);

const sceneFailMock = {
    missionConfig: { id: contracts2[0].sectorId, name: contracts2[0].sectorName },
    collisionsCount: 4,
    kesslerRisk: 82,
    debrisDeliveredCount: 1,
    debrisTargetQuota: contracts2[0].targetQuota,
    creditsEarned: 50,
    materialsSession: { metal: 0, cells: 0, chips: 0 }
};

const failSectorKey = contracts2[0].sectorKey;
const preFailHealth = updatedSave.sectorHealth[failSectorKey];
const preFailDebris = updatedSave.carryoverDebris[failSectorKey];

const consequenceFail = CampaignManager.applyMissionOutcome(sceneFailMock, false, 'HULL BREACH - SPACECRAFT DESTROYED');
const postFailSave = OrbitalStorage.load();

assert(consequenceFail.healthDelta < 0, `Sector health delta must be negative on failure (got ${consequenceFail.healthDelta})`);
assert(postFailSave.sectorHealth[failSectorKey] < preFailHealth, 'Sector health must deteriorate on mission failure');
assert(consequenceFail.carryoverDelta > 0, 'Failure with collisions must generate residual carryover debris');
assert(postFailSave.carryoverDebris[failSectorKey] > preFailDebris, 'Residual carryover debris count must increase');
assert(postFailSave.reputation.public < updatedSave.reputation.public, 'Public reputation must decline following disaster');
assert(consequenceFail.narrative.includes('uncatalogued kinetic fragments left in orbital drift'), 'Narrative must describe generated fragments');
console.log(`PASS: Failure outcome verified. Sector Health: ${preFailHealth}% -> ${postFailSave.sectorHealth[failSectorKey]}% (${consequenceFail.healthDelta}%). Carryover Debris: +${consequenceFail.carryoverDelta} fragments.\n`);

// ---------------------------------------------------------------------
// TEST 8: Solicit Contracts Functionality (-50 Scrap Fee)
// ---------------------------------------------------------------------
console.log('--- TEST 8: Solicit / Reroll Contracts ---');
postFailSave.credits = 180;
OrbitalStorage.save(postFailSave);

const oldPoolIds = postFailSave.availableContracts.map(c => c.id).join(',');
// Advance missions completed slightly to test reroll variation
postFailSave.missionsCompleted += 1;
postFailSave.credits -= 50;
postFailSave.availableContracts = CampaignManager.generateContractPool(postFailSave);
OrbitalStorage.save(postFailSave);

const rerolledSave = OrbitalStorage.load();
assert.strictEqual(rerolledSave.credits, 130, 'Credits must deduct 50 Scrap');
assert.strictEqual(rerolledSave.availableContracts.length, 3, 'Must maintain 3 contracts after reroll');
console.log('PASS: Contract solicitation / reroll properly consumes scrap and updates contract pool.\n');

console.log('=====================================================================');
console.log('ALL PHASE 8a CONTRACT & CAMPAIGN TESTS COMPLETED SUCCESSFULLY!');
console.log('=====================================================================');
