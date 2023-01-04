import Util from '@services/util';
import Globals from '@services/globals';
export default class ContentInstance {

  constructor(params = {}) {
    this.params = Util.extend({
    }, params);

    this.instance = undefined;
    this.isAttached = false;

    this.instanceDOM = document.createElement('div');
    this.instanceDOM.classList.add('h5p-grid-view-content-instance');

    this.initialize();

    this.reset();
  }

  /**
   * Get instance DOM.
   *
   * @returns {HTMLElement} Instance DOM.
   */
  getDOM() {
    return this.instanceDOM;
  }

  /**
   * Initialize.
   */
  initialize() {
    if (this.instance === null || this.instance) {
      return; // Only once, please
    }

    const machineName = this.params.contentType?.library?.split?.(' ')[0];

    if (machineName === 'H5P.Video') {
      this.params.params.visuals.fit = (
        this.params.params.sources.length && (
          this.params.params.sources[0].mime === 'video/mp4' ||
          this.params.params.sources[0].mime === 'video/webm' ||
          this.params.params.sources[0].mime === 'video/ogg'
        )
      );
    }

    if (machineName === 'H5P.Audio') {
      if (this.params.params.playerMode === 'full') {
        this.params.params.fitToWrapper = true;
      }
    }

    this.instance = H5P.newRunnable(
      this.params,
      Globals.get('contentId'),
      undefined,
      true,
      {} // TODO: Previous state
    );

    if (!this.instance) {
      return;
    }

    // Resize parent when children resize
    Util.bubbleUp(this.instance, 'resize', Globals.get('mainInstance'));

    // Resize children to fit inside parent
    Util.bubbleDown(Globals.get('mainInstance'), 'resize', [this.instance]);
  }

  /**
   * Attach instance to DOM.
   */
  attachInstance() {
    if (!this.instance) {
      return; // No instance to attach
    }

    if (this.isAttached) {
      return; // Already attached. Listeners would go missing on re-attaching.
    }

    this.instance.attach(H5P.jQuery(this.instanceDOM));

    if (this.instance?.libraryInfo.machineName === 'H5P.Audio') {
      if (!!window.chrome) {
        this.instance.audio.style.height = '54px';
      }
    }

    this.isAttached = true;
  }

  /**
   * Reset.
   */
  reset() {
    if (!this.instance) {
      return; // No instance to reset
    }

    /*
     * If not attached yet, some contents can fail (e. g. CP), but contents
     * that are not attached never had a previous state change, so okay
     */
    if (this.isAttached) {
      this.instance?.resetTask?.();
    }

    // iOS doesn't feature window.requestIdleCallback
    const callback = window.requestIdleCallback ?? window.requestAnimationFrame;
    callback(() => {
      this.observer = this.observer || new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.observer.unobserve(this.instanceDOM);

          this.handleViewed();
        }
      }, {
        root: document.documentElement,
        threshold: 0
      });
      this.observer.observe(this.instanceDOM);
    });
  }

  /**
   * Handle viewed.
   */
  handleViewed() {
    this.attachInstance();

    window.requestAnimationFrame(() => {
      Globals.get('resize')();
    });
  }
}
