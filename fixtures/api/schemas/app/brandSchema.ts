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

/**
 * Schema for POST/PUT/PATCH /brands request body
 * (OpenAPI: components.schemas.BrandRequest).
 */
export const BrandRequestSchema = z.strictObject({
    name: z.string(),
    slug: z.string(),
});

/**
 * Schema for PUT/PATCH /brands/{brandId} response
 * (OpenAPI: components.responses.UpdateResponse).
 */
export const BrandUpdateResponseSchema = z.strictObject({
    success: z.boolean(),
});

// Type exports
export type BrandResponse = zOutput<typeof BrandResponseSchema>;
export type BrandListResponse = zOutput<typeof BrandListResponseSchema>;
export type BrandRequest = zOutput<typeof BrandRequestSchema>;
export type BrandUpdateResponse = zOutput<typeof BrandUpdateResponseSchema>;
