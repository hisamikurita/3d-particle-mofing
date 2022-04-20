import { gsap } from 'gsap';
const EventEmitter = require('eventemitter3')

export default class Slider extends EventEmitter {
  constructor(option) {
    super();

    this.previousIndex = 0;
    this.activeIndex = 0;
    this.slideLength = option.length;
    this.allDuration = option.speed || 5.0;
    this.sliderAnimation = option.autoPlay ? gsap.to(
      {},
        {
          ease: "none",
          duration: this.allDuration,
          repeat: -1.0
        }
      )
      .eventCallback("onRepeat", () => {
        this.autoChange();
      }) : null;
  }

  change(number) {
    this.previousIndex = this.activeIndex;
    this.activeIndex = number;

    this.emit('change');
  }

  autoChange() {
    this.next();
  }

  getNext(number = this.activeIndex) {
    if (number >= this.slideLength - 1) {
      return number = 0;
    } else {
      return number += 1.0;
    }
  }

  getPrev(number = this.activeIndex) {
    if (number < 1.0) {
      return number = this.slideLength - 1;
    } else {
      return number += -1.0;
    }
  }

  next() {
    const number = this.getNext();
    this.change(number);
  }

  prev() {
    const number = this.getPrev();
    this.change(number);
  }
}
