/**
 * ORBITAL CLEANUP: MISSION ZERO
 * Procedural Texture Generator
 * Dynamically creates high-resolution, sci-fi vector sprites and space backdrops
 */

class TextureGenerator {
    static generateAll(scene) {
        this.generateEarth(scene);
        this.generateSpaceStation(scene);
        this.generateShips(scene);
        this.generateDebris(scene);
        this.generateHazards(scene);
        this.generateEquipment(scene);
        this.generateParticles(scene);
    }

    // Helper: Create offscreen canvas
    static createCanvas(width, height) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        return { canvas, ctx };
    }

    // Register canvas into Phaser's Texture Manager
    static registerTexture(scene, key, canvas) {
        if (scene.textures.exists(key)) {
            scene.textures.remove(key);
        }
        scene.textures.addCanvas(key, canvas);
    }

    /**
     * 1. Animated / Background Earth Sprite
     */
    static generateEarth(scene) {
        const size = 900;
        const { canvas, ctx } = this.createCanvas(size, size);
        const center = size / 2;
        const radius = size * 0.42;

        // Crisp hard-edged atmosphere rim
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(center, center, radius + 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(center, center, radius + 8, 0, Math.PI * 2);
        ctx.stroke();

        // Base Ocean Sphere
        ctx.save();
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.clip();

        const oceanGrad = ctx.createRadialGradient(center - radius * 0.35, center - radius * 0.35, radius * 0.2, center, center, radius);
        oceanGrad.addColorStop(0, '#1e40af'); // deep luminous blue
        oceanGrad.addColorStop(0.6, '#0f172a');
        oceanGrad.addColorStop(1, '#020617'); // dark space limb
        ctx.fillStyle = oceanGrad;
        ctx.fillRect(0, 0, size, size);

        // Continents (Stylized continents and archipelagos)
        ctx.fillStyle = '#15803d'; // Lush green
        const drawLandmass = (ox, oy, scale) => {
            ctx.beginPath();
            ctx.ellipse(ox, oy, 70 * scale, 120 * scale, Math.PI / 6, 0, Math.PI * 2);
            ctx.ellipse(ox + 40 * scale, oy + 60 * scale, 50 * scale, 80 * scale, -Math.PI / 4, 0, Math.PI * 2);
            ctx.ellipse(ox - 30 * scale, oy - 50 * scale, 60 * scale, 45 * scale, 0, 0, Math.PI * 2);
            ctx.fill();
        };

        drawLandmass(center - 80, center - 60, 1.2);
        drawLandmass(center + 120, center + 40, 1.4);
        drawLandmass(center - 160, center + 140, 0.9);
        drawLandmass(center + 60, center - 150, 0.8);

        // Swirling cloud belts
        ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
        for (let i = 0; i < 7; i++) {
            ctx.beginPath();
            const y = center - radius * 0.7 + (i * radius * 1.4) / 6;
            ctx.ellipse(center + Math.sin(i * 1.2) * 50, y, radius * 0.85, 24 + (i % 3) * 8, Math.sin(i) * 0.15, 0, Math.PI * 2);
            ctx.fill();
        }

        // Night side shadow overlay
        const shadowGrad = ctx.createRadialGradient(center + radius * 0.6, center + radius * 0.6, radius * 0.2, center, center, radius);
        shadowGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        shadowGrad.addColorStop(0.55, 'rgba(2, 6, 23, 0.4)');
        shadowGrad.addColorStop(0.85, 'rgba(2, 6, 23, 0.85)');
        shadowGrad.addColorStop(1, 'rgba(2, 6, 23, 0.98)');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(0, 0, size, size);

        // Golden city lights in dark zones
        ctx.fillStyle = 'rgba(251, 191, 36, 0.75)';
        for (let i = 0; i < 80; i++) {
            const angle = Math.random() * Math.PI + Math.PI * 0.4;
            const dist = radius * (0.3 + Math.random() * 0.6);
            const lx = center + Math.cos(angle) * dist;
            const ly = center + Math.sin(angle) * dist;
            ctx.fillRect(lx, ly, 2.5, 2.5);
        }

        ctx.restore();

        // Luminous atmosphere rim
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, Math.PI * 2);
        ctx.stroke();

        this.registerTexture(scene, 'earth_bg', canvas);
    }

    /**
     * 2. Orbital Recycling Station: Aegis Orbital Depot
     */
    static generateSpaceStation(scene) {
        const size = 320;
        const { canvas, ctx } = this.createCanvas(size, size);
        const center = size / 2;

        // Outer docking perimeter guide ring
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.setLineDash([8, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(center, center, 140, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Four Solar Array wings
        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        const wingDist = 80;
        const wingW = 75;
        const wingH = 26;

        const drawWing = (angle) => {
            ctx.save();
            ctx.translate(center, center);
            ctx.rotate(angle);
            // Solar strut
            ctx.fillStyle = '#475569';
            ctx.fillRect(30, -4, wingDist - 30, 8);
            // Solar panels
            ctx.fillStyle = '#0369a1';
            ctx.fillRect(wingDist, -wingH / 2, wingW, wingH);
            ctx.strokeRect(wingDist, -wingH / 2, wingW, wingH);
            // Grid lines
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            for (let x = wingDist + 15; x < wingDist + wingW; x += 15) {
                ctx.beginPath();
                ctx.moveTo(x, -wingH / 2);
                ctx.lineTo(x, wingH / 2);
                ctx.stroke();
            }
            ctx.restore();
        };

        drawWing(0);
        drawWing(Math.PI / 2);
        drawWing(Math.PI);
        drawWing(Math.PI * 1.5);

        // Outer rotating ring truss
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 12;
        ctx.beginPath();
        ctx.arc(center, center, 62, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#00f3ff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(center, center, 62, 0, Math.PI * 2);
        ctx.stroke();

        // Ring modules
        for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI * 2) / 8;
            const mx = center + Math.cos(angle) * 62;
            const my = center + Math.sin(angle) * 62;
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.arc(mx, my, 7, 0, Math.PI * 2);
            ctx.fill();
            // Blinking beacon colors
            ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#f59e0b';
            ctx.beginPath();
            ctx.arc(mx, my, 3.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Central Habitation & Recycling Core
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(center, center, 42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 4;
        ctx.stroke();

        // Central Recycling Funnel / Tractor Aperture
        const coreGrad = ctx.createRadialGradient(center, center, 4, center, center, 28);
        coreGrad.addColorStop(0, '#a7f3d0');
        coreGrad.addColorStop(0.5, '#10b981');
        coreGrad.addColorStop(1, '#064e3b');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(center, center, 26, 0, Math.PI * 2);
        ctx.fill();

        // Recycling cross symbol
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(center - 12, center);
        ctx.lineTo(center + 12, center);
        ctx.moveTo(center, center - 12);
        ctx.lineTo(center, center + 12);
        ctx.stroke();

        this.registerTexture(scene, 'space_station', canvas);

        // Docking Perimeter boundary ring
        const pSize = 440;
        const pCanvas = this.createCanvas(pSize, pSize);
        pCanvas.ctx.strokeStyle = 'rgba(16, 185, 129, 0.55)';
        pCanvas.ctx.setLineDash([14, 10]);
        pCanvas.ctx.lineWidth = 3;
        pCanvas.ctx.beginPath();
        pCanvas.ctx.arc(pSize / 2, pSize / 2, pSize * 0.44, 0, Math.PI * 2);
        pCanvas.ctx.stroke();

        pCanvas.ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        pCanvas.ctx.fill();

        this.registerTexture(scene, 'station_perimeter', pCanvas.canvas);
    }

    /**
     * 3. Spacecraft Sprites: Scout, Collector, Heavy Lifter
     */
    static generateShips(scene) {
        // --- 3A. Scout (Aero-Dart) ---
        {
            const size = 96;
            const { canvas, ctx } = this.createCanvas(size, size);
            const cx = size / 2, cy = size / 2;

            // Pointing RIGHT (0 radians in Phaser standard)
            // Sleek delta needle design
            ctx.save();
            ctx.translate(cx, cy);

            // Shadow / engine glow behind
            ctx.fillStyle = 'rgba(0, 243, 255, 0.4)';
            ctx.beginPath();
            ctx.arc(-26, 0, 16, 0, Math.PI * 2);
            ctx.fill();

            // Wing fins
            ctx.fillStyle = '#0284c7';
            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(-24, -28);
            ctx.lineTo(-14, -6);
            ctx.lineTo(-14, 6);
            ctx.lineTo(-24, 28);
            ctx.closePath();
            ctx.fill();

            // Main Hull
            ctx.fillStyle = '#f8fafc';
            ctx.beginPath();
            ctx.moveTo(34, 0);       // Nose
            ctx.lineTo(-20, -16);
            ctx.lineTo(-16, -6);
            ctx.lineTo(-24, -6);
            ctx.lineTo(-24, 6);
            ctx.lineTo(-16, 6);
            ctx.lineTo(-20, 16);
            ctx.closePath();
            ctx.fill();

            // Cyber Cyan Stripes & Canopy
            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 2.5;
            ctx.stroke();

            // Cockpit Canopy
            const glassGrad = ctx.createLinearGradient(0, -5, 18, 5);
            glassGrad.addColorStop(0, '#00f3ff');
            glassGrad.addColorStop(1, '#0284c7');
            ctx.fillStyle = glassGrad;
            ctx.beginPath();
            ctx.ellipse(8, 0, 12, 5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Twin Engine Nozzles
            ctx.fillStyle = '#334155';
            ctx.fillRect(-26, -10, 6, 6);
            ctx.fillRect(-26, 4, 6, 6);

            ctx.restore();
            this.registerTexture(scene, 'ship_scout', canvas);
        }

        // --- 3B. Collector (Orbital Mule) ---
        {
            const size = 110;
            const { canvas, ctx } = this.createCanvas(size, size);
            const cx = size / 2, cy = size / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Broad robust industrial hull
            // Cargo Pod bays
            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(-18, -26, 32, 12);
            ctx.fillRect(-18, 14, 32, 12);

            // Hull body
            ctx.fillStyle = '#e2e8f0';
            ctx.beginPath();
            ctx.moveTo(32, -12);
            ctx.lineTo(38, 0);
            ctx.lineTo(32, 12);
            ctx.lineTo(-24, 22);
            ctx.lineTo(-28, -22);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0284c7';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Hazard warning stripes
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-8, -14, 6, 28);
            ctx.fillRect(8, -10, 6, 20);

            // Center Cargo Container hatch
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-14, -8, 22, 16);
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 2;
            ctx.strokeRect(-14, -8, 22, 16);

            // Cockpit
            ctx.fillStyle = '#00f3ff';
            ctx.beginPath();
            ctx.arc(22, 0, 6, 0, Math.PI * 2);
            ctx.fill();

            // Industrial Engines
            ctx.fillStyle = '#475569';
            ctx.fillRect(-32, -16, 8, 10);
            ctx.fillRect(-32, 6, 8, 10);

            ctx.restore();
            this.registerTexture(scene, 'ship_collector', canvas);
        }

        // --- 3C. Heavy Lifter (Titan Hauler) ---
        {
            const size = 128;
            const { canvas, ctx } = this.createCanvas(size, size);
            const cx = size / 2, cy = size / 2;

            ctx.save();
            ctx.translate(cx, cy);

            // Heavy Twin-Boom catamaran chassis
            ctx.fillStyle = '#f59e0b'; // Heavy construction amber
            // Top boom
            ctx.fillRect(-32, -32, 64, 18);
            // Bottom boom
            ctx.fillRect(-32, 14, 64, 18);

            // Center reinforced bridge
            ctx.fillStyle = '#cbd5e1';
            ctx.fillRect(-18, -14, 44, 28);

            // Heavy armor plating & Hazard trims
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(-6, -30, 8, 14);
            ctx.fillRect(-6, 16, 8, 14);

            // Cockpit Bridge
            ctx.fillStyle = '#00f3ff';
            ctx.beginPath();
            ctx.ellipse(18, 0, 10, 7, 0, 0, Math.PI * 2);
            ctx.fill();

            // Towing Magnetic Arm Pylons in front
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(32, -22);
            ctx.lineTo(44, -14);
            ctx.moveTo(32, 22);
            ctx.lineTo(44, 14);
            ctx.stroke();

            // Quad Engine Array
            ctx.fillStyle = '#334155';
            ctx.fillRect(-38, -30, 8, 6);
            ctx.fillRect(-38, -20, 8, 6);
            ctx.fillRect(-38, 16, 8, 6);
            ctx.fillRect(-38, 24, 8, 6);

            ctx.restore();
            this.registerTexture(scene, 'ship_lifter', canvas);
        }
    }

    /**
     * 4. Debris Types Sprites
     */
    static generateDebris(scene) {
        // Fragment
        {
            const size = 36;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            ctx.fillStyle = '#94a3b8';
            ctx.beginPath();
            ctx.moveTo(c - 8, c - 10);
            ctx.lineTo(c + 12, c - 6);
            ctx.lineTo(c + 6, c + 10);
            ctx.lineTo(c - 10, c + 6);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.stroke();
            this.registerTexture(scene, 'debris_fragment', canvas);
        }

        // Solar Array
        {
            const size = 52;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            ctx.save();
            ctx.translate(c, c);
            ctx.rotate(0.3);

            // Gold/blue solar grid
            ctx.fillStyle = '#0284c7';
            ctx.fillRect(-18, -10, 36, 20);
            ctx.strokeStyle = '#f59e0b';
            ctx.lineWidth = 2;
            ctx.strokeRect(-18, -10, 36, 20);

            // Panel divisions
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5;
            for (let x = -10; x <= 10; x += 9) {
                ctx.beginPath();
                ctx.moveTo(x, -10);
                ctx.lineTo(x, 10);
                ctx.stroke();
            }

            // Severed spark wires
            ctx.strokeStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(-18, 0);
            ctx.lineTo(-24, -4);
            ctx.moveTo(18, 4);
            ctx.lineTo(24, 8);
            ctx.stroke();

            ctx.restore();
            this.registerTexture(scene, 'debris_solar', canvas);
        }

        // Cubesat
        {
            const size = 56;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            ctx.save();
            ctx.translate(c, c);

            // Cube body
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-12, -12, 24, 24);
            ctx.strokeStyle = '#a855f7';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-12, -12, 24, 24);

            // Folded mini solar flaps
            ctx.fillStyle = '#0ea5e9';
            ctx.fillRect(-22, -6, 8, 12);
            ctx.fillRect(14, -6, 8, 12);

            // Antenna rod
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, -12);
            ctx.lineTo(0, -22);
            ctx.stroke();

            ctx.restore();
            this.registerTexture(scene, 'debris_cubesat', canvas);
        }

        // Spent Rocket Booster
        {
            const size = 84;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            ctx.save();
            ctx.translate(c, c);
            ctx.rotate(Math.PI / 4);

            // Cylindrical fuel stage
            ctx.fillStyle = '#f8fafc';
            ctx.fillRect(-28, -12, 56, 24);
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-28, -12, 56, 24);

            // Rocket engine bell
            ctx.fillStyle = '#334155';
            ctx.beginPath();
            ctx.moveTo(-28, -8);
            ctx.lineTo(-38, -14);
            ctx.lineTo(-38, 14);
            ctx.lineTo(-28, 8);
            ctx.closePath();
            ctx.fill();

            // Stencil stripes
            ctx.fillStyle = '#ef4444';
            ctx.fillRect(-6, -12, 12, 24);

            ctx.restore();
            this.registerTexture(scene, 'debris_booster', canvas);
        }

        // Derelict Satellite
        {
            const size = 90;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            ctx.save();
            ctx.translate(c, c);

            // Dish Antenna
            ctx.strokeStyle = '#cbd5e1';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(-16, 0, 16, -Math.PI / 2, Math.PI / 2);
            ctx.stroke();

            // Main satellite bus
            ctx.fillStyle = '#475569';
            ctx.fillRect(-10, -14, 28, 28);
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(-10, -14, 28, 28);

            // Sensor arrays
            ctx.fillStyle = '#00f3ff';
            ctx.beginPath();
            ctx.arc(6, 0, 5, 0, Math.PI * 2);
            ctx.fill();

            // Solar wings
            ctx.fillStyle = '#0369a1';
            ctx.fillRect(20, -28, 14, 56);
            ctx.strokeStyle = '#38bdf8';
            ctx.strokeRect(20, -28, 14, 56);

            ctx.restore();
            this.registerTexture(scene, 'debris_satellite', canvas);
        }

        // Prototype Core
        {
            const size = 64;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            // Pulsing core
            const radGrad = ctx.createRadialGradient(c, c, 4, c, c, 24);
            radGrad.addColorStop(0, '#ffffff');
            radGrad.addColorStop(0.4, '#f43f5e');
            radGrad.addColorStop(0.8, '#881337');
            radGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = radGrad;
            ctx.beginPath();
            ctx.arc(c, c, 24, 0, Math.PI * 2);
            ctx.fill();

            // Magnetic containment ring
            ctx.strokeStyle = '#fda4af';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(c, c, 18, 0, Math.PI * 2);
            ctx.stroke();

            this.registerTexture(scene, 'debris_core', canvas);
        }
    }

    /**
     * 5. Hazardous Obstacles Sprites
     */
    static generateHazards(scene) {
        // 1. Hidden Micro-Debris (Low-observability stealth composite shard)
        {
            const size = 56;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            // Faint radar-absorbent shimmer aura
            const aura = ctx.createRadialGradient(c, c, 6, c, c, 22);
            aura.addColorStop(0, 'rgba(148, 163, 184, 0.35)');
            aura.addColorStop(0.7, 'rgba(71, 85, 105, 0.15)');
            aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(c, c, 22, 0, Math.PI * 2);
            ctx.fill();

            // Faceted stealth composite body
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(c - 12, c - 8);
            ctx.lineTo(c - 2, c - 14);
            ctx.lineTo(c + 12, c - 6);
            ctx.lineTo(c + 14, c + 8);
            ctx.lineTo(c + 4, c + 14);
            ctx.lineTo(c - 10, c + 10);
            ctx.closePath();
            ctx.fill();

            // Internal facet highlights (stealth geometry)
            ctx.strokeStyle = '#475569';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            ctx.strokeStyle = '#94a3b8';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(c - 2, c - 14);
            ctx.lineTo(c + 2, c + 2);
            ctx.lineTo(c + 14, c + 8);
            ctx.moveTo(c + 2, c + 2);
            ctx.lineTo(c - 10, c + 10);
            ctx.stroke();

            this.registerTexture(scene, 'hazard_hidden_debris', canvas);
            this.registerTexture(scene, 'hazard_meteoroid', canvas); // backward compatibility
        }

        // 2. Venting Rocket Upper-Stage Hazard (Derelict booster tank with toxic gas vents)
        {
            const size = 76;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            // Faint hypergolic vapor aura
            const aura = ctx.createRadialGradient(c, c, 12, c, c, 34);
            aura.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
            aura.addColorStop(0.8, 'rgba(234, 88, 12, 0.1)');
            aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(c, c, 34, 0, Math.PI * 2);
            ctx.fill();

            // Cylindrical rocket upper-stage body
            ctx.save();
            ctx.translate(c, c);

            // Main cylindrical pressure hull
            ctx.fillStyle = '#334155';
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 2.5;
            ctx.fillRect(-12, -20, 24, 34);
            ctx.strokeRect(-12, -20, 24, 34);

            // Dome cap (forward bulkhead)
            ctx.fillStyle = '#475569';
            ctx.beginPath();
            ctx.arc(0, -20, 12, Math.PI, 0);
            ctx.fill();
            ctx.stroke();

            // Rocket engine nozzle bell (vent origin at bottom)
            ctx.fillStyle = '#1e293b';
            ctx.strokeStyle = '#ea580c';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-6, 14);
            ctx.lineTo(6, 14);
            ctx.lineTo(10, 24);
            ctx.lineTo(-10, 24);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // Hazard warning chevrons / stripes across tank
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(-10, -8, 20, 4);
            ctx.fillRect(-10, 2, 20, 4);

            // Pressure valve indicator
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -6, 2.5, 0, Math.PI * 2);
            ctx.fill();

            ctx.restore();

            this.registerTexture(scene, 'hazard_venting_rocket', canvas);
            this.registerTexture(scene, 'hazard_hypergolic', canvas); // backward compatibility
        }

        // Nuclear RTG Satellite
        {
            const size = 76;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            // Radiation aura
            const aura = ctx.createRadialGradient(c, c, 16, c, c, 36);
            aura.addColorStop(0, 'rgba(132, 204, 22, 0.4)');
            aura.addColorStop(1, 'rgba(132, 204, 22, 0)');
            ctx.fillStyle = aura;
            ctx.beginPath();
            ctx.arc(c, c, 36, 0, Math.PI * 2);
            ctx.fill();

            // Derelict capsule
            ctx.fillStyle = '#1c1917';
            ctx.beginPath();
            ctx.arc(c, c, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#84cc16';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Trefoil Radiation symbol
            ctx.fillStyle = '#84cc16';
            ctx.beginPath();
            ctx.arc(c, c, 4, 0, Math.PI * 2);
            ctx.fill();
            for (let i = 0; i < 3; i++) {
                const angle = (i * Math.PI * 2) / 3 - Math.PI / 2;
                ctx.beginPath();
                ctx.arc(c, c, 14, angle - 0.4, angle + 0.4);
                ctx.lineTo(c, c);
                ctx.fill();
            }

            this.registerTexture(scene, 'hazard_nuclear', canvas);
        }
    }

    /**
     * 6. Equipment Sprites: Claw, Net, Magnetic Cone
     */
    static generateEquipment(scene) {
        // Robotic Claw
        {
            const size = 36;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;

            ctx.strokeStyle = '#00f3ff';
            ctx.lineWidth = 3;
            // Two claw prongs
            ctx.beginPath();
            ctx.moveTo(c - 8, c - 10);
            ctx.lineTo(c + 10, c - 6);
            ctx.lineTo(c + 14, c);
            ctx.lineTo(c + 10, c + 6);
            ctx.lineTo(c - 8, c + 10);
            ctx.stroke();

            ctx.fillStyle = '#38bdf8';
            ctx.fillRect(c - 12, c - 4, 8, 8);

            this.registerTexture(scene, 'equip_arm_claw', canvas);
        }

        // Capture Net Mesh
        {
            const size = 180;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            const r = size * 0.42;

            // Outer energy ring
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.85)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(c, c, r, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = 'rgba(14, 165, 233, 0.15)';
            ctx.fill();

            // Geometric web / hexagonal lattice
            ctx.strokeStyle = 'rgba(0, 243, 255, 0.55)';
            ctx.lineWidth = 1.5;
            for (let step = 15; step < r; step += 18) {
                ctx.beginPath();
                ctx.arc(c, c, step, 0, Math.PI * 2);
                ctx.stroke();
            }
            for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
                ctx.beginPath();
                ctx.moveTo(c, c);
                ctx.lineTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
                ctx.stroke();
            }

            this.registerTexture(scene, 'equip_net', canvas);
        }
    }

    /**
     * 7. Particles and FX Textures
     */
    static generateParticles(scene) {
        // Thruster flame particle
        {
            const size = 32;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            const grad = ctx.createRadialGradient(c, c, 2, c, c, c);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.3, '#00f3ff');
            grad.addColorStop(0.7, '#0284c7');
            grad.addColorStop(1, 'rgba(2, 132, 199, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(c, c, c, 0, Math.PI * 2);
            ctx.fill();
            this.registerTexture(scene, 'particle_thruster', canvas);
        }

        // Collision spark particle
        {
            const size = 20;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            const grad = ctx.createRadialGradient(c, c, 1, c, c, c);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.5, '#f59e0b');
            grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(c, c, c, 0, Math.PI * 2);
            ctx.fill();
            this.registerTexture(scene, 'particle_spark', canvas);
        }

        // Station recycling beam particle
        {
            const size = 24;
            const { canvas, ctx } = this.createCanvas(size, size);
            const c = size / 2;
            const grad = ctx.createRadialGradient(c, c, 2, c, c, c);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.4, '#10b981');
            grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(c, c, c, 0, Math.PI * 2);
            ctx.fill();
            this.registerTexture(scene, 'particle_recycle', canvas);
        }
    }
}

window.TextureGenerator = TextureGenerator;

