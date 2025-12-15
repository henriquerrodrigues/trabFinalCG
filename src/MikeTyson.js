import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class MikeTyson {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.obj = null;
        
        // Estado do Jogo
        this.gameActive = false;
        this.score = 0;
        this.lives = 3; 
        this.maxScore = 5;
        
        // Trigger de Proximidade
        // Distância menor pois a academia é apertada
        this.activationDistance = 7.5;
        this.ringCenter = new THREE.Vector3(0, 1, 0);
        this.triggerCircle = null;
        this.popupShown = false;

        // Posição do Mike (Canto Vermelho do Ringue)
        // O ringue tem altura base 1. Mike fica em cima da base.
        this.mikePosition = new THREE.Vector3(3.5, 3.6, 3.5);

        // Mecânica QTE
        this.currentTarget = null;
        this.hitWindowStart = 1000;
        this.hitWindowEnd = 2000;

        this.loadModel();
        this.createTriggerZone();
        this.createPopupHTML();

        window.addEventListener('player-punch', (e) => this.onPlayerPunch(e.detail.side));
    }

    loadModel() {
        const loader = new GLTFLoader(); 
        loader.load('assets/fbx/mike_tyson_boxer.glb', (gltf) => {
            this.obj = gltf.scene;
            
            // ESCALA: Reduzida um pouco para caber no ringue (antes era 9)
            const scale = 2.7; 
            this.obj.scale.set(scale, scale, scale);
            
            this.obj.position.copy(this.mikePosition);
            this.obj.lookAt(0, this.obj.position.y, 0);
            
            this.scene.add(this.obj);
        });
    }

    createTriggerZone() {
        const geometry = new THREE.RingGeometry(this.activationDistance - 0.1, this.activationDistance, 64);
        const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
        this.triggerCircle = new THREE.Mesh(geometry, material);
        this.triggerCircle.rotation.x = -Math.PI / 2;
        // Círculo no chão do ringue (y=1.05 para não z-fighting)
        this.triggerCircle.position.set(0, 1.05, 0); 
        this.scene.add(this.triggerCircle);
    }

    createPopupHTML() {
        const div = document.createElement('div');
        div.id = 'mike-popup';
        div.style.display = 'none';
        div.style.position = 'fixed';
        div.style.top = '50%'; div.style.left = '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.background = 'rgba(0,0,0,0.9)';
        div.style.border = '2px solid red';
        div.style.padding = '20px';
        div.style.color = 'white';
        div.style.textAlign = 'center';
        div.style.zIndex = '10000';
        div.innerHTML = `
            <h2 style="margin:0 0 20px 0; color:red;">VAI ENCARAR O CAMPEÃO?</h2>
            <button id="btn-fight-yes" style="padding:10px 30px; font-size:18px; cursor:pointer; background:red; color:white; border:none;">VEM NI MIM!</button>
            <button id="btn-fight-no" style="padding:10px 30px; font-size:18px; cursor:pointer; background:grey; color:white; border:none; margin-left:10px;">Arregar</button>
        `;
        document.body.appendChild(div);

        document.getElementById('btn-fight-yes').onclick = () => {
            document.getElementById('mike-popup').style.display = 'none';
            const canvas = document.querySelector('canvas');
            canvas.requestPointerLock();
            window.isInDialogue = false;
            this.startGame();
        };

        document.getElementById('btn-fight-no').onclick = () => {
            document.getElementById('mike-popup').style.display = 'none';
            window.isInDialogue = false;
            const canvas = document.querySelector('canvas');
            canvas.requestPointerLock();
        };
    }

    startGame() {
        if (!this.obj) return;
        this.gameActive = true;
        window.gameActive = true;
        this.score = 0;
        this.lives = 3; 
        
        this.updateHUD("Vidas: " + "❤️".repeat(this.lives), "white");
        
        // POSICIONA O JOGADOR PARA A LUTA (No centro do ringue)
        this.camera.position.set(0, 2.7, 0); // Altura dos olhos do player em cima do ringue (1.7 + 1.0)
        this.camera.lookAt(this.obj.position);
        
        this.scheduleNextTarget();
    }

    spawnTarget() {
        if (!this.gameActive) return;
        if (this.currentTarget) this.removeCurrentTarget();

        const side = Math.random() > 0.5 ? 'right' : 'left';
        const el = document.createElement('div');
        Object.assign(el.style, {
            position: 'absolute', top: '50%', width: '100px', height: '100px',
            borderRadius: '50%', border: '5px solid red', 
            transform: 'translate(-50%, -50%) scale(1)', transition: 'background-color 0.1s',
            left: side === 'left' ? '25%' : '75%',
            display: 'flex', justifyContent: 'center', alignItems: 'center',
            color: 'white', fontSize: '24px', fontWeight: 'bold', fontFamily: 'Arial'
        });
        el.innerText = side === 'left' ? "L" : "R";
        document.body.appendChild(el);

        this.currentTarget = { side, el, spawnedAt: performance.now(), status: 'red' };
    }

    onPlayerPunch(side) {
        if (!this.gameActive || !this.currentTarget) return;

        const now = performance.now();
        const age = now - this.currentTarget.spawnedAt;

        if (side !== this.currentTarget.side) {
            this.failTarget("LADO ERRADO!"); 
            return;
        }

        if (age < this.hitWindowStart) {
            this.failTarget("AFOBADO DEMAIS!"); 
        } else if (age <= this.hitWindowEnd) {
            this.hitTarget();
        } else {
            this.failTarget("MUITO LENTO...");
        }
    }

    hitTarget() {
        this.score++;
        this.removeCurrentTarget();
        this.updateHUD(`ACERTOU! ${this.score}/${this.maxScore}`, "#00ff00");
        
        if (this.obj) {
            // Pequena animação de hit
            this.obj.rotateX(-0.2);
            setTimeout(() => this.obj.rotateX(0.2), 200);
        }

        if (this.score >= this.maxScore) this.winGame();
        else this.scheduleNextTarget();
    }

    failTarget(msg) {
        this.lives--;
        this.removeCurrentTarget();
        
        if (this.lives <= 0) {
            this.loseGame();
        } else {
            this.updateHUD(`${msg} (Vidas: ${this.lives})`, "red");
            this.scheduleNextTarget();
        }
    }

    loseGame() {
        this.gameActive = false;
        window.gameActive = false;
        this.updateHUD("NOCAUTEADO!", "red");
        setTimeout(() => { location.reload(); }, 3000);
    }

    winGame() {
        this.gameActive = false;
        window.gameActive = false;
        this.updateHUD("VOCÊ VENCEU O MIKE!", "#00ffff");
        setTimeout(() => {
            const hud = document.getElementById('game-hud');
            if(hud) hud.style.display = 'none';
        }, 4000);
    }

    removeCurrentTarget() {
        if (this.currentTarget && this.currentTarget.el) this.currentTarget.el.remove();
        this.currentTarget = null;
    }

    scheduleNextTarget() {
        if (this.gameActive) setTimeout(() => this.spawnTarget(), 1500);
    }

    updateHUD(text, color) {
        let hud = document.getElementById('game-hud');
        if (!hud) {
            hud = document.createElement('div');
            hud.id = 'game-hud';
            Object.assign(hud.style, {
                position: 'fixed', top: '15%', left: '50%', transform: 'translate(-50%, 0)',
                fontSize: '36px', fontWeight: 'bold', textShadow: '2px 2px black', pointerEvents: 'none'
            });
            document.body.appendChild(hud);
        }
        hud.style.color = color;
        hud.innerText = text;
        hud.style.display = 'block';
    }

    update(delta) {
    // Trigger de proximidade
        if (this.obj && !this.gameActive && !this.popupShown) {
            // ALTERADO: Calcula distância para o CENTRO DO RINGUE, não para o Mike
            const dist = this.camera.position.distanceTo(this.ringCenter);
            
            if (dist < this.activationDistance) {
                this.popupShown = true;
                window.isInDialogue = true; 
                document.exitPointerLock(); 
                document.getElementById('mike-popup').style.display = 'block';
            }
        }
        
        if (this.obj && !this.gameActive && this.popupShown) {
                // ALTERADO: Checa distância para o CENTRO DO RINGUE
                const dist = this.camera.position.distanceTo(this.ringCenter);
                if (dist > this.activationDistance + 2) {
                    this.popupShown = false;
                }
        }

        // Timeout do Alvo
        if (this.gameActive && this.currentTarget) {
            const now = performance.now();
            const age = now - this.currentTarget.spawnedAt;

            if (age > this.hitWindowEnd) {
                this.failTarget("MUITO LENTO...");
                return;
            }

            // Visual: Fica verde quando pode bater
            if (age >= this.hitWindowStart && this.currentTarget.status === 'red') {
                this.currentTarget.status = 'green';
                this.currentTarget.el.style.borderColor = '#00ff00';
                this.currentTarget.el.style.backgroundColor = 'rgba(0, 255, 0, 0.3)';
            }
            
            // Visual: Alvo encolhendo
            const progress = age / this.hitWindowEnd; 
            const scale = 1.5 - (progress * 1.0);
            this.currentTarget.el.style.transform = `translate(-50%, -50%) scale(${scale})`;
        }
    }
}