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
 * Requests a reworded version of one piece of CV text. Only the text, its
 * section, the target role and the user's skills are sent; contact details are
 * never transmitted. `previous` lists suggestions already shown so the next one
 * differs.
 *
 * @param {{ section: 'summary' | 'experience', text: string, role: string, skills: string[], previous: string[] }} request
 * @returns {Promise<{ suggestion: string }>}
 */
export function improveCvText({ section, text, role, skills, previous }) {
  return postJson('/api/cv/improve', {
    section,
    text,
    target_role: role,
    supported_skills: skills,
    previous_suggestions: previous,
  });
}
