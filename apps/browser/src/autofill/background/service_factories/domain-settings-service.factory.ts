import { DomainSettingsService } from "@bitwarden/common/autofill/services/domain-settings.service";

import {
  CachedServices,
  factory,
  FactoryOptions,
} from "../../../platform/background/service-factories/factory-options";
import {
  stateProviderFactory,
  StateProviderInitOptions,
} from "../../../platform/background/service-factories/state-provider.factory";

export type DomainSettingsServiceInitOptions = FactoryOptions & StateProviderInitOptions;

export function domainSettingsServiceFactory(
  cache: { domainSettingsService?: DomainSettingsService } & CachedServices,
  opts: DomainSettingsServiceInitOptions,
): Promise<DomainSettingsService> {
  return factory(
    cache,
    "domainSettingsService",
    opts,
    async () => new DomainSettingsService(await stateProviderFactory(cache, opts)),
  );
}
