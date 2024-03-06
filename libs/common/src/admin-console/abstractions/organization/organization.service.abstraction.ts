import { map, Observable } from "rxjs";

import { I18nService } from "../../../platform/abstractions/i18n.service";
import { Utils } from "../../../platform/misc/utils";
import { OrganizationId, UserId } from "../../../types/guid";
import { OrganizationData } from "../../models/data/organization.data";
import { Organization } from "../../models/domain/organization";

export function canAccessVaultTab(org: Organization): boolean {
  return org.canViewAssignedCollections || org.canViewAllCollections;
}

export function canAccessSettingsTab(org: Organization): boolean {
  return (
    org.isOwner ||
    org.canManagePolicies ||
    org.canManageSso ||
    org.canManageScim ||
    org.canAccessImportExport ||
    org.canManageDeviceApprovals
  );
}

export function canAccessMembersTab(org: Organization): boolean {
  return org.canManageUsers || org.canManageUsersPassword;
}

export function canAccessGroupsTab(org: Organization): boolean {
  return org.canManageGroups;
}

export function canAccessReportingTab(org: Organization): boolean {
  return org.canAccessReports || org.canAccessEventLogs;
}

export function canAccessBillingTab(org: Organization): boolean {
  return org.isOwner;
}

export function canAccessOrgAdmin(org: Organization): boolean {
  return (
    canAccessMembersTab(org) ||
    canAccessGroupsTab(org) ||
    canAccessReportingTab(org) ||
    canAccessBillingTab(org) ||
    canAccessSettingsTab(org) ||
    canAccessVaultTab(org)
  );
}

export function canAccessAdmin(i18nService: I18nService) {
  return map<Organization[], Organization[]>((orgs) =>
    orgs.filter(canAccessOrgAdmin).sort(Utils.getSortFunction(i18nService, "name")),
  );
}

/**
 * @deprecated
 * To be removed after Flexible Collections.
 **/
export function canAccessImportExport(i18nService: I18nService) {
  return map<Organization[], Organization[]>((orgs) =>
    orgs
      .filter((org) => org.canAccessImportExport)
      .sort(Utils.getSortFunction(i18nService, "name")),
  );
}

export function canAccessImport(i18nService: I18nService) {
  return map<Organization[], Organization[]>((orgs) =>
    orgs
      .filter(
        (org) =>
          org.canAccessImportExport || (org.canCreateNewCollections && org.flexibleCollections),
      )
      .sort(Utils.getSortFunction(i18nService, "name")),
  );
}

/**
 * Filter out organizations from an observable that __do not__ offer a
 * families-for-enterprise sponsorship to members.
 * @returns a function that can be used in `Observable<Organization[]>` pipes,
 * like `organizationService.organizations$`
 */
export function mapToExcludeOrganizationsWithoutFamilySponsorshipSupport() {
  return map<Organization[], Organization[]>((orgs) => orgs.filter((o) => o.canManageSponsorships));
}

/**
 * Filter out organizations from an observable that the organization user
 * __is not__ a direct member of. This will exclude organizations only
 * accessible as a provider, for example.
 * @returns a function that can be used in `Observable<Organization[]>` pipes,
 * like `organizationService.organizations$`
 */
export function mapToExcludeSpecialOrganizations() {
  return map<Organization[], Organization[]>((orgs) => orgs.filter((o) => o.isMember));
}

/**
 * Map an observable stream of organizations down to a boolean indicating
 * if any organizations exist (`orgs.length > 0`).
 * @returns a function that can be used in `Observable<Organization[]>` pipes,
 * like `organizationService.organizations$`
 */
export function mapToBooleanHasAnyOrganizations() {
  return map<Organization[], boolean>((orgs) => orgs.length > 0);
}

/**
 * Map an observable stream of organizations down to a single organization.
 * @param `organizationId` The ID of the organization you'd like to subscribe to
 * @returns a function that can be used in `Observable<Organization[]>` pipes,
 * like `organizationService.organizations$`
 */
export function getById(organizationId: OrganizationId) {
  return map<Organization[], Organization>((orgs) => orgs?.find((o) => o.id === organizationId));
}

/**
 * Publishes an observable stream of organizations. This service is meant to
 * be used widely across Bitwarden as the primary way of fetching organizations.
 * Risky operations like updates are isolated to the
 * internal extension `InternalOrganizationServiceAbstraction`.
 */
export abstract class OrganizationService {
  /**
   * Publishes state for all organizations under a single user.
   *
   * There are helper functions available for use in pipes that will
   * filter subscriptions for common tasks like subscribing to only one
   * organization, but they must be imported directly. See
   * `organization.service.abstraction` for details.
   * @param userId The user who's organization list the subscription will be
   * for. This defaults to the currently active user, and changes when the
   * active user changes.
   * @returns An observable list of organizations that meet the search criteria
   * provided.
   */
  organizations$: (userId?: UserId) => Observable<Organization[] | undefined>;
}

/**
 * Big scary buttons that **update** organization state. These should only be
 * called from within admin-console scoped code. Extends the base
 * `OrganizationService` for easy access to `get` calls.
 * @internal
 */
export abstract class InternalOrganizationServiceAbstraction extends OrganizationService {
  /**
   * Replaces state for the provided organization, or creates it if not found.
   * @param organization The organization state being saved.
   */
  upsert: (OrganizationData: OrganizationData) => Promise<void>;

  /**
   * Replaces state for the entire registered organization list for the active user.
   * You probably don't want this unless you're calling from a full sync
   * operation. See `upsert` for creating & updating a single organization in
   * the state.
   * @param organizations A complete list of all organization state for the active
   * user.
   */
  replace: (organizations: { [id: string]: OrganizationData }) => Promise<void>;
}
