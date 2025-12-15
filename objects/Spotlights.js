import * as THREE from 'three';

// Função interna para criar a textura circular
function createSpotlightTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const context = canvas.getContext('2d');

    context.fillStyle = 'black';
    context.fillRect(0, 0, 512, 512);

    const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(0.5, 'white');
    gradient.addColorStop(1, 'black');   

    context.fillStyle = gradient;
    context.fillRect(0, 0, 512, 512);

    return new THREE.CanvasTexture(canvas);
}

const spotTexture = createSpotlightTexture();

export function createSpotlight(color, targetPosition, scene) {
    const group = new THREE.Group();

    // Materiais
    const housingMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.2 }); 
    const lensMat = new THREE.MeshStandardMaterial({ 
        color: 0xffffff, 
        emissive: color, 
        emissiveIntensity: 0.5, 
        transparent: true, 
        opacity: 0.8 
    }); 

    // 1. Caixa do Holofote
    const housingGeo = new THREE.BoxGeometry(0.8, 0.8, 1.2);
    const housing = new THREE.Mesh(housingGeo, housingMat);
    housing.castShadow = true;
    group.add(housing);

    // 2. Lente frontal
    const lensGeo = new THREE.CircleGeometry(0.35, 32);
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0, 0.61); 
    group.add(lens);

    // 3. Aletas laterais
    const finGeo = new THREE.BoxGeometry(0.05, 0.6, 1.0);
    for(let i=-1; i<=1; i+=2) {
        const fin = new THREE.Mesh(finGeo, housingMat);
        fin.position.set(i * 0.45, 0, 0); 
        group.add(fin);
    }

    // 4. A Luz (SpotLight)
    const spot = new THREE.SpotLight(color, 2000); 
    spot.angle = Math.PI / 6; 
    spot.penumbra = 0.3; 
    spot.decay = 1.5; 
    spot.distance = 50;
    spot.castShadow = true;
    spot.map = spotTexture; 
    
    spot.shadow.mapSize.width = 1024;
    spot.shadow.mapSize.height = 1024;
    spot.shadow.radius = 5;
    
    group.add(spot);

    // Target da luz
    const target = new THREE.Object3D();
    target.position.copy(targetPosition);
    
    // IMPORTANTE: O target precisa estar na cena global, não dentro do grupo do holofote
    if(scene) {
        scene.add(target);
        spot.target = target;
    }

    group.lookAt(targetPosition);

    return group;
}