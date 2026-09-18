// Form Heat gauge — the heat ramp as a fill against a track, per Brand Book v7.0
// §06. The gauge is the only place (besides the mark) the heat ramp appears; it
// always carries its band name where there's room. Fill = heat / 100, anchored
// to the base. When heat is withheld (off-season / festival) the caller renders
// nothing rather than an empty gauge.

import { HEAT_BAND_LABEL } from '@/lib/store/methodConfig';
import type { HeatBand } from '@/lib/store/types';

const FILL = 'linear-gradient(to right, var(--heat-2), var(--heat-3) 55%, var(--heat-4))';
const FILL_V = 'linear-gradient(to top, var(--heat-2), var(--heat-3) 55%, var(--heat-4) 85%, var(--heat-5))';

/** Compact horizontal gauge for the ranking table (38×7). */
export function HeatGauge({ heat, width = 38 }: { heat: number | null; width?: number }) {
  if (heat == null) return null;
  return (
    <div
      role="img"
      aria-label={`Form Heat ${heat} of 100`}
      title={`Form Heat ${heat}`}
      style={{ width, height: 7, background: 'var(--track)', flex: 'none' }}
    >
      <div style={{ height: 7, width: `${Math.max(0, Math.min(100, heat))}%`, background: FILL }} />
    </div>
  );
}

/** Tall vertical gauge with a five-band scale for the school header (24×172). */
export function HeatGaugeVertical({
  heat,
  band,
  height = 172,
}: {
  heat: number | null;
  band: HeatBand | null;
  height?: number;
}) {
  if (heat == null) return null;
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
      <div
        role="img"
        aria-label={`Form Heat ${heat} of 100${band ? `, ${HEAT_BAND_LABEL[band]}` : ''}`}
        style={{ width: 24, height, background: 'var(--track)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', flex: 'none' }}
      >
        <div style={{ height: `${Math.max(0, Math.min(100, heat))}%`, background: FILL_V }} />
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height,
          fontFamily: 'var(--font-sans)',
          fontWeight: 600,
          fontSize: 8.5,
          letterSpacing: '0.1em',
          color: 'var(--body-2)',
        }}
      >
        <span>100 WHITE HOT</span>
        <span>80 HOT</span>
        <span>60 WARM</span>
        <span>40 COOL</span>
        <span>20 COLD</span>
      </div>
    </div>
  );
}
