/**
 * ORBITAL CLEANUP: MISSION ZERO
 * Procedural Pixel Art Generator & Texture Manager (Phase 6)
 * 
 * Generates consistent, high-fidelity pixel-art assets directly into
 * Phaser's TextureManager using HTML5 canvas without runtime build dependencies.
 * 
 * Features:
 * - 4x4 Bayer Matrix ordered dithering (replaces continuous gradients with pixel banding)
 * - Consistent 1px / 2px dark outer contours (#070a13) for high-contrast visibility
 * - Standardized 32-color Sci-Fi Pixel Palette (Cyber Cyan, Solar Amber, Clean Emerald, Hazard Red, Deep Space Navy)
 * - Pixel-art Earth, modular Aegis space station, spacecraft, debris, and hazards
 * - Discrete pixel particles (thruster exhaust, collision sparks, recycling shimmer, smoke, shockwaves)
 */

class TextureGenerator {
    // 4x4 Bayer Matrix for authentic retro dithering
    static BAYER_4X4 = [
        [ 0,  8,  2, 10],
        [12,  4, 14,  6],
        [ 3, 11,  1,  9],
        [15,  7, 13,  5]
    ];

    // Standardized Retro Sci-Fi Pixel Art Palette
    static PALETTE = {
        // Space & Outlines
        VOID: '#03050a',
        OUTLINE: '#070a13',
        SPACE_NAVY: '#0a0f1d',
        SPACE_SLATE: '#151e33',

        // Metals & Hull
        HULL_DARK: '#334155',
        HULL_MID: '#64748b',
        HULL_LIGHT: '#94a3b8',
        HULL_BRIGHT: '#cbd5e1',
        WHITE: '#f8fafc',

        // Cyber Cyan (Scout / Avionics / Sensors)
        CYAN_DEEP: '#083344',
        CYAN_MID: '#0891b2',
        CYAN_BRIGHT: '#06b6d4',
        CYAN_GLOW: '#00f3ff',
        CYAN_WHITE: '#cffafe',

        // Clean Emerald (Station / Cargo / Health)
        GREEN_DEEP: '#064e3b',
        GREEN_MID: '#047857',
        GREEN_BRIGHT: '#10b981',
        GREEN_GLOW: '#34d399',
        GREEN_WHITE: '#a7f3d0',

        // Solar Amber (Gold / Construction / Currency)
        AMBER_DEEP: '#451a03',
        AMBER_MID: '#b45309',
        AMBER_BRIGHT: '#f59e0b',
        AMBER_GLOW: '#fbbf24',
        AMBER_WHITE: '#fef08a',

        // Hazard Crimson (Damage / Explosions / Radiation)
        RED_DEEP: '#450a0a',
        RED_MID: '#991b1b',
        RED_BRIGHT: '#ef4444',
        RED_GLOW: '#f87171',
        RED_WHITE: '#fecaca',

        // Plasma Purple (Exotic / Historic Collisions)
        PURPLE_DEEP: '#2e1065',
        PURPLE_MID: '#6d28d9',
        PURPLE_BRIGHT: '#8b5cf6',
        PURPLE_GLOW: '#c084fc',

        // Earth Continents
        EARTH_OCEAN_DEEP: '#0f172a',
        EARTH_OCEAN_MID: '#1e3a8a',
        EARTH_OCEAN_LIGHT: '#2563eb',
        EARTH_OCEAN_COAST: '#38bdf8',
        EARTH_LAND_DARK: '#14532d',
        EARTH_LAND_MID: '#16a34a',
        EARTH_LAND_LIGHT: '#4ade80'
    };

    static generateAll(scene) {
        this.generateEarth(scene);
        this.generateSpaceStation(scene);
        this.generateShips(scene);
        this.generateDebris(scene);
        this.generateHazards(scene);
        this.generateEquipment(scene);
        this.generateParticles(scene);
    }

