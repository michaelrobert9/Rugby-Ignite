'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getSportConfig, saveSportConfig } from './data/config';
import { getSiteSettings, saveSiteSettings } from './data/siteSettings';
import type { SportKey } from './matchpulse/types';
import { getPage, savePage } from './data/pages';
import { deletePost, savePost, slugify, uniquePostId } from './data/posts';
import { type Page, type Post, type RankingConfig } from './types';

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}
function num(fd: FormData, key: string, fallback = 0): number {
  const v = str(fd, key);
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

// ---------------- Config ----------------

const SPORT_KEYS: SportKey[] = ['rugby', 'hockey', 'waterpolo', 'netball'];

export async function saveConfigAction(formData: FormData) {
  const raw = str(formData, 'sport');
  const sport: SportKey = (SPORT_KEYS as string[]).includes(raw) ? (raw as SportKey) : 'rugby';

  // `current` is the fallback for every field: when the Master formula is left
  // locked, its inputs aren't submitted, so those values are preserved as-is.
  const current = await getSportConfig(sport);
  const config: RankingConfig = {
    ...current,
    kMaster: num(formData, 'kMaster', current.kMaster),
    masterSafetyCap: num(formData, 'masterSafetyCap', current.masterSafetyCap),
    masterMarginMultiplier: num(formData, 'masterMarginMultiplier', current.masterMarginMultiplier),
    masterMarginThreshold: num(formData, 'masterMarginThreshold', current.masterMarginThreshold),
    masterUpsetMultiplier: num(formData, 'masterUpsetMultiplier', current.masterUpsetMultiplier),
    masterUpsetThreshold: num(formData, 'masterUpsetThreshold', current.masterUpsetThreshold),
    kSeason: num(formData, 'kSeason', current.kSeason),
    seedFactor: num(formData, 'seedFactor', current.seedFactor),
    seasonMarginMultiplier: num(formData, 'seasonMarginMultiplier', current.seasonMarginMultiplier),
    seasonUpsetMultiplier: num(formData, 'seasonUpsetMultiplier', current.seasonUpsetMultiplier),
    seasonSafetyCap: num(formData, 'seasonSafetyCap', current.seasonSafetyCap),
    marginThreshold: num(formData, 'marginThreshold', current.marginThreshold),
    upsetThreshold: num(formData, 'upsetThreshold', current.upsetThreshold),
    homeAdvantage: num(formData, 'homeAdvantage', current.homeAdvantage),
    ratingDivisor: num(formData, 'ratingDivisor', current.ratingDivisor),
    baselineRating: num(formData, 'baselineRating', current.baselineRating),
    currentSeason: str(formData, 'currentSeason') || current.currentSeason,
    masterTitle: str(formData, 'masterTitle') || current.masterTitle,
    seasonTitle: str(formData, 'seasonTitle') || current.seasonTitle,
    seasonHeading: str(formData, 'seasonHeading') || current.seasonHeading,
    seasonIntro: str(formData, 'seasonIntro') || current.seasonIntro,
    masterHeading: str(formData, 'masterHeading') || current.masterHeading,
    masterIntro: str(formData, 'masterIntro') || current.masterIntro,
  };
  await saveSportConfig(sport, config);
  revalidatePath('/admin/settings');
  revalidatePath('/');
  revalidatePath('/rankings');
  redirect(`/admin/settings?sport=${sport}&saved=1`);
}

// ---------------- Site settings (ads) ----------------

export async function saveSiteSettingsAction(formData: FormData) {
  const current = await getSiteSettings();
  await saveSiteSettings({
    ...current,
    adsenseClient: str(formData, 'adsenseClient').trim(),
    adsTxt: formData.get('adsTxt') != null ? String(formData.get('adsTxt')) : current.adsTxt,
  });
  revalidatePath('/', 'layout');
  revalidatePath('/ads.txt');
  redirect('/admin/ads?saved=1');
}

export async function saveSeoAction(formData: FormData) {
  const current = await getSiteSettings();
  await saveSiteSettings({
    ...current,
    seoTitle: str(formData, 'seoTitle') || current.seoTitle,
    seoDescription: str(formData, 'seoDescription') || current.seoDescription,
    seoKeywords: str(formData, 'seoKeywords'),
  });
  revalidatePath('/', 'layout');
  redirect('/admin/seo?saved=1');
}

// ---------------- Pages (CMS) ----------------

export async function savePageAction(formData: FormData) {
  const id = str(formData, 'id');
  const existing = await getPage(id);
  if (!existing) redirect('/admin/pages');

  const page: Page = {
    ...existing,
    navLabel: str(formData, 'navLabel') || existing.navLabel,
    navOrder: num(formData, 'navOrder', existing.navOrder),
    showInNav: formData.get('showInNav') === 'on',
    title: str(formData, 'title') || existing.title,
    slug: str(formData, 'slug') || existing.slug,
    metaTitle: str(formData, 'metaTitle'),
    metaDescription: str(formData, 'metaDescription'),
    // Body keeps its formatting (newlines) — don't trim the interior.
    body: String(formData.get('body') ?? '').replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, ''),
  };
  await savePage(page);
  // Refresh the whole tree so nav labels/order and page content update.
  revalidatePath('/', 'layout');
  redirect(`/admin/pages/${id}?saved=1`);
}

// ---------------- News / Posts ----------------

export async function savePostAction(formData: FormData) {
  const idInput = str(formData, 'id');
  const title = str(formData, 'title') || 'Untitled';
  const slugInput = str(formData, 'slug');
  const id = idInput || (await uniquePostId(slugInput || title));

  const post: Post = {
    id,
    slug: slugify(slugInput || id) || id,
    title,
    excerpt: str(formData, 'excerpt'),
    author: str(formData, 'author') || 'Rugby Ignite',
    date: str(formData, 'date') || new Date().toISOString().slice(0, 10),
    status: str(formData, 'status') === 'published' ? 'published' : 'draft',
    body: String(formData.get('body') ?? '').replace(/\r\n/g, '\n').replace(/^\n+|\n+$/g, ''),
  };
  await savePost(post);
  revalidatePath('/', 'layout');
  redirect(`/admin/news/${id}?saved=1`);
}

export async function deletePostAction(formData: FormData) {
  const id = str(formData, 'id');
  if (id) await deletePost(id);
  revalidatePath('/', 'layout');
  redirect('/admin/news');
}
