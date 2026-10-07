import { PERSONAL_FIELDS, formatRange } from './cvDraft.js';

/*
 * Minimal, dependency-free PDF writer for the fixed CV layout.
 *
 * Uses the built-in Helvetica faces, so no fonts are embedded. Contact details
 * are written as fillable form fields: values entered in the builder are
 * pre-filled and empty fields keep their placeholder, so they can be edited in
 * any PDF reader.
 */

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 56;
const MARGIN_TOP = 58;
const MARGIN_BOTTOM = 56;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

const INK = '0 0 0';
const RULE = '0.80 0.78 0.84';

// Advance widths (per 1000 em) for character codes 32–126.
const HELVETICA = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667,
  611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500,
  222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584,
];
const HELVETICA_BOLD = [
  278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556,
  556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667,
  611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667,
  667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556,
  278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584,
];

// Characters outside ASCII that WinAnsiEncoding places in 0x80–0x9F.
const WIN_ANSI = {
  '€': 0x80,
  '…': 0x85,
  '‘': 0x91,
  '’': 0x92,
  '“': 0x93,
  '”': 0x94,
  '•': 0x95,
  '–': 0x96,
  '—': 0x97,
};
const WIDE = { 0x85: 1000, 0x95: 350, 0x96: 556, 0x97: 1000 };

const FONTS = {
  regular: { key: 'F1', widths: HELVETICA, quote: 222, dquote: 333 },
  bold: { key: 'F2', widths: HELVETICA_BOLD, quote: 278, dquote: 500 },
};

/** Unicode to single-byte WinAnsi codes; anything unmappable becomes "?". */
function encode(text) {
  const codes = [];
  for (const char of text.normalize('NFC')) {
    const point = char.codePointAt(0);
    if (point === 9) codes.push(32);
    else if (point >= 32 && point <= 126) codes.push(point);
    else if (WIN_ANSI[char]) codes.push(WIN_ANSI[char]);
    else if (point >= 0xa0 && point <= 0xff) codes.push(point);
    else codes.push(63);
  }
  return codes;
}

function widthOf(text, font, size) {
  let units = 0;
  for (const code of encode(text)) {
    if (code >= 32 && code <= 126) units += font.widths[code - 32];
    else if (code === 0x91 || code === 0x92) units += font.quote;
    else if (code === 0x93 || code === 0x94) units += font.dquote;
    else units += WIDE[code] ?? 556;
  }
  return (units * size) / 1000;
}

/** A PDF literal string, kept 7-bit so byte offsets equal string length. */
function literal(text) {
  let out = '(';
  for (const code of encode(text)) {
    if (code === 40 || code === 41 || code === 92) out += `\\${String.fromCharCode(code)}`;
    else if (code < 32 || code > 126) out += `\\${code.toString(8).padStart(3, '0')}`;
    else out += String.fromCharCode(code);
  }
  return `${out})`;
}

// Viewers substitute their own Helvetica with slightly different metrics; wrap
// slightly before the margin so lines never overflow.
const WRAP_SAFETY = 0.97;

