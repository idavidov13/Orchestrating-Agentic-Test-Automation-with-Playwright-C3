import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/**
 * Schema for a single brand (OpenAPI: components.schemas.BrandResponse).
 */
export const BrandResponseSchema = z.strictObject({
    id: z.string(),
    name: z.string(),
    slug: z.string(),
});

/**
 * Schema for GET /brands response — an array of BrandResponse.
 */
export const BrandListResponseSchema = z.array(BrandResponseSchema);

// Type exports
export type BrandResponse = zOutput<typeof BrandResponseSchema>;
export type BrandListResponse = zOutput<typeof BrandListResponseSchema>;
