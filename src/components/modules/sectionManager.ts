/**
 * @class SectionManager
 * @classdesc Manage editor`s sections storage and appearance
 * @module SectionManager
 * @version 2.0.0
 */
import Section, { SectionToolAPI } from '../section';
import Module from '../__module';
import $ from '../dom';
import * as _ from '../utils';
import Sections from '../sections';
import { SectionToolData, PasteEvent } from '../../../types';
import { SectionTuneData } from '../../../types/section-tunes/section-tune-data';
import SectionAPI from '../section/api';
import { SectionMutationEventMap, SectionMutationType } from '../../../types/events/section';
import { SectionRemovedMutationType } from '../../../types/events/section/SectionRemoved';
import { SectionAddedMutationType } from '../../../types/events/section/SectionAdded';
import { SectionMovedMutationType } from '../../../types/events/section/SectionMoved';
import { SectionChangedMutationType } from '../../../types/events/section/SectionChanged';
import { SectionChanged } from '../events';
import { clean, sanitizeSections } from '../utils/sanitizer';
import { convertStringToSectionData, isSectionConvertable } from '../utils/sections';
import PromiseQueue from '../utils/promise-queue';

/**
 * @typedef {SectionManager} SectionManager
 * @property {number} currentSectionIndex - Index of current working section
 * @property {Proxy} _sections - Proxy for Sections instance {@link Sections}
 */
export default class SectionManager extends Module {
  /**
   * Returns current Section index
   *
   * @returns {number}
   */
  public get currentSectionIndex(): number {
    return this._currentSectionIndex;
  }

  /**
   * Set current Section index and fire Section lifecycle callbacks
   *
   * @param {number} newIndex - index of Section to set as current
   */
  public set currentSectionIndex(newIndex: number) {
    this._currentSectionIndex = newIndex;
  }

  /**
   * returns first Section
   *
   * @returns {Section}
   */
  public get firstSection(): Section {
    return this._sections[0];
  }

  /**
   * returns last Section
   *
   * @returns {Section}
   */
  public get lastSection(): Section {
    return this._sections[this._sections.length - 1];
  }

  /**
   * Get current Section instance
   *
   * @returns {Section}
   */
  public get currentSection(): Section | undefined {
    return this._sections[this.currentSectionIndex];
  }

  /**
   * Set passed Section as a current
   *
   * @param section - section to set as a current
   */
  public set currentSection(section: Section) {
    this.currentSectionIndex = this.getSectionIndex(section);
  }

  /**
   * Returns next Section instance
   *
   * @returns {Section|null}
   */
  public get nextSection(): Section | null {
    const isLastSection = this.currentSectionIndex === (this._sections.length - 1);

    if (isLastSection) {
      return null;
    }

    return this._sections[this.currentSectionIndex + 1];
  }

  /**
   * Return first Section with inputs after current Section
   *
   * @returns {Section | undefined}
   */
  public get nextContentfulSection(): Section {
    const nextSections = this.sections.slice(this.currentSectionIndex + 1);

    return nextSections.find((section) => !!section.inputs.length);
  }

  /**
   * Return first Section with inputs before current Section
   *
   * @returns {Section | undefined}
   */
  public get previousContentfulSection(): Section {
    const previousSections = this.sections.slice(0, this.currentSectionIndex).reverse();

    return previousSections.find((section) => !!section.inputs.length);
  }

  /**
   * Returns previous Section instance
   *
   * @returns {Section|null}
   */
  public get previousSection(): Section | null {
    const isFirstSection = this.currentSectionIndex === 0;

    if (isFirstSection) {
      return null;
    }

    return this._sections[this.currentSectionIndex - 1];
  }

  /**
   * Get array of Section instances
   *
   * @returns {Section[]} {@link Sections#array}
   */
  public get sections(): Section[] {
    return this._sections.array;
  }

  /**
   * Check if each Section is empty
   *
   * @returns {boolean}
   */
  public get isEditorEmpty(): boolean {
    return this.sections.every((section) => section.isEmpty);
  }

  /**
   * Index of current working section
   *
   * @type {number}
   */
  private _currentSectionIndex = -1;

  /**
   * Proxy for Sections instance {@link Sections}
   *
   * @type {Proxy}
   * @private
   */
  private _sections: Sections = null;

