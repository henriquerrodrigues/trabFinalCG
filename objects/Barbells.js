import * as THREE from 'three';

export function createBarbell() {
    const barGroup = new THREE.Group();

    // 1. A Barra (Cromada)
    const barGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2, 8);
    barGeo.rotateZ(Math.PI / 2); // Deitar a barra
    const barMat = new THREE.MeshStandardMaterial({ 
        color: 0xcccccc, 
        roughness: 0.2, 
        metalness: 0.8 
    });
    const bar = new THREE.Mesh(barGeo, barMat);
    bar.castShadow = true;
    barGroup.add(bar);

    // 2. As Anilhas (Pesos)
    const plateGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
    plateGeo.rotateZ(Math.PI / 2); // Deitar a anilha
    const plateMat = new THREE.MeshStandardMaterial({ 
        color: 0x111111, 
        roughness: 0.5, 
        metalness: 0.5 
    });

    // Posições no eixo X local da barra
    const positions = [-0.6, -0.7, -0.8, 0.6, 0.7, 0.8]; 
    
    positions.forEach(xPos => {
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.x = xPos;
        plate.castShadow = true;
        barGroup.add(plate);
    });

    return barGroup;
}