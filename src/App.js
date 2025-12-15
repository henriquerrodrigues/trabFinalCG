import * as THREE from 'three';
import { Player } from './Player.js';
import { GymScene } from './Scene.js';
import { MikeTyson } from './MikeTyson.js';
import { AudioManager } from './AudioManager.js';

export class App {
    constructor() {
        this.init();
    }

    init() {
        // 1. Setup Básico
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x202020); 
        this.scene.fog = new THREE.Fog(0x202020, 5, 40);

        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
        
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);

        // 2. Carregar o Cenário (Academia)
        this.environment = new GymScene(this.scene);

        // 3. Instanciar Entidades Dinâmicas
        // PASSANDO COLISORES AQUI
        this.player = new Player(
            this.camera, 
            this.renderer.domElement, 
            this.scene, 
            this.environment.colliders 
        );
        
        this.mikeTyson = new MikeTyson(this.scene, this.camera);

        // ADICIONADO: Gerenciador de Áudio
        this.audioManager = new AudioManager(this.camera);

        // 4. Eventos Globais
        window.addEventListener('resize', () => this.onWindowResize(), false);
        window.addEventListener('contextmenu', (e) => e.preventDefault());

        // 5. Iniciar Loop
        this.clock = new THREE.Clock();
        this.animate();
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const time = performance.now();

        this.player.update(delta, time);
        
        if(this.mikeTyson) this.mikeTyson.update(delta);

        this.renderer.render(this.scene, this.camera);
    }
}