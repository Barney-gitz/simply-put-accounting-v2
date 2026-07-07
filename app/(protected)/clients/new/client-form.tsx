"use client";

import { useState } from "react";
import Link from "next/link";

import { createClientAction } from "./actions";

type ClientType = "individual" | "limited_company" | "partnership";

export function ClientForm({ error }: { error?: string }) {
  const [clientType, setClientType] = useState<ClientType>("individual");

  const nameLabel =
    clientType === "individual"
      ? "Full name"
      : clientType === "limited_company"
        ? "Company name"
        : "Partnership name";

  const showCompanyNumber = clientType !== "individual";

  return (
    <form
      action={createClientAction}
      className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      {error && (
        <div className="mb-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error === "missing_name" && "Name is required."}
          {error === "missing_contact" && "Enter either an email or phone number."}
          {error === "missing_company_number" && "Company number is required."}
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-gray-700">Client type</label>
          <select
            name="clientType"
            value={clientType}
            onChange={(e) => setClientType(e.target.value as ClientType)}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
          >
            <option value="individual">Individual</option>
            <option value="limited_company">Limited Company</option>
            <option value="partnership">Partnership</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">{nameLabel}</label>
          <input
            name="displayName"
            required
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 placeholder:text-gray-400"
          />
        </div>

        {showCompanyNumber && (
          <div>
            <label className="text-sm font-medium text-gray-700">
              Company number
            </label>
            <input
              name="companyNumber"
              required
              className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
            />
          </div>
        )}

        <div>
          <label className="text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
          />
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700">Phone</label>
          <input
            name="phone"
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700">Address</label>
          <textarea
            name="address"
            rows={4}
            className="mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900"
          />
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3">
        <Link
          href="/clients"
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </Link>

        <button className="rounded-xl bg-[#6BC1B7] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#58B2A8]">
          Create Client
        </button>
      </div>
    </form>
  );
}