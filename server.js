/**
 * ORBITAL CLEANUP: MISSION ZERO - STANDALONE GAME & API SERVER
 * 
 * Provides:
 * 1. Static asset web server (HTML, JS, CSS, Audio, Textures)
 * 2. Real Player Authentication (Callsign registration, PIN security)
 * 3. Persistent Global Leaderboard (Only real players and real scores)
 * 
 * Zero external dependencies: Runs on native Node.js (v16+)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const url = require('url');

const PORT = parseInt(process.env.PORT || '8080', 10);
const ROOT_DIR = __dirname;
const USERS_FILE = path.join(ROOT_DIR, 'data', 'users.json');
const LEADERBOARD_FILE = path.join(ROOT_DIR, 'data', 'leaderboard.json');

// MIME types mapping
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.wav': 'audio/wav',
    '.mp3': 'audio/mpeg',
    '.ogg': 'audio/ogg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

// In-memory active session tokens: token -> { callsign, expiresAt }
const activeSessions = new Map();

/**
 * Load users database
 */
function loadUsers() {
    try {
        if (!fs.existsSync(USERS_FILE)) return {};
        const data = fs.readFileSync(USERS_FILE, 'utf8');
        return JSON.parse(data || '{}');
    } catch (err) {
        console.error('[Server] Error loading users.json:', err.message);
        return {};
    }
}

/**
 * Save users database
 */
function saveUsers(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (err) {
        console.error('[Server] Error saving users.json:', err.message);
    }
}

/**
 * Load leaderboard database
 */
function loadLeaderboard() {
    try {
        if (!fs.existsSync(LEADERBOARD_FILE)) return [];
        const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
        const list = JSON.parse(data || '[]');
        return Array.isArray(list) ? list : [];
    } catch (err) {
        console.error('[Server] Error loading leaderboard.json:', err.message);
        return [];
    }
}

/**
 * Save leaderboard database
 */
function saveLeaderboard(leaderboard) {
    try {
        fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf8');
    } catch (err) {
        console.error('[Server] Error saving leaderboard.json:', err.message);
    }
}

/**
 * Hash PIN with salt
 */
function hashPin(pin, salt) {
    return crypto.pbkdf2Sync(pin, salt, 1000, 32, 'sha256').toString('hex');
}

/**
 * Parse JSON body from request
 */
function parseJsonBody(req) {
    return new Promise((resolve, reject) => {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
            if (body.length > 1e6) { // 1MB limit
                req.destroy();
                reject(new Error('Payload too large'));
            }
        });
        req.on('end', () => {
            if (!body.trim()) return resolve({});
            try {
                resolve(JSON.parse(body));
            } catch (err) {
                reject(new Error('Invalid JSON'));
            }
        });
        req.on('error', reject);
    });
}

/**
 * Send JSON response
 */
function sendJson(res, statusCode, data) {
    const payload = JSON.stringify(data);
    res.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(payload);
}

/**
 * Request Handler
 */
