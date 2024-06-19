/**
 * Contains keyboard and mouse events bound on each Section by Section Manager
 */
import Module from '../__module';
import * as _ from '../utils';
import SelectionUtils from '../selection';
import Flipper from '../flipper';
import type Section from '../section';
import { areSectionsMergeable } from '../utils/sections';

/**
 *
 */
export default class SectionEvents extends Module {
  /**
   * All keydowns on Section
   *
   * @param {KeyboardEvent} event - keydown
   */
  public keydown(event: KeyboardEvent): void {
    /**
     * Run common method for all keydown events
     */
    this.beforeKeydownProcessing(event);

    /**
     * Fire keydown processor by event.keyCode
     */
    switch (event.keyCode) {
      case _.keyCodes.BACKSPACE:
        this.backspace(event);
        break;

      case _.keyCodes.DELETE:
        this.delete(event);
        break;

      case _.keyCodes.ENTER:
        this.enter(event);
        break;

      case _.keyCodes.DOWN:
      case _.keyCodes.RIGHT:
        this.arrowRightAndDown(event);
        break;

      case _.keyCodes.UP:
      case _.keyCodes.LEFT:
        this.arrowLeftAndUp(event);
        break;

      case _.keyCodes.TAB:
        this.tabPressed(event);
        break;
    }

    /**
     * We check for "key" here since on different keyboard layouts "/" can be typed as "Shift + 7" etc
     *
     * @todo probably using "beforeInput" event would be better here
     */
    if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
      this.slashPressed();
    }

