import { describe, expect, it } from 'vitest';
import { buildCvPdf, cvFileName } from '../../src/lib/cvPdf.js';

const draft = {
  version: 3,
  roleId: 'role-project',
  personal: { name: '', email: '', phone: '', location: '' },
  summary: 'Operations professional with project coordination experience.',
  skills: ['Project coordination', 'Planning'],
  experiences: [
    {
      title: 'Operations Coordinator',
      organisation: 'Acme Sdn Bhd',
      start: '2018',
      end: '2021',
      description: '- Coordinated delivery across teams.',
    },
  ],
  // Legacy input must not create a separate section in the current PDF.
  careerBreak: {
    include: true,
    duration: 'About 2 years',
    description: 'Caregiving and family responsibilities.',
  },
};

describe('buildCvPdf', () => {
  it('creates a PDF with generated content and labelled blank personal fields', async () => {
    const blob = buildCvPdf(draft);
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder().decode(bytes);

    expect(blob.type).toBe('application/pdf');
    expect(text.startsWith('%PDF-1.4')).toBe(true);
    expect(text).toContain('Operations professional');
    expect(text).toContain('Project coordination');
    expect(text).toContain('Acme Sdn Bhd');
    expect(text).toContain('/TU (Full name)');
    expect(text).toContain('/TU (Email)');
    expect(text).toContain('/TU (Phone)');
    expect(text).toContain('/TU (Location)');
    expect(text).toContain('/V (Your full name)');
    expect(text).toContain('/V (Email address)');
    expect(text).toContain('/V (Phone number)');
    expect(text).toContain('/V (City, state)');
  });

  it('does not render a separate career-break section', async () => {
    const bytes = new Uint8Array(await buildCvPdf(draft).arrayBuffer());
    const text = new TextDecoder().decode(bytes);

    expect(text).not.toContain('Career break');
    expect(text).not.toContain('Caregiving');
    expect(text).not.toContain('family responsibilities');
  });
});

describe('cvFileName', () => {
  it('uses a safe personal-name filename and falls back to My CV', () => {
    expect(cvFileName('Aisha Rahman')).toBe('Aisha Rahman CV.pdf');
    expect(cvFileName('')).toBe('My CV.pdf');
  });
});
