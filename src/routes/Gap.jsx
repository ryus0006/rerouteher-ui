import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Header from '../components/layout/Header.jsx';
import SavedStrip from '../components/account/SavedStrip.jsx';
import ChapterBreak from '../components/account/ChapterBreak.jsx';
import IntakeStepper from '../components/intake/IntakeStepper.jsx';
import BackLink from '../components/intake/BackLink.jsx';
import ReadinessGauge from '../components/gap/ReadinessGauge.jsx';
import RoleSelector from '../components/gap/RoleSelector.jsx';
import MetRequirements from '../components/gap/MetRequirements.jsx';
import FocusAreaList, { MAX_FOCUS_AREAS } from '../components/gap/FocusAreaList.jsx';
import { pickFocusAreas } from '../lib/focusAreas.js';
import { markersFor } from '../lib/readiness.js';
import { computeGap } from '../api/gap.js';
import { useIntakeStore } from '../store/intakeStore.js';

export default function Gap() {
  const snapshot = useIntakeStore((state) => state.snapshot);
  const selectedRole = useIntakeStore((state) => state.selectedRole);
  const gapResult = useIntakeStore((state) => state.gapResult);
  const setSelectedRole = useIntakeStore((state) => state.setSelectedRole);
  const setGapResult = useIntakeStore((state) => state.setGapResult);

  const [error, setError] = useState(null);
  const [computing, setComputing] = useState(false);

  const requestedRole = useRef(null);

  useEffect(() => {
    if (!snapshot || !selectedRole) return;
    if (gapResult) return; // already computed for the current role (store clears it on any change)
    if (requestedRole.current === selectedRole.role_id) return; // request already in flight for this role

    requestedRole.current = selectedRole.role_id;
    setError(null);
    setComputing(true);

    computeGap(snapshot, selectedRole)
      .then(setGapResult)
      .catch((cause) => setError(cause.message))
      .finally(() => setComputing(false));
  }, [snapshot, selectedRole, gapResult, setGapResult]);

  if (!snapshot) return <Navigate to="/diagnostic/background" replace />;

  const focusAreas = gapResult ? pickFocusAreas(gapResult.gaps, MAX_FOCUS_AREAS) : [];
  const markers = gapResult ? markersFor(gapResult.readiness, focusAreas) : [];
  const projected = markers.length > 0 ? markers[markers.length - 1].at : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <SavedStrip />

      <main className="mx-auto w-full max-w-[1000px] flex-1 px-5 py-8 sm:px-6 sm:py-10">
        <IntakeStepper currentIndex={3} />

        <div className="mt-8">
          <BackLink to="/diagnostic/snapshot">Back to Skill Snapshot</BackLink>
        </div>

        <h1 className="mt-3 font-display text-2xl font-bold tracking-[-0.015em] text-ink sm:text-3xl">
          Where do you want to go next?
        </h1>

        <div className="mt-5">
          <RoleSelector
            roles={snapshot.recommended_roles}
            selected={selectedRole}
            onSelect={setSelectedRole}
            disabled={computing}
          />
        </div>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-pink-600">
            {error}
          </p>
        )}

        {gapResult && (
          /* The score is a narrow summary rail; the focus areas are the work, so
             they take the dominant column. The rail is the page's one dark
             plane — it anchors the layout and the arc reads brightest on it. */
          <div className="mt-6 grid items-start gap-5 md:grid-cols-[19.5rem_1fr]">
            <section className="overflow-hidden rounded-2xl bg-plane text-on-plane shadow-plane">
              <div className="p-6">
                <h2 className="font-display text-lg font-bold text-white">{selectedRole.role}</h2>

                <div className="mt-5">
                  <ReadinessGauge value={gapResult.readiness} markers={markers} />
                </div>

                {projected > gapResult.readiness && (
                  <p className="mt-5 rounded-xl bg-white/10 px-3 py-2 text-center text-sm font-semibold tabular text-white">
                    {gapResult.readiness}% today → {projected}% after your focus areas
                  </p>
                )}
              </div>

              <div className="border-t border-white/12 bg-plane-2 p-6">
                <MetRequirements
                  skills={gapResult.skills_have}
                  total={gapResult.skills_have.length + gapResult.gaps.length}
                  onPlane
                />

                <p className="mt-4 text-xs leading-relaxed text-on-plane-soft">
                  Readiness weighs each required skill by how much the role depends on it, so it is
                  not a plain count of skills covered.
                </p>
              </div>
            </section>

            <FocusAreaList gaps={gapResult.gaps} />
          </div>
        )}

        {computing && !gapResult && <p className="mt-6 text-sm text-ink-soft">Working it out…</p>}

        {gapResult && <ChapterBreak />}
      </main>
    </div>
  );
}
