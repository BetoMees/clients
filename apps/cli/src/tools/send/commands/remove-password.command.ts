import { EnvironmentService } from "@bitwarden/common/platform/abstractions/environment.service";
import { SendService } from "@bitwarden/common/tools/send/services//send.service.abstraction";
import { SendApiService } from "@bitwarden/common/tools/send/services/send-api.service.abstraction";

import { Response } from "../../../models/response";
import { SendResponse } from "../models/send.response";

export class SendRemovePasswordCommand {
  constructor(
    private sendService: SendService,
    private sendApiService: SendApiService,
    private environmentService: EnvironmentService,
  ) {}

  async run(id: string) {
    try {
      await this.sendApiService.removePassword(id);

      const updatedSend = await this.sendService.get(id);
      const decSend = await updatedSend.decrypt();
      const webVaultUrl = this.environmentService.getWebVaultUrl();
      const res = new SendResponse(decSend, webVaultUrl);
      return Response.success(res);
    } catch (e) {
      return Response.error(e);
    }
  }
}
