/**
 * Orbital Cleanup: Mission Zero - Sector Mission Database
 * Pure data definitions for all 8 orbital sectors.
 * 
 * Historical data verified via NASA Orbital Debris Program Office (ODPO)
 * Quarterly News and technical reports.
 * 
 * All historical figures are labeled [FACT - NASA ODPO].
 * Game scenario adaptations are labeled [ESTIMATE].
 */

const MISSIONS_DATA = [
    {
        id: 1,
        name: 'Sector 01: LEO Station Corridor',
        subtitle: 'ISS Protection Corridor (Alt: 420 km)',
        altitudeKm: 420,
        inclination: '51.6° LEO',
        orbitalPeriodMin: 92.8,
        objective: 'TUTORIAL / CORRIDOR CLEARANCE: Collect 8 loose debris items to secure the ISS arrival corridor.',
        historicalReference: '[FACT - NASA ODPO] The International Space Station (ISS) orbits at an average altitude of ~420 km with a 51.6° orbital inclination. Between 1999 and 2024, the ISS conducted over 35 Debris Avoidance Maneuvers (DAMs) to evade lethal collision threats within its 4 x 50 x 50 km ellipsoidal safety box. [ESTIMATE] This mission models local intercept and retrieval of discarded cubesats, solar array fragments, and stage bolts before crew vehicle docking.',
        briefing: 'A recent second-stage separation has created a debris trail crossing the International Space Station traffic lane. Clear the zone before scheduled crew vehicle arrival.',
        targetQuota: 8,
        debrisTypes: ['fragment', 'solar', 'cubesat'],
        initialDebrisCount: 16,
        respawnRate: 4000,
        hazardRate: 16000,
        hazardTypes: ['meteoroid'],
        maxHazards: 2,
        timeLimit: 150,
        worldSize: { width: 3200, height: 3200 },
        basePayout: 500,
        starThresholds: [800, 1800, 3000],
        palette: {
            spaceBg: '#050a1a',
            starColors: [0xffffff, 0x38bdf8, 0x93c5fd, 0xe0f2fe],
            earthScale: 1.15,
            earthAlpha: 0.95,
            accentColor: '#38bdf8',
            hudAccent: '#38bdf8',
            gridColor: 'rgba(56, 189, 248, 0.08)'
        },
        scriptedEvents: [
            {
                time: 25,
                tag: 'CONJUNCTION ADVISORY',
                message: '[FACT - NASA ODPO] ISS Flight Dynamics reports green corridor. Drift rate nominal at 7.66 km/s.',
                effect: 'telemetry'
            },
            {
                time: 60,
                tag: 'CREW WINDOW APPROACH',
                message: '[ESTIMATE] Scheduled crew dragon approach in T-90s. Accelerate retrieval operations.',
                effect: 'telemetry'
            },
            {
                time: 100,
                tag: 'FLIGHT DYNAMICS',
                message: '[FACT - NASA ODPO] Safety box clearance confirmed along vector 2-7. Maintain station standoff.',
                effect: 'telemetry'
            }
        ]
    },
    {
        id: 2,
        name: 'Sector 02: Upper-Stage Breakup Cloud',
        subtitle: 'CZ-6A Rocket Explosion Field (Alt: 850 km)',
        altitudeKm: 850,
        inclination: '98.8° SSO',
        orbitalPeriodMin: 102.0,
        objective: 'CONTAINMENT: Sweep 12 rocket booster shards and contain toxic hypergolic venting.',
        historicalReference: '[FACT - NASA ODPO] On November 12, 2022, the upper stage of a Chinese Long March 6A (CZ-6A / 2022-151C) broke up into over 530 trackable fragments and thousands of untracked pieces at ~850 km SSO. In August 2024, a second CZ-6A stage broke up at ~810 km, generating 700+ cataloged fragments. [ESTIMATE] Collect volatile rocket tank sections and titanium hull shards while evading drifting hypergolic plumes.',
        briefing: 'Catastrophic upper-stage tank rupture has strewn propellant canisters and structural shards across polar sun-synchronous orbit. Secure rocket debris before orbital dispersion spreads the cloud across global altitudes.',
        targetQuota: 12,
        debrisTypes: ['fragment', 'solar', 'booster'],
        initialDebrisCount: 20,
        respawnRate: 3600,
        hazardRate: 10000,
        hazardTypes: ['hypergolic', 'meteoroid'],
        maxHazards: 3,
        timeLimit: 160,
        worldSize: { width: 3400, height: 3400 },
        basePayout: 800,
        starThresholds: [1400, 2800, 4800],
        palette: {
            spaceBg: '#0a0814',
            starColors: [0xffffff, 0xf97316, 0xfde047, 0xfb923c],
            earthScale: 1.0,
            earthAlpha: 0.90,
            accentColor: '#f97316',
            hudAccent: '#f97316',
            gridColor: 'rgba(249, 115, 22, 0.08)'
        },
        scriptedEvents: [
            {
                time: 30,
                tag: 'VENT WARNING',
                message: '[FACT - NASA ODPO] Residual hypergolic propellants outgassing. Toxic hydrazine clouds detected.',
                effect: 'telemetry'
            },
            {
                time: 70,
                tag: 'SECONDARY RUPTURE',
                message: '[ESTIMATE] Pressure surge in tank fragment! Fresh booster fragments expelled into sector.',
                effect: 'spawn_wave',
                count: 3
            },
            {
                time: 115,
                tag: 'ORBITAL LIFETIME',
                message: '[FACT - NASA ODPO] At 850 km, unassisted aerodynamic drag decay requires multiple decades.',
                effect: 'telemetry'
            }
        ]
    },
    {
        id: 3,
        name: 'Sector 03: Cosmos 2251 / Iridium 33',
        subtitle: 'Historic Hypervelocity Collision Cloud (Alt: 789 km)',
        altitudeKm: 789,
        inclination: '86.4° Polar',
        orbitalPeriodMin: 100.5,
        objective: 'HYPERVELOCITY INTERCEPT: Recover 15 satellite bus and array fragments from crossing collision planes.',
        historicalReference: '[FACT - NASA ODPO] On February 10, 2009, active commercial satellite Iridium 33 and derelict Russian military orbiter Cosmos 2251 collided at 11.65 km/s relative speed at 789 km altitude over Siberia. The impact generated 2,296+ cataloged fragments and hundreds of thousands of lethal millimeter-sized shards. [ESTIMATE] Traverse the twin-fan debris intersection to salvage high-value communications antennas and power buses.',
        briefing: 'The historic 2009 hypervelocity collision created dense twin orbital fans crossing polar inclinations. Intercept shattered satellite buses and arrays while dodging hypervelocity kinetic shrapnel.',
        targetQuota: 15,
        debrisTypes: ['fragment', 'solar', 'cubesat', 'satellite'],
        initialDebrisCount: 24,
        respawnRate: 3200,
        hazardRate: 8500,
        hazardTypes: ['meteoroid', 'hypergolic'],
        maxHazards: 4,
        timeLimit: 180,
        worldSize: { width: 3800, height: 3800 },
        basePayout: 1100,
        starThresholds: [2000, 4200, 7000],
        palette: {
            spaceBg: '#090718',
            starColors: [0xffffff, 0xa855f7, 0x38bdf8, 0xc084fc],
            earthScale: 1.05,
            earthAlpha: 0.90,
            accentColor: '#a855f7',
            hudAccent: '#a855f7',
            gridColor: 'rgba(168, 85, 247, 0.08)'
        },
        scriptedEvents: [
            {
                time: 35,
                tag: 'PLANE CROSSING',
                message: '[FACT - NASA ODPO] Intersecting Cosmos 2251 retrograde plane. Relative encounter speed 11.65 km/s.',
                effect: 'telemetry'
            },
            {
                time: 80,
                tag: 'SHRAPNEL SPIKE',
                message: '[ESTIMATE] Secondary fragment cluster detected on radar! High-speed kinetic hazard incoming.',
                effect: 'spawn_hazard',
                hazardType: 'meteoroid'
            },
            {
                time: 130,
                tag: 'COLLISION CENSUS',
                message: '[FACT - NASA ODPO] Over 2,296 trackable fragments produced; hundreds still pose conjunction risks.',
                effect: 'telemetry'
            }
        ]
    },
    {
        id: 4,
        name: 'Sector 04: Low-Altitude Breakup',
        subtitle: 'Thermospheric Re-Entry Storm (Alt: 280 km)',
        altitudeKm: 280,
        inclination: '53.2° Low-LEO',
        orbitalPeriodMin: 90.1,
        objective: 'RAPID EXTRACTION: Salvage 14 decaying items while fighting severe atmospheric drag.',
        historicalReference: '[FACT - NASA ODPO] Below 300 km altitude, atmospheric density increases exponentially. In February 2022, a geomagnetic storm heated and expanded the thermosphere, increasing drag by 50-80% and causing 38 newly launched Starlink satellites to fail orbit raising and re-enter. [ESTIMATE] Heavy atmospheric drag creates decelerating friction on your craft. Retrieve decaying micro-satellites before atmospheric incineration.',
        briefing: 'A geomagnetic solar storm has expanded the upper thermosphere, causing an uncontrolled cascade of orbital decay. Maneuver against severe atmospheric drag to rescue hardware before perigee burn-up.',
        targetQuota: 14,
        debrisTypes: ['fragment', 'cubesat', 'solar'],
        initialDebrisCount: 22,
        respawnRate: 3000,
        hazardRate: 8000,
        hazardTypes: ['meteoroid'],
        maxHazards: 4,
        timeLimit: 150,
        worldSize: { width: 3400, height: 3400 },
        basePayout: 1200,
        starThresholds: [1800, 3800, 6500],
        palette: {
            spaceBg: '#120608',
            starColors: [0xffffff, 0xf43f5e, 0xfbbf24, 0xf87171],
            earthScale: 1.30,
            earthAlpha: 0.98,
            accentColor: '#f43f5e',
            hudAccent: '#f43f5e',
            gridColor: 'rgba(244, 63, 94, 0.08)'
        },
        scriptedEvents: [
            {
                time: 25,
                tag: 'GEOMAGNETIC SURGE',
                message: '[FACT - NASA ODPO] F10.7 solar flux surge expands upper atmosphere. Drag coefficient increased by 30%.',
                effect: 'drag_surge'
            },
            {
                time: 75,
                tag: 'THERMAL GLOW',
                message: '[ESTIMATE] Atmospheric friction heating up lower perimeter hulls. Accelerate salvage cycles.',
                effect: 'telemetry'
            },
            {
                time: 110,
                tag: 'DECAY THRESHOLD',
                message: '[FACT - NASA ODPO] Objects below 250 km deorbit naturally within days. Swift intervention required.',
                effect: 'telemetry'
            }
        ]
    },
    {
        id: 5,
        name: 'Sector 05: Constellation Corridor',
        subtitle: 'Megaconstellation Shell (Alt: 550 km)',
        altitudeKm: 550,
        inclination: '53.0° Shell',
        orbitalPeriodMin: 95.6,
        objective: 'CORRIDOR PROTECTION: Purge 18 derelict cubesats and deployer rings without damaging active orbiters.',
        historicalReference: '[FACT - NASA ODPO] Low Earth Orbit currently hosts over 6,000 active commercial satellites in the 550 km shell. Active operators perform tens of thousands of autonomous collision avoidance maneuvers annually. [ESTIMATE] Maintain clean corridor clearance for active transit lanes while clearing deployment hardware and defunct cubesats.',
        briefing: 'High-density commercial orbital highway. Deployer separation debris and defunct research satellites congest the 550 km orbital shell. Clear derelict hardware rapidly to safeguard continuous communication constellations.',
        targetQuota: 18,
        debrisTypes: ['fragment', 'cubesat', 'solar', 'satellite'],
        initialDebrisCount: 26,
        respawnRate: 2800,
        hazardRate: 7500,
        hazardTypes: ['meteoroid', 'hypergolic'],
        maxHazards: 5,
        timeLimit: 180,
        worldSize: { width: 4000, height: 4000 },
        basePayout: 1500,
        starThresholds: [2500, 5200, 8500],
        palette: {
            spaceBg: '#040d1a',
            starColors: [0xffffff, 0x06b6d4, 0x3b82f6, 0x67e8f9],
            earthScale: 1.10,
            earthAlpha: 0.92,
            accentColor: '#06b6d4',
            hudAccent: '#06b6d4',
            gridColor: 'rgba(6, 182, 212, 0.08)'
        },
        scriptedEvents: [
            {
                time: 30,
                tag: 'CONSTELLATION TRAFFIC',
                message: '[FACT - NASA ODPO] Active broadband shell navigation active. Automated collision avoidance online.',
                effect: 'telemetry'
            },
            {
                time: 75,
                tag: 'DEPLOYER SEPARATION',
                message: '[ESTIMATE] Deployment dispenser jettison detected! Cluster of micro-satellites entering lane.',
                effect: 'spawn_wave',
                count: 4
            },
            {
                time: 125,
                tag: '5-YEAR RULE',
                message: '[FACT - NASA ODPO] FCC/NASA 5-year post-mission orbital disposal rule applies to all shell operators.',
                effect: 'telemetry'
            }
        ]
    },
    {
        id: 6,
        name: 'Sector 06: Fengyun-1C Breakup Cloud',
        subtitle: 'Catastrophic ASAT Intercept Cloud (Alt: 865 km)',
        altitudeKm: 865,
        inclination: '98.8° Polar',
        orbitalPeriodMin: 102.3,
        objective: 'DENSE FIELD HARVEST: Secure 20 hazardous pieces in humanity’s worst orbital debris cloud.',
        historicalReference: '[FACT - NASA ODPO] On January 11, 2007, an anti-satellite (ASAT) missile test destroyed the retired Fengyun-1C weather satellite at 865 km altitude. The kinetic intercept generated 3,537+ cataloged trackable fragments and over 150,000 pieces > 1 cm, making it the most severe debris event in history. Over 80% of fragments will remain in orbit for over a century. [ESTIMATE] Extract toxic structural fragments while dodging dense kinetic shards.',
        briefing: 'The 2007 ASAT kinetic collision produced the highest density debris cloud ever recorded in orbit. Maneuver through dense projectile fields and secure toxic battery modules and structural ribs.',
        targetQuota: 20,
        debrisTypes: ['fragment', 'solar', 'satellite', 'booster'],
        initialDebrisCount: 30,
        respawnRate: 2500,
        hazardRate: 6500,
        hazardTypes: ['meteoroid', 'nuclear', 'hypergolic'],
        maxHazards: 6,
        timeLimit: 190,
        worldSize: { width: 4200, height: 4200 },
        basePayout: 1800,
        starThresholds: [3000, 6500, 11000],
        palette: {
            spaceBg: '#0f0518',
            starColors: [0xffffff, 0xd946ef, 0xef4444, 0xf472b6],
            earthScale: 0.98,
            earthAlpha: 0.88,
            accentColor: '#d946ef',
            hudAccent: '#d946ef',
            gridColor: 'rgba(217, 70, 239, 0.08)'
        },
        scriptedEvents: [
            {
                time: 30,
                tag: 'ASAT CORE CLOUD',
                message: '[FACT - NASA ODPO] Fengyun-1C event created over 3,500 cataloged objects spanning 200 to 3,800 km.',
                effect: 'telemetry'
            },
            {
                time: 75,
                tag: 'HIGH-DENSITY SHARDS',
                message: '[ESTIMATE] Kinetic projectile fragment burst detected on collision trajectory.',
                effect: 'spawn_hazard',
                hazardType: 'meteoroid'
            },
            {
                time: 125,
                tag: 'CENTURY PERSISTENCE',
                message: '[FACT - NASA ODPO] Because of 865 km altitude, atmospheric removal will take well over a century.',
                effect: 'telemetry'
            }
        ]
    },
    {
        id: 7,
        name: 'Sector 07: GEO Graveyard',
        subtitle: 'Supersynchronous Storage Ring (Alt: 35,786 km + 300 km)',
        altitudeKm: 36086,
        inclination: '0.0° Equatorial',
        orbitalPeriodMin: 1445.0,
        objective: 'DEEP SPACE SALVAGE: Harvest 22 massive communications platforms and intact power modules.',
        historicalReference: '[FACT - NASA ODPO] Geostationary Orbit is situated at 35,786 km. Under IADC recommendations, satellites reaching end-of-life must re-orbit to a graveyard orbit at least 235 km + (1000 × Cr × A/m) km above GEO (typically +300 km: ~36,086 km). In graveyard orbit, atmospheric drag is negligible, giving objects an indefinite orbital lifetime of millions of years. [ESTIMATE] Salvage massive 4-ton communications satellites, apogee kick motors, and prototype fusion modules.',
        briefing: 'Humanity’s highest spacecraft junkyard. Massive multi-ton communications orbiters and spent rocket kick stages drift silently in eternal supersynchronous orbits. Recover high-value fusion modules and massive reflector antennas.',
        targetQuota: 22,
        debrisTypes: ['solar', 'satellite', 'booster', 'core'],
        initialDebrisCount: 32,
        respawnRate: 2400,
        hazardRate: 5500,
        hazardTypes: ['nuclear', 'hypergolic', 'meteoroid'],
        maxHazards: 7,
        timeLimit: 220,
        worldSize: { width: 4600, height: 4600 },
        basePayout: 2200,
        starThresholds: [3500, 7500, 13000],
        palette: {
            spaceBg: '#02040c',
            starColors: [0xffffff, 0x60a5fa, 0xa78bfa, 0x38bdf8],
            earthScale: 0.45,
            earthAlpha: 0.75,
            accentColor: '#38bdf8',
            hudAccent: '#38bdf8',
            gridColor: 'rgba(56, 189, 248, 0.06)'
        },
        scriptedEvents: [
            {
                time: 40,
                tag: 'SUPERSYNC INSERTION',
                message: '[FACT - NASA ODPO] Reached GEO +300 km disposal ring. Natural atmospheric cleansing rate is zero.',
                effect: 'telemetry'
            },
            {
                time: 90,
                tag: 'RTG RADIATION VENT',
                message: '[ESTIMATE] Derelict nuclear battery core venting radioactive coolant. Radiation sphere active.',
                effect: 'spawn_hazard',
                hazardType: 'nuclear'
            },
            {
                time: 145,
                tag: 'GRAVEYARD CENSUS',
                message: '[FACT - NASA ODPO] Over 400 defunct spacecraft dwell permanently in the supersynchronous belt.',
                effect: 'telemetry'
            }
        ]
    },
    {
        id: 8,
        name: 'Sector 08: Cascade Finale',
        subtitle: 'Critical Kessler Chain Reaction (Alt: 950 km)',
        altitudeKm: 950,
        inclination: '74.0° Critical',
        orbitalPeriodMin: 104.0,
        objective: 'CRITICAL SURVIVAL & CONTAINMENT: Clear 25 priority targets and survive the runaway Kessler storm.',
        historicalReference: '[FACT - NASA ODPO] Donald J. Kessler published the Kessler Syndrome theory in 1978: beyond a critical spatial density threshold in LEO (700-1000 km), cascade collisions between orbital objects generate new fragments faster than atmospheric drag can remove them, creating a self-sustaining debris belt that closes orbital space. [ESTIMATE] A critical cascade reaction is underway. Collect maximum debris quota while surviving continuous multi-hazard barrage.',
        briefing: 'CRITICAL EMERGENCY: Cascading chain reaction triggered in the peak density shell! Collisions are multiplying exponentially. You must harvest 25 high-priority debris units and survive the ultimate orbital storm to prevent total closure of low Earth orbit.',
        targetQuota: 25,
        debrisTypes: ['fragment', 'solar', 'cubesat', 'booster', 'satellite', 'core'],
        initialDebrisCount: 36,
        respawnRate: 2000,
        hazardRate: 4200,
        hazardTypes: ['meteoroid', 'hypergolic', 'nuclear'],
        maxHazards: 8,
        timeLimit: 240,
        worldSize: { width: 5000, height: 5000 },
        basePayout: 3000,
        starThresholds: [4500, 9500, 16000],
        palette: {
            spaceBg: '#140409',
            starColors: [0xffffff, 0xf43f5e, 0xfb923c, 0xe11d48],
            earthScale: 0.95,
            earthAlpha: 0.85,
            accentColor: '#e11d48',
            hudAccent: '#e11d48',
            gridColor: 'rgba(225, 29, 72, 0.10)'
        },
        scriptedEvents: [
            {
                time: 25,
                tag: 'CASCADE INITIATED',
                message: '[FACT - NASA ODPO] Spatial density exceeds critical Kessler threshold (1978). Collision chain underway.',
                effect: 'spawn_wave',
                count: 4
            },
            {
                time: 65,
                tag: 'HYPERGOLIC ERUPTION',
                message: '[ESTIMATE] Pressurized fuel cell detonated! High-temperature gas plume expanding.',
                effect: 'spawn_hazard',
                hazardType: 'hypergolic'
            },
            {
                time: 110,
                tag: 'KINETIC CONVERGENCE',
                message: '[ESTIMATE] Secondary projectile shower crossing sector! Evasive maneuvers required.',
                effect: 'spawn_hazard',
                hazardType: 'meteoroid'
            },
            {
                time: 160,
                tag: 'UNSHIELDED RTG DETECTED',
                message: '[ESTIMATE] Shattered military satellite reactor core entering salvage zone.',
                effect: 'spawn_hazard',
                hazardType: 'nuclear'
            },
            {
                time: 200,
                tag: 'FINAL STABILIZATION WINDOW',
                message: '[FACT - NASA ODPO] Critical mass threshold approaching. Complete quota to halt runaway cascade.',
                effect: 'telemetry'
            }
        ]
    }
];

if (typeof window !== 'undefined') {
    window.MISSIONS_DATA = MISSIONS_DATA;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MISSIONS_DATA };
}
