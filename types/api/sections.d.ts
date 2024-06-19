import {OutputSectionData, OutputData} from '../data-formats/output-data';
import {SectionToolData, ToolConfig} from '../tools';
import {SectionAPI} from './section';

/**
 * Describes methods to manipulate with Editor`s sections
 */
export interface Sections {
  /**
   * Remove all sections from Editor zone
   */
  clear(): Promise<void>;

  /**
   * Render passed data
   *
   * @param {OutputData} data - saved Section data
   *
   * @returns {Promise<void>}
   */
  render(data: OutputData): Promise<void>;

  /**
   * Render passed HTML string
   * @param {string} data
   * @return {Promise<void>}
   */
  renderFromHTML(data: string): Promise<void>;

  /**
   * Removes current Section
   * @param {number} index - index of a section to delete
   */
  delete(index?: number): void;

  /**
   * Swaps two Sections
   * @param {number} fromIndex - section to swap
   * @param {number} toIndex - section to swap with
   * @deprecated — use 'move' instead
   */
  swap(fromIndex: number, toIndex: number): void;

  /**
   * Moves a section to a new index
   * @param {number} toIndex - index where the section is moved to
   * @param {number} fromIndex - section to move
   */
  move(toIndex: number, fromIndex?: number): void;

  /**
   * Returns Section API object by passed Section index
   * @param {number} index
   */
  getSectionByIndex(index: number): SectionAPI | undefined;

  /**
   * Returns Section API object by passed Section id
   * @param id - id of the section
   */
  getById(id: string): SectionAPI | null;

  /**
   * Returns current Section index
   * @returns {number}
   */
  getCurrentSectionIndex(): number;

  /**
   * Returns the index of Section by id;
   */
  getSectionIndex(sectionId: string): number;

  /**
   * Mark Section as stretched
   * @param {number} index - Section to mark
   * @param {boolean} status - stretch status
   *
   * @deprecated Use SectionAPI interface to stretch Sections
   */
  stretchSection(index: number, status?: boolean): void;

  /**
   * Returns Sections count
   * @return {number}
   */
  getSectionsCount(): number;

  /**
   * Insert new Initial Section after current Section
   *
   * @deprecated
   */
  insertNewSection(): void;

  /**
   * Insert new Section and return inserted Section API
   *
   * @param {string} type — Tool name
   * @param {SectionToolData} data — Tool data to insert
   * @param {ToolConfig} config — Tool config
   * @param {number?} index — index where to insert new Section
   * @param {boolean?} needToFocus - flag to focus inserted Section
   * @param {boolean?} replace - should the existed Section on that index be replaced or not
   * @param {string} id — An optional id for the new section. If omitted then the new id will be generated
   */
  insert(
    type?: string,
    data?: SectionToolData,
    config?: ToolConfig,
    index?: number,
    needToFocus?: boolean,
    replace?: boolean,
    id?: string,
  ): SectionAPI;

  /**
   * Inserts several Sections to specified index
   */
  insertMany(
    sections: OutputSectionData[],
    index?: number,
  ): SectionAPI[];


  /**
   * Creates data of an empty section with a passed type.
   *
   * @param toolName - section tool name
   */
  composeSectionData(toolName: string): Promise<SectionToolData>

  /**
   * Updates section data by id
   *
   * @param id - id of the section to update
   * @param data - the new data. Can be partial.
   */
  update(id: string, data: Partial<SectionToolData>): Promise<SectionAPI>;

  /**
   * Converts section to another type. Both sections should provide the conversionConfig.
   *
   * @param id - id of the existed section to convert. Should provide 'conversionConfig.export' method
   * @param newType - new section type. Should provide 'conversionConfig.import' method
   * @param dataOverrides - optional data overrides for the new section
   *
   * @throws Error if conversion is not possible
   */
  convert(id: string, newType: string, dataOverrides?: SectionToolData): Promise<SectionAPI>;
}
