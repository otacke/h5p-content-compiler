import Dictionary from '@services/dictionary';
import Globals from '@services/globals';
import Util from '@services/util';
import CardsList from './cards-list';
import './card.scss';

export default class Card {

  /**
   * @class
   * @param {object} [params={}] Parameters.
   * @param {string} params.label Label.
   * @param {string} [params.introduction] Introduction text.
   * @param {string[]} [params.keywords=[]] Keywords.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} [callbacks.onClicked] Callback click.
   * @param {function} [callbacks.onMouseDown] Callback mouse down.
   * @param {function} [callbacks.onDragStart] Callback drag start.
   * @param {function} [callbacks.onDragEnter] Callback drag enter.
   * @param {function} [callbacks.onDragLeave] Callback drag leave.
   * @param {function} [callbacks.onDragEnd] Callback drag end.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      keywords: []
    }, params);

    this.callbacks = Util.extend({
      onClicked: () => {},
      onMouseDown: () => {},
      onDragStart: () => {},
      onDragEnter: () => {},
      onDragLeave: () => {},
      onDragEnd: () => {}
    }, callbacks);

    this.dom = document.createElement('li');
    this.dom.classList.add('h5p-grid-view-card');

    this.dom.addEventListener('mousedown', (event) => {
      this.callbacks.onMouseDown(event);
    });
    this.dom.addEventListener('dragstart', (event) => {
      this.handleDragStart(event);
    });
    this.dom.addEventListener('dragenter', (event) => {
      this.handleDragEnter(event);
    });
    this.dom.addEventListener('dragleave', (event) => {
      this.handleDragLeave(event);
    });
    this.dom.addEventListener('dragend', (event) => {
      this.handleDragEnd(event);
    });

    this.button = document.createElement('button');
    this.button.classList.add('h5p-grid-view-card-content');
    this.button.addEventListener('click', () => {
      this.callbacks.onClicked();
    });
    this.dom.append(this.button);

    // const content = document.createElement('div');
    // content.classList.add('h5p-grid-view-card-content');
    // this.button.append(content);

    if (this.params.label) {
      const label = document.createElement('div');
      label.classList.add('h5p-grid-view-card-label');
      label.innerHTML = this.params.label;
      this.button.append(label);
    }

    if (this.params.image?.path) {
      const image = document.createElement('img');
      image.classList.add('h5p-grid-view-card-image');
      if (this.params.label) {
        image.classList.add('has-label');
      }
      image.setAttribute('draggable', 'false');

      image.addEventListener('load', () => {
        Globals.get('resize')();
      });

      if (this.params.visuals?.imageSizing === 'custom') {
        image.classList.add('fixed-ratio');
      }

      H5P.setSource(image, this.params.image, Globals.get('contentId'));

      this.button.append(image);
    }

    // An empty introduction will serve as a growing element in flexbox
    const introduction = document.createElement('p');
    introduction.classList.add('h5p-grid-view-card-introduction');
    introduction.innerHTML = this.params.introduction;
    this.button.append(introduction);

    this.status = document.createElement('div');
    this.status.classList.add('h5p-grid-view-card-status');
    this.button.append(this.status);

    // TODO: previous state
    this.setStatusCode(Globals.get('states')['unstarted']);
    this.isSelected = false;
  }

  /**
   * Get DOM.
   *
   * @returns {HTMLElement} Content DOM.
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
   * Focus.
   */
  focus() {
    this.button.focus();
  }

  /**
   * Set draggable state.
   *
   * @param {boolean} state If true, is draggable. Else not.
   */
  setDraggable(state) {
    this.dom.setAttribute('draggable', state);
  }

  /**
   * Toggle card selection.
   *
   * @param {boolean} [state] State to be toggled to.
   * @returns {boolean} True, if card is not selected, else false.
   */
  toggleSelected(state) {
    if (typeof state !== 'boolean') {
      state = !this.isSelected; // Use previous selection to determine.
    }

    if (state) {
      this.dom.classList.add('selected');
      this.isSelected = true;
      this.status.innerHTML = Dictionary.get('l10n.selected');
    }
    else {
      this.dom.classList.remove('selected');
      this.isSelected = false;
      this.status.innerHTML = null;
    }

    return state;
  }

  /**
   * Set status code.
   *
   * @param {number} state State id.
   */
  setStatusCode(state) {
    const statusCode = Object.entries(Globals.get('states'))
      .find((entry) => entry[1] === state)[0];

    this.statusCode = `${statusCode.charAt(0).toLocaleUpperCase()}${statusCode.slice(1)}`;
    this.status.innerHTML = Dictionary.get(`l10n.status${this.statusCode}`);
  }

  /**
   * Set mode.
   *
   * @param {number} mode Mode id.
   */
  setMode(mode) {
    if (mode === CardsList.MODE['filter']) {
      if (this.isSelected) {
        this.status.innerHTML = Dictionary.get('l10n.selected');
      }
      else {
        this.status.innerHTML = null;
      }
    }
    else if (mode === CardsList.MODE['reorder']) {
      this.status.innerHTML = null;
    }
    else if (mode === CardsList.MODE['view']) {
      this.status.innerHTML = Dictionary.get(`l10n.status${this.statusCode}`);
    }

    Object.keys(CardsList.MODE).forEach((key) => {
      this.dom.classList.toggle(key, mode === CardsList.MODE[key]);
    });
  }

  /**
   * Handle card drag start.
   *
   * @param {DragEvent} event Drag event.
   */
  handleDragStart(event) {
    this.dom.classList.add('dragging');
    event.dataTransfer.effectAllowed = 'move';

    this.callbacks.onDragStart(event);
  }

  /**
   * Handle card drag enter.
   *
   * @param {DragEvent} event Drag event.
   */
  handleDragEnter(event) {
    this.callbacks.onDragEnter(event);
  }

  /**
   * Handle card drag leave.
   *
   * @param {DragEvent} event Drag event.
   */
  handleDragLeave(event) {
    this.callbacks.onDragLeave(event);
  }

  /**
   * Handle card drag end.
   *
   * @param {DragEvent} event Drag event.
   */
  handleDragEnd(event) {
    this.show();

    this.dom.classList.remove('dragging');

    this.callbacks.onDragEnd(event);
  }
}
