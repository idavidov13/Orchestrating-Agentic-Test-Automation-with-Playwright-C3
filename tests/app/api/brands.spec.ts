import { faker } from '@faker-js/faker';
import { ApiEndpoints } from '../../../enums/app/app';
import {
    BrandListResponse,
    BrandListResponseSchema,
    BrandRequest,
    BrandResponse,
    BrandResponseSchema,
    BrandUpdateResponse,
    BrandUpdateResponseSchema,
} from '../../../fixtures/api/schemas/app/brandSchema';
import {
    DuplicateConflictResponse,
    DuplicateConflictResponseSchema,
    ForbiddenResponse,
    ForbiddenResponseSchema,
    MethodNotAllowedResponse,
    MethodNotAllowedResponseSchema,
    NotFoundResponse,
    NotFoundResponseSchema,
    UnauthenticatedResponse,
    UnauthenticatedResponseSchema,
    UnprocessableEntityResponse,
    UnprocessableEntityResponseSchema,
} from '../../../fixtures/api/schemas/util/errorResponseSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { ApiRequestFn } from '../../../fixtures/api/api-types';
import { getAccessToken } from '../../../helpers/app/createStorageState';
import { generateBrand } from '../../../test-data/factories/app/brand.factory';
import { INVALID_BRAND_IDS } from '../../../test-data/static/app/invalidBrandIds';
import { INVALID_STRING_VALUES } from '../../../test-data/static/util/invalid-values';

const UNSUPPORTED_METHODS = ['PUT', 'PATCH', 'DELETE'] as const;
const BRAND_FIELDS = ['name', 'slug'] as const;

const brandUrl = (brandId: string): string =>
    `${ApiEndpoints.BRANDS}/${encodeURIComponent(brandId)}`;

/**
 * Creates a brand via POST /brands and returns the parsed response.
 *
 * @param {ApiRequestFn} apiRequest - The API request function from fixtures.
 * @param {BrandRequest} payload - Brand payload to create.
 * @returns {Promise<BrandResponse>} The created brand.
 */
const createBrand = async (
    apiRequest: ApiRequestFn,
    payload: BrandRequest = generateBrand()
): Promise<BrandResponse> => {
    const { status, body } = await apiRequest<BrandResponse>({
        method: 'POST',
        url: ApiEndpoints.BRANDS,
        baseUrl: process.env.API_URL,
        body: payload,
    });

    expect(status).toBe(201);
    expect(BrandResponseSchema.parse(body)).toBeTruthy();
    return body;
};

/**
 * Deletes every given brand with an admin token. Ignores brands that are
 * already gone so cleanup stays idempotent.
 *
 * @param {ApiRequestFn} apiRequest - The API request function from fixtures.
 * @param {string[]} brandIds - Ids of brands created by the tests.
 * @returns {Promise<void>} Resolves once every brand is removed.
 */
const deleteBrands = async (
    apiRequest: ApiRequestFn,
    brandIds: string[]
): Promise<void> => {
    if (brandIds.length === 0) return;
    const adminToken = await getAccessToken(
        apiRequest,
        process.env.ADMIN_EMAIL!,
        process.env.ADMIN_PASSWORD!
    );
    for (const brandId of brandIds) {
        const { status } = await apiRequest<null>({
            method: 'DELETE',
            url: brandUrl(brandId),
            baseUrl: process.env.API_URL,
            headers: adminToken,
        });
        expect([204, 404]).toContain(status);
    }
};

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

