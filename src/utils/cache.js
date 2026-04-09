/**
 * Simple in-memory TTL cache for API responses.
 * Wraps authFetch — same usage, automatic deduplication and expiry.
 *
 * Usage:
 *   import { cachedFetch, invalidateCache } from '../utils/cache';
 *
 *   // Cache for 5 minutes (default)
 *   const data = await cachedFetch('/Readiness/teacher/1/chart');
 *
 *   // Custom TTL (ms)
 *   const data = await cachedFetch('/class/teacher/1', {}, 60_000);
 *
 *   // Invalidate when data changes (e.g. after approving a submission)
 *   invalidateCache('/Readiness/teacher/1/chart');
 *   invalidateCache('/class/teacher/'); // prefix — clears all matching keys
 */

import { authFetch } from './api';

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

const store = new Map(); // key → { data, expiresAt }
const inflight = new Map(); // key → Promise (deduplication)

/**
 * Fetch with caching. GET requests only.
 * @param {string} url
 * @param {RequestInit} options  — passed to authFetch
 * @param {number} ttl           — milliseconds until cache expires
 */
export async function cachedFetch(url, options = {}, ttl = DEFAULT_TTL) {
    const key = url;
    const now = Date.now();

    // Return cached value if still fresh
    const cached = store.get(key);
    if (cached && cached.expiresAt > now) {
        return cached.data;
    }

    // Deduplicate simultaneous requests for the same URL
    if (inflight.has(key)) {
        return inflight.get(key);
    }

    const promise = authFetch(url, options)
        .then(async (res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            store.set(key, { data, expiresAt: now + ttl });
            return data;
        })
        .finally(() => {
            inflight.delete(key);
        });

    inflight.set(key, promise);
    return promise;
}

/**
 * Remove one entry or all entries whose key starts with the given prefix.
 * @param {string} keyOrPrefix
 */
export function invalidateCache(keyOrPrefix) {
    for (const key of store.keys()) {
        if (key.startsWith(keyOrPrefix)) {
            store.delete(key);
        }
    }
}

/**
 * Clear the entire cache (e.g. on logout).
 */
export function clearCache() {
    store.clear();
    inflight.clear();
}
