/**
 * User Preferences Types
 *
 * Defines the shape of user preferences for reading mode and other settings.
 */

export type ReadingMode = 'cascade' | 'paginated';

export interface UserPreferences {
  readingMode: ReadingMode;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  readingMode: 'cascade',
};