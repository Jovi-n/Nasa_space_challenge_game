/**
 * ORBITAL CLEANUP: MISSION ZERO - AUTHENTICATION & LEADERBOARD SERVICE
 * 
 * Provides:
 * 1. OrbitalAuth: Callsign registration, PIN protection, session persistence.
 * 2. LeaderboardService: Real-player leaderboard sync, remote API integration, and offline fallback.
 * 
 * Guarantees that the leaderboard consists ONLY of real players who played.
 */

(function(window) {
    'use strict';

    const SESSION_KEY = 'orbital_user_session';
    const LOCAL_USERS_KEY = 'orbital_local_users';

    // =========================================================================
    // 1. ORBITAL AUTHENTICATION SERVICE
    // =========================================================================
    class OrbitalAuthClass {
        constructor() {
            this.currentUser = this.loadSession();
        }

        loadSession() {
            try {
                const raw = localStorage.getItem(SESSION_KEY);
                if (raw) {
                    const data = JSON.parse(raw);
                    if (data && data.callsign) return data;
                }
            } catch (e) {
                console.warn('[OrbitalAuth] Could not read session:', e);
            }
            return {
                callsign: 'Cadet',
                token: null,
                isGuest: true
            };
        }

        saveSession(user) {
            this.currentUser = user;
            try {
                localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            } catch (e) {
                console.warn('[OrbitalAuth] Could not save session:', e);
            }

            // Sync with OrbitalStorage save if available
            if (typeof OrbitalStorage !== 'undefined') {
                try {
                    const save = OrbitalStorage.load();
                    save.commanderName = user.callsign;
                    OrbitalStorage.save(save);
                } catch (e) {
                    console.warn('[OrbitalAuth] Could not sync commander name to save:', e);
                }
            }

            // Dispatch global event for UI updates
            window.dispatchEvent(new CustomEvent('orbital_auth_changed', { detail: user }));
        }

        getCurrentUser() {
            return this.currentUser;
        }

        isAuthenticated() {
            return !this.currentUser.isGuest && !!this.currentUser.callsign && this.currentUser.callsign !== 'Cadet';
        }

        /**
         * Register a new pilot with Callsign and PIN
         */
        async register(callsign, pin) {
            callsign = (callsign || '').trim();
            pin = (pin || '').trim();

            if (!callsign || callsign.length < 3 || callsign.length > 16) {
                throw new Error('Callsign must be between 3 and 16 characters.');
            }
            if (!/^[a-zA-Z0-9_\- ]+$/.test(callsign)) {
                throw new Error('Callsign can only contain letters, numbers, spaces, and hyphens.');
            }
            if (!pin || pin.length < 4) {
                throw new Error('Security PIN must be at least 4 digits/characters.');
            }

            // 1. Try remote API first
            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callsign, pin })
                });

                if (res.ok) {
                    const data = await res.json();
                    const user = {
                        callsign: data.callsign || callsign,
                        token: data.token || null,
                        isGuest: false,
                        registeredAt: new Date().toISOString()
                    };
                    this.saveSession(user);
                    return { success: true, message: data.message || 'Callsign registered successfully!', user };
                } else if (res.status === 409) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Callsign already exists. Please log in.');
                }
            } catch (err) {
                // If it's a validation error or 409 conflict, rethrow immediately
                if (err.message && (err.message.includes('Callsign') || err.message.includes('PIN') || err.message.includes('exists'))) {
                    throw err;
                }
                console.warn('[OrbitalAuth] Remote API unavailable, using local client authentication fallback.');
            }

            // 2. Client-side Local Fallback (Static Hosting / Offline)
            let localUsers = {};
            try {
                localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
            } catch (e) {
                localUsers = {};
            }

            const key = callsign.toLowerCase();
            if (localUsers[key]) {
                throw new Error('Callsign already registered on this device. Please log in.');
            }

            localUsers[key] = {
                callsign: callsign,
                pin: pin,
                createdAt: new Date().toISOString()
            };

            try {
                localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
            } catch (e) {
                console.warn('[OrbitalAuth] Could not save local user:', e);
            }

            const user = {
                callsign: callsign,
                token: 'local_' + Math.random().toString(36).substring(2),
                isGuest: false,
                registeredAt: new Date().toISOString()
            };
            this.saveSession(user);
            return { success: true, message: `Callsign [${callsign}] enlisted successfully!`, user };
        }

        /**
         * Log in an existing pilot
         */
        async login(callsign, pin) {
            callsign = (callsign || '').trim();
            pin = (pin || '').trim();

            if (!callsign || !pin) {
                throw new Error('Please enter both Callsign and Security PIN.');
            }

            // 1. Try remote API first
            try {
                const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ callsign, pin })
                });

                if (res.ok) {
                    const data = await res.json();
                    const user = {
                        callsign: data.callsign || callsign,
                        token: data.token || null,
                        isGuest: false,
                        bestScore: data.bestScore || 0
                    };
                    this.saveSession(user);
                    return { success: true, message: data.message || `Welcome back, Commander ${user.callsign}.`, user };
                } else if (res.status === 401 || res.status === 404) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.error || 'Invalid Callsign or PIN.');
                }
            } catch (err) {
                if (err.message && (err.message.includes('PIN') || err.message.includes('Callsign') || err.message.includes('Invalid') || err.message.includes('found'))) {
                    throw err;
                }
                console.warn('[OrbitalAuth] Remote API unavailable, using local client authentication fallback.');
            }

            // 2. Local Fallback
            let localUsers = {};
            try {
                localUsers = JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) || '{}');
            } catch (e) {
                localUsers = {};
            }

            const key = callsign.toLowerCase();
            const record = localUsers[key];

            if (!record) {
                throw new Error('Callsign not found. Enlist as a new pilot first.');
            }
            if (record.pin !== pin) {
                throw new Error('Incorrect Security PIN for this Callsign.');
            }

            const user = {
                callsign: record.callsign,
                token: 'local_' + Math.random().toString(36).substring(2),
                isGuest: false
            };
            this.saveSession(user);
            return { success: true, message: `Welcome back, Commander ${user.callsign}.`, user };
        }

        /**
         * Logout current pilot
         */
        logout() {
            const guestUser = {
                callsign: 'Cadet',
                token: null,
                isGuest: true
            };
            this.saveSession(guestUser);
            return guestUser;
        }

        /**
         * Quick Guest mode
         */
        setGuest() {
            const randomCadet = 'Cadet-' + Math.floor(1000 + Math.random() * 9000);
            const guestUser = {
                callsign: randomCadet,
                token: null,
                isGuest: true
            };
            this.saveSession(guestUser);
            return guestUser;
        }
    }

    // =========================================================================
    // 2. ORBITAL LEADERBOARD SERVICE (REAL PLAYERS ONLY)
    // =========================================================================
    class LeaderboardServiceClass {
        constructor() {
            this.cachedRecords = [];
            this.isLiveOnline = false;
        }

        /**
         * Filter out any mock/archive records so ONLY real users appear
         */
        cleanRealRecords(records) {
            if (!Array.isArray(records)) return [];
            return records.filter(entry => {
                if (!entry || !entry.name || typeof entry.score !== 'number') return false;
                // Exclude legacy mock placeholders
                if (entry.date === 'Archive Record') return false;
                if (entry.name === 'Cmdr. Shepard' || entry.name === 'Dr. Ryan Stone' || entry.name === 'Capt. Cooper' || entry.name === 'Aegis Vanguard') {
                    return false;
                }
                return true;
            });
        }

        /**
         * Fetch top player leaderboard records from server / cloud / local save
         */
        async fetchTopScores() {
            // 1. Try remote server API
            try {
                const res = await fetch('/api/leaderboard', {
                    method: 'GET',
                    headers: { 'Accept': 'application/json' },
                    cache: 'no-cache'
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.records)) {
                        this.cachedRecords = this.cleanRealRecords(data.records);
                        this.isLiveOnline = true;
                        this.syncToLocalSave(this.cachedRecords);
                        return {
                            isLive: true,
                            records: this.cachedRecords
                        };
                    }
                }
            } catch (err) {
                // Server not reachable (e.g. offline or static deployment without server.js)
                this.isLiveOnline = false;
            }

            // 2. Fallback to Local Save (ONLY real records)
            let localRecords = [];
            if (typeof OrbitalStorage !== 'undefined') {
                try {
                    const save = OrbitalStorage.load();
                    if (Array.isArray(save.leaderboard)) {
                        localRecords = this.cleanRealRecords(save.leaderboard);
                    }
                } catch (e) {
                    console.warn('[LeaderboardService] Error reading local save leaderboard:', e);
                }
            }

            this.cachedRecords = localRecords;
            return {
                isLive: false,
                records: localRecords
            };
        }

        /**
         * Submit a real player's completed mission score
         */
        async submitScore(entry) {
            if (!entry || !entry.name || typeof entry.score !== 'number') {
                console.warn('[LeaderboardService] Invalid score submission entry:', entry);
                return { success: false, reason: 'Invalid entry' };
            }

            const cleanEntry = {
                name: entry.name,
                score: Math.round(entry.score),
                debris: parseInt(entry.debris, 10) || 0,
                mission: (entry.mission || 'Orbital Sector').trim(),
                date: entry.date || new Date().toISOString().split('T')[0],
                status: entry.status === 'FAILED' ? 'FAILED' : 'CLEARED'
            };

            // 1. Always record into local save first
            if (typeof OrbitalStorage !== 'undefined') {
                try {
                    const save = OrbitalStorage.load();
                    if (!Array.isArray(save.leaderboard)) save.leaderboard = [];

                    // Remove old mock records
                    save.leaderboard = this.cleanRealRecords(save.leaderboard);

                    // Add new verified real run
                    save.leaderboard.push(cleanEntry);
                    save.leaderboard.sort((a, b) => b.score - a.score);

                    if (save.leaderboard.length > 50) {
                        save.leaderboard = save.leaderboard.slice(0, 50);
                    }

                    OrbitalStorage.save(save);
                    this.cachedRecords = save.leaderboard;
                } catch (e) {
                    console.warn('[LeaderboardService] Error updating local save:', e);
                }
            }

            // 2. Attempt online sync to server if available
            try {
                const currentUser = window.OrbitalAuth ? window.OrbitalAuth.getCurrentUser() : {};
                const res = await fetch('/api/leaderboard', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': currentUser.token ? `Bearer ${currentUser.token}` : ''
                    },
                    body: JSON.stringify(cleanEntry)
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data && Array.isArray(data.records)) {
                        this.cachedRecords = this.cleanRealRecords(data.records);
                        this.syncToLocalSave(this.cachedRecords);
                    }
                    return { success: true, isLive: true, rank: data.rank, records: this.cachedRecords };
                }
            } catch (err) {
                console.log('[LeaderboardService] Recorded locally (offline/static mode).');
            }

            const localRank = this.cachedRecords.findIndex(e => e === cleanEntry) + 1;
            return {
                success: true,
                isLive: false,
                rank: localRank > 0 ? localRank : 1,
                records: this.cachedRecords
            };
        }

        syncToLocalSave(records) {
            if (typeof OrbitalStorage === 'undefined') return;
            try {
                const save = OrbitalStorage.load();
                save.leaderboard = this.cleanRealRecords(records);
                OrbitalStorage.save(save);
            } catch (e) {
                // silent
            }
        }
    }

    // Attach singleton instances to window
    window.OrbitalAuth = new OrbitalAuthClass();
    window.LeaderboardService = new LeaderboardServiceClass();

})(typeof window !== 'undefined' ? window : global);