  /**
   * Should be called after Editor.UI preparation
   * Define this._sections property
   */
  public prepare(): void {
    const sections = new Sections(this.Editor.UI.nodes.redactor);

    /**
     * We need to use Proxy to overload set/get [] operator.
     * So we can use array-like syntax to access sections
     *
     * @example
     * this._sections[0] = new Section(...);
     *
     * section = this._sections[0];
     * @todo proxy the enumerate method
     * @type {Proxy}
     * @private
     */
    this._sections = new Proxy(sections, {
      set: Sections.set,
      get: Sections.get,
    });

    /** Copy event */
    this.listeners.on(
      document,
      'copy',
      (e: ClipboardEvent) => this.Editor.SectionEvents.handleCommandC(e)
    );
  }

  /**
   * Toggle read-only state
   *
   * If readOnly is true:
   *  - Unbind event handlers from created Sections
   *
   * if readOnly is false:
   *  - Bind event handlers to all existing Sections
   *
   * @param {boolean} readOnlyEnabled - "read only" state
   */
  public toggleReadOnly(readOnlyEnabled: boolean): void {
    if (!readOnlyEnabled) {
      this.enableModuleBindings();
    } else {
      this.disableModuleBindings();
    }
  }

  /**
   * Creates Section instance by tool name
   *
   * @param {object} options - section creation options
   * @param {string} options.tool - tools passed in editor config {@link EditorConfig#tools}
   * @param {string} [options.id] - unique id for this section
   * @param {SectionToolData} [options.data] - constructor params
   * @returns {Section}
   */
  public composeSection({
    tool: name,
    data = {},
    id = undefined,
    tunes: tunesData = {},
  }: {tool: string; id?: string; data?: SectionToolData; tunes?: {[name: string]: SectionTuneData}}): Section {
    const readOnly = this.Editor.ReadOnly.isEnabled;
    const tool = this.Editor.Tools.sectionTools.get(name);
    const section = new Section({
      id,
      data,
      tool,
      api: this.Editor.API,
      readOnly,
      tunesData,
    }, this.eventsDispatcher);

    if (!readOnly) {
      window.requestIdleCallback(() => {
        this.bindSectionEvents(section);
      }, { timeout: 2000 });
    }

    return section;
  }

  /**
   * Insert new section into _sections
   *
   * @param {object} options - insert options
   * @param {string} [options.id] - section's unique id
   * @param {string} [options.tool] - plugin name, by default method inserts the default section type
   * @param {object} [options.data] - plugin data
   * @param {number} [options.index] - index where to insert new Section
   * @param {boolean} [options.needToFocus] - flag shows if needed to update current Section index
   * @param {boolean} [options.replace] - flag shows if section by passed index should be replaced with inserted one
   * @returns {Section}
   */
  public insert({
    id = undefined,
    tool = this.config.defaultSection,
    data = {},
    index,
    needToFocus = true,
    replace = false,
    tunes = {},
  }: {
    id?: string;
    tool?: string;
    data?: SectionToolData;
    index?: number;
    needToFocus?: boolean;
    replace?: boolean;
    tunes?: {[name: string]: SectionTuneData};
  } = {}): Section {
    let newIndex = index;

    if (newIndex === undefined) {
      newIndex = this.currentSectionIndex + (replace ? 0 : 1);
    }

    const section = this.composeSection({
      id,
      tool,
      data,
      tunes,
    });

    /**
     * In case of section replacing (Converting OR from Toolbox or Shortcut on empty section OR on-paste to empty section)
     * we need to dispatch the 'section-removing' event for the replacing section
     */
    if (replace) {
      this.sectionDidMutated(SectionRemovedMutationType, this.getSectionByIndex(newIndex), {
        index: newIndex,
      });
    }

    this._sections.insert(newIndex, section, replace);

    /**
     * Force call of didMutated event on Section insertion
     */
    this.sectionDidMutated(SectionAddedMutationType, section, {
      index: newIndex,
    });

    if (needToFocus) {
      this.currentSectionIndex = newIndex;
    } else if (newIndex <= this.currentSectionIndex) {
      this.currentSectionIndex++;
    }

    return section;
  }

  /**
   * Inserts several sections at once
   *
   * @param sections - sections to insert
   * @param index - index where to insert
   */
  public insertMany(sections: Section[], index = 0): void {
    this._sections.insertMany(sections, index);
  }

