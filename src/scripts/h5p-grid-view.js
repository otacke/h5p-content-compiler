import Util from '@services/util';
import Dictionary from '@services/dictionary';
import Globals from '@services/globals';
import Content from '@components/content';
import '@styles/h5p-grid-view.scss';

export default class GridView extends H5P.EventDispatcher {
  /**
   * @class
   * @param {object} params Parameters passed by the editor.
   * @param {number} contentId Content's id.
   * @param {object} [extras] Saved state, metadata, etc.
   */
  constructor(params, contentId, extras = {}) {
    super();

    // Sanitize parameters
    this.params = Util.extend({
      introductionTexts: {},
      contents: [],
      visuals: {
        cardWidth: '13rem',
        imageSizing: 'custom',
        customRatioWidth: 16,
        customRatioHeight: 9,
        introClamp: 'unset'
      },
      behaviour: {
        allKeywordsPreselected: true
      },
      l10n: {
        start: 'Start',
        selected: 'selected',
        statusUnstarted: '',
        statusViewed: 'viewed',
        statusCompleted: 'completed',
        statusCleared: 'cleared',
        noCardsFilter: 'You need to select keywords in order to see contents to select from.',
        noCardsSelected: 'You have not selected any content.',
        untitledContent: 'Untitled Content'
      },
      a11y: {
        exerciseLabel: '. Exercise: @label',
        sample: 'Sample a11y'
      }
    }, params);

    this.contentId = contentId;
    this.extras = extras;

    Globals.set('contentId', this.contentId);
    Globals.set('mainInstance', this);
    Globals.set('states', GridView.STATES);
    Globals.set('modes', GridView.MODES);
    Globals.set('resize', () => {
      this.trigger('resize');
    });

    // TODO: Sanitize contents
    this.params.contents = this.params.contents.map((content) => {
      const amendedContent = content;
      amendedContent.visuals = this.params.visuals;

      return amendedContent;
    });

    // Fill dictionary
    Dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    this.previousState = extras?.previousState || {};

    const defaultLanguage = extras?.metadata?.defaultLanguage || 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    this.buildDOM();

    this.setCustomCSSProperties();
  }

  /**
   * Attach library to wrapper.
   *
   * @param {H5P.jQuery} $wrapper Content's container.
   */
  attach($wrapper) {
    $wrapper.get(0).classList.add('h5p-grid-view');
    $wrapper.get(0).appendChild(this.dom);
  }

  /**
   * Set custom CSS properties.
   */
  setCustomCSSProperties() {
    if (this.params.visuals.cardWidth.match(/^\d+(?:\.\d+)?(?: )?$/)) {
      this.params.visuals.cardWidth = `${this.params.visuals.cardWidth}px`;
    }
    this.dom.style.setProperty('--card-width', this.params.visuals.cardWidth);

    this.dom.style.setProperty(
      '--card-image-ratio-width', this.params.visuals.customRatioWidth
    );

    this.dom.style.setProperty(
      '--card-image-ratio-height', this.params.visuals.customRatioHeight
    );

    this.dom.style.setProperty(
      '--card-introduction-clamp', this.params.visuals.introClamp
    );
  }

  /**
   * Build main DOM.
   */
  buildDOM() {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-grid-view-main');

    this.content = new Content(
      {
        allKeywordsPreselected: this.params.behaviour.allKeywordsPreselected,
        contents: this.params.contents,
        introductionTexts: this.params.introductionTexts,
        ...(
          this.params.showTitleScreen &&
          { titleScreen: this.params.titleScreen }
        )
      },
      {
        resize: () => {
          this.trigger('resize');
        }
      }
    );
    this.dom.append(this.content.getDOM());
  }

  /**
   * Get task title.
   *
   * @returns {string} Title.
   */
  getTitle() {
    // H5P Core function: createTitle
    return H5P.createTitle(
      this.extras?.metadata?.title || GridView.DEFAULT_DESCRIPTION
    );
  }

  /**
   * Get description.
   *
   * @returns {string} Description.
   */
  getDescription() {
    return GridView.DEFAULT_DESCRIPTION;
  }
}

/** @constant {string} DEFAULT_DESCRIPTION Default description. */
GridView.DEFAULT_DESCRIPTION = 'Grid View';

/** @constant {string} DEFAULT_CARD_IMAGE_RATIO Default ratio. */
GridView.DEFAULT_CARD_IMAGE_RATIO = '16/9';

/** @constant {object} STATES States lookup */
GridView.STATES = {
  unstarted: 0,
  viewed: 1,
  completed: 2,
  cleared: 3
};

/** @constant {object} MODES Modes lookup */
GridView.MODES = {
  filter: 0,
  reorder: 1,
  view: 2
};
