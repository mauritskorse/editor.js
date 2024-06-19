import type { SectionMutationEventDetail } from './Base';

/**
 * Type name of CustomEvent related to section moved event
 */
export const SectionMovedMutationType = 'section-moved';

/**
 * Information about moved section
 */
interface SectionMovedEventDetail extends SectionMutationEventDetail {
  /**
   * Previous section position
   */
  fromIndex: number;

  /**
   * New section position
   */
  toIndex: number;
}

/**
 * Event will be fired when some section is moved to another position
 */
export type SectionMovedEvent = CustomEvent<SectionMovedEventDetail>;
