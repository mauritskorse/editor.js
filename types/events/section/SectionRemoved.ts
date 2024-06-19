import type { SectionMutationEventDetail } from './Base';

/**
 * Type name of CustomEvent related to section removed event
 */
export const SectionRemovedMutationType = 'section-removed';

/**
 * Information about removed section
 */
interface SectionRemovedEventDetail extends SectionMutationEventDetail {
  /**
   * Index of removed section
   */
  index: number;
}

/**
 * Event will be fired when some section is removed
 */
export type SectionRemovedEvent = CustomEvent<SectionRemovedEventDetail>;
