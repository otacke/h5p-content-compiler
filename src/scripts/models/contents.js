import Dictionary from '@services/dictionary';
import Util from '@services/util';
import ContentInstance from '@models/content-instance';

export default class Contents {

  constructor(params = {}, callbacks = {}) {
    this.params = Util.extend({
      contents: []
    }, params);

    this.callbacks = Util.extend({
      onStateChanged: () => {}
    }, callbacks);

    this.contents = {};

    this.params.contents.forEach((contentParams) => {
      this.addContent(contentParams);
    });
  }

  /**
   * Add content that has already been created.
   *
   * @param {string} id Id of content.
   * @param {object} content Content that has already been created.
   */
  addContentReady(id, content) {
    this.contents[id] = content;
  }

  /**
   * Add content.
   *
   * @param {object} [params={}] Parameters.
   * @param {string} [params.label] Content label if set in editor.
   * @param {string} [params.introduction] Introduction if set in editor.
   * @param {object} params.contentType Content type parameters.
   * @param {string} [params.keywords] Keywords delimited by , if set in editor.
   */
  addContent(params = {}) {
    if (!params.contentType?.subContentId) {
      return;
    }

    const label = (!params.label && !params.image && !params.introduction) ?
      (
        params.contentType.metadata?.title ||
        Dictionary.get('l10n.untitledContent')
      ) :
      params.label;
    const introduction = params.introduction || '';
    const contentInstance = new ContentInstance(
      params.contentType,
      {
        onStateChanged: (state) => {
          this.callbacks.onStateChanged({
            id: params.contentType.subContentId,
            state: state
          });
        }
      }
    );

    const keywords = params.keywords
      ?.split?.(',')
      .map((keyword) => keyword.trim())
      .filter((keyword) => keyword !== '');

    const content = {
      ...(label && {label: label}),
      ...(params.image && {image: params.image}),
      introduction: introduction,
      contentInstance: contentInstance,
      keywords: keywords,
      visuals: params.visuals,
      isSelected: false, // TODO: Previous state
      isFiltered: this.params.allKeywordsPreselected // TODO: Previous state
    };

    this.contents[params.contentType.subContentId] = content;
  }

  /**
   * Get content by id.
   *
   * @param {string} id Id for selection.
   * @returns {object|null} Content object.
   */
  getContent(id) {
    if (typeof id !== 'string') {
      return null;
    }

    return this.contents[id];
  }

  /**
   * Get content instance DOM by id.
   *
   * @param {string} id Id for selection.
   * @returns {HTMLElement|null} Content instance DOM.
   */
  getContentDOM(id) {
    if (typeof id !== 'string') {
      return null;
    }

    return this.contents[id].contentInstance.instanceDOM;
  }

  /**
   * Remove content by id.
   *
   * @param {string} id Id for removal.
   */
  removeContent(id) {
    if (typeof id !== 'string') {
      return;
    }

    delete this.contents[id];
  }

  /**
   * Get all contents.
   *
   * @returns {object} Content objects.
   */
  getContents() {
    return this.contents;
  }

  /**
   * Set content selected.
   *
   * @param {string} id Content id.
   * @param {boolean} state Selected state.
   */
  setSelected(id, state) {
    if (typeof id !== 'string' || typeof state !== 'boolean') {
      return;
    }

    this.contents[id].isSelected = state;
  }

  /**
   * State exercise state.
   *
   * @param {string} id Subcontent id of exercise.
   * @param {number} state State id.
   */
  setStatus(id, state) {
    if (typeof id !== 'string' || typeof state !== 'number') {
      return;
    }

    this.contents[id].statusCode = state;
  }

  /**
   * Set filtered.
   *
   * @param {string[]} filteredTexts Filtered keywords.
   */
  setFiltered(filteredTexts) {
    Object.values(this.contents).forEach((content) => {
      content.isFiltered = content.keywords
        .some((keyword) => filteredTexts.includes(keyword));
    });
  }
}
