import { expect, test } from '../../../fixtures/pom/test-options';
import { ApiEndpoints, PaymentMethods } from '../../../enums/app/app';
import { generateBillingAddress } from '../../../test-data/factories/app/address.factory';

/**
 * E2E purchase flow for an authenticated customer:
 * product listing → product details → cart → checkout → order confirmation.
 *
 * Cleanup note: a completed order creates an invoice, and the API exposes no
 * way to delete or cancel invoices (no DELETE /invoices/{id}, no cancelled
 * status). Only the cart can be reverted, which `afterEach` does if the test
 * stops before the order is placed.
 */
test.describe('e2e checkout', () => {
    let cartId: string | undefined;

    test.beforeEach(async ({ appPage }) => {
        cartId = undefined;
        await appPage.openHomePage();
    });

    test.afterEach(async ({ apiRequest }) => {
        if (!cartId) return;

        // 404 is expected when the order completed and the cart was consumed
        const { status } = await apiRequest({
            method: 'DELETE',
            url: `${ApiEndpoints.CARTS}/${cartId}`,
            baseUrl: process.env.API_URL,
        });
        expect([204, 404]).toContain(status);
    });

    test(
        'should purchase a product with cash on delivery',
        { tag: '@e2e' },
        async ({ appPage, homePage, productPage, checkoutPage }) => {
            const billingAddress = generateBillingAddress();
            let productName = '';
            let unitPrice = '';

            await test.step('GIVEN user is authenticated and opens a product', async () => {
                await expect(appPage.nav.userMenu).toBeVisible();
                await homePage.openFirstProduct();
                await expect(productPage.productName).toBeVisible();
                productName = (
                    await productPage.productName.innerText()
                ).trim();
                unitPrice = (await productPage.unitPrice.innerText()).trim();
            });

            await test.step('WHEN user adds the product to the cart', async () => {
                cartId = await productPage.addToCart();
                await expect(productPage.addedToCartMessage).toBeVisible();
                await expect(appPage.nav.cartQuantity).toHaveText('1');
            });

            await test.step('AND user reviews the cart', async () => {
                await appPage.nav.cartLink.click();
                await expect(checkoutPage.cartItem(productName)).toBeVisible();
                await expect(checkoutPage.cartTotal).toContainText(unitPrice);
                await checkoutPage.proceedFromCartButton.click();
            });

            await test.step('AND user continues as the signed-in customer', async () => {
                await expect(checkoutPage.alreadyLoggedInMessage).toBeVisible();
                await checkoutPage.proceedToBillingAddress();
            });

            await test.step('AND user enters the billing address', async () => {
                await expect(checkoutPage.billingAddressHeading).toBeVisible();
                await checkoutPage.fillBillingAddress(billingAddress);
                await expect(checkoutPage.streetInput).not.toHaveValue('');
                await expect(checkoutPage.cityInput).not.toHaveValue('');
                await expect(checkoutPage.stateInput).not.toHaveValue('');
                await checkoutPage.proceedFromBillingButton.click();
            });

            await test.step('AND user pays with cash on delivery', async () => {
                await expect(checkoutPage.paymentHeading).toBeVisible();
                await checkoutPage.checkPayment(
                    PaymentMethods.CASH_ON_DELIVERY
                );
                await expect(checkoutPage.paymentSuccessMessage).toBeVisible();
                await checkoutPage.confirmButton.click();
            });

            await test.step('THEN the order is confirmed with an invoice number', async () => {
                await expect(checkoutPage.orderConfirmation).toBeVisible();
                await expect(checkoutPage.orderConfirmation).toContainText(
                    /INV-\d+/
                );
                await expect(appPage.nav.cartLink).toBeHidden();
            });
        }
    );
});
