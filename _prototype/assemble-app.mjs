import fs from 'node:fs';
import path from 'node:path';

const scriptDir = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const css = fs.readFileSync(path.join(scriptDir, '_merged.css'), 'utf8');
const BRAND = 'ReRouteHer';

const bfly = (id) => `<svg width="30" height="30" viewBox="0 0 48 48" fill="none" style="flex:none;overflow:visible;">
  <defs>
    <linearGradient id="${id}_fore" x1="6" y1="4" x2="42" y2="40" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#9EB0E4"/>
      <stop offset="50%" stop-color="#6E82C8"/>
      <stop offset="100%" stop-color="#4B5BA4"/>
    </linearGradient>
    <linearGradient id="${id}_hind" x1="10" y1="18" x2="38" y2="44" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#F8D8E5"/>
      <stop offset="50%" stop-color="#D0C4E6"/>
      <stop offset="100%" stop-color="#889AD0"/>
    </linearGradient>
  </defs>
  <path d="M24 14 C17 3, 5 6, 4 17 C3 25, 14 27, 24 21 C34 27, 45 25, 44 17 C43 6, 31 3, 24 14 Z" fill="url(#${id}_fore)"/>
  <path d="M24 21 C17 26, 7 30, 8 38 C9 43, 17 44, 21 37 C23 33, 24 29, 24 21 C24 29, 25 33, 27 37 C31 44, 39 43, 40 38 C41 30, 31 26, 24 21 Z" fill="url(#${id}_hind)" opacity="0.9"/>
  <path d="M22 13 C20 8 16 5 13 4 M26 13 C28 8 32 5 35 4" stroke="#3A4678" stroke-width="1.2" stroke-linecap="round"/>
  <line x1="24" y1="12" x2="24" y2="34" stroke="#252D56" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;

const logo = (id) => `<div style="display:flex;align-items:center;gap:10px;cursor:pointer;" onclick="showView('landing')">${bfly(id)}<div class="disp js-nologo" style="font-weight:800;font-size:18px;letter-spacing:-.01em;color:var(--ink);">${BRAND}</div></div>`;

function stepper(current, labels, dests) {
  let out = '<div class="js-stepper" style="display:flex;align-items:center;gap:0;margin-bottom:8px;">';
  for (let i = 1; i <= labels.length; i++) {
    const isComplete = i < current;
    const isActive = i === current;
    const cls = isComplete ? 'step-c complete' : (isActive ? 'step-c active' : 'step-c future');
    const inner = isComplete ? '&#10003;' : String(i);
    const btn = isComplete
      ? `<button type="button" class="${cls}" onclick="showView('${dests[i - 1]}')" title="Jump back to ${labels[i - 1]}">${inner}</button>`
      : `<div class="${cls}">${inner}</div>`;
    out += `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;">${btn}<div style="font-size:11px;font-weight:${isActive || isComplete ? 700 : 600};color:${isActive || isComplete ? 'var(--ink)' : 'var(--ink-faint)'};">${labels[i - 1]}</div></div>`;
    if (i < labels.length) {
      const lineCls = i < current ? 'step-line complete' : 'step-line future';
      out += `<div class="${lineCls}"></div>`;
    }
  }
  out += '</div>';
  if (current > 1) out += `<div style="font-size:11px;color:var(--ink-faint);margin-bottom:22px;display:flex;align-items:center;gap:5px;"><span>&#8618;</span> Click a completed step to jump back &mdash; your inputs are automatically saved.</div>`;
  else out += `<div style="margin-bottom:22px;"></div>`;
  return out;
}

const mask = (html, cls = 'js-title') => `<div class="reveal-mask"><div class="reveal-inner ${cls}">${html}</div></div>`;

const STEP_LABELS = ['Upload CV', 'Career Break', 'Skill Snapshot', 'Target Role & Gap'];
const STEP_DESTS = ['story-a', 'story-b', 'snapshot', 'gap'];

// ============ LANDING (E1) ============
const landing = `
<div style="min-height:1150px;background:#FBF8FA;">
  <div class="hero" style="position:relative;padding-bottom:70px;overflow:hidden;min-height:540px;">
    <div class="grain"></div>
    <div class="blur-orb js-parallax" data-speed="0.15" style="width:420px;height:420px;left:-120px;bottom:-140px;background:#F6DCE6;opacity:.45;"></div>
    <div class="blur-orb js-parallax" data-speed="0.25" style="width:380px;height:380px;right:-100px;top:-120px;background:#BAC7EB;opacity:.4;"></div>
    <div class="star" style="top:60px;left:38%;"></div><div class="star" style="top:140px;left:62%;"></div>
    <div class="star" style="top:220px;left:80%;width:2px;height:2px;"></div><div class="star" style="top:90px;left:52%;width:2px;height:2px;"></div>

    <div class="hero-artwork-container" style="position:absolute;top:0;right:0;bottom:0;height:100%;display:flex;align-items:center;justify-content:flex-end;pointer-events:none;z-index:1;overflow:hidden;">
      <img src="hero-dreamy-butterfly.png" alt="ReRouteHer Ethereal Butterfly Oil Painting" class="hero-butterfly-img" style="height:100%;max-height:100%;width:auto;object-fit:contain;object-position:right center;opacity:0.85;-webkit-mask-image:radial-gradient(ellipse 75% 85% at 52% 48%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.85) 60%, transparent 95%);mask-image:radial-gradient(ellipse 75% 85% at 52% 48%, rgba(0,0,0,1) 35%, rgba(0,0,0,0.85) 60%, transparent 95%);filter:contrast(1.02) brightness(1.03);" />
    </div>

    <div style="position:relative;display:flex;align-items:center;justify-content:space-between;padding:26px 60px;z-index:2;">
      ${logo('bflyL')}
    </div>
    <div style="position:relative;display:grid;grid-template-columns:1.1fr 0.9fr;gap:30px;padding:44px 60px 0;align-items:center;z-index:2;min-height:420px;">
      <div style="max-width:540px;">
        ${mask('See what you still<br/>have to offer', 'js-title js-hero-title')}
        <div class="js-sub" style="font-size:16.5px;line-height:1.6;color:rgba(38,43,74,.78);margin-top:18px;max-width:480px;">Coming back to work after a career break can feel like starting from zero. It isn&rsquo;t. We turn your resume and life experience into an actionable skill readiness plan.</div>
        <div class="js-sub" style="display:flex;gap:14px;margin-top:28px;">
          <button type="button" class="pill-btn primary btn-reset" id="get-started-btn" onclick="beginIntake()">
            <span>Get started</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
      <div class="js-img" style="position:relative;min-height:360px;">
      </div>
    </div>
  </div>

  <div class="scroll-section" style="max-width:1000px;margin:0 auto;padding:70px 60px 10px;">
    ${mask('Two simple inputs. Zero guesswork.', 'js-scroll-title')}
    <div class="js-scroll-sub" style="font-size:14.5px;color:var(--ink-soft);margin-top:8px;max-width:520px;">Upload your CV, describe your career break, and our AI maps your real-world skills to market demand.</div>
    <div class="journey-stepper" style="display:flex;gap:0;margin-top:44px;">
      <div class="journey-step js-scroll-card">
        <div class="journey-num">1</div>
        <div class="journey-track"></div>
        <div class="disp" style="font-weight:700;font-size:16px;margin-top:14px;">Upload your CV</div>
        <div style="font-size:13px;color:var(--ink-soft);margin-top:6px;">Extract your core career competencies directly.</div>
      </div>
      <div class="journey-step js-scroll-card">
        <div class="journey-num">2</div>
        <div class="journey-track"></div>
        <div class="disp" style="font-weight:700;font-size:16px;margin-top:14px;">Describe your break</div>
        <div style="font-size:13px;color:var(--ink-soft);margin-top:6px;">Tell us what you did &mdash; AI reframes it to standard O*NET skills.</div>
      </div>
      <div class="journey-step js-scroll-card">
        <div class="journey-num">3</div>
        <div class="disp" style="font-weight:700;font-size:16px;margin-top:14px;">See fit &amp; top gaps</div>
        <div style="font-size:13px;color:var(--ink-soft);margin-top:6px;">Get your transparent readiness score &amp; focus areas.</div>
      </div>
    </div>
  </div>

  <div class="scroll-section" style="display:grid;grid-template-columns:repeat(3,1fr);gap:22px;padding:70px 60px 0;max-width:1000px;margin:0 auto;">
    <div class="glass js-scroll-card" style="padding:30px 26px;">
      <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#FBDCE6,#D8C6DF);display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5B4E7A" stroke-width="1.8"><path d="M12 3v9m0 0l-3.5-3.5M12 12l3.5-3.5M5 15v3a2 2 0 002 2h10a2 2 0 002-2v-3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="disp" style="font-weight:700;font-size:16.5px;">Your break counts as experience</div>
      <div style="font-size:13.5px;color:var(--ink-soft);margin-top:8px;line-height:1.55;">Caring for family built real skills: budgeting, scheduling, coordination. We name them and map them straight to standard taxonomies.</div>
    </div>
    <div class="glass js-scroll-card" style="padding:30px 26px;">
      <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#D8C6DF,#B7C0E4);display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4E4E80" stroke-width="1.8"><circle cx="12" cy="12" r="9" stroke-linecap="round"/><path d="M12 7v5l3 3" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="disp" style="font-weight:700;font-size:16.5px;">Transparent, weighted readiness</div>
      <div style="font-size:13.5px;color:var(--ink-soft);margin-top:8px;line-height:1.55;">A transparent score for any target role &mdash; explaining exactly why you're ready and how closing 3 focus areas unlocks your readiness.</div>
    </div>
    <div class="glass js-scroll-card" style="padding:30px 26px;">
      <div style="width:44px;height:44px;border-radius:14px;background:linear-gradient(135deg,#B7C0E4,#8C97D0);display:flex;align-items:center;justify-content:center;margin-bottom:16px;"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#33366B" stroke-width="1.8"><path d="M4 19h16M7 15l3-5 3 3 4-7" stroke-linecap="round" stroke-linejoin="round"/></svg></div>
      <div class="disp" style="font-weight:700;font-size:16.5px;">Three focus areas, never a wall</div>
      <div style="font-size:13.5px;color:var(--ink-soft);margin-top:8px;line-height:1.55;">Capped, ranked by impact, and tailored to your target &mdash; never a demoralising wall of 20+ overwhelming requirements.</div>
    </div>
  </div>
  <div style="height:70px;"></div>
</div>`;

