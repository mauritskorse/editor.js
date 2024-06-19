import type { SectionAPI as SectionAPIInterface, Sections } from '../../../../types/api';
import { SectionToolData, OutputSectionData, OutputData, ToolConfig } from '../../../../types';
import * as _ from '../../utils';
import SectionAPI from '../../section/api';
import Module from '../../__module';
import Section from '../../section';
import { capitalize } from '../../utils';

/**
 * @class SectionsAPI
 * provides with methods working with Section
 */
export default class SectionsAPI extends Module {
  /**
   * Available methods
   *
   * @returns {Sections}
   */
  public get methods(): Sections {
    return {
      clear: (): Promise<void> => this.clear(),
      render: (data: OutputData): Promise<void> => this.render(data),
      renderFromHTML: (data: string): Promise<void> => this.renderFromHTML(data),
      delete: (index?: number): void => this.delete(index),
      swap: (fromIndex: number, toIndex: number): void => this.swap(fromIndex, toIndex),
      move: (toIndex: number, fromIndex?: number): void => this.move(toIndex, fromIndex),
      getSectionByIndex: (index: number): SectionAPIInterface | undefined => this.getSectionByIndex(index),
      getById: (id: string): SectionAPIInterface | null => this.getById(id),
      getCurrentSectionIndex: (): number => this.getCurrentSectionIndex(),
      getSectionIndex: (id: string): number => this.getSectionIndex(id),
      getSectionsCount: (): number => this.getSectionsCount(),
      stretchSection: (index: number, status = true): void => this.stretchSection(index, status),
      insertNewSection: (): void => this.insertNewSection(),
      insert: this.insert,
      insertMany: this.insertMany,
      update: this.update,
      composeSectionData: this.composeSectionData,
      convert: this.convert,
    };
  }

  /**
   * Returns Sections count
   *
   * @returns {number}
   */
  public getSectionsCount(): number {
    return this.Editor.SectionManager.sections.length;
  }

  /**
   * Returns current section index
   *
   * @returns {number}
   */
  public getCurrentSectionIndex(): number {
    return this.Editor.SectionManager.currentSectionIndex;
  }

  /**
   * Returns the index of Section by id;
   *
   * @param id - section id
   */
  public getSectionIndex(id: string): number | undefined {
    const section = this.Editor.SectionManager.getSectionById(id);

    if (!section) {
      _.logLabeled('There is no section with id `' + id + '`', 'warn');

      return;
    }

    return this.Editor.SectionManager.getSectionIndex(section);
  }

  /**
   * Returns SectionAPI object by Section index
   *
   * @param {number} index - index to get
   */
  public getSectionByIndex(index: number): SectionAPIInterface | undefined {
    const section = this.Editor.SectionManager.getSectionByIndex(index);

    if (section === undefined) {
      _.logLabeled('There is no section at index `' + index + '`', 'warn');

      return;
    }

    return new SectionAPI(section);
  }

  /**
   * Returns SectionAPI object by Section id
   *
   * @param id - id of section to get
   */
  public getById(id: string): SectionAPIInterface | null {
    const section = this.Editor.SectionManager.getSectionById(id);

    if (section === undefined) {
      _.logLabeled('There is no section with id `' + id + '`', 'warn');

      return null;
    }

    return new SectionAPI(section);
  }

  /**
   * Call Section Manager method that swap Sections
   *
   * @param {number} fromIndex - position of first Section
   * @param {number} toIndex - position of second Section
   * @deprecated — use 'move' instead
   */
  public swap(fromIndex: number, toIndex: number): void {
    _.log(
      '`sections.swap()` method is deprecated and will be removed in the next major release. ' +
      'Use `section.move()` method instead',
      'info'
    );

    this.Editor.SectionManager.swap(fromIndex, toIndex);
  }

