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
      onClicked: () => {}
    }, callbacks || {});

    this.selected = this.params.selected;

    this.dom = document.createElement('li');
    this.dom.classList.add('tag');
    this.dom.innerText = this.params.text;
    this.dom.addEventListener('click', () => {
      this.handleClicked();
    });

    this.toggleState(this.selected);
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
   * Toggle state.
   *
   * @param {boolean} state Target state.
   */
  toggleState(state) {
    this.selected = (typeof state === 'boolean') ?
      state :
      !(this.selected ?? true);

    this.dom.classList.toggle('selected', this.selected);
  }

  /**
   * Handle clicked.
   */
  handleClicked() {
    this.toggleState();

    this.callbacks.onClicked({
      text: this.params.text,
      selected: this.selected
    });
  }
}
