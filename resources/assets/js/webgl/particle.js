import vertexShader from './shaders/vertexshader.vert';
import fragmentShader from './shaders/fragmentshader.frag';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass';
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js';
import * as dat from 'dat.gui';

export default class Particle {
  constructor(stage) {
    this.rotationPower = 0.01;
    this.rotationPowerObj = { value: 0.0 };
    this.duration = 4.0;
    this.ease = 'none';
    this.vertexNum = 1200;
    this.stage = stage;
    this.maxOffsetRatioValue = 0.3;
    this.minDurationRatioValue = 0.3;
    this.particleMoveSpeed = 0.01;
    this.particleRange = 0.1;
    this.textureRadius = 30;
    this.fogStart = 2.0;
    this.fogEnd = 5.8;
    this.particleAnimationRange = 0.30;

    this.fogCurrentColor = { value: null };
    this.fogColorPallet = {
      x: '#0099ff',
      y: '#ff00a6',
      z: '#ffcd00',
    };
    this.fogCurrentColor.value = this.fogColorPallet.x;

    this.currentColor = { value: null };
    this.colorPallet = {
      x: '#2dabff',
      y: '#ff5ac6',
      z: '#ffe88e',
    };
    this.currentColor.value = this.colorPallet.x;

    this.bloom = {
      strengh: 2.0,
      radius: 0.8,
      threshold: 0.3,
    }

    this.isAnimation = false;

    this.composer = new EffectComposer(this.stage.renderer);
    this.UnrealBloomPass = new UnrealBloomPass(new THREE.Vector2(this.stage.width, this.stage.height), 0.0, 1.4, 0.0);
    this.composer.renderToScreen = true;
    this.composer.addPass(new RenderPass(this.stage.scene, this.stage.camera));
    this.composer.addPass(this.UnrealBloomPass);
  }

  init() {
    this._setMesh();
    this._setGui();
  }

  _getGeometryPosition(geometry) {
    const material = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geometry, material);
    const sampler = new MeshSurfaceSampler(mesh).build();
    const particlesPosition = new Float32Array(this.vertexNum * 3);
    for (let i = 0; i < this.vertexNum; i++) {
      const newPosition = new THREE.Vector3();
      const normal = new THREE.Vector3();

      sampler.sample(newPosition, normal);
      particlesPosition.set([newPosition.x, newPosition.y, newPosition.z], i * 3);
    }

