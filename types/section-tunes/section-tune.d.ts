import {API, SectionAPI, SanitizerConfig, ToolConfig} from '../index';
import { SectionTuneData } from './section-tune-data';
import { TunesMenuConfig } from '../tools';

/**
 * Describes SectionTune blueprint
 */
export interface SectionTune {
  /**
   * Returns section tune HTMLElement
   */
  render(): HTMLElement | TunesMenuConfig;

  /**
   * Method called on Tool render. Pass Tool content as an argument.
   *
   * You can wrap Tool's content with any wrapper you want to provide Tune's UI
   *
   * @param {HTMLElement} pluginsContent — Tool's content wrapper
   *
   * @return {HTMLElement}
   */
  wrap?(pluginsContent: HTMLElement): HTMLElement;

  /**
   * Called on Tool's saving. Should return any data Tune needs to save
   *
   * @return {SectionTuneData}
   */
  save?(): SectionTuneData;
}

/**
 * Describes SectionTune class constructor function
 */
export interface SectionTuneConstructable {

  /**
   * Flag show Tool is Section Tune
   */
  isTune: boolean;

  /**
   * Tune's sanitize configuration
   */
  sanitize?: SanitizerConfig;

  /**
   * @constructor
   *
   * @param config - Section Tune config
   */
  new(config: {
    api: API,
    config?: ToolConfig,
    section: SectionAPI,
    data: SectionTuneData,
  }): SectionTune;

  /**
   * Tune`s prepare method. Can be async
   * @param data
   */
  prepare?(): Promise<void> | void;

  /**
   * Tune`s reset method to clean up anything set by prepare. Can be async
   */
  reset?(): void | Promise<void>;
}
