import { faker } from '@faker-js/faker';
import {
    BrandRequest,
    BrandRequestSchema,
} from '../../../fixtures/api/schemas/app/brandSchema';

/**
 * Generates a valid brand request payload with randomized data using Faker.
 * The slug is derived from the name and suffixed with a unique token so that
 * parallel runs never collide on the API's unique-slug constraint.
 *
 * @param {Partial<BrandRequest>} overrides - Optional partial brand payload to override default values.
 * @returns {BrandRequest} A valid brand payload matching the BrandRequestSchema.
 *
 * @example
 * // Generate a random brand
 * const brand = generateBrand();
 *
 * @example
 * // Generate a brand that reuses an existing slug
 * const duplicate = generateBrand({ slug: existing.slug });
 */
export const generateBrand = (
    overrides?: Partial<BrandRequest>
): BrandRequest => {
    const name = `${faker.company.name()} ${faker.string.alphanumeric(8)}`;
    const defaultBrand: BrandRequest = {
        name,
        slug: faker.helpers.slugify(name).toLowerCase(),
    };

    const mergedBrand = { ...defaultBrand, ...overrides };

    // Validate against schema to ensure type safety
    return BrandRequestSchema.parse(mergedBrand);
};
