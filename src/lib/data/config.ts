import type { RankingConfig } from '../types';
import { readCollection, writeCollection } from './store';

const COLLECTION = 'config';

export async function getConfig(): Promise<RankingConfig> {
  return readCollection<RankingConfig>(COLLECTION);
}

export async function saveConfig(config: RankingConfig): Promise<void> {
  await writeCollection(COLLECTION, config);
}
