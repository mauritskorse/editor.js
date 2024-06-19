import {SectionToolData, ToolConfig} from '../tools';
import {SavedData} from '../data-formats';

/**
 * @interface SectionAPI Describes Section API methods and properties
 */
export interface SectionAPI {
  /**
   * Section unique identifier
   */
  readonly id: string;

  /**
   * Tool name
   */
  readonly name: string;

  /**
   * Tool config passed on Editor's initialization
   */
  readonly config: ToolConfig;

  /**
   * Wrapper of Tool's HTML element
   */
  readonly holder: HTMLElement;

  /**
   * True if Section content is empty
   */
  readonly isEmpty: boolean;

  /**
   * True if Section is selected with Cross-Section selection
   */
  readonly selected: boolean;

  /**
   * True if Section has inputs to be focused
   */
  readonly focusable: boolean;

  /**
   * Setter sets Section's stretch state
   *
   * Getter returns true if Section is stretched
   */
  stretched: boolean;

  /**
   * Call Tool method with errors handler under-the-hood
   *
   * @param {string} methodName - method to call
   * @param {object} param - object with parameters
   *
   * @return {void}
   */
  call(methodName: string, param?: object): void;

  /**
   * Save Section content
   *
   * @return {Promise<void|SavedData>}
   */
  save(): Promise<void|SavedData>;

  /**
   * Validate Section data
   *
   * @param {SectionToolData} data
   *
   * @return {Promise<boolean>}
   */
  validate(data: SectionToolData): Promise<boolean>;

  /**
   * Allows to say Editor that Section was changed. Used to manually trigger Editor's 'onChange' callback
   * Can be useful for block changes invisible for editor core.
   */
  dispatchChange(): void;
}
