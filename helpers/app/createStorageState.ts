import { chromium, expect } from '@playwright/test';
import { ApiEndpoints, StorageStatePaths } from '../../enums/app/app';
import { AppPage } from '../../pages/app/app.page';
import { ApiRequestFn } from '../../fixtures/api/api-types';
import {
    UserResponse,
    UserResponseSchema,
} from '../../fixtures/api/schemas/app/userSchema';

/**
 * Creates and saves the browser storage state after successful login.
 * This is used for authentication setup before running tests.
 *
 * The storage state includes cookies and localStorage, allowing subsequent
 * tests to start in an authenticated state without performing login.
 *
 * @returns {Promise<void>} Resolves when storage state is saved.
 *
 * @example
 * ```ts
 * // In auth.setup.ts
 * test('Setup authentication', async () => {
 *   await createAppStorageState();
 * });
 * ```
 */
export async function createAppStorageState(): Promise<void> {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const appPage = new AppPage(page);

    await appPage.openLoginPage();
    await appPage.loginAndVerify(
        process.env.APP_EMAIL!,
        process.env.APP_PASSWORD!
    );

    await context.storageState({ path: StorageStatePaths.APP });
    await browser.close();
}

/**
 * Logs in via API with the given credentials and returns the access token.
 * Use this when a test needs a token for a specific role (e.g. admin),
 * since `process.env.ACCESS_TOKEN` set in the setup project is not shared
 * with other worker processes.
 *
 * @param {ApiRequestFn} apiRequest - The API request function from fixtures.
 * @param {string} email - Account email (from `process.env.*`).
 * @param {string} password - Account password (from `process.env.*`).
 * @returns {Promise<string>} The access token for the account.
 *
 * @example
 * ```ts
 * const adminToken = await getAccessToken(
 *     apiRequest,
 *     process.env.ADMIN_EMAIL!,
 *     process.env.ADMIN_PASSWORD!
 * );
 * ```
 */
export async function getAccessToken(
    apiRequest: ApiRequestFn,
    email: string,
    password: string
): Promise<string> {
    const { status, body } = await apiRequest<UserResponse>({
        method: 'POST',
        url: ApiEndpoints.LOGIN,
        baseUrl: process.env.API_URL,
        body: { email, password },
    });

    expect(status).toBe(200);
    expect(UserResponseSchema.parse(body)).toBeTruthy();

    return body.access_token;
}

/**
 * Authenticates via API and stores the access token in environment variables.
 * Use this for API tests that require authentication headers.
 *
 * The token is stored in `process.env.ACCESS_TOKEN` and can be used
 * with the `headers` parameter in API requests.
 *
 * @param {ApiRequestFn} apiRequest - The API request function from fixtures.
 * @returns {Promise<void>} Resolves when token is stored.
 *
 * @example
 * ```ts
 * // In auth.setup.ts
 * test('Setup API authentication', async ({ apiRequest }) => {
 *   await setUserAccessToken(apiRequest);
 * });
 *
 * // In API tests
 * const { status, body } = await apiRequest<UserData>({
 *   method: 'GET',
 *   url: '/users/me',
 *   baseUrl: process.env.API_URL,
 *   headers: process.env.ACCESS_TOKEN,
 * });
 * ```
 */
export async function setUserAccessToken(
    apiRequest: ApiRequestFn
): Promise<void> {
    process.env['ACCESS_TOKEN'] = await getAccessToken(
        apiRequest,
        process.env.APP_EMAIL!,
        process.env.APP_PASSWORD!
    );
}
