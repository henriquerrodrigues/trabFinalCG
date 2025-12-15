import * as THREE from 'three';

export class AudioManager {
    constructor(camera) {
        // Cria o ouvinte e o anexa à câmera
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        
        this.sound = new THREE.Audio(this.listener);
        this.loadMusic();
        this.setupInteractionListener();
    }

    loadMusic() {
        const audioLoader = new THREE.AudioLoader();
        audioLoader.load('assets/sounds/DMC3-OST.mp3', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setLoop(true);
            this.sound.setVolume(0.5);
        });
    }

    setupInteractionListener() {
        // Navegadores bloqueiam áudio automático. 
        // Esperamos qualquer interação (clique ou tecla) para iniciar.
        const startAudio = () => {
            if (this.sound.buffer && !this.sound.isPlaying) {
                this.sound.play();
            }
            
            // Se já começou a tocar, removemos os ouvintes para não chamar play() repetidamente
            if (this.sound.isPlaying) {
                window.removeEventListener('click', startAudio);
                window.removeEventListener('keydown', startAudio);
            }
        };

        window.addEventListener('click', startAudio);
        window.addEventListener('keydown', startAudio);
    }
}