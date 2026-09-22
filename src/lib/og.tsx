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

// The flame-in-shield mark as an inline SVG data URI (ember), for the card.
const MARK_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="60" height="71" viewBox="0 0 44 52" fill="none">' +
  '<path d="M22 2.5 L40 9.5 V25 C40 37 32 46 22 49.5 C12 46 4 37 4 25 V9.5 Z" stroke="#e8360a" stroke-width="3.2" stroke-linejoin="round"/>' +
  '<g transform="translate(6.4 10.2) scale(1.28)" fill="#e8360a"><path d="M13.5 0.67s0.74 2.65 0.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l0.03-0.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5 0.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-0.36 3.6-1.21 4.62-2.58 0.39 1.29 0.59 2.65 0.59 4.04 0 2.65-2.15 4.8-4.8 4.8z"/></g></svg>';
const MARK_URI = `data:image/svg+xml;base64,${Buffer.from(MARK_SVG).toString('base64')}`;

export interface CardProps {
  eyebrow: string; // e.g. "FIRST TEAM · WESTERN CAPE"
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
          background: '#0F1923',
          padding: '64px 72px',
          fontFamily: 'Archivo Black',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={MARK_URI} width={60} height={71} alt="" style={{ marginRight: 18 }} />
          <div style={{ fontSize: 30, letterSpacing: 2, color: '#FDF9F2' }}>RUGBY IGNITE</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 22, letterSpacing: 4, color: '#9A8F82' }}>{props.eyebrow}</div>
          <div style={{ fontSize: 68, lineHeight: 1.02, color: '#FDF9F2', marginTop: 16, maxWidth: 1050 }}>
            {props.title}
          </div>
          {props.figure && (
            <div style={{ display: 'flex', alignItems: 'flex-end', marginTop: 28 }}>
              <div style={{ fontSize: 120, lineHeight: 0.9, color: '#FDF9F2' }}>{props.figure}</div>
              {props.delta && (
                <div style={{ fontSize: 40, color: '#EFE7DB', marginLeft: 24, marginBottom: 12 }}>{props.delta}</div>
              )}
            </div>
          )}
          {props.figureLabel && (
            <div style={{ fontSize: 22, letterSpacing: 4, color: '#9A8F82', marginTop: 10 }}>{props.figureLabel}</div>
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 24, letterSpacing: 3, color: '#EFE7DB' }}>rugbyignite.co.za</div>
          <div style={{ width: 200, height: 6, background: '#E8360A' }} />
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: [{ name: 'Archivo Black', data: font, style: 'normal', weight: 400 }] },
  );
}
