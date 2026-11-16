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

// =============================================================================
// PHASE 8c: TECHNOLOGY PROGRESSION PATHS (6 PATHS × 3 TIERS)
// =============================================================================
const TECH_PATHS = {
    capture: {
        id: 'capture',
        name: 'Debris Capture Systems',
        icon: '🧲',
        desc: 'Electromagnetic flux, intake collection funnel, and containment nets.',
        tiers: [
            {
                tier: 1,
                name: 'Magnetic Intake Grate',
                desc: 'Standard electromagnetic funnel for kinetic debris retrieval.',
                cost: { credits: 0, metal: 0, cells: 0, chips: 0 },
                bonuses: 'Standard tractor & net collection capacity'
            },
            {
                tier: 2,
                name: 'Wide-Aperture Magnetic Funnel',
                desc: 'Expanded copper-niobium coils project a broader tractor cone.',
                cost: { credits: 450, metal: 4, cells: 1, chips: 0 },
                bonuses: '+25% Tractor beam pull speed & +20% intake range'
            },
            {
                tier: 3,
                name: 'Kinetic Harpoon & Nanotube Net',
                desc: 'Micro-filament carbon nanotube netting and hypervelocity magnetic grapple.',
                cost: { credits: 950, metal: 8, cells: 3, chips: 2 },
                bonuses: '+50% Tractor range, +1 Net capacity, tractor grounds electrostatic debris'
            }
        ]
    },
    sensors: {
        id: 'sensors',
        name: 'Sensor Avionics & Radar',
        icon: '📡',
        desc: 'Space surveillance radar, collision warning distance, and stealth detection.',
        tiers: [
            {
                tier: 1,
                name: 'Optical Proximity Camera',
                desc: 'Standard visual guidance sensor with standard collision warning envelope.',
                cost: { credits: 0, metal: 0, cells: 0, chips: 0 },
                bonuses: 'Standard radar ping range'
            },
            {
                tier: 2,
                name: 'Doppler Collision Radar',
                desc: 'High-frequency phased-array radar calculates relative closing velocities.',
                cost: { credits: 400, metal: 2, cells: 0, chips: 2 },
                bonuses: '+30% Radar warning distance & directional hazard arrows'
            },
            {
                tier: 3,
                name: 'Multi-Spectral Lidar Array',
                desc: 'Multi-frequency lidar unmasks low-observability debris and penetrates storm noise.',
                cost: { credits: 850, metal: 3, cells: 2, chips: 4 },
                bonuses: 'Reveals stealth hazards instantly, -50% space storm radar distortion'
            }
        ]
    },
    power: {
        id: 'power',
        name: 'Power Architecture & Storage',
        icon: '🔋',
        desc: 'Photovoltaic cells, battery energy density, and surge protection.',
        tiers: [
            {
                tier: 1,
                name: 'Monocrystalline Solar Bus',
                desc: 'Standard silicon solar arrays with 100 Wh energy storage.',
                cost: { credits: 0, metal: 0, cells: 0, chips: 0 },
                bonuses: 'Standard 100 Battery capacity & solar recharge'
            },
            {
                tier: 2,
                name: 'Graphene Supercapacitor Cells',
                desc: 'Lightweight graphene-doped battery cells provide rapid charge uptake.',
                cost: { credits: 350, metal: 1, cells: 3, chips: 1 },
                bonuses: '+30 Max Battery, +25% Solar recharge rate'
            },
            {
                tier: 3,
                name: 'Solid-State Quantum Capacitors',
                desc: 'High-density dielectric storage immune to deep-space thermal freezing.',
                cost: { credits: 800, metal: 3, cells: 6, chips: 3 },
                bonuses: '+60 Max Battery, -40% Energy drain from nuclear hazards & EMP surges'
            }
        ]
    },
    shielding: {
        id: 'shielding',
        name: 'Whipple Shielding & Armor',
        icon: '🛡️',
        desc: 'Structural bumper plating, kinetic impact damping, and EMP grounding.',
        tiers: [
            {
                tier: 1,
                name: 'Single-Layer Aluminum Bumper',
                desc: 'Basic spacecraft skin capable of absorbing low-velocity particle impacts.',
                cost: { credits: 0, metal: 0, cells: 0, chips: 0 },
                bonuses: 'Baseline 100 Hull points'
            },
            {
                tier: 2,
                name: 'Dual-Layer Stuffed Whipple Shield',
                desc: 'Nextel and Kevlar ceramic weave disrupts hypervelocity projectiles into clouds.',
                cost: { credits: 500, metal: 5, cells: 1, chips: 0 },
                bonuses: '+25 Max Hull, -20% Kinetic collision impact damage'
            },
            {
                tier: 3,
                name: 'Faraday Deflector Armor',
                desc: 'Conductive outer hull grounding mesh dissipates plasma lightning and EMP surges.',
                cost: { credits: 1100, metal: 9, cells: 4, chips: 2 },
                bonuses: '+50 Max Hull, -40% Collision damage, -60% Coronal EMP surge damage'
            }
        ]
    },
    communications: {
        id: 'communications',
        name: 'Telemetry & Ground Comms',
        icon: '🌐',
        desc: 'Data uplink, commercial network contracts, and space agency diplomacy.',
        tiers: [
            {
                tier: 1,
                name: 'Omnidirectional VHF Antenna',
                desc: 'Direct-to-ground telemetry tracking link.',
                cost: { credits: 0, metal: 0, cells: 0, chips: 0 },
                bonuses: 'Standard contract payouts and solicit rates'
            },
            {
                tier: 2,
                name: 'Deep Space Relay Interlink',
                desc: 'Connects directly through TDRSS satellites for uninterrupted orbital telemetry.',
                cost: { credits: 350, metal: 1, cells: 1, chips: 2 },
                bonuses: '+15% Scrap contract payout, -50% Contract solicitation reroll cost'
            },
            {
                tier: 3,
                name: 'Quantum Encrypted Ground Uplink',
                desc: 'Zero-latency orbital cryptographic pipeline across global space operations.',
                cost: { credits: 850, metal: 2, cells: 3, chips: 5 },
                bonuses: '+25% Faction reputation gains on contract victories, unlocks classified bounties'
            }
        ]
    },
    propulsion: {
        id: 'propulsion',
        name: 'Reaction Control & Propulsion',
        icon: '🚀',
        desc: 'Thruster specific impulse, angular moment control, and fuel consumption.',
        tiers: [
            {
                tier: 1,
                name: 'Hydrazine Reaction Thrusters',
                desc: 'Standard bipropellant thruster quads for 3-axis orbital maneuvering.',
                cost: { credits: 0, metal: 0, cells: 0, chips: 0 },
                bonuses: 'Standard 100 Fuel capacity & burn rate'
            },
            {
                tier: 2,
                name: 'Pulsed Plasma Micro-Thrusters',
                desc: 'High-precision magnetic plasma nozzles improve angular reaction torque.',
                cost: { credits: 450, metal: 3, cells: 2, chips: 1 },
                bonuses: '+20% Angular turn rate, -15% Main thruster fuel burn rate'
            },
            {
                tier: 3,
                name: 'Hall Effect Xenon Ion Engine',
                desc: 'High-specific-impulse electric propulsion drive with auxiliary RCS clusters.',
                cost: { credits: 1050, metal: 6, cells: 5, chips: 3 },
                bonuses: '+30 Max Fuel, +25% Ship acceleration & top speed, -30% Fuel burn'
            }
        ]
    }
};

