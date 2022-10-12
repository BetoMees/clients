import { Observable } from "rxjs";

import { AuthenticationStatus } from "../../enums/authenticationStatus";

export abstract class AccountService {
  accounts$: Observable<Map<string, AuthenticationStatus>>;
  activeAccount$: Observable<{ id: string; status: AuthenticationStatus }>;
  accountLocked$: Observable<string>;
  accountLogout$: Observable<string>;
  accountUnlocked$: Observable<string>;

  activeAccountLocked$: Observable<string>;
  activeAccountUnlocked$: Observable<string>;
  activeAccountLogout$: Observable<string>;

  abstract setAccountStatus(userId: string, status: AuthenticationStatus): void;
  abstract switchAccount(userId: string): void;
}

export abstract class InternalAccountService extends AccountService {
  abstract delete(): void;
}