test.describe('api/brands - POST /brands', () => {
    const createdBrandIds: string[] = [];

    test.afterAll(async ({ apiRequest }) => {
        await deleteBrands(apiRequest, createdBrandIds);
    });

    test(
        'should return 201 and the created brand',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const brandData = generateBrand();

            const { status, body } = await apiRequest<BrandResponse>({
                method: 'POST',
                url: ApiEndpoints.BRANDS,
                baseUrl: process.env.API_URL,
                body: brandData,
            });

            expect(status).toBe(201);
            expect(BrandResponseSchema.parse(body)).toBeTruthy();
            createdBrandIds.push(body.id);
            expect(body.name).toBe(brandData.name);
            expect(body.slug).toBe(brandData.slug);
        }
    );

    test(
        'should return 409 when slug is already taken',
        { tag: '@api' },
        async ({ apiRequest }) => {
            let existingBrand: BrandResponse;

            await test.step('Create brand via POST /brands', async () => {
                existingBrand = await createBrand(apiRequest);
                createdBrandIds.push(existingBrand.id);
            });

            await test.step('Create brand with duplicate slug via POST /brands', async () => {
                const { status, body } =
                    await apiRequest<DuplicateConflictResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BRANDS,
                        baseUrl: process.env.API_URL,
                        body: generateBrand({ slug: existingBrand.slug }),
                    });

                expect(status).toBe(409);
                expect(
                    DuplicateConflictResponseSchema.parse(body)
                ).toBeTruthy();
            });
        }
    );

    test(
        'should return 422 for empty body',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } =
                await apiRequest<UnprocessableEntityResponse>({
                    method: 'POST',
                    url: ApiEndpoints.BRANDS,
                    baseUrl: process.env.API_URL,
                    body: {},
                });

            expect(status).toBe(422);
            expect(UnprocessableEntityResponseSchema.parse(body)).toBeTruthy();
        }
    );

    for (const field of BRAND_FIELDS) {
        test(
            `should return 422 when ${field} is omitted`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { [field]: _omitted, ...payload } = generateBrand();

                const { status, body } =
                    await apiRequest<UnprocessableEntityResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BRANDS,
                        baseUrl: process.env.API_URL,
                        body: payload,
                    });

                expect(status).toBe(422);
                expect(
                    UnprocessableEntityResponseSchema.parse(body)
                ).toBeTruthy();
                expect(body).toHaveProperty(field);
            }
        );

        for (const invalidValue of INVALID_STRING_VALUES) {
            test(
                `should return 422 when ${field} is ${String(invalidValue)}`,
                { tag: '@api' },
                async ({ apiRequest }) => {
                    const { status, body } =
                        await apiRequest<UnprocessableEntityResponse>({
                            method: 'POST',
                            url: ApiEndpoints.BRANDS,
                            baseUrl: process.env.API_URL,
                            body: { ...generateBrand(), [field]: invalidValue },
                        });

                    expect(status).toBe(422);
                    expect(
                        UnprocessableEntityResponseSchema.parse(body)
                    ).toBeTruthy();
                    expect(body).toHaveProperty(field);
                }
            );
        }
    }

    /* eslint-disable playwright/no-skipped-test */
    // FIXME: OpenAPI documents 404 (ItemNotFoundResponse) for POST /brands,
    // but the collection route has no path parameters and the request body
    // references no other resource, so the spec gives no condition that can
    // trigger it. Un-skip once the trigger is documented.
    test.skip(
        'should return 404 when brand item is not found',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<NotFoundResponse>({
                method: 'POST',
                url: ApiEndpoints.BRANDS,
                baseUrl: process.env.API_URL,
                body: generateBrand(),
            });

            expect(status).toBe(404);
            expect(NotFoundResponseSchema.parse(body)).toBeTruthy();
        }
    );
    /* eslint-enable playwright/no-skipped-test */
});

test.describe('api/brands - GET /brands/{brandId}', () => {
    let brand: BrandResponse;

    test.beforeAll(async ({ apiRequest }) => {
        brand = await createBrand(apiRequest);
    });

    test.afterAll(async ({ apiRequest }) => {
        await deleteBrands(apiRequest, [brand.id]);
    });

    test(
        'should return 200 and the requested brand',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<BrandResponse>({
                method: 'GET',
                url: brandUrl(brand.id),
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(200);
            expect(BrandResponseSchema.parse(body)).toBeTruthy();
            expect(body).toEqual(brand);
        }
    );

    test(
        'should return 404 for non-existent brandId',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<NotFoundResponse>({
                method: 'GET',
                url: brandUrl(faker.string.ulid()),
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(404);
            expect(NotFoundResponseSchema.parse(body)).toBeTruthy();
        }
    );

    for (const { description, value } of INVALID_BRAND_IDS) {
        test(
            `should return 404 for invalid brandId - ${description}`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status } = await apiRequest<NotFoundResponse>({
                    method: 'GET',
                    url: brandUrl(value),
                    baseUrl: process.env.API_URL,
                });

                expect(status).toBe(404);
            }
        );
    }

    test(
        'should return 405 for unsupported method POST',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<MethodNotAllowedResponse>(
                {
                    method: 'POST',
                    url: brandUrl(brand.id),
                    baseUrl: process.env.API_URL,
                    body: generateBrand(),
                }
            );

            expect(status).toBe(405);
            expect(MethodNotAllowedResponseSchema.parse(body)).toBeTruthy();
        }
    );
});

