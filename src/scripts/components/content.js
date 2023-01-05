import Contents from '@models/contents';
import Dictionary from '@services/dictionary';
import Globals from '@services/globals';
import Util from '@services/util';
import CardsList from '@components/cards-list/cards-list';
import Toolbar from '@components/toolbar/toolbar';
import TagSelector from '@components/tag-selector/tag-selector';
import './content.scss';
import MessageBox from './message-box/message-box';

export default class Content {

  constructor(params = {}) {
    this.params = Util.extend({
      contents: []
    }, params);

    // TODO: Previous state
    this.filteredTexts = this.params.contents
      .reduce((result, content) => {
        const keywords = (content.keywords || '')
          .split(',')
          .map((word) => word.trim());

        keywords.forEach((word) => {
          if (!result.includes(word)) {
            result.push(word);
          }
        });

        return result;
      }, [])
      .sort();

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-grid-view-content');

    // TODO: previous state
    this.pool = new Contents({
      contents: this.params.contents,
      allKeywordsPreselected: this.params.allKeywordsPreselected
    });

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
          onClick: (event, params) => {
            this.handleTagSelectorClicked(params);
          }
        }
      ]
    });
    this.dom.append(this.toolbar.getDOM());

    this.tagSelector = new TagSelector(
      {
        tags: this.filteredTexts.map((word) => {
          return {
            text: word,
            selected: this.params.allKeywordsPreselected // TODO: previous state
          };
        })
      },
      {
        onChanged: (filteredTexts) => {
          this.handleFilterChanged(filteredTexts);
        }
      }
    );
    this.dom.append(this.tagSelector.getDOM());

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

    this.messageBox = new MessageBox();
    this.messageBox.hide();
    this.dom.appendChild(this.messageBox.getDOM());

    // TODO: Previous state
    debugger
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

      if (mode === CardsList.MODE[key]) {
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
      this.tagSelector.hide();
    }

    const visibleContents = [];
    const contents = this.pool.getContents();
    for (const id in contents) {
      if (mode === CardsList.MODE['filter']) {
        if (contents[id].isFiltered) {
          visibleContents.push(id);
        }
      }
      else {
        visibleContents.push(id);
      }
    }

    this.poolList.filter(visibleContents);

    this.updateMessageBox();

    Globals.get('resize')();
  }

  /**
   * Update message.
   */
  updateMessageBox() {
    if (this.mode === CardsList.MODE['filter']) {
      const numberCardsFiltered = Object.values(this.pool.getContents())
        .filter((content) => content.isFiltered).length;

      if (numberCardsFiltered === 0) {
        this.messageBox.setText(Dictionary.get('l10n.noCardsFilter'));
        this.messageBox.show();
      }
      else {
        this.messageBox.hide();
      }
    }
    else {
      const numberCardsSelected = Object.values(this.pool.getContents())
        .filter((content) => content.isSelected).length;

      if (numberCardsSelected === 0) {
        this.messageBox.setText(Dictionary.get('l10n.noCardsSelected'));
        this.messageBox.show();
      }
      else {
        this.messageBox.hide();
      }
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
      this.pool.setSelected(params.id, params.selected);
    }
  }

  /**
   * Handle selection of keywords changed.
   *
   * @param {string[]} filteredTexts Filtered Keywords.
   */
  handleFilterChanged(filteredTexts) {
    this.filteredTexts = filteredTexts;
    this.pool.setFiltered(this.filteredTexts);

    const visibleContents = [];
    const contents = this.pool.getContents();
    for (const id in contents) {
      if (contents[id].isFiltered) {
        visibleContents.push(id);
      }
    }
    this.poolList.filter(visibleContents);

    this.updateMessageBox();

    Globals.get('resize')();
  }

  /**
   * Handle tag selector clicked.
   *
   * @param {object} [params={}] Parameters.
   */
  handleTagSelectorClicked(params = {}) {
    if (params.active === true) {
      this.tagSelector.show();
    }
    else if (params.active === false) {
      this.tagSelector.hide();
    }

    Globals.get('resize')();
  }
}
