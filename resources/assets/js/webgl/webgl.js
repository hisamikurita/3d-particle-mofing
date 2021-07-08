import Particle from './particle';
import ParticleStage from './particle-stage';

export default class Webgl {
  constructor() {
    const particleStage = new ParticleStage();
    particleStage.init();

    const particle = new Particle(particleStage);
    particle.init();

    window.addEventListener("resize", () => {
      particleStage.onResize();
      particle.onResize();
    });

    this.currentNum = 0;
    const allDuration = 5.0;

    const _raf = () => {
      window.requestAnimationFrame(() => {
        _raf();

        particleStage.onRaf();
        particle.onRaf(this.currentNum);
      });
    };
    _raf();

    const _moveChangeSlide = () => {
      if (this.currentNum > 1) {
        this.currentNum = 0;
      } else {
        this.currentNum++;
      }
    }

    const _autoChangeSlide = () => {
      this.sliderAnimation = gsap.to(
        {},
        {
          ease: "none",
          duration: allDuration,
          repeat: -1.0
        }
      )
        .eventCallback("onRepeat", () => {
          _moveChangeSlide();
          particle._setLoop(this.currentNum);
        });
    }

    window.addEventListener('load', () => {
      particle.onOpenning();
      _autoChangeSlide();
    });
  }
}