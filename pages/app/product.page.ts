import { Locator, Page } from '@playwright/test';
import { ApiEndpoints, Messages } from '../../enums/app/app';

/**
 * Page Object for the product details page.
 */
export class ProductPage {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get productName(): Locator {
        return this.page.getByRole('heading', { level: 1 });
    }

    get unitPrice(): Locator {
        return this.page.getByTestId('unit-price');
    }

    get addToCartButton(): Locator {
        return this.page.getByRole('button', { name: 'Add to cart' });
    }

    get addedToCartMessage(): Locator {
        return this.page.getByRole('alert', {
            name: Messages.PRODUCT_ADDED_TO_CART,
        });
    }

    // ==================== Actions ====================

    /**
     * Adds the current product to the cart and waits for the API to accept it.
     * The cart id is only held in the app's memory, so it is read from the
     * add-item request URL (`POST /carts/{cartId}`) for later cleanup.
     *
     * @returns {Promise<string>} The id of the cart the product was added to.
     */
    async addToCart(): Promise<string> {
        const cartItemUrl = new RegExp(`${ApiEndpoints.CARTS}/([^/?]+)$`);
        const responsePromise = this.page.waitForResponse(
            (response) =>
                response.request().method() === 'POST' &&
                cartItemUrl.test(response.url())
        );

        await this.addToCartButton.click();
        const response = await responsePromise;

        return response.url().match(cartItemUrl)![1];
    }
}
