const Dragnet = (function() {

const ANSWER_REGEX = /\{(.+)\}/;
const ANSWER_PLACEHOLDER_TEXT = '--';
const LABEL_DATA_ATTRIBUTE = 'data-dragnet-label';
const ANSWER_PLACEHOLDER_CLASS = 'dragnet__placeholder';
const ANSWER_PLACEHOLDER_OPEN_CLASS = 'dragnet__placeholder-open';
const LABEL_CLASS = 'dragnet__label';
const LABEL_DRAGGABLE_CLASS = 'dragnet__label-draggable';

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
  choiceElement.classList.add(LABEL_DRAGGABLE_CLASS, LABEL_CLASS);

  return choiceElement;
}

function isDraggable(element) {
  return element.classList.contains(LABEL_DRAGGABLE_CLASS);
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
    this.answerPlaceholderText = ANSWER_PLACEHOLDER_TEXT;
    this.answerPlaceholderClass = ANSWER_PLACEHOLDER_CLASS;
    this.answerPlaceholderOpenClass = ANSWER_PLACEHOLDER_OPEN_CLASS;
    this.labelDataAttribute = LABEL_DATA_ATTRIBUTE;
    this.labelDraggableClass = LABEL_DRAGGABLE_CLASS;
    this.labelClass = LABEL_CLASS;

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

      text.textContent = this.answerPlaceholderText;
      text.setAttribute(this.labelDataAttribute, answer);
      text.classList.add(this.answerPlaceholderClass, this.answerPlaceholderOpenClass);

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

    const hoveredPlaceholder = this.getOpenHoveredPlaceholder();
    if (hoveredPlaceholder) {
      this.applyChoice(this.selectedChoice, hoveredPlaceholder);
    } else {
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

  getOpenHoveredPlaceholder() {
    return Array.from(this.svg.getElementsByClassName(this.answerPlaceholderOpenClass))
                .find(ph => detectOverlap(ph, this.selectedChoice));
  }

  applyChoice(choice, placeholder) {
    choice.classList.remove(this.labelDraggableClass);
    placeholder.classList.remove(this.answerPlaceholderOpenClass);
  }

  allMatched() {
    return this.svg.getElementsByClassName(this.answerPlaceholderOpenClass).length === 0;
  }

  allCorrect() {
    const placeholders = Array.from(this.svg.getElementsByClassName(this.answerPlaceholderClass));
    const labels = Array.from(this.svg.getElementsByClassName(this.labelClass));

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