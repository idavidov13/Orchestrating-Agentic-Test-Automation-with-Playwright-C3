/**
 * Domain-specific invalid `brandId` path-parameter values.
 *
 * Used by data-driven 404 tests across GET / PUT / PATCH / DELETE
 * `/brands/{brandId}`. Brand ids are ULID strings, so every value below is
 * a malformed id that must never resolve to a brand.
 *
 * Format: `.ts` with `as const` exports.
 * See `.claude/skills/data-strategy/SKILL.md` (Phase 3, Tier 2 — domain-specific).
 */

export const INVALID_BRAND_IDS = [
    { description: 'numeric string', value: '99999' },
    { description: 'boolean-like string', value: 'true' },
    { description: 'special characters', value: '<script>' },
    { description: 'SQL injection attempt', value: '1 OR 1=1' },
] as const;
