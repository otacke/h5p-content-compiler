import Util from '@services/util';
import Card from '@components/cards-list/card';
import CardPlaceholder from './card-placeholder';
import './cards-list.scss';

export default class CardsList {

  /**
   * @class
   * @param {object} [params={}] Parameters.
   * @param {object} [params.contents={}] Contents.
   * @param {number} [params.mode] Mode.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} [callbacks.onCardClicked] Callback click.
   * @param {function} [callbacks.onCardMouseDown] Callback mouse down.
   * @param {function} [callbacks.onCardDragStart] Callback drag start.
   * @param {function} [callbacks.onCardDragEnter] Callback drag enter.
   * @param {function} [callbacks.onCardDragLeave] Callback drag leave.
   * @param {function} [callbacks.onCatdDragEnd] Callback drag end.
   */
  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      contents: {},
      mode: CardsList.MODE['filter']
    }, params);

    this.callbacks = Util.extend({
      onCardClicked: () => {},
      onCardMouseDown: () => {},
      onCardDragStart: () => {},
      onCardDragEnter: () => {},
      onCardDragLeave: () => {},
      onCardDragEnd: () => {}
    }, callbacks);

    // TODO: Implement ARIA pattern "listbox"

    this.dom = document.createElement('ul');
    this.dom.classList.add('h5p-grid-view-cards-list');

    this.cards = {};

    this.placeholder = new CardPlaceholder();

    for (const id in this.params.contents) {
      const contentParams = this.params.contents[id];

      this.addCard(
        {
          id: id,
          card: {
            label: contentParams.label,
            introduction: contentParams.introduction,
            keywords: contentParams.keywords
          }
        },
        {
          onClicked: () => {
            this.handleCardClicked(id);
          },
          onMouseDown: (event) => {
            this.handleCardMouseDown(event);
          },
          onDragStart: (event) => {
            this.handleCardDragStart(id, event);
          },
          onDragEnter: (event) => {
            this.handleCardDragEnter(id, event);
          },
          onDragLeave: (event) => {
            this.handleCardDragLeave(id, event);
          },
          onDragEnd: () => {
            this.handleCardDragEnd();
          }
        }
      );
    }

    this.setMode(this.params.mode);
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
   * Add card.
   *
   * @param {object} [params={}] Parameters.
   * @param {string} params.id Id of card to add.
   * @param {object} params.card Card parameters.
   * @param {object} [callbacks={}] Callbacks.
   * @param {function} [callbacks.onCardClicked] Handler for card clicked.
   */
  addCard(params = {}, callbacks = {}) {
    if (typeof params.id !== 'string' || !params.card) {
      return; // No id given
    }

    this.cards[params.id] = new Card(params.card, callbacks);
    this.dom.append(this.cards[params.id].getDOM());
  }

  /**
   * Remove card.
   *
   * @param {string} id Id of card to be removed.
   */
  removeCard(id) {
    if (typeof id !== 'string') {
      return; // No id given
    }

    delete this.card[id];
  }

  /**
   * Show cards based on keywords.
   *
   * @param {string[]} visibleCardIds Selectec keywords.
   */
  filter(visibleCardIds = []) {
    for (const id in this.cards) {
      if (visibleCardIds.includes(id)) {
        this.cards[id].show();
      }
      else {
        this.cards[id].hide();
      }
    }
  }

  /**
   * Get element index inside list.
   *
   * @param {HTMLElement} node Node to get index for.
   * @returns {number} Index of node or -1 if not found.
   */
  getElementIndex(node) {
    return [...this.dom.children]
      .filter((child) => child !== this.placeholder.getDOM())
      .indexOf(node);
  }

  /**
   * Set mode.
   *
   * @param {string|number} mode Mode to set.
   */
  setMode(mode) {
    if (typeof mode === 'string') {
      mode = CardsList.MODE[mode];
    }

    if (
      typeof mode !== 'number' ||
      !Object.values(CardsList.MODE).includes(mode)
    ) {
      return;
    }

    // Set CSS modifier
    for (const key in CardsList.MODE) {
      this.dom.classList.toggle(key, mode === CardsList.MODE[key]);
    }

    // Allow to drag cards when in reordering mode
    Object.values(this.cards).forEach((card) => {
      card.setDraggable(mode === CardsList.MODE['reorder']);
    });

    for (const id in this.cards) {
      this.cards[id].setMode(mode);
    }

    this.mode = mode;
  }

  /**
   * Handle card clicked.
   *
   * @param {string} id Id of card that was clicked.
   */
  handleCardClicked(id) {
    if (this.mode === CardsList.MODE['filter']) {
      this.callbacks.onCardClicked({
        id: id,
        selected: this.cards[id].toggleSelected()
      });
    }
    else if (this.mode === CardsList.MODE['view']) {
      // TODO: Open content
    }
  }

  /**
   * Handle mouse down on card.
   *
   * @param {MouseEvent} event Mouse event.
   */
  handleCardMouseDown(event) {
    if (this.mode !== CardsList.MODE['reorder']) {
      return;
    }

    this.pointerPosition = { x: event.clientX, y: event.clientY };
  }

  /**
   * Handle card drag start.
   *
   * @param {string} id Id of card that started being dragged.
   * @param {DragEvent} event Drag event.
   */
  handleCardDragStart(id, event) {
    if (this.mode !== CardsList.MODE['reorder']) {
      return;
    }

    // Workaround for Firefox that may scale the draggable down otherwise
    event.dataTransfer.setDragImage(
      this.cards[id].getDOM(),
      this.pointerPosition.x -
        this.cards[id].getDOM().getBoundingClientRect().left,
      this.pointerPosition.y -
        this.cards[id].getDOM().getBoundingClientRect().top
    );

    this.draggedElement = event.currentTarget;

    // Would hide browser's draggable copy as well without timeout
    clearTimeout(this.placeholderTimeout);
    this.placeholderTimeout = window.setTimeout(() => {
      this.placeholder.setSize(
        this.draggedElement.offsetWidth, this.draggedElement.offsetHeight
      );

      this.dom.insertBefore(
        this.placeholder.getDOM(), this.draggedElement.nextSibling
      );

      this.cards[id].hide();
    }, 0);
  }

  /**
   * Handle card drag enter.
   *
   * @param {string} id Id of card that was entered.
   * @param {DragEvent} event Drag event.
   */
  handleCardDragEnter(id, event) {
    if (this.mode !== CardsList.MODE['reorder']) {
      return;
    }

    this.dropzoneElement = event.currentTarget;

    // Swap dragged draggable and draggable that's dragged to if not identical
    if (
      this.dropzoneElement && this.draggedElement &&
      this.draggedElement !== this.dropzoneElement
    ) {
      Util.swapDOMElements(this.draggedElement, this.dropzoneElement);

      this.dom.insertBefore(
        this.placeholder.getDOM(), this.draggedElement.nextSibling
      );
    }
  }

  /**
   * Handle card drag leave.
   *
   * @param {string} id Id of card that was left.
   * @param {DragEvent} event Drag event.
   */
  handleCardDragLeave(id, event) {
    if (this.mode !== CardsList.MODE['reorder']) {
      return;
    }

    if (this.dom !== event.target || this.dom.contains(event.fromElement)) {
      return;
    }

    this.dropzoneElement = null;
  }

  /**
   * Handle card drag end.
   */
  handleCardDragEnd() {
    if (this.mode !== CardsList.MODE['reorder']) {
      return;
    }

    clearTimeout(this.placeholderTimeout);
    this.placeholder.getDOM().remove();

    this.draggedElement = null;
    this.dropzoneElement = null;
  }
}

/** @constant {object} MODE Usage modes for list */
CardsList.MODE = { filter: 0, reorder: 1, view: 2 };
