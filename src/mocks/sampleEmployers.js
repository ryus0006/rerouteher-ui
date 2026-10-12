// Invented employers that pad the browser mock past one page of results, so the
// matches page's search, industry filter and "Show more" can be tried in
// `npm run dev:mock`. Names are fictional; no website or report is linked.

const NAMES = [
  'Seri Alam',
  'Bayu Teknologi',
  'Cahaya Healthcare',
  'Delima Telekom',
  'Gemilang Properties',
  'Harmoni Consumer',
  'Intan Logistics',
  'Jati Energy',
  'Kenanga Digital',
  'Lestari Plantations',
  'Mutiara Capital',
  'Nusa Industrial',
  'Orkid Foods',
  'Puncak Engineering',
  'Rimba Resources',
  'Sinar Media',
  'Teras Insurance',
  'Utama Retail',
  'Wawasan Holdings',
  'Zamrud Pharma',
  'Angsana Systems',
  'Bunga Raya Group',
  'Cempaka Living',
  'Dahlia Financial',
  'Embun Water',
  'Fajar Automotive',
  'Gading Hospitality',
  'Hijau Renewables',
  'Indah Packaging',
  'Jentayu Aviation',
  'Kiambang Education',
  'Lembah Healthcare',
  'Melati Fashion',
  'Nilam Securities',
  'Orkid Labs',
  'Pelangi Telco',
  'Rantau Shipping',
  'Selasih Beverages',
  'Tanjung Construction',
  'Ufuk Analytics',
  'Wangi Cosmetics',
  'Yakin Payments',
  'Akasia Biotech',
  'Bestari Software',
  'Chempaka Bank',
  'Dian Utilities',
  'Eja Electronics',
  'Fitrah Takaful',
  'Gemala Steel',
  'Hikmah Publishing',
  'Ilham Studios',
  'Juita Wellness',
  'Kasturi Chemicals',
  'Laksana Rail',
  'Mahkota Medical',
  'Nadi Networks',
  'Permata Gloves',
  'Ratna Textiles',
  'Suria Solar',
  'Tiara Travel',
];

// Industry follows the name, so a sample never reads as mislabelled.
const INDUSTRY_BY_WORD = [
  [/Bank|Capital|Financial|Securities|Takaful|Insurance|Payments/, 'Financial Services'],
  [/Telekom|Telco|Networks/, 'Telecommunications'],
  [/Healthcare|Pharma|Medical|Biotech|Labs|Wellness|Gloves/, 'Healthcare'],
  [/Teknologi|Digital|Software|Systems|Analytics|Electronics|Media|Studios/, 'Technology'],
  [/Properties|Construction|Living/, 'Property'],
  [/Energy|Solar|Renewables|Utilities|Water|Resources|Plantations/, 'Energy'],
  [
    /Foods|Beverages|Consumer|Retail|Fashion|Cosmetics|Textiles|Publishing|Travel|Hospitality|Education/,
    'Consumer Goods',
  ],
];
const industryOf = (name) =>
  INDUSTRY_BY_WORD.find(([pattern]) => pattern.test(name))?.[1] ?? 'Industrial';

const PRIORITIES = [
  'flexible_work',
  'childcare_support',
  'parental_support',
  'returning_to_work',
  'inclusive_workplace',
];

const LOCATIONS = ['Kuala Lumpur', 'Petaling Jaya', 'Penang', 'Johor Bahru', null];

export const sampleEmployers = NAMES.map((name, index) => ({
  id: `sample-${index + 1}`,
  name,
  industry: industryOf(name),
  location: LOCATIONS[index % LOCATIONS.length],
  logo: { text: name.split(' ')[0], bg: '#ece6f5', fg: '#2c2142' },
  website: null,
  summary: `${name} describes its workplace policies in its latest sustainability statement.`,
  // A few are hiring, so the hiring group stays small, as in real results.
  job:
    index % 15 === 4
      ? { title: 'UX Designer', found_at: '2026-09-30T00:00:00Z', url: 'https://example.com/' }
      : null,
  // Every sample covers flexible work plus one or two other priorities.
  discloses: [
    'flexible_work',
    PRIORITIES[1 + (index % 4)],
    ...(index % 3 === 0 ? [PRIORITIES[1 + ((index + 2) % 4)]] : []),
  ],
  report: null,
}));
