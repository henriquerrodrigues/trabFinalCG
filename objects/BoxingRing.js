import * as THREE from 'three';

export function createBoxingRing() {
    const ringGroup = new THREE.Group();

    // --- Configurações e Materiais ---
    const colorMatTop = 0x2e86de; // Azul claro do topo
    const colorSkirt = 0x192a56;  // Azul escuro das laterais
    const colorPost = 0xffffff;   // Branco
    
    // Cores das cordas
    const colorRopeRed = 0xe74c3c;
    const colorRopeWhite = 0xf5f6fa;
    const colorRopeBlue = 0x0984e3;

    // Material do Ringue (Array de materiais para o BoxGeometry)
    // Ordem: right, left, top, bottom, front, back
    const ringMaterials = [
        new THREE.MeshStandardMaterial({ color: colorSkirt }), // Lado
        new THREE.MeshStandardMaterial({ color: colorSkirt }), // Lado
        new THREE.MeshStandardMaterial({ color: colorMatTop }), // Topo (Lona)
        new THREE.MeshStandardMaterial({ color: 0x000000 }),    // Fundo (não visto)
        new THREE.MeshStandardMaterial({ color: colorSkirt }), // Frente
        new THREE.MeshStandardMaterial({ color: colorSkirt })  // Trás
    ];

    // 1. Base do Ringue
    const baseSize = 10;
    const baseHeight = 1;
    const baseGeo = new THREE.BoxGeometry(baseSize, baseHeight, baseSize);
    const baseMesh = new THREE.Mesh(baseGeo, ringMaterials);
    baseMesh.position.y = baseHeight / 2;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    ringGroup.add(baseMesh);

    // 2. Postes (Corners)
    const postHeight = 4;
    const postRadius = 0.15;
    const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, postHeight, 16);
    const postMat = new THREE.MeshStandardMaterial({ color: colorPost, roughness: 0.4 });
    
    // Posições dos postes
    const offset = baseSize / 2 - 0.2; // Leve recuo para dentro
    const postPositions = [
        { x: offset, z: offset, color: 0xe74c3c },   // Canto Vermelho
        { x: -offset, z: -offset, color: 0x0984e3 }, // Canto Azul
        { x: offset, z: -offset, color: 0xffffff },  // Neutro
        { x: -offset, z: offset, color: 0xffffff }   // Neutro
    ];

    postPositions.forEach(pos => {
        const post = new THREE.Mesh(postGeo, postMat);
        post.position.set(pos.x, (baseHeight + postHeight) / 2, pos.z); 
        post.castShadow = true;
        ringGroup.add(post);

        // Almofada do Canto (Corner Pad)
        const padGeo = new THREE.BoxGeometry(0.5, 3, 0.5);
        const padMat = new THREE.MeshStandardMaterial({ color: pos.color });
        const pad = new THREE.Mesh(padGeo, padMat);
        pad.position.set(pos.x, baseHeight + 1.5, pos.z);
        // Rotacionar levemente para olhar para o centro
        pad.lookAt(0, baseHeight + 1.5, 0);
        pad.castShadow = true;
        ringGroup.add(pad);
    });

    // 3. Cordas (Ropes)
    const ropeHeights = [baseHeight + 1, baseHeight + 2, baseHeight + 3];
    const ropeColors = [colorRopeBlue, colorRopeWhite, colorRopeRed]; 

    const corners = [
        new THREE.Vector3(offset, 0, offset),
        new THREE.Vector3(offset, 0, -offset),
        new THREE.Vector3(-offset, 0, -offset),
        new THREE.Vector3(-offset, 0, offset)
    ];

    for (let i = 0; i < 4; i++) {
        const p1 = corners[i];
        const p2 = corners[(i + 1) % 4]; // Próximo canto (circular)
        
        ropeHeights.forEach((h, index) => {
            createRope(p1, p2, h, ropeColors[index], ringGroup);
        });
    }

    // 4. Escadas
    // Escada 1 (Lado Azul/Neutro)
    const stairs1 = createStairs(baseHeight);
    stairs1.position.set(-6.5, 0, -4.25);
    stairs1.rotation.y = -Math.PI / 2;
    ringGroup.add(stairs1);

    // Escada 2 (Lado Vermelho)
    const stairs2 = createStairs(baseHeight);
    stairs2.position.set(6.5, 0, 4.25); 
    stairs2.rotation.y = Math.PI / 2;
    ringGroup.add(stairs2);

    return ringGroup;
}

// --- Funções Auxiliares (Não exportadas, usadas apenas internamente) ---

function createRope(p1, p2, height, color, group) {
    const direction = new THREE.Vector3().subVectors(p2, p1);
    const length = direction.length();
    
    const ropeGeo = new THREE.CylinderGeometry(0.04, 0.04, length, 8);
    const ropeMat = new THREE.MeshStandardMaterial({ color: color });
    const rope = new THREE.Mesh(ropeGeo, ropeMat);

    const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    rope.position.copy(midPoint);
    rope.position.y = height;
    
    rope.lookAt(p2.x, height, p2.z);
    rope.rotateX(Math.PI / 2);

    group.add(rope);
}

function createStairs(baseHeight) {
    const group = new THREE.Group();
    const stepCount = 3;
    const stepWidth = 1.5;
    const stepDepth = 0.5;
    const stepHeight = baseHeight / stepCount;

    const sGeo = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
    const sMat = new THREE.MeshStandardMaterial({ color: 0x222222 }); 
    const sTopMat = new THREE.MeshStandardMaterial({ color: 0xf39c12 }); 
    
    const stepMats = [sMat, sMat, sTopMat, sMat, sMat, sMat];

    for(let i=0; i<stepCount; i++) {
        const step = new THREE.Mesh(sGeo, stepMats);
        step.position.y = (i * stepHeight) + (stepHeight / 2);
        step.position.z = - (i * stepDepth); 
        step.castShadow = true;
        step.receiveShadow = true;
        group.add(step);
    }
    return group;
}