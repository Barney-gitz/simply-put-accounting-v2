import Link from "next/link";

import { ClientForm } from "./client-form";

type NewClientPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function NewClientPage({
  searchParams,
}: NewClientPageProps) {
  const params = await searchParams;

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-900">
          ← Clients
        </Link>

        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-gray-900">
          Add Client
        </h1>
      </div>

      <ClientForm error={params?.error} />
    </div>
  );
}