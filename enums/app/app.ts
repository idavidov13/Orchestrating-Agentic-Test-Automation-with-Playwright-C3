/**
 * Application-specific constants.
 * Add your application's repeated string values here.
 *
 * @example
 * ```ts
 * import { Messages, ApiEndpoints } from '../../enums/app/app';
 *
 * await expect(page.getByText(Messages.LOGIN_ERROR)).toBeVisible();
 * ```
 */

/** Common UI messages — every value verified against the live demo app */
export enum Messages {
    LOGIN_ERROR = 'Invalid email or password',
    EMAIL_REQUIRED = 'Email is required',
    PASSWORD_REQUIRED = 'Password is required',
    EMAIL_FORMAT_INVALID = 'Email format is invalid',
    PRODUCT_ADDED_TO_CART = 'Product added to shopping cart.',
    ALREADY_LOGGED_IN = 'you are already logged in',
    PAYMENT_SUCCESSFUL = 'Payment was successful',
    ORDER_CONFIRMED = 'Thanks for your order!',
}

/** UI route paths */
export enum AppRoutes {
    LOGIN = '/auth/login',
    CHECKOUT = '/checkout',
}

/** API endpoint paths */
export enum ApiEndpoints {
    LOGIN = '/users/login',
    LOGOUT = '/users/logout',
    CURRENT_USER = '/users/me',
    REGISTER = '/users/register',
    BRANDS = '/brands',
    CARTS = '/carts',
    POSTCODE_LOOKUP = '/postcode-lookup',
}

/** Billing country codes (Country select option values) */
export enum Countries {
    NETHERLANDS = 'NL',
}

/** Payment method labels as shown in the Payment Method select */
export enum PaymentMethods {
    CASH_ON_DELIVERY = 'Cash on Delivery',
}

/** Storage state file paths */
export enum StorageStatePaths {
    APP = '.auth/app/appStorageState.json',
}
