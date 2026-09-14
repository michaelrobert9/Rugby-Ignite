// The AdSense loader script (adsbygoogle.js) reads from and pushes to this
// global array. Declared here so TypeScript is happy in the ad components.
export {};

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}
