import {
  Callout,
  DifficultyBadge,
  GuideLayout,
  GuideStep,
  GuideStepList,
  LinkButton,
  MediaFigure,
  MediaFigureThumbnail,
  ToolList,
} from "@openpawlabs/diy-guides-ui";

/**
 * The component scope supplied to compiled guides via MDX's `components` prop
 * (the `@openpawlabs/diy-guides-ui` import is stripped before compilation).
 *
 * These are the real library exports, passed through unchanged. `GuideStep`,
 * `LinkButton`, and others detect their children by referential identity, so any
 * wrapper would break composition (empty galleries, dropped bullets). Relative
 * asset URLs are instead resolved on the MDX source — see `rewriteAssetUrls`.
 */
export const guideComponents = {
  Callout,
  DifficultyBadge,
  GuideLayout,
  GuideStep,
  GuideStepList,
  LinkButton,
  MediaFigure,
  MediaFigureThumbnail,
  ToolList,
};
