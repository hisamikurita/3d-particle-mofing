import { gsap } from 'gsap';
import Slider from './webgl/slider';
import Particle from './webgl/particle';
import ParticleStage from './webgl/particle-stage';

const particleStage = new ParticleStage();
particleStage.init();

const particle = new Particle(particleStage);
particle.init();

const slider = new Slider({
  length : 3,
  speed : 5,
  autoPlay : true,
})

const _raf = () => {
    particleStage.onRaf();
    particle.onRaf(slider.activeIndex);
};

gsap.ticker.add(_raf);

window.addEventListener('load', () => {
  particle.onOpenning();
});

slider.on('change',() =>{
  particle._setLoop(slider.activeIndex)
})

window.addEventListener("resize", () => {
  particleStage.onResize();
  particle.onResize();
});