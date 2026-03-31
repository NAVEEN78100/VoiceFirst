import { redirect } from 'next/navigation';

export default function Home() {
  // Directly point all root traffic to authentication.
  redirect('/login');
}
