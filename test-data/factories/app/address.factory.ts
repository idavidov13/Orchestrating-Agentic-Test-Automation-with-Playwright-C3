import { faker } from '@faker-js/faker';
import { Countries } from '../../../enums/app/app';
import {
    PostcodeLookupRequest,
    PostcodeLookupRequestSchema,
} from '../../../fixtures/api/schemas/app/addressSchema';

/**
 * Generates billing address lookup input (country, postcode, house number)
 * with randomized data using Faker. The checkout form resolves street, city
 * and state from these values, so only the lookup keys are generated here —
 * manually entered cities are rejected by the API when they do not belong
 * to the selected country.
 *
 * Defaults to a Dutch postcode (`1234AB` format).
 *
 * @param {Partial<PostcodeLookupRequest>} overrides - Optional partial lookup input to override default values.
 * @returns {PostcodeLookupRequest} Valid lookup input matching the PostcodeLookupRequestSchema.
 *
 * @example
 * // Generate a random Dutch billing address lookup
 * const address = generateBillingAddress();
 */
export const generateBillingAddress = (
    overrides?: Partial<PostcodeLookupRequest>
): PostcodeLookupRequest => {
    const defaultAddress: PostcodeLookupRequest = {
        country: Countries.NETHERLANDS,
        postcode: `${faker.number.int({ min: 1000, max: 9999 })}${faker.string.alpha({ length: 2, casing: 'upper' })}`,
        house_number: faker.number.int({ min: 1, max: 999 }).toString(),
    };

    const mergedAddress = { ...defaultAddress, ...overrides };

    // Validate against schema to ensure type safety
    return PostcodeLookupRequestSchema.parse(mergedAddress);
};