// ============ STEP 1: UPLOAD CV (E2a) ============
const storyA = `
<div style="min-height:900px;background:var(--grad-soft);">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 56px;">${logo('bfly2a')}</div>
  <div style="max-width:680px;margin:0 auto;padding:0 24px;">
    ${stepper(1, STEP_LABELS, STEP_DESTS)}
    ${mask('Upload your CV')}
    <div class="js-sub" style="font-size:14.5px;color:var(--ink-soft);margin-top:6px;">We analyze your previous experience to extract your core professional skills automatically.</div>

    <div class="glass js-card" style="padding:32px 28px;margin-top:24px;">
      <div class="field-label" style="font-size:14px;">Select your CV file <span style="color:var(--pink-500);">*</span></div>
      <div id="cv-dropzone" class="dropzone" tabindex="0" role="button" aria-label="Upload your CV, PDF or DOCX, up to 10 megabytes"
           onclick="document.getElementById('cv-input').click()"
           onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();document.getElementById('cv-input').click();}"
           ondragover="event.preventDefault();this.classList.add('drag');"
           ondragleave="this.classList.remove('drag');"
           ondrop="event.preventDefault();this.classList.remove('drag');handleCvFile(event.dataTransfer.files[0]);">
        <input type="file" id="cv-input" accept=".pdf,.doc,.docx" style="display:none;" onchange="handleCvFile(this.files[0]); this.value='';"/>
        
        <div id="cv-empty-state">
          <div style="width:52px;height:52px;border-radius:16px;background:rgba(232,93,138,.12);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--pink-500);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15l3-3 3 3"/></svg>
          </div>
          <div style="font-size:14px;font-weight:700;color:var(--ink);">Drag and drop your CV here, or click to browse</div>
          <div style="font-size:12px;color:var(--ink-faint);margin-top:4px;">Supports PDF or DOCX (up to 10MB) &middot; Parsed securely on-device</div>
        </div>

        <div id="cv-file-state" style="display:none;align-items:center;justify-content:space-between;gap:12px;background:rgba(255,255,255,.9);padding:14px 18px;border-radius:14px;border:1.5px solid rgba(46,115,85,.3);">
          <div style="display:flex;align-items:center;gap:12px;min-width:0;">
            <div style="width:40px;height:40px;border-radius:10px;background:var(--mint-100);display:flex;align-items:center;justify-content:center;color:var(--mint-700);flex:none;">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/></svg>
            </div>
            <div style="min-width:0;text-align:left;">
              <div id="cv-filename" style="font-size:14px;font-weight:700;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:320px;"></div>
              <div id="cv-filesize" style="font-size:11.5px;color:var(--mint-700);font-weight:600;"></div>
            </div>
          </div>
          <button type="button" class="btn-reset" onclick="event.stopPropagation();removeCvFile();" style="font-size:12px;font-weight:700;color:var(--pink-500);cursor:pointer;padding:6px 14px;border-radius:999px;background:rgba(232,93,138,.1);">Remove</button>
        </div>
      </div>
      <div id="cv-error" class="field-error" style="display:none;"></div>

      <!-- Quick Demo Sample Loaders -->
      <div style="margin-top:18px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.5);padding:12px 16px;border-radius:12px;border:1px dashed rgba(90,90,140,.2);flex-wrap:wrap;gap:10px;">
        <div style="font-size:12.5px;color:var(--ink-soft);">Want to try without uploading your own file?</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn-reset" onclick="loadSampleCv('operation-research')" style="font-size:12px;font-weight:700;color:var(--blue-600);cursor:pointer;padding:5px 12px;border-radius:8px;background:rgba(70,83,158,.1);">
            ⚡ Load Analyst CV (Op Research)
          </button>
          <button type="button" class="btn-reset" onclick="loadSampleCv('ux-ui')" style="font-size:12px;font-weight:700;color:var(--ink-soft);cursor:pointer;padding:5px 12px;border-radius:8px;background:rgba(90,90,140,.08);">
            ⚡ Load Designer CV (UX/UI)
          </button>
        </div>
      </div>
    </div>

    <div class="js-card" style="text-align:center;margin-top:26px;padding-bottom:60px;">
      <button type="button" id="cv-continue-btn" class="pill-btn primary btn-reset" style="display:flex;width:100%;max-width:320px;margin:0 auto;" onclick="validateAndContinueStoryA()">
        <span>Continue to Career Break</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</div>`;

