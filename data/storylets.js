/**
 * ORBITAL CLEANUP: MISSION ZERO - ASSET REGISTRY & STORYLET DILEMMA ENGINE (PHASE 8b)
 * 
 * Provides:
 * 1. ASSET_REGISTRY: Important satellites, derelicts, and orbital infrastructure across sectors.
 * 2. STORYLETS: 12 meaningful dilemmas (8 contract storylets + 4 follow-up storylets)
 *    involving resources, safety, reputation, and mission priorities.
 * 3. StoryletManager: Evaluation, choice resolution, consequence dispatch, and persistence.
 */

const ASSET_REGISTRY = {
    aegis_depot_alpha: {
        id: 'aegis_depot_alpha',
        name: 'Aegis Depot Alpha',
        sectorId: 1,
        sectorKey: 'sector_01',
        type: 'infrastructure',
        status: 'nominal', // nominal, secured, damaged, decaying, salvaged, offline
        condition: 100,
        massKg: 45000,
        value: 5000,
        faction: 'agency',
        operator: 'Aegis Orbital Authority',
        desc: 'Primary forward staging harbor and automated propellant/battery replenishment depot in LEO.'
    },
    iss_heritage_habitat: {
        id: 'iss_heritage_habitat',
        name: 'ISS Heritage Module',
        sectorId: 1,
        sectorKey: 'sector_01',
        type: 'heritage',
        status: 'nominal',
        condition: 88,
        massKg: 28000,
        value: 2400,
        faction: 'public',
        operator: 'International Space Station Legacy Trust',
        desc: 'Retired international space habitat module preserved as a cultural monument to human spaceflight cooperation.'
    },
    vanguard_1_probe: {
        id: 'vanguard_1_probe',
        name: 'Vanguard 1 Heritage Probe',
        sectorId: 1,
        sectorKey: 'sector_01',
        type: 'heritage',
        status: 'nominal',
        condition: 76,
        massKg: 1.5,
        value: 1200,
        faction: 'public',
        operator: 'Smithsonian National Air and Space Museum',
        desc: 'Launched in 1958; the oldest artificial object surviving in Earth orbit. Supreme historical and educational value.'
    },
    starlink_cluster_74: {
        id: 'starlink_cluster_74',
        name: 'Starlink Cluster 74',
        sectorId: 2,
        sectorKey: 'sector_02',
        type: 'satellite',
        status: 'nominal',
        condition: 92,
        massKg: 6400,
        value: 1800,
        faction: 'commercial',
        operator: 'AeroSat Telecom / Starlink Network',
        desc: 'Dense commercial broadband communications train traversing high-inclination polar insertion lanes.'
    },
    tiangong_cargo_hulk: {
        id: 'tiangong_cargo_hulk',
        name: 'Tianzhou Automated Cargo Hulk',
        sectorId: 2,
        sectorKey: 'sector_02',
        type: 'derelict',
        status: 'damaged',
        condition: 45,
        massKg: 13500,
        value: 1600,
        faction: 'agency',
        operator: 'Civil Space Logistics Directorate',
        desc: 'Spent automated space station resupply freighter containing residual hypergolic propellant and structural alloys.'
    },
    envisat_derelict: {
        id: 'envisat_derelict',
        name: 'Envisat Earth Observer',
        sectorId: 3,
        sectorKey: 'sector_03',
        type: 'derelict',
        status: 'endangered',
        condition: 58,
        massKg: 8211,
        value: 3200,
        faction: 'agency',
        operator: 'European Space Agency (ESA)',
        desc: 'The single most dangerous derelict satellite in Sun-Synchronous LEO. An 8.2-ton inert mass with high probability of catastrophic fragmentation if struck.'
    },
    starlink_38_debris_field: {
        id: 'starlink_38_debris_field',
        name: 'Decaying SmallSat Cloud-38',
        sectorId: 4,
        sectorKey: 'sector_04',
        type: 'derelict',
        status: 'decaying',
        condition: 30,
        massKg: 9500,
        value: 1100,
        faction: 'commercial',
        operator: 'Commercial Satellite Consortium',
        desc: 'Cluster of 38 micro-satellites trapped in severe thermospheric drag after a major geomagnetic solar storm expanded upper atmosphere.'
    },
    fengyun_1c_fragment_alpha: {
        id: 'fengyun_1c_fragment_alpha',
        name: 'Fengyun-1C Kinetic Shard Alpha',
        sectorId: 5,
        sectorKey: 'sector_05',
        type: 'derelict',
        status: 'hazardous',
        condition: 20,
        massKg: 180,
        value: 800,
        faction: 'agency',
        operator: 'Anti-Satellite Missile Test Debris (2007)',
        desc: 'High-density titanium projectile shard traveling on hypervelocity crossing orbit; remnant of the 2007 ASAT kinetic intercept.'
    },
    cosmos_2251_hull_core: {
        id: 'cosmos_2251_hull_core',
        name: 'Cosmos 2251 Collision Core',
        sectorId: 6,
        sectorKey: 'sector_06',
        type: 'derelict',
        status: 'hazardous',
        condition: 35,
        massKg: 900,
        value: 1400,
        faction: 'agency',
        operator: 'Russian Military Space Forces (Defunct)',
        desc: 'Intact reactor-bearing structural section from the historic 2009 Iridium-33 / Cosmos-2251 hypervelocity collision.'
    },
    classified_quantum_satellite: {
        id: 'classified_quantum_satellite',
        name: 'Project Chronos Quantum Platform',
        sectorId: 7,
        sectorKey: 'sector_07',
        type: 'satellite',
        status: 'endangered',
        condition: 65,
        massKg: 4200,
        value: 4500,
        faction: 'agency',
        operator: 'Classified Defense Space Command',
        desc: 'Black-budget cryptographic platform drifting in the GEO graveyard shell, equipped with experimental quantum computing capacitors.'
    },
    tdrss_relay_omega: {
        id: 'tdrss_relay_omega',
        name: 'TDRSS Relay Omega',
        sectorId: 7,
        sectorKey: 'sector_07',
        type: 'infrastructure',
        status: 'nominal',
        condition: 95,
        massKg: 3800,
        value: 2800,
        faction: 'agency',
        operator: 'NASA Space Communications and Navigation (SCaN)',
        desc: 'High-bandwidth geostationary tracking and data relay satellite maintaining continuous telemetry links across LEO and GEO.'
    },
    kessler_cascade_origin: {
        id: 'kessler_cascade_origin',
        name: 'Kessler Ground Zero Junction',
        sectorId: 8,
        sectorKey: 'sector_08',
        type: 'infrastructure',
        status: 'endangered',
        condition: 15,
        massKg: 62000,
        value: 6000,
        faction: 'public',
        operator: 'UN-OOSA Critical Orbital Safety Threshold',
        desc: 'Peak spatial density intersection point (850 km altitude). The epicentre of orbital cascade chain reactions.'
    }
};

