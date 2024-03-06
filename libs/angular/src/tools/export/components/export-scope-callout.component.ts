import { Component, Input, OnInit } from "@angular/core";
import { firstValueFrom } from "rxjs";

import {
  mapToBooleanHasAnyOrganizations,
  getById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { OrganizationId } from "@bitwarden/common/types/guid";

@Component({
  selector: "app-export-scope-callout",
  templateUrl: "export-scope-callout.component.html",
})
export class ExportScopeCalloutComponent implements OnInit {
  show = false;
  scopeConfig: {
    title: string;
    description: string;
    scopeIdentifier: string;
  };

  private _organizationId: string;

  get organizationId(): string {
    return this._organizationId;
  }

  @Input() set organizationId(value: string) {
    this._organizationId = value;
    // FIXME: Verify that this floating promise is intentional. If it is, add an explanatory comment and ensure there is proper error handling.
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.getScopeMessage(this._organizationId);
  }

  constructor(
    protected organizationService: OrganizationService,
    protected stateService: StateService,
  ) {}

  async ngOnInit(): Promise<void> {
    if (
      !(await firstValueFrom(
        this.organizationService.organizations$().pipe(mapToBooleanHasAnyOrganizations()),
      ))
    ) {
      return;
    }

    await this.getScopeMessage(this.organizationId);
    this.show = true;
  }

  private async getScopeMessage(organizationId: string) {
    this.scopeConfig =
      organizationId != null
        ? {
            title: "exportingOrganizationVaultTitle",
            description: "exportingOrganizationVaultDesc",
            scopeIdentifier: (
              await firstValueFrom(
                this.organizationService
                  .organizations$()
                  .pipe(getById(organizationId as OrganizationId)),
              )
            ).name,
          }
        : {
            title: "exportingPersonalVaultTitle",
            description: "exportingIndividualVaultDescription",
            scopeIdentifier: await this.stateService.getEmail(),
          };
  }
}
