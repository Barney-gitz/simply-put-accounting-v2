import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { accountsTrackingPeriods } from "@/db/schema/accounts-tracking";
import { clientCompaniesHouseCodes } from "@/db/schema/client-companies-house-codes";
import { clientDetails } from "@/db/schema/client-details";
import { clientServices } from "@/db/schema/client-services";
import { clients } from "@/db/schema/clients";

import { buildNextAccountsTrackingPeriod } from "./period-builder";
import { buildAccountsTrackingSnapshot } from "./snapshot-builder";

export type ArchiveAccountsTrackingPeriodInput = {
  clientId: string;
  clientServiceId: string;
  periodId: string;
};

export type ArchiveAccountsTrackingPeriodResult = {
  archivedPeriodId: string;
  nextPeriodId: string;
};

export async function archiveAccountsTrackingPeriod({
  clientId,
  clientServiceId,
  periodId,
}: ArchiveAccountsTrackingPeriodInput): Promise<ArchiveAccountsTrackingPeriodResult> {
  return db.transaction(async (tx) => {
    /*
     * Validate the complete ownership chain:
     *
     * Client
     *   → Client Service
     *     → Accounts Tracking Period
     *
     * We should never trust IDs supplied by a form independently.
     */
    const service = await tx
      .select({
        id: clientServices.id,
      })
      .from(clientServices)
      .where(
        and(
          eq(clientServices.id, clientServiceId),
          eq(clientServices.clientId, clientId)
        )
      )
      .limit(1);

    if (!service[0]) {
      throw new Error(
        "The selected service does not belong to this client."
      );
    }

    const periodRows = await tx
      .select()
      .from(accountsTrackingPeriods)
      .where(
        and(
          eq(accountsTrackingPeriods.id, periodId),
          eq(
            accountsTrackingPeriods.clientServiceId,
            clientServiceId
          ),
          eq(accountsTrackingPeriods.isCurrent, true)
        )
      )
      .limit(1);

    const currentPeriod = periodRows[0];

    if (!currentPeriod) {
      throw new Error(
        "The selected Accounts Tracking period is not the current period."
      );
    }

    /*
     * The service owns its rollover rules.
     *
     * This validates the year-end date before any database records are
     * changed and calculates the next period independently of the archive
     * transaction mechanics.
     */
    const nextPeriodValues =
      buildNextAccountsTrackingPeriod(currentPeriod);

    const clientRows = await tx
      .select({
        displayName: clients.displayName,
        companyNumber: clients.companyNumber,
      })
      .from(clients)
      .where(eq(clients.id, clientId))
      .limit(1);

    const client = clientRows[0];

    if (!client) {
      throw new Error("The client could not be found.");
    }

    const detailRows = await tx
      .select({
        utr: clientDetails.utr,
        companiesHouseAuthCode:
          clientDetails.companiesHouseAuthCode,
        bookkeepingSoftware:
          clientDetails.bookkeepingSoftware,
      })
      .from(clientDetails)
      .where(eq(clientDetails.clientId, clientId))
      .limit(1);

    const details = detailRows[0] ?? null;

    const companiesHouseCodes = await tx
      .select({
        id: clientCompaniesHouseCodes.id,
        code: clientCompaniesHouseCodes.code,
        belongsTo: clientCompaniesHouseCodes.belongsTo,
        sortOrder: clientCompaniesHouseCodes.sortOrder,
      })
      .from(clientCompaniesHouseCodes)
      .where(eq(clientCompaniesHouseCodes.clientId, clientId))
      .orderBy(
        asc(clientCompaniesHouseCodes.sortOrder),
        asc(clientCompaniesHouseCodes.createdAt)
      );

    const archivedAt = new Date();

    const snapshot = buildAccountsTrackingSnapshot({
      client,
      details,
      companiesHouseCodes,
      period: currentPeriod,
      capturedAt: archivedAt,
    });

    /*
     * Include isCurrent=true in the update condition.
     *
     * If two archive requests arrive close together, only the first can
     * archive the record. The second update returns no rows and is safely
     * rejected before it can create another current period.
     */
    const archivedPeriods = await tx
      .update(accountsTrackingPeriods)
      .set({
        snapshot,
        isCurrent: false,
        archivedAt,
        updatedAt: archivedAt,
      })
      .where(
        and(
          eq(accountsTrackingPeriods.id, periodId),
          eq(
            accountsTrackingPeriods.clientServiceId,
            clientServiceId
          ),
          eq(accountsTrackingPeriods.isCurrent, true)
        )
      )
      .returning({
        id: accountsTrackingPeriods.id,
      });

    if (!archivedPeriods[0]) {
      throw new Error(
        "This period has already been archived. Refresh the workspace and try again."
      );
    }

    const nextPeriods = await tx
      .insert(accountsTrackingPeriods)
      .values({
        clientServiceId,
        ...nextPeriodValues,
      })
      .returning({
        id: accountsTrackingPeriods.id,
      });

    const nextPeriod = nextPeriods[0];

    if (!nextPeriod) {
      throw new Error(
        "The next Accounts Tracking period could not be created."
      );
    }

    return {
      archivedPeriodId: archivedPeriods[0].id,
      nextPeriodId: nextPeriod.id,
    };
  });
}