import Link from "next/link";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";
import { signOutAction } from "./_actions/signout";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-full">
      <header className="border-b">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 p-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">QA Dashboard</Link>
            <Link href="/dashboard" className="text-sm text-gray-600 hover:text-black">Dashboard</Link>
            <Link href="/issues/new" className="text-sm text-gray-600 hover:text-black">New Issue</Link>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-500">{user.role}</span>
            <form action={signOutAction}>
              <button type="submit" className="rounded border px-2 py-1">Sign out</button>
            </form>
          </div>
        </nav>
      </header>
      <main className="mx-auto max-w-6xl p-4">{children}</main>
    </div>
  );
}
