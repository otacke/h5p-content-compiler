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
      sample: true,
      contents: [],
      behaviour: {
        sample: 'Sample behaviour'
      },
      l10n: {
        selected: 'selected',
        statusNone: '',
        statusCompleted: 'completed',
        noCardsFilter: 'The keywords that you chose do not match any content.',
        noCardsSelected: 'You have not selected any content.'
      },
      a11y: {
        sample: 'Sample a11y'
      }
    }, params);

    this.contentId = contentId;
    this.extras = extras;

    Globals.set('contentId', this.contentId);
    Globals.set('mainInstance', this);
    Globals.set('resize', () => {
      this.trigger('resize');
    });

    // TODO: Sanitize contents

    // Fill dictionary
    Dictionary.fill({ l10n: this.params.l10n, a11y: this.params.a11y });

    this.previousState = extras?.previousState || {};

    const defaultLanguage = extras?.metadata?.defaultLanguage || 'en';
    this.languageTag = Util.formatLanguageCode(defaultLanguage);

    this.buildDOM();
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
   * Build main DOM.
   */
  buildDOM() {
    this.dom = document.createElement('div');
    this.dom.classList.add('h5p-grid-view-main');

    this.content = new Content({
      contents: this.params.contents
    });
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

/** @constant {string} Default description */
GridView.DEFAULT_DESCRIPTION = 'Grid View';