  /**
   * Move section from one index to another
   *
   * @param {number} toIndex - index to move to
   * @param {number} fromIndex - index to move from
   */
  public move(toIndex: number, fromIndex?: number): void {
    this.Editor.SectionManager.move(toIndex, fromIndex);
  }

  /**
   * Deletes Section
   *
   * @param {number} sectionIndex - index of Section to delete
   */
  public delete(sectionIndex: number = this.Editor.SectionManager.currentSectionIndex): void {
    try {
      const section = this.Editor.SectionManager.getSectionByIndex(sectionIndex);

      this.Editor.SectionManager.removeSection(section);
    } catch (e) {
      _.logLabeled(e, 'warn');

      return;
    }

    /**
     * in case of last section deletion
     * Insert the new default empty section
     */
    if (this.Editor.SectionManager.sections.length === 0) {
      this.Editor.SectionManager.insert();
    }

    /**
     * After Section deletion currentSection is updated
     */
    if (this.Editor.SectionManager.currentSection) {
      this.Editor.Caret.setToSection(this.Editor.SectionManager.currentSection, this.Editor.Caret.positions.END);
    }

    this.Editor.Toolbar.close();
  }

  /**
   * Clear Editor's area
   */
  public async clear(): Promise<void> {
    await this.Editor.SectionManager.clear(true);
    this.Editor.InlineToolbar.close();
  }

  /**
   * Fills Editor with Sections data
   *
   * @param {OutputData} data — Saved Editor data
   */
  public async render(data: OutputData): Promise<void> {
    if (data === undefined || data.sections === undefined) {
      throw new Error('Incorrect data passed to the render() method');
    }

    /**
     * Semantic meaning of the "render" method: "Display the new document over the existing one that stays unchanged"
     * So we need to disable modifications observer temporarily
     */
    this.Editor.ModificationsObserver.disable();

    await this.Editor.SectionManager.clear();
    await this.Editor.Renderer.render(data.sections);

    this.Editor.ModificationsObserver.enable();
  }

  /**
   * Render passed HTML string
   *
   * @param {string} data - HTML string to render
   * @returns {Promise<void>}
   */
  public renderFromHTML(data: string): Promise<void> {
    this.Editor.SectionManager.clear();

    return this.Editor.Paste.processText(data, true);
  }

  /**
   * Stretch Section's content
   *
   * @param {number} index - index of Section to stretch
   * @param {boolean} status - true to enable, false to disable
   * @deprecated Use SectionAPI interface to stretch Sections
   */
  public stretchSection(index: number, status = true): void {
    _.deprecationAssert(
      true,
      'sections.stretchSection()',
      'SectionAPI'
    );

    const section = this.Editor.SectionManager.getSectionByIndex(index);

    if (!section) {
      return;
    }

    section.stretched = status;
  }

  /**
   * Insert new Section and returns it's API
   *
   * @param {string} type — Tool name
   * @param {SectionToolData} data — Tool data to insert
   * @param {ToolConfig} config — Tool config
   * @param {number?} index — index where to insert new Section
   * @param {boolean?} needToFocus - flag to focus inserted Section
   * @param replace - pass true to replace the Section existed under passed index
   * @param {string} id — An optional id for the new section. If omitted then the new id will be generated
   */
  public insert = (
    type: string = this.config.defaultSection,
    data: SectionToolData = {},
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, no-unused-vars
    config: ToolConfig = {},
    index?: number,
    needToFocus?: boolean,
    replace?: boolean,
    id?: string
  ): SectionAPIInterface => {
    const insertedSection = this.Editor.SectionManager.insert({
      id,
      tool: type,
      data,
      index,
      needToFocus,
      replace,
    });

    return new SectionAPI(insertedSection);
  };

  /**
   * Creates data of an empty section with a passed type.
   *
   * @param toolName - section tool name
   */
  public composeSectionData = async (toolName: string): Promise<SectionToolData> => {
    const tool = this.Editor.Tools.sectionTools.get(toolName);
    const section = new Section({
      tool,
      api: this.Editor.API,
      readOnly: true,
      data: {},
      tunesData: {},
    });

    return section.data;
  };