for (const method of ['PUT', 'PATCH'] as const) {
    test.describe(`api/brands - ${method} /brands/{brandId}`, () => {
        let brand: BrandResponse;
        let otherBrand: BrandResponse;

        test.beforeAll(async ({ apiRequest }) => {
            brand = await createBrand(apiRequest);
            otherBrand = await createBrand(apiRequest);
        });

        test.afterAll(async ({ apiRequest }) => {
            await deleteBrands(apiRequest, [brand.id, otherBrand.id]);
        });

        test(
            `should return 200 and update the brand via ${method}`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const updateData = generateBrand();

                await test.step(`Update brand via ${method} /brands/{brandId}`, async () => {
                    const { status, body } =
                        await apiRequest<BrandUpdateResponse>({
                            method,
                            url: brandUrl(brand.id),
                            baseUrl: process.env.API_URL,
                            body: updateData,
                        });

                    expect(status).toBe(200);
                    expect(BrandUpdateResponseSchema.parse(body)).toBeTruthy();
                    expect(body.success).toBe(true);
                });

                await test.step('Verify brand via GET /brands/{brandId}', async () => {
                    const { status, body } = await apiRequest<BrandResponse>({
                        method: 'GET',
                        url: brandUrl(brand.id),
                        baseUrl: process.env.API_URL,
                    });

                    expect(status).toBe(200);
                    expect(BrandResponseSchema.parse(body)).toBeTruthy();
                    expect(body).toEqual({ id: brand.id, ...updateData });
                });
            }
        );

        test(
            'should return 404 for non-existent brandId',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<NotFoundResponse>({
                    method,
                    url: brandUrl(faker.string.ulid()),
                    baseUrl: process.env.API_URL,
                    body: generateBrand(),
                });

                expect(status).toBe(404);
                expect(NotFoundResponseSchema.parse(body)).toBeTruthy();
            }
        );

        for (const { description, value } of INVALID_BRAND_IDS) {
            test(
                `should return 404 for invalid brandId - ${description}`,
                { tag: '@api' },
                async ({ apiRequest }) => {
                    const { status } = await apiRequest<NotFoundResponse>({
                        method,
                        url: brandUrl(value),
                        baseUrl: process.env.API_URL,
                        body: generateBrand(),
                    });

                    expect(status).toBe(404);
                }
            );
        }

        test(
            'should return 409 when slug is already taken',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } =
                    await apiRequest<DuplicateConflictResponse>({
                        method,
                        url: brandUrl(brand.id),
                        baseUrl: process.env.API_URL,
                        body: generateBrand({ slug: otherBrand.slug }),
                    });

                expect(status).toBe(409);
                expect(
                    DuplicateConflictResponseSchema.parse(body)
                ).toBeTruthy();
            }
        );

        for (const field of BRAND_FIELDS) {
            // `undefined` drops the key from the JSON body, which is an
            // omission rather than a type mismatch — PATCH accepts omissions
            // by design, and PUT omissions are covered in their own describe.
            for (const invalidValue of INVALID_STRING_VALUES.filter(
                (value) => value !== undefined
            )) {
                test(
                    `should return 422 when ${field} is ${String(invalidValue)}`,
                    { tag: '@api' },
                    async ({ apiRequest }) => {
                        const { status, body } =
                            await apiRequest<UnprocessableEntityResponse>({
                                method,
                                url: brandUrl(brand.id),
                                baseUrl: process.env.API_URL,
                                body: {
                                    ...generateBrand(),
                                    [field]: invalidValue,
                                },
                            });

                        expect(status).toBe(422);
                        expect(
                            UnprocessableEntityResponseSchema.parse(body)
                        ).toBeTruthy();
                        expect(body).toHaveProperty(field);
                    }
                );
            }
        }
    });
}