const server = http.createServer(async (req, res) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400'
        });
        res.end();
        return;
    }

    const parsedUrl = new URL(req.url, 'http://' + (req.headers.host || 'localhost'));
    const pathname = parsedUrl.pathname;

    // =========================================================================
    // API ROUTES
    // =========================================================================

    // 1. Health check
    if (pathname === '/api/health') {
        return sendJson(res, 200, {
            status: 'online',
            service: 'Orbital Cleanup Leaderboard & Auth Service',
            timestamp: new Date().toISOString()
        });
    }

    // 2. Auth: Register
    if (pathname === '/api/auth/register' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            let callsign = (body.callsign || '').trim();
            const pin = (body.pin || '').trim();

            if (!callsign || callsign.length < 3 || callsign.length > 16) {
                return sendJson(res, 400, { error: 'Callsign must be between 3 and 16 characters.' });
            }
            if (!/^[a-zA-Z0-9_\- ]+$/.test(callsign)) {
                return sendJson(res, 400, { error: 'Callsign can only contain letters, numbers, spaces, and hyphens.' });
            }
            if (!pin || pin.length < 4) {
                return sendJson(res, 400, { error: 'Security PIN must be at least 4 digits/characters.' });
            }

            const users = loadUsers();
            const normalizedKey = callsign.toLowerCase();

            if (users[normalizedKey]) {
                return sendJson(res, 409, { error: 'Callsign is already registered. Please log in.' });
            }

            const salt = crypto.randomBytes(16).toString('hex');
            const pinHash = hashPin(pin, salt);
            const token = crypto.randomBytes(24).toString('hex');

            users[normalizedKey] = {
                callsign: callsign,
                salt: salt,
                pinHash: pinHash,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                bestScore: 0,
                missionsCompleted: 0
            };

            saveUsers(users);

            // Store active session (expires in 30 days)
            activeSessions.set(token, {
                callsign: callsign,
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
            });

            return sendJson(res, 201, {
                success: true,
                message: `Callsign [${callsign}] successfully registered!`,
                callsign: callsign,
                token: token
            });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 3. Auth: Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const callsign = (body.callsign || '').trim();
            const pin = (body.pin || '').trim();

            if (!callsign || !pin) {
                return sendJson(res, 400, { error: 'Please provide both Callsign and Security PIN.' });
            }

            const users = loadUsers();
            const normalizedKey = callsign.toLowerCase();
            const user = users[normalizedKey];

            if (!user) {
                return sendJson(res, 404, { error: 'Callsign not found. Enlist as a new pilot first.' });
            }

            const checkHash = hashPin(pin, user.salt);
            if (checkHash !== user.pinHash) {
                return sendJson(res, 401, { error: 'Incorrect Security PIN for this Callsign.' });
            }

            const token = crypto.randomBytes(24).toString('hex');
            user.lastLogin = new Date().toISOString();
            saveUsers(users);

            activeSessions.set(token, {
                callsign: user.callsign,
                expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000
            });

            return sendJson(res, 200, {
                success: true,
                message: `Welcome back, Commander ${user.callsign}.`,
                callsign: user.callsign,
                token: token,
                bestScore: user.bestScore || 0
            });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // 4. Auth: Verify / Me
    if (pathname === '/api/auth/me' && req.method === 'GET') {
        const authHeader = req.headers['authorization'] || '';
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();

        if (token && activeSessions.has(token)) {
            const session = activeSessions.get(token);
            if (session.expiresAt > Date.now()) {
                const users = loadUsers();
                const user = users[session.callsign.toLowerCase()] || {};
                return sendJson(res, 200, {
                    authenticated: true,
                    callsign: session.callsign,
                    bestScore: user.bestScore || 0
                });
            }
        }
        return sendJson(res, 401, { authenticated: false, error: 'Session expired or invalid.' });
    }

    // 5. Leaderboard: GET (Top Real Players)
    if (pathname === '/api/leaderboard' && req.method === 'GET') {
        const leaderboard = loadLeaderboard();
        // Return top 50 scores descending
        const top = leaderboard
            .slice()
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 50);

        return sendJson(res, 200, {
            totalEntries: leaderboard.length,
            records: top
        });
    }

    // 6. Leaderboard: POST (Submit Real Score)
    if (pathname === '/api/leaderboard' && req.method === 'POST') {
        try {
            const body = await parseJsonBody(req);
            const name = (body.name || '').trim();
            const score = parseInt(body.score, 10);
            const debris = parseInt(body.debris, 10) || 0;
            const mission = (body.mission || 'Orbital Sector').trim();
            const date = body.date || new Date().toISOString().split('T')[0];
            const status = body.status === 'FAILED' ? 'FAILED' : 'CLEARED';

            if (!name || name.length < 2) {
                return sendJson(res, 400, { error: 'Valid player name/callsign is required.' });
            }
            if (isNaN(score) || score < 0) {
                return sendJson(res, 400, { error: 'Valid positive mission score is required.' });
            }

            const leaderboard = loadLeaderboard();

            // Create new validated real player record
            const newEntry = {
                name: name,
                score: score,
                debris: debris,
                mission: mission,
                date: date,
                status: status
            };

            leaderboard.push(newEntry);
            leaderboard.sort((a, b) => b.score - a.score);

            // Keep top 100 historical runs on server
            const pruned = leaderboard.slice(0, 100);
            saveLeaderboard(pruned);

            // Update user best score in users.json if registered
            const users = loadUsers();
            const userKey = name.toLowerCase();
            if (users[userKey]) {
                users[userKey].bestScore = Math.max(users[userKey].bestScore || 0, score);
                users[userKey].missionsCompleted = (users[userKey].missionsCompleted || 0) + 1;
                saveUsers(users);
            }

            const playerRank = pruned.findIndex(e => e === newEntry) + 1;

            return sendJson(res, 201, {
                success: true,
                message: `Flight score recorded! Current Rank: #${playerRank}`,
                rank: playerRank,
                record: newEntry,
                records: pruned.slice(0, 20)
            });
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    // =========================================================================
    // STATIC ASSETS FILE SERVER
    // =========================================================================
    if (req.method !== 'GET' && req.method !== 'HEAD') {
        res.writeHead(405, { 'Content-Type': 'text/plain' });
        res.end('Method Not Allowed');
        return;
    }

    let safePath = path.normalize(decodeURIComponent(pathname)).replace(/^(\.\.[\/\\])+/, '');
    if (safePath === '/' || safePath === '\\') {
        safePath = '/index.html';
    }

    const filePath = path.join(ROOT_DIR, safePath);

    // Prevent directory traversal outside ROOT_DIR
    if (!filePath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
            'Content-Type': contentType,
            'Content-Length': stats.size,
            'Cache-Control': 'no-cache'
        });

        const readStream = fs.createReadStream(filePath);
        readStream.pipe(res);
    });
});

if (require.main === module) {
    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`[Server] Port ${PORT} is in use. Trying fallback port ${PORT + 1}...`);
            server.listen(PORT + 1);
        } else {
            console.error('[Server] Fatal error:', err.message);
        }
    });

    server.listen(PORT, () => {
        const addr = server.address();
        const activePort = typeof addr === 'object' && addr ? addr.port : PORT;
        console.log(`=================================================================`);
        console.log(`🚀 ORBITAL CLEANUP: MISSION ZERO - SERVER ACTIVE`);
        console.log(`📡 URL: http://localhost:${activePort}/`);
        console.log(`🏆 Real Leaderboard API: http://localhost:${activePort}/api/leaderboard`);
        console.log(`👨‍🚀 Callsign Auth API:  http://localhost:${activePort}/api/auth/login`);
        console.log(`=================================================================`);
    });
}

module.exports = server;
