import { StateDefinitionLike, MigrationHelper } from "../migration-helper";
import { Migrator } from "../migrator";

const UriMatchStrategy = {
  Domain: 0,
  Host: 1,
  StartsWith: 2,
  Exact: 3,
  RegularExpression: 4,
  Never: 5,
} as const;

type UriMatchStrategySetting = (typeof UriMatchStrategy)[keyof typeof UriMatchStrategy];

type ExpectedAccountState = {
  settings?: {
    defaultUriMatch?: UriMatchStrategySetting;
    settings?: {
      equivalentDomains?: string[][];
    };
  };
};

type ExpectedGlobalState = {
  neverDomains?: { [key: string]: null };
};

const domainSettingsStateDefinition: {
  stateDefinition: StateDefinitionLike;
} = {
  stateDefinition: {
    name: "domainSettings",
  },
};

export class DomainSettingsMigrator extends Migrator<29, 30> {
  async migrate(helper: MigrationHelper): Promise<void> {
    // global state ("neverDomains")
    const globalState = await helper.get<ExpectedGlobalState>("global");

    if (globalState?.neverDomains != null) {
      await helper.setToGlobal(
        {
          stateDefinition: {
            name: "domainSettings",
          },
          key: "neverDomains",
        },
        globalState.neverDomains,
      );

      // delete `neverDomains` from state global
      delete globalState.neverDomains;

      await helper.set<ExpectedGlobalState>("global", globalState);
    }

    // account state ("defaultUriMatch" and "settings.equivalentDomains")
    const accounts = await helper.getAccounts<ExpectedAccountState>();

    await Promise.all([...accounts.map(({ userId, account }) => migrateAccount(userId, account))]);

    // migrate account state
    async function migrateAccount(userId: string, account: ExpectedAccountState): Promise<void> {
      const accountSettings = account?.settings;

      if (accountSettings?.defaultUriMatch != undefined) {
        await helper.setToUser(
          userId,
          { ...domainSettingsStateDefinition, key: "defaultUriMatchStrategy" },
          accountSettings.defaultUriMatch,
        );
        delete account.settings.defaultUriMatch;

        // update the state account settings with the migrated values deleted
        await helper.set(userId, account);
      }

      if (accountSettings?.settings?.equivalentDomains != undefined) {
        await helper.setToUser(
          userId,
          { ...domainSettingsStateDefinition, key: "equivalentDomains" },
          accountSettings.settings.equivalentDomains,
        );
        delete account.settings.settings.equivalentDomains;
        delete account.settings.settings;

        // update the state account settings with the migrated values deleted
        await helper.set(userId, account);
      }
    }
  }

  async rollback(helper: MigrationHelper): Promise<void> {
    // global state ("neverDomains")
    const globalState = (await helper.get<ExpectedGlobalState>("global")) || {};
    const neverDomains: { [key: string]: null } = await helper.getFromGlobal({
      ...domainSettingsStateDefinition,
      key: "neverDomains",
    });

    if (neverDomains != null) {
      await helper.set<ExpectedGlobalState>("global", {
        ...globalState,
        neverDomains: neverDomains,
      });

      // remove the global state provider framework key for `neverDomains`
      await helper.setToGlobal(
        {
          ...domainSettingsStateDefinition,
          key: "neverDomains",
        },
        null,
      );
    }

    // account state ("defaultUriMatchStrategy" and "equivalentDomains")
    const accounts = await helper.getAccounts<ExpectedAccountState>();

    await Promise.all([...accounts.map(({ userId, account }) => rollbackAccount(userId, account))]);

    // rollback account state
    async function rollbackAccount(userId: string, account: ExpectedAccountState): Promise<void> {
      let settings = account?.settings || {};

      const defaultUriMatchStrategy: UriMatchStrategySetting = await helper.getFromUser(userId, {
        ...domainSettingsStateDefinition,
        key: "defaultUriMatchStrategy",
      });

      const equivalentDomains: string[][] = await helper.getFromUser(userId, {
        ...domainSettingsStateDefinition,
        key: "equivalentDomains",
      });

      // update new settings and remove the account state provider framework keys for the rolled back values
      if (defaultUriMatchStrategy != null) {
        settings = { ...settings, defaultUriMatch: defaultUriMatchStrategy };

        await helper.setToUser(
          userId,
          { ...domainSettingsStateDefinition, key: "defaultUriMatchStrategy" },
          null,
        );
      }

      if (equivalentDomains != null) {
        settings = { ...settings, settings: { equivalentDomains } };

        await helper.setToUser(
          userId,
          { ...domainSettingsStateDefinition, key: "equivalentDomains" },
          null,
        );
      }

      // commit updated settings to state
      await helper.set(userId, {
        ...account,
        settings,
      });
    }
  }
}
