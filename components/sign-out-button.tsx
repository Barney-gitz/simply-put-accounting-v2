import { logoutAction } from "@/app/(protected)/dashboard/actions";

export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-left text-sm font-medium text-gray-600 transition hover:bg-gray-50 hover:text-gray-900">
        Sign out
      </button>
    </form>
  );
}