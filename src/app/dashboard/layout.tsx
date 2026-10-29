import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { getSession } from "@/lib/session";

const links = [
  { href: "/dashboard", label: "Players" },
  { href: "/dashboard/leaderboard", label: "Leaderboard" },
  { href: "/dashboard/matches/new", label: "Record match" },
];

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  // Middleware already blocks signed-out visitors; this is the second line of
  // defence and gives us the user for the header.
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex flex-1 flex-col">
      <header className="bg-pitch text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-8">
            <span className="text-lg font-semibold tracking-tight">Cricket Impact</span>
            <nav className="flex gap-1 text-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-white/90 transition hover:bg-white/10"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-white/80 sm:inline">
              {session.name} · {session.role === "ADMIN" ? "Admin" : "Viewer"}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
    </div>
  );
}
