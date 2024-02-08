import { map, Observable } from "rxjs";
import { Jsonify } from "type-fest";

import { KeyDefinition, ORGANIZATIONS_DISK, StateProvider } from "../../../platform/state";
import { UserId } from "../../../types/guid";
import { InternalOrganizationServiceAbstraction } from "../../abstractions/organization/organization.service.abstraction";
import { OrganizationData } from "../../models/data/organization.data";
import { Organization } from "../../models/domain/organization";

/**
 * The `KeyDefinition` for accessing organization lists in application state.
 * @todo Ideally this wouldn't require a `fromJSON()` call, but `OrganizationData`
 * has some properties that contain functions. This should probably get
 * cleaned up.
 */
export const ORGANIZATIONS = KeyDefinition.record<OrganizationData>(
  ORGANIZATIONS_DISK,
  "organizations",
  {
    deserializer: (obj: Jsonify<OrganizationData>) => OrganizationData.fromJSON(obj),
  },
);

export class OrganizationService implements InternalOrganizationServiceAbstraction {
  constructor(private stateProvider: StateProvider) {}

  organizations$(userId?: UserId): Observable<Organization[] | undefined> {
    return this.stateFor(userId).state$.pipe(this.mapOrganizationRecordToArray());
  }

  async upsert(organization: OrganizationData, userId?: UserId): Promise<void> {
    await this.stateFor(userId).update((existingOrganizations) => {
      const organizations = existingOrganizations ?? {};
      organizations[organization.id] = organization;
      return organizations;
    });
  }

  async replace(organizations: { [id: string]: OrganizationData }, userId?: UserId): Promise<void> {
    await this.stateFor(userId).update(() => {
      return organizations;
    });
  }

  /**
   * Accepts a record of `OrganizationData`, which is how we store the
   * organization list as a JSON object on disk, to an array of
   * `Organization`, which is how the data is published to callers of the
   * service.
   * @returns a function that can be used to pipe organization data from
   * stored state to an exposed object easily consumable by others.
   */
  private mapOrganizationRecordToArray() {
    return map<Record<string, OrganizationData>, Organization[]>((orgs) =>
      Object.values(orgs ?? {})?.map((o) => new Organization(o)),
    );
  }

  /**
   * Fetches the organization list from on disk state for the specified user.
   * @param userId the user ID to fetch the organization list for. Defaults to
   * the currently active user.
   * @returns an observable of organization state as it is stored on disk.
   */
  private stateFor(userId?: UserId) {
    return userId
      ? this.stateProvider.getUser(userId, ORGANIZATIONS)
      : this.stateProvider.getActive(ORGANIZATIONS);
  }
}
