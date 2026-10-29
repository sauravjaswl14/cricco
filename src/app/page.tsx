import { redirect } from "next/navigation";

// The dashboard is the real landing page; middleware sends signed-out users to /login.
export default function Home() {
  redirect("/dashboard");
}
