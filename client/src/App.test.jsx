/**
 * Frontend Tests — Unit + Integration
 * Tools: Vitest + @testing-library/react
 *
 * Unit: test rendering of individual components in isolation
 * Integration: test that App component fetches data and renders the result
 */

import { render, screen, waitFor } from '@testing-library/react';
import App from './App';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('Unit: App renders static content', () => {
    beforeEach(() => {
        // Simple mock so fetch doesn't fail
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'ok', message: 'Test', timestamp: '2024-01-01' })
            })
        );
    });

    it('renders the ShopSmart heading', () => {
        render(<App />);
        expect(screen.getByText(/ShopSmart/i)).toBeInTheDocument();
    });

    it('renders "Backend Status" section heading', () => {
        render(<App />);
        expect(screen.getByRole('heading', { name: /Backend Status/i })).toBeInTheDocument();
    });

    it('shows loading message before data is fetched', () => {
        // fetch that never resolves → component stays in loading state
        global.fetch = vi.fn(() => new Promise(() => {}));
        render(<App />);
        expect(screen.getByText(/Loading backend status/i)).toBeInTheDocument();
    });
});

// ─── Integration Tests ────────────────────────────────────────────────────────

describe('Integration: App fetches and displays backend data', () => {
    it('displays status "ok" after successful fetch', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'ok', message: 'All good', timestamp: '2024-01-01T00:00:00.000Z' })
            })
        );

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText(/ok/i)).toBeInTheDocument();
        });
    });

    it('displays the message from backend response', async () => {
        global.fetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'ok', message: 'All good', timestamp: '2024-01-01T00:00:00.000Z' })
            })
        );

        render(<App />);

        await waitFor(() => {
            expect(screen.getByText(/All good/i)).toBeInTheDocument();
        });
    });

    it('calls fetch with /api/health endpoint', async () => {
        const mockFetch = vi.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ status: 'ok', message: 'Hi', timestamp: 'now' })
            })
        );
        global.fetch = mockFetch;

        render(<App />);

        await waitFor(() => {
            expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/health'));
        });
    });
});
