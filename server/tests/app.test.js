/**
 * Backend Tests — Unit + Integration
 * Tools: Jest + Supertest
 *
 * Unit tests: test individual logic/functions in isolation
 * Integration tests: test Express routes end-to-end (HTTP request → response)
 */

const request = require('supertest');
const app = require('../src/app');

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('Unit: Health response shape', () => {
    it('should have correct fields in health payload', () => {
        // Simulate what the /api/health handler builds
        const payload = {
            status: 'ok',
            message: 'ShopSmart Backend is running',
            timestamp: new Date().toISOString(),
        };

        expect(payload).toHaveProperty('status', 'ok');
        expect(payload).toHaveProperty('message');
        expect(typeof payload.timestamp).toBe('string');
    });

    it('timestamp should be a valid ISO date string', () => {
        const ts = new Date().toISOString();
        expect(new Date(ts).toISOString()).toBe(ts);
    });
});

// ─── Integration Tests (API ↔ Express) ───────────────────────────────────────

describe('Integration: GET /api/health', () => {
    it('responds with 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
    });

    it('response body has status "ok"', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body).toHaveProperty('status', 'ok');
    });

    it('response body has a message field', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body).toHaveProperty('message');
    });

    it('response body has a timestamp field', async () => {
        const res = await request(app).get('/api/health');
        expect(res.body).toHaveProperty('timestamp');
    });

    it('Content-Type is application/json', async () => {
        const res = await request(app).get('/api/health');
        expect(res.headers['content-type']).toMatch(/application\/json/);
    });
});

describe('Integration: GET / (root route)', () => {
    it('responds with 200', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toBe(200);
    });

    it('responds with text containing ShopSmart', async () => {
        const res = await request(app).get('/');
        expect(res.text).toMatch(/ShopSmart/i);
    });
});

describe('Integration: unknown routes', () => {
    it('returns 404 for an undefined route', async () => {
        const res = await request(app).get('/api/does-not-exist');
        expect(res.statusCode).toBe(404);
    });
});