    /**
     * If user pressed "Ctrl + /" or "Cmd + /" — open Section Settings
     * We check for "code" here since on different keyboard layouts there can be different keys in place of Slash.
     */
    if (event.code === 'Slash' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      this.commandSlashPressed();
    }
  }

  /**
   * Fires on keydown before event processing
   *
   * @param {KeyboardEvent} event - keydown
   */
  public beforeKeydownProcessing(event: KeyboardEvent): void {
    /**
     * Do not close Toolbox on Tabs or on Enter with opened Toolbox
     */
    if (!this.needToolbarClosing(event)) {
      return;
    }

    /**
     * When user type something:
     *  - close Toolbar
     *  - close Conversion Toolbar
     *  - clear section highlighting
     */
    if (_.isPrintableKey(event.keyCode)) {
      this.Editor.Toolbar.close();
      this.Editor.ConversionToolbar.close();

      /**
       * Allow to use shortcuts with selected sections
       *
       * @type {boolean}
       */
      const isShortcut = event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;

      if (!isShortcut) {
        this.Editor.SectionSelection.clearSelection(event);
      }
    }
  }

  /**
   * Key up on Section:
   * - shows Inline Toolbar if something selected
   * - shows conversion toolbar with 85% of section selection
   *
   * @param {KeyboardEvent} event - keyup event
   */
  public keyup(event: KeyboardEvent): void {
    /**
     * If shift key was pressed some special shortcut is used (eg. cross section selection via shift + arrows)
     */
    if (event.shiftKey) {
      return;
    }

    /**
     * Check if editor is empty on each keyup and add special css class to wrapper
     */
    this.Editor.UI.checkEmptiness();
  }

  /**
   * Add drop target styles
   *
   * @param {DragEvent} event - drag over event
   */
  public dragOver(event: DragEvent): void {
    const section = this.Editor.SectionManager.getSectionByChildNode(event.target as Node);

    section.dropTarget = true;
  }

  /**
   * Remove drop target style
   *
   * @param {DragEvent} event - drag leave event
   */
  public dragLeave(event: DragEvent): void {
    const section = this.Editor.SectionManager.getSectionByChildNode(event.target as Node);

    section.dropTarget = false;
  }

  /**
   * Copying selected sections
   * Before putting to the clipboard we sanitize all sections and then copy to the clipboard
   *
   * @param {ClipboardEvent} event - clipboard event
   */
  public handleCommandC(event: ClipboardEvent): void {
    const { SectionSelection } = this.Editor;

    if (!SectionSelection.anySectionSelected) {
      return;
    }

    // Copy Selected Sections
    SectionSelection.copySelectedSections(event);
  }

  /**
   * Copy and Delete selected Sections
   *
   * @param {ClipboardEvent} event - clipboard event
   */
  public handleCommandX(event: ClipboardEvent): void {
    const { SectionSelection, SectionManager, Caret } = this.Editor;

    if (!SectionSelection.anySectionSelected) {
      return;
    }

    SectionSelection.copySelectedSections(event).then(() => {
      const selectionPositionIndex = SectionManager.removeSelectedSections();

      /**
       * Insert default section in place of removed ones
       */
      const insertedSection = SectionManager.insertDefaultSectionAtIndex(selectionPositionIndex, true);

      Caret.setToSection(insertedSection, Caret.positions.START);

      /** Clear selection */
      SectionSelection.clearSelection(event);
    });
  }

  /**
   * Tab pressed inside a Section.
   *
   * @param {KeyboardEvent} event - keydown
   * @todo add proper support for tab pressing to navigate over sections and blocks
   * @todo Add support for Shift + Tab
   */
  private tabPressed(event: KeyboardEvent): void {
    /*
    const { InlineToolbar, ConversionToolbar, Caret } = this.Editor;

    const isFlipperActivated = ConversionToolbar.opened || InlineToolbar.opened;

    if (isFlipperActivated) {
      return;
    }

    const isNavigated = event.shiftKey ? Caret.navigatePrevious(true) : Caret.navigateNext(true);
    */
    /**
     * If we have next Section/input to focus, then focus it. Otherwise, leave native Tab behaviour
     */
    /*
    if (isNavigated) {
      event.preventDefault();
    }
    */
  }


  /**
   * Handles delete keydown on Section
   *
   * @todo implement delete for section deletion
   * @param {KeyboardEvent} event - keydown
   */
  private delete(event: KeyboardEvent): void {
    const { SectionManager, Caret } = this.Editor;
    const { currentSection, nextSection } = SectionManager;

    /**
     * If some fragment is selected, leave native behaviour
     */
    if (!SelectionUtils.isCollapsed) {
      return;
    }

    /**
     * If caret is not at the end, leave native behaviour
     */
    if (!Caret.isAtEnd) {
      return;
    }

    /**
     * All the cases below have custom behaviour, so we don't need a native one
     */
    event.preventDefault();
    this.Editor.Toolbar.close();

    const isLastInputFocused = currentSection.currentInput === currentSection.lastInput;

    /**
     * For example, caret at the end of the Quote first input (quote text) — just navigate next input (caption)
     */
    if (!isLastInputFocused) {
      Caret.navigateNext();

      return;
    }

    /**
     * Delete at the end of the last Section should do nothing
     */
    if (nextSection === null) {
      return;
    }

    /**
     * If next Section is empty, it should be removed just like a character
     */
    if (nextSection.isEmpty) {
      SectionManager.removeSection(nextSection);

      return;
    }

    /**
     * If current Section is empty, just remove it and set cursor to the next Section (like we're removing line break char)
     */
    if (currentSection.isEmpty) {
      SectionManager.removeSection(currentSection);

      Caret.setToSection(nextSection, Caret.positions.START);

      return;
    }

    const bothSectionsMergeable = areSectionsMergeable(currentSection, nextSection);

    /**
     * If Sections could be merged, do it
     * Otherwise, just navigate to the next section
     */
    if (bothSectionsMergeable) {
      this.mergeSections(currentSection, nextSection);
    } else {
      Caret.setToSection(nextSection, Caret.positions.START);
    }
  }

  /**
   * Merge passed Sections
   *
   * @param targetSection - to which Section we want to merge
   * @param sectionToMerge - what Section we want to merge
   */
  private mergeSections(targetSection: Section, sectionToMerge: Section): void {
    const { SectionManager, Caret, Toolbar } = this.Editor;

    Caret.createShadow(targetSection.pluginsContent);

    SectionManager
      .mergeSections(targetSection, sectionToMerge)
      .then(() => {
        /** Restore caret position after merge */
        Caret.restoreCaret(targetSection.pluginsContent as HTMLElement);
        Toolbar.close();
      });
  }

  /**
   * Handle right and down keyboard keys
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  private arrowRightAndDown(event: KeyboardEvent): void {
    const isFlipperCombination = Flipper.usedKeys.includes(event.keyCode) &&
      (!event.shiftKey || event.keyCode === _.keyCodes.TAB);

    /**
     * Arrows might be handled on toolbars by flipper
     * Check for Flipper.usedKeys to allow navigate by DOWN and disallow by RIGHT
     */
    if (this.Editor.UI.someToolbarOpened && isFlipperCombination) {
      return;
    }

    /**
     * Close Toolbar when user moves cursor
     */
    this.Editor.Toolbar.close();

    const shouldEnableCBS = this.Editor.Caret.isAtEnd || this.Editor.SectionSelection.anySectionSelected;

    if (event.shiftKey && event.keyCode === _.keyCodes.DOWN && shouldEnableCBS) {
      this.Editor.CrossSectionSelection.toggleSectionSelectedState();

      return;
    }

    const navigateNext = event.keyCode === _.keyCodes.DOWN || (event.keyCode === _.keyCodes.RIGHT && !this.isRtl);
    const isNavigated = navigateNext ? this.Editor.Caret.navigateNext() : this.Editor.Caret.navigatePrevious();

    if (isNavigated) {
      /**
       * Default behaviour moves cursor by 1 character, we need to prevent it
       */
      event.preventDefault();

      return;
    }

    /**
     * After caret is set, update Section input index
     */
    _.delay(() => {
      /** Check currentSection for case when user moves selection out of Editor */
      if (this.Editor.SectionManager.currentSection) {
        this.Editor.SectionManager.currentSection.updateCurrentInput();
      }
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    }, 20)();

    /**
     * Clear sections selection by arrows
     */
    this.Editor.SectionSelection.clearSelection(event);
  }

  /**
   * Handle left and up keyboard keys
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  private arrowLeftAndUp(event: KeyboardEvent): void {
    /**
     * Arrows might be handled on toolbars by flipper
     * Check for Flipper.usedKeys to allow navigate by UP and disallow by LEFT
     */
    if (this.Editor.UI.someToolbarOpened) {
      if (Flipper.usedKeys.includes(event.keyCode) && (!event.shiftKey || event.keyCode === _.keyCodes.TAB)) {
        return;
      }

      this.Editor.UI.closeAllToolbars();
    }

    /**
     * Close Toolbar when user moves cursor
     */
    this.Editor.Toolbar.close();

    const shouldEnableCBS = this.Editor.Caret.isAtStart || this.Editor.SectionSelection.anySectionSelected;

    if (event.shiftKey && event.keyCode === _.keyCodes.UP && shouldEnableCBS) {
      this.Editor.CrossSectionSelection.toggleSectionSelectedState(false);

      return;
    }

    const navigatePrevious = event.keyCode === _.keyCodes.UP || (event.keyCode === _.keyCodes.LEFT && !this.isRtl);
    const isNavigated = navigatePrevious ? this.Editor.Caret.navigatePrevious() : this.Editor.Caret.navigateNext();

    if (isNavigated) {
      /**
       * Default behaviour moves cursor by 1 character, we need to prevent it
       */
      event.preventDefault();

      return;
    }

    /**
     * After caret is set, update Section input index
     */
    _.delay(() => {
      /** Check currentSection for case when user ends selection out of Editor and then press arrow-key */
      if (this.Editor.SectionManager.currentSection) {
        this.Editor.SectionManager.currentSection.updateCurrentInput();
      }
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    }, 20)();

    /**
     * Clear sections selection by arrows
     */
    this.Editor.SectionSelection.clearSelection(event);
  }

  /**
   * Cases when we need to close Toolbar
   *
   * @param {KeyboardEvent} event - keyboard event
   */
  private needToolbarClosing(event: KeyboardEvent): boolean {
    const toolboxItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.Toolbar.toolbox.opened),
        sectionSettingsItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.SectionSettings.opened),
        inlineToolbarItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.InlineToolbar.opened),
        conversionToolbarItemSelected = (event.keyCode === _.keyCodes.ENTER && this.Editor.ConversionToolbar.opened),
        flippingToolbarItems = event.keyCode === _.keyCodes.TAB;

    /**
     * Do not close Toolbar in cases:
     * 1. ShiftKey pressed (or combination with shiftKey)
     * 2. When Toolbar is opened and Tab leafs its Tools
     * 3. When Toolbar's component is opened and some its item selected
     */
    return !(event.shiftKey ||
      flippingToolbarItems ||
      toolboxItemSelected ||
      sectionSettingsItemSelected ||
      inlineToolbarItemSelected ||
      conversionToolbarItemSelected
    );
  }

  /**
   * If Toolbox is not open, then just open it and show plus button
   */
  private activateToolbox(): void {
    if (!this.Editor.Toolbar.opened) {
      this.Editor.Toolbar.moveAndOpen();
    } // else Flipper will leaf through it

    this.Editor.Toolbar.toolbox.open();
  }

  /**
   * Open Toolbar and show SectionSettings before flipping Tools
   */
  private activateSectionSettings(): void {
    if (!this.Editor.Toolbar.opened) {
      this.Editor.Toolbar.moveAndOpen();
    }

    /**
     * If SectionSettings is not open, then open SectionSettings
     * Next Tab press will leaf Settings Buttons
     */
    if (!this.Editor.SectionSettings.opened) {
      /**
       * @todo Debug the case when we set caret to some section, hovering another section
       *       — wrong settings will be opened.
       *       To fix it, we should refactor the Section Settings module — make it a standalone class, like the Toolbox
       */
      this.Editor.SectionSettings.open();
    }
  }
}