  /**
   * Update Section data.
   *
   * Currently we don't have an 'update' method in the Tools API, so we just create a new section with the same id and type
   * Should not trigger 'section-removed' or 'section-added' events
   *
   * @param section - section to update
   * @param data - new data
   */
  public async update(section: Section, data: Partial<SectionToolData>): Promise<Section> {
    const existingData = await section.data;

    const newSection = this.composeSection({
      id: section.id,
      tool: section.name,
      data: Object.assign({}, existingData, data),
      tunes: section.tunes,
    });

    const sectionIndex = this.getSectionIndex(section);

    this._sections.replace(sectionIndex, newSection);

    this.sectionDidMutated(SectionChangedMutationType, newSection, {
      index: sectionIndex,
    });

    return newSection;
  }

  /**
   * Replace passed Section with the new one with specified Tool and data
   *
   * @param section - section to replace
   * @param newTool - new Tool name
   * @param data - new Tool data
   */
  public replace(section: Section, newTool: string, data: SectionToolData): Section {
    const sectionIndex = this.getSectionIndex(section);

    return this.insert({
      tool: newTool,
      data,
      index: sectionIndex,
      replace: true,
    });
  }

  /**
   * Insert pasted content. Call onPaste callback after insert.
   *
   * @param {string} toolName - name of Tool to insert
   * @param {PasteEvent} pasteEvent - pasted data
   * @param {boolean} replace - should replace current section
   */
  public paste(
    toolName: string,
    pasteEvent: PasteEvent,
    replace = false
  ): Section {
    const section = this.insert({
      tool: toolName,
      replace,
    });

    try {
      /**
       * We need to call onPaste after Section will be ready
       * because onPaste could change tool's root element, and we need to do that after section.watchSectionMutations() bound
       * to detect tool root element change
       *
       * @todo make this.insert() awaitable and remove requestIdleCallback
       */
      window.requestIdleCallback(() => {
        section.call(SectionToolAPI.ON_PASTE, pasteEvent);
      });
    } catch (e) {
      _.log(`${toolName}: onPaste callback call is failed`, 'error', e);
    }

    return section;
  }

  /**
   * Insert new default section at passed index
   *
   * @param {number} index - index where Section should be inserted
   * @param {boolean} needToFocus - if true, updates current Section index
   *
   * TODO: Remove method and use insert() with index instead (?)
   * @returns {Section} inserted Section
   */
  public insertDefaultSectionAtIndex(index: number, needToFocus = false): Section {
    const section = this.composeSection({ tool: this.config.defaultSection });

    this._sections[index] = section;

    /**
     * Force call of didMutated event on Section insertion
     */
    this.sectionDidMutated(SectionAddedMutationType, section, {
      index,
    });

    if (needToFocus) {
      this.currentSectionIndex = index;
    } else if (index <= this.currentSectionIndex) {
      this.currentSectionIndex++;
    }

    return section;
  }

  /**
   * Always inserts at the end
   *
   * @returns {Section}
   */
  public insertAtEnd(): Section {
    /**
     * Define new value for current section index
     */
    this.currentSectionIndex = this.sections.length - 1;

    /**
     * Insert the default typed section
     */
    return this.insert();
  }

  /**
   * Merge two sections
   *
   * @param {Section} targetSection - previous section will be append to this section
   * @param {Section} sectionToMerge - section that will be merged with target section
   * @returns {Promise} - the sequence that can be continued
   */
  public async mergeSections(targetSection: Section, sectionToMerge: Section): Promise<void> {
    let sectionToMergeData: SectionToolData | undefined;

    /**
     * We can merge:
     * 1) Sections with the same Tool if tool provides merge method
     */
    if (targetSection.name === sectionToMerge.name && targetSection.mergeable) {
      const sectionToMergeDataRaw = await sectionToMerge.data;

      if (_.isEmpty(sectionToMergeDataRaw)) {
        console.error('Could not merge Section. Failed to extract original Section data.');

        return;
      }

      const [ cleanData ] = sanitizeSections([ sectionToMergeDataRaw ], targetSection.tool.sanitizeConfig);

      sectionToMergeData = cleanData;

    /**
     * 2) Sections with different Tools if they provides conversionConfig
     */
    } else if (targetSection.mergeable && isSectionConvertable(sectionToMerge, 'export') && isSectionConvertable(targetSection, 'import')) {
      const sectionToMergeDataStringified = await sectionToMerge.exportDataAsString();
      const cleanData = clean(sectionToMergeDataStringified, targetSection.tool.sanitizeConfig);

      sectionToMergeData = convertStringToSectionData(cleanData, targetSection.tool.conversionConfig);
    }

    if (sectionToMergeData === undefined) {
      return;
    }

    await targetSection.mergeWith(sectionToMergeData);
    this.removeSection(sectionToMerge);
    this.currentSectionIndex = this._sections.indexOf(targetSection);
  }

