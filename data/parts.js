/**
 * ORBITAL CLEANUP: MISSION ZERO - DATA / PARTS CATALOG
 * Spacecraft Components, Subsystems, Clients, and Trade Architectures
 * Verified real-world aerospace heritage with clearly labelled estimates
 */

const PARTS_DATA = {
    // 1. Launch Vehicles (Payload mass & volume margins to orbit)
    launchVehicles: {
        electron: {
            id: 'electron',
            name: 'Electron (Dedicated SmallSat Launcher)',
            heritage: 'Rocket Lab Electron (Verified Real-World Heritage)',
            payloadToLeoKg: 320, // Real-world: ~300kg to 500km SSO
            fairingVolumeM3: 2.5,
            cost: 150,
            reliability: 0.94,
            description: 'Carbon-composite dedicated small launcher. Lightweight with low launch cost, but strict payload mass limits.'
        },
        falcon9: {
            id: 'falcon9',
            name: 'Falcon 9 (Reusable Medium Lifter)',
            heritage: 'SpaceX Falcon 9 Block 5 (Verified Real-World Heritage)',
            payloadToLeoKg: 2800, // Normalized mission allotment [ESTIMATE]
            fairingVolumeM3: 14.5,
            cost: 450,
            reliability: 0.99,
            description: 'Industry workhorse with generous payload mass and fairing volume margins. Excellent launch availability.'
        },
        ariane6: {
            id: 'ariane6',
            name: 'Ariane 64 (Heavy Orbital Carrier)',
            heritage: 'ESA / Arianespace Ariane 6 (Verified Real-World Heritage)',
            payloadToLeoKg: 6500, // Heavy mission allotment [ESTIMATE]
            fairingVolumeM3: 28.0,
            cost: 850,
            reliability: 0.97,
            description: 'Heavy European carrier capable of delivering massive multi-target sanitization platforms directly to high-energy graveyard orbits.'
        }
    },

    // 2. Spacecraft Buses (Structural Airframes)
    buses: {
        scout: {
            id: 'scout',
            name: 'Aero-Dart (Scout Bus)',
            dryMassKg: 180,
            volumeM3: 1.2,
            basePowerDrawW: 120,
            cargoCapacity: 3,
            baseSpeed: 360,
            turnRate: 240,
            cost: 200,
            maxHull: 90,
            spriteKey: 'ship_scout',
            description: 'Needle-delta airframe optimized for minimal cross-sectional drag and rapid agile maneuvers.'
        },
        collector: {
            id: 'collector',
            name: 'Orbital Mule (Collector Bus)',
            dryMassKg: 420,
            volumeM3: 3.4,
            basePowerDrawW: 240,
            cargoCapacity: 5,
            baseSpeed: 300,
            turnRate: 180,
            cost: 400,
            maxHull: 140,
            spriteKey: 'ship_collector',
            description: 'Reinforced trapezoid chassis with integrated central cargo bay and balanced avionics bus.'
        },
        lifter: {
            id: 'lifter',
            name: 'Titan Hauler (Heavy Lifter Bus)',
            dryMassKg: 950,
            volumeM3: 7.2,
            basePowerDrawW: 420,
            cargoCapacity: 8,
            baseSpeed: 230,
            turnRate: 120,
            cost: 750,
            maxHull: 240,
            spriteKey: 'ship_lifter',
            description: 'Twin-boom heavy catamaran with armored forward pylons and high structural payload volume.'
        }
    },

    // 3. Propulsion & Propellant Tanks
    propulsionTanks: {
        cold_gas: {
            id: 'cold_gas',
            name: 'Nitrogen Cold Gas RCS',
            heritage: 'Standard Satellite Attitude Control [ESTIMATE]',
            dryMassKg: 45,
            wetMassKg: 110,
            fuelCapacityL: 90,
            fuelBurnRate: 0.9,
            cost: 100,
            description: 'Inert pressurized nitrogen system. Clean, non-toxic and zero contamination risk, but lower fuel endurance.'
        },
        hypergolic: {
            id: 'hypergolic',
            name: 'MMH/NTO Bipropellant System',
            heritage: 'Spacecraft Apogee Engine Heritage (Apollo/Dragon) [ESTIMATE]',
            dryMassKg: 85,
            wetMassKg: 210,
            fuelCapacityL: 160,
            fuelBurnRate: 1.25,
            cost: 250,
            description: 'Spontaneous hypergolic combustion. Provides excellent delta-V budget and responsive thrust output.'
        },
        ion_hybrid: {
            id: 'ion_hybrid',
            name: 'Xenon Hall-Effect Ion Propulsion',
            heritage: 'Deep Space Ion Drive (BepiColombo / Starlink) [ESTIMATE]',
            dryMassKg: 120,
            wetMassKg: 220,
            fuelCapacityL: 130,
            fuelBurnRate: 0.75, // Highly fuel efficient
            powerDrawW: 110,
            cost: 380,
            description: 'Electrostatically accelerated xenon plasma. Extremely high specific impulse with minimal propellant consumption.'
        },
        extended_bladders: {
            id: 'extended_bladders',
            name: 'Auxiliary Titanium Propellant Bladders',
            heritage: 'Extended Deep Space Mission Heritage [ESTIMATE]',
            dryMassKg: 140,
            wetMassKg: 340,
            fuelCapacityL: 240,
            fuelBurnRate: 1.5,
            cost: 500,
            description: 'Heavy oversized propellant tanks engineered for high-altitude graveyard sweeping missions.'
        }
    },

    // 4. Power & Battery Subsystems
    powerSystems: {
        body_panels: {
            id: 'body_panels',
            name: 'Triple-Junction GaAs Body Solar Arrays',
            massKg: 35,
            volumeM3: 0.2,
            generationW: 240,
            batteryPool: 100,
            rechargeRate: 2.8,
            cost: 120,
            description: 'Skin-mounted solar arrays. Compact, durable, and immune to mechanical deployment snag hazards.'
        },
        deployable_wings: {
            id: 'deployable_wings',
            name: 'Deployable Dual-Tracking Solar Wings',
            massKg: 75,
            volumeM3: 0.6,
            generationW: 550,
            batteryPool: 140,
            rechargeRate: 4.2,
            cost: 280,
            description: 'Articulated solar panels that automatically track the Sun, providing high power generation during operations.'
        },
        supercapacitor_bank: {
            id: 'supercapacitor_bank',
            name: 'Graphene-Enhanced Supercapacitor Array',
            massKg: 130,
            volumeM3: 0.8,
            generationW: 420,
            batteryPool: 220,
            rechargeRate: 5.5,
            cost: 440,
            description: 'Rapid-discharge high-density energy storage engineered for prolonged magnetic tractor and net cycles.'
        }
    },

    // 5. Capture Equipment (Payloads)
    equipment: {
        arm: {
            id: 'arm',
            name: 'Robotic Grapple Arm',
            type: 'arm',
            massKg: 65,
            volumeM3: 0.4,
            powerDrawW: 40,
            batteryCost: 10,
            range: 260,
            speed: 600,
            cooldown: 500,
            scrapBonus: 1.35,
            cost: 140,
            description: 'Fires high-tensile clamp on tether to reel in targeted debris. Low power consumption with +35% scrap bonus.'
        },
        net: {
            id: 'net',
            name: 'Wide-Angle Capture Net',
            type: 'net',
            massKg: 110,
            volumeM3: 0.8,
            powerDrawW: 90,
            batteryCost: 24,
            range: 220,
            speed: 420,
            radius: 120,
            cooldown: 1100,
            scrapBonus: 1.0,
            cost: 220,
            description: 'Launches expanding energy mesh capturing multiple small/medium debris items simultaneously in radius.'
        },
        magnet: {
            id: 'magnet',
            name: 'Magnetic Tractor Beam',
            type: 'magnet',
            massKg: 180,
            volumeM3: 1.1,
            powerDrawW: 190,
            batteryCostPerSec: 18,
            range: 280,
            pullForce: 450,
            coneAngle: 70,
            scrapBonus: 1.1,
            cost: 360,
            description: 'Emits a sustained 70° graviton cone that continuously pulls metallic debris into the collection intake.'
        }
    },

    // 6. Ground & Relay Communications Infrastructure
    groundComms: {
        regional_passes: {
            id: 'regional_passes',
            name: 'Regional Ground Stations (S-Band Direct)',
            heritage: 'Ground Optical/RF Network (Kiruna/Svalbard) [ESTIMATE]',
            massKg: 15,
            powerDrawW: 25,
            latencyMs: 180,
            coveragePercent: 65,
            radarRangeBonus: 1.0,
            cost: 50,
            description: 'Direct-to-ground downlink during orbital horizon passes. Economical but intermittent telemetry.'
        },
        tdrss_relay: {
            id: 'tdrss_relay',
            name: 'TDRSS Geostationary Space Relay Link',
            heritage: 'NASA Space Network Tracking and Data Relay Satellite [ESTIMATE]',
            massKg: 45,
            powerDrawW: 75,
            latencyMs: 25,
            coveragePercent: 98,
            radarRangeBonus: 1.25, // +25% radar range
            cost: 220,
            description: 'Continuous geostationary data link providing uninterrupted telemetry, low latency, and +25% radar detection range.'
        }
    },

    // 7. Clients / Contract Stakeholders
    clients: {
        esa: {
            id: 'esa',
            name: 'ESA Clean Space Office',
            agency: 'European Space Agency (ClearSpace Initiative Heritage)',
            focus: 'Zero-Anomaly Clearance & Space Debris Mitigation Guidelines',
            payoutMultiplier: 1.25,
            maxCollisionsAllowed: 1,
            bonusCondition: 'Zero collisions and safe return',
            description: 'Demands strict adherence to European Code of Conduct for Space Debris Mitigation. Generous reward for zero-anomaly flights.'
        },
        nasa: {
            id: 'nasa',
            name: 'NASA Orbital Debris Program Office',
            agency: 'NASA Johnson Space Center (ODPO Heritage)',
            focus: 'High-Priority LEO Lane Protection & Scientific Retrieval',
            payoutMultiplier: 1.15,
            maxCollisionsAllowed: 3,
            bonusCondition: 'Clear 100% target quota with >25% fuel remaining',
            description: 'Focused on safeguarding human spaceflight in the ISS corridor and retrieving high-value research cubesats.'
        },
        commercial: {
            id: 'commercial',
            name: 'AeroSat Global Constellations',
            agency: 'Commercial Satellite Fleet Operator',
            focus: 'Rapid Turnaround & Commercial De-orbit Operations',
            payoutMultiplier: 1.35,
            maxCollisionsAllowed: 4,
            bonusCondition: 'Complete mission in under 60% of time window',
            description: 'Commercial fleet operator paying top scrap bounties for high-speed orbital corridor sweeping.'
        }
    },

    // 8. Pre-Configured Trade Architectures (for Trade Study Step 3)
    tradeArchitectures: {
        lean: {
            id: 'lean',
            name: 'Lean Architecture (Agile Interceptor)',
            tagline: 'Minimal mass, high speed, surgical precision retrieval',
            launchVehicle: 'electron',
            bus: 'scout',
            propulsion: 'cold_gas',
            power: 'body_panels',
            equipment: 'arm',
            groundComms: 'regional_passes',
            tradeSummary: {
                massProfile: 'Light (~340 kg total wet mass)',
                costProfile: 'Lowest ($560 Scrap equivalent)',
                riskLevel: 'Moderate (Low cargo capacity, lower fuel margin)',
                bestFor: 'LEO small debris interception and high-speed surgical collection'
            }
        },
        balanced: {
            id: 'balanced',
            name: 'Balanced Architecture (Orbital Workhorse)',
            tagline: 'Resilient payload, reliable multi-target capacity',
            launchVehicle: 'falcon9',
            bus: 'collector',
            propulsion: 'hypergolic',
            power: 'deployable_wings',
            equipment: 'net',
            groundComms: 'regional_passes',
            tradeSummary: {
                massProfile: 'Medium (~840 kg total wet mass)',
                costProfile: 'Moderate ($1,290 Scrap equivalent)',
                riskLevel: 'Low (Well-rounded margins and durable hull)',
                bestFor: 'Polar Graveyard and medium-density multi-object clearance'
            }
        },
        robust: {
            id: 'robust',
            name: 'Robust Architecture (Industrial Platform)',
            tagline: 'Maximum safety margins, heavy tow power, oversized reserves',
            launchVehicle: 'ariane6',
            bus: 'lifter',
            propulsion: 'extended_bladders',
            power: 'supercapacitor_bank',
            equipment: 'magnet',
            groundComms: 'tdrss_relay',
            tradeSummary: {
                massProfile: 'Heavy (~1,740 kg total wet mass)',
                costProfile: 'High ($2,610 Scrap equivalent)',
                riskLevel: 'Minimal (Maximum hull armor, massive fuel and cargo pool)',
                bestFor: 'Kessler Cascade Zone and deep Geostationary Graveyard operations'
            }
        }
    }
};

window.PARTS_DATA = PARTS_DATA;
