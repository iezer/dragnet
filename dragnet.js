const ANSWER_REGEX = /\{(.+)\}/;
const ANSWER_PLACEHOLDER_TEXT = '--';
const LABEL_DATA_ATTRIBUTE = 'data-dragnet-label';
const DRAGGABLE_CLASS = 'dragnet__label';

function detectOverlap(elem1, elem2) {
  const pos1 = elem1.getBoundingClientRect();
  const pos2 = elem2.getBoundingClientRect();

  const [ leftPos, rightPos ] = 
    pos1.left < pos2.left ? [ pos1,  pos2 ] : [ pos2, pos1 ];

  const [ topPos, bottomPos ] = 
    pos1.top < pos2.top ? [ pos1,  pos2 ] : [ pos2, pos1 ];

  return rightPos.left <= leftPos.right && bottomPos.top <= topPos.bottom;
}


class Dragnet {
  constructor(svg, reuseAnswers = false) {
    this.svg = svg;
    this.answerRegex = ANSWER_REGEX;
    this.answerPlaceHolderText = ANSWER_PLACEHOLDER_TEXT;
    this.labelDataAttribute = LABEL_DATA_ATTRIBUTE;
    this.draggableClass = DRAGGABLE_CLASS;

    this.reuseAnswers = reuseAnswers;
  }

  getX(index) {
    return 500;
  }

  getY(index) {
    return 25 * (index + 1);
  }

  onIncorrect() {
    alert('Some answers wrong');
  }

  onCorrect() {
    alert('All answers are correct.');
  }

  parseLabels() {
    this.svg.querySelectorAll('text').forEach((text, i) => {
      const match = this.answerRegex.exec(text.textContent);
      if (!match) { return; }

      const answer = match[1];
      text.textContent = this.answerPlaceHolderText;
      text.setAttribute(this.labelDataAttribute, answer);
      this.svg.insertAdjacentHTML('beforeend', `<text transform="matrix(1 0 0 1 0 0)"
        class="${this.draggableClass}" x="${this.getX(i)}" y="${this.getY(i)}">${answer}</text>`);
    });

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.svg.addEventListener('mousedown', this.mouseDown.bind(this));
    this.svg.addEventListener('mousemove', this.mouseMove.bind(this));
    this.svg.addEventListener('mouseup', this.mouseUp.bind(this));
  }

  mouseDown(evt) {
    if (!evt.target.classList.contains(this.draggableClass)) {
      return;
    }

    if (this.reuseAnswers) {
      this.cloneElement(evt.target);
    }

    this.selectedElement = evt.target;
    this.currentX = evt.clientX;
    this.currentY = evt.clientY;
    this.currentMatrix = this.selectedElement.getAttributeNS(null, "transform").slice(7,-1).split(' ');

    for(let i=0; i < this.currentMatrix.length; i++) {
      this.currentMatrix[i] = parseFloat(this.currentMatrix[i]);
    }
  }

  mouseMove(evt) {
    if (!this.selectedElement) { return; }

    const dx = evt.clientX - this.currentX;
    const dy = evt.clientY - this.currentY;
    this.currentMatrix[4] += dx;
    this.currentMatrix[5] += dy;
    const newMatrix = "matrix(" + this.currentMatrix.join(' ') + ")";

    this.selectedElement.setAttributeNS(null, "transform", newMatrix);
    this.currentX = evt.clientX;
    this.currentY = evt.clientY;
  }

  mouseUp(evt) {
    if (!this.selectedElement) { return; }

    if (!this.hovered()) {
      this.resetPosition(this.selectedElement);
    }

    if (this.allMatched()) {
      if (this.allCorrect()) {
        this.onCorrect();
      } else {
        this.onIncorrect();
      }
    }

    this.selectedElement = null;
  }

  hovered() {
    const placeholders = Array.from(this.svg.querySelectorAll(`[${this.labelDataAttribute}]`));

    return placeholders.some(ph => detectOverlap(ph, this.selectedElement));
  }

  allMatched() {
    const placeholders = Array.from(this.svg.querySelectorAll(`[${this.labelDataAttribute}]`));
    const labels = Array.from(this.svg.querySelectorAll(`.${this.draggableClass}`));

    return placeholders.every(ph =>
      labels.some(label => detectOverlap(ph, label))
    );
  }

  allCorrect() {
    const placeholders = Array.from(this.svg.querySelectorAll(`[${this.labelDataAttribute}]`));
    const labels = Array.from(this.svg.querySelectorAll(`.${this.draggableClass}`));

    return placeholders.every(ph => {
      const correctAnswer = ph.getAttribute(this.labelDataAttribute);
      return labels.some(label => 
        label.textContent === correctAnswer && detectOverlap(ph, label)
      );
    });
  }

  resetPosition(target) {
    if (this.reuseAnswers) {
      target.parentNode.removeChild(target);
    } else {
      target.setAttributeNS(null, 'transform', 'matrix(1 0 0 1 0 0)');
    }
  }

  cloneElement(el) {
    const newEl = el.cloneNode();
    newEl.textContent = el.textContent;
    this.svg.append(newEl);
    return newEl;
  }
};
