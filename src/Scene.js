import * as THREE from 'three';

// Importando os objetos modulares
import { createBoxingRing } from '../objects/BoxingRing.js';
import { createBarbell } from '../objects/Barbells.js';
import { createBenchPress } from '../objects/BenchPress.js';
import { createPunchingDummy } from '../objects/Dummy.js';
import { createPunchingBagWall } from '../objects/PunchingBag.js';
import { createSpotlight } from '../objects/Spotlights.js';

export class GymScene {
    constructor(scene) {
        this.scene = scene;
        
        this.initLights();
        this.initFloor();
        this.loadObjects();
    }

    initLights() {
        // Luz ambiente fraca
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambientLight);

        // Luz de preenchimento (amarelada de fundo)
        const fillLight = new THREE.PointLight(0xffaa00, 100, 40);
        fillLight.position.set(-10, 5, -10);
        this.scene.add(fillLight);
    }

    initFloor() {
        const matFloor = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.8 });
        const floorGeo = new THREE.PlaneGeometry(50, 50);
        const floorMesh = new THREE.Mesh(floorGeo, matFloor);
        floorMesh.rotation.x = -Math.PI / 2;
        floorMesh.position.y = 0; // Chão no zero
        floorMesh.receiveShadow = true;
        this.scene.add(floorMesh);
    }

    loadObjects() {
        // --- Ringue ---
        const ring = createBoxingRing();
        this.scene.add(ring);

        // --- Halteres ---
        const barbell1 = createBarbell();
        barbell1.position.set(-8, 0.2, 0); 
        barbell1.rotation.y = Math.PI / 4;
        this.scene.add(barbell1);

        const barbell2 = createBarbell();
        barbell2.position.set(-8, 0.2, 2); 
        barbell2.rotation.y = Math.PI / 6;
        this.scene.add(barbell2);

        // --- Supino ---
        const benchPress = createBenchPress();
        benchPress.scale.set(1.5, 1.5, 1.5);
        benchPress.position.set(8, 0, 0); 
        benchPress.rotation.y = -Math.PI / 2;
        this.scene.add(benchPress);

        // --- Boneco Bob ---
        const dummy = createPunchingDummy();
        dummy.position.set(8, 0, 8); 
        dummy.lookAt(0, 0, 0); 
        this.scene.add(dummy);

        // --- Saco de Pancada ---
        const punchingBagWall = createPunchingBagWall();
        punchingBagWall.position.set(-8, 0, 8);
        punchingBagWall.rotation.y = Math.PI / 4; 
        this.scene.add(punchingBagWall);

        // --- Holofotes do Ringue ---
        const offset = 4.8; 
        const baseHeight = 1;
        
        const blueCornerPos = new THREE.Vector3(-offset, baseHeight, -offset);
        const redCornerPos = new THREE.Vector3(offset, baseHeight, offset);

        // Holofote Azul
        const blueSpot = createSpotlight(0x0066ff, blueCornerPos, this.scene);
        blueSpot.position.set(-8, 10, -8);
        this.scene.add(blueSpot);

        // Holofote Vermelho
        const redSpot = createSpotlight(0xff0000, redCornerPos, this.scene);
        redSpot.position.set(8, 10, 8);
        this.scene.add(redSpot);
    }
}