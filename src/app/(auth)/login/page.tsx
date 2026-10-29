import { AuthForm } from "@/components/auth-form";

export default async function LoginPage(props: PageProps<"/login">) {
  const { from } = await props.searchParams;
  // Only allow redirects back into the dashboard so `?from=` can't be used as an open redirect.
  const target = typeof from === "string" && from.startsWith("/dashboard") ? from : "/dashboard";

  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <AuthForm mode="login" redirectTo={target} />
    </main>
  );
}
