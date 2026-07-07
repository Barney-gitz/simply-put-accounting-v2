import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients } from "@/db/schema/clients";
import { clientServices } from "@/db/schema/client-services";
import { serviceTypes } from "@/db/schema/service-types";

type ServicePageProps = {
  params: Promise<{
    clientId: string;
    clientServiceId: string;
  }>;
};

export default async function ClientServicePage({ params }: ServicePageProps) {
  const { clientId, clientServiceId } = await params;

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) {
    notFound();
  }

  const service = await db
    .select({
      id: clientServices.id,
      status: clientServices.status,
      startDate: clientServices.startDate,
      endDate: clientServices.endDate,
      serviceName: serviceTypes.name,
      serviceCode: serviceTypes.code,
    })
    .from(clientServices)
    .innerJoin(serviceTypes, eq(clientServices.serviceTypeId, serviceTypes.id))
    .where(eq(clientServices.id, clientServiceId))
    .limit(1);

  const clientService = service[0];

  if (!clientService) {
    notFound();
  }

  return (
    <div>
      <div className="mb-8">
        <Link
          href={`/clients/${client.id}`}
          className="text-sm text-gray-500 hover:text-gray-900"
        >
          ← {client.displayName}
        </Link>

        <div className="mt-4">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
            {clientService.serviceName}
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            {client.displayName} · {clientService.status}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
          <p className="mt-4 text-sm text-gray-500">
            Service-specific details will appear here.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Progress</h2>
          <p className="mt-4 text-sm text-gray-500">
            Workflow status will appear here.
          </p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
          <p className="mt-4 text-sm text-gray-500">No notes yet.</p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">History</h2>
          <p className="mt-4 text-sm text-gray-500">No history yet.</p>
        </section>
      </div>
    </div>
  );
}