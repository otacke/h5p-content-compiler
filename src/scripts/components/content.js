import Contents from '@models/contents';
import Dictionary from '@services/dictionary';
import Util from '@services/util';
import CardsList from '@components/cards-list/cards-list';
import Toolbar from '@components/toolbar/toolbar';
import './content.scss';

export default class Content {

  constructor(params = {}) {
    this.params = Util.extend({
      contents: []
    }, params);

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-grid-view-content');

    // TODO: previous state
    this.pool = new Contents({ contents: this.params.contents });
    this.chosen = new Contents();

    // Toolbar
    this.toolbar = new Toolbar({
      buttons: [
        {
          id: 'filter',
          type: 'toggle',
          a11y: {
            active: Dictionary.get('a11y.buttonFilter'), // TODO
            inactive: Dictionary.get('a11y.buttonFilter') // TODO
          },
          onClick: () => {
            this.setMode(CardsList.MODE['filter']);
          }
        },
        {
          id: 'reorder',
          type: 'toggle',
          a11y: {
            active: Dictionary.get('a11y.buttonReorder'), // TODO
            inactive: Dictionary.get('a11y.buttonReorder') // TODO
          },
          onClick: () => {
            this.setMode(CardsList.MODE['reorder']);
          }
        },
        {
          id: 'view',
          type: 'toggle',
          a11y: {
            active: Dictionary.get('a11y.buttonView'), // TODO
            inactive: Dictionary.get('a11y.buttonView') // TODO
          },
          onClick: () => {
            this.setMode(CardsList.MODE['view']);
          }
        },
        {
          id: 'tags',
          type: 'toggle',
          a11y: {
            active: Dictionary.get('a11y.buttonTags'), // TODO
            inactive: Dictionary.get('a11y.buttonTags'), // TODO
            disabled: Dictionary.get('a11y.buttonTagsDisabled') // TODO
          },
          onClick: () => {
            // TODO: Toggle tag chooser
          }
        }
      ]
    });
    this.dom.append(this.toolbar.getDOM());

    // Pool of contents
    this.poolList = new CardsList(
      { contents: this.pool.getContents() },
      {
        onCardClicked: (params) => {
          this.handleCardClicked(params);
        }
      }
    );
    this.dom.append(this.poolList.getDOM());

    // TODO: Previous state
    this.setMode(CardsList.MODE['filter']);
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
   * Set mode.
   *
   * @param {number} mode Mode id.
   */
  setMode(mode) {
    if (this.mode === mode) {
      return;
    }
    this.mode = mode;

    for (const key in CardsList.MODE) {
      this.toolbar.forceButton(key, mode === CardsList.MODE[key]);

      if (CardsList.MODE[key] === mode) {
        this.toolbar.blockButton(key);
      }
      else {
        this.toolbar.unblockButton(key);
      }

      this.poolList.setMode(mode);
    }

    if (mode === CardsList.MODE['filter']) {
      this.toolbar.enableButton('tags');
    }
    else {
      this.toolbar.forceButton('tags', false);
      this.toolbar.disableButton('tags');
    }
  }

  /**
   * Handle card was clicked.
   *
   * @param {object} [params={}] Parameters.
   * @param {string} params.id Id of card that was clicked.
   * @param {boolean} [params.selected] If true, handle selection.
   */
  handleCardClicked(params = {}) {
    if (!params.id) {
      return;
    }

    if (typeof params.selected === 'boolean') {
      if (params.selected) {
        const content = this.pool.getContent(params.id);
        this.chosen.addContentReady(params.id, content);
        this.pool.removeContent(params.id);
      }
      else {
        const content = this.chosen.getContent(params.id);
        this.pool.addContentReady(params.id, content);
        this.chosen.removeContent(params.id);
      }
    }
  }
}
