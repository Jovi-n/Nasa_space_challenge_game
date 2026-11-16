/**
 * ORBITAL CLEANUP: MISSION ZERO - CAMPAIGN & CONTRACTS ENGINE (PHASE 8a)
 * Procedural contract generation: SECTOR × OBJECTIVE × MODIFIERS
 * Objectives: Quota, Protect, Passivate, Recover, Survive
 * Modifiers: Storm Season, Dense Cloud, Low Budget, Rush, Dead Stick, Blackout
 * Persistent campaign state, reputation, sector health, carryover debris, and consequences.
 */

const CONTRACT_OBJECTIVES = {
    quota: {
        id: 'quota',
        name: 'Orbital Quota',
        badge: 'QUOTA',
        icon: '🎯',
        desc: 'Retrieve and recycle/strip specified mass of kinetic orbital debris to clear shipping lane.',
        targetScale: 1.0,
        scoreMod: 1.0,
        scrapMod: 1.0,
        riskBase: 'Low'
    },
    protect: {
        id: 'protect',
        name: 'Asset Protection',
        badge: 'PROTECT',
        icon: '🛡️',
        desc: 'Shield active high-value constellation satellites from intersecting debris tracks.',
        targetScale: 0.8,
        scoreMod: 1.25,
        scrapMod: 1.20,
        riskBase: 'Moderate'
    },
    passivate: {
        id: 'passivate',
        name: 'Stage Passivation',
        badge: 'PASSIVATE',
        icon: '⚡',
        desc: 'Safely neutralize pressurized upper-stage venting rockets via kinetic nudges [Q] before detonation.',
        targetScale: 0.7,
        scoreMod: 1.35,
        scrapMod: 1.30,
        riskBase: 'Severe'
    },
    recover: {
        id: 'recover',
        name: 'Core Recovery',
        badge: 'RECOVER',
        icon: '📦',
        desc: 'Locate, secure, and deliver an intact high-value priority instrument core back to Aegis Depot.',
        targetScale: 0.6,
        scoreMod: 1.40,
        scrapMod: 1.35,
        riskBase: 'Moderate'
    },
    survive: {
        id: 'survive',
        name: 'Cascade Survival',
        badge: 'SURVIVE',
        icon: '⏳',
        desc: 'Survive extreme hypervelocity debris bombardment until emergency orbital extraction window.',
        targetScale: 0.9,
        scoreMod: 1.50,
        scrapMod: 1.40,
        riskBase: 'Extreme'
    }
};

const CONTRACT_MODIFIERS = {
    storm_season: {
        id: 'storm_season',
        name: 'Storm Season',
        badge: 'STORM SEASON',
        icon: '⚡',
        desc: 'Intense space-weather storms. Frequent geomagnetic disturbances & solar radiation flux.',
        riskWeight: 1.5,
        payoutMod: 1.25,
        effect: 'heavy_weather'
    },
    dense_cloud: {
        id: 'dense_cloud',
        name: 'Dense Cloud',
        badge: 'DENSE CLOUD',
        icon: '☁️',
        desc: '+50% initial & respawn debris density. Elevated fragmentation cascade multiplier.',
        riskWeight: 1.6,
        payoutMod: 1.30,
        effect: 'dense_debris'
    },
    low_budget: {
        id: 'low_budget',
        name: 'Low Budget',
        badge: 'LOW BUDGET',
        icon: '🪙',
        desc: 'Depleted startup margins. -35% initial propellant and battery reserve margin.',
        riskWeight: 1.3,
        payoutMod: 1.35,
        effect: 'low_reserves'
    },
    rush: {
        id: 'rush',
        name: 'Rush Order',
        badge: 'RUSH',
        icon: '⏱️',
        desc: 'Accelerated de-orbit window (-30% mission time limit). +50% scrap bounty.',
        riskWeight: 1.4,
        payoutMod: 1.50,
        effect: 'short_timer'
    },
    dead_stick: {
        id: 'dead_stick',
        name: 'Dead Stick',
        badge: 'DEAD STICK',
        icon: '🕹️',
        desc: 'High thruster consumption (+35% burn rate) and sluggish reaction wheel damping.',
        riskWeight: 1.4,
        payoutMod: 1.30,
        effect: 'heavy_inertia'
    },
    blackout: {
        id: 'blackout',
        name: 'Sensor Blackout',
        badge: 'BLACKOUT',
        icon: '📡',
        desc: '-50% solar recharge rate and -30% sensor radar collision warning radius.',
        riskWeight: 1.5,
        payoutMod: 1.40,
        effect: 'sensor_blind'
    }
};

