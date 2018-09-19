const Dragnet = (function() {

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

function newAnswerChoice(choiceText, x, y) {
  const choiceElement = document.createElementNS("http://www.w3.org/2000/svg", 'text');
  choiceElement.textContent = choiceText;
  choiceElement.setAttribute('x', x);
  choiceElement.setAttribute('y', y);
  choiceElement.setAttribute('transform', 'matrix(1 0 0 1 0 0)');
  choiceElement.classList.add(DRAGGABLE_CLASS);

  return choiceElement;
}

function isDraggable(element) {
  return element.classList.contains(DRAGGABLE_CLASS);
}

function extractAnswerText(placeholderElement) {
  const match = ANSWER_REGEX.exec(placeholderElement.textContent);
  return match ? match[1] : undefined;
} 

function parseTransform(transformValue) {
  return transformValue.slice(7,-1).split(' ').map(parseFloat);
}

class Dragnet {
  constructor(svg, reuseAnswers = false) {
    this.answerPlaceHolderText = ANSWER_PLACEHOLDER_TEXT;
    this.labelDataAttribute = LABEL_DATA_ATTRIBUTE;
    this.draggableClass = DRAGGABLE_CLASS;

    this.svg = svg;
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
      const answer = extractAnswerText(text);
      if (! answer) { return; }

      text.textContent = this.answerPlaceHolderText;
      text.setAttribute(this.labelDataAttribute, answer);

      this.svg.appendChild(newAnswerChoice(answer, this.getX(i), this.getY(i)));
    });

    this.setupEventListeners()
  }

  setupEventListeners() {
    this.svg.addEventListener('mousedown', this.mouseDown.bind(this));
    this.svg.addEventListener('mousemove', this.mouseMove.bind(this));
    this.svg.addEventListener('mouseup', this.mouseUp.bind(this));
  }

  mouseDown(evt) {
    if (! isDraggable(evt.target)) {
      return;
    }

    this.selectedChoice = evt.target;
    this.currentX = evt.clientX;
    this.currentY = evt.clientY;
    this.currentMatrix = parseTransform(this.selectedChoice.getAttribute("transform"));

    if (this.reuseAnswers) {
      this.svg.appendChild(
        newAnswerChoice(
          this.selectedChoice.textContent, 
          this.selectedChoice.getAttribute('x'), this.selectedChoice.getAttribute('y')));
    }

  }

  mouseMove(evt) {
    if (!this.selectedChoice) { return; }

    const dx = evt.clientX - this.currentX;
    const dy = evt.clientY - this.currentY;
    this.currentMatrix[4] += dx;
    this.currentMatrix[5] += dy;
    const newMatrix = "matrix(" + this.currentMatrix.join(' ') + ")";

    this.selectedChoice.setAttribute("transform", newMatrix);
    this.currentX = evt.clientX;
    this.currentY = evt.clientY;
  }

  mouseUp(evt) {
    if (!this.selectedChoice) { return; }

    if (!this.hovered()) {
      this.resetPosition(this.selectedChoice);
    }

    if (this.allMatched()) {
      if (this.allCorrect()) {
        this.onCorrect();
      } else {
        this.onIncorrect();
      }
    }

    this.selectedChoice = null;
  }

  hovered() {
    const placeholders = Array.from(this.svg.querySelectorAll(`[${this.labelDataAttribute}]`));

    return placeholders.some(ph => detectOverlap(ph, this.selectedChoice));
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
      target.setAttribute('transform', 'matrix(1 0 0 1 0 0)');
    }
  }
};

return Dragnet;
}());