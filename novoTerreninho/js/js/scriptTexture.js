import * as THREE from 'three';
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { TextureLoader } from 'three'; 

let camera, scene, renderer;
let animais = [];
let parametrosGui;
let gui;
let cameraTarget = null;
let cameraTopDown = false; // quando true, trava movimentos do mouse e posiciona a câmera de cima

// ---------------- Inicialização ----------------
export function init() {
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xaed6f1);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Luzes
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(10, 20, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    // Chão
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshPhongMaterial({ color: 0x228B22 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    camera.position.set(0, 15, 30);
    // Opcional: habilitar visão top-down (mude para true se quiser ver o terreno de cima)
    setCameraTopDown(true);

    // Carrega animais
    carregarAnimais();
    
    window.addEventListener('resize', onWindowResize);
    renderer.setAnimationLoop(animate);
}

function cameraMouseMove(event) {
    if (!cameraTarget && !cameraTopDown) {
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

        camera.position.x += mouseX * 0.5;
        camera.position.y += mouseY * 0.5;
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
}

window.addEventListener('mousemove', cameraMouseMove, false);   


// ---------------- Carregar Animais ----------------
function carregarAnimais() {
    const loader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader(); // Usamos THREE.TextureLoader

    // 1. Carregar a textura
    // Certifique-se de que 'assets/texture.jpg' é o caminho correto para o seu arquivo de textura.
    const textura = textureLoader.load('assets/house/34-cottage_textures/cottage_textures/cottage_diffuse.png'); 
    textura.colorSpace = THREE.SRGBColorSpace; // Configuração de cor padrão para texturas

    // 2. Criar um material com a textura
    const materialComTextura = new THREE.MeshPhongMaterial({ map: textura });



    // Gerador de modelos de plantas em grade usando uma função matemática para variar a altura/posição
    function generatePlantModels({ rows = 4, cols = 5, spacing = 10, startX = 10, startZ = 0, scaleMin = 0.08, scaleMax = 0.12, amplitude = 0.5 } = {}) {
        const out = [];
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = startX + i * spacing;
                const z = startZ + j * spacing;
                // Função matemática para variar o eixo Y (pode ajustar para ruído, perlin, etc.)
                const y = 2 + Math.sin((x + z) * 0.1) * amplitude;
                const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
                const rot = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
                out.push({ nome: 'planta', caminho: 'assets/grass/14.obj', pos: new THREE.Vector3(x, y, z), scale: scale, rot: rot });
            }
        }
        return out;
    }

    // Mantemos alguns modelos especiais e depois adicionamos a grade gerada
    const modelos = [
        { 
            nome: 'planta', 
            caminho: 'assets/axzhr7uev7k0-Charizard/006 - Charizard/BR_Charizard-Shiny01.obj', 
            pos: new THREE.Vector3(10, 2, 0),
            scale: 1,
            rot: new THREE.Euler(Math.PI / 2, 0)
        },
        { 
            nome: 'planta', 
            caminho: 'assets/ah7j4re62ww0-Weedle/weedle.obj', 
            pos: new THREE.Vector3(10, 2, 10),
            scale: 1,
            rot: new THREE.Euler(0.5, Math.PI / 2, 0)
        },
        { 
            nome: 'planta', 
            caminho: 'assets/downloads/Moon 2K.obj', 
            pos: new THREE.Vector3(10, 2, 0),
            scale: 5,
            rot: new THREE.Euler(0.5, Math.PI / 2, 0)
        },
        { 
            nome: 'planta', 
            caminho: 'assets/ah7j4re62ww0-Weedle/weedle.obj', 
            pos: new THREE.Vector3(10, 2, 10),
            scale: 1,
            rot: new THREE.Euler(0.5, Math.PI / 2, 0)
        },
        // gera uma grade de plantas a partir de parâmetros — ajuste rows/cols/spacing conforme necessário
        ...generatePlantModels({ rows: 7, cols: 7, spacing: 10, startX: -30, startZ: -30, scaleMin: 0.08, scaleMax: 0.12, amplitude: 0.5 })
    ];

    let animaisCarregados = 0;

    modelos.forEach(({ nome, caminho, pos, scale, rot }) => {
        loader.load(
            caminho,
            (obj) => {
                // 3. Percorrer o objeto e aplicar o material em todas as malhas
                obj.traverse((child) => {
                    if (child.isMesh) {
                        child.material = materialComTextura;
                        child.castShadow = true; // Opcional: Adiciona sombra
                    }
                });

                obj.position.copy(pos);
                obj.scale.set(scale, scale, scale);
                obj.rotation.copy(rot);
                obj.name = nome;
                scene.add(obj);
                animais.push({ nome, obj });
                animaisCarregados++;

                console.log("Animal carregado:", nome, obj.position);

                if (animaisCarregados === modelos.length) {
                    criarGUI();
                }
            },
            undefined,
            (erro) => console.error(`Erro ao carregar ${nome}:`, erro)
        );
    });
}


// ---------------- Criar GUI ----------------
function criarGUI() {
    gui = new GUI();
    parametrosGui = { Animal: animais[0].nome }; // valor inicial
    const nomesAnimais = animais.map(a => a.nome);

    const lista = gui.add(parametrosGui, "Animal", nomesAnimais);
    lista.name("Animais");

    lista.onChange((nome) => {
        console.log("GUI mudou para:", nome);
        focarCamera(nome);
    });

    // Foca inicialmente no primeiro animal
    // focarCamera(parametrosGui.Animal);
}

// ---------------- Resize ----------------
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ---------------- Focar Camera ----------------
function focarCamera(nome) {
    const animal = animais.find(a => a.nome === nome);
    if (!animal) {
        console.log("Animal não encontrado:", nome);
        return;
    }

    const alvo = animal.obj.position.clone();
    cameraTarget = {
        pos: new THREE.Vector3(alvo.x + 5, alvo.y + 3, alvo.z + 10),
        lookAt: new THREE.Vector3(alvo.x, alvo.y + 2, alvo.z)
    };

    console.log("Camera target definido:", cameraTarget);
}

// ---------------- Animação ----------------
function animate() {
    if (cameraTarget) {
        camera.position.lerp(cameraTarget.pos, 0.1);
        camera.lookAt(cameraTarget.lookAt);

        if (camera.position.distanceTo(cameraTarget.pos) < 0.1) {
            camera.position.copy(cameraTarget.pos);
            camera.lookAt(cameraTarget.lookAt);
            cameraTarget = null;
        }
    }

    renderer.render(scene, camera);
}

// ---------------- Camera Top-Down ----------------
function setCameraTopDown(enable) {
    cameraTopDown = enable;
    if (!camera) return;
    if (enable) {
        // Posiciona a câmera acima do terreno e mira para o centro
        camera.position.set(0, 60, 0.1);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    } else {
        // Restaura posição padrão
        camera.position.set(0, 15, 30);
        camera.lookAt(new THREE.Vector3(0, 0, 0));
    }
}