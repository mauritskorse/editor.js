import { ConversionConfig, PasteConfig, SanitizerConfig } from '../configs';
import { SectionToolData } from './section-tool-data';
import { BaseTool, BaseToolConstructable } from './tool';
import { ToolConfig } from './tool-config';
import { API, SectionAPI, ToolboxConfig } from '../index';
import { PasteEvent } from './paste-events';
import { MoveEvent } from './hook-events';
import { TunesMenuConfig } from './tool-settings';

/**
 * Describe Section Tool object
 * @see {@link docs/tools.md}
 */
export interface SectionTool extends BaseTool {
  /**
   * Sanitizer rules description
   */
  sanitize?: SanitizerConfig;

  /**
   * Process Tool's element in DOM and return raw data
   * @param {HTMLElement} section - element created by {@link SectionTool#render} function
   * @return {SectionToolData}
   */
  save(section: HTMLElement): SectionToolData;

  /**
   * Create Section's settings section
   */
  renderSettings?(): HTMLElement | TunesMenuConfig;

  /**
   * Validate Section's data
   * @param {SectionToolData} sectionData
   * @return {boolean}
   */
  validate?(sectionData: SectionToolData): boolean;

  /**
   * Method that specified how to merge two Sections with same type.
   * Called by backspace at the beginning of the Section
   * @param {SectionToolData} sectionData
   */
  merge?(sectionData: SectionToolData): void;

  /**
   * On paste callback. Fired when pasted content can be substituted by a Tool
   * @param {PasteEvent} event
   */
  onPaste?(event: PasteEvent): void;

  /**
   * Cleanup resources used by your tool here
   * Called when the editor is destroyed
   */
  destroy?(): void;

  /**
   * Lifecycle hooks
   */

  /**
   * Called after section content added to the page
   */
  rendered?(): void;

  /**
   * Called each time section content is updated
   */
  updated?(): void;

  /**
   * Called after section removed from the page but before instance is deleted
   */
  removed?(): void;

  /**
   * Called after section was moved
   */
  moved?(event: MoveEvent): void;
}

/**
 * Describe constructor parameters
 */
export interface SectionToolConstructorOptions<D extends object = any, C extends object = any> {
  api: API;
  data: SectionToolData<D>;
  config?: ToolConfig<C>;
  section?: SectionAPI;
  readOnly: boolean;
}

export interface SectionToolConstructable extends BaseToolConstructable {
  /**
   * Tool's Toolbox settings
   */
  toolbox?: ToolboxConfig;

  /**
   * Paste substitutions configuration
   */
  pasteConfig?: PasteConfig | false;

  /**
   * Rules that specified how this Tool can be converted into/from another Tool
   */
  conversionConfig?: ConversionConfig;

  /**
   * Is Tool supports read-only mode, this property should return true
   */
  isReadOnlySupported?: boolean;

  /**
   * @constructor
   *
   * @param {SectionToolConstructorOptions} config - constructor parameters
   *
   * @return {SectionTool}
   */
  new(config: SectionToolConstructorOptions): SectionTool;
}
