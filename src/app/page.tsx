import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth/session";

export default async function Home() {
  const user = await getAuthUser();
  if (!user) redirect("/login");

  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold">QA Dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">
        Signed in as {user.role}. Issue views arrive in the next plan.
      </p>
    </main>
  );
}
