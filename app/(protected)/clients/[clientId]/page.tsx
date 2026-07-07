import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import { db } from "@/db/client";
import { clients } from "@/db/schema/clients";
import { clientServices } from "@/db/schema/client-services";
import { serviceTypes } from "@/db/schema/service-types";
import { formatClientType } from "@/lib/format";
import { AddServiceModal } from "./add-service-modal";

type ClientPageProps = {
  params: Promise<{
    clientId: string;
  }>;
};

export default async function ClientPage({ params }: ClientPageProps) {
  const { clientId } = await params;

  const client = await db.query.clients.findFirst({
    where: eq(clients.id, clientId),
  });

  if (!client) {
    notFound();
  }

  const services = await db
    .select({
      id: clientServices.id,
      serviceTypeId: clientServices.serviceTypeId,
      name: serviceTypes.name,
      code: serviceTypes.code,
    })
    .from(clientServices)
    .innerJoin(serviceTypes, eq(clientServices.serviceTypeId, serviceTypes.id))
    .where(eq(clientServices.clientId, client.id));

  const allServiceTypes = await db.select().from(serviceTypes);

  const availableServices = allServiceTypes.filter((service) => {
    if (!service.isActive) return false;

    if (client.clientType === "individual") {
      return service.availableForIndividuals;
    }

    if (client.clientType === "limited_company") {
      return service.availableForCompanies;
    }

    return service.availableForPartnerships;
  });

  return (
    <div>
      <div className="mb-8">
        <Link href="/clients" className="text-sm text-gray-500 hover:text-gray-900">
          ← Clients
        </Link>

        <div className="mt-4 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
              {client.displayName}
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {formatClientType(client.clientType)} · {client.status}
            </p>
          </div>

          <button className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            Edit
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Overview</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Detail label="Email" value={client.email} />
            <Detail label="Phone" value={client.phone} />
            <Detail label="Company Number" value={client.companyNumber} />
            <Detail label="Address" value={formatAddress(client)} />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Services</h2>

            <AddServiceModal
              clientId={client.id}
              services={availableServices}
              selectedServiceTypeIds={services.map((service) => service.serviceTypeId)}
            />
          </div>

          <div className="mt-5 space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-gray-500">No services assigned.</p>
            ) : (
              services.map((service) => (
                <Link
                  key={service.id}
                  href={`/clients/${client.id}/services/${service.id}`}
                  className="block rounded-xl border border-gray-100 px-4 py-3 hover:bg-gray-50"
                >
                  <p className="font-medium text-gray-900">{service.name}</p>
                </Link>
              ))
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900">Relationships</h2>
          <p className="mt-4 text-sm text-gray-500">No relationships yet.</p>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <p className="mt-4 text-sm text-gray-500">No activity yet.</p>
        </section>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 text-sm text-gray-900">{value || "—"}</p>
    </div>
  );
}

function formatAddress(client: {
  addressLine1: string | null;
  addressLine2: string | null;
  town: string | null;
  county: string | null;
  postcode: string | null;
}) {
  return [
    client.addressLine1,
    client.addressLine2,
    client.town,
    client.county,
    client.postcode,
  ]
    .filter(Boolean)
    .join(", ");
}