  /**
   * Remove passed Section
   *
   * @param section - Section to remove
   * @param addLastSection - if true, adds new default section at the end. @todo remove this logic and use event-bus instead
   */
  public removeSection(section: Section, addLastSection = true): Promise<void> {
    return new Promise((resolve) => {
      const index = this._sections.indexOf(section);

      /**
       * If index is not passed and there is no section selected, show a warning
       */
      if (!this.validateIndex(index)) {
        throw new Error('Can\'t find a Section to remove');
      }

      section.destroy();
      this._sections.remove(index);

      /**
       * Force call of didMutated event on Section removal
       */
      this.sectionDidMutated(SectionRemovedMutationType, section, {
        index,
      });

      if (this.currentSectionIndex >= index) {
        this.currentSectionIndex--;
      }

      /**
       * If first Section was removed, insert new Initial Section and set focus on it`s first input
       */
      if (!this.sections.length) {
        this.currentSectionIndex = -1;

        if (addLastSection) {
          this.insert();
        }
      } else if (index === 0) {
        this.currentSectionIndex = 0;
      }

      resolve();
    });
  }

  /**
   * Remove only selected Sections
   * and returns first Section index where started removing...
   *
   * @returns {number|undefined}
   */
  public removeSelectedSections(): number | undefined {
    let firstSelectedSectionIndex;

    /**
     * Remove selected Sections from the end
     */
    for (let index = this.sections.length - 1; index >= 0; index--) {
      if (!this.sections[index].selected) {
        continue;
      }

      this.removeSection(this.sections[index]);
      firstSelectedSectionIndex = index;
    }

    return firstSelectedSectionIndex;
  }

  /**
   * Attention!
   * After removing insert the new default typed Section and focus on it
   * Removes all sections
   */
  public removeAllSections(): void {
    for (let index = this.sections.length - 1; index >= 0; index--) {
      this._sections.remove(index);
    }

    this.currentSectionIndex = -1;
    this.insert();
    this.currentSection.firstInput.focus();
  }

  /**
   * Split current Section
   * 1. Extract content from Caret position to the Section`s end
   * 2. Insert a new Section below current one with extracted content
   *
   * @returns {Section}
   */
  public split(): Section {
    const extractedFragment = this.Editor.Caret.extractFragmentFromCaretPosition();
    const wrapper = $.make('div');

    wrapper.appendChild(extractedFragment as DocumentFragment);

    /**
     * @todo make object in accordance with Tool
     */
    const data = {
      text: $.isEmpty(wrapper) ? '' : wrapper.innerHTML,
    };

    /**
     * Renew current Section
     *
     * @type {Section}
     */
    return this.insert({ data });
  }

  /**
   * Returns Section by passed index
   *
   * If we pass -1 as index, the last section will be returned
   * There shouldn't be a case when there is no sections at all — at least one always should exist
   */
  public getSectionByIndex(index: -1): Section;

  /**
   * Returns Section by passed index.
   *
   * Could return undefined if there is no section with such index
   */
  public getSectionByIndex(index: number): Section | undefined;

  /**
   * Returns Section by passed index
   *
   * @param {number} index - index to get. -1 to get last
   * @returns {Section}
   */
  public getSectionByIndex(index: number): Section | undefined {
    if (index === -1) {
      index = this._sections.length - 1;
    }

    return this._sections[index];
  }

  /**
   * Returns an index for passed Section
   *
   * @param section - section to find index
   */
  public getSectionIndex(section: Section): number {
    return this._sections.indexOf(section);
  }

  /**
   * Returns the Section by passed id
   *
   * @param id - id of section to get
   * @returns {Section}
   */
  public getSectionById(id): Section | undefined {
    return this._sections.array.find(section => section.id === id);
  }

  /**
   * Get Section instance by html element
   *
   * @param {Node} element - html element to get Section by
   */
  public getSection(element: HTMLElement): Section {
    if (!$.isElement(element) as boolean) {
      element = element.parentNode as HTMLElement;
    }

    const nodes = this._sections.nodes,
        firstLevelSection = element.closest(`.${Section.CSS.wrapper}`),
        index = nodes.indexOf(firstLevelSection as HTMLElement);

    if (index >= 0) {
      return this._sections[index];
    }
  }

