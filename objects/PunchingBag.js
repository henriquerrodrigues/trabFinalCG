import * as THREE from 'three';

export function createPunchingBagWall() {
    const wallGroup = new THREE.Group();

    // 1. Parede e Viga
    const brickColor = 0x8c3b2c; 
    const wallGeo = new THREE.BoxGeometry(4, 3, 0.2);
    const wallMat = new THREE.MeshStandardMaterial({ color: brickColor, roughness: 0.9 });
    const wall = new THREE.Mesh(wallGeo, wallMat);
    wall.position.y = 1.5; 
    wall.castShadow = true;
    wall.receiveShadow = true;
    wallGroup.add(wall);
    
    const beamGeo = new THREE.BoxGeometry(4, 0.3, 0.25);
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 3.15; 
    wallGroup.add(beam);

    // 2. Estrutura de Suporte (Metal)
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7, roughness: 0.3 });
    
    // Placa de fixação
    const plateGeo = new THREE.BoxGeometry(0.4, 1.2, 0.05);
    const plate = new THREE.Mesh(plateGeo, metalMat);
    plate.position.set(0, 2.2, 0.12); 
    wallGroup.add(plate);

    // Braço horizontal
    const armGeo = new THREE.BoxGeometry(0.1, 0.1, 1.0);
    const arm = new THREE.Mesh(armGeo, metalMat);
    arm.position.set(0, 2.6, 0.6); 
    wallGroup.add(arm);

    // Suporte diagonal
    const braceGeo = new THREE.BoxGeometry(0.1, 0.1, 1.1);
    const brace = new THREE.Mesh(braceGeo, metalMat);
    brace.position.set(0, 2.1, 0.6);
    brace.rotation.x = -Math.PI / 4; 
    wallGroup.add(brace);

    // 3. Saco de Pancada
    const bagGroup = new THREE.Group();
    const bagRedMat = new THREE.MeshStandardMaterial({ color: 0xa00000, roughness: 0.4 }); 
    const bagBlackMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 }); 
    const chainMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 }); 

    // Corpo
    const bagHeight = 1.3;
    const bagRadius = 0.25;
    const bagGeo = new THREE.CylinderGeometry(bagRadius, bagRadius, bagHeight, 24);
    const bag = new THREE.Mesh(bagGeo, bagRedMat);
    bag.castShadow = true;
    bagGroup.add(bag);

    // Topo e Base
    const capGeo = new THREE.CylinderGeometry(bagRadius + 0.01, bagRadius + 0.01, 0.15, 24);
    const topCap = new THREE.Mesh(capGeo, bagBlackMat);
    topCap.position.y = bagHeight / 2;
    bagGroup.add(topCap);
    const bottomCap = new THREE.Mesh(capGeo, bagBlackMat);
    bottomCap.position.y = -bagHeight / 2;
    bagGroup.add(bottomCap);

    // Correntes
    const chainLength = 0.45; 
    const chainGeo = new THREE.CylinderGeometry(0.015, 0.015, chainLength, 8);
    chainGeo.rotateX(Math.PI / 2); 

    const hookPoint = new THREE.Vector3(0, bagHeight/2 + 0.4, 0); 

    for(let i=0; i<4; i++) {
        const angle = (i / 4) * Math.PI * 2;
        const chain = new THREE.Mesh(chainGeo, chainMat);
        
        const startX = Math.cos(angle) * 0.2;
        const startZ = Math.sin(angle) * 0.2;
        const startY = bagHeight/2; 

        chain.position.set(
            startX + (0 - startX) * 0.5,
            startY + (hookPoint.y - startY) * 0.5,
            startZ + (0 - startZ) * 0.5
        );

        chain.lookAt(hookPoint);
        bagGroup.add(chain);
    }

    bagGroup.position.set(0, 2.6 - (bagHeight/2 + 0.35), 1.0);
    wallGroup.add(bagGroup);

    return wallGroup;
}