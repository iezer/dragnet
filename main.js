class Slot {
    constructor(element) {
        this.element = element;
        this.value = element.dataset.value;
    }

    fill(choice) {
        this.element.textContent = '';
        this.choice = choice;
        this.choice.choose()
    }

    isOverlapping(choice) {
        const choiceBB = choice.boundingBox;
        const slotBB = this.boundingBox;

        const [left, right] = choiceBB.left < slotBB.left
            ? [choiceBB, slotBB]
            : [slotBB, choiceBB];

        const [top, bottom]  = choiceBB.top < slotBB.top
            ? [choiceBB, slotBB]
            : [slotBB, choiceBB];

        return left.right >= right.left && top.bottom >= bottom.top;
    }

    hasChoice() {
        return !!this.choice;
    }

    hasCorrectChoice() {
        return this.choice.value == this.value;
    }

    get boundingBox() {
        return this.element.getBoundingClientRect();
    }
}

class Choice {
    constructor(svg, value, x, y, onDragStart, onDragEnd) {
        this.svg = svg;
        this.value = value;
        this.x = x;
        this.y = y;
        this.color = 'black';
        this.isRendered = false;
        this.isChosen = false;
        this.element = document.createElementNS('http://www.w3.org/2000/svg','text');
        this.element.addEventListener('mousedown', downEvent => {
            if (this.isChosen) {
                return;
            }

            if (onDragStart) {
                onDragStart(downEvent, this);
            }
            if (downEvent.defaultPrevented) {
                return;
            }
            const target= document.createElement('div');
            target.style.height= '10px';
            target.style.width = '10px';
            target.style.position= 'absolute';
            target.style.border="10px solid red"
            document.querySelector('body').append(target)
            const onMouseMove = moveEvent => {  
                target.style.left =  `${moveEvent.clientX}px`;
                target.style.top =   `${moveEvent.clientY}px`;      
                this.x = moveEvent.clientX;
                this.y = moveEvent.clientY;
                this.render();
            };
            this.svg.addEventListener('mousemove', onMouseMove);

            const onMouseUp = upEvent => {
                if (onDragEnd) {
                    onDragEnd(upEvent, this);
                }
                this.svg.removeEventListener('mousemove', onMouseMove);
                this.svg.removeEventListener('mouseup', onMouseUp);
            };
            this.svg.addEventListener('mouseup', onMouseUp);
        });
    }

    render() {
        this.element.setAttribute('x', this.x - 30);
        this.element.setAttribute('y', this.y);
        this.element.style.fill = this.color;
        this.element.textContent = this.value;
        if (!this.isRendered) {
            this.svg.appendChild(this.element);
            this.isRendered = true;
        }
    }

    choose() {
        this.isChosen = true;
        this.color = 'blue';
        this.render();
    }

    get boundingBox() {
        return this.element.getBoundingClientRect();
    }
}

function start(svg) {
    let filledSlotCount = 0;
    const slots = Array.from(svg.querySelectorAll('.slot'))
    .map(s => new Slot(s));
    
    svg.setAttribute('viewBox', `0 0 ${svg.width.baseVal.value.toFixed()} ${svg.height.baseVal.value.toFixed()}`);
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', ' ')

    const choiceX = 500;
    const choiceY = 25;
    const choices = slots.map((s, i) => 
        new Choice(svg, s.value, 
                   choiceX, (choiceY * (i+1)),
                   null, (evt, choice) => {
                        const selectedSlot = slots
                                .filter(s => !s.hasChoice())
                                .find(s => s.isOverlapping(choice))
                        if (selectedSlot) {
                            selectedSlot.fill(choice);
                            filledSlotCount++;
                        }
                        if (filledSlotCount === slots.length) {
                            complete(slots);
                        }
                   }));

    for (let choice of choices) {
        choice.render();
    }
}

function complete(slots) {
    if (slots.every(s => s.hasCorrectChoice())) {
        alert("You did it!");
    } else {
        alert("Some answers were wrong...:(")
    }
}