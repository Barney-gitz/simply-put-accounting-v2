import { redirect } from "next/navigation";

import { getCurrentStaffUser } from "@/lib/auth";
import { loginAction } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const staffUser = await getCurrentStaffUser();

  if (staffUser) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const hasError = params?.error === "invalid";

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Simply Put</h1>
        <p className="mt-2 text-sm text-gray-600">Sign in to continue.</p>

        {hasError && (
          <div className="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700">
            Invalid email or password.
          </div>
        )}

        <form action={loginAction} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}