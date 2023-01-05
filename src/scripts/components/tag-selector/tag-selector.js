import Util from '@services/util';
import Tag from './tag';
import './tag-selector.scss';

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
      tags: []
    }, params || {});

    this.callbacks = Util.extend({
    }, callbacks || {});

    this.tags = {};

    this.dom = document.createElement('div');
    this.dom.classList.add('tag-selector');

    const list = document.createElement('ul');
    list.classList.add('tag-list');
    this.dom.append(list);

    this.params.tags.forEach((tagParam) => {
      const tag = new Tag(
        {
          text: tagParam.text,
          selected: tagParam.selected
        },
        {
          onClicked: (params) => {
            this.handleTagClicked(params);
          }
        }
      );

      list.append(tag.getDOM());

      this.tags[tagParam.text] = { selected: tagParam.selected };
    });

    this.hide();
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
   * Handle tag clicked.
   *
   * @param {object} [params = {}] Parameters.
   * @param {string} params.text keyword.
   * @param {boolean} params.selected Selected state.
   */
  handleTagClicked(params = {}) {
    this.tags[params.text].selected = params.selected;

    const selectedTexts = Object.keys(this.tags).filter((text) => {
      return this.tags[text].selected;
    });

    this.callbacks.onChanged(selectedTexts);
  }
}
