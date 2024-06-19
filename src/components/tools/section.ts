import BaseTool, { InternalSectionToolSettings, ToolType, UserSettings } from './base';
import {
  SectionAPI,
  SectionTool as ISectionTool,
  SectionToolConstructable,
  SectionToolData,
  ConversionConfig,
  PasteConfig, SanitizerConfig, ToolboxConfig,
  ToolboxConfigEntry
} from '../../../types';
import * as _ from '../utils';
import InlineTool from './inline';
import SectionTune from './tune';
import ToolsCollection from './collection';

/**
 * Class to work with Section tools constructables
 */
export default class SectionTool extends BaseTool<ISectionTool> {
  /**
   * Tool type — Section
   */
  public type = ToolType.Section;

  /**
   * InlineTool collection for current Section Tool
   */
  public inlineTools: ToolsCollection<InlineTool> = new ToolsCollection<InlineTool>();

  /**
   * SectionTune collection for current Section Tool
   */
  public tunes: ToolsCollection<SectionTune> = new ToolsCollection<SectionTune>();

  /**
   * Tool's constructable blueprint
   */
  protected constructable: SectionToolConstructable;

  /**
   * Creates new Tool instance
   *
   * @param data - Tool data
   * @param section - SectionAPI for current Section
   * @param readOnly - True if Editor is in read-only mode
   */
  public create(data: SectionToolData, section: SectionAPI, readOnly: boolean): ISectionTool {
    // eslint-disable-next-line new-cap
    return new this.constructable({
      data,
      section,
      readOnly,
      api: this.api.getMethodsForTool(this),
      config: this.settings,
    }) as ISectionTool;
  }

  /**
   * Returns true if read-only mode is supported by Tool
   */
  public get isReadOnlySupported(): boolean {
    return this.constructable[InternalSectionToolSettings.IsReadOnlySupported] === true;
  }

  /**
   * Returns true if Tool supports linebreaks
   *
   * @deprecated Sections cannot have line breaks
   */
  public get isLineBreaksEnabled(): boolean {
    return this.constructable[InternalSectionToolSettings.IsEnabledLineBreaks];
  }

  /**
   * Returns Tool toolbox configuration (internal or user-specified).
   *
   * Merges internal and user-defined toolbox configs based on the following rules:
   *
   * - If both internal and user-defined toolbox configs are arrays their items are merged.
   * Length of the second one is kept.
   *
   * - If both are objects their properties are merged.
   *
   * - If one is an object and another is an array than internal config is replaced with user-defined
   * config. This is made to allow user to override default tool's toolbox representation (single/multiple entries)
   */
  public get toolbox(): ToolboxConfigEntry[] | undefined {
    const toolToolboxSettings = this.constructable[InternalSectionToolSettings.Toolbox] as ToolboxConfig;
    const userToolboxSettings = this.config[UserSettings.Toolbox];

    if (_.isEmpty(toolToolboxSettings)) {
      return;
    }
    if (userToolboxSettings === false) {
      return;
    }
    /**
     * Return tool's toolbox settings if user settings are not defined
     */
    if (!userToolboxSettings) {
      return Array.isArray(toolToolboxSettings) ? toolToolboxSettings : [ toolToolboxSettings ];
    }

    /**
     * Otherwise merge user settings with tool's settings
     */
    if (Array.isArray(toolToolboxSettings)) {
      if (Array.isArray(userToolboxSettings)) {
        return userToolboxSettings.map((item, i) => {
          const toolToolboxEntry = toolToolboxSettings[i];

          if (toolToolboxEntry) {
            return {
              ...toolToolboxEntry,
              ...item,
            };
          }

          return item;
        });
      }

      return [ userToolboxSettings ];
    } else {
      if (Array.isArray(userToolboxSettings)) {
        return userToolboxSettings;
      }

      return [
        {
          ...toolToolboxSettings,
          ...userToolboxSettings,
        },
      ];
    }
  }

  /**
   * Returns Tool conversion configuration
   */
  public get conversionConfig(): ConversionConfig | undefined {
    return this.constructable[InternalSectionToolSettings.ConversionConfig];
  }

  /**
   * Returns enabled inline tools for Tool
   */
  public get enabledInlineTools(): boolean | string[] {
    return this.config[UserSettings.EnabledInlineTools] || false;
  }

  /**
   * Returns enabled tunes for Tool
   */
  public get enabledSectionTunes(): boolean | string[] {
    return this.config[UserSettings.EnabledSectionTunes];
  }

  /**
   * Returns Tool paste configuration
   *
   * @deprecated there is not pasting for Sections
   */
  public get pasteConfig(): PasteConfig {
    return this.constructable[InternalSectionToolSettings.PasteConfig] ?? {};
  }

  /**
   * Returns sanitize configuration for Section Tool including configs from related Inline Tools and Section Tunes
   */
  @_.cacheable
  public get sanitizeConfig(): SanitizerConfig {
    const toolRules = super.sanitizeConfig;
    const baseConfig = this.baseSanitizeConfig;

    if (_.isEmpty(toolRules)) {
      return baseConfig;
    }

    const toolConfig = {} as SanitizerConfig;

    for (const fieldName in toolRules) {
      if (Object.prototype.hasOwnProperty.call(toolRules, fieldName)) {
        const rule = toolRules[fieldName];

        /**
         * If rule is object, merge it with Inline Tools configuration
         *
         * Otherwise pass as it is
         */
        if (_.isObject(rule)) {
          toolConfig[fieldName] = Object.assign({}, baseConfig, rule);
        } else {
          toolConfig[fieldName] = rule;
        }
      }
    }

    return toolConfig;
  }

  /**
   * Returns sanitizer configuration composed from sanitize config of Inline Tools enabled for Tool
   */
  @_.cacheable
  public get baseSanitizeConfig(): SanitizerConfig {
    const baseConfig = {};

    Array
      .from(this.inlineTools.values())
      .forEach(tool => Object.assign(baseConfig, tool.sanitizeConfig));

    Array
      .from(this.tunes.values())
      .forEach(tune => Object.assign(baseConfig, tune.sanitizeConfig));

    return baseConfig;
  }
}