// ============ STEP 2: CAREER BREAK QUESTIONNAIRE ============
const storyB = `
<div style="min-height:980px;background:var(--grad-soft);">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 56px;">${logo('bfly2b')}</div>
  <div style="max-width:700px;margin:0 auto;padding:0 24px;">
    ${stepper(2, STEP_LABELS, STEP_DESTS)}
    ${mask('Tell us about your career break')}
    <div class="js-sub" style="font-size:14.5px;color:var(--ink-soft);margin-top:6px;">Your time out counts as real experience &mdash; just two simple questions for our AI model.</div>

    <div class="glass js-card" style="padding:30px;margin-top:22px;display:flex;flex-direction:column;gap:26px;">
      <div>
        <div class="field-label" style="font-size:14.5px;margin-bottom:6px;">1. Roughly how long was your career break?</div>
        <div style="font-size:12.5px;color:var(--ink-soft);margin-bottom:14px;">Select the total duration of your time away from formal employment.</div>
        <div style="display:flex;align-items:center;gap:18px;background:rgba(255,255,255,.6);padding:14px 20px;border-radius:14px;border:1px solid rgba(90,90,140,.12);">
          <input id="break-years" type="range" min="0.5" max="15" step="0.5" value="3"
            oninput="document.getElementById('break-years-label').textContent = this.value + ' years';"
            onchange="saveIntake()" class="slider" style="flex:1;"/>
          <div id="break-years-label" style="font-size:15px;font-weight:800;color:var(--ink);min-width:74px;text-align:right;background:var(--mint-100);color:var(--mint-700);padding:5px 12px;border-radius:999px;">3 years</div>
        </div>
      </div>

      <div>
        <div class="field-label" style="font-size:14.5px;margin-bottom:6px;">2. What did you do during this time? <span style="color:var(--pink-500);">*</span></div>
        <div style="font-size:12.5px;color:var(--ink-soft);margin-bottom:12px;">Describe in your own words (e.g. caregiving, household management, budget oversight, volunteering, self-study, side projects).</div>
        
        <textarea id="break-text-input" rows="5" oninput="saveIntake()" placeholder="e.g. Cared for 2 children full-time, managed household budget and family schedules, organized school fundraisers, and self-studied digital tools..." style="width:100%;border-radius:14px;border:1.5px solid rgba(90,90,140,.22);background:rgba(255,255,255,.85);padding:14px 16px;font-family:inherit;font-size:14px;line-height:1.55;color:var(--ink);box-sizing:border-box;resize:vertical;outline:none;"></textarea>

        <div style="margin-top:10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
          <div style="font-size:11.5px;font-weight:700;color:var(--ink-faint);">Click to add examples:</div>
          <button type="button" class="btn-reset chip" onclick="appendBreakText('Cared for children & managed family logistics')" style="font-size:11.5px;padding:6px 12px;cursor:pointer;">+ Childcare</button>
          <button type="button" class="btn-reset chip" onclick="appendBreakText('Managed household budgeting & expenses')" style="font-size:11.5px;padding:6px 12px;cursor:pointer;">+ Budgeting</button>
          <button type="button" class="btn-reset chip" onclick="appendBreakText('Organized community volunteer projects')" style="font-size:11.5px;padding:6px 12px;cursor:pointer;">+ Volunteering</button>
          <button type="button" class="btn-reset chip" onclick="appendBreakText('Self-study & online analytics courses')" style="font-size:11.5px;padding:6px 12px;cursor:pointer;">+ Self-study</button>
        </div>
        <div id="break-text-error" class="field-error" style="display:none;margin-top:10px;"></div>
      </div>
    </div>

    <div class="js-card" style="display:flex;align-items:center;justify-content:space-between;margin-top:28px;padding-bottom:60px;gap:16px;">
      <button type="button" class="btn-reset" onclick="showView('story-a')" style="font-size:13.5px;font-weight:700;color:var(--ink-soft);display:flex;align-items:center;gap:6px;cursor:pointer;">
        <span>&larr;</span> Back to CV
      </button>
      <button type="button" class="pill-btn primary btn-reset" onclick="validateAndContinueStoryB()">
        <span>See my skill snapshot</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</div>`;

// ============ STEP 3: SKILL SNAPSHOT (E3 · READ-ONLY HISTORY BASELINE) ============
const snapshot = `
<div style="min-height:960px;background:var(--grad-soft);">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 56px;">${logo('bfly3')}</div>
  <div style="max-width:960px;margin:0 auto;padding:0 24px;">
    ${stepper(3, STEP_LABELS, STEP_DESTS)}
    
    <div style="margin-top:4px;margin-bottom:12px;">
      <button type="button" class="btn-reset" onclick="showView('story-b')" style="font-size:13.5px;font-weight:700;color:var(--ink-soft);display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
        <span>&larr;</span> Back to Career Break
      </button>
    </div>

    ${mask('Your skill snapshot')}

    <!-- Read-Only Descriptive History Baseline Card (Occupation Line) -->
    <div class="glass js-card" id="occupation-card" style="padding:28px 32px;margin-top:20px;position:relative;overflow:hidden;">
      <div style="position:absolute;top:0;left:0;width:4px;height:100%;background:var(--grad-btn);"></div>
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:20px;flex-wrap:wrap;">
        <div style="flex:1;min-width:280px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--pink-500)" stroke-width="2.3"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <div style="font-size:11.5px;font-weight:800;color:var(--ink-faint);letter-spacing:.06em;text-transform:uppercase;">YOUR BACKGROUND LOOKS LIKE</div>
          </div>
          <div class="disp" id="snapshot-headline" style="font-weight:800;font-size:22px;margin-top:6px;line-height:1.25;color:var(--ink);">
            Based on your story, you&rsquo;re closest to <span id="snapshot-headline-role" style="background:var(--grad-btn);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">Operation Research Analyst</span>.
          </div>
          <div style="font-size:13.5px;color:var(--ink-soft);margin-top:8px;line-height:1.55;">
            This is your starting baseline. On this page, we reflect your foundation. Next, you&rsquo;ll choose where you want to aim.
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <div id="confidence-badge" style="font-size:12.5px;font-weight:800;color:var(--mint-700);background:var(--mint-100);padding:7px 16px;border-radius:999px;border:1px solid rgba(46,115,85,.25);display:inline-flex;align-items:center;gap:6px;">
            <span style="width:7px;height:7px;border-radius:50%;background:var(--mint-600);box-shadow:0 0 0 2px rgba(46,115,85,.2);"></span>
            High confidence match
          </div>
          <div style="font-size:11px;font-weight:600;color:var(--ink-faint);">Read-only summary &middot; No role lock</div>
        </div>
      </div>
    </div>

    <!-- Two-Column Skill Inventory with Count & Compact Pill Chips -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:22px;margin-top:22px;">
      <div class="glass js-card" style="padding:26px 28px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;">
          <div class="field-label" style="margin-bottom:0;display:flex;align-items:center;gap:7px;font-size:14px;font-weight:700;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--blue-600)" stroke-width="2.2"><path d="M20 7h-4V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3H4a1 1 0 00-1 1v11a2 2 0 002 2h14a2 2 0 002-2V8a1 1 0 00-1-1zM10 5h4v2h-4V5z"/></svg>
            From your CV
          </div>
          <span id="cv-skills-count" style="font-size:12px;font-weight:700;color:var(--ink-faint);">5</span>
        </div>
        <div style="font-size:12px;color:var(--ink-soft);margin-bottom:14px;">Extracted automatically from your uploaded experience.</div>
        <div id="skills-have-col" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
        <div id="skills-have-more" style="margin-top:12px;display:none;">
          <button type="button" class="btn-reset" onclick="toggleCvSkillsExpand()" id="skills-have-toggle-btn" style="font-size:13px;font-weight:700;color:var(--pink-600);">Show all</button>
        </div>
      </div>
      
      <div class="glass js-card" style="padding:26px 28px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px;">
          <div class="field-label" style="margin-bottom:0;display:flex;align-items:center;gap:7px;font-size:14px;font-weight:700;">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--mint-600)" stroke-width="2.2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            From your career break
          </div>
          <span id="break-skills-count" style="font-size:12px;font-weight:700;color:var(--mint-700);">5</span>
        </div>
        <div style="font-size:12px;color:var(--ink-soft);margin-bottom:14px;">These come from the activities you did during your career break.</div>
        <div id="skills-reframed-col" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
      </div>
    </div>

    <!-- O*NET Crosswalk Bridge Banner -->
    <div id="crosswalk-banner" class="glass js-card" style="background:rgba(253,240,244,.85);border:1px solid rgba(232,93,138,.25);border-radius:18px;padding:18px 24px;margin-top:22px;display:flex;align-items:center;gap:14px;">
      <div style="width:38px;height:38px;border-radius:11px;background:linear-gradient(135deg,#EE86AC,#B98FC9);display:flex;align-items:center;justify-content:center;color:#fff;flex:none;box-shadow:0 6px 14px -4px rgba(232,93,138,.4);">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
      </div>
      <div id="crosswalk-text" style="font-size:13.5px;line-height:1.5;color:var(--ink);"></div>
    </div>

    <!-- Navigation Prompt -->
    <div class="js-card" style="display:flex;align-items:center;justify-content:space-between;margin-top:32px;padding-bottom:70px;flex-wrap:wrap;gap:16px;">
      <button type="button" class="btn-reset" onclick="showView('story-b')" style="font-size:13.5px;font-weight:700;color:var(--ink-soft);display:flex;align-items:center;gap:6px;cursor:pointer;">
        <span>&larr;</span> Back to Break
      </button>
      <button type="button" class="pill-btn primary btn-reset" onclick="showView('gap')">
        <span>See my readiness &amp; gaps</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
  </div>
</div>`;

