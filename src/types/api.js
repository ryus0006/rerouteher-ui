// @ts-check

/**
 * @typedef {Object} Experience
 * @property {string} title
 * @property {string} organisation
 * @property {string} start
 * @property {string} end
 * @property {string} description
 */

/**
 * @typedef {Object} StructuredCv
 * @property {string} raw_text
 * @property {Experience[]} experiences
 * @property {string[]} skill_mentions
 */

/**
 * @typedef {Object} ProfessionalSkill
 * @property {string} skill
 * @property {string | null} [skill_id]
 * @property {'experience'} source
 * @property {string} evidence
 * @property {string | null} [definition] Short ESCO definition when available.
 */

/**
 * @typedef {Object} ReframedSkill
 * @property {string} skill
 * @property {string | null} [skill_id]
 * @property {'break'} source
 * @property {string} from_activity
 * @property {string | null} [definition] Short ESCO definition when available.
 */

/**
 * @typedef {Object} PreviousOccupation
 * @property {string} role
 * @property {string} role_id
 * @property {number} confidence
 * @property {'classifier' | 'embedding'} method
 */

/**
 * @typedef {Object} RecommendedRole
 * @property {string} role
 * @property {string} role_id
 * @property {number} similarity
 */

/**
 * @typedef {Object} Snapshot
 * @property {ProfessionalSkill[]} professional_skills
 * @property {ReframedSkill[]} reframed_skills
 * @property {PreviousOccupation | null} previous_occupation
 * @property {RecommendedRole[]} recommended_roles
 */

/**
 * @typedef {Object} Gap
 * @property {string} skill_id
 * @property {string} skill
 * @property {'role' | 'ai_usage'} band
 * @property {number} importance
 * @property {number} uplift
 * @property {string | undefined} [definition] Optional ESCO-backed plain-language description
 */

/**
 * @typedef {Object} GapResult
 * @property {number} readiness
 * @property {string[]} skills_have
 * @property {Gap[]} gaps
 */

/**
 * @typedef {Object} LearningResource
 * @property {string} id
 * @property {string} skill_id
 * @property {string} title
 * @property {string} provider
 * @property {string | null} [logo]
 * @property {string} format
 * @property {number | null} [minutes]
 * @property {string} cost
 * @property {boolean} free
 * @property {string} url
 * @property {string} why
 */

/**
 * @typedef {Object} LearningGroup
 * @property {string} skill_id
 * @property {string} skill
 * @property {string | null} [icon]
 * @property {string | null} [blurb]
 */

/**
 * @typedef {'ready' | 'empty' | 'temporarily_unavailable'} JobSearchStatus
 */

/**
 * @typedef {Object} JobSearch
 * @property {JobSearchStatus} status
 * @property {string | null} searched_at
 */

/**
 * @typedef {Object} JobOpening
 * @property {string} title
 * @property {string} url
 * @property {string} found_at
 */

/**
 * @typedef {Object} EmployerMatch
 * @property {string} id
 * @property {string} name
 * @property {string} [industry]
 * @property {string} [location]
 * @property {{ text: string, bg: string, fg: string } | null} [logo]
 * @property {string | null} [logo_url]
 * @property {string} [website]
 * @property {string} [summary]
 * @property {string[]} discloses
 * @property {{ label: string, url: string } | null} [report]
 * @property {string[]} met
 * @property {string[]} unmet
 * @property {JobOpening | null} job
 */

/**
 * @typedef {Object} EmployerMatchResponse
 * @property {JobSearch} job_search
 * @property {EmployerMatch[]} employers
 */

/**
 * @typedef {Object} ProfileSkillUpdate
 * @property {'add' | 'remove'} action
 * @property {string} status
 * @property {string} skill_id
 * @property {string | null} [skill]
 * @property {string | null} [definition]
 * @property {Object} snapshot
 * @property {Object | null} [gap_result]
 * @property {Object[]} learned_skills
 */

export {};
