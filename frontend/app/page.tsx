import { redirect } from "next/navigation";

// Root → send authenticated users to /dashboard, others to /login.
// The AuthGuard in the (app) layout handles the per-route check.
export default function RootPage() {
  redirect("/dashboard");
}
