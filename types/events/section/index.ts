import { type SectionAddedEvent, SectionAddedMutationType } from './SectionAdded';
import { type SectionChangedEvent, SectionChangedMutationType } from './SectionChanged';
import { type SectionMovedEvent, SectionMovedMutationType } from './SectionMoved';
import { type SectionRemovedEvent, SectionRemovedMutationType } from './SectionRemoved';

/**
 * Map for Custom Events related to section mutation types
 */
export interface SectionMutationEventMap {
  /**
   * New Section added
   */
  [SectionAddedMutationType]: SectionAddedEvent;

  /**
   * On Section deletion
   */
  [SectionRemovedMutationType]: SectionRemovedEvent;

  /**
   * Moving of a Section
   */
  [SectionMovedMutationType]: SectionMovedEvent;

  /**
   * Any changes inside the Section
   */
  [SectionChangedMutationType]: SectionChangedEvent;
}

/**
 * What kind of modification happened with the Section
 */
export type SectionMutationType = keyof SectionMutationEventMap;

/**
 * Returns a union type of values of passed object
 */
type ValueOf<T> = T[keyof T];

/**
 * CustomEvent describing a change related to a section
 */
export type SectionMutationEvent = ValueOf<SectionMutationEventMap>;