// ============ STEP 4: TARGET ROLE READINESS & GAP (E4 · FUTURE / AIMING) ============
const gap = `
<div style="min-height:980px;background:var(--grad-soft);">
  <div style="display:flex;align-items:center;justify-content:space-between;padding:24px 56px;">${logo('bfly4')}</div>
  <div style="max-width:960px;margin:0 auto;padding:0 24px;">
    ${stepper(4, STEP_LABELS, STEP_DESTS)}
    
    <div style="margin-top:4px;margin-bottom:12px;">
      <button type="button" class="btn-reset" onclick="showView('snapshot')" style="font-size:13.5px;font-weight:700;color:var(--ink-soft);display:inline-flex;align-items:center;gap:6px;cursor:pointer;">
        <span>&larr;</span> Back to Skill Snapshot
      </button>
    </div>

    <!-- Aiming Reframe Header -->
    ${mask('Where do you want to go next?')}
    <div class="js-sub" style="font-size:15px;color:var(--ink-soft);margin-top:6px;">
      Pick the role you&rsquo;re aiming for. We started with your closest match &mdash; switch to any role you want to aim for.
    </div>

    <!-- Interactive Role Selector Pills matching FE & Screenshot -->
    <div class="js-card" style="margin-top:18px;">
      <div id="role-selector-container" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">
        <button type="button" class="btn-reset role-pill on" data-role="operation-research" onclick="pickRole('operation-research')">
          <span>Operation Research Analyst</span>
          <span class="pill-match-tag">Closest match</span>
        </button>
        <button type="button" class="btn-reset role-pill" data-role="data-analyst" onclick="pickRole('data-analyst')">
          <span>Data Analyst</span>
        </button>
        <button type="button" class="btn-reset role-pill" data-role="mis-analyst" onclick="pickRole('mis-analyst')">
          <span>Management Information Systems (MIS) Analyst</span>
        </button>
      </div>
    </div>

    <!-- Two Main Cards (Side-by-Side: Gauge Card & Missing Requirements Card) -->
    <div style="display:grid;grid-template-columns:330px 1fr;gap:22px;margin-top:22px;" class="readiness-grid">
      <!-- Left Card: Selected Role Readiness Gauge -->
      <div class="glass js-card" style="padding:28px 24px;text-align:center;display:flex;flex-direction:column;justify-content:space-between;">
        <div>
          <h2 id="gauge-role-title" style="font-size:18px;font-weight:800;color:var(--ink);margin:0 0 16px;text-align:left;line-height:1.3;">
            Operation Research Analyst
          </h2>
          
          <div style="position:relative;margin:10px auto 0;">
            <svg id="gauge" viewBox="0 0 320 220" style="width:100%;max-width:280px;display:block;margin:0 auto;overflow:visible;"></svg>
          </div>
        </div>

        <div style="margin-top:16px;">
          <div id="projected-banner-pill" style="background:#FDF0F4;border:1px solid #F7D5E0;color:#B23A68;padding:12px 18px;border-radius:18px;font-size:13.5px;font-weight:700;text-align:center;line-height:1.4;">
            62.6% today &rarr; 84.3% after your focus areas
          </div>
        </div>
      </div>

      <!-- Right Card: Missing For This Role & Top 3 Focus Areas -->
      <div class="glass js-card" style="padding:26px 28px;">
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px;">
          <h2 class="field-label" style="margin-bottom:0;font-size:15px;font-weight:700;color:var(--ink);">Missing for this role</h2>
          <span id="missing-count-badge" style="font-size:12.5px;font-weight:600;color:var(--ink-soft);">3 requirements</span>
        </div>

        <div style="font-size:11px;font-weight:800;color:var(--ink-soft);letter-spacing:.08em;text-transform:uppercase;margin-top:18px;margin-bottom:10px;">
          YOUR TOP 3 TO START WITH
        </div>

        <div id="gap-top3-list" style="display:flex;flex-direction:column;gap:10px;"></div>

        <div id="gap-also-missing" style="margin-top:18px;display:none;">
          <div style="font-size:11px;font-weight:800;color:var(--ink-soft);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px;">
            ALSO MISSING
          </div>
          <div id="gap-also-missing-list" style="display:flex;flex-wrap:wrap;gap:6px;"></div>
        </div>

        <div style="margin-top:20px;font-size:12px;color:var(--ink-soft);line-height:1.45;">
          Projected improvement is an estimate of readiness, not a guarantee of employment.
        </div>
      </div>
    </div>

    <!-- Detailed Breakdown Accordion / Supporting Transparency Info -->
    <div class="glass js-card" style="padding:24px 28px;margin-top:22px;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
        <div style="font-size:13px;font-weight:800;color:var(--ink-faint);letter-spacing:.05em;text-transform:uppercase;">
          COMPETENCY INVENTORY &amp; IMPORTANCE WEIGHTING
        </div>
        <div id="target-role-badge" style="font-size:12px;font-weight:700;color:var(--blue-600);">Operation Research Analyst</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;">
        <div style="background:rgba(255,255,255,.6);border:1px solid rgba(90,90,140,.12);border-radius:14px;padding:16px 18px;">
          <div style="font-size:13px;font-weight:700;color:var(--ink);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <span style="color:var(--mint-600);">&#10003;</span> Skills you already bring
          </div>
          <div id="gap-have-list" style="display:flex;flex-direction:column;gap:6px;margin-top:10px;"></div>
        </div>

        <div style="background:linear-gradient(135deg,rgba(253,240,244,.7),rgba(237,241,250,.7));border:1px solid rgba(232,93,138,.2);border-radius:14px;padding:16px 18px;display:flex;flex-direction:column;justify-content:space-between;">
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--pink-600);letter-spacing:.04em;text-transform:uppercase;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Why this percentage?
            </div>
            <div id="formula-expl-text" style="font-size:12.5px;line-height:1.55;color:var(--ink-soft);"></div>
          </div>
          <div style="margin-top:12px;font-size:11.5px;color:var(--ink-faint);">
            Weighted based on standard O*NET importance levels and technical role benchmarks.
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Prompt -->
    <div class="js-card" style="display:flex;align-items:center;justify-content:space-between;margin-top:30px;padding-bottom:70px;flex-wrap:wrap;gap:16px;">
      <button type="button" class="btn-reset" onclick="showView('snapshot')" style="font-size:13.5px;font-weight:700;color:var(--ink-soft);display:flex;align-items:center;gap:6px;cursor:pointer;">
        <span>&larr;</span> Back to Skill Snapshot
      </button>
      <div style="font-size:12.5px;color:var(--ink-faint);display:flex;align-items:center;gap:8px;">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--violet-400);"></span>
        <span>ReRouteHer Diagnostic &middot; Ready for action</span>
      </div>
    </div>
  </div>
</div>`;

// Only active views in MVP flow: Landing -> Story A (CV) -> Story B (Break) -> Snapshot -> Gap
const navItems = ['landing', 'story-a', 'story-b', 'snapshot', 'gap'];
const views = { landing, 'story-a': storyA, 'story-b': storyB, snapshot, gap };

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${BRAND} &mdash; Skill Readiness Journey</title>
<meta name="description" content="Interactive click-through prototype for the ${BRAND} skill-readiness journey.">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'%3E%3Cpath d='M24 12C18 2 4 4 4 16c0 8 10 10 20 4 10 6 20 4 20-4C44 4 30 2 24 12Z' fill='%23E85D8A'/%3E%3C/svg%3E">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;1,500&display=swap">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js"></script>
<style>
${css}
html,body{margin:0;}
:root{ --ease-out: cubic-bezier(0.16, 1, 0.3, 1); }
.view{display:none;}
.view.active{display:block;}
.field-label{font-size:13px;font-weight:700;color:var(--ink);margin-bottom:9px;}

.pill-btn,.chip{transition:transform 160ms var(--ease-out),box-shadow 160ms var(--ease-out),background 160ms var(--ease-out);}
.pill-btn:active,.chip:active{transform:scale(0.97);}
.btn-reset{font-family:inherit;border:none;background:none;padding:0;cursor:pointer;}
.pill-btn:focus-visible,.chip:focus-visible,.step-c:focus-visible,#cv-dropzone:focus-visible,.role-pill:focus-visible{outline:3px solid rgba(74,87,160,.45);outline-offset:2px;}
.step-c{font-family:inherit;border:none;}
button.step-c{cursor:pointer;padding:0;-webkit-appearance:none;appearance:none;}

