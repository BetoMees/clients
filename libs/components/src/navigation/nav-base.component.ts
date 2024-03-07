import { Directive, EventEmitter, Input, Output } from "@angular/core";
import {
  ActivatedRoute,
  IsActiveMatchOptions,
  RouterLink,
  RouterLinkActive,
} from "@angular/router";

/** A component that creates a link within its template. */
type LinkComponent = {
  route?: RouterLink["routerLink"];
  relativeTo?: RouterLink["relativeTo"];
  routerLinkActiveOptions?: RouterLinkActive["routerLinkActiveOptions"];
};

/**
 * Base class used in `NavGroupComponent` and `NavItemComponent`
 */
@Directive()
export abstract class NavBaseComponent implements LinkComponent {
  /**
   * Text to display in main content
   */
  @Input() text: string;

  /**
   * `aria-label` for main content
   */
  @Input() ariaLabel: string;

  /**
   * Optional icon, e.g. `"bwi-collection"`
   */
  @Input() icon: string;

  /**
   * Route to be passed to internal `routerLink`
   *
   * See {@link RouterLink.routerLink}
   */
  @Input() route?: string | any[];

  /**
   * Passed to internal `routerLink`
   *
   * See {@link RouterLink.relativeTo}
   */
  @Input() relativeTo?: ActivatedRoute | null;

  /**
   * Passed to internal `routerLink`
   *
   * See {@link RouterLinkActive.routerLinkActiveOptions}
   */
  @Input() routerLinkActiveOptions?: { exact: boolean } | IsActiveMatchOptions = {
    paths: "subset",
    queryParams: "ignored",
    fragment: "ignored",
    matrixParams: "ignored",
  };

  /**
   * If this item is used within a tree, set `variant` to `"tree"`
   */
  @Input() variant: "default" | "tree" = "default";

  /**
   * Depth level when nested inside of a `'tree'` variant
   */
  @Input() treeDepth = 0;

  /**
   * If `true`, do not change styles when nav item is active.
   */
  @Input() hideActiveStyles = false;

  /**
   * Fires when main content is clicked
   */
  @Output() mainContentClicked: EventEmitter<MouseEvent> = new EventEmitter();
}
