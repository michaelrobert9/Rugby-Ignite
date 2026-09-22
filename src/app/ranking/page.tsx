import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// The national ranking is the home page (Website Brief §03). Keep /ranking as a
// permanent alias so old links resolve.
export default function RankingRedirect() {
  redirect('/');
}