  /**
   * Insert new Section
   * After set caret to this Section
   *
   * @todo remove in 3.0.0
   * @deprecated with insert() method
   */
  public insertNewSection(): void {
    _.log('Method sections.insertNewSection() is deprecated and it will be removed in the next major release. ' +
      'Use sections.insert() instead.', 'warn');
    this.insert();
  }

  /**
   * Updates section data by id
   *
   * @param id - id of the section to update
   * @param data - the new data
   */
  public update = async (id: string, data: Partial<SectionToolData>): Promise<SectionAPIInterface> => {
    const { SectionManager } = this.Editor;
    const section = SectionManager.getSectionById(id);

    if (section === undefined) {
      throw new Error(`Section with id "${id}" not found`);
    }

    const updatedSection = await SectionManager.update(section, data);

    // we cast to any because our SectionAPI has no "new" signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (SectionAPI as any)(updatedSection);
  };

  /**
   * Converts section to another type. Both sections should provide the conversionConfig.
   *
   * @param id - id of the existing section to convert. Should provide 'conversionConfig.export' method
   * @param newType - new section type. Should provide 'conversionConfig.import' method
   * @param dataOverrides - optional data overrides for the new section
   * @throws Error if conversion is not possible
   */
  private convert = async (id: string, newType: string, dataOverrides?: SectionToolData): Promise<SectionAPIInterface> => {
    const { SectionManager, Tools } = this.Editor;
    const sectionToConvert = SectionManager.getSectionById(id);

    if (!sectionToConvert) {
      throw new Error(`Section with id "${id}" not found`);
    }

    const originalSectionTool = Tools.sectionTools.get(sectionToConvert.name);
    const targetSectionTool = Tools.sectionTools.get(newType);

    if (!targetSectionTool) {
      throw new Error(`Section Tool with type "${newType}" not found`);
    }

    const originalSectionConvertable = originalSectionTool?.conversionConfig?.export !== undefined;
    const targetSectionConvertable = targetSectionTool.conversionConfig?.import !== undefined;

    if (originalSectionConvertable && targetSectionConvertable) {
      const newSection = await SectionManager.convert(sectionToConvert, newType, dataOverrides);

      return new SectionAPI(newSection);
    } else {
      const unsupportedSectionTypes = [
        !originalSectionConvertable ? capitalize(sectionToConvert.name) : false,
        !targetSectionConvertable ? capitalize(newType) : false,
      ].filter(Boolean).join(' and ');

      throw new Error(`Conversion from "${sectionToConvert.name}" to "${newType}" is not possible. ${unsupportedSectionTypes} tool(s) should provide a "conversionConfig"`);
    }
  };


  /**
   * Inserts several Sections to a specified index
   *
   * @param sections - sections data to insert
   * @param index - index to insert the sections at
   */
  private insertMany = (
    sections: OutputSectionData[],
    index: number = this.Editor.SectionManager.sections.length - 1
  ): SectionAPIInterface[] => {
    this.validateIndex(index);

    const sectionsToInsert = sections.map(({ id, type, data }) => {
      return this.Editor.SectionManager.composeSection({
        id,
        tool: type || (this.config.defaultSection as string),
        data,
      });
    });

    this.Editor.SectionManager.insertMany(sectionsToInsert, index);

    // we cast to any because our SectionAPI has no "new" signature
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return sectionsToInsert.map((section) => new (SectionAPI as any)(section));
  };

  /**
   * Validated section index and throws an error if it's invalid
   *
   * @param index - index to validate
   */
  private validateIndex(index: unknown): void {
    if (typeof index !== 'number') {
      throw new Error('Index should be a number');
    }

    if (index < 0) {
      throw new Error(`Index should be greater than or equal to 0`);
    }

    if (index === null) {
      throw new Error(`Index should be greater than or equal to 0`);
    }
  }
}
