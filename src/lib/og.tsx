// Shared share-card (Open Graph) renderer. 1200×630, coal ground, the heat
// stroke + wordmark, and the figure at large size — per Brand Book v7.0 (no
// photography; every figure on the card also exists as text on the page it
// links to). Used by the per-school and per-story opengraph-image routes and
// the site default.

import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = 'image/png';

// satori (behind next/og) needs TTF/OTF/woff — not woff2 — so the card uses the
// TrueType build of Archivo Black (the site itself uses the woff2).
let fontPromise: Promise<ArrayBuffer> | null = null;
async function archivoBlack(): Promise<ArrayBuffer> {
  if (!fontPromise) {
    fontPromise = readFile(path.join(process.cwd(), 'public/fonts/archivo-black.ttf')).then(
      (b) => b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength) as ArrayBuffer,
    );
  }
  return fontPromise;
}

const RAMP = 'linear-gradient(to top, #4A1F06 0%, #C64A0A 38%, #E86A12 68%, #F5A623 88%, #FFE0B2 100%)';

export interface CardProps {
  eyebrow: string; // e.g. "FIRST XV · WESTERN CAPE"
  title: string; // school or story headline
  figure?: string; // e.g. "91.40"
  figureLabel?: string; // e.g. "IGNITE RATING · 2ND OF 184"
  delta?: string; // e.g. "▲ 4.10" (already coal on card via colour)
}

export async function renderCard(props: CardProps): Promise<ImageResponse> {
  const font = await archivoBlack();
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#16110F',
          padding: '64px 72px',
          fontFamily: 'Archivo Black',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: 16, height: 64, background: RAMP, marginRight: 20 }} />
          <div style={{ fontSize: 30, letterSpacing: 6, color: '#F6F2EC' }}>RUGBY IGNITE</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: '#8A7A70' }}>{props.eyebrow}</div>
          <div style={{ fontSize: 68, lineHeight: 1.02, color: '#F6F2EC', marginTop: 16, maxWidth: 1050 }}>
            {props.title}
          </div>
          {props.figure && (
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 28 }}>
              <div style={{ fontSize: 120, lineHeight: 0.9, color: '#F6F2EC' }}>{props.figure}</div>
              {props.delta && (
                <div style={{ fontSize: 40, color: '#CFC3B9', marginLeft: 24, marginBottom: 12 }}>{props.delta}</div>
              )}
            </div>
          )}
          {props.figureLabel && (
            <div style={{ fontSize: 22, letterSpacing: 4, color: '#8A7A70', marginTop: 10 }}>{props.figureLabel}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 24, letterSpacing: 3, color: '#CFC3B9' }}>rugbyignite.co.za</div>
          <div style={{ width: 220, height: 6, background: 'linear-gradient(to right, #4A1F06, #C64A0A, #E86A12, #F5A623, #FFE0B2)' }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: 'Archivo Black', data: font, style: 'normal', weight: 400 }] },
  );
}
