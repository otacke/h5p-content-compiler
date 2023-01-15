import Util from '@services/util';
import './tag.scss';

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
    }, params || {});

    this.callbacks = Util.extend({
      onClicked: () => {},
      onSelectedAll: () => {}
    }, callbacks || {});

    this.selected = this.params.selected;

    this.dom = document.createElement('li');
    this.dom.classList.add('tag');
    this.dom.setAttribute('role', 'option');
    this.dom.setAttribute(
      'aria-selected', this.params.selected ? 'true' : 'false'
    );
    this.dom.innerText = this.params.text;
    this.dom.addEventListener('click', () => {
      this.handleClicked();
    });
    this.dom.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    });

    this.toggleSelected(this.selected);
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
   * Focus.
   */
  focus() {
    this.dom.focus();
  }

  /**
   * Determine whether tag is selected.
   *
   * @returns {boolean} True, if tag is selected. Else false.
   */
  isSelected() {
    return this.selected;
  }

  /**
   * Get tag text.
   *
   * @returns {string} Tag text.
   */
  getText() {
    return this.params.text;
  }

  /**
   * Set attribute.
   *
   * @param {string} attribute Attribute key.
   * @param {string} value Attribute value.
   */
  setAttribute(attribute, value) {
    this.dom.setAttribute(attribute, value);
  }

  /**
   * Toggle state.
   *
   * @param {boolean} state Target state.
   */
  toggleSelected(state) {
    this.selected = (typeof state === 'boolean') ?
      state :
      !(this.selected ?? true);

    this.dom.classList.toggle('selected', this.selected);
    this.dom.setAttribute(
      'aria-selected', this.selected ? 'true' : 'false'
    );
  }

  /**
   * Handle clicked.
   */
  handleClicked() {
    this.toggleSelected();

    this.callbacks.onClicked();
  }

  handleKeydown(event) {
    if (event.code === 'Enter' || event.code === 'Space') {
      this.handleClicked();
    }
    else if (event.code === 'KeyA' && event.ctrlKey) {
      this.callbacks.onSelectedAll();
    }
    else {
      return;
    }

    event.preventDefault();
  }
}
