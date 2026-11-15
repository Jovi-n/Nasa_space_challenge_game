/**
 * Baseline Playtest Suite for Sectors 1-8
 * Simulates gameplay across all 8 sectors using current game data & rules.
 * Measures:
 * 1. Idle time (mean gap between threats/events)
 * 2. First threat appearance time
 * 3. Resource depletion rate (Fuel and Battery)
 * 4. Win rate across 5 runs per sector
 */

const fs = require('fs');

// Mock window and Phaser math
global.window = {};
const dataCode = fs.readFileSync('js/data.js', 'utf8').replace('const GAME_DATA =', 'global.GAME_DATA =');
eval(dataCode);
const missionsCode = fs.readFileSync('data/missions.js', 'utf8').replace('const MISSIONS_DATA =', 'global.MISSIONS_DATA =');
eval(missionsCode);

function runPlaytestSimulation(sectorId, runs = 5) {
    const mission = MISSIONS_DATA.find(m => m.id === sectorId);
    if (!mission) throw new Error("Mission not found: " + sectorId);

    const ship = GAME_DATA.SHIPS.scout;
    const results = [];

    for (let r = 0; r < runs; r++) {
        let time = 0;
        const dt = 0.5; // 0.5s time step
        let fuel = ship.maxFuel;
        let battery = ship.maxBattery;
        let hull = ship.maxHull;
        let cargo = 0;
        let debrisDelivered = 0;
        let kesslerRisk = 12;

        let firstThreatTime = mission.hazardRate / 1000; // scheduled first hazard
        let eventsTimeline = [];

        // Add scripted events to timeline
        (mission.scriptedEvents || []).forEach(e => eventsTimeline.push(e.time));
        // Add hazards
        for (let t = mission.hazardRate / 1000; t < mission.timeLimit; t += mission.hazardRate / 1000) {
            eventsTimeline.push(t);
        }
        eventsTimeline.sort((a, b) => a - b);

        // Calculate idle gaps
        let prevTime = 0;
        let gaps = [];
        eventsTimeline.forEach(t => {
            if (t > prevTime) {
                gaps.push(t - prevTime);
                prevTime = t;
            }
        });
        const meanIdleGap = gaps.length ? (gaps.reduce((a, b) => a + b, 0) / gaps.length) : mission.timeLimit;
        const maxIdleGap = gaps.length ? Math.max(...gaps) : mission.timeLimit;

        // Simulate flight
        let won = false;
        let lost = false;
        let failureReason = '';

        while (time < mission.timeLimit && !won && !lost) {
            time += dt;

            // Player thrusts 40% of the time to collect debris
            const isThrusting = Math.random() < 0.45;
            if (isThrusting) {
                fuel -= ship.fuelBurnRate * dt * (1 + (cargo * 30 / 700));
            }

            // Passive solar recharge
            battery = Math.min(ship.maxBattery, battery + ship.batteryRechargeRate * dt);

            // Simulate debris collection
            if (Math.random() < (0.15 * dt)) {
                if (cargo < ship.cargoCapacity) {
                    cargo++;
                }
            }

            // Simulate docking when cargo full
            if (cargo >= ship.cargoCapacity) {
                // travel to station takes 6-10s
                time += 8 * dt;
                debrisDelivered += cargo;
                cargo = 0;
                if (debrisDelivered >= mission.targetQuota) {
                    won = true;
                    break;
                }
            }

            // Hazard encounter check
            const hazardActiveProb = Math.min(mission.maxHazards, time / (mission.hazardRate / 1000)) * 0.04 * dt;
            if (Math.random() < hazardActiveProb) {
                // Nudge attempt
                if (battery >= 12 && Math.random() < 0.6) {
                    battery -= 12;
                    kesslerRisk = Math.max(0, kesslerRisk - 3);
                } else {
                    // Impact damage
                    hull -= 22;
                    if (hull <= 0) {
                        lost = true;
                        failureReason = 'HULL BREACH';
                        break;
                    }
                }
            }

            if (fuel <= 0) {
                lost = true;
                failureReason = 'OUT OF PROPELLANT';
                break;
            }
        }

        if (!won && !lost && time >= mission.timeLimit) {
            lost = true;
            failureReason = 'TIME LIMIT EXCEEDED';
        }

        const fuelUsed = ship.maxFuel - fuel;
        const fuelDepletionRate = (fuelUsed / time) * 60; // per min

        results.push({
            run: r + 1,
            won,
            time: Math.round(time),
            firstThreatTime,
            meanIdleGap: Math.round(meanIdleGap * 10) / 10,
            maxIdleGap: Math.round(maxIdleGap * 10) / 10,
            fuelDepletionRate: Math.round(fuelDepletionRate * 10) / 10,
            failureReason
        });
    }

    const winCount = results.filter(r => r.won).length;
    const avgIdle = results.reduce((s, r) => s + r.meanIdleGap, 0) / runs;
    const avgMaxIdle = results.reduce((s, r) => s + r.maxIdleGap, 0) / runs;
    const avgFuelDepletion = results.reduce((s, r) => s + r.fuelDepletionRate, 0) / runs;

    return {
        sectorId,
        name: mission.name,
        targetQuota: mission.targetQuota,
        timeLimit: mission.timeLimit,
        hazardRateSec: mission.hazardRate / 1000,
        winRate: (winCount / runs) * 100,
        avgFirstThreat: mission.hazardRate / 1000,
        avgIdleGap: Math.round(avgIdle * 10) / 10,
        avgMaxIdleGap: Math.round(avgMaxIdle * 10) / 10,
        avgFuelDepletionPerMin: Math.round(avgFuelDepletion * 10) / 10,
        runs: results
    };
}

console.log('=== BASELINE PLAYTEST REPORT (PRE-PHASE 5) ===\n');
const summary = [];
for (let s = 1; s <= 8; s++) {
    const res = runPlaytestSimulation(s, 5);
    summary.push(res);
    console.log(`[${res.name}]`);
    console.log(`  Win Rate: ${res.winRate}% (5 runs)`);
    console.log(`  First Threat: ${res.avgFirstThreat}s (target: <= 15s)`);
    console.log(`  Mean Idle Gap: ${res.avgIdleGap}s (target: 5-8s)`);
    console.log(`  Max Idle Gap: ${res.avgMaxIdleGap}s`);
    console.log(`  Fuel Depletion: ${res.avgFuelDepletionPerMin} %/min`);
    console.log('----------------------------------------------');
}
