import Link from "next/link";
import { asc } from "drizzle-orm";

import { db } from "@/db/client";
import { clients } from "@/db/schema/clients";
import { formatClientType } from "@/lib/format";

export default async function ClientsPage() {
  const clientList = await db
    .select()
    .from(clients)
    .orderBy(asc(clients.displayName));

  return (
    <div>
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            Clients
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Search, review and manage client records.
          </p>
        </div>

        <Link
          href="/clients/new"
          className="rounded-xl bg-[#6BC1B7] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#58B2A8]"
        >
          Add Client
        </Link>
      </div>

      <div className="mb-6 max-w-md">
        <input
          placeholder="Search clients..."
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-[#6BC1B7] focus:ring-2 focus:ring-[#6BC1B7]/20"
        />
      </div>

      {clientList.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <h2 className="text-lg font-semibold text-gray-900">
            No clients yet
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Add your first client to start building the practice workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {clientList.map((client) => (
            <Link
              key={client.id}
              href={`/clients/${client.id}`}
              className="block rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {client.displayName}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatClientType(client.clientType)}
                  </p>
                </div>

                <span className="rounded-full bg-[#6BC1B7]/15 px-3 py-1 text-xs font-medium text-[#2F7F77]">
                  {client.status}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}