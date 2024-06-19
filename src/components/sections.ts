import * as _ from './utils';
import $ from './dom';
import Section, { SectionToolAPI } from './section';
import { MoveEvent } from '../../types/tools';

/**
 * @class Sections
 * @classdesc Class to work with Section instances array
 * @private
 * @property {HTMLElement} workingArea — editor`s working node
 */
export default class Sections {
  /**
   * Array of Section instances in order of addition
   */
  public sections: Section[];

  /**
   * Editor`s area where to add Section`s HTML
   */
  public workingArea: HTMLElement;

  /**
   * @class
   * @param {HTMLElement} workingArea — editor`s working node
   */
  constructor(workingArea: HTMLElement) {
    this.sections = [];
    this.workingArea = workingArea;
  }

  /**
   * Get length of Section instances array
   *
   * @returns {number}
   */
  public get length(): number {
    return this.sections.length;
  }

  /**
   * Get Section instances array
   *
   * @returns {Section[]}
   */
  public get array(): Section[] {
    return this.sections;
  }

  /**
   * Get sections html elements array
   *
   * @returns {HTMLElement[]}
   */
  public get nodes(): HTMLElement[] {
    return _.array(this.workingArea.children);
  }

  /**
   * Proxy trap to implement array-like setter
   *
   * @example
   * sections[0] = new Section(...)
   * @param {Sections} instance — Sections instance
   * @param {PropertyKey} property — section index or any Sections class property key to set
   * @param {Section} value — value to set
   * @returns {boolean}
   */
  public static set(instance: Sections, property: PropertyKey, value: Section | unknown): boolean {
    /**
     * If property name is not a number (method or other property, access it via reflect
     */
    if (isNaN(Number(property))) {
      Reflect.set(instance, property, value);

      return true;
    }

    /**
     * If property is number, call insert method to emulate array behaviour
     *
     * @example
     * sections[0] = new Section();
     */
    instance.insert(+(property as number), value as Section);

    return true;
  }

  /**
   * Proxy trap to implement array-like getter
   *
   * @param {Sections} instance — Sections instance
   * @param {PropertyKey} property — Sections class property key
   * @returns {Section|*}
   */
  public static get(instance: Sections, property: PropertyKey): Section | unknown {
    /**
     * If property is not a number, get it via Reflect object
     */
    if (isNaN(Number(property))) {
      return Reflect.get(instance, property);
    }

    /**
     * If property is a number (Section index) return Section by passed index
     */
    return instance.get(+(property as number));
  }

  /**
   * Push new Section to the sections array and append it to working area
   *
   * @param {Section} section - Section to add
   */
  public push(section: Section): void {
    this.sections.push(section);
    this.insertToDOM(section);
  }

  /**
   * Swaps sections with indexes first and second
   *
   * @param {number} first - first section index
   * @param {number} second - second section index
   * @deprecated — use 'move' instead
   */
  public swap(first: number, second: number): void {
    const secondSection = this.sections[second];

    /**
     * Change in DOM
     */
    $.swap(this.sections[first].holder, secondSection.holder);

    /**
     * Change in array
     */
    this.sections[second] = this.sections[first];
    this.sections[first] = secondSection;
  }

  /**
   * Move a section from one to another index
   *
   * @param {number} toIndex - new index of the section
   * @param {number} fromIndex - section to move
   */
  public move(toIndex: number, fromIndex: number): void {
    /**
     * cut out the section, move the DOM element and insert at the desired index
     * again (the shifting within the sections array will happen automatically).
     *
     * @see https://stackoverflow.com/a/44932690/1238150
     */
    const section = this.sections.splice(fromIndex, 1)[0];

    // manipulate DOM
    const prevIndex = toIndex - 1;
    const previousSectionIndex = Math.max(0, prevIndex);
    const previousSection = this.sections[previousSectionIndex];

    if (toIndex > 0) {
      this.insertToDOM(section, 'afterend', previousSection);
    } else {
      this.insertToDOM(section, 'beforebegin', previousSection);
    }

    // move in array
    this.sections.splice(toIndex, 0, section);

    // invoke hook
    const event: MoveEvent = this.composeSectionEvent('move', {
      fromIndex,
      toIndex,
    });

    section.call(SectionToolAPI.MOVED, event);
  }

