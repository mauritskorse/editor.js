import {SectionToolData} from '../tools';
import { SectionId } from './section-id';

/**
 * Tool's saved data
 */
export interface SavedData {
  id: SectionId;
  tool: string;
  data: SectionToolData;
  time: number;
}

/**
 * Tool's data after validation
 */
export interface ValidatedData {
  id?: SectionId;
  tool?: string;
  data?: SectionToolData;
  time?: number;
  isValid: boolean;
}