const CONTRACT_CLIENTS = [
    {
        id: 'esa_clean_space',
        name: 'ESA Clean Space Office',
        icon: '🇪🇺',
        preference: 'quota',
        repKey: 'agency',
        briefTemplate: 'ESA orbital monitoring tracks dense debris clustering threatening navigation corridors.'
    },
    {
        id: 'nasa_odpo',
        name: 'NASA ODPO',
        icon: '🇺🇸',
        preference: 'passivate',
        repKey: 'agency',
        briefTemplate: 'NASA Orbital Debris Program Office requires kinetic neutralization of explosive rocket bodies.'
    },
    {
        id: 'aerosat_commercial',
        name: 'AeroSat Global Telecom',
        icon: '🛰️',
        preference: 'protect',
        repKey: 'commercial',
        briefTemplate: 'Commercial mega-constellation operations require immediate perimeter shielding and escort.'
    },
    {
        id: 'un_oosa',
        name: 'UN-OOSA Space Watch',
        icon: '🌐',
        preference: 'survive',
        repKey: 'public',
        briefTemplate: 'International civil space safety committee mandates emergency containment of critical cascade cloud.'
    }
];

class CampaignManager {
    /**
     * Generate 3 diverse contracts based on campaign state, sector health, and seed
     */
    static generateContractPool(saveData) {
        const seed = saveData.campaignSeed || Math.floor(Math.random() * 900000) + 100000;
        const missions = (typeof MISSIONS_DATA !== 'undefined' && Array.isArray(MISSIONS_DATA) && MISSIONS_DATA.length > 0)
            ? MISSIONS_DATA
            : ((typeof GAME_DATA !== 'undefined' && Array.isArray(GAME_DATA.LEVELS)) ? GAME_DATA.LEVELS : []);
        if (missions.length === 0) return [];

        const contracts = [];
        const objectiveKeys = Object.keys(CONTRACT_OBJECTIVES);
        const modifierKeys = Object.keys(CONTRACT_MODIFIERS);
        const unlockedCount = saveData.unlockedLevels || 1;

        // Deterministic pseudo-random helper from seed
        const pseudoRand = (offset) => {
            const x = Math.sin(seed + offset) * 10000;
            return x - Math.floor(x);
        };

        const rerollCount = saveData.contractRerolls || 0;

        for (let i = 0; i < 3; i++) {
            const pr1 = pseudoRand(i * 17.3 + (saveData.missionsCompleted || 0) * 5.1 + rerollCount * 29.3);
            const pr2 = pseudoRand(i * 31.7 + (saveData.missionsCompleted || 0) * 7.3 + rerollCount * 41.9);
            const pr3 = pseudoRand(i * 47.9 + (saveData.missionsCompleted || 0) * 11.5 + rerollCount * 53.7);
            const pr4 = pseudoRand(i * 61.1 + (saveData.missionsCompleted || 0) * 13.9 + rerollCount * 67.1);

            // Select Sector (biased towards unlocked sectors or damaged sectors)
            const sectorIdx = Math.floor(pr1 * Math.min(missions.length, Math.max(2, unlockedCount + 1))) % missions.length;
            const sector = missions[sectorIdx];
            const sectorKey = `sector_0${sector.id}`;
            const sHealth = (saveData.sectorHealth && saveData.sectorHealth[sectorKey] !== undefined)
                ? saveData.sectorHealth[sectorKey]
                : 70;

            // Select Objective (diverse for each card)
            let objKey;
            if (i === 0) objKey = 'quota'; // Card 1: Familiar quota
            else if (i === 1) objKey = (pr2 > 0.5) ? 'passivate' : 'protect'; // Card 2: Tactical challenge
            else objKey = (pr2 > 0.5) ? 'recover' : 'survive'; // Card 3: High-stakes / survival

            const obj = CONTRACT_OBJECTIVES[objKey];

            // Select 0 to 2 Modifiers
            const selectedMods = [];
            if (i > 0 || pr3 > 0.45 || sHealth < 50) {
                // Damaged sectors or higher cards get modifiers
                const modIdx1 = Math.floor(pr3 * modifierKeys.length);
                selectedMods.push(modifierKeys[modIdx1]);

                // 2nd modifier if sector health is critical (<40%) or card 3
                if ((sHealth < 40 || i === 2) && pr4 > 0.4) {
                    const modIdx2 = (modIdx1 + 1 + Math.floor(pr4 * (modifierKeys.length - 1))) % modifierKeys.length;
                    selectedMods.push(modifierKeys[modIdx2]);
                }
            }

            // Client Selection
            const client = CONTRACT_CLIENTS[(i + Math.floor(pr2 * 3)) % CONTRACT_CLIENTS.length];

            // Payouts & Budgets
            let scrapPayout = Math.round((sector.basePayout || 500) * obj.scrapMod);
            let scoreBounty = Math.round((sector.targetQuota * 120) * obj.scoreMod);
            let budgetAdvance = Math.round(scrapPayout * 0.35);

            selectedMods.forEach(mKey => {
                const m = CONTRACT_MODIFIERS[mKey];
                if (m) {
                    scrapPayout = Math.round(scrapPayout * m.payoutMod);
                    scoreBounty = Math.round(scoreBounty * (m.payoutMod * 0.9));
                    budgetAdvance = Math.round(budgetAdvance * (mKey === 'low_budget' ? 0.65 : 1.15));
                }
            });

            // Target quota adjusted for objective
            let targetQuota = Math.max(3, Math.round(sector.targetQuota * obj.targetScale));
            if (objKey === 'recover') targetQuota = 1; // 1 Core to recover
            if (objKey === 'passivate') targetQuota = Math.min(4, Math.max(2, Math.round(sector.maxHazards || 2)));

            // Time limit adjusted for rush
            let timeLimit = sector.timeLimit || 150;
            if (selectedMods.includes('rush')) {
                timeLimit = Math.max(65, Math.round(timeLimit * 0.70));
            }

            // Calculate Risk Rating
            let riskScore = 1;
            if (sector.id >= 4) riskScore += 1;
            if (sector.id >= 7) riskScore += 1;
            if (objKey === 'passivate' || objKey === 'survive') riskScore += 1;
            riskScore += selectedMods.length;
            if (sHealth < 50) riskScore += 1;

            const riskLabel = riskScore <= 1 ? 'Low' : (riskScore <= 3 ? 'Moderate' : (riskScore <= 4 ? 'Severe' : 'Extreme'));

            // Material bounties
            const materials = {
                metal: Math.max(1, Math.round(sector.id * 0.6)),
                cells: sector.id >= 3 ? Math.round(sector.id * 0.4) : 0,
                chips: sector.id >= 5 ? 1 : 0
            };

            // Requirements dossier
            const reqs = {
                minReputation: {
                    agency: sector.id > 3 ? (sector.id * 6) : 0,
                    commercial: sector.id > 4 ? (sector.id * 5) : 0
                },
                suggestedBus: sector.id <= 3 ? 'scout' : (sector.id <= 6 ? 'collector' : 'lifter')
            };

            const contract = {
                id: `CTR-${saveData.campaignSeed % 1000}-${sector.id}-${objKey}-${i + 1}${rerollCount > 0 ? ('-R' + rerollCount) : ''}`,
                title: `${sector.name.split(':')[1]?.trim() || sector.name} // ${obj.name.toUpperCase()}`,
                sectorId: sector.id,
                sectorKey: sectorKey,
                sectorName: sector.name,
                sectorHealth: sHealth,
                client: client,
                objective: objKey,
                objectiveData: obj,
                targetQuota: targetQuota,
                modifiers: selectedMods,
                modifierData: selectedMods.map(k => CONTRACT_MODIFIERS[k]),
                budgetAdvance: budgetAdvance,
                scrapPayout: scrapPayout,
                scoreBounty: scoreBounty,
                materialsReward: materials,
                timeLimit: timeLimit,
                risk: riskLabel,
                requirements: reqs,
                description: `${client.briefTemplate} Cleanse orbital hazard cluster in ${sector.name}. ${selectedMods.length > 0 ? 'Hazard advisory: Active operational modifiers in effect.' : 'Standard operational window.'}`
            };

            contracts.push(contract);
        }

        return contracts;
    }

