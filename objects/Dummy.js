import * as THREE from 'three';

export function createPunchingDummy() {
    const dummyGroup = new THREE.Group();
    
    const blackPlasticMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
    const skinMat = new THREE.MeshStandardMaterial({ color: 0xEebb99, roughness: 0.4 }); 
    
    // 1. Base (Tanque)
    const baseGeo = new THREE.CylinderGeometry(0.4, 0.5, 0.6, 16); 
    const base = new THREE.Mesh(baseGeo, blackPlasticMat);
    base.position.y = 0.3; 
    base.castShadow = true;
    dummyGroup.add(base);

    // 2. Haste flexível (Suporte)
    const stemHeight = 0.7;
    const stemGeo = new THREE.CylinderGeometry(0.12, 0.12, stemHeight, 12);
    const stem = new THREE.Mesh(stemGeo, blackPlasticMat);
    stem.position.y = 0.6 + (stemHeight / 2); 
    dummyGroup.add(stem);

    // Altura onde começa o torso
    const torsoStartY = 0.6 + stemHeight;

    // 3. O Torso
    const torsoRadius = 0.33;
    const torsoHeight = 0.6;
    
    // Parte Central (Cilindro)
    const torsoCylGeo = new THREE.CylinderGeometry(torsoRadius, torsoRadius * 0.85, torsoHeight, 24);
    const torsoMain = new THREE.Mesh(torsoCylGeo, skinMat);
    torsoMain.position.y = torsoStartY + (torsoHeight / 2);
    torsoMain.castShadow = true;
    dummyGroup.add(torsoMain);

    // Cúpula Superior (Ombros)
    const shoulderGeo = new THREE.SphereGeometry(torsoRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const shoulder = new THREE.Mesh(shoulderGeo, skinMat);
    shoulder.position.y = torsoStartY + torsoHeight; 
    shoulder.scale.y = 0.4; 
    dummyGroup.add(shoulder);

    // Cúpula Inferior (Base do torso)
    const bottomGeo = new THREE.SphereGeometry(torsoRadius * 0.85, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const bottom = new THREE.Mesh(bottomGeo, skinMat);
    bottom.rotation.x = Math.PI; 
    bottom.scale.y = 0.4; 
    bottom.position.y = torsoStartY; 
    dummyGroup.add(bottom);

    // 4. Pescoço
    const shoulderTopY = torsoStartY + torsoHeight + (torsoRadius * 0.4);
    const neckHeight = 0.15;
    const neckGeo = new THREE.CylinderGeometry(0.12, 0.14, neckHeight, 24);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.y = shoulderTopY + (neckHeight / 2);
    neck.castShadow = true;
    dummyGroup.add(neck);

    // 5. A Cabeça
    const headStartY = shoulderTopY + neckHeight;
    
    // Parte inferior (Rosto)
    const faceHeight = 0.22;
    const faceRadiusTop = 0.17;
    const faceRadiusBottom = 0.11; 
    const faceGeo = new THREE.CylinderGeometry(faceRadiusTop, faceRadiusBottom, faceHeight, 32);
    const face = new THREE.Mesh(faceGeo, skinMat);
    face.position.y = headStartY + (faceHeight / 2);
    face.castShadow = true;
    dummyGroup.add(face);

    // Parte superior (Crânio)
    const skullGeo = new THREE.SphereGeometry(faceRadiusTop, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const skull = new THREE.Mesh(skullGeo, skinMat);
    skull.position.y = headStartY + faceHeight; 
    dummyGroup.add(skull);

    // Detalhe: Faixa na cintura
    const beltGeo = new THREE.CylinderGeometry(torsoRadius * 0.86, torsoRadius * 0.86, 0.12, 24);
    const belt = new THREE.Mesh(beltGeo, blackPlasticMat);
    belt.position.y = torsoStartY + 0.1;
    dummyGroup.add(belt);

    return dummyGroup;
}