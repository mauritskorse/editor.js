import { BlockToolData, SectionToolData } from '../tools';
import { BlockTuneData } from '../block-tunes/block-tune-data';
import { SectionTuneData } from '../section-tunes/section-tune-data';
import { BlockId } from './block-id';
import { SectionId } from './section-id';

/**
 * Output of one Block Tool
 *
 * @template Type - the string literal describing a tool type
 * @template Data - the structure describing a data object supported by the tool
 */
export interface OutputBlockData<Type extends string = string, Data extends object = any> {
  /**
   * Unique Id of the block
   */
  id?: BlockId;
  /**
   * Tool type
   */
  type: Type;
  /**
   * Saved Block data
   */
  data: BlockToolData<Data>;

  /**
   * Block Tunes data
   */
  tunes?: {[name: string]: BlockTuneData};
}

/**
 * Output of one Section Tool
 *
 * @template Type - the string literal describing a tool type
 * @template Data - the structure describing a data object supported by the tool
 */
export interface OutputSectionData<Type extends string = string, Data extends object = any> {
  /**
   * Unique Id of the block
   */
  id?: SectionId;
  /**
   * Tool type
   */
  type: Type;
  /**
   * Saved Section data
   */
  data: SectionToolData<Data>;

  /**
   * Section Tunes data
   */
  tunes?: {[name: string]: SectionTuneData};
}


export interface OutputData {
  /**
   * Editor's version
   */
  version?: string;

  /**
   * Timestamp of saving in milliseconds
   */
  time?: number;

  /**
   * Saved Blocks
   */
  blocks: OutputBlockData[];
}
