import type { ConversionConfig } from '../../../types/configs/conversion-config';
import type { SectionToolData } from '../../../types/tools/section-tool-data';
import type Section from '../section';
import { isFunction, isString, log, equals } from '../utils';


/**
 * Check if section has valid conversion config for export or import.
 *
 * @param section - section to check
 * @param direction - export for section to merge from, import for section to merge to
 */
export function isSectionConvertable(section: Section, direction: 'export' | 'import'): boolean {
  if (!section.tool.conversionConfig) {
    return false;
  }

  const conversionProp = section.tool.conversionConfig[direction];

  return isFunction(conversionProp) || isString(conversionProp);
}

/**
 * Checks that all the properties of the first section data exist in second section data with the same values.
 *
 * @param data1 – first section data
 * @param data2 – second section data
 */
export function isSameSectionData(data1: SectionToolData, data2: SectionToolData): boolean {
  return Object.entries(data1).some((([propName, propValue]) => {
    return data2[propName] && equals(data2[propName], propValue);
  }));
}

/**
 * Check if two sections could be merged.
 *
 * We can merge two sections if:
 *  - they have the same type
 *  - they have a merge function (.mergeable = true)
 *  - If they have valid conversions config
 *
 * @param targetSection - section to merge to
 * @param sectionToMerge - section to merge from
 */
export function areSectionsMergeable(targetSection: Section, sectionToMerge: Section): boolean {
  /**
   * If target section has not 'merge' method, we can't merge sections.
   *
   * Technically we can (through the conversion) but it will lead a target section delete and recreation, which is unexpected behavior.
   */
  if (!targetSection.mergeable) {
    return false;
  }

  /**
   * Tool knows how to merge own data format
   */
  if (targetSection.name === sectionToMerge.name) {
    return true;
  }

  /**
   * We can merge sections if they have valid conversion config
   */
  return isSectionConvertable(sectionToMerge, 'export') && isSectionConvertable(targetSection, 'import');
}

/**
 * Using conversionConfig, convert section data to string.
 *
 * @param sectionData - section data to convert
 * @param conversionConfig - tool's conversion config
 */
export function convertSectionDataToString(sectionData: SectionToolData, conversionConfig?: ConversionConfig ): string {
  const exportProp = conversionConfig?.export;

  if (isFunction(exportProp)) {
    return exportProp(sectionData);
  } else if (isString(exportProp)) {
    return sectionData[exportProp];
  } else {
    /**
     * Tool developer provides 'export' property, but it is not correct. Warn him.
     */
    if (exportProp !== undefined) {
      log('Conversion «export» property must be a string or function. ' +
      'String means key of saved data object to export. Function should export processed string to export.');
    }

    return '';
  }
}

/**
 * Using conversionConfig, convert string to section data.
 *
 * @param stringToImport - string to convert
 * @param conversionConfig - tool's conversion config
 */
export function convertStringToSectionData(stringToImport: string, conversionConfig?: ConversionConfig): SectionToolData {
  const importProp = conversionConfig?.import;

  if (isFunction(importProp)) {
    return importProp(stringToImport);
  } else if (isString(importProp)) {
    return {
      [importProp]: stringToImport,
    };
  } else {
    /**
     * Tool developer provides 'import' property, but it is not correct. Warn him.
     */
    if (importProp !== undefined) {
      log('Conversion «import» property must be a string or function. ' +
      'String means key of tool data to import. Function accepts a imported string and return composed tool data.');
    }

    return {};
  }
}
