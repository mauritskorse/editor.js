import { SectionMutationEvent } from '../../../types/events/section';

/**
 * Fired when some section state has changed
 */
export const SectionChanged = 'section changed';

/**
 * Payload that will be passed with the event
 */
export interface SectionChangedPayload {
  /**
   * CustomEvent describing a section change
   */
  event: SectionMutationEvent;
}
