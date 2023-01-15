export default class Screenreader {

  static getDOM() {
    return Screenreader.dom;
  }

  static setClass(className) {
    if (typeof className !== 'string') {
      return;
    }
    Screenreader.dom.style.height = '';
    Screenreader.dom.style.overflow = '';
    Screenreader.dom.style.position = '';
    Screenreader.dom.style.textIndent = '';
    Screenreader.dom.style.top = '';
    Screenreader.dom.style.width = '';

    Screenreader.dom.classList = className;
  }

  static read(text) {
    console.log(text);

    if (Screenreader.readText) {
      const lastChar = Screenreader.readText
        .substring(Screenreader.readText.length - 1);

      Screenreader.readText = [
        `${Screenreader.readText}${lastChar === '.' ? '' : '.'}`,
        text
      ].join(' ');
    }
    else {
      Screenreader.readText = text;
    }

    Screenreader.dom.innerText = Screenreader.readText;

    window.clearTimeout(Screenreader.timeout);
    Screenreader.timeout = window.setTimeout(function () {
      Screenreader.readText = null;
      Screenreader.dom.innerText = '';
    }, 100);
  }
}

Screenreader.dom = document.createElement('div');
Screenreader.dom.setAttribute('aria-live', 'polite');
Screenreader.dom.style.height = '1px';
Screenreader.dom.style.overflow = 'hidden';
Screenreader.dom.style.position = 'absolute';
Screenreader.dom.style.textIndent = '1px';
Screenreader.dom.style.top = '-1px';
Screenreader.dom.style.width = '1px';

Screenreader.readText = null;

Screenreader.timeout = null;