    return particlesPosition;
  }

  _createTexture() {
    const size = 60;
    this.dpr = window.devicePixelRatio;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = size * this.dpr;
    this.canvas.height = size * this.dpr;
    this.ctx.save();
    this.ctx.scale(this.dpr, this.dpr);
    this.ctx.restore();
    this.canvas.style.width = size + 'px';
    this.canvas.style.height = size + 'px';
    this._canvasTextureUpdate();

    this.texture = new THREE.Texture(this.canvas);
    return this.texture;
  }

  _canvasTextureUpdate() {
    this.ctx.beginPath();
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = this.currentColor.value;
    this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2, this.textureRadius, 0, Math.PI * 2);
    this.ctx.fill();
  }

  _setMesh() {
    const geometry = new THREE.BufferGeometry();
    const firstPos = this._getGeometryPosition(new THREE.SphereBufferGeometry(1, 32, 32).toNonIndexed());
    const secPos = this._getGeometryPosition(new THREE.ConeBufferGeometry(1.0, 1.8).toNonIndexed());
    const thirdPos = this._getGeometryPosition(new THREE.IcosahedronBufferGeometry(1.1, 0).toNonIndexed());
    const material = new THREE.RawShaderMaterial({
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      uniforms: {
        fogStart: { type: "f", value: this.fogStart },
        fogEnd: { type: "f", value: this.fogEnd },
        fogColor: { type: "v3", value: new THREE.Color(this.fogCurrentColor.value) },
        u_switch_01: { type: "f", value: 1.0 },
        u_switch_02: { type: "f", value: 0.0 },
        u_switch_03: { type: "f", value: 0.0 },
        u_time: { type: "f", value: 0.0 },
        u_particle_range: { type: "f", value: 0.05 },
        u_particle_animation_range: { type: "f", value: this.particleAnimationRange },
        u_animationRange: { type: "f", value: 0.0 },
        u_texture: { type: "t", value: this._createTexture() },
        u_op: { type: "f", value: 0.0 },
        maxOffsetRatio: { type: "f", value: this.maxOffsetRatioValue },
        minDurationRatio: { type: "f", value: this.minDurationRatioValue },
        ePosition: { type: "v3", value: new THREE.Vector3(this.stage.cameraParam.x, this.stage.cameraParam.y, this.stage.cameraParam.z) },
      },
      depthTest: false,
      transparent: true,
      blending: THREE.AdditiveBlending,
    });

    const vertexIndex = [];
    const randomValue = [];
    const phaseValue = [];

    for (let i = 0; i < this.vertexNum; i++) {
      vertexIndex.push(i);
      phaseValue.push((Math.random() - 0.5) * 2.0);
      randomValue.push(Math.random(), Math.random(), Math.random(), Math.random());
    }

    geometry.setAttribute("vertexIndex", new THREE.BufferAttribute(new Float32Array(vertexIndex), 1));
    geometry.setAttribute("phaseValue", new THREE.BufferAttribute(new Float32Array(phaseValue), 1));
    geometry.setAttribute("randomValue", new THREE.BufferAttribute(new Float32Array(randomValue), 4));
    geometry.setAttribute("position", new THREE.BufferAttribute(firstPos, 3));
    geometry.setAttribute("secPosition", new THREE.BufferAttribute(secPos, 3));
    geometry.setAttribute("thirdPosition", new THREE.BufferAttribute(thirdPos, 3));

    this.mesh = new THREE.Points(geometry, material);

    this.group = new THREE.Group();
    this.group.add(this.mesh);

    this.stage.scene.add(this.group);
  }

  _setBloom() {
    gsap.to(this.UnrealBloomPass, {
      duration: this.duration / 2.0,
      ease: 'power2.inOut',
      strength: this.bloom.strengh,
    }).eventCallback('onComplete', () => {
      gsap.to(this.UnrealBloomPass, {
        duration: this.duration / 2.0,
        ease: 'power2.inOut',
        strength: 0.0,
      })
    });
  }

  _setDiffuse() {
    gsap.to(this.mesh.material.uniforms.u_animationRange, {
      duration: this.duration / 2.0,
      ease: 'none',
      value: 1.0
    }).eventCallback('onComplete', () => {
      gsap.to(this.mesh.material.uniforms.u_animationRange, {
        duration: this.duration / 2.0,
        ease: 'none',
        value: 0.0
      })
    });
  }

  _disable() {
    this.isAnimation = true;
    setTimeout(() => {
      this.isAnimation = false;
    }, this.duration * 1000);
  }

  _setLoop(number) {
    this._disable();
    this._setBloom();
    this._setDiffuse();

    switch (number) {
      case 0:
        gsap.to(this.mesh.material.uniforms.u_switch_01, {
          duration: this.duration,
          ease: this.ease,
          value: 1.0
        });
        gsap.to(this.mesh.material.uniforms.u_switch_02, {
          duration: this.duration,
          ease: this.ease,
          value: 0.0
        });
        gsap.to(this.mesh.material.uniforms.u_switch_03, {
          duration: this.duration,
          ease: this.ease,
          value: 0.0
        });
        gsap.to(this.currentColor, {
          duration: this.duration,
          ease: 'power2.inOut',
          value: this.colorPallet.x,
        });
        gsap.to(this.fogCurrentColor, {
          duration: this.duration,
          ease: 'power2.inOut',
          value: this.fogColorPallet.x,
        });
        break;
      case 1:
        gsap.to(this.mesh.material.uniforms.u_switch_01, {
          duration: this.duration,
          ease: this.ease,
          value: 0.0
        });
        gsap.to(this.mesh.material.uniforms.u_switch_02, {
          duration: this.duration,
          ease: this.ease,
          value: 1.0
        });
        gsap.to(this.mesh.material.uniforms.u_switch_03, {
          duration: this.duration,
          ease: this.ease,
          value: 0.0
        });
        gsap.to(this.currentColor, {
          duration: this.duration,
          ease: 'power2.inOut',
          value: this.colorPallet.y,
        });
        gsap.to(this.fogCurrentColor, {
          duration: this.duration,
          ease: 'power2.inOut',
          value: this.fogColorPallet.y,
        });
        break;
      case 2:
        gsap.to(this.mesh.material.uniforms.u_switch_01, {
          duration: this.duration,
          ease: this.ease,
          value: 0.0
        });
        gsap.to(this.mesh.material.uniforms.u_switch_02, {
          duration: this.duration,
          ease: this.ease,
          value: 0.0
        });
        gsap.to(this.mesh.material.uniforms.u_switch_03, {
          duration: this.duration,
          ease: this.ease,
          value: 1.0
        });
        gsap.to(this.currentColor, {
          duration: this.duration,
          ease: 'power2.inOut',
          value: this.colorPallet.z,
        });
        gsap.to(this.fogCurrentColor, {
          duration: this.duration,
          ease: 'power2.inOut',
          value: this.fogColorPallet.z,
        });
        break;
    }
  }

  _setGui() {
    const parameter = {
      fogStart: this.fogStart,
      fogEnd: this.fogEnd,
      fogColor01: this.fogColorPallet.x,
      fogColor02: this.fogColorPallet.y,
      fogColor03: this.fogColorPallet.z,
      duration: this.duration,
      particleMoveSpeed: this.particleMoveSpeed,
      particleRange: this.particleRange,
      particleAnimationRange: this.particleAnimationRange,
      rotation: this.rotationPower,
      maxOffsetRatioValue: this.maxOffsetRatioValue,
      minDurationRatioValue: this.minDurationRatioValue,
      bloomStrength: this.bloom.strengh,
      bloomRadius: this.bloom.radius,
      bloomThreshold: this.bloom.threshold,
      colorPalletPink: this.colorPallet.x,
      colorPalletGreen: this.colorPallet.y,
      colorPalletBlue: this.colorPallet.z,
      bgColor: this.stage.renderParam.clearColor,
    };
    const gui = new dat.GUI();
    gui.add(parameter, "fogStart", -10.0, 10.0, 0.01)
      .name("fogStart")
      .onChange((value) => {
        this.mesh.material.uniforms.fogStart.value = value;
      });
    gui.add(parameter, "fogEnd", 0.0, 20.0, 0.01)
      .name("fogEnd")
      .onChange((value) => {
        this.mesh.material.uniforms.fogEnd.value = value;
      });
    gui.addColor(parameter, "fogColor01")
      .name("fog color 1")
      .onChange((value) => {
        this.fogColorPallet.x = value;
      });
    gui.addColor(parameter, "fogColor02")
      .name("fog color 2")
      .onChange((value) => {
        this.fogColorPallet.y = value;
      });
    gui.addColor(parameter, "fogColor03")
      .name("fog color 3")
      .onChange((value) => {
        this.fogColorPallet.z = value;
      });
    gui.add(parameter, "duration", 1.0, 5.0, 0.01)
      .name("particleDuration")
      .onChange((value) => {
        this.duration = value;
      });
    gui.add(parameter, "particleAnimationRange", 0.0, 0.5, 0.01)
      .name("particleAnimationRange")
      .onChange((value) => {
        this.mesh.material.uniforms.u_particle_animation_range.value = value;
      });
    gui.add(parameter, "particleRange", 0.0, 0.2, 0.01)
      .name("particleMoveRange")
      .onChange((value) => {
        this.mesh.material.uniforms.u_particle_range.value = value;
      });
    gui.add(parameter, "particleMoveSpeed", 0.0, 0.016, 0.0001)
      .name("particleMoveSpeed")
      .onChange((value) => {
        this.particleMoveSpeed = value;
      });
    gui.add(parameter, "rotation", -0.02, 0.02, 0.001)
      .name("rotationPower")
      .onChange((value) => {
        this.rotationPower = value;
      });
    gui.add(parameter, "maxOffsetRatioValue", 0.0, 1.0, 0.01)
      .name("maxOffsetRatioValue")
      .onChange((value) => {
        this.mesh.material.uniforms.maxOffsetRatio.value = value;
      });
    gui.add(parameter, "minDurationRatioValue", 0.0, 1.0, 0.001)
      .name("minDurationRatioValue")
      .onChange((value) => {
        this.mesh.material.uniforms.minDurationRatio.value = value;
      });
    gui.add(parameter, "bloomStrength", 0.0, 3.0, 0.1)
      .name("bloomStrength")
      .onChange((value) => {
        this.bloom.strengh = value;
      });
    gui.add(parameter, "bloomRadius", 0.0, 1.0, 0.0001)
      .name("bloomRadius")
      .onChange((value) => {
        this.bloom.radius = value;
      });
    gui.add(parameter, "bloomThreshold", 0.0, 1.0, 0.0001)
      .name("bloomThreshold")
      .onChange((value) => {
        this.bloom.threshold = value;
      });
    gui.addColor(parameter, "colorPalletPink")
      .name("color pallet 1")
      .onChange((value) => {
        this.colorPallet.x = value;
      });
    gui.addColor(parameter, "colorPalletGreen")
      .name("color pallet 2")
      .onChange((value) => {
        this.colorPallet.y = value;
      });
    gui.addColor(parameter, "colorPalletBlue")
      .name("color pallet 3")
      .onChange((value) => {
        this.colorPallet.z = value;
      });
    gui.addColor(parameter, "bgColor")
      .name("bg color")
      .onChange((value) => {
        this.stage.renderer.setClearColor(new THREE.Color(value));
      });
    gui.close();
  }

  _render(number) {
    this._canvasTextureUpdate();
    this.texture.needsUpdate = true;
    this.UnrealBloomPass.radius = this.bloom.radius;
    this.UnrealBloomPass.threshold = this.bloom.threshold;
    this.composer.render();
    this.mesh.material.uniforms.u_time.value += this.particleMoveSpeed;
    this.group.rotation.x += this.rotationPowerObj.value;
    this.group.rotation.y += this.rotationPowerObj.value;

    if (!this.isAnimation) {
      switch (number) {
        case 0:
          this.currentColor.value = this.colorPallet.x;
          this.fogCurrentColor.value = this.fogColorPallet.x;
          break;
        case 1:
          this.currentColor.value = this.colorPallet.y;
          this.fogCurrentColor.value = this.fogColorPallet.y;
          break;
        case 2:
          this.currentColor.value = this.colorPallet.z;
          this.fogCurrentColor.value = this.fogColorPallet.z;
          break;
      }
    }
    this.mesh.material.uniforms.fogColor.value = new THREE.Color(this.fogCurrentColor.value);
  }

  onResize() {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    this.composer.setSize(windowWidth, windowHeight);
  }

  onOpenning() {
    gsap.to(this.mesh.material.uniforms.u_op, {
      duration: this.duration,
      delay: 0.5,
      ease: 'power2.inOut',
      value: 1.0
    });
    gsap.to(this.rotationPowerObj, {
      duration: this.duration,
      delay: 0.5,
      ease: 'power2.inOut',
      value: this.rotationPower,
    });
  }

  onRaf(number) {
    this._render(number);
  }
}