/* ---- authoritative button size ---- */
.pill-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:9px;
  width:auto;max-width:none;flex:none;
  padding:16px 36px!important;min-height:56px;box-sizing:border-box;
  border-radius:999px;font-weight:700;font-size:16px;letter-spacing:.01em;
  border:none;cursor:pointer;font-family:inherit;
  position:relative;overflow:hidden;isolation:isolate;
}
.pill-btn.primary::before{
  content:'';position:absolute;inset:0;width:55%;
  background:linear-gradient(115deg,transparent,rgba(255,255,255,.55),transparent);
  transform:translateX(-260%) skewX(-18deg);
  transition:transform .75s var(--ease-out);
  pointer-events:none;z-index:1;
}
.pill-btn.primary:hover::before{transform:translateX(260%) skewX(-18deg);}
.pill-btn.primary span,.pill-btn.primary{position:relative;}

/* ---- reveal mask ---- */
.reveal-mask{overflow:hidden;display:block;}
.reveal-inner{display:block;will-change:transform;}
.js-hero-title{font-family:'Bricolage Grotesque';font-weight:800;font-size:48px;line-height:1.08;color:#26264A;max-width:560px;}
.js-scroll-title{font-family:'Bricolage Grotesque';font-weight:800;font-size:32px;color:var(--ink);}

/* ---- dropzone / file upload ---- */
.dropzone{border:2px dashed rgba(90,90,140,.3);border-radius:16px;padding:32px 16px;text-align:center;background:rgba(255,255,255,.5);cursor:pointer;transition:border-color 200ms,background 200ms;}
.dropzone.drag{border-color:var(--pink-500);background:rgba(232,93,138,.08);}
.dropzone:focus-visible{outline:3px solid rgba(74,87,160,.45);outline-offset:2px;}
.field-error{margin-top:10px;font-size:12.5px;color:#B23A4E;background:rgba(232,93,138,.08);border:1px solid rgba(232,93,138,.25);border-radius:10px;padding:9px 12px;}

/* ---- range slider ---- */
input[type=range].slider{-webkit-appearance:none;appearance:none;height:6px;border-radius:4px;background:linear-gradient(90deg,#EE86AC,#6E7BC0);outline:none;}
input[type=range].slider::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid var(--pink-500);box-shadow:0 2px 6px rgba(40,40,90,.25);cursor:pointer;}
input[type=range].slider::-moz-range-thumb{width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid var(--pink-500);box-shadow:0 2px 6px rgba(40,40,90,.25);cursor:pointer;}

/* ---- Compact Skill Pill Chips ---- */
.skill-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  border: 1px solid rgba(38, 43, 74, 0.12);
  background: rgba(255, 255, 255, 0.7);
  color: var(--ink);
  cursor: default;
  transition: all 0.2s ease;
}
.skill-chip:hover {
  background: rgba(255, 255, 255, 0.95);
  border-color: rgba(38, 43, 74, 0.22);
}
.skill-chip.from-break {
  border-color: rgba(51, 120, 87, 0.25);
  background: rgba(230, 245, 237, 0.75);
  color: var(--mint-700);
}
.skill-chip.from-break:hover {
  background: rgba(230, 245, 237, 0.95);
}

/* ---- Role Selector Pills (Exact Match to Screenshot) ---- */
.role-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13.5px;
  font-weight: 700;
  background: #FFFFFF;
  border: 1.5px solid rgba(90, 90, 140, 0.16);
  color: rgba(38, 43, 74, 0.7);
  cursor: pointer;
  box-shadow: 0 2px 8px -2px rgba(35, 42, 82, 0.06);
  transition: all 0.2s var(--ease-spring);
}
.role-pill:hover {
  background: #FFFFFF;
  border-color: rgba(60, 75, 128, 0.4);
  color: var(--ink);
  transform: translateY(-1px);
}
.role-pill.on {
  background: #3B4B7C;
  color: #FFFFFF;
  border-color: #3B4B7C;
  box-shadow: 0 6px 20px -4px rgba(59, 75, 124, 0.45);
  transform: translateY(-1px);
}
.role-pill .pill-match-tag {
  font-size: 11px;
  font-weight: 700;
  background: #FFFFFF;
  color: #3B4B7C;
  padding: 2px 9px;
  border-radius: 999px;
  letter-spacing: .02em;
}
.role-pill:not(.on) .pill-match-tag {
  background: var(--mint-100);
  color: var(--mint-700);
}

/* ---- Focus Area Item Card ---- */
.gap-item-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(38, 43, 74, 0.12);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.gap-item-card:hover {
  background: rgba(255, 255, 255, 0.9);
  border-color: rgba(38, 43, 74, 0.2);
}
.gap-num-badge {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--grad-btn);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.uplift-pill {
  font-size: 11.5px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 999px;
  background: #FEF0DA;
  color: #96540D;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ---- Journey stepper ---- */
.journey-stepper{position:relative;}
.journey-step{flex:1;position:relative;padding-right:24px;}
.journey-num{width:38px;height:38px;border-radius:50%;background:var(--grad-btn);color:#fff;font-family:'Bricolage Grotesque';font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;position:relative;z-index:1;}
.journey-track{position:absolute;top:19px;left:38px;right:-24px;height:2px;background:linear-gradient(90deg,rgba(232,93,138,.4),rgba(74,87,160,.4));}

@media (max-width: 760px){
  .journey-stepper{flex-direction:column;gap:28px;}
  .journey-step{padding-right:0;}
  .journey-track{display:none;}
  .readiness-grid{grid-template-columns:1fr!important;}
}

@media (prefers-reduced-motion: reduce){
  .reveal-inner{transform:none !important;}
}
</style>
</head>
<body>

${navItems.map((id) => `<div class="view" id="view-${id}">${views[id]}</div>`).join('\n')}

<script>
gsap.registerPlugin(ScrollTrigger);
var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* =========================================================
   NAVIGATION + SMOOTH STAGGERED PAGE TRANSITIONS
   ========================================================= */
var isTransitioning = false;
function showView(id) {
  var current = document.querySelector('.view.active');
  var next = document.getElementById('view-' + id);
  if (!next || current === next || isTransitioning) return;

  function activateNext() {
    next.classList.add('active');
    window.scrollTo(0, 0);
    playEntrance(id);
    if (id === 'landing') setTimeout(function () { ScrollTrigger.refresh(); }, 60);
    if (id === 'snapshot') renderSnapshot();
    if (id === 'gap') renderRole(currentSelectedRole || 'operation-research');
  }

  if (REDUCED || !current) {
    if (current) current.classList.remove('active');
    activateNext();
    return;
  }

  isTransitioning = true;
  gsap.killTweensOf(current);
  gsap.to(current, {
    opacity: 0, y: -24, scale: 0.985, filter: 'blur(3px)',
    duration: 0.38, ease: 'power2.inOut',
    onComplete: function () {
      current.classList.remove('active');
      gsap.set(current, { clearProps: 'opacity,transform,filter' });
      activateNext();
      isTransitioning = false;
    }
  });
}

function playEntrance(id) {
  var root = document.getElementById('view-' + id);
  if (!root) return;
  var stepperEl = root.querySelectorAll('.js-stepper');
  var titleEl = root.querySelectorAll('.js-title, .js-hero-title');
  var subEls = root.querySelectorAll('.js-sub');
  var cardEls = root.querySelectorAll('.js-card');

  if (REDUCED) {
    [stepperEl, titleEl, subEls, cardEls].forEach(function (list) {
      if (list.length) gsap.set(list, { clearProps: 'all' });
    });
    return;
  }

  gsap.killTweensOf([stepperEl, titleEl, subEls, cardEls]);
  var tl = gsap.timeline({ defaults: { ease: 'power4.out' } });

  if (stepperEl.length) {
    tl.fromTo(stepperEl, { opacity: 0, y: -12 }, { opacity: 1, y: 0, duration: 0.5 }, 0);
  }
  if (titleEl.length) {
    tl.fromTo(titleEl, { yPercent: 110, scale: 1.04 }, { yPercent: 0, scale: 1, duration: 0.95, ease: 'power4.out' }, 0.1);
  }
  if (subEls.length) {
    tl.fromTo(subEls, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.07 }, 0.45);
  }
  if (cardEls.length) {
    tl.fromTo(cardEls, { opacity: 0, y: 28, scale: 0.985 }, { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.09 }, 0.5);
  }
}

/* =========================================================
   SCROLL-DRIVEN REVEALS (Landing Page)
   ========================================================= */
function initScrollReveals() {
  if (REDUCED) return;
  document.querySelectorAll('#view-landing .js-scroll-title').forEach(function(el){
    gsap.fromTo(el, { yPercent: 100, scale: 1.05 }, {
      yPercent: 0, scale: 1, duration: 1.0, ease: 'power4.out',
      scrollTrigger: { trigger: el, start: 'top 82%', toggleActions: 'play none none reverse' },
    });
  });
  document.querySelectorAll('#view-landing .js-scroll-sub').forEach(function(el){
    gsap.fromTo(el, { opacity: 0, y: 18 }, {
      opacity: 1, y: 0, duration: 0.7, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
    });
  });
  gsap.utils.toArray('#view-landing .journey-stepper').forEach(function(group){
    var cards = group.querySelectorAll('.js-scroll-card');
    gsap.fromTo(cards, { opacity: 0, y: 36 }, {
      opacity: 1, y: 0, duration: 0.75, ease: 'power3.out', stagger: 0.14,
      scrollTrigger: { trigger: group, start: 'top 80%', toggleActions: 'play none none reverse' },
    });
  });
  document.querySelectorAll('#view-landing div[style*="grid-template-columns:repeat(3,1fr)"]').forEach(function(group){
    var cards = group.querySelectorAll('.js-scroll-card');
    if (!cards.length) return;
    gsap.fromTo(cards, { opacity: 0, y: 40, scale: 0.98 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.75, ease: 'power3.out', stagger: 0.12,
      scrollTrigger: { trigger: group, start: 'top 82%', toggleActions: 'play none none reverse' },
    });
  });
  gsap.utils.toArray('#view-landing .js-parallax').forEach(function(el){
    var speed = parseFloat(el.getAttribute('data-speed')) || 0.2;
    gsap.to(el, {
      yPercent: speed * -60, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
    });
  });
}

/* =========================================================
   GUEST SESSION & INTAKE STATE
   ========================================================= */
var INTAKE_KEY = 'rerouteher_intake_mvp_v2';
var intake = { cv: null, breakYears: 3, breakText: '', loadedProfile: 'operation-research' };

function beginIntake() {
  showView('story-a');
}

function saveIntake() {
  var by = document.getElementById('break-years');
  if (by) intake.breakYears = by.value;
  var bt = document.getElementById('break-text-input');
  if (bt) intake.breakText = bt.value;
  try { localStorage.setItem(INTAKE_KEY, JSON.stringify(intake)); } catch (e) {}
}

function restoreIntake() {
  try {
    var raw = localStorage.getItem(INTAKE_KEY);
    if (raw) intake = Object.assign(intake, JSON.parse(raw));
  } catch (e) {}
  var by = document.getElementById('break-years');
  if (by) { by.value = intake.breakYears; var lbl = document.getElementById('break-years-label'); if (lbl) lbl.textContent = intake.breakYears + ' years'; }
  var bt = document.getElementById('break-text-input');
  if (bt && intake.breakText) bt.value = intake.breakText;
  if (intake.cv) showCvFileState(intake.cv);
}

/* ---- CV upload handlers ---- */
function handleCvFile(file) {
  var err = document.getElementById('cv-error');
  err.style.display = 'none';
  if (!file) return;
  var okType = /\\.(pdf|doc|docx)$/i.test(file.name);
  var okSize = file.size <= 10 * 1024 * 1024;
  if (!okType) { err.textContent = 'Please upload a PDF or DOCX file.'; err.style.display = 'block'; return; }
  if (!okSize) { err.textContent = 'That file is over 10MB \u2014 please upload something smaller.'; err.style.display = 'block'; return; }
  intake.cv = { name: file.name, size: file.size, role: 'Operation Research Analyst' };
  intake.loadedProfile = 'operation-research';
  showCvFileState(intake.cv);
  saveIntake();
}

function showCvFileState(cv) {
  document.getElementById('cv-empty-state').style.display = 'none';
  var fs = document.getElementById('cv-file-state');
  fs.style.display = 'flex';
  document.getElementById('cv-filename').textContent = cv.name;
  document.getElementById('cv-filesize').textContent = (cv.size / 1024 / 1024).toFixed(1) + ' MB · Verified';
}

function removeCvFile() {
  intake.cv = null;
  document.getElementById('cv-empty-state').style.display = 'block';
  document.getElementById('cv-file-state').style.display = 'none';
  saveIntake();
}

function loadSampleCv(profileKey) {
  profileKey = profileKey || 'operation-research';
  intake.loadedProfile = profileKey;
  if (profileKey === 'ux-ui') {
    intake.cv = { name: 'Sarah_Chen_Resume_UX.pdf', size: 1.8 * 1024 * 1024, role: 'Senior UX/UI Designer' };
    currentSelectedRole = 'ux-ui';
  } else {
    intake.cv = { name: 'Sarah_Chen_Resume_Analyst.pdf', size: 1.9 * 1024 * 1024, role: 'Operation Research Analyst' };
    currentSelectedRole = 'operation-research';
  }
  showCvFileState(intake.cv);
  saveIntake();
}

function validateAndContinueStoryA() {
  var err = document.getElementById('cv-error');
  if (!intake.cv) {
    loadSampleCv('operation-research');
  }
  err.style.display = 'none';
  showView('story-b');
}

/* ---- Career Break text handlers ---- */
function appendBreakText(snippet) {
  var bt = document.getElementById('break-text-input');
  if (!bt) return;
  if (bt.value.trim().length > 0) {
    bt.value = bt.value.trim() + ', ' + snippet;
  } else {
    bt.value = snippet;
  }
  intake.breakText = bt.value;
  saveIntake();
}

function validateAndContinueStoryB() {
  var bt = document.getElementById('break-text-input');
  var text = (bt ? bt.value : '').trim();
  if (text.length === 0) {
    intake.breakText = 'Cared for children full-time, managed household finances and schedules, organized community logistics, and self-studied data analytics tools';
    if (bt) bt.value = intake.breakText;
  } else {
    intake.breakText = text;
  }
  saveIntake();
  showView('snapshot');
}

/* =========================================================
   STEP 3: SKILL SNAPSHOT (READ-ONLY HISTORY BASELINE)
   ========================================================= */
var CV_SKILLS_PROFILES = {
  'operation-research': [
    { skill: 'Mathematical Optimization & Modeling', evidence: 'Designed linear programming & logistics optimization algorithms' },
    { skill: 'Data Analysis & Quantitative Reasoning', evidence: 'Analyzed operational datasets and simulation parameters' },
    { skill: 'Complex Problem Solving', evidence: 'Synthesized multidimensional constraints into structured solutions' },
    { skill: 'Critical Thinking & Inference', evidence: 'Evaluated trade-offs in resource distribution models' },
    { skill: 'Spreadsheet & Analytical Systems', evidence: 'Built predictive financial and inventory forecasting models' }
  ],
  'ux-ui': [
    { skill: 'User Research & Persona Synthesis', evidence: 'Ran usability testing at Wira Digital' },
    { skill: 'Wireframing & Interactive Prototyping', evidence: 'Wireframing and interactive prototyping at Studio Lima' },
    { skill: 'Design Systems & Component Tokens', evidence: 'Owned the design system at Wira Digital' },
    { skill: 'Information Architecture & User Flows', evidence: 'Led information architecture for the mobile app' },
    { skill: 'Usability Testing & Feedback Loops', evidence: 'Ran usability testing at Wira Digital' }
  ]
};

var isCvSkillsExpanded = false;
function toggleCvSkillsExpand() {
  isCvSkillsExpanded = !isCvSkillsExpanded;
  renderSnapshot();
}

function extractReframedSkillsFromText(text) {
  var lower = (text || '').toLowerCase();
  var skills = [];
  
  if (/child|kid|care|parent|family|baby/.test(lower)) {
    skills.push(
      { skill: 'Active Listening', from: 'Cared for children' },
      { skill: 'Social Perceptiveness', from: 'Family care & needs anticipation' }
    );
  }
  if (/budget|financ|money|cost|expense|saving|bill/.test(lower)) {
    skills.push({ skill: 'Management of Financial Resources', from: 'Household budget management' });
  }
  if (/house|home|schedul|organiz|manage|coordinat|plan|logistics/.test(lower)) {
    skills.push(
      { skill: 'Time Management', from: 'Managed multi-track schedules' },
      { skill: 'Coordination', from: 'Organized family and household logistics' }
    );
  }
  if (/volunt|commun|event|school|fundrais|outreach/.test(lower)) {
    skills.push({ skill: 'Stakeholder Coordination', from: 'Community volunteer initiatives' });
  }
  if (/stud|learn|course|class|read|tool|data|analyt|certif/.test(lower)) {
    skills.push({ skill: 'Continuous Learning', from: 'Self-directed online study' });
  }

  // Fallback defaults if empty
  if (skills.length === 0) {
    skills = [
      { skill: 'Active Listening', from: 'Caregiving and active communication' },
      { skill: 'Social Perceptiveness', from: 'Family emotional support' },
      { skill: 'Time Management', from: 'Multi-task daily scheduling' },
      { skill: 'Coordination', from: 'Family operations management' },
      { skill: 'Management of Financial Resources', from: 'Budget oversight' }
    ];
  }
  
  // Deduplicate by skill name
  var seen = {};
  return skills.filter(function(item) {
    if (seen[item.skill]) return false;
    seen[item.skill] = true;
    return true;
  });
}

function renderSnapshot() {
  var profileKey = intake.loadedProfile || 'operation-research';
  var cvList = CV_SKILLS_PROFILES[profileKey] || CV_SKILLS_PROFILES['operation-research'];

  // Baseline headline role
  var roleTitle = (profileKey === 'ux-ui') ? 'Senior UX/UI Designer' : 'Operation Research Analyst';
  var headlineRoleEl = document.getElementById('snapshot-headline-role');
  if (headlineRoleEl) headlineRoleEl.textContent = roleTitle;

  // CV skills count & chips
  var cvCountEl = document.getElementById('cv-skills-count');
  if (cvCountEl) cvCountEl.textContent = cvList.length;

  var haveCol = document.getElementById('skills-have-col');
  if (haveCol) {
    var maxVisible = 12;
    var visibleList = (isCvSkillsExpanded || cvList.length <= maxVisible) ? cvList : cvList.slice(0, maxVisible);
    haveCol.innerHTML = visibleList.map(function(item){
      return '<div class="skill-chip" title="' + (item.evidence || '') + '">' + item.skill + '</div>';
    }).join('');

    var moreContainer = document.getElementById('skills-have-more');
    var toggleBtn = document.getElementById('skills-have-toggle-btn');
    if (cvList.length > maxVisible) {
      moreContainer.style.display = 'block';
      toggleBtn.textContent = isCvSkillsExpanded ? 'Show fewer' : ('Show all ' + cvList.length);
    } else {
      moreContainer.style.display = 'none';
    }
  }

  // Reframed break skills from user's break input
  var reframedSkills = extractReframedSkillsFromText(intake.breakText);
  var breakCountEl = document.getElementById('break-skills-count');
  if (breakCountEl) breakCountEl.textContent = reframedSkills.length;

  var reframedCol = document.getElementById('skills-reframed-col');
  if (reframedCol) {
    reframedCol.innerHTML = reframedSkills.map(function(item){
      return '<div class="skill-chip from-break" title="from ' + (item.from || 'career break') + '">' + item.skill + '</div>';
    }).join('');
  }

  // Crosswalk banner
  var crosswalkText = document.getElementById('crosswalk-text');
  if (crosswalkText) {
    var primaryBreak = reframedSkills.slice(0, 3).map(function(s){ return s.skill; }).join(' &middot; ');
    crosswalkText.innerHTML = '<b>Natural Language Processing &rarr; ' + primaryBreak + '.</b> Real-world break activities systematically translated into standard O*NET competency taxonomies.';
  }
}

/* =========================================================
   STEP 4: TARGET ROLE READINESS & GAP ANALYSIS
   ========================================================= */
var PRESETS = {
  'operation-research': {
    title: 'Operation Research Analyst',
    isClosestMatch: true,
    pct: 62.6,
    projectedPct: 84.3,
    requirementsCount: 3,
    formulaExpl: 'Score is <b>importance-weighted</b>: based on the CV profile and O*NET requirements, your foundational core skills give you <b>62.6% baseline readiness</b>. Closing the top 3 focus areas projects your readiness to <b>84.3%</b>.',
    have: [
      { name: 'Mathematical Optimization & Modeling', origin: 'CV' },
      { name: 'Data Analysis & Quantitative Reasoning', origin: 'CV' },
      { name: 'Complex Problem Solving', origin: 'CV' },
      { name: 'Critical Thinking & Inference', origin: 'CV' },
      { name: 'Spreadsheet & Analytical Systems', origin: 'CV' },
      { name: 'Time Management', origin: 'Break' },
      { name: 'Coordination', origin: 'Break' }
    ],
    focusAreas: [
      {
        num: 1,
        skill: 'Mathematics (O*NET Skill)',
        band: 'Role skill',
        uplift: '+6.7% if learned'
      },
      {
        num: 2,
        skill: 'Use AI Assistants for Everyday Work Tasks',
        band: 'AI literacy',
        uplift: '+7.5% if learned'
      },
      {
        num: 3,
        skill: 'Check and Verify AI Output',
        band: 'AI literacy',
        uplift: '+7.5% if learned'
      }
    ],
    alsoMissing: []
  },
  'data-analyst': {
    title: 'Data Analyst',
    isClosestMatch: false,
    pct: 71.4,
    projectedPct: 88.9,
    requirementsCount: 4,
    formulaExpl: 'Transferable quantitative modeling, statistics, and structured problem-solving provide a strong <b>71.4% foundation</b>.',
    have: [
      { name: 'Data Analysis & Quantitative Reasoning', origin: 'CV' },
      { name: 'Spreadsheet Modeling & Pivot Queries', origin: 'CV' },
      { name: 'Critical Thinking & Pattern Recognition', origin: 'CV' },
      { name: 'Active Listening', origin: 'Break' },
      { name: 'Time Management', origin: 'Break' }
    ],
    focusAreas: [
      {
        num: 1,
        skill: 'SQL Query Optimization & Data Warehousing',
        band: 'Role skill',
        uplift: '+8.5% if learned'
      },
      {
        num: 2,
        skill: 'Use AI Assistants for Everyday Work Tasks',
        band: 'AI literacy',
        uplift: '+7.5% if learned'
      },
      {
        num: 3,
        skill: 'Interactive Business Dashboards (Tableau / Power BI)',
        band: 'Role skill',
        uplift: '+6.2% if learned'
      }
    ],
    alsoMissing: ['Python for Data Automation']
  },
  'mis-analyst': {
    title: 'Management Information Systems (MIS) Analyst',
    isClosestMatch: false,
    pct: 68.0,
    projectedPct: 86.5,
    requirementsCount: 3,
    formulaExpl: 'Strong process architecture and analytical background deliver a <b>68.0% baseline fit</b> for enterprise systems analyst roles.',
    have: [
      { name: 'Complex Problem Solving & Analysis', origin: 'CV' },
      { name: 'Information Systems Architecture', origin: 'CV' },
      { name: 'Spreadsheet & Analytical Systems', origin: 'CV' },
      { name: 'Resource & Budget Tracking', origin: 'Break' },
      { name: 'Coordination', origin: 'Break' }
    ],
    focusAreas: [
      {
        num: 1,
        skill: 'Enterprise System Integration (ERP / Cloud CRM)',
        band: 'Role skill',
        uplift: '+9.0% if learned'
      },
      {
        num: 2,
        skill: 'Use AI Assistants for Everyday Work Tasks',
        band: 'AI literacy',
        uplift: '+7.5% if learned'
      },
      {
        num: 3,
        skill: 'Information Security & Compliance Standards',
        band: 'Role skill',
        uplift: '+6.5% if learned'
      }
    ],
    alsoMissing: []
  },
  'ux-ui': {
    title: 'Senior UX/UI Designer',
    isClosestMatch: false,
    pct: 78.0,
    projectedPct: 94.0,
    requirementsCount: 3,
    formulaExpl: 'Foundational core design competencies (User Research, Prototyping, Design Systems) yield <b>78.0% readiness</b>.',
    have: [
      { name: 'User Research & Persona Synthesis', origin: 'CV' },
      { name: 'Wireframing & Interactive Prototyping', origin: 'CV' },
      { name: 'Design Systems & Component Tokens', origin: 'CV' },
      { name: 'Information Architecture & User Flows', origin: 'CV' },
      { name: 'Usability Testing & Feedback Loops', origin: 'CV' },
      { name: 'Active Listening', origin: 'Break' },
      { name: 'Time Management', origin: 'Break' }
    ],
    focusAreas: [
      {
        num: 1,
        skill: 'Scalable Design Systems (Tokens & Multi-brand)',
        band: 'Role skill',
        uplift: '+7.0% if learned'
      },
      {
        num: 2,
        skill: 'AI Design Tools (Figma AI, Midjourney)',
        band: 'AI literacy',
        uplift: '+9.0% if learned'
      },
      {
        num: 3,
        skill: 'Prompt Engineering for UX Workflows',
        band: 'AI literacy',
        uplift: '+5.0% if learned'
      }
    ],
    alsoMissing: []
  }
};

var currentSelectedRole = 'operation-research';
var currentGaugeTween = null;

var NS = 'http://www.w3.org/2000/svg';
function svgEl(p, t, a) { var n = document.createElementNS(NS, t); for (var k in a) n.setAttribute(k, a[k]); p.appendChild(n); return n; }
function svgTxt(p, a, s) { var n = svgEl(p, 'text', a); n.textContent = s; return n; }
function pol(cx, cy, r, deg) { var rad = deg * Math.PI / 180; return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]; }

function renderGauge(pct, targetPct) {
  var svg = document.getElementById('gauge');
  if (!svg) return;
  svg.innerHTML = '';
  
  var defs = svgEl(svg, 'defs', {});
  var grad = svgEl(defs, 'linearGradient', { id: 'gaugeGrad', x1: '0%', y1: '0%', x2: '100%', y2: '0%' });
  svgEl(grad, 'stop', { offset: '0%', 'stop-color': '#DE8BA8' });
  svgEl(grad, 'stop', { offset: '60%', 'stop-color': '#B4A2D4' });
  svgEl(grad, 'stop', { offset: '100%', 'stop-color': '#7E92CA' });

  // Semicircular / 200-deg gauge
  var cx = 160, cy = 130, R = 86, startAngle = -190, sweep = 200;

  // Background track
  var bgPath = describeArc(cx, cy, R, startAngle, startAngle + sweep);
  svgEl(svg, 'path', {
    d: bgPath, fill: 'none', stroke: 'rgba(38, 43, 74, 0.1)',
    'stroke-width': '14', 'stroke-linecap': 'round'
  });

  // Target improvement track
  if (targetPct > pct) {
    var targetSweep = (targetPct / 100) * sweep;
    var targetPath = describeArc(cx, cy, R, startAngle, startAngle + targetSweep);
    svgEl(svg, 'path', {
      d: targetPath, fill: 'none', stroke: 'rgba(180, 162, 212, 0.35)',
      'stroke-width': '14', 'stroke-linecap': 'round'
    });
  }

  // Active current readiness track
  var currentSweep = Math.max(2, (pct / 100) * sweep);
  var activePath = describeArc(cx, cy, R, startAngle, startAngle + currentSweep);
  var activeArc = svgEl(svg, 'path', {
    d: activePath, fill: 'none', stroke: 'url(#gaugeGrad)',
    'stroke-width': '14', 'stroke-linecap': 'round'
  });

  var numText = svgTxt(svg, {
    x: cx, y: cy - 2, 'font-size': '38', 'font-weight': '800',
    fill: '#262B4A', 'text-anchor': 'middle', 'font-family': 'Plus Jakarta Sans, sans-serif'
  }, '0%');

  svgTxt(svg, {
    x: cx, y: cy + 22, 'font-size': '10', 'font-weight': '800',
    fill: 'rgba(38, 43, 74, 0.5)', 'text-anchor': 'middle', 'letter-spacing': '.09em', 'text-transform': 'uppercase'
  }, 'READY TODAY');

  var displayVal = (pct % 1 !== 0) ? pct.toFixed(1) : pct.toString();
  if (REDUCED) {
    numText.textContent = displayVal + '%';
  } else {
    var counter = { val: 0 };
    if (currentGaugeTween) currentGaugeTween.kill();
    currentGaugeTween = gsap.to(counter, {
      val: pct, duration: 1.1, ease: 'power2.out',
      onUpdate: function () {
        numText.textContent = ((counter.val % 1 !== 0) ? counter.val.toFixed(1) : Math.round(counter.val)) + '%';
      }
    });
  }
}

function describeArc(x, y, radius, startAngle, endAngle) {
  var start = pol(x, y, radius, endAngle);
  var end = pol(x, y, radius, startAngle);
  var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
  return ['M', start[0], start[1], 'A', radius, radius, 0, largeArcFlag, 0, end[0], end[1]].join(' ');
}

var gapInitialized = false;
function renderRole(key) {
  currentSelectedRole = key;
  var p = PRESETS[key] || PRESETS['operation-research'];

  renderGauge(p.pct, p.projectedPct);

  var roleTitleEl = document.getElementById('gauge-role-title');
  if (roleTitleEl) roleTitleEl.textContent = p.title;

  var trb = document.getElementById('target-role-badge');
  if (trb) trb.textContent = p.title;

  var bannerPill = document.getElementById('projected-banner-pill');
  if (bannerPill) {
    var todayStr = (p.pct % 1 !== 0) ? p.pct.toFixed(1) : p.pct;
    var targetStr = (p.projectedPct % 1 !== 0) ? p.projectedPct.toFixed(1) : p.projectedPct;
    bannerPill.innerHTML = todayStr + '% today &rarr; ' + targetStr + '% after your focus areas';
  }

  var countBadge = document.getElementById('missing-count-badge');
  if (countBadge) countBadge.textContent = p.requirementsCount + (p.requirementsCount === 1 ? ' requirement' : ' requirements');

  var top3ListEl = document.getElementById('gap-top3-list');
  if (top3ListEl) {
    top3ListEl.innerHTML = p.focusAreas.map(function(item){
      return '<div class="gap-item-card">' +
        '<div class="gap-num-badge">' + item.num + '</div>' +
        '<div style="flex:1;min-width:0;">' +
          '<div style="font-size:14px;font-weight:700;color:var(--ink);">' + item.skill + '</div>' +
          '<div style="font-size:12px;color:var(--ink-faint);margin-top:2px;">' + item.band + '</div>' +
        '</div>' +
        '<div class="uplift-pill">' + item.uplift + '</div>' +
      '</div>';
    }).join('');
  }

  var alsoMissingWrap = document.getElementById('gap-also-missing');
  var alsoMissingListEl = document.getElementById('gap-also-missing-list');
  if (p.alsoMissing && p.alsoMissing.length > 0) {
    alsoMissingWrap.style.display = 'block';
    alsoMissingListEl.innerHTML = p.alsoMissing.map(function(skill){
      return '<span class="skill-chip" style="font-size:12px;">' + skill + '</span>';
    }).join('');
  } else if (alsoMissingWrap) {
    alsoMissingWrap.style.display = 'none';
  }

  var formulaText = document.getElementById('formula-expl-text');
  if (formulaText) formulaText.innerHTML = p.formulaExpl;

  var haveListEl = document.getElementById('gap-have-list');
  if (haveListEl) {
    haveListEl.innerHTML = p.have.map(function(s){
      var originTag = s.origin === 'Break' ? '<span style="font-size:10.5px;font-weight:700;background:var(--mint-100);color:var(--mint-700);padding:2px 8px;border-radius:999px;">Break</span>' : '<span style="font-size:10.5px;font-weight:700;background:rgba(70,83,158,.1);color:var(--blue-600);padding:2px 8px;border-radius:999px;">CV</span>';
      return '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12.5px;padding:3px 0;">' +
        '<span style="color:var(--ink);font-weight:600;">&bull; ' + s.name + '</span>' +
        originTag +
      '</div>';
    }).join('');
  }

  // Update role buttons active state
  document.querySelectorAll('#role-selector-container .role-pill').forEach(function(el){
    if (el.getAttribute('data-role') === key) {
      el.classList.add('on');
    } else {
      el.classList.remove('on');
    }
  });
}

function pickRole(key) {
  renderRole(key);
}

/* =========================================================
   INITIALIZATION
   ========================================================= */
restoreIntake();
renderRole('operation-research');
renderSnapshot();
showView('landing');
initScrollReveals();
</script>
</body>
</html>`;

// Write to site/index.html inside the prototype folder
const outputDir = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), 'site');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
console.log('wrote', path.join(outputDir, 'index.html'), html.length, 'bytes');