// =============================================================================
// PHASE 8c: FOUR DISTINCT CAMPAIGN ENDINGS
// =============================================================================
const CAMPAIGN_ENDINGS = {
    kessler_collapse: {
        id: 'kessler_collapse',
        title: 'THE KESSLER CASCADE CATASTROPHE',
        subtitle: 'TRAGIC COLLAPSE // ORBITAL COLLAPSE AND SEVERANCE',
        badge: 'CRITICAL CASCADE EXTINCTION',
        badgeClass: 'ending-collapse',
        icon: '💥',
        summary: 'Chain-reaction hypervelocity collisions have shredded low Earth orbit into an impenetrable wall of supersonic shrapnel.',
        epilogue: 'The critical density threshold was breached. A runaway fragmentation cascade pulverized thousands of satellites into trillions of millimeter-sized lethal bullets. World space agencies have officially declared orbital flight impossible for the next century. Ground radar monitors watch a glowing veil of debris encircle Earth, severing humanity’s reach to the stars.',
        checkEligible: (save) => {
            const healthValues = Object.values(save.sectorHealth || {});
            if (healthValues.length === 0) return false;
            const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
            const criticalCount = healthValues.filter(h => h < 30).length;
            return avgHealth < 38 || criticalCount >= 3;
        }
    },
    commercial_monopoly: {
        id: 'commercial_monopoly',
        title: 'CORPORATE TOLLWAY ORBIT',
        subtitle: 'COMMERCIAL HEGEMONY // PRIVATIZATION OF THE COMMONS',
        badge: 'CORPORATE MONOPOLY',
        badgeClass: 'ending-commercial',
        icon: '🛰️',
        summary: 'Commercial aerospace mega-conglomerates have privatized orbital transit into high-margin proprietary toll highways.',
        epilogue: 'Your close commercial partnership allowed private telecom consortia to buy out and secure key orbital corridors. Near-Earth space is now strictly gated by proprietary subscription tiers and corporate automated defense satellites. While commercial operations thrive, civil science, university cubesats, and public exploration have been priced out of the sky.',
        checkEligible: (save) => {
            const rep = save.reputation || { commercial: 50 };
            const healthValues = Object.values(save.sectorHealth || {});
            const avgHealth = healthValues.length ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 50;
            return rep.commercial >= 70 && rep.commercial > rep.agency && rep.commercial > rep.public && avgHealth >= 45;
        }
    },
    military_fortress: {
        id: 'military_fortress',
        title: 'FORTRESS ORBIT CORDON',
        subtitle: 'DEFENSE HEGEMONY // PLANETARY SECURITY EXCLUSION ZONE',
        badge: 'MILITARIZED DEFENSE CORDON',
        badgeClass: 'ending-agency',
        icon: '🛡️',
        summary: 'Space Defense Command has turned near-Earth space into an armed planetary exclusion fortress.',
        epilogue: 'Relying heavily on defense agency contracts and classified cryptographic payloads, orbit has been fortified by armed interceptor platforms and quantum surveillance mesh grids. Debris is vaporized by high-energy military laser stations, but all unvetted civil and commercial launches are interdicted. Earth rests behind a permanent, armed iron dome.',
        checkEligible: (save) => {
            const rep = save.reputation || { agency: 50 };
            const healthValues = Object.values(save.sectorHealth || {});
            const avgHealth = healthValues.length ? (healthValues.reduce((a, b) => a + b, 0) / healthValues.length) : 50;
            return rep.agency >= 70 && rep.agency > rep.commercial && rep.agency > rep.public && avgHealth >= 45;
        }
    },
    orbital_renaissance: {
        id: 'orbital_renaissance',
        title: 'THE ORBITAL RENAISSANCE',
        subtitle: 'GOLDEN SUSTAINABILITY // INTERNATIONAL OPEN COMMONS',
        badge: 'SUSTAINABLE COMMONS [TRIUMPH]',
        badgeClass: 'ending-renaissance',
        icon: '🌟',
        summary: 'Near-Earth orbit has been restored to a pristine, open, sustainable international sanctuary.',
        epilogue: 'A historic triumph of public space stewardship! By keeping sector health high, protecting historical heritage assets like Vanguard 1 and the ISS, and fostering international transparency, humanity created the permanent UN Autonomous Orbital Sanitation Fleet. Debris density is declining for the first time in human history. The gateway to the Moon and Mars is open and safe for all.',
        checkEligible: (save) => {
            const rep = save.reputation || { public: 50 };
            const healthValues = Object.values(save.sectorHealth || {});
            if (healthValues.length === 0) return false;
            const avgHealth = healthValues.reduce((a, b) => a + b, 0) / healthValues.length;
            const minHealth = Math.min(...healthValues);
            return avgHealth >= 75 && minHealth >= 50 && rep.public >= 65;
        }
    }
};

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
                description: `Cleanse orbital hazard cluster in ${sector.name}.${selectedMods.length > 0 ? ' Active operational modifiers in effect.' : ''}`
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

        // Advance World Clock (7 days on victory, 12 days on failure)
        CampaignManager.advanceWorldClock(save, victory ? 7 : 12);

        OrbitalStorage.save(save);
        return consequenceRecord;
    }

    // =========================================================================
    // PHASE 8c: WORLD CLOCK & SOLAR WEATHER CYCLE
    // =========================================================================
    static advanceWorldClock(save, days) {
        if (!save.worldEpochDay) save.worldEpochDay = 1;
        save.worldEpochDay += Math.max(1, Math.round(days || 1));
        return save.worldEpochDay;
    }

    static getFormattedDate(save) {
        const epochDay = (save && save.worldEpochDay) ? save.worldEpochDay : 1;
        const baseDate = new Date('2054-04-12T06:00:00Z');
        const currentDate = new Date(baseDate.getTime() + (epochDay - 1) * 86400000);
        const isoDate = currentDate.toISOString().split('T')[0];
        const solar = this.getSolarCycleStatus(epochDay);
        return {
            epochDay: epochDay,
            calendarDate: isoDate,
            fullString: `EPOCH DAY ${String(epochDay).padStart(3, '0')} // ${isoDate}`,
            solarStatus: solar.status,
            solarLevel: solar.level,
            solarClass: solar.class
        };
    }

    static getSolarCycleStatus(epochDay) {
        const cycle = ((epochDay || 1) % 28);
        if (cycle >= 22) {
            return { status: 'STORM WARNING: HIGH DENSITY', level: 'HIGH', class: 'storm-high' };
        } else if (cycle >= 14) {
            return { status: 'ELEVATED SOLAR ACTIVITY', level: 'MODERATE', class: 'storm-mod' };
        }
        return { status: 'QUIET SUN: NOMINAL', level: 'LOW', class: 'storm-low' };
    }

    // =========================================================================
    // PHASE 8c: TECHNOLOGY TREE MANAGEMENT
    // =========================================================================
    static getTechPaths() {
        return TECH_PATHS;
    }

    static unlockTech(save, pathKey) {
        if (!TECH_PATHS[pathKey]) return { success: false, reason: 'Invalid tech path' };
        if (!save.techTree) {
            save.techTree = { capture: 1, sensors: 1, power: 1, shielding: 1, communications: 1, propulsion: 1 };
        }
        const currentTier = save.techTree[pathKey] || 1;
        if (currentTier >= 3) return { success: false, reason: 'Maximum tech tier already deployed' };

        const nextTierData = TECH_PATHS[pathKey].tiers[currentTier]; // tier index = currentTier (0-based)
        if (!nextTierData) return { success: false, reason: 'Next tier data unavailable' };

        const cost = nextTierData.cost;
        if ((save.credits || 0) < cost.credits) return { success: false, reason: `Requires ${cost.credits} Scrap` };
        if (!save.materials) save.materials = { metal: 0, cells: 0, chips: 0 };
        if ((save.materials.metal || 0) < cost.metal) return { success: false, reason: `Requires ${cost.metal} Metal` };
        if ((save.materials.cells || 0) < cost.cells) return { success: false, reason: `Requires ${cost.cells} Power Cells` };
        if ((save.materials.chips || 0) < cost.chips) return { success: false, reason: `Requires ${cost.chips} Quantum Chips` };

        // Deduct resources
        save.credits -= cost.credits;
        save.materials.metal -= cost.metal;
        save.materials.cells -= cost.cells;
        save.materials.chips -= cost.chips;

        // Upgrade tier
        save.techTree[pathKey] = currentTier + 1;

        if (typeof OrbitalStorage !== 'undefined' && typeof OrbitalStorage.save === 'function') {
            OrbitalStorage.save(save);
        }

        return {
            success: true,
            pathKey: pathKey,
            newTier: save.techTree[pathKey],
            tierName: nextTierData.name,
            bonuses: nextTierData.bonuses
        };
    }

    static getTechStatModifiers(save) {
        const tree = (save && save.techTree) ? save.techTree : { capture: 1, sensors: 1, power: 1, shielding: 1, communications: 1, propulsion: 1 };
        return {
            tractorPullMod: 1 + (tree.capture - 1) * 0.25,
            tractorRangeMod: 1 + (tree.capture - 1) * 0.20,
            extraNetCapacity: tree.capture >= 3 ? 1 : 0,
            radarRangeMod: 1 + (tree.sensors - 1) * 0.25,
            revealStealth: tree.sensors >= 3,
            radarNoiseReduction: tree.sensors >= 3 ? 0.50 : (tree.sensors >= 2 ? 0.25 : 0),
            batteryMaxBonus: (tree.power - 1) * 25,
            solarRechargeMod: 1 + (tree.power - 1) * 0.20,
            empDrainReduction: (tree.power - 1) * 0.20,
            hullMaxBonus: (tree.shielding - 1) * 25,
            collisionDamageDamping: (tree.shielding - 1) * 0.20,
            stormSurgeDamping: tree.shielding >= 3 ? 0.60 : (tree.shielding >= 2 ? 0.25 : 0),
            scrapPayoutMod: 1 + (tree.communications - 1) * 0.15,
            solicitDiscount: tree.communications >= 2 ? 0.50 : 0,
            repGainMod: 1 + (tree.communications - 1) * 0.20,
            handlingMod: 1 + (tree.propulsion - 1) * 0.20,
            fuelBurnReduction: (tree.propulsion - 1) * 0.15,
            accelerationMod: 1 + (tree.propulsion - 1) * 0.15
        };
    }

    // =========================================================================
    // PHASE 8c: CAMPAIGN ENDINGS EVALUATION
    // =========================================================================
    static evaluateCampaignEnding(save) {
        if (!save) return null;

        // Check each ending in priority order (Collapse -> Renaissance -> Commercial -> Military)
        if (CAMPAIGN_ENDINGS.kessler_collapse.checkEligible(save)) {
            return CAMPAIGN_ENDINGS.kessler_collapse;
        }
        if (CAMPAIGN_ENDINGS.orbital_renaissance.checkEligible(save)) {
            return CAMPAIGN_ENDINGS.orbital_renaissance;
        }
        if (CAMPAIGN_ENDINGS.commercial_monopoly.checkEligible(save)) {
            return CAMPAIGN_ENDINGS.commercial_monopoly;
        }
        if (CAMPAIGN_ENDINGS.military_fortress.checkEligible(save)) {
            return CAMPAIGN_ENDINGS.military_fortress;
        }

        // Default or in-progress status
        return null;
    }

    // =========================================================================
    // PHASE 8c: SAFE NEW CAMPAIGN & SAVE ARCHIVING
    // =========================================================================
    static archiveCurrentCampaign(save, label) {
        if (!save) return null;
        try {
            const archiveKey = `orbital_cleanup_archive_${Date.now()}`;
            const archiveRecord = {
                archivedAt: new Date().toISOString(),
                label: label || `Archive Seed-${save.campaignSeed || '000000'}`,
                data: JSON.parse(JSON.stringify(save))
            };
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem(archiveKey, JSON.stringify(archiveRecord));
            }
            return archiveKey;
        } catch (e) {
            console.error('[CampaignManager] Failed to archive campaign:', e);
            return null;
        }
    }

    static startNewCampaign(currentSave) {
        // Archive current campaign first to guarantee zero silent loss
        if (currentSave) {
            this.archiveCurrentCampaign(currentSave, `Career Archive - Seed ${currentSave.campaignSeed}`);
        }

        const freshSave = OrbitalStorage.getDefaultSave();
        freshSave.campaignSeed = Math.floor(Math.random() * 900000) + 100000;
        freshSave.worldEpochDay = 1;
        freshSave.missionsCompleted = 0;
        freshSave.techTree = { capture: 1, sensors: 1, power: 1, shielding: 1, communications: 1, propulsion: 1 };
        freshSave.availableContracts = this.generateContractPool(freshSave);

        // Preserve lifetime career high scores and archive records
        if (currentSave && currentSave.leaderboard) {
            freshSave.leaderboard = currentSave.leaderboard;
        }
        if (currentSave && Array.isArray(currentSave.survivalRecords)) {
            freshSave.survivalRecords = currentSave.survivalRecords;
        }

        OrbitalStorage.save(freshSave);
        return freshSave;
    }

    // =========================================================================
    // PHASE 8c: CASCADE SURVIVAL MODE HELPER
    // =========================================================================
    static recordSurvivalRun(save, record) {
        if (!Array.isArray(save.survivalRecords)) save.survivalRecords = [];
        const entry = {
            timestamp: new Date().toISOString(),
            timeSurvivedSec: record.timeSurvivedSec || 0,
            formattedTime: record.formattedTime || '00:00',
            debrisCollected: record.debrisCollected || 0,
            score: record.score || 0,
            rating: record.rating || 'RECRUIT'
        };
        save.survivalRecords.unshift(entry);
        save.survivalRecords.sort((a, b) => b.score - a.score);
        if (save.survivalRecords.length > 10) save.survivalRecords.pop();

        if (typeof OrbitalStorage !== 'undefined' && typeof OrbitalStorage.save === 'function') {
            OrbitalStorage.save(save);
        }
        return entry;
    }
}

// Global binding
if (typeof window !== 'undefined') {
    window.CONTRACT_OBJECTIVES = CONTRACT_OBJECTIVES;
    window.CONTRACT_MODIFIERS = CONTRACT_MODIFIERS;
    window.CONTRACT_CLIENTS = CONTRACT_CLIENTS;
    window.TECH_PATHS = TECH_PATHS;
    window.CAMPAIGN_ENDINGS = CAMPAIGN_ENDINGS;
    window.CampaignManager = CampaignManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CONTRACT_OBJECTIVES,
        CONTRACT_MODIFIERS,
        CONTRACT_CLIENTS,
        TECH_PATHS,
        CAMPAIGN_ENDINGS,
        CampaignManager
    };
}
