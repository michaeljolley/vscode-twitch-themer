/**
 * Object that represents an installed theme
 */
export type Theme = {
  /** Id of the extension the theme belongs to */
  extensionId: string;
  /** Label of the theme.  Used as a friendly name of the theme */
  label: string;
  /**
   * Most theme extensions don't provide an id for each theme, but when they do, that id
   * should be used to set the active theme.
   */
  themeId: string | null;
  /**
   * Whether the theme is considered "dark mode"
   */
  isDark: boolean;
};
