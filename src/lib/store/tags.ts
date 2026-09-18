// Cache tag for the persisted state store. Kept in its own tiny module (no heavy
// imports) so pages, components and server actions can reference it without
// pulling in the Firebase Admin SDK. Reads of the store are tagged with this;
// a rebuild expires it so the next request re-reads the fresh store.
export const STORE_TAG = 'store';
