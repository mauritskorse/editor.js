import type { SectionMutationEventDetail } from './Base';

/**
 * Type name of CustomEvent related to section added event
 */
export const SectionAddedMutationType = 'section-added';

/**
 * Information about added section
 */
interface SectionAddedEventDetail extends SectionMutationEventDetail {
  /**
   * Index of added section
   */
  index: number;
}

/**
 * Event will be fired when the new section is added to the editor
 */
export type SectionAddedEvent = CustomEvent<SectionAddedEventDetail>;