/* eslint-disable playwright/no-skipped-test */
// FIXME: PUT /brands/{brandId} returns 200 for an empty body or a body missing
// `name` / `slug`, i.e. it behaves like PATCH, while POST /brands rejects the
// same payloads with 422. OpenAPI's BrandRequest declares no `required` list,
// so the contract is ambiguous — raise with backend to either enforce a full
// body on PUT (expected replace semantics) or document PUT as partial.
test.describe
    .skip('api/brands - PUT /brands/{brandId} full-body validation', () => {
    let brand: BrandResponse;

    test.beforeAll(async ({ apiRequest }) => {
        brand = await createBrand(apiRequest);
    });

    test.afterAll(async ({ apiRequest }) => {
        await deleteBrands(apiRequest, [brand.id]);
    });

    test(
        'should return 422 for empty body',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } =
                await apiRequest<UnprocessableEntityResponse>({
                    method: 'PUT',
                    url: brandUrl(brand.id),
                    baseUrl: process.env.API_URL,
                    body: {},
                });

            expect(status).toBe(422);
            expect(UnprocessableEntityResponseSchema.parse(body)).toBeTruthy();
        }
    );

    for (const field of BRAND_FIELDS) {
        test(
            `should return 422 when ${field} is omitted`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { [field]: _omitted, ...payload } = generateBrand();

                const { status, body } =
                    await apiRequest<UnprocessableEntityResponse>({
                        method: 'PUT',
                        url: brandUrl(brand.id),
                        baseUrl: process.env.API_URL,
                        body: payload,
                    });

                expect(status).toBe(422);
                expect(
                    UnprocessableEntityResponseSchema.parse(body)
                ).toBeTruthy();
                expect(body).toHaveProperty(field);
            }
        );
    }
});

/* eslint-enable playwright/no-skipped-test */

test.describe('api/brands - PATCH /brands/{brandId} partial update', () => {
    let brand: BrandResponse;

    test.beforeAll(async ({ apiRequest }) => {
        brand = await createBrand(apiRequest);
    });

    test.afterAll(async ({ apiRequest }) => {
        await deleteBrands(apiRequest, [brand.id]);
    });

    test(
        'should return 200 and update only the name',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { name } = generateBrand();

            await test.step('Patch brand name via PATCH /brands/{brandId}', async () => {
                const { status, body } = await apiRequest<BrandUpdateResponse>({
                    method: 'PATCH',
                    url: brandUrl(brand.id),
                    baseUrl: process.env.API_URL,
                    body: { name },
                });

                expect(status).toBe(200);
                expect(BrandUpdateResponseSchema.parse(body)).toBeTruthy();
                expect(body.success).toBe(true);
            });

            await test.step('Verify brand via GET /brands/{brandId}', async () => {
                const { status, body } = await apiRequest<BrandResponse>({
                    method: 'GET',
                    url: brandUrl(brand.id),
                    baseUrl: process.env.API_URL,
                });

                expect(status).toBe(200);
                expect(BrandResponseSchema.parse(body)).toBeTruthy();
                expect(body.name).toBe(name);
                expect(body.slug).toBe(brand.slug);
            });
        }
    );
});