    /**
     * Accept a contract from the mission board
     */
    static acceptContract(contractId) {
        const save = OrbitalStorage.load();
        if (!save.availableContracts) return null;
        const found = save.availableContracts.find(c => c.id === contractId);
        if (!found) return null;

        save.activeContract = found;
        OrbitalStorage.save(save);
        return found;
    }

    /**
     * Evaluate mission outcome, apply consequences to sector health, reputation & carryover debris
     */
    static applyMissionOutcome(scene, victory, reason) {
        const save = OrbitalStorage.load();
        const contract = save.activeContract || null;
        const sectorKey = scene.missionConfig?.id ? `sector_0${scene.missionConfig.id}` : (contract ? contract.sectorKey : 'sector_01');

        if (!save.sectorHealth) save.sectorHealth = {};
        if (save.sectorHealth[sectorKey] === undefined) save.sectorHealth[sectorKey] = 70;
        if (!save.carryoverDebris) save.carryoverDebris = {};
        if (save.carryoverDebris[sectorKey] === undefined) save.carryoverDebris[sectorKey] = 0;
        if (!save.reputation) save.reputation = { agency: 50, commercial: 50, public: 50 };

        const oldHealth = save.sectorHealth[sectorKey];
        const oldDebris = save.carryoverDebris[sectorKey];
        const oldRep = Object.assign({}, save.reputation);

        let healthDelta = 0;
        let carryoverDelta = 0;
        let repAgencyDelta = 0;
        let repCommercialDelta = 0;
        let repPublicDelta = 0;
        let narrative = '';

        const collisions = scene.collisionsCount || 0;
        const kRisk = scene.kesslerRisk || 0;
        const delivered = scene.debrisDeliveredCount || 0;
        const stripped = scene.materialsSession ? (scene.materialsSession.metal + scene.materialsSession.cells + scene.materialsSession.chips) : 0;

        if (victory) {
            // SUCCESSFUL MISSION
            healthDelta = Math.min(25, Math.round(12 + (delivered * 1.5) - (collisions * 2)));
            carryoverDelta = -Math.min(oldDebris, Math.round(delivered * 0.8));

            repAgencyDelta = Math.round(6 + (delivered >= (scene.debrisTargetQuota || 6) ? 2 : 0) - (collisions > 2 ? 2 : 0));
            repCommercialDelta = Math.round(5 + (stripped > 0 ? 3 : 0));
            repPublicDelta = Math.round(7 - (kRisk > 40 ? 3 : 0));

            // Budget / Payout awarded (avoid double-crediting if scene already saved credits)
            if (!scene.creditsAlreadyAwarded) {
                const payout = contract ? contract.scrapPayout : (scene.creditsEarned || 200);
                save.credits = (save.credits || 0) + payout;
            }

            if (contract && contract.materialsReward) {
                save.materials.metal = (save.materials.metal || 0) + (contract.materialsReward.metal || 0);
                save.materials.cells = (save.materials.cells || 0) + (contract.materialsReward.cells || 0);
                save.materials.chips = (save.materials.chips || 0) + (contract.materialsReward.chips || 0);
            }

            narrative = `CLEAN MISSION EXECUTION in ${scene.missionConfig?.name || 'Sector'}. High-efficiency clearance restored orbital flight safety. ` +
                (collisions === 0 ? 'Zero collisions reported; commercial insurers have reduced future contract risk premiums.' : `Contained ${collisions} minor contact bumps without triggering kinetic cascades.`);
        } else {
            // FAILED MISSION / CASCADING DAMAGE
            healthDelta = -Math.min(30, Math.round(15 + (collisions * 2.5) + (kRisk * 0.15)));
            const newFragments = Math.min(10, Math.max(3, Math.round(collisions * 1.5 + 2)));
            carryoverDelta = newFragments;

            repAgencyDelta = -Math.round(7 + (kRisk > 75 ? 5 : 0));
            repCommercialDelta = -Math.round(6 + (collisions > 3 ? 4 : 0));
            repPublicDelta = -Math.round(10 + (kRisk > 80 ? 6 : 0));

            narrative = `MISSION ABORT / FAILURE: ${reason}. ` +
                `Hypervelocity impact trauma generated ${newFragments} uncatalogued kinetic fragments left in orbital drift. ` +
                `Future contracts in ${scene.missionConfig?.name || 'this sector'} will now experience Dense Cloud debris concentrations.`;
        }

        // Apply Clamped Changes
        save.sectorHealth[sectorKey] = Math.max(10, Math.min(100, oldHealth + healthDelta));
        save.carryoverDebris[sectorKey] = Math.max(0, Math.min(24, oldDebris + carryoverDelta));
        save.reputation.agency = Math.max(0, Math.min(100, oldRep.agency + repAgencyDelta));
        save.reputation.commercial = Math.max(0, Math.min(100, oldRep.commercial + repCommercialDelta));
        save.reputation.public = Math.max(0, Math.min(100, oldRep.public + repPublicDelta));

        // Campaign consequence record
        const consequenceRecord = {
            timestamp: new Date().toISOString(),
            missionName: scene.missionConfig?.name || 'Mission',
            sectorKey: sectorKey,
            victory: victory,
            reason: reason,
            oldHealth: oldHealth,
            newHealth: save.sectorHealth[sectorKey],
            healthDelta: healthDelta,
            oldDebris: oldDebris,
            newDebris: save.carryoverDebris[sectorKey],
            carryoverDelta: carryoverDelta,
            repShifts: {
                agency: repAgencyDelta,
                commercial: repCommercialDelta,
                public: repPublicDelta
            },
            narrative: narrative
        };

        if (!save.consequencesHistory) save.consequencesHistory = [];
        save.consequencesHistory.unshift(consequenceRecord);
        if (save.consequencesHistory.length > 20) save.consequencesHistory.pop();

        // Check for new storylets triggered by this mission outcome or sector health changes
        if (typeof StoryletManager !== 'undefined' && typeof StoryletManager.onMissionCompleted === 'function') {
            const nextStorylet = StoryletManager.onMissionCompleted(save, scene, victory);
            if (nextStorylet) {
                consequenceRecord.triggeredStorylet = {
                    id: nextStorylet.id,
                    title: nextStorylet.title,
                    tag: nextStorylet.tag
                };
            }
        }

        // Clear active contract and refresh Mission Board
        save.activeContract = null;
        save.availableContracts = CampaignManager.generateContractPool(save);

        OrbitalStorage.save(save);
        return consequenceRecord;
    }
}

// Global binding
if (typeof window !== 'undefined') {
    window.CONTRACT_OBJECTIVES = CONTRACT_OBJECTIVES;
    window.CONTRACT_MODIFIERS = CONTRACT_MODIFIERS;
    window.CONTRACT_CLIENTS = CONTRACT_CLIENTS;
    window.CampaignManager = CampaignManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONTRACT_OBJECTIVES,
        CONTRACT_MODIFIERS,
        CONTRACT_CLIENTS,
        CampaignManager
    };
}
