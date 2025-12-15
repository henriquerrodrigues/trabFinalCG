import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class Player {
    constructor(camera, domElement, scene) {
        this.camera = camera;
        this.scene = scene;
        
        // Posição inicial
        this.camera.position.set(0, 5, 18);
        this.camera.lookAt(0, 5, 0);

        this.controls = new PointerLockControls(camera, domElement);
        
        // Física
        this.velocity = new THREE.Vector3();
        this.direction = new THREE.Vector3();
        this.moveForward = false; this.moveBackward = false;
        this.moveLeft = false; this.moveRight = false;
        this.canJump = false; this.isRunning = false;

        // Combate
        this.punchingLeft = false;
        this.punchingRight = false;
        this.punchStartTimeLeft = 0;
        this.punchStartTimeRight = 0;
        this.punchDuration = 0.25;

        // Luvas
        this.glovesGroup = new THREE.Group(); 
        this.leftGloveMesh = null;
        this.rightGloveMesh = null;
        
        this.leftGloveBasePos = new THREE.Vector3();
        this.rightGloveBasePos = new THREE.Vector3();

        // REMOVIDO: Variáveis de rotação que causavam conflito com o pivot do modelo
        // this.leftGloveBaseRot = new THREE.Euler();
        // this.rightGloveBaseRot = new THREE.Euler();

        this.loadGloves();
        this.setupInputs();
    }

    setupInputs() {
        // ... (MANTIDO IGUAL AO ORIGINAL, OMITIDO PARA BREVIDADE) ...
        const instructions = document.getElementById('instructions');
        const counter = document.getElementById('click-counter');

        if(instructions) instructions.addEventListener('click', () => this.controls.lock());

        this.controls.addEventListener('lock', () => {
            if(instructions) instructions.style.display = 'none';
            if(window.gameActive && counter) counter.style.display = 'block';
        });

        this.controls.addEventListener('unlock', () => {
            if (!window.isInDialogue) {
                if(instructions) instructions.style.display = 'block';
            }
            if(counter) counter.style.display = 'none';
        });

        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        document.addEventListener('mousedown', (e) => {
            if (this.controls.isLocked) { 
                if (e.button === 0) this.punch('left');
                else if (e.button === 2) this.punch('right');
            }
        });
    }

    onKeyDown(event) {
        // ... (MANTIDO IGUAL AO ORIGINAL) ...
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.moveForward = true; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = true; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = true; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = true; break;
            case 'Space': if (this.canJump) { this.velocity.y += 100; this.canJump = false; } break;
            case 'ShiftLeft': case 'ShiftRight': this.isRunning = true; break;
        }
    }

    onKeyUp(event) {
        // ... (MANTIDO IGUAL AO ORIGINAL) ...
        switch (event.code) {
            case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
            case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
            case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
            case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.isRunning = false; break;
        }
    }

    loadGloves() {
        const loader = new GLTFLoader();
        
        // AJUSTE DE DISTÂNCIA:
        // Z alterado de -0.6 para -1.0 (afasta da câmera)
        // Y alterado de -0.5 para -0.6 (abaixa um pouco para compensar)
        this.glovesGroup.scale.set(0.7, 0.7, 0.7);
        this.glovesGroup.position.set(0, -0.6, -1.0); 
        this.glovesGroup.rotation.y = Math.PI;

        loader.load('assets/fbx/boxingGloves/source/Boxing gloves.glb', (gltf) => {
            // ALTERADO: Adicionamos a cena inteira (gltf.scene) em vez de partes soltas.
            // Isso preserva a orientação e escala originais do arquivo 3D.
            this.glovesGroup.add(gltf.scene);

            const meshes = [];
            gltf.scene.traverse((child) => {
                if (child.isMesh) meshes.push(child);
            });

            if (meshes.length >= 2) {
                meshes.sort((a, b) => a.position.x - b.position.x);
                
                // ALTERADO: Apenas referenciamos as meshes para animar, SEM removê-las do pai (.add remove do pai anterior)
                this.rightGloveMesh = meshes[0]; 
                this.leftGloveMesh = meshes[meshes.length - 1]; 
                
                // Salvamos a posição base relativa ao pai atual (dentro do GLTF)
                this.leftGloveBasePos.copy(this.leftGloveMesh.position);
                this.rightGloveBasePos.copy(this.rightGloveMesh.position);

                // REMOVIDO: Cópia de rotação (causava bugs visuais dependendo do modelo)
            }
        }, undefined, (error) => {
            console.error('Erro ao carregar luvas:', error);
            // Fallback visual: Adiciona cubos vermelhos se o modelo falhar
            const geo = new THREE.BoxGeometry(0.2, 0.2, 0.2);
            const mat = new THREE.MeshBasicMaterial({color: 0xff0000});
            this.glovesGroup.add(new THREE.Mesh(geo, mat));
        });

        // Garante que o grupo de luvas esteja na câmera e a câmera na cena
        this.camera.add(this.glovesGroup);
        this.scene.add(this.camera);
    }

    punch(side) {
        // ... (MANTIDO IGUAL AO ORIGINAL) ...
        const now = performance.now() / 1000;
        if (side === 'left' && !this.punchingLeft) {
            this.punchingLeft = true;
            this.punchStartTimeLeft = now;
            window.dispatchEvent(new CustomEvent('player-punch', { detail: { side: 'left' } }));
        }
        if (side === 'right' && !this.punchingRight) {
            this.punchingRight = true;
            this.punchStartTimeRight = now;
            window.dispatchEvent(new CustomEvent('player-punch', { detail: { side: 'right' } }));
        }
    }

    update(delta, time) {
        // ... (LÓGICA DE MOVIMENTO MANTIDA IGUAL AO ORIGINAL) ...
        if (this.controls.isLocked) {
            this.velocity.x -= this.velocity.x * 10.0 * delta;
            this.velocity.z -= this.velocity.z * 10.0 * delta;
            this.velocity.y -= 9.8 * 100.0 * delta;
            
            this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
            this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
            this.direction.normalize();
            
            const currentSpeed = this.isRunning ? 1000.0 : 400.0;
            if (this.moveForward || this.moveBackward) this.velocity.z -= this.direction.z * currentSpeed * delta;
            if (this.moveLeft || this.moveRight) this.velocity.x -= this.direction.x * currentSpeed * delta;
            
            this.controls.moveRight(-this.velocity.x * delta);
            this.controls.moveForward(-this.velocity.z * delta);
            this.controls.getObject().position.y += (this.velocity.y * delta);

            if (this.controls.getObject().position.y < 5) {
                this.velocity.y = 0;
                this.controls.getObject().position.y = 5;
                this.canJump = true;
                
                if (this.moveForward || this.moveBackward || this.moveLeft || this.moveRight) {
                    this.controls.getObject().position.y += Math.sin(time * (this.isRunning?0.02:0.015)) * (this.isRunning?0.8:0.5);
                }
            }
        }

        // Animação das Luvas
        if (this.leftGloveMesh && this.rightGloveMesh) {
            const now = performance.now() / 1000;
            
            // Sway das luvas (respiração)
            this.glovesGroup.position.y = -0.6 + Math.sin(time * 0.005) * 0.05;

            // Soco Esquerdo
            if (this.punchingLeft) {
                const elapsed = now - this.punchStartTimeLeft;
                const progress = elapsed / this.punchDuration;
                if (progress >= 1) {
                    this.punchingLeft = false;
                    // Reset total
                    this.leftGloveMesh.position.copy(this.leftGloveBasePos);
                } else {
                    const intensity = Math.sin(progress * Math.PI);
                    
                    // Movimento Composto (Simula arco do soco)
                    // Z: Frente (Impacto)
                    this.leftGloveMesh.position.z = this.leftGloveBasePos.z + intensity * 0.5; 
                    // X: Converge para o centro (simula mira)
                    this.leftGloveMesh.position.x = this.leftGloveBasePos.x + intensity * 0.15;
                    // Y: Leve subida (arco natural do braço)
                    this.leftGloveMesh.position.y = this.leftGloveBasePos.y + intensity * 0.05;
                }
            }

            // Soco Direito
            if (this.punchingRight) {
                const elapsed = now - this.punchStartTimeRight;
                const progress = elapsed / this.punchDuration;
                if (progress >= 1) {
                    this.punchingRight = false;
                    // Reset total
                    this.rightGloveMesh.position.copy(this.rightGloveBasePos);
                } else {
                    const intensity = Math.sin(progress * Math.PI);
                    
                    // Movimento Composto
                    this.rightGloveMesh.position.z = this.rightGloveBasePos.z + intensity * 0.5;
                    this.rightGloveMesh.position.x = this.rightGloveBasePos.x - intensity * 0.15; // Negativo pois é o braço direito indo pra esquerda
                    this.rightGloveMesh.position.y = this.rightGloveBasePos.y + intensity * 0.05;
                }
            }
        }
    }
}