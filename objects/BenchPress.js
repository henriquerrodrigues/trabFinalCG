import * as THREE from 'three';
import { createBarbell } from './Barbells.js';

export function createBenchPress() {
    const benchGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 0.6 });
    const padMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 }); 
    const redMat = new THREE.MeshStandardMaterial({ color: 0xcc0000 }); 

    // 1. Suportes Verticais (Rack)
    const postGeo = new THREE.BoxGeometry(0.15, 1.8, 0.15);
    
    // Poste Esquerdo
    const postL = new THREE.Mesh(postGeo, metalMat);
    postL.position.set(-0.6, 0.9, -0.5);
    postL.castShadow = true;
    benchGroup.add(postL);

    // Poste Direito
    const postR = new THREE.Mesh(postGeo, metalMat);
    postR.position.set(0.6, 0.9, -0.5);
    postR.castShadow = true;
    benchGroup.add(postR);

    // Barra transversal
    const crossBarGeo = new THREE.BoxGeometry(1.4, 0.1, 0.15);
    const crossBar = new THREE.Mesh(crossBarGeo, metalMat);
    crossBar.position.set(0, 0.05, -0.5);
    benchGroup.add(crossBar);

    // Ganchos
    const hookGeo = new THREE.BoxGeometry(0.1, 0.1, 0.2);
    const hookL = new THREE.Mesh(hookGeo, metalMat);
    hookL.position.set(-0.6, 1.3, -0.4);
    benchGroup.add(hookL);
    
    const hookR = new THREE.Mesh(hookGeo, metalMat);
    hookR.position.set(0.6, 1.3, -0.4);
    benchGroup.add(hookR);

    // Botões Vermelhos
    const knobGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.05, 8);
    knobGeo.rotateZ(Math.PI/2);
    const knobL = new THREE.Mesh(knobGeo, redMat);
    knobL.position.set(-0.7, 1.2, -0.5);
    benchGroup.add(knobL);
    const knobR = new THREE.Mesh(knobGeo, redMat);
    knobR.position.set(0.7, 1.2, -0.5);
    benchGroup.add(knobR);

    // 2. O Banco
    // Pernas
    const legGeo = new THREE.BoxGeometry(0.1, 0.4, 0.1);
    const legFront = new THREE.Mesh(legGeo, metalMat);
    legFront.position.set(0, 0.2, 1.2);
    benchGroup.add(legFront);

    const legBack = new THREE.Mesh(legGeo, metalMat); 
    legBack.position.set(0, 0.2, -0.5);
    benchGroup.add(legBack);

    // Estrutura
    const frameGeo = new THREE.BoxGeometry(0.15, 0.1, 1.8);
    const frame = new THREE.Mesh(frameGeo, metalMat);
    frame.position.set(0, 0.4, 0.35);
    benchGroup.add(frame);

    // Almofadas
    const padBackGeo = new THREE.BoxGeometry(0.5, 0.1, 1.1);
    const padBack = new THREE.Mesh(padBackGeo, padMat);
    padBack.position.set(0, 0.5, 0.1);
    padBack.castShadow = true;
    benchGroup.add(padBack);

    const padSeatGeo = new THREE.BoxGeometry(0.4, 0.1, 0.5);
    const padSeat = new THREE.Mesh(padSeatGeo, padMat);
    padSeat.position.set(0, 0.5, 1.0); 
    padSeat.castShadow = true;
    benchGroup.add(padSeat);

    // 3. Barra com pesos no suporte
    const barbell = createBarbell();
    barbell.position.set(0, 1.38, -0.4); 
    benchGroup.add(barbell);

    return benchGroup;
}