/**
 * E2E Tests — Playwright
 *
 * Simulates real user flow visiting the ShopSmart frontend.
 * Runs against the static build served at http://localhost:4173
 * (Vite preview server).
 *
 * Flow tested:
 *   1. User visits the homepage
 *   2. Page loads with correct title
 *   3. "Backend Status" section is visible
 *   4. Loading message appears initially
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:4173/shopsmart/';

test.describe('ShopSmart E2E — Homepage', () => {
    test('page has ShopSmart heading', async ({ page }) => {
        await page.goto(BASE_URL);
        const heading = page.getByRole('heading', { name: /ShopSmart/i });
        await expect(heading).toBeVisible();
    });

    test('page shows Backend Status section', async ({ page }) => {
        await page.goto(BASE_URL);
        const section = page.getByText(/Backend Status/i);
        await expect(section).toBeVisible();
    });

    test('page title is correct', async ({ page }) => {
        await page.goto(BASE_URL);
        await expect(page).toHaveTitle(/ShopSmart/i);
    });
});