  /**
   * Insert new Section at passed index
   *
   * @param {number} index — index to insert Section
   * @param {Section} section — Section to insert
   * @param {boolean} replace — it true, replace section on given index
   */
  public insert(index: number, section: Section, replace = false): void {
    if (!this.length) {
      this.push(section);

      return;
    }

    if (index > this.length) {
      index = this.length;
    }

    if (replace) {
      this.sections[index].holder.remove();
      this.sections[index].call(SectionToolAPI.REMOVED);
    }

    const deleteCount = replace ? 1 : 0;

    this.sections.splice(index, deleteCount, section);

    if (index > 0) {
      const previousSection = this.sections[index - 1];

      this.insertToDOM(section, 'afterend', previousSection);
    } else {
      const nextSection = this.sections[index + 1];

      if (nextSection) {
        this.insertToDOM(section, 'beforebegin', nextSection);
      } else {
        this.insertToDOM(section);
      }
    }
  }

  /**
   * Replaces section under passed index with passed section
   *
   * @param index - index of existed section
   * @param section - new section
   */
  public replace(index: number, section: Section): void {
    if (this.sections[index] === undefined) {
      throw Error('Incorrect index');
    }

    const prevSection = this.sections[index];

    prevSection.holder.replaceWith(section.holder);

    this.sections[index] = section;
  }

  /**
   * Inserts several sections at once
   *
   * @param sections - sections to insert
   * @param index - index to insert sections at
   */
  public insertMany(sections: Section[], index: number ): void {
    const fragment = new DocumentFragment();

    for (const section of sections) {
      fragment.appendChild(section.holder);
    }

    if (this.length > 0) {
      if (index > 0) {
        const previousSectionIndex = Math.min(index - 1, this.length - 1);
        const previousSection = this.sections[previousSectionIndex];

        previousSection.holder.after(fragment);
      } else if (index === 0) {
        this.workingArea.prepend(fragment);
      }

      /**
       * Insert sections to the array at the specified index
       */
      this.sections.splice(index, 0, ...sections);
    } else {
      this.sections.push(...sections);
      this.workingArea.appendChild(fragment);
    }

    /**
     * Call Rendered event for each section
     */
    sections.forEach((section) => section.call(SectionToolAPI.RENDERED));
  }

  /**
   * Remove section
   *
   * @param {number} index - index of Section to remove
   */
  public remove(index: number): void {
    if (isNaN(index)) {
      index = this.length - 1;
    }

    this.sections[index].holder.remove();

    this.sections[index].call(SectionToolAPI.REMOVED);

    this.sections.splice(index, 1);
  }

  /**
   * Remove all sections
   */
  public removeAll(): void {
    this.workingArea.innerHTML = '';

    this.sections.forEach((section) => section.call(SectionToolAPI.REMOVED));

    this.sections.length = 0;
  }

  /**
   * Insert Section after passed target
   *
   * @todo decide if this method is necessary
   * @param {Section} targetSection — target after which Section should be inserted
   * @param {Section} newSection — Section to insert
   */
  public insertAfter(targetSection: Section, newSection: Section): void {
    const index = this.sections.indexOf(targetSection);

    this.insert(index + 1, newSection);
  }

  /**
   * Get Section by index
   *
   * @param {number} index — Section index
   * @returns {Section}
   */
  public get(index: number): Section | undefined {
    return this.sections[index];
  }

  /**
   * Return index of passed Section
   *
   * @param {Section} section - Section to find
   * @returns {number}
   */
  public indexOf(section: Section): number {
    return this.sections.indexOf(section);
  }

  /**
   * Insert new Section into DOM
   *
   * @param {Section} section - Section to insert
   * @param {InsertPosition} position — insert position (if set, will use insertAdjacentElement)
   * @param {Section} target — Section related to position
   */
  private insertToDOM(section: Section, position?: InsertPosition, target?: Section): void {
    if (position) {
      target.holder.insertAdjacentElement(position, section.holder);
    } else {
      this.workingArea.appendChild(section.holder);
    }

    section.call(SectionToolAPI.RENDERED);
  }

  /**
   * Composes Section event with passed type and details
   *
   * @param {string} type - event type
   * @param {object} detail - event detail
   */
  private composeSectionEvent(type: string, detail: object): MoveEvent {
    return new CustomEvent(type, {
      detail,
    }) as MoveEvent;
  }
}