    static createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;
        return { canvas, ctx };
    }

    static registerTexture(scene, key, canvas) {
        if (scene.textures.exists(key)) {
            scene.textures.remove(key);
        }
        scene.textures.addCanvas(key, canvas);
    }

    /**
     * Helper: Draws a single pixel or pixel block
     */
    static setPixel(ctx, x, y, color, size = 1) {
        ctx.fillStyle = color;
        ctx.fillRect(Math.floor(x), Math.floor(y), size, size);
    }

    /**
     * Helper: Draws a filled pixel rectangle with optional outline
     */
    static drawPixelRect(ctx, x, y, w, h, fillColor, outlineColor = null) {
        x = Math.floor(x);
        y = Math.floor(y);
        w = Math.floor(w);
        h = Math.floor(h);

        if (outlineColor) {
            ctx.fillStyle = outlineColor;
            ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
        }
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
    }

    /**
     * Helper: Dithered rectangular fill using 4x4 Bayer matrix
     */
    static drawBayerDitherRect(ctx, x, y, w, h, color1, color2, lightFactor, pixelSize = 2) {
        x = Math.floor(x);
        y = Math.floor(y);
        w = Math.floor(w);
        h = Math.floor(h);
        const threshold = Math.round(Phaser.Math.Clamp(lightFactor, 0, 1) * 16);

        for (let py = 0; py < h; py += pixelSize) {
            const gridY = Math.floor((y + py) / pixelSize) % 4;
            for (let px = 0; px < w; px += pixelSize) {
                const gridX = Math.floor((x + px) / pixelSize) % 4;
                const bayerVal = this.BAYER_4X4[gridY][gridX];
                ctx.fillStyle = threshold > bayerVal ? color1 : color2;
                ctx.fillRect(x + px, y + py, pixelSize, pixelSize);
            }
        }
    }

    /**
     * 1. PIXEL-ART EARTH BACKGROUND SPRITE
     * Spherical globe rendered with pixel banding, Bayer terminator dithering,
     * stepped continents, cloud formations, and night-side city clusters.
     */
    static generateEarth(scene) {
        const size = 640;
        const pixelScale = 3; // 3x3 pixel block
        const { canvas, ctx } = this.createCanvas(size, size);
        const center = size / 2;
        const radius = size * 0.40;
        const rSq = radius * radius;

        // Step 1: Draw Pixel Globe with Bayer Dithering Terminator
        for (let y = center - radius; y <= center + radius; y += pixelScale) {
            const dy = y - center;
            const rowWidthSq = rSq - dy * dy;
            if (rowWidthSq <= 0) continue;
            const halfRow = Math.sqrt(rowWidthSq);

            const gridY = Math.floor(y / pixelScale) % 4;

            for (let x = center - halfRow; x <= center + halfRow; x += pixelScale) {
                const dx = x - center;
                const distSq = dx * dx + dy * dy;
                if (distSq > rSq) continue;

                // Sphere normal mapping
                const nz = Math.sqrt(Math.max(0, 1 - (dx * dx + dy * dy) / rSq));
                const nx = dx / radius;
                const ny = dy / radius;

                // Sun direction from upper-left
                const sunLight = nx * (-0.75) + ny * (-0.55) + nz * 0.85;

                // Procedural pixel continent mask
                const lon = Math.atan2(dx, nz) * 2.8;
                const lat = ny * 3.2;
                const landNoise = Math.sin(lon * 2.2 + lat) * Math.cos(lat * 3.0 - lon);
                const isLand = landNoise > 0.15;
                const isMountain = landNoise > 0.55;

                // Cloud belt noise
                const cloudNoise = Math.sin(lat * 8.0 + lon * 1.5) * Math.cos(lat * 3.5);
                const isCloud = cloudNoise > 0.45 && sunLight > -0.15;

                const gridX = Math.floor(x / pixelScale) % 4;
                const bayerVal = this.BAYER_4X4[gridY][gridX];

                let pixelColor = this.PALETTE.EARTH_OCEAN_DEEP;

                if (sunLight < -0.18) {
                    // Deep Night Hemisphere
                    pixelColor = this.PALETTE.VOID;
                    // Night city lights on continents
                    if (isLand && (gridX + gridY * 2) % 7 === 0 && Math.random() < 0.22) {
                        pixelColor = this.PALETTE.AMBER_GLOW;
                    }
                } else if (sunLight < 0.22) {
                    // Terminator Dither Zone
                    const tFactor = (sunLight + 0.18) / 0.40;
                    const thresh = Math.round(tFactor * 16);
                    if (thresh > bayerVal) {
                        pixelColor = isLand ? this.PALETTE.EARTH_LAND_DARK : this.PALETTE.EARTH_OCEAN_MID;
                    } else {
                        pixelColor = this.PALETTE.SPACE_NAVY;
                    }
                } else {
                    // Sunlit Hemisphere
                    if (isCloud) {
                        pixelColor = sunLight > 0.65 ? this.PALETTE.WHITE : this.PALETTE.HULL_BRIGHT;
                    } else if (isLand) {
                        if (isMountain) pixelColor = this.PALETTE.WHITE;
                        else if (sunLight > 0.60) pixelColor = this.PALETTE.EARTH_LAND_LIGHT;
                        else pixelColor = this.PALETTE.EARTH_LAND_MID;
                    } else {
                        // Ocean banding
                        if (sunLight > 0.70) pixelColor = this.PALETTE.EARTH_OCEAN_COAST;
                        else if (sunLight > 0.45) pixelColor = this.PALETTE.EARTH_OCEAN_LIGHT;
                        else pixelColor = this.PALETTE.EARTH_OCEAN_MID;
                    }
                }

                ctx.fillStyle = pixelColor;
                ctx.fillRect(Math.floor(x), Math.floor(y), pixelScale, pixelScale);
            }
        }

        // Step 2: Pixelated Atmosphere Rim
        const rimRadius = radius + pixelScale * 2;
        ctx.strokeStyle = this.PALETTE.CYAN_GLOW;
        ctx.lineWidth = pixelScale;
        ctx.setLineDash([pixelScale * 3, pixelScale * 2]);
        ctx.beginPath();
        ctx.arc(center, center, rimRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        this.registerTexture(scene, 'earth_bg', canvas);
    }

    /**
     * 2. PIXEL-ART SPACE STATION (AEGIS ORBITAL DEPOT)
     * Modular orbital facility with octagonal central hub, 4 pixel solar trusses,
     * rotating beacon ring, and central emerald smelter aperture.
     */
    static generateSpaceStation(scene) {
        const size = 280;
        const { canvas, ctx } = this.createCanvas(size, size);
        const c = size / 2;

        // A. Solar Array Trusses (4 cardinal directions)
        const trussLen = 70;
        const panelW = 44;
        const panelH = 18;

        const drawPixelSolarWing = (angle) => {
            ctx.save();
            ctx.translate(c, c);
            ctx.rotate(angle);

            // Metal Truss Strut
            this.drawPixelRect(ctx, 24, -3, trussLen - 24, 6, this.PALETTE.HULL_MID, this.PALETTE.OUTLINE);

            // Solar Array Panel (Pixel Grid with Dither)
            const sx = trussLen - 6;
            const sy = -panelH / 2;
            this.drawPixelRect(ctx, sx, sy, panelW, panelH, this.PALETTE.CYAN_DEEP, this.PALETTE.OUTLINE);

            // Photovoltaic pixel cells
            for (let px = sx + 4; px < sx + panelW - 4; px += 8) {
                for (let py = sy + 3; py < sy + panelH - 3; py += 6) {
                    ctx.fillStyle = this.PALETTE.CYAN_BRIGHT;
                    ctx.fillRect(px, py, 6, 4);
                    ctx.fillStyle = this.PALETTE.CYAN_GLOW;
                    ctx.fillRect(px + 1, py + 1, 2, 2);
                }
            }

            ctx.restore();
        };

        drawPixelSolarWing(0);
        drawPixelSolarWing(Math.PI / 2);
        drawPixelSolarWing(Math.PI);
        drawPixelSolarWing(Math.PI * 1.5);

        // B. Outer Rotating Ring Structure with Pixel Modules
        const ringRadius = 52;
        ctx.strokeStyle = this.PALETTE.OUTLINE;
        ctx.lineWidth = 14;
        ctx.beginPath();
        ctx.arc(c, c, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = this.PALETTE.HULL_LIGHT;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(c, c, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = this.PALETTE.CYAN_MID;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c, c, ringRadius, 0, Math.PI * 2);
        ctx.stroke();

        // 8 Perimeter Docking Pods with Pixel Navigation Beacons
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const px = c + Math.cos(angle) * ringRadius;
            const py = c + Math.sin(angle) * ringRadius;

            this.drawPixelRect(ctx, px - 6, py - 6, 12, 12, this.PALETTE.HULL_BRIGHT, this.PALETTE.OUTLINE);
            // Blinking beacon core
            const beaconColor = i % 2 === 0 ? this.PALETTE.GREEN_BRIGHT : this.PALETTE.AMBER_BRIGHT;
            this.drawPixelRect(ctx, px - 2, py - 2, 4, 4, beaconColor, this.PALETTE.OUTLINE);
        }

        // C. Central Octagonal Habitation Core
        const coreR = 34;
        this.drawPixelRect(ctx, c - coreR, c - coreR, coreR * 2, coreR * 2, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
        // Beveled corners
        ctx.fillStyle = this.PALETTE.OUTLINE;
        ctx.fillRect(c - coreR - 1, c - coreR - 1, 10, 10);
        ctx.fillRect(c + coreR - 9, c - coreR - 1, 10, 10);
        ctx.fillRect(c - coreR - 1, c + coreR - 9, 10, 10);
        ctx.fillRect(c + coreR - 9, c + coreR - 9, 10, 10);

        // Core armor ring
        this.drawPixelRect(ctx, c - 24, c - 24, 48, 48, this.PALETTE.SPACE_NAVY, this.PALETTE.CYAN_BRIGHT);

        // D. Central Smelter Aperture / Funnel
        const aperR = 15;
        this.drawPixelRect(ctx, c - aperR, c - aperR, aperR * 2, aperR * 2, this.PALETTE.GREEN_DEEP, this.PALETTE.GREEN_GLOW);

        // Pixel Recycling Cross
        ctx.fillStyle = this.PALETTE.GREEN_WHITE;
        ctx.fillRect(c - 8, c - 2, 16, 4);
        ctx.fillRect(c - 2, c - 8, 4, 16);

        this.registerTexture(scene, 'space_station', canvas);

        // E. Docking Perimeter Ring
        const pSize = 380;
        const pCanvas = this.createCanvas(pSize, pSize);
        const pc = pSize / 2;
        const pr = pSize * 0.44;

        pCanvas.ctx.strokeStyle = this.PALETTE.GREEN_BRIGHT;
        pCanvas.ctx.lineWidth = 3;
        pCanvas.ctx.setLineDash([12, 8]);
        pCanvas.ctx.beginPath();
        pCanvas.ctx.arc(pc, pc, pr, 0, Math.PI * 2);
        pCanvas.ctx.stroke();

        this.registerTexture(scene, 'station_perimeter', pCanvas.canvas);
    }

    /**
     * 3. PIXEL-ART SPACECRAFT SPRITES (Scout, Collector, Heavy Lifter)
     * Facing angle 0 radians (pointing RIGHT).
     * High-contrast pixel outlines, cockpit canopies with glint, panel banding.
     */
    static generateShips(scene) {
        // --- 3A. Scout (Aero-Dart) ---
        {
            const size = 64;
            const { canvas, ctx } = this.createCanvas(size, size);
            const cx = size / 2, cy = size / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Dark Pixel Outline (Base silhouette)
            ctx.fillStyle = this.PALETTE.OUTLINE;
            ctx.beginPath();
            ctx.moveTo(28, 0);
            ctx.lineTo(-18, -20);
            ctx.lineTo(-24, -14);
            ctx.lineTo(-14, -6);
            ctx.lineTo(-22, -6);
            ctx.lineTo(-22, 6);
            ctx.lineTo(-14, 6);
            ctx.lineTo(-24, 14);
            ctx.lineTo(-18, 20);
            ctx.closePath();
            ctx.fill();

            // Wing Aerofoils
            ctx.fillStyle = this.PALETTE.CYAN_MID;
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-16, -18);
            ctx.lineTo(-12, -6);
            ctx.lineTo(-12, 6);
            ctx.lineTo(-16, 18);
            ctx.closePath();
            ctx.fill();

            // Main Titanium Fuselage
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.beginPath();
            ctx.moveTo(26, 0);       // Needle nose
            ctx.lineTo(-12, -12);
            ctx.lineTo(-18, -5);
            ctx.lineTo(-18, 5);
            ctx.lineTo(-12, 12);
            ctx.closePath();
            ctx.fill();

            // Hull Panel Shading (Banding)
            ctx.fillStyle = this.PALETTE.HULL_LIGHT;
            ctx.fillRect(-12, -4, 8, 8);

            // Cockpit Canopy (Cyber Cyan with Glint Pixel)
            ctx.fillStyle = this.PALETTE.CYAN_DEEP;
            ctx.fillRect(4, -4, 12, 8);
            ctx.fillStyle = this.PALETTE.CYAN_GLOW;
            ctx.fillRect(6, -3, 8, 6);
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.fillRect(10, -2, 2, 2); // Canopy highlight

            // Twin RCS Thruster Blocks
            this.drawPixelRect(ctx, -22, -8, 6, 4, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -22, 4, 6, 4, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            // Thruster nozzle glow
            ctx.fillStyle = this.PALETTE.CYAN_GLOW;
            ctx.fillRect(-22, -7, 2, 2);
            ctx.fillRect(-22, 5, 2, 2);

            ctx.restore();
            this.registerTexture(scene, 'ship_scout', canvas);
        }

        // --- 3B. Collector (Orbital Mule) ---
        {
            const size = 80;
            const { canvas, ctx } = this.createCanvas(size, size);
            const cx = size / 2, cy = size / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Dark Pixel Silhouette Outline
            ctx.fillStyle = this.PALETTE.OUTLINE;
            ctx.beginPath();
            ctx.moveTo(30, -14);
            ctx.lineTo(34, 0);
            ctx.lineTo(30, 14);
            ctx.lineTo(-24, 22);
            ctx.lineTo(-30, -22);
            ctx.closePath();
            ctx.fill();

            // Broad Industrial Hull Body
            ctx.fillStyle = this.PALETTE.HULL_BRIGHT;
            ctx.beginPath();
            ctx.moveTo(28, -12);
            ctx.lineTo(32, 0);
            ctx.lineTo(28, 12);
            ctx.lineTo(-22, 20);
            ctx.lineTo(-26, -20);
            ctx.closePath();
            ctx.fill();

            // Cargo Hold Bay (Flank pods)
            this.drawPixelRect(ctx, -14, -20, 26, 8, this.PALETTE.CYAN_MID, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -14, 12, 26, 8, this.PALETTE.CYAN_MID, this.PALETTE.OUTLINE);

            // Caution Hazard Stripes (Amber / Dark)
            for (let i = -10; i < 16; i += 6) {
                ctx.fillStyle = this.PALETTE.AMBER_BRIGHT;
                ctx.fillRect(i, -12, 3, 24);
                ctx.fillStyle = this.PALETTE.HULL_DARK;
                ctx.fillRect(i + 3, -12, 3, 24);
            }

            // Central Cargo Container Intake
            this.drawPixelRect(ctx, -12, -7, 18, 14, this.PALETTE.SPACE_NAVY, this.PALETTE.CYAN_GLOW);

            // Cockpit Forward Bubble
            this.drawPixelRect(ctx, 18, -4, 8, 8, this.PALETTE.CYAN_GLOW, this.PALETTE.OUTLINE);
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.fillRect(22, -3, 2, 2);

            // Twin Heavy Main Thruster Bells
            this.drawPixelRect(ctx, -28, -14, 8, 8, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -28, 6, 8, 8, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            ctx.fillStyle = this.PALETTE.AMBER_GLOW;
            ctx.fillRect(-28, -12, 2, 4);
            ctx.fillRect(-28, 8, 2, 4);

            ctx.restore();
            this.registerTexture(scene, 'ship_collector', canvas);
        }

        // --- 3C. Heavy Lifter (Titan Hauler) ---
        {
            const size = 96;
            const { canvas, ctx } = this.createCanvas(size, size);
            const cx = size / 2, cy = size / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Twin Catamaran Booms (Amber Construction Chassis)
            // Top Boom
            this.drawPixelRect(ctx, -28, -26, 54, 14, this.PALETTE.AMBER_MID, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -22, -24, 42, 6, this.PALETTE.AMBER_BRIGHT, null);
            // Bottom Boom
            this.drawPixelRect(ctx, -28, 12, 54, 14, this.PALETTE.AMBER_MID, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -22, 18, 42, 6, this.PALETTE.AMBER_BRIGHT, null);

            // Central Reinforced Bridge & Crossbeam
            this.drawPixelRect(ctx, -16, -12, 36, 24, this.PALETTE.HULL_BRIGHT, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -10, -8, 24, 16, this.PALETTE.HULL_MID, null);

            // Cockpit Bridge Glass
            this.drawPixelRect(ctx, 12, -4, 10, 8, this.PALETTE.CYAN_GLOW, this.PALETTE.OUTLINE);
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.fillRect(16, -3, 3, 2);

            // Forward Magnetic Towing Pylons
            this.drawPixelRect(ctx, 26, -22, 14, 6, this.PALETTE.HULL_LIGHT, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, 26, 16, 14, 6, this.PALETTE.HULL_LIGHT, this.PALETTE.OUTLINE);
            ctx.fillStyle = this.PALETTE.CYAN_GLOW;
            ctx.fillRect(38, -21, 3, 4);
            ctx.fillRect(38, 17, 3, 4);

            // Quad Rear Thruster Array
            this.drawPixelRect(ctx, -34, -25, 6, 5, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -34, -18, 6, 5, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -34, 13, 6, 5, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -34, 20, 6, 5, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);

            ctx.restore();
            this.registerTexture(scene, 'ship_lifter', canvas);
        }
    }

    /**
     * 4. PIXEL-ART DEBRIS TYPES
     * Fragment, Solar Array, Cubesat, Booster, Satellite, Fusion Core.
     */
    static generateDebris(scene) {
        // --- 4A. Fragment (Sharp Faceted Kinetic Shard) ---
        {
            const size = 32;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.save();
            ctx.translate(c, c);

            // Dark outline
            ctx.fillStyle = this.PALETTE.OUTLINE;
            ctx.beginPath();
            ctx.moveTo(-10, -6);
            ctx.lineTo(8, -12);
            ctx.lineTo(12, 6);
            ctx.lineTo(-4, 12);
            ctx.closePath();
            ctx.fill();

            // Facet 1 (Light metallic highlight)
            ctx.fillStyle = this.PALETTE.HULL_BRIGHT;
            ctx.beginPath();
            ctx.moveTo(-8, -5);
            ctx.lineTo(6, -10);
            ctx.lineTo(2, 0);
            ctx.closePath();
            ctx.fill();

            // Facet 2 (Shadowed metallic face)
            ctx.fillStyle = this.PALETTE.HULL_DARK;
            ctx.beginPath();
            ctx.moveTo(6, -10);
            ctx.lineTo(10, 5);
            ctx.lineTo(-3, 10);
            ctx.lineTo(2, 0);
            ctx.closePath();
            ctx.fill();

            ctx.restore();
            this.registerTexture(scene, 'debris_fragment', canvas);
        }

        // --- 4B. Solar Array (Photovoltaic Pixel Matrix) ---
        {
            const size = 48;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.save();
            ctx.translate(c, c);
            ctx.rotate(0.25);

            // Gold / Amber Structural Frame
            this.drawPixelRect(ctx, -18, -10, 36, 20, this.PALETTE.AMBER_MID, this.PALETTE.OUTLINE);

            // 6 Individual Photovoltaic Pixel Cells
            for (let col = -15; col <= 9; col += 9) {
                for (let row = -7; row <= 2; row += 8) {
                    this.drawPixelRect(ctx, col, row, 7, 6, this.PALETTE.CYAN_DEEP, null);
                    ctx.fillStyle = this.PALETTE.CYAN_BRIGHT;
                    ctx.fillRect(col + 1, row + 1, 5, 4);
                    ctx.fillStyle = this.PALETTE.CYAN_GLOW;
                    ctx.fillRect(col + 2, row + 2, 2, 2);
                }
            }

            // Severed Copper Wires
            ctx.fillStyle = this.PALETTE.AMBER_GLOW;
            ctx.fillRect(-22, -2, 4, 2);
            ctx.fillRect(18, 3, 4, 2);

            ctx.restore();
            this.registerTexture(scene, 'debris_solar', canvas);
        }

        // --- 4C. Cubesat (1U/3U Miniaturized Satellite) ---
        {
            const size = 48;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.save();
            ctx.translate(c, c);

            // Gold Foil Mylar Insulated Cube
            this.drawPixelRect(ctx, -12, -12, 24, 24, this.PALETTE.AMBER_MID, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, -10, -10, 20, 20, this.PALETTE.AMBER_BRIGHT, null);

            // Optical Sensor Eye (Aperture)
            this.drawPixelRect(ctx, -4, -4, 8, 8, this.PALETTE.SPACE_NAVY, this.PALETTE.CYAN_GLOW);
            ctx.fillStyle = this.PALETTE.CYAN_GLOW;
            ctx.fillRect(-2, -2, 4, 4);

            // Side Folded Solar Panel Tabs
            this.drawPixelRect(ctx, -18, -6, 6, 12, this.PALETTE.CYAN_MID, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, 12, -6, 6, 12, this.PALETTE.CYAN_MID, this.PALETTE.OUTLINE);

            // Whip Antenna
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.fillRect(0, -20, 2, 8);

            ctx.restore();
            this.registerTexture(scene, 'debris_cubesat', canvas);
        }

        // --- 4D. Spent Rocket Booster Stage ---
        {
            const size = 64;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.save();
            ctx.translate(c, c);
            ctx.rotate(Math.PI / 4);

            // Cylindrical Tank (Interstage & Ribs)
            this.drawPixelRect(ctx, -22, -9, 44, 18, this.PALETTE.HULL_BRIGHT, this.PALETTE.OUTLINE);
            // Weld Ring Bands
            ctx.fillStyle = this.PALETTE.HULL_DARK;
            ctx.fillRect(-10, -9, 3, 18);
            ctx.fillRect(6, -9, 3, 18);

            // Red Hazard Warning Stencil
            ctx.fillStyle = this.PALETTE.RED_BRIGHT;
            ctx.fillRect(-2, -9, 4, 18);

            // Flared Rocket Nozzle Bell
            ctx.fillStyle = this.PALETTE.HULL_DARK;
            ctx.beginPath();
            ctx.moveTo(-22, -6);
            ctx.lineTo(-30, -10);
            ctx.lineTo(-30, 10);
            ctx.lineTo(-22, 6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = this.PALETTE.OUTLINE;
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.restore();
            this.registerTexture(scene, 'debris_booster', canvas);
        }

        // --- 4E. Derelict Communications Satellite ---
        {
            const size = 64;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.save();
            ctx.translate(c, c);

            // Parabolic Dish Antenna (Stepped pixel arc)
            ctx.strokeStyle = this.PALETTE.HULL_LIGHT;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(-14, 0, 12, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();

            // Central Satellite Bus Cube
            this.drawPixelRect(ctx, -6, -10, 20, 20, this.PALETTE.HULL_MID, this.PALETTE.OUTLINE);
            // Sensor indicator
            this.drawPixelRect(ctx, 4, -4, 6, 6, this.PALETTE.GREEN_GLOW, this.PALETTE.OUTLINE);

            // Extended Solar Wings
            this.drawPixelRect(ctx, 14, -22, 10, 44, this.PALETTE.CYAN_DEEP, this.PALETTE.OUTLINE);
            for (let py = -18; py <= 14; py += 8) {
                ctx.fillStyle = this.PALETTE.CYAN_BRIGHT;
                ctx.fillRect(16, py, 6, 5);
            }

            ctx.restore();
            this.registerTexture(scene, 'debris_satellite', canvas);
        }

        // --- 4F. Prototype Fusion Core ---
        {
            const size = 48;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            // Hexagonal Magnetic Containment Ring
            this.drawPixelRect(ctx, c - 14, c - 14, 28, 28, this.PALETTE.SPACE_NAVY, this.PALETTE.OUTLINE);
            // Inner Core
            this.drawPixelRect(ctx, c - 10, c - 10, 20, 20, this.PALETTE.RED_DEEP, this.PALETTE.PURPLE_GLOW);

            // Pulsing Plasma Center
            this.drawPixelRect(ctx, c - 5, c - 5, 10, 10, this.PALETTE.RED_GLOW, this.PALETTE.WHITE);
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.fillRect(c - 2, c - 2, 4, 4);

            this.registerTexture(scene, 'debris_core', canvas);
        }
    }

    /**
     * 5. PIXEL-ART HAZARDS
     * Hidden Micro-Debris, Venting Rocket Booster, Nuclear RTG Satellite.
     */
    static generateHazards(scene) {
        // --- 5A. Hidden Micro-Debris (Low-observability stealth shard) ---
        {
            const size = 48;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.save();
            ctx.translate(c, c);

            // Stealth Faceted Carbon Body
            ctx.fillStyle = this.PALETTE.OUTLINE;
            ctx.beginPath();
            ctx.moveTo(-12, -4);
            ctx.lineTo(-2, -14);
            ctx.lineTo(12, -6);
            ctx.lineTo(14, 8);
            ctx.lineTo(4, 14);
            ctx.lineTo(-10, 8);
            ctx.closePath();
            ctx.fill();

            // Main Face (Dark Slate)
            ctx.fillStyle = this.PALETTE.SPACE_NAVY;
            ctx.beginPath();
            ctx.moveTo(-10, -3);
            ctx.lineTo(-1, -12);
            ctx.lineTo(10, -5);
            ctx.lineTo(12, 7);
            ctx.lineTo(3, 12);
            ctx.lineTo(-8, 7);
            ctx.closePath();
            ctx.fill();

            // Stealth Facet Edge Highlight
            ctx.strokeStyle = this.PALETTE.HULL_MID;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(-1, -12);
            ctx.lineTo(2, 2);
            ctx.lineTo(12, 7);
            ctx.moveTo(2, 2);
            ctx.lineTo(-8, 7);
            ctx.stroke();

            ctx.restore();
            this.registerTexture(scene, 'hazard_hidden_debris', canvas);
            this.registerTexture(scene, 'hazard_meteoroid', canvas);
        }

        // --- 5B. Venting Rocket Upper-Stage Hazard ---
        {
            const size = 64;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.save();
            ctx.translate(c, c);

            // Cylindrical Pressure Vessel Hull
            this.drawPixelRect(ctx, -10, -18, 20, 28, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);
            // Forward Bulkhead Dome
            this.drawPixelRect(ctx, -8, -24, 16, 6, this.PALETTE.HULL_MID, this.PALETTE.OUTLINE);

            // Hypergolic Hazard Caution Chevrons (Amber & Red)
            ctx.fillStyle = this.PALETTE.AMBER_BRIGHT;
            ctx.fillRect(-8, -12, 16, 4);
            ctx.fillStyle = this.PALETTE.RED_BRIGHT;
            ctx.fillRect(-8, -4, 16, 4);

            // Flared Exhaust Nozzle (Vent Origin)
            ctx.fillStyle = this.PALETTE.OUTLINE;
            ctx.beginPath();
            ctx.moveTo(-5, 10);
            ctx.lineTo(5, 10);
            ctx.lineTo(8, 18);
            ctx.lineTo(-8, 18);
            ctx.closePath();
            ctx.fill();

            ctx.fillStyle = this.PALETTE.AMBER_MID;
            ctx.beginPath();
            ctx.moveTo(-4, 10);
            ctx.lineTo(4, 10);
            ctx.lineTo(7, 16);
            ctx.lineTo(-7, 16);
            ctx.closePath();
            ctx.fill();

            // Vent Pressure Valve Indicator
            this.drawPixelRect(ctx, -2, 2, 4, 4, this.PALETTE.RED_GLOW, this.PALETTE.OUTLINE);

            ctx.restore();
            this.registerTexture(scene, 'hazard_venting_rocket', canvas);
            this.registerTexture(scene, 'hazard_hypergolic', canvas);
        }

        // --- 5C. Nuclear RTG Satellite Hazard ---
        {
            const size = 64;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            // Octagonal Derelict Reactor Core
            this.drawPixelRect(ctx, c - 14, c - 14, 28, 28, this.PALETTE.SPACE_NAVY, this.PALETTE.OUTLINE);

            // Stepped Cooling Radiators
            this.drawPixelRect(ctx, c - 20, c - 4, 6, 8, this.PALETTE.HULL_MID, this.PALETTE.OUTLINE);
            this.drawPixelRect(ctx, c + 14, c - 4, 6, 8, this.PALETTE.HULL_MID, this.PALETTE.OUTLINE);

            // Glowing Trefoil Radiation Hazard Icon
            this.drawPixelRect(ctx, c - 3, c - 3, 6, 6, this.PALETTE.GREEN_GLOW, null);

            // Trefoil Blades
            ctx.fillStyle = this.PALETTE.GREEN_BRIGHT;
            ctx.fillRect(c - 2, c - 10, 4, 4);
            ctx.fillRect(c - 9, c + 4, 4, 4);
            ctx.fillRect(c + 5, c + 4, 4, 4);

            this.registerTexture(scene, 'hazard_nuclear', canvas);
        }
    }

    /**
     * 6. PIXEL-ART EQUIPMENT SPRITES
     */
    static generateEquipment(scene) {
        // Robotic Claw
        {
            const size = 32;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            // Base mounting socket
            this.drawPixelRect(ctx, c - 10, c - 4, 6, 8, this.PALETTE.HULL_DARK, this.PALETTE.OUTLINE);

            // Two articulating claw tongs
            ctx.fillStyle = this.PALETTE.CYAN_GLOW;
            ctx.fillRect(c - 4, c - 8, 8, 3);
            ctx.fillRect(c + 4, c - 6, 4, 4);
            ctx.fillRect(c - 4, c + 5, 8, 3);
            ctx.fillRect(c + 4, c + 2, 4, 4);

            this.registerTexture(scene, 'equip_arm_claw', canvas);
        }

        // Capture Net Mesh
        {
            const size = 128;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            const r = size * 0.44;

            // Pixelated Hexagonal Energy Net Ring
            ctx.strokeStyle = this.PALETTE.CYAN_GLOW;
            ctx.lineWidth = 2;
            ctx.setLineDash([6, 4]);
            ctx.beginPath();
            ctx.arc(c, c, r, 0, Math.PI * 2);
            ctx.stroke();

            // Cross pixel grid rays
            ctx.strokeStyle = this.PALETTE.CYAN_MID;
            ctx.lineWidth = 1.5;
            for (let rad = 14; rad < r; rad += 16) {
                ctx.beginPath();
                ctx.arc(c, c, rad, 0, Math.PI * 2);
                ctx.stroke();
            }

            this.registerTexture(scene, 'equip_net', canvas);
        }
    }

    /**
     * 7. DISCRETE PIXEL PARTICLES & FX SPRITES
     * Thrusters, sparks, recycling shimmer, smoke, shockwaves.
     */
    static generateParticles(scene) {
        // Thruster exhaust flame (Square pixel flame core)
        {
            const size = 16;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            this.drawPixelRect(ctx, c - 5, c - 5, 10, 10, this.PALETTE.CYAN_MID, null);
            this.drawPixelRect(ctx, c - 3, c - 3, 6, 6, this.PALETTE.CYAN_GLOW, null);
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.fillRect(c - 1, c - 1, 2, 2);

            this.registerTexture(scene, 'particle_thruster', canvas);
        }

        // Collision spark (Crisp 4-point cross star)
        {
            const size = 12;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.fillStyle = this.PALETTE.AMBER_GLOW;
            ctx.fillRect(c - 4, c - 1, 8, 2);
            ctx.fillRect(c - 1, c - 4, 2, 8);
            ctx.fillStyle = this.PALETTE.WHITE;
            ctx.fillRect(c - 1, c - 1, 2, 2);

            this.registerTexture(scene, 'particle_spark', canvas);
        }

        // Station recycling beam shimmer
        {
            const size = 12;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.fillStyle = this.PALETTE.GREEN_BRIGHT;
            ctx.fillRect(c - 3, c - 3, 6, 6);
            ctx.fillStyle = this.PALETTE.GREEN_WHITE;
            ctx.fillRect(c - 1, c - 1, 2, 2);

            this.registerTexture(scene, 'particle_recycle', canvas);
        }

        // Smoke puff (Explosions / venting)
        {
            const size = 16;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            this.drawPixelRect(ctx, c - 5, c - 5, 10, 10, this.PALETTE.HULL_MID, null);
            this.drawPixelRect(ctx, c - 3, c - 3, 6, 6, this.PALETTE.HULL_LIGHT, null);

            this.registerTexture(scene, 'particle_smoke', canvas);
        }

        // Expanding pixel shockwave ring
        {
            const size = 32;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.strokeStyle = this.PALETTE.CYAN_GLOW;
            ctx.lineWidth = 2;
            ctx.strokeRect(4, 4, 24, 24);

            this.registerTexture(scene, 'particle_shockwave', canvas);
        }
    }
}

if (typeof window !== 'undefined') {
    window.TextureGenerator = TextureGenerator;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TextureGenerator };
}