const STORYLETS = [
    // -------------------------------------------------------------------------
    // 1. CONTRACT STORYLETS (8 Storylets)
    // -------------------------------------------------------------------------
    {
        id: 'STORYLET_01',
        title: 'Derelict Flight Recorder Dilemma',
        type: 'contract',
        tag: 'ORBITAL TELEMETRY INTERCEPT',
        sectorId: 1,
        assetId: 'tiangong_cargo_hulk',
        dossier: 'While conducting sweep operations, sensors detect an intact cryptographic flight recorder inside a tumbling derelict. The telemetry contains proprietary commercial collision avoidance logs and classified sensor tracks.',
        conditions: (save) => {
            const rep = save.reputation || { agency: 50, commercial: 50, public: 50 };
            return (rep.agency >= 40 || rep.commercial >= 40);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'SELL TO COMMERCIAL TELECOM',
                desc: 'AeroSat Telecom offers an immediate bounty for exclusive access to the collision logs to defend against liability suits.',
                stakes: '+350 Scrap, +1 Chips, +12 Commercial Rep, -6 Agency Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 350;
                    save.materials.chips = (save.materials.chips || 0) + 1;
                    save.reputation.commercial = Math.min(100, save.reputation.commercial + 12);
                    save.reputation.agency = Math.max(0, save.reputation.agency - 6);
                    save.campaignFlags.derelict_sold_to_commercial = true;
                    return {
                        immediate: '+350 Scrap, +1 Chips, +12 Commercial, -6 Agency',
                        delayed: 'AeroSat provides commercial orbital discount buffers.',
                        narrative: 'AeroSat wire-transferred the bounty immediately, praising your pragmatic corporate alignment.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'RELEASE TO OPEN CIVIL REGISTRY',
                desc: 'Upload the unredacted collision data directly to UN-OOSA open public science repositories for global satellite safety.',
                stakes: '+100 Scrap, +15 Public Rep, +8 Agency Rep, -10 Commercial Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 100;
                    save.reputation.public = Math.min(100, save.reputation.public + 15);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 8);
                    save.reputation.commercial = Math.max(0, save.reputation.commercial - 10);
                    save.campaignFlags.derelict_open_source = true;
                    return {
                        immediate: '+100 Scrap, +15 Public, +8 Agency, -10 Commercial',
                        delayed: 'Unlocks follow-up: Open Source Constellation Beacon (Storylet 09).',
                        narrative: 'The international space community celebrated the transparent data release; commercial operators grumbled over trade secrets.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'STRIP RECORDER FOR RAW MATERIALS',
                desc: 'Wipe the memory banks and recycle the gold and silicon into high-grade engineering components.',
                stakes: '+3 Metal, +2 Chips, +150 Scrap',
                canAfford: () => true,
                effect: (save) => {
                    save.materials.metal = (save.materials.metal || 0) + 3;
                    save.materials.chips = (save.materials.chips || 0) + 2;
                    save.credits = (save.credits || 0) + 150;
                    save.campaignFlags.derelict_scrapped = true;
                    return {
                        immediate: '+3 Metal, +2 Chips, +150 Scrap',
                        delayed: 'Zero political repercussions; pure workshop salvage.',
                        narrative: 'You smelted down the black box into pure structural alloys and quantum microcircuits.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_02',
        title: 'Envisat De-Orbit Treaty Conflict',
        type: 'contract',
        tag: 'HIGH-MASS COLLISION EMERGENCY',
        sectorId: 3,
        assetId: 'envisat_derelict',
        dossier: 'The European Space Agency warns that the 8.2-ton Envisat derelict has an intersecting track with a swarm of ASAT fragments. If struck, Envisat will trigger an immediate Kessler cascade across Sun-Synchronous orbit.',
        conditions: (save) => {
            return (save.unlockedLevels >= 3 || (save.sectorHealth && save.sectorHealth.sector_03 <= 65));
        },
        choices: [
            {
                id: 'choice_a',
                label: 'DIVERT FUEL FOR EMERGENCY NUDGE',
                desc: 'Burn 100 scrap worth of fuel reserves to execute a coordinated laser nudge, pushing Envisat onto a safe phasing trajectory.',
                stakes: '-100 Scrap, +18 Agency Rep, +10 Public Rep, +15 Sector 03 Health',
                canAfford: (save) => (save.credits || 0) >= 100,
                effect: (save) => {
                    save.credits = Math.max(0, (save.credits || 0) - 100);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 18);
                    save.reputation.public = Math.min(100, save.reputation.public + 10);
                    if (save.sectorHealth) save.sectorHealth.sector_03 = Math.min(100, (save.sectorHealth.sector_03 || 45) + 15);
                    if (save.assetRegistry && save.assetRegistry.envisat_derelict) {
                        save.assetRegistry.envisat_derelict.status = 'secured';
                    }
                    save.campaignFlags.envisat_safeguarded = true;
                    return {
                        immediate: '-100 Scrap, +18 Agency, +10 Public, +15 Sector 03 Health',
                        delayed: 'Unlocks follow-up: ESA Deep Space Clean Grant (Storylet 10).',
                        narrative: 'Envisat successfully altered course. ESA operations officially commend your decisive intervention.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'STRIP ASAR RADAR ARRAY FOR PROFIT',
                desc: 'Envisat’s synthetic aperture radar array is packed with high-value gallium-arsenide cells and platinum wave-guides. Strip it before it is hit.',
                stakes: '+500 Scrap, +3 Chips, +4 Metal, -20 Agency Rep, +10 Commercial Rep, +4 Carryover Debris',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 500;
                    save.materials.chips = (save.materials.chips || 0) + 3;
                    save.materials.metal = (save.materials.metal || 0) + 4;
                    save.reputation.agency = Math.max(0, save.reputation.agency - 20);
                    save.reputation.commercial = Math.min(100, save.reputation.commercial + 10);
                    if (save.carryoverDebris) save.carryoverDebris.sector_03 = (save.carryoverDebris.sector_03 || 0) + 4;
                    if (save.assetRegistry && save.assetRegistry.envisat_derelict) {
                        save.assetRegistry.envisat_derelict.status = 'salvaged';
                    }
                    save.campaignFlags.envisat_stripped = true;
                    return {
                        immediate: '+500 Scrap, +3 Chips, +4 Metal, -20 Agency, +10 Commercial, +4 Debris',
                        delayed: 'ESA issues formal diplomatic protest over unauthorized derelict scavenging.',
                        narrative: 'You stripped the multi-million dollar sensor suite. The stripped hulk remains vulnerable to future fragmentation.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'REFUSE MISSION: EXCESSIVE RISK',
                desc: 'Declare the 8-ton giant too massive and dangerous for your current spacecraft bus.',
                stakes: '-8 Public Rep, -5 Agency Rep, 0 Cost',
                canAfford: () => true,
                effect: (save) => {
                    save.reputation.public = Math.max(0, save.reputation.public - 8);
                    save.reputation.agency = Math.max(0, save.reputation.agency - 5);
                    save.campaignFlags.envisat_abandoned = true;
                    return {
                        immediate: '-8 Public, -5 Agency Rep',
                        delayed: 'Sector 03 debris risk remains elevated.',
                        narrative: 'You declined the operation. Envisat continues its uncontrolled drift through the crossing zone.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_03',
        title: 'Starlink Constellation Squeeze',
        type: 'contract',
        tag: 'COMMERCIAL CORRIDOR CONTROVERSY',
        sectorId: 2,
        assetId: 'starlink_cluster_74',
        dossier: 'AeroSat Telecom requests your vanguard vessel prioritize clearing micro-debris tracks surrounding their commercial constellation train, proposing to lock out civil research launches from the lane.',
        conditions: (save) => {
            const rep = save.reputation || { commercial: 50 };
            return (rep.commercial >= 45);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'ACCEPT EXCLUSIVE COMMERCIAL CONTRACT',
                desc: 'Dedicate all sweeping assets to safeguarding corporate satellites in exchange for a substantial payout.',
                stakes: '+400 Scrap, +16 Commercial Rep, -14 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 400;
                    save.reputation.commercial = Math.min(100, save.reputation.commercial + 16);
                    save.reputation.public = Math.max(0, save.reputation.public - 14);
                    save.campaignFlags.commercial_favored = true;
                    return {
                        immediate: '+400 Scrap, +16 Commercial, -14 Public',
                        delayed: 'Civil space advocates protest corporate monopolization of low Earth orbit.',
                        narrative: 'AeroSat transfer deposited promptly. Civilian observatories accuse you of corporate favoritism.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'ENFORCE EQUAL PUBLIC SHIPPING ACCESS',
                desc: 'Refuse corporate exclusivity and clear the open civilian corridor so small scientific satellites can launch safely.',
                stakes: '+180 Scrap, +14 Public Rep, +10 Agency Rep, -15 Commercial Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 180;
                    save.reputation.public = Math.min(100, save.reputation.public + 14);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 10);
                    save.reputation.commercial = Math.max(0, save.reputation.commercial - 15);
                    save.campaignFlags.public_corridor_protected = true;
                    return {
                        immediate: '+180 Scrap, +14 Public, +10 Agency, -15 Commercial',
                        delayed: 'Unlocks follow-up: Public Crowdfunded Clean-Up Fleet (Storylet 11).',
                        narrative: 'Grassroots space organizations praise your stance on fair orbital access.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'DEMAND EMERGENCY SURCHARGE',
                desc: 'Extort commercial operators by demanding double hazard pay to touch their corridor.',
                stakes: 'Requires 60% Commercial Rep. If met: +650 Scrap, -5 Commercial Rep.',
                canAfford: (save) => ((save.reputation && save.reputation.commercial >= 60) || false),
                effect: (save) => {
                    save.credits = (save.credits || 0) + 650;
                    save.reputation.commercial = Math.max(0, save.reputation.commercial - 5);
                    save.campaignFlags.commercial_extorted = true;
                    return {
                        immediate: '+650 Scrap, -5 Commercial',
                        delayed: 'AeroSat reluctantly pays but notes your aggressive billing.',
                        narrative: 'Corporate executives begrudgingly approved the emergency hazard invoice.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_04',
        title: 'Vanguard 1 Historic Heritage Protocol',
        type: 'contract',
        tag: 'AEROSPACE ARCHAEOLOGY CRISIS',
        sectorId: 1,
        assetId: 'vanguard_1_probe',
        dossier: 'The Smithsonian and NASA issue an urgent alert: Vanguard 1, launched in 1958 and the oldest artifact in space, is drifting into an active debris cluster in Sector 1. A collision would pulverize 70 years of space history.',
        conditions: (save) => {
            return (save.sectorHealth && save.sectorHealth.sector_01 <= 90);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'PRECISION GRAVEYARD INSERTION',
                desc: 'Spend 80 scrap and 1 metal to carefully tractor and nudge Vanguard 1 into a protected super-synchronous memorial orbit.',
                stakes: '-80 Scrap, -1 Metal, +20 Public Rep, +15 Agency Rep',
                canAfford: (save) => (save.credits || 0) >= 80 && (save.materials?.metal || 0) >= 1,
                effect: (save) => {
                    save.credits = Math.max(0, (save.credits || 0) - 80);
                    save.materials.metal = Math.max(0, (save.materials.metal || 0) - 1);
                    save.reputation.public = Math.min(100, save.reputation.public + 20);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 15);
                    if (save.assetRegistry && save.assetRegistry.vanguard_1_probe) {
                        save.assetRegistry.vanguard_1_probe.status = 'secured';
                    }
                    save.campaignFlags.vanguard_preserved = true;
                    return {
                        immediate: '-80 Scrap, -1 Metal, +20 Public, +15 Agency',
                        delayed: 'Unlocks follow-up: Smithsonian Heritage Exhibition Endowment (Storylet 12).',
                        narrative: 'Vanguard 1 was safely nudged into an eternal memorial orbit, preserving humanity’s oldest satellite.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'TRACTOR AND RECYCLE FOR SCRAP',
                desc: 'Treat the 1.5 kg sphere as standard space scrap, harvesting its antique solar cells and mercury batteries.',
                stakes: '+300 Scrap, -25 Public Rep, -15 Agency Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 300;
                    save.reputation.public = Math.max(0, save.reputation.public - 25);
                    save.reputation.agency = Math.max(0, save.reputation.agency - 15);
                    if (save.assetRegistry && save.assetRegistry.vanguard_1_probe) {
                        save.assetRegistry.vanguard_1_probe.status = 'salvaged';
                    }
                    save.campaignFlags.vanguard_destroyed = true;
                    return {
                        immediate: '+300 Scrap, -25 Public, -15 Agency',
                        delayed: 'Public outrage over the destruction of the oldest human satellite.',
                        narrative: 'You smelted Vanguard 1 down in the depot smelter. Historians around the world condemn the loss.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'BROADCAST CIVILIAN AMATEUR TRACKING',
                desc: 'Transmit high-precision coordinates to amateur radio operators to track and calculate passive avoidance burns.',
                stakes: '+6 Public Rep, -4 Agency Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.reputation.public = Math.min(100, save.reputation.public + 6);
                    save.reputation.agency = Math.max(0, save.reputation.agency - 4);
                    save.campaignFlags.vanguard_ignored = true;
                    return {
                        immediate: '+6 Public, -4 Agency Rep',
                        delayed: 'Vanguard 1 narrowly dodges fragments on its own.',
                        narrative: 'Amateur radio trackers monitored the close pass with bated breath as Vanguard 1 cleared the shard.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_05',
        title: 'Toxic Hydrazine Upper-Stage Breach',
        type: 'contract',
        tag: 'PRESSURIZED EXPLOSION THREAT',
        sectorId: 2,
        assetId: 'tiangong_cargo_hulk',
        dossier: 'A spent rocket upper-stage is venting pressurized toxic hypergolic hydrazine in Sector 2. Solar radiation heating threatens to rupture the main tank into hundreds of high-velocity fragments.',
        conditions: (save) => {
            return (save.unlockedLevels >= 2);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'DEPLOY CRYOGENIC METAL SEAL',
                desc: 'Spend 2 metal materials to construct an emergency seal over the relief valve before detonation.',
                stakes: '-2 Metal, +150 Scrap, +18 Sector 02 Health, +12 Public Rep, +10 Agency Rep',
                canAfford: (save) => (save.materials?.metal || 0) >= 2,
                effect: (save) => {
                    save.materials.metal = Math.max(0, (save.materials.metal || 0) - 2);
                    save.credits = (save.credits || 0) + 150;
                    if (save.sectorHealth) save.sectorHealth.sector_02 = Math.min(100, (save.sectorHealth.sector_02 || 60) + 18);
                    save.reputation.public = Math.min(100, save.reputation.public + 12);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 10);
                    save.campaignFlags.hydrazine_sealed = true;
                    return {
                        immediate: '-2 Metal, +150 Scrap, +18 Sector 02 Health, +12 Public, +10 Agency',
                        delayed: 'Sector 02 remains stable and free of hypergolic clouds.',
                        narrative: 'The cryogenic patch held firm under thermal stress. The booster is safe for eventual passivation.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'CONTROLLED LASER DETONATION',
                desc: 'Rupture the tank now with a laser pulse from safe range. Solves the explosion threat, but peppers the sector with shrapnel.',
                stakes: '+250 Scrap, -15 Sector 02 Health, +6 Carryover Debris, -12 Agency Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 250;
                    if (save.sectorHealth) save.sectorHealth.sector_02 = Math.max(10, (save.sectorHealth.sector_02 || 60) - 15);
                    if (save.carryoverDebris) save.carryoverDebris.sector_02 = (save.carryoverDebris.sector_02 || 0) + 6;
                    save.reputation.agency = Math.max(0, save.reputation.agency - 12);
                    save.campaignFlags.hydrazine_exploded = true;
                    return {
                        immediate: '+250 Scrap, -15 Sector 02 Health, +6 Carryover Debris, -12 Agency',
                        delayed: 'Dense cloud conditions will afflict Sector 02 for several missions.',
                        narrative: 'The tank detonated in a bright orange fireball, scattering kinetic shards across polar orbit.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'DECLARE ORBITAL EXCLUSION ZONE',
                desc: 'Issue navigation notices and divert commercial launch trajectories around the danger sector.',
                stakes: '-8 Commercial Rep, +4 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.reputation.commercial = Math.max(0, save.reputation.commercial - 8);
                    save.reputation.public = Math.min(100, save.reputation.public + 4);
                    save.campaignFlags.sector_quarantined = true;
                    return {
                        immediate: '-8 Commercial, +4 Public Rep',
                        delayed: 'Commercial airlines and spaceports experience minor delay surcharges.',
                        narrative: 'Space traffic was rerouted around the venting hulk; commercial operators grumbled over delayed schedules.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_06',
        title: 'Cold War RTG Nuclear Satellite Alert',
        type: 'contract',
        tag: 'RADIOACTIVE HAZARD CONTAINMENT',
        sectorId: 6,
        assetId: 'cosmos_2251_hull_core',
        dossier: 'Radiation sensors on Aegis Depot detect gamma and neutron flux from a tumbling Cold War reconnaissance satellite in Sector 6. Its Strontium-90 thermal generator is leaking through cracked shielding.',
        conditions: (save) => {
            return (save.unlockedLevels >= 5 || (save.sectorHealth && save.sectorHealth.sector_06 <= 50));
        },
        choices: [
            {
                id: 'choice_a',
                label: 'FABRICATE TUNGSTEN RADIATION SHROUD',
                desc: 'Sacrifice 2 metal units to fashion a containment shroud and nudge the radioactive core into a thousand-year disposal orbit.',
                stakes: '-2 Metal, +20 Agency Rep, +16 Public Rep, +20 Sector 06 Health',
                canAfford: (save) => (save.materials?.metal || 0) >= 2,
                effect: (save) => {
                    save.materials.metal = Math.max(0, (save.materials.metal || 0) - 2);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 20);
                    save.reputation.public = Math.min(100, save.reputation.public + 16);
                    if (save.sectorHealth) save.sectorHealth.sector_06 = Math.min(100, (save.sectorHealth.sector_06 || 40) + 20);
                    if (save.assetRegistry && save.assetRegistry.cosmos_2251_hull_core) {
                        save.assetRegistry.cosmos_2251_hull_core.status = 'secured';
                    }
                    save.campaignFlags.rtg_safely_isolated = true;
                    return {
                        immediate: '-2 Metal, +20 Agency, +16 Public, +20 Sector 06 Health',
                        delayed: 'Radiation hazard permanently neutralized from Sector 06.',
                        narrative: 'The nuclear core was entombed in heavy alloy and boosted into a stable 1,000-year storage shelf.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'HARVEST HIGH-ENERGY THERMOCOUPLE CELLS',
                desc: 'Strip the intact radioisotope thermoelectric generator elements to supercharge your spacecraft workshop batteries.',
                stakes: '+4 Cells, +200 Scrap, -18 Public Rep, -10 Agency Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.materials.cells = (save.materials.cells || 0) + 4;
                    save.credits = (save.credits || 0) + 200;
                    save.reputation.public = Math.max(0, save.reputation.public - 18);
                    save.reputation.agency = Math.max(0, save.reputation.agency - 10);
                    if (save.assetRegistry && save.assetRegistry.cosmos_2251_hull_core) {
                        save.assetRegistry.cosmos_2251_hull_core.status = 'salvaged';
                    }
                    save.campaignFlags.rtg_harvested = true;
                    return {
                        immediate: '+4 Cells, +200 Scrap, -18 Public, -10 Agency',
                        delayed: 'Safety inspectors investigate black-market radioactive components in workshop.',
                        narrative: 'You harvested the glowing thermocouple elements, gaining high-energy battery materials.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'LOG FLIGHT RECORD AND EVADE',
                desc: 'Keep spacecraft well outside the 200-meter radiation exclusion bubble and let orbital decay take its course.',
                stakes: '-8 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.reputation.public = Math.max(0, save.reputation.public - 8);
                    save.campaignFlags.rtg_ignored = true;
                    return {
                        immediate: '-8 Public Rep',
                        delayed: 'Radiation warning beacon remains active in Sector 06.',
                        narrative: 'You maintained safe distance and logged the radiation coordinates in the master flight record.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_07',
        title: 'Geomagnetic Storm Starlink Evacuation',
        type: 'contract',
        tag: 'SPACE WEATHER EMERGENCY',
        sectorId: 4,
        assetId: 'starlink_38_debris_field',
        dossier: 'A severe NASA DONKI G5 geomagnetic storm has heated and expanded the thermosphere. Decaying satellites in Sector 4 are decelerating rapidly and will re-enter within orbital hours unless assisted.',
        conditions: (save) => {
            return (save.unlockedLevels >= 4 || (save.activeContract && save.activeContract.modifiers && save.activeContract.modifiers.includes('storm_season')));
        },
        choices: [
            {
                id: 'choice_a',
                label: 'EMERGENCY RE-BOOST MISSION',
                desc: 'Burn extra propellant to nudge as many satellites as possible above the thermospheric drag line.',
                stakes: '-150 Scrap, +25 Commercial Rep, +15 Public Rep, +22 Sector 04 Health',
                canAfford: (save) => (save.credits || 0) >= 150,
                effect: (save) => {
                    save.credits = Math.max(0, (save.credits || 0) - 150);
                    save.reputation.commercial = Math.min(100, save.reputation.commercial + 25);
                    save.reputation.public = Math.min(100, save.reputation.public + 15);
                    if (save.sectorHealth) save.sectorHealth.sector_04 = Math.min(100, (save.sectorHealth.sector_04 || 55) + 22);
                    if (save.assetRegistry && save.assetRegistry.starlink_38_debris_field) {
                        save.assetRegistry.starlink_38_debris_field.status = 'secured';
                    }
                    save.campaignFlags.starlink_storm_rescue = true;
                    return {
                        immediate: '-150 Scrap, +25 Commercial, +15 Public, +22 Sector 04 Health',
                        delayed: 'Commercial operators grant priority high-payout contracts.',
                        narrative: 'Your heroic burns rescued 14 satellites from burning up over the Pacific.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'SCAVENGE FALLING SATELLITE HARDWARE',
                desc: 'Follow the decaying satellites down to perigee and salvage their titanium reaction wheels and xenon tanks.',
                stakes: '+450 Scrap, +3 Metal, +2 Chips, -22 Commercial Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 450;
                    save.materials.metal = (save.materials.metal || 0) + 3;
                    save.materials.chips = (save.materials.chips || 0) + 2;
                    save.reputation.commercial = Math.max(0, save.reputation.commercial - 22);
                    save.campaignFlags.storm_scavenged = true;
                    return {
                        immediate: '+450 Scrap, +3 Metal, +2 Chips, -22 Commercial',
                        delayed: 'AeroSat files aerospace insurance theft claims against independent salvagers.',
                        narrative: 'You harvested the hardware right before atmospheric incineration. Commercial owners were furious.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'HUNKER IN AEGIS DEPOT FARADAY HAVEN',
                desc: 'Conserve fuel and hull integrity inside the depot’s magnetic shield until the solar storm clears.',
                stakes: '0 Cost, +15 Spacecraft Hull Repair, -5 Commercial Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.reputation.commercial = Math.max(0, save.reputation.commercial - 5);
                    save.campaignFlags.storm_hunkered = true;
                    return {
                        immediate: '0 Cost, Depot Hull Overhaul, -5 Commercial Rep',
                        delayed: 'Zero spacecraft damage sustained during the peak solar storm.',
                        narrative: 'You sheltered behind the depot’s magnetic perimeter while the solar wind howled outside.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_08',
        title: 'Whistleblower Black Budget Derelict',
        type: 'contract',
        tag: 'GEOPOLITICAL ORBITAL ESPIONAGE',
        sectorId: 7,
        assetId: 'classified_quantum_satellite',
        dossier: 'You intercept an uncatalogued stealth reconnaissance platform in the GEO Graveyard. Its hard drives contain evidence of illegal kinetic orbital weapons disguised as communications research.',
        conditions: (save) => {
            const rep = save.reputation || { agency: 50 };
            return (save.unlockedLevels >= 6 || rep.agency >= 60);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'TRANSMIT LEAK TO UN SPACE WATCH',
                desc: 'Broadcast unredacted telemetry logs to civil transparency organizations to expose illegal orbital militarization.',
                stakes: '+100 Scrap, +30 Public Rep, -25 Agency Rep, -10 Commercial Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 100;
                    save.reputation.public = Math.min(100, save.reputation.public + 30);
                    save.reputation.agency = Math.max(0, save.reputation.agency - 25);
                    save.reputation.commercial = Math.max(0, save.reputation.commercial - 10);
                    save.campaignFlags.black_budget_exposed = true;
                    return {
                        immediate: '+100 Scrap, +30 Public, -25 Agency, -10 Commercial',
                        delayed: 'Global civil treaties restrict military debris generation.',
                        narrative: 'Global media erupted with revelations of covert weapons platforms. Public trust in your independence skyrocketed.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'RETURN DISCREETLY TO DEFENSE COMMAND',
                desc: 'Hand the encrypted core back to Defense Command in exchange for classified black-budget defense funding.',
                stakes: '+800 Scrap, +25 Agency Rep, -20 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 800;
                    save.reputation.agency = Math.min(100, save.reputation.agency + 25);
                    save.reputation.public = Math.max(0, save.reputation.public - 20);
                    save.campaignFlags.black_budget_covered = true;
                    return {
                        immediate: '+800 Scrap, +25 Agency, -20 Public',
                        delayed: 'Defense command grants classified military salvage bounties.',
                        narrative: 'A discreet courier collected the drive at Aegis Depot. Substantial classified defense funds were deposited.'
                    };
                }
            },
            {
                id: 'choice_c',
                label: 'AUCTION SCHEMATICS TO CORPORATE RIVALS',
                desc: 'Sell quantum capacitor schematics to private aerospace conglomerates.',
                stakes: '+1200 Scrap, +3 Chips, +18 Commercial Rep, -35 Agency Rep, -30 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 1200;
                    save.materials.chips = (save.materials.chips || 0) + 3;
                    save.reputation.commercial = Math.min(100, save.reputation.commercial + 18);
                    save.reputation.agency = Math.max(0, save.reputation.agency - 35);
                    save.reputation.public = Math.max(0, save.reputation.public - 30);
                    save.campaignFlags.black_budget_blackmailed = true;
                    return {
                        immediate: '+1200 Scrap, +3 Chips, +18 Commercial, -35 Agency, -30 Public',
                        delayed: 'Intelligence agencies flag your crew on planetary watchlists.',
                        narrative: 'You became extraordinarily wealthy overnight, though military escorts now monitor your every docking.'
                    };
                }
            }
        ]
    },

    // -------------------------------------------------------------------------
    // 2. FOLLOW-UP STORYLETS (4 Storylets responding to prior decisions & flags)
    // -------------------------------------------------------------------------
    {
        id: 'STORYLET_09',
        title: 'Open Source Constellation Beacon',
        type: 'followup',
        tag: 'CIVIC RADAR EXPANSION',
        sectorId: 1,
        assetId: 'tdrss_relay_omega',
        dossier: 'Because you released the black box telemetry to open public science (Storylet 01), global amateur ground stations have networked their dishes into a decentralized orbital tracking mesh.',
        conditions: (save) => {
            return (save.campaignFlags && save.campaignFlags.derelict_open_source === true);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'SYNC SHIP SENSORS WITH CIVILIAN MESH',
                desc: 'Integrate the open amateur feed into your navigation computer, permanently expanding collision radar detection range by +15%.',
                stakes: '+15% Sensor Warning Range, +12 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.reputation.public = Math.min(100, save.reputation.public + 12);
                    save.campaignFlags.open_source_radar_active = true;
                    return {
                        immediate: '+15% Sensor Range, +12 Public Rep',
                        delayed: 'Permanent radar detection enhancement in all future missions.',
                        narrative: 'Your onboard radar now receives real-time feeds from 10,000 amateur telescope arrays across Earth.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'COMMERCIALIZE REAL-TIME FEED',
                desc: 'Package the civilian radar mesh into a low-latency tracking API and sell access to commercial satellite operators.',
                stakes: '+450 Scrap, +15 Commercial Rep, -8 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 450;
                    save.reputation.commercial = Math.min(100, save.reputation.commercial + 15);
                    save.reputation.public = Math.max(0, save.reputation.public - 8);
                    save.campaignFlags.radar_monetized = true;
                    return {
                        immediate: '+450 Scrap, +15 Commercial, -8 Public',
                        delayed: 'Ongoing commercial royalties augment future contract pay.',
                        narrative: 'Commercial mega-constellations bought subscriptions to your telemetry network.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_10',
        title: 'ESA Deep Space Clean Grant',
        type: 'followup',
        tag: 'DIPLOMATIC ENDOWMENT',
        sectorId: 3,
        assetId: 'envisat_derelict',
        dossier: 'Having successfully saved Envisat from catastrophic kinetic destruction (Storylet 02), the European Space Agency awards your crew their prestigious Clean Space Excellence Grant.',
        conditions: (save) => {
            return (save.campaignFlags && save.campaignFlags.envisat_safeguarded === true);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'ACCEPT R&D BLUEPRINTS & ADVANCED CELLS',
                desc: 'Receive advanced European ion thruster blueprints and high-efficiency photovoltaic materials for spacecraft engineering.',
                stakes: '+300 Scrap, +3 Cells, +2 Chips, +15 Agency Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 300;
                    save.materials.cells = (save.materials.cells || 0) + 3;
                    save.materials.chips = (save.materials.chips || 0) + 2;
                    save.reputation.agency = Math.min(100, save.reputation.agency + 15);
                    save.campaignFlags.esa_ion_thrusters = true;
                    return {
                        immediate: '+300 Scrap, +3 Cells, +2 Chips, +15 Agency',
                        delayed: 'Advanced European parts unlocked in workshop stock.',
                        narrative: 'ESA engineers delivered cutting-edge ion propulsion components to your hangar bay.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'ESTABLISH PERMANENT SUN-SYNC SAFETY HUB',
                desc: 'Invest grant funds into automated debris sweep monitors across Sector 03 to permanently improve sector health.',
                stakes: '+25 Sector 03 Health, +20 Agency Rep, +15 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    if (save.sectorHealth) save.sectorHealth.sector_03 = Math.min(100, (save.sectorHealth.sector_03 || 45) + 25);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 20);
                    save.reputation.public = Math.min(100, save.reputation.public + 15);
                    save.campaignFlags.esa_monitoring_hub = true;
                    return {
                        immediate: '+25 Sector 03 Health, +20 Agency, +15 Public',
                        delayed: 'Sector 03 hazard density permanently reduced.',
                        narrative: 'Automated ESA sensor buoys now guard the Sun-Synchronous orbit from runaway collisions.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_11',
        title: 'Public Crowdfunded Clean-Up Fleet',
        type: 'followup',
        tag: 'GRASSROOTS CIVIL ENDEAVOR',
        sectorId: 2,
        assetId: 'iss_heritage_habitat',
        dossier: 'Your defense of equal public shipping corridors over corporate monopoly (Storylet 03) captured international news. A viral crowdfunding campaign has accumulated massive citizen donations to fund your missions.',
        conditions: (save) => {
            return (save.campaignFlags && save.campaignFlags.public_corridor_protected === true);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'ACCEPT COMMUNITY REPAIR FUND',
                desc: 'Deposit the citizen contributions directly into your workshop treasury for ship maintenance and upgrades.',
                stakes: '+500 Scrap, +4 Metal, +15 Public Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 500;
                    save.materials.metal = (save.materials.metal || 0) + 4;
                    save.reputation.public = Math.min(100, save.reputation.public + 15);
                    save.campaignFlags.crowdfund_accepted = true;
                    return {
                        immediate: '+500 Scrap, +4 Metal, +15 Public Rep',
                        delayed: 'Global public supporters eagerly follow each mission broadcast.',
                        narrative: 'Small donations from over 200,000 citizens around the globe funded your next refit.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'SUBSIDIZE UNIVERSITY CUBESAT DE-ORBITING',
                desc: 'Use the funds to retrieve and de-orbit dead university educational cubesats free of charge.',
                stakes: '+28 Public Rep, +12 Agency Rep, +15 Sector 01 Health, +15 Sector 02 Health',
                canAfford: () => true,
                effect: (save) => {
                    save.reputation.public = Math.min(100, save.reputation.public + 28);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 12);
                    if (save.sectorHealth) {
                        save.sectorHealth.sector_01 = Math.min(100, (save.sectorHealth.sector_01 || 85) + 15);
                        save.sectorHealth.sector_02 = Math.min(100, (save.sectorHealth.sector_02 || 60) + 15);
                    }
                    save.campaignFlags.smallsats_cleared = true;
                    return {
                        immediate: '+28 Public, +12 Agency, +15 Sector 01 & 02 Health',
                        delayed: 'Educational universities grant honorary aerospace engineering doctorate.',
                        narrative: 'You cleared dead student satellites across LEO; educational institutions worldwide salute your crew.'
                    };
                }
            }
        ]
    },
    {
        id: 'STORYLET_12',
        title: 'Smithsonian Heritage Exhibition Endowment',
        type: 'followup',
        tag: 'PERPETUAL CULTURAL RECOGNITION',
        sectorId: 1,
        assetId: 'vanguard_1_probe',
        dossier: 'In gratitude for preserving humanity’s oldest satellite Vanguard 1 (Storylet 04), the Smithsonian National Air and Space Museum establishes a permanent public exhibition honoring your spacecraft and flight crew.',
        conditions: (save) => {
            return (save.campaignFlags && save.campaignFlags.vanguard_preserved === true);
        },
        choices: [
            {
                id: 'choice_a',
                label: 'ACCEPT PERPETUAL EXHIBITION ENDOWMENT',
                desc: 'Establish a formal partnership that grants ongoing subsidies and cuts future contract solicitation fees in half.',
                stakes: '+400 Scrap, +20 Public Rep, +15 Agency Rep, 50% Cheaper Contract Rerolls',
                canAfford: () => true,
                effect: (save) => {
                    save.credits = (save.credits || 0) + 400;
                    save.reputation.public = Math.min(100, save.reputation.public + 20);
                    save.reputation.agency = Math.min(100, save.reputation.agency + 15);
                    save.campaignFlags.smithsonian_endowed = true;
                    return {
                        immediate: '+400 Scrap, +20 Public, +15 Agency, 50% Cheaper Rerolls',
                        delayed: 'Contract solicitation / reroll cost permanently reduced to 25 scrap.',
                        narrative: 'A life-size replica of your vanguard spacecraft now hangs in the main hall of the National Air and Space Museum.'
                    };
                }
            },
            {
                id: 'choice_b',
                label: 'EXCHANGE ENDOWMENT FOR SURPLUS AEROSPACE ALLOYS',
                desc: 'Request the museum archive exchange symbolic honors for high-grade titanium and beryllium scrap stockpiles.',
                stakes: '+6 Metal, +3 Cells, +150 Scrap, +10 Commercial Rep',
                canAfford: () => true,
                effect: (save) => {
                    save.materials.metal = (save.materials.metal || 0) + 6;
                    save.materials.cells = (save.materials.cells || 0) + 3;
                    save.credits = (save.credits || 0) + 150;
                    save.reputation.commercial = Math.min(100, save.reputation.commercial + 10);
                    save.campaignFlags.museum_materials_granted = true;
                    return {
                        immediate: '+6 Metal, +3 Cells, +150 Scrap, +10 Commercial',
                        delayed: 'Massive materials boost for advanced spacecraft bus upgrades.',
                        narrative: 'Crates of vintage flight-grade titanium alloys were transferred to your hangar workshop.'
                    };
                }
            }
        ]
    }
];

class StoryletManager {
    /**
     * Retrieve current Asset Registry from save or default
     */
    static getAssetRegistry(save) {
        if (!save.assetRegistry || typeof save.assetRegistry !== 'object') {
            save.assetRegistry = JSON.parse(JSON.stringify(ASSET_REGISTRY));
        }
        return save.assetRegistry;
    }

    /**
     * Find next eligible, un-resolved storylet based on current campaign state
     */
    static getEligibleStorylet(save) {
        if (!Array.isArray(save.resolvedStorylets)) save.resolvedStorylets = [];
        if (!save.campaignFlags) save.campaignFlags = {};

        // 1. First priority: Check for eligible follow-up storylets
        const followups = STORYLETS.filter(s => s.type === 'followup');
        for (const s of followups) {
            if (!save.resolvedStorylets.includes(s.id) && s.conditions(save)) {
                return s;
            }
        }

        // 2. Second priority: Check for contract storylets matching current sector/campaign state
        const contractStorylets = STORYLETS.filter(s => s.type === 'contract');
        for (const s of contractStorylets) {
            if (!save.resolvedStorylets.includes(s.id) && s.conditions(save)) {
                return s;
            }
        }

        return null;
    }

    /**
     * Resolve a storylet choice, applying immediate and recording delayed consequences
     */
    static resolveStorylet(save, storyletId, choiceId) {
        const storylet = STORYLETS.find(s => s.id === storyletId);
        if (!storylet) return { success: false, error: 'Storylet not found' };

        const choice = storylet.choices.find(c => c.id === choiceId);
        if (!choice) return { success: false, error: 'Choice not found' };

        if (!choice.canAfford(save)) {
            return { success: false, error: 'Insufficient resources or reputation requirements' };
        }

        if (!Array.isArray(save.resolvedStorylets)) save.resolvedStorylets = [];
        if (!Array.isArray(save.decisionHistory)) save.decisionHistory = [];
        if (!save.campaignFlags) save.campaignFlags = {};
        if (!save.assetRegistry) save.assetRegistry = JSON.parse(JSON.stringify(ASSET_REGISTRY));

        // Execute choice effect
        const outcome = choice.effect(save);

        // Mark as resolved to prevent repetition
        save.resolvedStorylets.push(storyletId);

        // Record in decision history
        const decisionRecord = {
            timestamp: new Date().toISOString(),
            storyletId: storylet.id,
            storyletTitle: storylet.title,
            tag: storylet.tag,
            assetId: storylet.assetId,
            assetName: save.assetRegistry[storylet.assetId]?.name || storylet.assetId,
            choiceId: choice.id,
            choiceLabel: choice.label,
            immediate: outcome.immediate,
            delayed: outcome.delayed,
            narrative: outcome.narrative
        };
        save.decisionHistory.unshift(decisionRecord);
        if (save.decisionHistory.length > 30) save.decisionHistory.pop();

        // Clear active dilemma
        save.activeDilemmaId = null;

        // Save state persistently
        if (typeof OrbitalStorage !== 'undefined' && typeof OrbitalStorage.save === 'function') {
            OrbitalStorage.save(save);
        }

        return {
            success: true,
            storylet: storylet,
            choice: choice,
            outcome: outcome,
            record: decisionRecord
        };
    }

    /**
     * Post-mission hook: evaluate if a new storylet should be prompted
     */
    static onMissionCompleted(save, scene, victory) {
        if (!save.resolvedStorylets) save.resolvedStorylets = [];

        // Check if a new storylet is eligible
        const eligible = this.getEligibleStorylet(save);
        if (eligible) {
            save.activeDilemmaId = eligible.id;
        }

        return eligible;
    }
}

// Global binding
if (typeof window !== 'undefined') {
    window.ASSET_REGISTRY = ASSET_REGISTRY;
    window.STORYLETS = STORYLETS;
    window.StoryletManager = StoryletManager;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ASSET_REGISTRY,
        STORYLETS,
        StoryletManager
    };
}
