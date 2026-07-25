import React from 'react';
import { CurrentPanchangTeaser } from './CurrentPanchangTeaser';
import { SampleAIInterpretation } from './SampleAIInterpretation';
import { SampleChartTeaser } from './SampleChartTeaser';
import { TimingTeaser } from './TimingTeaser';

export const JyotishTeaserSuite: React.FC = () => (
  <div className="relative isolate overflow-hidden bg-slate-950 text-white">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:48px_48px]"
    />
    <SampleChartTeaser />
    <CurrentPanchangTeaser />
    <TimingTeaser />
    <SampleAIInterpretation />
  </div>
);
