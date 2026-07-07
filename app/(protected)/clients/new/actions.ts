"use server";

import { redirect } from "next/navigation";

import { db } from "@/db/client";
import { clients } from "@/db/schema/clients";

type ClientType = "individual" | "limited_company" | "partnership";

export async function createClientAction(formData: FormData) {
  const clientType = String(formData.get("clientType")) as ClientType;
  const displayName = String(formData.get("displayName")).trim();
  const companyNumber = String(formData.get("companyNumber") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();

  if (!displayName) {
    redirect("/clients/new?error=missing_name");
  }

  if (!email && !phone) {
    redirect("/clients/new?error=missing_contact");
  }

  if (clientType !== "individual" && !companyNumber) {
    redirect("/clients/new?error=missing_company_number");
  }

  await db.insert(clients).values({
    clientType,
    displayName,
    companyNumber: companyNumber || null,
    email: email || null,
    phone: phone || null,
    addressLine1: address || null,
  });

  redirect("/clients");
}