import type { SectionAPI } from '../../api';

/**
 * Details of CustomEvent fired on section mutation
 */
export interface SectionMutationEventDetail {
  /**
   * Affected section
   */
  target: SectionAPI;
}
