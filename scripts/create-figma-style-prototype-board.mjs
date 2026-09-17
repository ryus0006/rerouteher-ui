import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const width = 3840;
const height = 2160;
const frameWidth = 1180;
const frameHeight = 840;
const imageWidth = 1124;
const imageHeight = 730;

const screens = [
  {
    label: '01 · AI COMPANION',
    path: 'output/iteration-2-slide-ready/01-ai-companion-slide-ready.png',
    x: 60,
    y: 180,
  },
  {
    label: '02 · MY JOURNEY DASHBOARD',
    path: 'output/iteration-2-slide-ready/02-journey-dashboard-slide-ready.png',
    x: 1330,
    y: 180,
  },
  {
    label: '03 · LEARNING PLAN',
    path: 'output/iteration-2-slide-ready/03-learning-plan-slide-ready.png',
    x: 2600,
    y: 180,
  },
  {
    label: '04 · EMPLOYER FIT — SELECT PRIORITIES',
    path: 'output/iteration-2-slide-ready/04-employer-fit-selection-slide-ready.png',
    x: 690,
    y: 1190,
  },
  {
    label: '05 · EMPLOYER FIT — VIEW MATCHES',
    path: 'output/iteration-2-slide-ready/05-employer-fit-results-slide-ready.png',
    x: 1970,
    y: 1190,
  },
];

const background = Buffer.from(`
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="14" stdDeviation="18" flood-color="#37264f" flood-opacity="0.13"/>
      </filter>
    </defs>

    <rect width="3840" height="2160" fill="#f2f1f5"/>
    <circle cx="3560" cy="90" r="280" fill="#f9e9f0" opacity="0.7"/>
    <circle cx="110" cy="2050" r="350" fill="#ebe8f5" opacity="0.8"/>

    <text x="120" y="88" font-family="Arial, sans-serif" font-size="54" font-weight="700" fill="#281b3f">ReRouteHer — Iteration 2 Prototype</text>

    ${screens
      .map(
        ({ label, x, y }) => `
          <text x="${x}" y="${y - 28}" font-family="Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="1.4" fill="#5c5667">${label}</text>
          <rect x="${x}" y="${y}" width="${frameWidth}" height="${frameHeight}" rx="30" fill="#ffffff" stroke="#d7d3df" stroke-width="3" filter="url(#shadow)"/>
          <circle cx="${x + 36}" cy="${y + 37}" r="8" fill="#ff5f57"/>
          <circle cx="${x + 62}" cy="${y + 37}" r="8" fill="#febc2e"/>
          <circle cx="${x + 88}" cy="${y + 37}" r="8" fill="#28c840"/>
          <rect x="${x + 125}" y="${y + 20}" width="${frameWidth - 165}" height="34" rx="17" fill="#f3f2f6"/>
        `
      )
      .join('')}

  </svg>
`);

const composites = [];
for (const screen of screens) {
  const screenshot = await sharp(screen.path)
    .resize(imageWidth, imageHeight, {
      fit: 'contain',
      background: '#fbfafd',
      withoutEnlargement: false,
    })
    .composite([
      {
        input: Buffer.from(
          `<svg width="${imageWidth}" height="${imageHeight}"><rect width="${imageWidth}" height="${imageHeight}" rx="18" fill="white"/></svg>`
        ),
        blend: 'dest-in',
      },
    ])
    .png()
    .toBuffer();

  composites.push({
    input: screenshot,
    left: screen.x + 28,
    top: screen.y + 82,
  });
}

await mkdir('output', { recursive: true });
await sharp(background)
  .composite(composites)
  .png()
  .toFile('output/iteration-2-figma-style-prototype-board.png');

console.log('output/iteration-2-figma-style-prototype-board.png');
