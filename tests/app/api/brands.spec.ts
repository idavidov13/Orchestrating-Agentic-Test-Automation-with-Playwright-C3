import { ApiEndpoints } from '../../../enums/app/app';
import {
    BrandListResponse,
    BrandListResponseSchema,
} from '../../../fixtures/api/schemas/app/brandSchema';
import {
    MethodNotAllowedResponse,
    MethodNotAllowedResponseSchema,
    NotFoundResponse,
    NotFoundResponseSchema,
} from '../../../fixtures/api/schemas/util/errorResponseSchema';
import { expect, test } from '../../../fixtures/pom/test-options';

const UNSUPPORTED_METHODS = ['PUT', 'PATCH', 'DELETE'] as const;

test.describe('api/brands - GET /brands', () => {
    test(
        'should return 200 and a list of brands without authentication',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<BrandListResponse>({
                method: 'GET',
                url: ApiEndpoints.BRANDS,
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(200);
            expect(BrandListResponseSchema.parse(body)).toBeTruthy();
            expect(body.length).toBeGreaterThan(0);
        }
    );

    test(
        'should return brands with unique ids and slugs',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<BrandListResponse>({
                method: 'GET',
                url: ApiEndpoints.BRANDS,
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(200);
            expect(BrandListResponseSchema.parse(body)).toBeTruthy();

            const ids = body.map((brand) => brand.id);
            const slugs = body.map((brand) => brand.slug);
            expect(new Set(ids).size).toBe(ids.length);
            expect(new Set(slugs).size).toBe(slugs.length);
        }
    );

    for (const method of UNSUPPORTED_METHODS) {
        test(
            `should return 405 for unsupported method ${method}`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } =
                    await apiRequest<MethodNotAllowedResponse>({
                        method,
                        url: ApiEndpoints.BRANDS,
                        baseUrl: process.env.API_URL,
                    });

                expect(status).toBe(405);
                expect(MethodNotAllowedResponseSchema.parse(body)).toBeTruthy();
            }
        );
    }

    /* eslint-disable playwright/no-skipped-test */
    // FIXME: OpenAPI documents 404 (ResourceNotFoundResponse) for GET /brands,
    // but the collection route has no path/query parameters, so the spec gives
    // no condition that can trigger it. Un-skip once the trigger is documented.
    test.skip(
        'should return 404 when brands resource is not found',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<NotFoundResponse>({
                method: 'GET',
                url: ApiEndpoints.BRANDS,
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(404);
            expect(NotFoundResponseSchema.parse(body)).toBeTruthy();
        }
    );
    /* eslint-enable playwright/no-skipped-test */
});
