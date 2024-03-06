import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { concatMap, map } from "rxjs";

import {
  getById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { OrganizationId } from "@bitwarden/common/types/guid";
import { Icon, Icons } from "@bitwarden/components";

@Component({
  templateUrl: "./org-suspended.component.html",
})
export class OrgSuspendedComponent {
  constructor(
    private organizationService: OrganizationService,
    private route: ActivatedRoute,
  ) {}

  protected NoAccess: Icon = Icons.NoAccess;
  protected organizationName$ = this.route.params.pipe(
    concatMap((params) =>
      this.organizationService
        .organizations$()
        .pipe(getById(params.organizationId as OrganizationId)),
    ),
    map((org) => org?.name),
  );
}