  /**
   * 1) Find first-level Section from passed child Node
   * 2) Mark it as current
   *
   * @param {Node} childNode - look ahead from this node.
   * @returns {Section | undefined} can return undefined in case when the passed child note is not a part of the current editor instance
   */
  public setCurrentSectionByChildNode(childNode: Node): Section | undefined {
    /**
     * If node is Text TextNode
     */
    if (!$.isElement(childNode)) {
      childNode = childNode.parentNode;
    }

    const parentFirstLevelSection = (childNode as HTMLElement).closest(`.${Section.CSS.wrapper}`);

    if (!parentFirstLevelSection) {
      return;
    }

    /**
     * Support multiple Editor.js instances,
     * by checking whether the found section belongs to the current instance
     *
     * @see {@link Ui#documentTouched}
     */
    const editorWrapper = parentFirstLevelSection.closest(`.${this.Editor.UI.CSS.editorWrapper}`);
    const isSectionBelongsToCurrentInstance = editorWrapper?.isEqualNode(this.Editor.UI.nodes.wrapper);

    if (!isSectionBelongsToCurrentInstance) {
      return;
    }

    /**
     * Update current Section's index
     *
     * @type {number}
     */
    this.currentSectionIndex = this._sections.nodes.indexOf(parentFirstLevelSection as HTMLElement);

    /**
     * Update current section active input
     */
    this.currentSection.updateCurrentInput();

    return this.currentSection;
  }

  /**
   * Return section which contents passed node
   *
   * @param {Node} childNode - node to get Section by
   * @returns {Section}
   */
  public getSectionByChildNode(childNode: Node): Section | undefined {
    if (!childNode || childNode instanceof Node === false) {
      return undefined;
    }

    /**
     * If node is Text TextNode
     */
    if (!$.isElement(childNode)) {
      childNode = childNode.parentNode;
    }

    const firstLevelSection = (childNode as HTMLElement).closest(`.${Section.CSS.wrapper}`);

    return this.sections.find((section) => section.holder === firstLevelSection);
  }

  /**
   * Swap Sections Position
   *
   * @param {number} fromIndex - index of first section
   * @param {number} toIndex - index of second section
   * @deprecated — use 'move' instead
   */
  public swap(fromIndex, toIndex): void {
    /** Move up current Section */
    this._sections.swap(fromIndex, toIndex);

    /** Now actual section moved up so that current section index decreased */
    this.currentSectionIndex = toIndex;
  }

  /**
   * Move a section to a new index
   *
   * @param {number} toIndex - index where to move Section
   * @param {number} fromIndex - index of Section to move
   */
  public move(toIndex, fromIndex = this.currentSectionIndex): void {
    // make sure indexes are valid and within a valid range
    if (isNaN(toIndex) || isNaN(fromIndex)) {
      _.log(`Warning during 'move' call: incorrect indices provided.`, 'warn');

      return;
    }

    if (!this.validateIndex(toIndex) || !this.validateIndex(fromIndex)) {
      _.log(`Warning during 'move' call: indices cannot be lower than 0 or greater than the amount of sections.`, 'warn');

      return;
    }

    /** Move up current Section */
    this._sections.move(toIndex, fromIndex);

    /** Now actual section moved so that current section index changed */
    this.currentSectionIndex = toIndex;

    /**
     * Force call of didMutated event on Section movement
     */
    this.sectionDidMutated(SectionMovedMutationType, this.currentSection, {
      fromIndex,
      toIndex,
    });
  }

  /**
   * Converts passed Section to the new Tool
   * Uses Conversion Config
   *
   * @param sectionToConvert - Section that should be converted
   * @param targetToolName - name of the Tool to convert to
   * @param sectionDataOverrides - optional new Section data overrides
   */
  public async convert(sectionToConvert: Section, targetToolName: string, sectionDataOverrides?: SectionToolData): Promise<Section> {
    /**
     * At first, we get current Section data
     */
    const savedSection = await sectionToConvert.save();

    if (!savedSection) {
      throw new Error('Could not convert Section. Failed to extract original Section data.');
    }

    /**
     * Getting a class of the replacing Tool
     */
    const replacingTool = this.Editor.Tools.sectionTools.get(targetToolName);

    if (!replacingTool) {
      throw new Error(`Could not convert Section. Tool «${targetToolName}» not found.`);
    }

    /**
     * Using Conversion Config "export" we get a stringified version of the Section data
     */
    const exportedData = await sectionToConvert.exportDataAsString();

    /**
     * Clean exported data with replacing sanitizer config
     */
    const cleanData: string = clean(
      exportedData,
      replacingTool.sanitizeConfig
    );

    /**
     * Now using Conversion Config "import" we compose a new Section data
     */
    let newSectionData = convertStringToSectionData(cleanData, replacingTool.conversionConfig);

    /**
     * Optional data overrides.
     * Used for example, by the Multiple Toolbox Items feature, where a single Tool provides several Toolbox items with "data" overrides
     */
    if (sectionDataOverrides) {
      newSectionData = Object.assign(newSectionData, sectionDataOverrides);
    }

    return this.replace(sectionToConvert, replacingTool.name, newSectionData);
  }

