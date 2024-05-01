import { SavedData } from '../../../types/data-formats';
import $ from '../dom';
import * as _ from '../utils';
import ApiModules from '../modules/api';
import BlockAPI from './api';
import SelectionUtils from '../selection';
import BlockTool from '../tools/block';

import EventsDispatcher from '../utils/events';

/**
 * @class Section
 * @classdesc This class describes editor`s section, including the blocks that are in it, section data and section tools
 * @property {SectionTool} tool — current section tool (Group, Column, Accordion, etc.)
 * @property {object} CSS — block`s css classes
 */

/**
 * Available Block Tool API methods
 */
export enum SectionToolAPI {

}

/**
 * Names of events used in Block
 */
interface SectionEvents {
    'didMutated': Section,
}

/**
 * @classdesc Abstract Block class that contains Block information, Tool name and Tool class instance
 * @property {BlockTool} tool - Tool instance
 * @property {HTMLElement} holder - Div element that wraps block content with Tool's content. Has `ce-block` CSS class
 * @property {HTMLElement} pluginsContent - HTML content that returns by Tool's render function
 */
export default class Section extends EventsDispatcher<SectionEvents> {

}