"use client";

import { useState, useTransition } from "react";

import { updateClientServicesAction } from "./actions";

import { useRouter } from "next/navigation";

type ServiceOption = {
  id: string;
  name: string;
  description: string | null;
};

export function AddServiceModal({
  clientId,
  services,
  selectedServiceTypeIds,
}: {
  clientId: string;
  services: ServiceOption[];
  selectedServiceTypeIds: string[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm hover:bg-gray-50"
      >
        Add Service
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Services
            </h2>

            <form
              className="mt-6"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);

                startTransition(async () => {
                  await updateClientServicesAction(formData);

                  router.refresh();

                  setOpen(false);
                });
              }}
            >
              <input type="hidden" name="clientId" value={clientId} />

              <div className="space-y-3">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      name="serviceTypeIds"
                      value={service.id}
                      defaultChecked={selectedServiceTypeIds.includes(service.id)}
                      className="mt-1"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-900">
                        {service.name}
                      </span>
                      {service.description && (
                        <span className="mt-1 block text-sm text-gray-500">
                          {service.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  disabled={isPending}
                  className="rounded-xl bg-[#6BC1B7] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#58B2A8] disabled:opacity-60"
                >
                  {isPending ? "Saving..." : "Save Services"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}