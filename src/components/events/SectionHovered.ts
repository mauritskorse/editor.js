import type Section from '../section';

/**
 * Fired when some section is hovered by user
 */
export const SectionHovered = 'section hovered';

/**
 * Payload that will be passed with the event
 */
export interface SectionHoveredPayload {
  /**
   * Hovered section
   */
  section: Section;
}
