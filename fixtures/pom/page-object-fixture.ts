import { test as base } from '@playwright/test';
import { AppPage } from '../../pages/app/app.page';
import { CheckoutPage } from '../../pages/app/checkout.page';
import { HomePage } from '../../pages/app/home.page';
import { ProductPage } from '../../pages/app/product.page';

/**
 * Framework fixtures for page objects.
 * Add new page object types here as you create them.
 */
export type FrameworkFixtures = {
    /** Main application page object */
    appPage: AppPage;
    /** Home page product listing */
    homePage: HomePage;
    /** Product details page */
    productPage: ProductPage;
    /** Checkout wizard (cart, sign in, billing, payment) */
    checkoutPage: CheckoutPage;
    resetStorageState: () => Promise<void>;
};

/**
 * Extended test with page object fixtures.
 * Import this in your test files to access page objects.
 *
 * @example
 * ```ts
 * import { test, expect } from '../fixtures/pom/test-options';
 *
 * test('example test', async ({ appPage }) => {
 *   await appPage.openHomePage();
 *   await expect(appPage.appTitle).toBeVisible();
 * });
 * ```
 */
export const test = base.extend<FrameworkFixtures>({
    appPage: async ({ page }, use) => {
        await use(new AppPage(page));
    },

    homePage: async ({ page }, use) => {
        await use(new HomePage(page));
    },

    productPage: async ({ page }, use) => {
        await use(new ProductPage(page));
    },

    checkoutPage: async ({ page }, use) => {
        await use(new CheckoutPage(page));
    },

    resetStorageState: async ({ context }, use) => {
        await use(async () => {
            await context.clearCookies();
            await context.clearPermissions();
        });
    },
});
