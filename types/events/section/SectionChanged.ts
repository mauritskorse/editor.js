import type { SectionMutationEventDetail } from './Base';

/**
 * Type name of CustomEvent related to section changed event
 */
export const SectionChangedMutationType = 'section-changed';

/**
 * Information about changed section
 */
interface SectionChangedEventDetail extends SectionMutationEventDetail {
  /**
   * Index of changed section
   */
  index: number;
}

/**
 * Event will be fired when some section is changed
 */
export type SectionChangedEvent = CustomEvent<SectionChangedEventDetail>;