function wrap(text, font, size, maxWidth) {
  const width = maxWidth * WRAP_SAFETY;
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (!line || widthOf(candidate, font, size) <= width) line = candidate;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

const n = (value) => Number(value.toFixed(2));

/** Paginated layout engine that tracks a vertical cursor. */
class Layout {
  constructor() {
    this.pages = [];
    this.fields = [];
    this.addPage();
  }

  addPage() {
    this.ops = [];
    this.pages.push(this.ops);
    this.y = PAGE_H - MARGIN_TOP;
  }

  ensure(height) {
    if (this.y - height < MARGIN_BOTTOM) this.addPage();
  }

  text(content, { x = MARGIN_X, font = FONTS.regular, size = 10, color = INK, spacing = 0 } = {}) {
    this.ops.push(
      `BT /${font.key} ${size} Tf ${color} rg ${spacing ? `${spacing} Tc ` : ''}${n(x)} ${n(this.y)} Td ${literal(content)} Tj ET`
    );
  }

  rule({ color = RULE, width = 0.6, gap = 0 } = {}) {
    this.ops.push(
      `${color} RG ${width} w ${MARGIN_X} ${n(this.y - gap)} m ${n(MARGIN_X + CONTENT_W)} ${n(this.y - gap)} l S`
    );
  }

  paragraph(content, { font = FONTS.regular, size = 10, leading = 14.5, color = INK } = {}) {
    for (const block of content
      .split(/\n+/)
      .map((b) => b.trim())
      .filter(Boolean)) {
      const bullet = /^[-•*]\s+/.test(block);
      const body = block.replace(/^[-•*]\s+/, '');
      const indent = bullet ? 12 : 0;
      wrap(body, font, size, CONTENT_W - indent).forEach((line, at) => {
        this.ensure(leading);
        this.y -= leading;
        if (bullet && at === 0) this.text('•', { size, color });
        this.text(line, { x: MARGIN_X + indent, font, size, color });
      });
    }
  }

  /** Two-column bulleted list, filled row by row. */
  columns(items, { size = 10, leading = 14.5, gutter = 20 } = {}) {
    const width = (CONTENT_W - gutter) / 2;
    const indent = 12;
    for (let at = 0; at < items.length; at += 2) {
      const row = items
        .slice(at, at + 2)
        .map((item) => wrap(item, FONTS.regular, size, width - indent));
      const lines = Math.max(...row.map((cell) => cell.length));
      this.ensure(leading * lines);
      const top = this.y;
      row.forEach((cell, column) => {
        const x = MARGIN_X + column * (width + gutter);
        this.y = top;
        cell.forEach((line, index) => {
          this.y -= leading;
          if (index === 0) this.text('•', { x, size, color: INK });
          this.text(line, { x: x + indent, size });
        });
      });
      this.y = top - leading * lines;
    }
  }

  heading(title) {
    this.ensure(40);
    this.y -= 26;
    this.text(title, { font: FONTS.bold, size: 11, color: INK, spacing: 0.2 });
    this.rule({ gap: 6 });
    this.y -= 8;
  }

  field({ name, value, placeholder, x, width, height, font, size }) {
    this.fields.push({
      page: this.pages.length - 1,
      name,
      value: value?.trim() || placeholder,
      rect: [x, this.y - height * 0.28, x + width, this.y + height * 0.72],
      font,
      size,
    });
  }
}

function header(layout, personal) {
  const nameField = PERSONAL_FIELDS.find((f) => f.key === 'name');
  layout.y -= 22;
  layout.field({
    name: 'name',
    value: personal.name,
    placeholder: nameField.placeholder,
    x: MARGIN_X,
    width: CONTENT_W,
    height: 32,
    font: FONTS.bold,
    size: 24,
  });

  const contact = PERSONAL_FIELDS.filter((f) => f.key !== 'name');
  const shares = { email: 1.6, phone: 1, location: 1.1 };
  const total = contact.reduce((sum, f) => sum + shares[f.key], 0);

  layout.y -= 22;
  let x = MARGIN_X;
  for (const f of contact) {
    const width = (CONTENT_W * shares[f.key]) / total;
    layout.field({
      name: f.key,
      value: personal[f.key],
      placeholder: f.placeholder,
      x,
      width: width - 8,
      height: 15,
      font: FONTS.regular,
      size: 9.5,
    });
    x += width;
  }

  layout.y -= 12;
  layout.rule({ color: INK, width: 1.4 });
}

function experience(layout, item) {
  const title = item.title || item.organisation || 'Role';
  const dates = formatRange(item.start, item.end);
  layout.ensure(48);
  layout.y -= 16;
  if (dates) {
    layout.text(dates, {
      x: MARGIN_X + CONTENT_W - widthOf(dates, FONTS.regular, 9.5) / WRAP_SAFETY,
      size: 9.5,
      color: INK,
    });
  }
  const titleWidth = CONTENT_W - (dates ? widthOf(dates, FONTS.regular, 9.5) + 16 : 0);
  wrap(title, FONTS.bold, 10.5, titleWidth).forEach((line, at) => {
    if (at > 0) layout.y -= 14;
    layout.text(line, { font: FONTS.bold, size: 10.5 });
  });
  if (item.title && item.organisation) {
    layout.y -= 14;
    layout.text(item.organisation, { size: 10, color: INK });
  }
  if (item.description?.trim()) {
    layout.y -= 3;
    layout.paragraph(item.description);
  }
}

function layoutCv(draft) {
  const layout = new Layout();
  header(layout, draft.personal);

  if (draft.summary?.trim()) {
    layout.heading('Professional summary');
    layout.paragraph(draft.summary);
  }

  if (draft.skills.length > 0) {
    layout.heading('Core skills');
    layout.columns(draft.skills);
  }

  if (draft.experiences.length > 0) {
    layout.heading('Work experience');
    draft.experiences.forEach((item, at) => {
      if (at > 0) layout.y -= 6;
      experience(layout, item);
    });
  }

  if (draft.careerBreak?.description?.trim()) {
    layout.heading('Career break');
    if (draft.careerBreak.duration?.trim()) {
      layout.paragraph(draft.careerBreak.duration, { font: FONTS.bold, size: 10.5 });
    }
    layout.paragraph(draft.careerBreak.description);
  }

  return layout;
}

/** Serialises numbered objects with a valid cross-reference table. */
function assemble(objects, rootId, infoId) {
  let out = '%PDF-1.4\n';
  const offsets = [];
  objects.forEach((body, at) => {
    offsets[at] = out.length;
    out += `${at + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${objects.length + 1} /Root ${rootId} 0 R /Info ${infoId} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return out;
}

const stream = (content, dict = '') =>
  `<< ${dict} /Length ${content.length} >>\nstream\n${content}\nendstream`;

/**
 * Renders the CV draft to a PDF using the same layout as the builder preview.
 *
 * @param {import('../types/intake.js').CvDraft} draft
 * @param {{ title?: string }} [meta]
 * @returns {Blob}
 */
export function buildCvPdf(draft, { title = 'CV' } = {}) {
  const layout = layoutCv(draft);
  const objects = [];
  const add = (body) => objects.push(body) && objects.length;
  const reserve = () => add('');

  const catalogId = reserve();
  const pagesId = reserve();
  const regularId = add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'
  );
  const boldId = add(
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'
  );
  const fontResources = `<< /Font << /F1 ${regularId} 0 R /F2 ${boldId} 0 R >> >>`;

  const pageIds = layout.pages.map(() => reserve());
  const fieldIds = layout.fields.map((field) => {
    const [x1, y1, x2, y2] = field.rect;
    const width = n(x2 - x1);
    const height = n(y2 - y1);
    const baseline = n(height * 0.28);
    const appearance = add(
      stream(
        `/Tx BMC q BT /${field.font.key} ${field.size} Tf ${INK} rg 0 ${baseline} Td ${literal(field.value)} Tj ET Q EMC`,
        `/Type /XObject /Subtype /Form /BBox [0 0 ${width} ${height}] /Resources ${fontResources}`
      )
    );
    return add(
      `<< /Type /Annot /Subtype /Widget /FT /Tx /F 4 /T ${literal(field.name)} /TU ${literal(
        PERSONAL_FIELDS.find((f) => f.key === field.name)?.label ?? field.name
      )} /V ${literal(field.value)} /DA (/${field.font.key} ${field.size} Tf ${INK} rg) /Rect [${field.rect
        .map(n)
        .join(' ')}] /P ${pageIds[field.page]} 0 R /AP << /N ${appearance} 0 R >> >>`
    );
  });

  layout.pages.forEach((ops, at) => {
    const contentId = add(stream(ops.join('\n')));
    const annots = layout.fields
      .map((field, f) => (field.page === at ? `${fieldIds[f]} 0 R` : null))
      .filter(Boolean);
    objects[pageIds[at] - 1] =
      `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources ${fontResources} /Contents ${contentId} 0 R${
        annots.length ? ` /Annots [${annots.join(' ')}]` : ''
      } >>`;
  });

  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R /AcroForm << /Fields [${fieldIds
    .map((id) => `${id} 0 R`)
    .join(' ')}] /DR ${fontResources} /DA (/F1 10 Tf 0 g) >> >>`;
  const infoId = add(`<< /Title ${literal(title)} /Producer (ReRouteHer) >>`);

  return new Blob([assemble(objects, catalogId, infoId)], { type: 'application/pdf' });
}

/** Builds a filesystem-safe PDF file name from the user's name, if provided. */
export function cvFileName(name) {
  const safe = (name ?? '')
    .trim()
    .replace(/[^\p{L}\p{N} ._-]+/gu, '')
    .replace(/\s+/g, ' ');
  return `${safe || 'My'} CV.pdf`;
}
