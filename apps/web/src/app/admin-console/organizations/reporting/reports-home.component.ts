import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { filter, map, Observable, startWith, concatMap, firstValueFrom } from "rxjs";

import {
  getById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { StateService } from "@bitwarden/common/platform/abstractions/state.service";
import { OrganizationId } from "@bitwarden/common/types/guid";

import { ReportVariant, reports, ReportType, ReportEntry } from "../../../tools/reports";

@Component({
  selector: "app-org-reports-home",
  templateUrl: "reports-home.component.html",
})
export class ReportsHomeComponent implements OnInit {
  reports$: Observable<ReportEntry[]>;
  homepage$: Observable<boolean>;

  constructor(
    private route: ActivatedRoute,
    private stateService: StateService,
    private organizationService: OrganizationService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.homepage$ = this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => (event as NavigationEnd).urlAfterRedirects.endsWith("/reports")),
      startWith(true),
    );

    this.reports$ = this.route.params.pipe(
      concatMap(
        async (params) =>
          await firstValueFrom(
            this.organizationService
              .organizations$()
              .pipe(getById(params.organizationId as OrganizationId)),
          ),
      ),
      map((org) => this.buildReports(org.isFreeOrg)),
    );
  }

  private buildReports(upgradeRequired: boolean): ReportEntry[] {
    const reportRequiresUpgrade = upgradeRequired
      ? ReportVariant.RequiresUpgrade
      : ReportVariant.Enabled;

    return [
      {
        ...reports[ReportType.ExposedPasswords],
        variant: reportRequiresUpgrade,
      },
      {
        ...reports[ReportType.ReusedPasswords],
        variant: reportRequiresUpgrade,
      },
      {
        ...reports[ReportType.WeakPasswords],
        variant: reportRequiresUpgrade,
      },
      {
        ...reports[ReportType.UnsecuredWebsites],
        variant: reportRequiresUpgrade,
      },
      {
        ...reports[ReportType.Inactive2fa],
        variant: reportRequiresUpgrade,
      },
    ];
  }
}
