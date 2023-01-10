import Contents from '@models/contents';
import Dictionary from '@services/dictionary';
import Globals from '@services/globals';
import Util from '@services/util';
import MediaScreen from './media-screen/media-screen';
import CardsList from '@components/cards-list/cards-list';
import ExerciseOverlay from '@components/exercise-overlay/exercise-overlay';
import Toolbar from '@components/toolbar/toolbar';
import TagSelector from '@components/tag-selector/tag-selector';
import './content.scss';
import MessageBox from './message-box/message-box';
import MessageBoxHint from './message-box/message-box-hint';

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
      .filter((text) => text.trim() !== '')
      .sort();

    // TODO: previous state
    this.pool = new Contents(
      {
        contents: this.params.contents,
        allKeywordsPreselected: this.params.allKeywordsPreselected
      },
      {
        onStateChanged: (params) => {
          this.handleExerciseStateChanged(params);
        }
      }
    );

    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-grid-view-content');

    // Title screen if set
    if (this.params.titleScreen) {
      this.intro = document.createElement('div');
      this.intro.classList.add('h5p-grid-view-content-intro');

      this.startScreen = new MediaScreen({
        id: 'start',
        contentId: Globals.get('contentId'),
        introduction: this.params.titleScreen.titleScreenIntroduction,
        medium: this.params.titleScreen.titleScreenMedium,
        buttons: [
          { id: 'start', text: Dictionary.get('l10n.start') }
        ],
        a11y: {
          screenOpened: Dictionary.get('a11y.startScreenWasOpened')
        }
      }, {
        onButtonClicked: () => {
          this.handleTitleScreenClosed();
        }
      });

      this.intro.append(this.startScreen.getDOM());

      this.dom.append(this.intro);
    }

    this.main = document.createElement('div');
    this.main.classList.add('h5p-grid-view-content-main');
    this.dom.append(this.main);

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
          active: true,
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
    this.main.append(this.toolbar.getDOM());

    this.messageBoxIntroduction = new MessageBox();
    // this.messageBoxIntroduction.hide();
    this.main.appendChild(this.messageBoxIntroduction.getDOM());

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
    this.handleTagSelectorClicked({ active: true });
    this.main.append(this.tagSelector.getDOM());

    // Pool of contents
    this.poolList = new CardsList(
      { contents: this.pool.getContents() },
      {
        onCardClicked: (params) => {
          this.handleCardClicked(params);
        }
      }
    );
    this.main.append(this.poolList.getDOM());

    this.messageBoxHint = new MessageBoxHint();
    this.messageBoxHint.hide();
    this.main.append(this.messageBoxHint.getDOM());

    if (this.intro) {
      this.main.classList.add('display-none');
    }

    this.exerciseOverlay = new ExerciseOverlay({}, {
      onClosed: () => {
        this.handleExerciseClosed();
      }
    });
    this.dom.append(this.exerciseOverlay.getDOM());

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
    this.updateMessageBoxHint();

    Globals.get('resize')();
  }

  /**
   * Update message for introduction.
   */
  updateMessageBox() {
    let html;

    if (this.mode === CardsList.MODE['filter']) {
      html = this.params.introductionTexts.introFilter;
    }
    else if (this.mode === CardsList.MODE['reorder']) {
      html = this.params.introductionTexts.introReorder;
    }
    else if (this.mode === CardsList.MODE['view']) {
      html = this.params.introductionTexts.introView;
    }

    html = (html || '').trim();

    if (html.length) {
      this.messageBoxIntroduction.setText(html);
      this.messageBoxIntroduction.show();
    }
    else {
      this.messageBoxIntroduction.hide();
    }
  }

  /**
   * Update message.
   */
  updateMessageBoxHint() {
    if (this.mode === CardsList.MODE['filter']) {
      const numberCardsFiltered = Object.values(this.pool.getContents())
        .filter((content) => content.isFiltered).length;

      if (numberCardsFiltered === 0) {
        this.messageBoxHint.setText(Dictionary.get('l10n.noCardsFilter'));
        this.messageBoxHint.show();
      }
      else {
        this.messageBoxHint.hide();
      }
    }
    else {
      const numberCardsSelected = Object.values(this.pool.getContents())
        .filter((content) => content.isSelected).length;

      if (numberCardsSelected === 0) {
        this.messageBoxHint.setText(Dictionary.get('l10n.noCardsSelected'));
        this.messageBoxHint.show();
      }
      else {
        this.messageBoxHint.hide();
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
      return;
    }

    const content = this.pool.getContent(params.id);

    this.exerciseOverlay.setH5PContent(content.contentInstance.getDOM());
    this.exerciseOverlay.setTitle(
      content?.label || content?.contentInstance?.params?.metadata?.title || ''
    );
    this.exerciseOverlay.show();

    content.contentInstance.setState(Globals.get('states')['viewed']);

    // Keep track to give back focus later
    this.currentCardId = params.id;

    window.requestAnimationFrame(() => {
      Globals.get('resize')();
    });
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

    this.updateMessageBoxHint();

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

  /**
   * Handle title screen closed.
   */
  handleTitleScreenClosed() {
    this.main.classList.remove('display-none');
    this.toolbar.focusButton('filter');

    Globals.get('resize')();
  }

  /**
   * Handle exercise state changed.
   *
   * @param {object} [params={}] Parameters.
   * @param {string} params.id Subcontent id of exercise.
   * @param {number} params.state State id.
   */
  handleExerciseStateChanged(params = {}) {
    if (typeof params.id !== 'string' || typeof params.state !== 'number') {
      return;
    }

    this.pool.setStatus(params.id, params.state);
    this.poolList.setStatus(params.id, params.state);
  }

  /**
   * Handle exercise closed.
   */
  handleExerciseClosed() {
    this.exerciseOverlay.hide();

    // Give focus back to previously focussed card
    this.poolList.focusCard(this.currentCardId);
  }
}
