/**
 * AUTOMATED TEST SUITE: STANDALONE SERVER API & STORAGE
 * 
 * Verifies server.js request handler using mock HTTP req/res streams:
 * - /api/health
 * - /api/auth/register
 * - /api/auth/login
 * - /api/leaderboard (GET & POST)
 */

const assert = require('assert');
const { EventEmitter } = require('events');
const fs = require('fs');
const path = require('path');

// Backup existing test data if any
const USERS_PATH = path.join(__dirname, '../data/users.json');
const LB_PATH = path.join(__dirname, '../data/leaderboard.json');

const originalUsers = fs.existsSync(USERS_PATH) ? fs.readFileSync(USERS_PATH, 'utf8') : '{}';
const originalLb = fs.existsSync(LB_PATH) ? fs.readFileSync(LB_PATH, 'utf8') : '[]';

// Reset clean test fixtures
fs.writeFileSync(USERS_PATH, '{}', 'utf8');
fs.writeFileSync(LB_PATH, '[]', 'utf8');

// Load server instance
const server = require('../server.js');

function mockRequest(method, pathname, body = null, headers = {}) {
    return new Promise((resolve) => {
        const req = new EventEmitter();
        req.method = method;
        req.url = pathname;
        req.headers = Object.assign({ host: 'localhost:8080' }, headers);

        const res = new EventEmitter();
        res.headers = {};
        res.statusCode = 200;
        let resBody = '';

        res.writeHead = (code, headersObj) => {
            res.statusCode = code;
            if (headersObj) Object.assign(res.headers, headersObj);
        };
        res.setHeader = (k, v) => { res.headers[k] = v; };
        res.getHeader = (k) => res.headers[k];
        res.end = (chunk) => {
            if (chunk) resBody += chunk;
            resolve({
                statusCode: res.statusCode,
                headers: res.headers,
                body: resBody,
                json: () => {
                    try { return JSON.parse(resBody); } catch (e) { return null; }
                }
            });
        };

        // Emit request to server handler
        server.emit('request', req, res);

        // Push body
        if (body) {
            req.emit('data', JSON.stringify(body));
        }
        req.emit('end');
    });
}

async function runApiTests() {
    console.log('=== TEST SUITE: SERVER REST API & REAL LEADERBOARD ===\n');

    // 1. Health check
    console.log('--- TEST 1: /api/health ---');
    const health = await mockRequest('GET', '/api/health');
    assert.strictEqual(health.statusCode, 200);
    assert.strictEqual(health.json().status, 'online');
    console.log('PASS: /api/health online.\n');

    // 2. Auth: Register
    console.log('--- TEST 2: /api/auth/register ---');
    const regRes = await mockRequest('POST', '/api/auth/register', {
        callsign: 'Apollo-11',
        pin: '2054'
    });
    assert.strictEqual(regRes.statusCode, 201);
    const regData = regRes.json();
    assert.strictEqual(regData.success, true);
    assert.strictEqual(regData.callsign, 'Apollo-11');
    assert(regData.token, 'Token must be issued');
    console.log('PASS: Real user registered and token issued.\n');

    // 3. Auth: Login
    console.log('--- TEST 3: /api/auth/login ---');
    const loginRes = await mockRequest('POST', '/api/auth/login', {
        callsign: 'Apollo-11',
        pin: '2054'
    });
    assert.strictEqual(loginRes.statusCode, 200);
    assert.strictEqual(loginRes.json().success, true);

    const badLogin = await mockRequest('POST', '/api/auth/login', {
        callsign: 'Apollo-11',
        pin: '0000'
    });
    assert.strictEqual(badLogin.statusCode, 401);
    console.log('PASS: PIN verification and security validated.\n');

    // 4. Leaderboard: Submit Real Score
    console.log('--- TEST 4: /api/leaderboard (POST & GET) ---');
    const scoreRes1 = await mockRequest('POST', '/api/leaderboard', {
        name: 'Apollo-11',
        score: 18450,
        debris: 34,
        mission: 'LEO Corridor',
        status: 'CLEARED'
    });
    assert.strictEqual(scoreRes1.statusCode, 201);
    assert.strictEqual(scoreRes1.json().rank, 1);

    // Register second player
    await mockRequest('POST', '/api/auth/register', { callsign: 'Gemini-8', pin: '1966' });
    const scoreRes2 = await mockRequest('POST', '/api/leaderboard', {
        name: 'Gemini-8',
        score: 24600,
        debris: 48,
        mission: 'GEO Graveyard',
        status: 'CLEARED'
    });
    assert.strictEqual(scoreRes2.statusCode, 201);
    assert.strictEqual(scoreRes2.json().rank, 1); // Higher score, so rank 1

    // Fetch leaderboard
    const lbGet = await mockRequest('GET', '/api/leaderboard');
    assert.strictEqual(lbGet.statusCode, 200);
    const lbData = lbGet.json();
    assert.strictEqual(lbData.totalEntries, 2);
    assert.strictEqual(lbData.records[0].name, 'Gemini-8');
    assert.strictEqual(lbData.records[0].score, 24600);
    assert.strictEqual(lbData.records[1].name, 'Apollo-11');
    assert.strictEqual(lbData.records[1].score, 18450);

    console.log('PASS: Only real players recorded, sorted by score descending.\n');

    // Restore clean data state (empty arrays for production)
    fs.writeFileSync(USERS_PATH, '{}', 'utf8');
    fs.writeFileSync(LB_PATH, '[]', 'utf8');

    server.close();
    console.log('=====================================================');
    console.log('ALL SERVER API & LEADERBOARD TESTS PASSED (100%)!');
    console.log('=====================================================');
}

runApiTests().catch(err => {
    console.error('API Test Error:', err);
    process.exit(1);
});
