import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/*
 * Error-response schemas for the demo API (practicesoftwaretesting.com).
 *
 * FIXME: the OpenAPI spec documents these status codes but not their body
 * schemas, so the shapes below are captured from live responses per the
 * "Explore Before Generate" fallback (missing docs flagged upstream).
 * Re-verify whenever the spec adds error schemas.
 */

/**
 * Schema for 401 Unauthorized responses.
 * Live examples: {"error": "Unauthorized"}, {"error": "Invalid login request"}.
 */
export const UnauthorizedResponseSchema = z.strictObject({
    error: z.string(),
});

/**
 * Schema for 401 responses on protected resource routes.
 * Documented in OpenAPI as UnauthorizedResponse: {"message": "Unauthorized"}.
 */
export const UnauthenticatedResponseSchema = z.strictObject({
    message: z.string(),
});

/**
 * Schema for 403 Forbidden responses.
 * Verified live on DELETE /brands/{brandId} with a non-admin token.
 */
export const ForbiddenResponseSchema = z.strictObject({
    message: z.string(),
});

/**
 * Schema for 404 Not Found responses.
 * Live example: {"message": "Requested item not found"}.
 */
export const NotFoundResponseSchema = z.strictObject({
    message: z.string(),
});

/**
 * Schema for 405 Method Not Allowed responses.
 * Documented in OpenAPI as MethodNotAllowedResponse:
 * {"message": "Method is not allowed for the requested route"}.
 */
export const MethodNotAllowedResponseSchema = z.strictObject({
    message: z.string(),
});

/**
 * Schema for 422 Unprocessable Entity (validation) responses.
 * Live shape: a map of field name -> array of validation messages.
 */
export const UnprocessableEntityResponseSchema = z.record(
    z.string(),
    z.array(z.string())
);

/**
 * Schema for 409 duplicate-conflict responses.
 * Documented in OpenAPI as DuplicateConflictResponse — oneOf:
 * a field-level map ({"slug": ["A brand already exists with this slug."]})
 * or a generic message ({"message": "Duplicate Entry"}).
 */
export const DuplicateConflictResponseSchema = z.union([
    z
        .record(z.string(), z.array(z.string()))
        .refine((errors) => Object.keys(errors).length > 0, {
            message: 'Field-level conflict map must not be empty',
        }),
    z.strictObject({
        message: z.string(),
    }),
]);

// Type exports
export type UnauthorizedResponse = zOutput<typeof UnauthorizedResponseSchema>;
export type UnauthenticatedResponse = zOutput<
    typeof UnauthenticatedResponseSchema
>;
export type ForbiddenResponse = zOutput<typeof ForbiddenResponseSchema>;
export type NotFoundResponse = zOutput<typeof NotFoundResponseSchema>;
export type MethodNotAllowedResponse = zOutput<
    typeof MethodNotAllowedResponseSchema
>;
export type UnprocessableEntityResponse = zOutput<
    typeof UnprocessableEntityResponseSchema
>;
export type DuplicateConflictResponse = zOutput<
    typeof DuplicateConflictResponseSchema
>;
