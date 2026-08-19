import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold">Sign-in failed</h1>
      <p className="max-w-md text-sm text-text-muted">
        Something went wrong completing sign-in. This usually clears up on a retry.
      </p>
      <Link href="/login" className="text-sm font-medium text-accent underline">
        Try again
      </Link>
    </main>
  );
}
