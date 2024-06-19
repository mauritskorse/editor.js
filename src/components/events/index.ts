import { RedactorDomChanged, RedactorDomChangedPayload } from './RedactorDomChanged';
import { BlockChanged, BlockChangedPayload } from './BlockChanged';
import { BlockHovered, BlockHoveredPayload } from './BlockHovered';
import { SectionChanged, SectionChangedPayload } from './SectionChanged';
import { SectionHovered, SectionHoveredPayload } from './SectionHovered';
import { FakeCursorAboutToBeToggled, FakeCursorAboutToBeToggledPayload } from './FakeCursorAboutToBeToggled';
import { FakeCursorHaveBeenSet, FakeCursorHaveBeenSetPayload } from './FakeCursorHaveBeenSet';
import { EditorMobileLayoutToggled, EditorMobileLayoutToggledPayload } from './EditorMobileLayoutToggled';

/**
 * Events fired by Editor Event Dispatcher
 */
export {
  RedactorDomChanged,
  BlockChanged,
  SectionChanged,
  FakeCursorAboutToBeToggled,
  FakeCursorHaveBeenSet,
  EditorMobileLayoutToggled
};

/**
 * Event name -> Event payload
 */
export interface EditorEventMap {
  [BlockHovered]: BlockHoveredPayload;
  [SectionHovered]: SectionHoveredPayload;
  [RedactorDomChanged]: RedactorDomChangedPayload;
  [BlockChanged]: BlockChangedPayload;
  [SectionChanged]: SectionChangedPayload;
  [FakeCursorAboutToBeToggled]: FakeCursorAboutToBeToggledPayload;
  [FakeCursorHaveBeenSet]: FakeCursorHaveBeenSetPayload;
  [EditorMobileLayoutToggled]: EditorMobileLayoutToggledPayload
}