test.describe('api/brands - DELETE /brands/{brandId}', () => {
    const createdBrandIds: string[] = [];
    let adminToken: string;

    test.beforeAll(async ({ apiRequest }) => {
        adminToken = await getAccessToken(
            apiRequest,
            process.env.ADMIN_EMAIL!,
            process.env.ADMIN_PASSWORD!
        );
    });

    test.afterAll(async ({ apiRequest }) => {
        await deleteBrands(apiRequest, createdBrandIds);
    });

    test(
        'should return 204 and remove the brand for admin',
        { tag: '@api' },
        async ({ apiRequest }) => {
            let brand: BrandResponse;

            await test.step('Create brand via POST /brands', async () => {
                brand = await createBrand(apiRequest);
                createdBrandIds.push(brand.id);
            });

            await test.step('Delete brand via DELETE /brands/{brandId}', async () => {
                const { status, body } = await apiRequest<null>({
                    method: 'DELETE',
                    url: brandUrl(brand.id),
                    baseUrl: process.env.API_URL,
                    headers: adminToken,
                });

                expect(status).toBe(204);
                expect(body).toBeNull();
            });

            await test.step('Verify brand is gone via GET /brands/{brandId}', async () => {
                const { status, body } = await apiRequest<NotFoundResponse>({
                    method: 'GET',
                    url: brandUrl(brand.id),
                    baseUrl: process.env.API_URL,
                });

                expect(status).toBe(404);
                expect(NotFoundResponseSchema.parse(body)).toBeTruthy();
            });
        }
    );

    test(
        'should return 401 without authorization',
        { tag: '@api' },
        async ({ apiRequest }) => {
            let brand: BrandResponse;

            await test.step('Create brand via POST /brands', async () => {
                brand = await createBrand(apiRequest);
                createdBrandIds.push(brand.id);
            });

            await test.step('Delete brand without token via DELETE /brands/{brandId}', async () => {
                const { status, body } =
                    await apiRequest<UnauthenticatedResponse>({
                        method: 'DELETE',
                        url: brandUrl(brand.id),
                        baseUrl: process.env.API_URL,
                    });

                expect(status).toBe(401);
                expect(UnauthenticatedResponseSchema.parse(body)).toBeTruthy();
            });
        }
    );

    test(
        'should return 403 for non-admin user',
        { tag: '@api' },
        async ({ apiRequest }) => {
            let brand: BrandResponse;
            let customerToken: string;

            await test.step('Log in as customer via POST /users/login', async () => {
                customerToken = await getAccessToken(
                    apiRequest,
                    process.env.APP_EMAIL!,
                    process.env.APP_PASSWORD!
                );
            });

            await test.step('Create brand via POST /brands', async () => {
                brand = await createBrand(apiRequest);
                createdBrandIds.push(brand.id);
            });

            await test.step('Delete brand as customer via DELETE /brands/{brandId}', async () => {
                const { status, body } = await apiRequest<ForbiddenResponse>({
                    method: 'DELETE',
                    url: brandUrl(brand.id),
                    baseUrl: process.env.API_URL,
                    headers: customerToken,
                });

                expect(status).toBe(403);
                expect(ForbiddenResponseSchema.parse(body)).toBeTruthy();
            });
        }
    );

    test(
        'should return 404 for non-existent brandId',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<NotFoundResponse>({
                method: 'DELETE',
                url: brandUrl(faker.string.ulid()),
                baseUrl: process.env.API_URL,
                headers: adminToken,
            });

            expect(status).toBe(404);
            expect(NotFoundResponseSchema.parse(body)).toBeTruthy();
        }
    );

    for (const { description, value } of INVALID_BRAND_IDS) {
        test(
            `should return 404 for invalid brandId - ${description}`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status } = await apiRequest<NotFoundResponse>({
                    method: 'DELETE',
                    url: brandUrl(value),
                    baseUrl: process.env.API_URL,
                    headers: adminToken,
                });

                expect(status).toBe(404);
            }
        );
    }

    /* eslint-disable playwright/no-skipped-test */
    // FIXME: OpenAPI documents 409 (ConflictResponse, "entity is used
    // elsewhere") for DELETE /brands/{brandId}. Triggering it requires a
    // product that references the brand (POST /products + category/image
    // lookups), which is out of scope for the Brand suite; deleting a seeded
    // in-use brand is not acceptable because a backend bug would destroy
    // shared data. Un-skip once a product-seeding fixture exists.
    test.skip(
        'should return 409 when brand is used by a product',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status } = await apiRequest<null>({
                method: 'DELETE',
                url: brandUrl(faker.string.ulid()),
                baseUrl: process.env.API_URL,
                headers: adminToken,
            });

            expect(status).toBe(409);
        }
    );

    // FIXME: OpenAPI documents 422 (UnprocessableEntityResponse) for
    // DELETE /brands/{brandId}, but the operation has no request body and the
    // spec gives no condition that can trigger it. Un-skip once documented.
    test.skip(
        'should return 422 when delete request cannot be processed',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status } = await apiRequest<UnprocessableEntityResponse>({
                method: 'DELETE',
                url: brandUrl(faker.string.ulid()),
                baseUrl: process.env.API_URL,
                headers: adminToken,
            });

            expect(status).toBe(422);
        }
    );
    /* eslint-enable playwright/no-skipped-test */

    test(
        'should return 405 for unsupported method POST',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<MethodNotAllowedResponse>(
                {
                    method: 'POST',
                    url: brandUrl(faker.string.ulid()),
                    baseUrl: process.env.API_URL,
                    headers: adminToken,
                }
            );

            expect(status).toBe(405);
            expect(MethodNotAllowedResponseSchema.parse(body)).toBeTruthy();
        }
    );
});
