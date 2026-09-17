import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'output/iteration-2-prototype-high-res';
const destination = 'output/iteration-2-slide-ready';

const crops = [
  {
    input: `${source}/01-ai-companion-cv-input-3840x2160.png`,
    output: `${destination}/01-ai-companion-slide-ready.png`,
    region: { left: 1200, top: 180, width: 2640, height: 1850 },
  },
  {
    input: `${source}/02-my-journey-full-page-3840px-wide.png`,
    output: `${destination}/02-journey-dashboard-slide-ready.png`,
    region: { left: 720, top: 150, width: 2400, height: 1700 },
  },
  {
    input: `${source}/03-learning-plan-resources-3840x2160.png`,
    output: `${destination}/03-learning-plan-slide-ready.png`,
    region: { left: 850, top: 40, width: 2400, height: 1760 },
  },
  {
    input: `${source}/04-employer-fit-finder-3840x2160.png`,
    output: `${destination}/04-employer-fit-selection-slide-ready.png`,
    region: { left: 1000, top: 180, width: 2000, height: 1500 },
  },
  {
    input: `${source}/05-employer-fit-results-3840x2160.png`,
    output: `${destination}/05-employer-fit-results-slide-ready.png`,
    region: { left: 880, top: 250, width: 2200, height: 1700 },
  },
];

await mkdir(destination, { recursive: true });

for (const crop of crops) {
  await sharp(crop.input).extract(crop.region).png().toFile(crop.output);
  console.log(crop.output);
}
