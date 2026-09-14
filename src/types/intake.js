// @ts-check

/**
 * @typedef {import('./api.js').StructuredCv} StructuredCv
 * @typedef {import('./api.js').Snapshot} Snapshot
 * @typedef {import('./api.js').GapResult} GapResult
 * @typedef {import('./api.js').RecommendedRole} RecommendedRole
 */

/**
 * @typedef {StructuredCv & { fileName: string, fileSize: number }} StoredCv
 */

/**
 * Guest session state, persisted to local storage and rehydrated on load.
 *
 * @typedef {Object} IntakeState
 * @property {StoredCv | null} cv
 * @property {boolean} cvParsed
 * @property {{ duration_years: number, activities: string[] }} break
 * @property {Snapshot | null} snapshot
 * @property {RecommendedRole | null} selectedRole
 * @property {GapResult | null} gapResult
 * @property {number} currentStepIndex
 */

export {};
