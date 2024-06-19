import Section from './index';
import { SectionToolData, ToolConfig } from '../../../types/tools';
import { SavedData } from '../../../types/data-formats';
import { SectionAPI as SectionAPIInterface } from '../../../types/api';

/**
 * Constructs new SectionAPI object
 *
 * @class
 * @param {Section} section - Section to expose
 */
function SectionAPI(
  section: Section
): void {
  const sectionAPI: SectionAPIInterface = {
    /**
     * Section id
     *
     * @returns {string}
     */
    get id(): string {
      return section.id;
    },
    /**
     * Tool name
     *
     * @returns {string}
     */
    get name(): string {
      return section.name;
    },

    /**
     * Tool config passed on Editor's initialization
     *
     * @returns {ToolConfig}
     */
    get config(): ToolConfig {
      return section.config;
    },

    /**
     * .ce-section element, that wraps plugin contents
     *
     * @returns {HTMLElement}
     */
    get holder(): HTMLElement {
      return section.holder;
    },

    /**
     * True if Section content is empty
     *
     * @returns {boolean}
     */
    get isEmpty(): boolean {
      return section.isEmpty;
    },

    /**
     * True if Section is selected with Cross-Section selection
     *
     * @returns {boolean}
     */
    get selected(): boolean {
      return section.selected;
    },

    /**
     * Set Section's stretch state
     *
     * @param {boolean} state — state to set
     */
    set stretched(state: boolean) {
      section.stretched = state;
    },

    /**
     * True if Section is stretched
     *
     * @returns {boolean}
     */
    get stretched(): boolean {
      return section.stretched;
    },

    /**
     * True if Section has inputs to be focused
     */
    get focusable(): boolean {
      return section.focusable;
    },

    /**
     * Call Tool method with errors handler under-the-hood
     *
     * @param {string} methodName - method to call
     * @param {object} param - object with parameters
     * @returns {unknown}
     */
    call(methodName: string, param?: object): unknown {
      return section.call(methodName, param);
    },

    /**
     * Save Section content
     *
     * @returns {Promise<void|SavedData>}
     */
    save(): Promise<void|SavedData> {
      return section.save();
    },

    /**
     * Validate Section data
     *
     * @param {SectionToolData} data - data to validate
     * @returns {Promise<boolean>}
     */
    validate(data: SectionToolData): Promise<boolean> {
      return section.validate(data);
    },

    /**
     * Allows to say Editor that Section was changed. Used to manually trigger Editor's 'onChange' callback
     * Can be useful for section changes invisible for editor core.
     */
    dispatchChange(): void {
      section.dispatchChange();
    },
  };

  Object.setPrototypeOf(this, sectionAPI);
}

export default SectionAPI;
