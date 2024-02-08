import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { firstValueFrom, map } from "rxjs";

import {
  mapToSingleOrganization,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { Organization } from "@bitwarden/common/admin-console/models/domain/organization";
import { OrganizationId } from "@bitwarden/common/types/guid";
import { SecretsManagerLogo } from "@bitwarden/web-vault/app/layouts/secrets-manager-logo";

@Component({
  selector: "sm-navigation",
  templateUrl: "./navigation.component.html",
})
export class NavigationComponent {
  protected readonly logo = SecretsManagerLogo;
  protected orgFilter = (org: Organization) => org.canAccessSecretsManager;
  protected isAdmin$ = this.route.params.pipe(
    map(
      async (params) =>
        (
          await firstValueFrom(
            this.organizationService
              .organizations$()
              .pipe(mapToSingleOrganization(params.organizationId as OrganizationId)),
          )
        )?.isAdmin,
    ),
  );

  constructor(
    protected route: ActivatedRoute,
    private organizationService: OrganizationService,
  ) {}
}