  /**
   * Sets current Section Index -1 which means unknown
   * and clear highlights
   */
  public dropPointer(): void {
    this.currentSectionIndex = -1;
  }

  /**
   * Clears Editor
   *
   * @param {boolean} needToAddDefaultSection - 1) in internal calls (for example, in api.sections.render)
   *                                             we don't need to add an empty default section
   *                                        2) in api.sections.clear we should add empty section
   */
  public async clear(needToAddDefaultSection = false): Promise<void> {
    const queue = new PromiseQueue();

    this.sections.forEach((section) => {
      queue.add(async () => {
        await this.removeSection(section, false);
      });
    });

    await queue.completed;

    this.dropPointer();

    if (needToAddDefaultSection) {
      this.insert();
    }

    /**
     * Add empty modifier
     */
    this.Editor.UI.checkEmptiness();
  }

  /**
   * Cleans up all the section tools' resources
   * This is called when editor is destroyed
   */
  public async destroy(): Promise<void> {
    await Promise.all(this.sections.map((section) => {
      return section.destroy();
    }));
  }

  /**
   * Bind Section events
   *
   * @param {Section} section - Section to which event should be bound
   */
  private bindSectionEvents(section: Section): void {
    const { SectionEvents } = this.Editor;

    this.readOnlyMutableListeners.on(section.holder, 'keydown', (event: KeyboardEvent) => {
      SectionEvents.keydown(event);
    });

    this.readOnlyMutableListeners.on(section.holder, 'keyup', (event: KeyboardEvent) => {
      SectionEvents.keyup(event);
    });

    this.readOnlyMutableListeners.on(section.holder, 'dragover', (event: DragEvent) => {
      SectionEvents.dragOver(event);
    });

    this.readOnlyMutableListeners.on(section.holder, 'dragleave', (event: DragEvent) => {
      SectionEvents.dragLeave(event);
    });

    section.on('didMutated', (affectedSection: Section) => {
      return this.sectionDidMutated(SectionChangedMutationType, affectedSection, {
        index: this.getSectionIndex(affectedSection),
      });
    });
  }

  /**
   * Disable mutable handlers and bindings
   */
  private disableModuleBindings(): void {
    this.readOnlyMutableListeners.clearAll();
  }

  /**
   * Enables all module handlers and bindings for all Sections
   */
  private enableModuleBindings(): void {
    /** Cut event */
    this.readOnlyMutableListeners.on(
      document,
      'cut',
      (e: ClipboardEvent) => this.Editor.SectionEvents.handleCommandX(e)
    );

    this.sections.forEach((section: Section) => {
      this.bindSectionEvents(section);
    });
  }

  /**
   * Validates that the given index is not lower than 0 or higher than the amount of sections
   *
   * @param {number} index - index of sections array to validate
   * @returns {boolean}
   */
  private validateIndex(index: number): boolean {
    return !(index < 0 || index >= this._sections.length);
  }

  /**
   * Section mutation callback
   *
   * @param mutationType - what happened with section
   * @param section - mutated section
   * @param detailData - additional data to pass with change event
   */
  private sectionDidMutated<Type extends SectionMutationType>(mutationType: Type, section: Section, detailData: SectionMutationEventDetailWithoutTarget<Type>): Section {
    const event = new CustomEvent(mutationType, {
      detail: {
        target: new SectionAPI(section),
        ...detailData as SectionMutationEventDetailWithoutTarget<Type>,
      },
    });

    this.eventsDispatcher.emit(SectionChanged, {
      event: event as SectionMutationEventMap[Type],
    });

    return section;
  }
}

/**
 * Type alias for Section Mutation event without 'target' field, used in 'sectionDidMutated' method
 */
type SectionMutationEventDetailWithoutTarget<Type extends SectionMutationType> = Omit<SectionMutationEventMap[Type]['detail'], 'target'>;
