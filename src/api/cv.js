import { postFile, postJson } from './client.js';

export const MAX_CV_BYTES = 10 * 1024 * 1024;

/**
 * Rejects a file before upload. Returns null when the file is acceptable.
 * @returns {string | null} message to display, or null
 */
export function validateCvFile(file) {
  if (!file) return 'Choose a PDF file to upload.';

  const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  if (!isPdf) return 'That file is not a PDF. Upload your CV as a PDF.';

  if (file.size > MAX_CV_BYTES) return 'That file exceeds 10 MB. Upload a smaller PDF.';

  return null;
}

/** @returns {Promise<import('../types/api.js').StructuredCv>} */
export async function parseCv(file) {
  const { cv } = await postFile('/api/cv/parse', file);
  return cv;
}

/**
 * Generates or explicitly regenerates the signed-in user's draft for one
 * matched role. The journey and personal fields stay server-side.
 *
 * @param {{ roleId?: string, regenerate?: boolean }} [request]
 */
export function generateCv({ roleId, regenerate = false } = {}) {
  return postJson('/api/cv/generate', {
    ...(roleId ? { roleId } : {}),
    regenerate,
  });
}

/**
 * Requests a grounded rewording of one CV section. Only the current section
 * text and identifiers are sent; the journey and personal fields stay server-side.
 *
 * @param {{
 *   section: 'summary' | 'experience',
 *   text: string,
 *   roleId: string,
 *   experienceIndex?: number,
 *   previous?: string[]
 * }} request
 */
export function improveCvText({ section, text, roleId, experienceIndex, previous = [] }) {
  return postJson('/api/cv/improve', {
    section,
    roleId,
    ...(experienceIndex === undefined ? {} : { experienceIndex }),
    currentText: text,
    previousSuggestions: previous,
  });
}
