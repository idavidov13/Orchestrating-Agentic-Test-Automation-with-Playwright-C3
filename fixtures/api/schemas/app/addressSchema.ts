import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/**
 * Schema for GET /postcode-lookup query parameters
 * (OpenAPI: paths./postcode-lookup.get.parameters).
 * The checkout billing form sends these to auto-fill street, city and state.
 */
export const PostcodeLookupRequestSchema = z.strictObject({
    country: z.string().max(40),
    postcode: z.string().max(10),
    house_number: z.string().max(10),
});

// Type exports
export type PostcodeLookupRequest = zOutput<typeof PostcodeLookupRequestSchema>;
