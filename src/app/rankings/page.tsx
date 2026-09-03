import { redirect } from 'next/navigation';

// Rankings now live on the home page. Keep this path working by forwarding any
// query string (sport/age/track/season) to the home page.
export default async function RankingsPage(props: PageProps<'/rankings'>) {
  const sp = await props.searchParams;
  const qs = new URLSearchParams(
    Object.entries(sp).flatMap(([k, v]) =>
      typeof v === 'string' ? [[k, v] as [string, string]] : [],
    ),
  ).toString();
  redirect(qs ? `/?${qs}` : '/');
}
