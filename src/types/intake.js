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
 * @property {CvBook | null} cvDraft
 * @property {number} currentStepIndex
 */

/**
 * A CV draft is composed only from Journey details plus contact fields entered
 * directly by the user.
 * @typedef {Object} CvDraft
 * @property {{ name: string, email: string, phone: string, location: string }} personal
 * @property {string} summary
 * @property {string[]} skills
 * @property {{ title: string, organisation: string, start: string, end: string, description: string }[]} experiences
 * @property {{ include: boolean | null, duration: string, description: string } | null} careerBreak
 */

/**
 * The user's CV drafts, one per role. Contact details are shared by all drafts.
 * @typedef {Object} CvBook
 * @property {number} version
 * @property {string | null} activeRoleId
 * @property {{ name: string, email: string, phone: string, location: string }} personal
 * @property {Record<string, CvDraft>} drafts
 * @property {Record<string, GapResult>} gaps
 */

export {};
