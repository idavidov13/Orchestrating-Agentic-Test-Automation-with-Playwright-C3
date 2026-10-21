import { Locator, Page } from '@playwright/test';

/**
 * Page Object for the home page product listing.
 */
export class HomePage {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get productCards(): Locator {
        return this.page
            .getByRole('link')
            .filter({ has: this.page.getByRole('heading', { level: 5 }) });
    }

    // ==================== Actions ====================

    /**
     * Opens the product details page of the first product in the listing.
     *
     * @returns {Promise<void>} Resolves when the product card has been clicked.
     */
    async openFirstProduct(): Promise<void> {
        // eslint-disable-next-line playwright/no-nth-methods -- any listed product will do; its name is read from the details page
        await this.productCards.first().click();
    }
}
