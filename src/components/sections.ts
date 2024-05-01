/** 
 * Adding sections in which blocks can be grouped
 * A block does not need to be within a section, but it can be
 * This allows for more complex structures (e.g. flex layout, columns, grids, tabs, accordions, etc.)
 */

import * as _ from './utils';
import $ from './dom';
import Section, { SectionToolAPI } from './section';

/**
 * @class Sections
 * @classdesc Class to work with Sections instances array
 * @private
 * @property {HTMLElement} workingArea — editor`s working node
 */
export default class Sections {
  /**
   * Array of Block instances in order of addition
   */
  public sections: Section[];

  /**
   * Editor`s area where to add Block`s HTML
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

}