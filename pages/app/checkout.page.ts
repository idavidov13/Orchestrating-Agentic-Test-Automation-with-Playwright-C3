import { expect, Locator, Page } from '@playwright/test';
import { ApiEndpoints, Messages, PaymentMethods } from '../../enums/app/app';
import { PostcodeLookupRequest } from '../../fixtures/api/schemas/app/addressSchema';

/**
 * Page Object for the multi-step checkout wizard:
 * Cart → Sign in → Billing Address → Payment.
 *
 * The three "Proceed to checkout" buttons share an accessible name and stay
 * in the DOM across steps, so they are targeted by test id.
 */
export class CheckoutPage {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    // ---- Step 1: Cart ----

    cartItem(productName: string): Locator {
        return this.page.getByRole('cell', { name: productName, exact: true });
    }

    get cartTotal(): Locator {
        return this.page.getByTestId('cart-total');
    }

    get proceedFromCartButton(): Locator {
        return this.page.getByTestId('proceed-1');
    }

    // ---- Step 2: Sign in ----

    get alreadyLoggedInMessage(): Locator {
        return this.page.getByText(Messages.ALREADY_LOGGED_IN);
    }

    get proceedFromSignInButton(): Locator {
        return this.page.getByTestId('proceed-2');
    }

    // ---- Step 3: Billing Address ----

    get billingAddressHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Billing Address' });
    }

    get countrySelect(): Locator {
        return this.page.getByLabel('Country');
    }

    get postalCodeInput(): Locator {
        return this.page.getByLabel('Postal code');
    }

    get houseNumberInput(): Locator {
        return this.page.getByLabel('House number');
    }

    get streetInput(): Locator {
        return this.page.getByLabel('Street');
    }

    get cityInput(): Locator {
        return this.page.getByLabel('City');
    }

    get stateInput(): Locator {
        return this.page.getByLabel('State');
    }

    get proceedFromBillingButton(): Locator {
        return this.page.getByTestId('proceed-3');
    }

    // ---- Step 4: Payment ----

    get paymentHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Payment' });
    }

    get paymentMethodSelect(): Locator {
        return this.page.getByLabel('Payment Method');
    }

    get checkPaymentButton(): Locator {
        return this.page.getByRole('button', { name: 'Check payment' });
    }

    get paymentSuccessMessage(): Locator {
        return this.page.getByText(Messages.PAYMENT_SUCCESSFUL);
    }

    get confirmButton(): Locator {
        return this.page.getByRole('button', { name: 'Confirm' });
    }

    get orderConfirmation(): Locator {
        return this.page.getByText(Messages.ORDER_CONFIRMED);
    }

    // ==================== Actions ====================

    /**
     * Proceeds from the sign-in step to the billing address step and waits
     * for the form to be pre-filled from the customer profile. That pre-fill
     * patches the whole address form (including country and postcode), so
     * typing before it lands would be overwritten. The street field is the
     * signal because the profile pre-fill always sets it for a customer with
     * a saved address.
     *
     * @returns {Promise<void>} Resolves once the profile pre-fill has landed.
     */
    async proceedToBillingAddress(): Promise<void> {
        await this.proceedFromSignInButton.click();
        await expect(this.streetInput).not.toHaveValue('');
    }

    /**
     * Fills the billing address lookup fields (country, house number, postcode)
     * and waits for the postcode lookup to auto-fill street, city and state.
     *
     * @param {PostcodeLookupRequest} address - Country code, postcode and house number.
     * @returns {Promise<void>} Resolves once the lookup response has arrived.
     */
    async fillBillingAddress(address: PostcodeLookupRequest): Promise<void> {
        const lookupPromise = this.page.waitForResponse((response) => {
            const url = new URL(response.url());
            return (
                url.pathname === ApiEndpoints.POSTCODE_LOOKUP &&
                url.searchParams.get('postcode') === address.postcode &&
                url.searchParams.get('house_number') === address.house_number
            );
        });

        await this.countrySelect.selectOption(address.country);
        await this.houseNumberInput.fill(address.house_number);
        await this.postalCodeInput.fill(address.postcode);
        await this.postalCodeInput.blur();

        await lookupPromise;
    }

    /**
     * Selects a payment method and submits it for verification.
     *
     * @param {PaymentMethods} method - Payment method label from the select.
     * @returns {Promise<void>} Resolves when "Check payment" has been clicked.
     */
    async checkPayment(method: PaymentMethods): Promise<void> {
        await this.paymentMethodSelect.selectOption({ label: method });
        await this.checkPaymentButton.click();
    }
}
