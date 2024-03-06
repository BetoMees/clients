import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { firstValueFrom, Subject, switchMap, takeUntil } from "rxjs";

import {
  getById,
  OrganizationService,
} from "@bitwarden/common/admin-console/abstractions/organization/organization.service.abstraction";
import { FileDownloadService } from "@bitwarden/common/platform/abstractions/file-download/file-download.service";
import { I18nService } from "@bitwarden/common/platform/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/platform/abstractions/platform-utils.service";
import { DialogService } from "@bitwarden/components";
import { openUserVerificationPrompt } from "@bitwarden/web-vault/app/auth/shared/components/user-verification";

import { SecretsManagerPortingApiService } from "../services/sm-porting-api.service";
import { SecretsManagerPortingService } from "../services/sm-porting.service";

type ExportFormat = {
  name: string;
  fileExtension: string;
};

@Component({
  selector: "sm-export",
  templateUrl: "./sm-export.component.html",
})
export class SecretsManagerExportComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  protected orgName: string;
  protected orgId: string;
  protected exportFormats: ExportFormat[] = [{ name: "Bitwarden (json)", fileExtension: "json" }];

  protected formGroup = new FormGroup({
    format: new FormControl(0, [Validators.required]),
  });

  constructor(
    private route: ActivatedRoute,
    private i18nService: I18nService,
    private organizationService: OrganizationService,
    private platformUtilsService: PlatformUtilsService,
    private smPortingService: SecretsManagerPortingService,
    private fileDownloadService: FileDownloadService,
    private logService: LogService,
    private dialogService: DialogService,
    private secretsManagerApiService: SecretsManagerPortingApiService,
  ) {}

  async ngOnInit() {
    this.route.params
      .pipe(
        switchMap((params) =>
          this.organizationService.organizations$().pipe(getById(params.organizationId)),
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((organization) => {
        this.orgName = organization.name;
        this.orgId = organization.id;
      });

    this.formGroup.get("format").disable();
  }

  async ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  submit = async () => {
    this.formGroup.markAllAsTouched();

    if (this.formGroup.invalid) {
      return;
    }

    const userVerified = await this.verifyUser();
    if (!userVerified) {
      return;
    }

    await this.doExport();
  };

  private async doExport() {
    const fileExtension = this.exportFormats[this.formGroup.get("format").value].fileExtension;
    const exportData = await this.secretsManagerApiService.export(this.orgId);

    await this.downloadFile(exportData, fileExtension);
    this.platformUtilsService.showToast("success", null, this.i18nService.t("dataExportSuccess"));
  }

  private async downloadFile(data: string, format: string) {
    const fileName = await this.smPortingService.getFileName(null, format);
    this.fileDownloadService.download({
      fileName: fileName,
      blobData: data,
      blobOptions: { type: "text/plain" },
    });
  }

  private verifyUser() {
    const ref = openUserVerificationPrompt(this.dialogService, {
      data: {
        confirmDescription: "exportSecretsWarningDesc",
        confirmButtonText: "exportSecrets",
        modalTitle: "confirmSecretsExport",
      },
    });

    if (ref == null) {
      return;
    }

    return firstValueFrom(ref.closed);
  }
}
