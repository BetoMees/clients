import { map, firstValueFrom, Observable } from "rxjs";

import {
  NeverDomains,
  EquivalentDomains,
  UriMatchStrategySetting,
  UriMatchStrategy,
} from "../../models/domain/domain-service";
import { Utils } from "../../platform/misc/utils";
import {
  DOMAIN_SETTINGS_DISK,
  ActiveUserState,
  GlobalState,
  KeyDefinition,
  StateProvider,
} from "../../platform/state";

const NEVER_DOMAINS = new KeyDefinition(DOMAIN_SETTINGS_DISK, "neverDomains", {
  deserializer: (value: NeverDomains) => value ?? null,
});

const EQUIVALENT_DOMAINS = new KeyDefinition(DOMAIN_SETTINGS_DISK, "equivalentDomains", {
  deserializer: (value: EquivalentDomains) => value ?? null,
});

const DEFAULT_URI_MATCH_STRATEGY = new KeyDefinition(
  DOMAIN_SETTINGS_DISK,
  "defaultUriMatchStrategy",
  {
    deserializer: (value: UriMatchStrategySetting) => value ?? UriMatchStrategy.Domain,
  },
);

export abstract class DomainSettingsServiceAbstraction {
  neverDomains$: Observable<NeverDomains>;
  setNeverDomains: (newValue: NeverDomains) => Promise<void>;
  equivalentDomains$: Observable<EquivalentDomains>;
  setEquivalentDomains: (newValue: EquivalentDomains) => Promise<void>;
  defaultUriMatchStrategy$: Observable<UriMatchStrategySetting>;
  setDefaultUriMatchStrategy: (newValue: UriMatchStrategySetting) => Promise<void>;
  getUrlEquivalentDomains: (url: string) => Promise<Set<string>>;
  clear: () => Promise<void>;
}

export class DomainSettingsService implements DomainSettingsServiceAbstraction {
  private neverDomainsState: GlobalState<NeverDomains>;
  readonly neverDomains$: Observable<NeverDomains>;

  private equivalentDomainsState: ActiveUserState<EquivalentDomains>;
  readonly equivalentDomains$: Observable<EquivalentDomains>;

  private defaultUriMatchStrategyState: ActiveUserState<UriMatchStrategySetting>;
  readonly defaultUriMatchStrategy$: Observable<UriMatchStrategySetting>;

  constructor(private stateProvider: StateProvider) {
    this.neverDomainsState = this.stateProvider.getGlobal(NEVER_DOMAINS);
    this.neverDomains$ = this.neverDomainsState.state$.pipe(map((x) => x ?? null));

    this.equivalentDomainsState = this.stateProvider.getActive(EQUIVALENT_DOMAINS);
    this.equivalentDomains$ = this.equivalentDomainsState.state$.pipe(map((x) => x ?? null));

    this.defaultUriMatchStrategyState = this.stateProvider.getActive(DEFAULT_URI_MATCH_STRATEGY);
    this.defaultUriMatchStrategy$ = this.defaultUriMatchStrategyState.state$.pipe(
      map((x) => x ?? UriMatchStrategy.Domain),
    );
  }

  async setNeverDomains(newValue: NeverDomains): Promise<void> {
    await this.neverDomainsState.update(() => newValue);
  }

  async setEquivalentDomains(newValue: EquivalentDomains): Promise<void> {
    await this.equivalentDomainsState.update(() => newValue);
  }

  async setDefaultUriMatchStrategy(newValue: UriMatchStrategySetting): Promise<void> {
    await this.defaultUriMatchStrategyState.update(() => newValue);
  }

  async getUrlEquivalentDomains(url: string): Promise<Set<string>> {
    const domain = Utils.getDomain(url);
    if (domain == null) {
      return new Set();
    }

    const equivalentDomains = await firstValueFrom(this.equivalentDomains$);

    let result: string[] = [];

    if (equivalentDomains != null) {
      equivalentDomains
        .filter((ed) => ed.length > 0 && ed.includes(domain))
        .forEach((ed) => {
          result = result.concat(ed);
        });
    }

    return new Set(result);
  }

  async clear() {
    await Promise.all([
      this.setNeverDomains(null),
      this.setEquivalentDomains(null),
      this.setDefaultUriMatchStrategy(null),
    ]);
  }
}
