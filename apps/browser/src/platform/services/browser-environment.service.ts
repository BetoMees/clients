import { AccountService } from "@bitwarden/common/auth/abstractions/account.service";
import { LogService } from "@bitwarden/common/platform/abstractions/log.service";
import { EnvironmentService } from "@bitwarden/common/platform/services/environment.service";
import { StateProvider } from "@bitwarden/common/platform/state";

import { GroupPolicyEnvironment } from "../../admin-console/types/group-policy-environment";
import { devFlagEnabled, devFlagValue } from "../flags";

export class BrowserEnvironmentService extends EnvironmentService {
  constructor(
    private logService: LogService,
    stateProvider: StateProvider,
    accountService: AccountService,
  ) {
    super(stateProvider, accountService);
  }

  async hasManagedEnvironment(): Promise<boolean> {
    try {
      return (await this.getManagedEnvironment()) != null;
    } catch (e) {
      this.logService.error(e);
      return false;
    }
  }

  async settingsHaveChanged() {
    if (!(await this.hasManagedEnvironment())) {
      return false;
    }

    const env = await this.getManagedEnvironment();

    return (
      env.base != this.baseUrl ||
      env.webVault != this.webVaultUrl ||
      env.api != this.webVaultUrl ||
      env.identity != this.identityUrl ||
      env.icons != this.iconsUrl ||
      env.notifications != this.notificationsUrl ||
      env.events != this.eventsUrl
    );
  }

  getManagedEnvironment(): Promise<GroupPolicyEnvironment> {
    return devFlagEnabled("managedEnvironment")
      ? new Promise((resolve) => resolve(devFlagValue("managedEnvironment")))
      : new Promise((resolve, reject) => {
          if (chrome.storage.managed == null) {
            return resolve(null);
          }

          chrome.storage.managed.get("environment", (result) => {
            if (chrome.runtime.lastError) {
              return reject(chrome.runtime.lastError);
            }

            resolve(result.environment);
          });
        });
  }

  async setUrlsToManagedEnvironment() {
    const env = await this.getManagedEnvironment();
    await this.setUrls({
      base: env.base,
      webVault: env.webVault,
      api: env.api,
      identity: env.identity,
      icons: env.icons,
      notifications: env.notifications,
      events: env.events,
    });
  }
}
