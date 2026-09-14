// AdSense constants — safe to import from both client and server (no imports,
// no server-only code). The publisher id is public.

export const ADSENSE_CLIENT = 'ca-pub-0306291154947834';

// Rankings ad slots. These are the fallbacks; the live values come from the
// site settings (adsense.slotTop / slotMid / slotBottom). An explicit empty
// string in settings means "no ad here".
export const DEFAULT_AD_SLOTS = {
  top: '3417521276', // Rankings Top
  mid: '1896556042', // Rankings Mid
  bottom: '1367529272', // Rankings Bottom
} as const;
