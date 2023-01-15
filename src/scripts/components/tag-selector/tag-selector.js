import Dictionary from '@services/dictionary';
import Util from '@services/util';
import Tag from './tag';
import './tag-selector.scss';

export default class TagSelector {
  /**
   * Tag selector.
   *
   * @class
   * @param {object} params Parameter from editor.
   * @param {object} [callbacks] Callbacks.
   */
  constructor(params, callbacks) {
    // Set missing params
    this.params = Util.extend({
      tags: []
    }, params || {});

    this.callbacks = Util.extend({
    }, callbacks || {});

    this.tags = {};

    this.dom = document.createElement('div');
    this.dom.classList.add('tag-selector');

    const list = document.createElement('ul');
    list.classList.add('tag-list');
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', Dictionary.get('a11y.tagSelector'));
    list.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });
    this.dom.append(list);

    this.params.tags.forEach((tagParam, index) => {
      const tag = new Tag(
        {
          text: tagParam.text,
          selected: tagParam.selected
        },
        {
          onClicked: (params) => {
            this.handleTagClicked(params);
          },
          onSelectedAll: () => {
            this.handleTagSelectedAll();
          }
        }
      );

      list.append(tag.getDOM());

      this.tags[tagParam.text] = tag;

      tag.setAttribute('tabindex', index === 0 ? '0' : '-1');
    });

    this.currentTagIndex = 0;
    this.hide();
  }

  /**
   * Return the DOM for this class.
   *
   * @returns {HTMLElement} DOM for this class.
   */
  getDOM() {
    return this.dom;
  }

  /**
   * Show.
   */
  show() {
    this.dom.classList.remove('display-none');
  }

  /**
   * Hide.
   */
  hide() {
    this.dom.classList.add('display-none');
  }

  /**
   * Handle tag clicked.
   */
  handleTagClicked() {
    const selectedTexts = Object.values(this.tags)
      .filter((tag) => {
        return tag.isSelected();
      })
      .map((tag) => {
        return tag.getText();
      });

    this.callbacks.onChanged(selectedTexts);
  }

  /**
   * Handle all tags selected.
   */
  handleTagSelectedAll() {
    // If all tags are selected, select none. Else select all.
    const numberSelected = Object.values(this.tags).reduce((sum, tag) => {
      return sum + tag.isSelected() ? 1 : 0;
    }, 0);

    Object.values(this.tags).forEach((tag) => {
      tag.toggleSelected(numberSelected !== Object.keys(this.tags).length);
    });

    this.handleTagClicked();
  }

  /**
   * Move button focus
   *
   * @param {number} offset Offset to move position by.
   */
  moveButtonFocus(offset) {
    if (typeof offset !== 'number') {
      return;
    }

    if (
      this.currentTagIndex + offset < 0 ||
      this.currentTagIndex + offset > Object.keys(this.tags).length - 1
    ) {
      return; // Don't cycle
    }

    Object.values(this.tags)[this.currentTagIndex]
      .setAttribute('tabindex', '-1');

    this.currentTagIndex = this.currentTagIndex + offset;

    const focusButton = Object.values(this.tags)[this.currentTagIndex];

    focusButton.setAttribute('tabindex', '0');
    focusButton.focus();
  }

  /**
   * Handle key down.
   *
   * @param {KeyboardEvent} event Keyboard event.
   */
  handleKeydown(event) {
    if (event.code === 'ArrowLeft' || event.code === 'ArrowUp') {
      this.moveButtonFocus(-1);
    }
    else if (event.code === 'ArrowRight' || event.code === 'ArrowDown') {
      this.moveButtonFocus(1);
    }
    else if (event.code === 'Home') {
      this.moveButtonFocus(0 - this.currentTagIndex);
    }
    else if (event.code === 'End') {
      this.moveButtonFocus(
        Object.keys(this.buttons).length - 1 - this.currentTagIndex
      );
    }
    else {
      return;
    }

    event.preventDefault();
  }
}
