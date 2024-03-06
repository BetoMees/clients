import { inject } from "@angular/core";
import { ActivatedRouteSnapshot, CanActivateFn, createUrlTreeFromSnapshot } from "@angular/router";
import { firstValueFrom } from "rxjs";

import {
  getById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { OrganizationId } from "@bitwarden/common/types/guid";
import { SyncService } from "@bitwarden/common/vault/abstractions/sync/sync.service.abstraction";

/**
 * Redirects from root `/sm` to first organization with access to SM
 */
export const organizationEnabledGuard: CanActivateFn = async (route: ActivatedRouteSnapshot) => {
  const syncService = inject(SyncService);
  const orgService = inject(OrganizationService);

  /** Workaround to avoid service initialization race condition. */
  if ((await syncService.getLastSync()) == null) {
    await syncService.fullSync(false);
  }

  const org = await firstValueFrom(
    orgService.organizations$().pipe(getById(route.params.organizationId as OrganizationId)),
  );
  if (org == null || !org.canAccessSecretsManager) {
    return createUrlTreeFromSnapshot(route, ["/"]);
  }

  if (!org.enabled) {
    return createUrlTreeFromSnapshot(route, ["/sm", org.id, "organization-suspended"]);
  }

  return true;
};
