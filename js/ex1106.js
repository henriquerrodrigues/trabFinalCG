import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { ColladaLoader } from 'three/addons/loaders/ColladaLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { TGALoader } from 'three/addons/loaders/TGALoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer;
var clock = new THREE.Clock();
let animais = [];
let ambientLight, directionalLight;
let tipoIluminacao = 'amanhecer'; // amanhecer, entardecer, noite
let objetosPorIluminacao = {
    amanhecer: [],
    entardecer: [],
    noite: []
};
// Pássaros (instâncias e dados de animação)
let birds = []; // { obj, angle, radius, speed, height, center }
let birdPrototype = null; // modelo carregado (Group)
let birdMixers = []; // AnimationMixers for bird instances

var criaIluminacao = function(){
    ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);
    
    directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(100, 100, 100);
    directionalLight.castShadow = true;
    // shadow config
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.left = -200;
    directionalLight.shadow.camera.right = 200;
    directionalLight.shadow.camera.top = 200;
    directionalLight.shadow.camera.bottom = -200;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;
    directionalLight.shadow.bias = -0.0005;
    scene.add(directionalLight);
    // softer shadows
    if (renderer) renderer.shadowMap.type = THREE.PCFSoftShadowMap;
}

var mudarIluminacao = function(tipo) {
    tipoIluminacao = tipo;
    
    // Esconder todos os objetos condicionais
    Object.keys(objetosPorIluminacao).forEach(ilum => {
        objetosPorIluminacao[ilum].forEach(obj => {
            obj.visible = false;
        });
    });
    
    // Mostrar objetos do tipo de iluminação selecionado
    objetosPorIluminacao[tipo].forEach(obj => {
        obj.visible = true;
    });
    
    if (tipo === 'amanhecer') {
        scene.background = new THREE.Color(0xffd89b); // Laranja suave
        ambientLight.intensity = 0.6;
        ambientLight.color.setHex(0xffa500); // Laranja
        directionalLight.intensity = 0.7;
        directionalLight.color.setHex(0xffb84d); // Laranja claro
        directionalLight.position.set(50, 80, 50);
    } else if (tipo === 'entardecer') {
        scene.background = new THREE.Color(0xff6b35); // Vermelho avermelhado
        ambientLight.intensity = 0.5;
        ambientLight.color.setHex(0xff4500); // Vermelho-laranja
        directionalLight.intensity = 0.6;
        directionalLight.color.setHex(0xff8c00); // Vermelho-laranja escuro
        directionalLight.position.set(30, 50, 100);
    } else if (tipo === 'noite') {
        scene.background = new THREE.Color(0x0a0e27); // Azul escuro
        ambientLight.intensity = 0.4;
        ambientLight.color.setHex(0x4169e1); // Azul real (mais claro)
        directionalLight.intensity = 0.5;
        directionalLight.color.setHex(0x87ceeb); // Azul céu claro (mais claro)
        directionalLight.position.set(100, 100, 100);
    }
    
    console.log('Iluminação alterada para:', tipo);
}

// Gerador de modelos de plantas em grade usando uma função matemática para variar a altura/posição
function generatePlantModels({ rows = 4, cols = 5, spacing = 10, startX = 10, startZ = 0, scaleMin = 0.08, scaleMax = 0.12, amplitude = 0.5, iluminacao = 'amanhecer' } = {}) {
    const out = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = startX + i * spacing;
            const z = startZ + j * spacing;
            // Função matemática para variar o eixo Y (pode ajustar para ruído, perlin, etc.)
            const y = - 2 + Math.sin((x + z) * 0.1) * amplitude;
            const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
            const rot = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
            out.push({ nome: 'planta', caminho: 'assets/grass/13.obj', pos: new THREE.Vector3(x, y, z), scale: scale, rot: rot, iluminacao: iluminacao });
        }
    }
    return out;
}

// Gerador de modelos de abóbora em grade usando uma função matemática para variar a altura/posição
function generatePumpkinModels({ rows = 4, cols = 5, spacing = 10, startX = 10, startZ = 0, scaleMin = 0.5, scaleMax = 1.0, amplitude = 0.5, iluminacao = 'entardecer' } = {}) {
    const out = [];
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const x = startX + i * spacing;
            const z = startZ + j * spacing;
            // Posiciona bem alto no céu (y = 150+)
            const y = 150 + Math.sin((x + z) * 0.1) * amplitude;
            const scale = scaleMin + Math.random() * (scaleMax - scaleMin);
            const rot = new THREE.Euler(0, Math.random() * Math.PI * 2, 0);
            out.push({ nome: 'pumpkin', caminho: 'assets/obj/tg6fjpjkws1s-pumpkins/single_pumpkin.obj', pos: new THREE.Vector3(x, y, z), scale: scale, rot: rot, iluminacao: iluminacao });
        }
    }
    return out;
}

export function init() {

    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 200 );
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);

    renderer = new THREE.WebGLRenderer( );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;

    criaIluminacao();
    camera.position.z = 60;
    camera.position.y = 20;
    mudarIluminacao('amanhecer'); // Começar com amanhecer
    criarGuiIluminacao();
    renderer.setAnimationLoop( nossaAnimacao );
    
    document.body.appendChild( renderer.domElement );
    renderer.render( scene, camera );

    // GROUND
    let textLoader = new THREE.TextureLoader();
    let textGround = textLoader.load("assets/grasslight-big.jpg");
    textGround.wrapS = textGround.wrapT = THREE.RepeatWrapping;
    textGround.repeat.set(25,25);
    textGround.anisotropy = 16;

    let materialGround = new THREE.MeshStandardMaterial({map: textGround});
    let ground = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000), materialGround);
    ground.rotation.x = -Math.PI/2;
    ground.position.y-=6;
    ground.receiveShadow = true;
    scene.add(ground);

    // Carregar animais/plantas
    carregarAnimais();

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', makeMove);
    document.addEventListener('mouseup', clickOn);
    document.addEventListener('mousedown', ClickOff);

    window.addEventListener( 'resize', onWindowResize );
}

// Criar GUI para controlar iluminação
function criarGuiIluminacao() {
    const gui = new GUI();
    const parametros = { iluminacao: 'amanhecer', focoCasa: false };
    
    gui.add(parametros, 'iluminacao', ['amanhecer', 'entardecer', 'noite'])
        .name('Tipo de Iluminação')
        .onChange((valor) => {
            mudarIluminacao(valor);
        });
    
    gui.add(parametros, 'focoCasa')
        .name('Foco na Casa (Amanhecer)')
        .onChange((valor) => {
            if (valor) {
                focoCasa(true);
            } else {
                focoCasa(false);
            }
        });
}

// Carregar a casa (DAE) e exibir com foco
let casaCarregada = null;

function focoCasa(ativo) {
    if (ativo) {
        // Se a casa ainda não foi carregada, carregar agora
        if (!casaCarregada) {
            carregarCasa();
        } else {
            casaCarregada.visible = true;
        }
        
        // Definir iluminação para amanhecer
        mudarIluminacao('amanhecer');
        
        // Posicionar câmera com vista de fora para a casa
        camera.position.set(50, 40, 50);
        camera.lookAt(0, 0, 0);
        
        // Resetar controles de câmera para vista fixa
        cameraControls.theta = Math.PI / 4;
        cameraControls.phi = Math.PI / 3;
        cameraControls.radius = 70;
        
        console.log('Câmera posicionada com foco na casa ao amanhecer');
    } else {
        // Esconder a casa
        if (casaCarregada) {
            casaCarregada.visible = false;
        }
        
        // Retornar câmera à posição padrão
        camera.position.set(60, 20, 60);
        camera.lookAt(0, 0, 0);
        cameraControls.theta = 0;
        cameraControls.phi = Math.PI / 4;
        cameraControls.radius = 80;
    }
}

// Carregar modelo DAE da casa
function carregarCasa() {
    const colladaLoader = new ColladaLoader();
    const modelPath = 'assets/fbx/bedroom-with-boxers-bag/source/room+with+boxers+bag/model.dae';
    const texturesPath = 'assets/fbx/bedroom-with-boxers-bag/source/room+with+boxers+bag/';

    colladaLoader.load(modelPath, (collada) => {
        casaCarregada = collada.scene;
        
        // Escalar a casa
        casaCarregada.scale.set(5, 5, 5);
        casaCarregada.position.set(0, -6, 0);
        
        // Aplicar sombras e carregar texturas dos meshes
        casaCarregada.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Tentar carregar textura para cada mesh
                const textureLoader = new THREE.TextureLoader();
                const meshName = child.name || child.material?.name || 'texture';
                
                // Tentar carregar com diferentes extensões
                const tryLoadTexture = (filename) => {
                    textureLoader.load(texturesPath + filename, (texture) => {
                        texture.colorSpace = THREE.SRGBColorSpace;
                        if (!child.material) {
                            child.material = new THREE.MeshStandardMaterial();
                        }
                        child.material.map = texture;
                        child.material.needsUpdate = true;
                        console.log('Textura carregada:', filename);
                    }, undefined, () => {
                        // Falha silenciosa para tentar próxima extensão
                    });
                };
                
                // Tentar diferentes extensões
                tryLoadTexture(meshName + '.png');
                tryLoadTexture(meshName + '.jpg');
                tryLoadTexture(meshName + '.tga');
            }
        });
        
        // Adicionar à cena
        scene.add(casaCarregada);
        console.log('Casa carregada com sucesso!', casaCarregada);
    }, undefined, (err) => {
        console.error('Erro ao carregar casa DAE:', err);
    });
}

// Carregar animais/plantas
function carregarAnimais() {
    const loader = new OBJLoader();
    const textureLoader = new THREE.TextureLoader();

    // Carregar a textura
    const textura = textureLoader.load('assets/grasslight-big.jpg'); 
    textura.colorSpace = THREE.SRGBColorSpace;

    // Criar um material com a textura
    const materialComTextura = new THREE.MeshPhongMaterial({ map: textura });

    // Modelos especiais + grade gerada com categorias de iluminação
    const modelos = [
        { 
            nome: 'Charizard - Amanhecer', 
            caminho: 'assets/axzhr7uev7k0-Charizard/006 - Charizard/BR_Charizard-Shiny01.obj', 
            pos: new THREE.Vector3(10, 2, 0),
            scale: 1,
            rot: new THREE.Euler(Math.PI / 2, 0),
            iluminacao: 'amanhecer'
        },
        { 
            nome: 'Weedle - Entardecer', 
            caminho: 'assets/ah7j4re62ww0-Weedle/weedle.obj', 
            pos: new THREE.Vector3(10, 2, 10),
            scale: 1,
            rot: new THREE.Euler(0.5, Math.PI / 2, 0),
            iluminacao: 'entardecer'
        },
        { 
            nome: 'Lua - Noite', 
            caminho: 'assets/downloads/Moon 2K.obj', 
            pos: new THREE.Vector3(10, 2, 0),
            scale: 5,
            rot: new THREE.Euler(0.5, Math.PI / 2, 0),
            iluminacao: 'noite'
        },
        { 
            nome: 'Weedle - Noite', 
            caminho: 'assets/ah7j4re62ww0-Weedle/weedle.obj', 
            pos: new THREE.Vector3(10, 2, 10),
            scale: 1,
            rot: new THREE.Euler(0.5, Math.PI / 2, 0),
            iluminacao: 'noite'
        },
        { 
            nome: 'Asteroide - Noite', 
            caminho: 'assets/obj/10464_Asteroid_L3.123c72035d71-abea-4a34-9131-5e9eeeffadcb/10464_Asteroid_L3.123c72035d71-abea-4a34-9131-5e9eeeffadcb/10464_Asteroid_v1_Iterations-2.obj', 
            pos: new THREE.Vector3(30, 180, -50),
            scale: 0.1,
            rot: new THREE.Euler(Math.PI / 4, Math.PI / 3, 0),
            iluminacao: 'noite',
            textura: 'assets/obj/10464_Asteroid_L3.123c72035d71-abea-4a34-9131-5e9eeeffadcb/10464_Asteroid_L3.123c72035d71-abea-4a34-9131-5e9eeeffadcb/10464_Asteroid_v1_diffuse.jpg'
        },
        // Gera uma grade de plantas a partir de parâmetros
        ...generatePlantModels({ rows: 10, cols: 10, spacing: 10, startX: -30, startZ: -30, scaleMin: 0.08, scaleMax: 0.12, amplitude: 0.5, iluminacao: 'amanhecer' }),
        // Gera uma pequena quantidade de abóboras grandes espalhadas no céu
        // ...generatePumpkinModels({ rows: 2, cols: 2, spacing: 80, startX: -80, startZ: -80, scaleMin: 8, scaleMax: 12, amplitude: 0, iluminacao: 'entardecer' })
    ];

    let animaisCarregados = 0;

    modelos.forEach(({ nome, caminho, pos, scale, rot, iluminacao = 'amanhecer', textura: caminhoTextura }) => {
        loader.load(
            caminho,
            (obj) => {
                // Determinar qual textura usar
                let materialParaAplicar = materialComTextura;
                
                if (caminhoTextura) {
                    const texturaEspecifica = textureLoader.load(caminhoTextura);
                    texturaEspecifica.colorSpace = THREE.SRGBColorSpace;
                    materialParaAplicar = new THREE.MeshPhongMaterial({ map: texturaEspecifica });
                }
                
                // Percorrer o objeto e aplicar o material em todas as malhas
                obj.traverse((child) => {
                    if (child.isMesh) {
                        child.material = materialParaAplicar;
                        child.castShadow = true;
                    }
                });

                obj.position.copy(pos);
                obj.scale.set(scale, scale, scale);
                obj.rotation.copy(rot);
                obj.name = nome;
                scene.add(obj);
                animais.push({ nome, obj });
                
                // Adicionar objeto à categoria de iluminação
                if (iluminacao && objetosPorIluminacao[iluminacao]) {
                    objetosPorIluminacao[iluminacao].push(obj);
                    obj.visible = (iluminacao === 'amanhecer'); // Inicialmente apenas amanhecer visível
                }
                
                animaisCarregados++;

                console.log("Animal carregado:", nome, "- Iluminação:", iluminacao);
            },
            undefined,
            (erro) => console.error(`Erro ao carregar ${nome}:`, erro)
        );
    });
    // Carrega pássaros para o céu (aparecerão em entardecer)
    carregarPassaros(6);
    // Carrega grama com textura para noite
    carregarGramanoite(5);
}

var nossaAnimacao = function () {
    let delta = clock.getDelta();
    // Atualiza animação dos pássaros
    if (birds.length > 0) {
        birds.forEach(b => {
            b.angle += b.speed * delta;
            const cx = b.center.x;
            const cz = b.center.z;
            const x = cx + b.radius * Math.cos(b.angle);
            const z = cz + b.radius * Math.sin(b.angle);
            const y = b.height + Math.sin(b.angle * 2) * 5; // leve sobe/desce
            b.obj.position.set(x, y, z);
            // olhar na direção do movimento
            const lookX = cx + b.radius * Math.cos(b.angle + 0.1);
            const lookZ = cz + b.radius * Math.sin(b.angle + 0.1);
            b.obj.lookAt(lookX, b.height, lookZ);
        });
    }
    // Atualiza mixers de animação dos pássaros (batimento de asas)
    if (birdMixers.length > 0) {
        birdMixers.forEach(m => m.update(delta));
    }

    renderer.render( scene, camera );
}

// Carrega grama OBJ com textura TGA para noite
function carregarGramanoite(count = 5) {
    const objLoader = new OBJLoader();
    const tgaLoader = new TGALoader();
    const modelPath = 'assets/grass/16.obj';
    const texPath = 'assets/grass/diffuse.tga';

    // Carregar textura TGA
    tgaLoader.load(texPath, (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        const grassMaterial = new THREE.MeshStandardMaterial({ map: texture });

        // Carregar modelo OBJ
        objLoader.load(modelPath, (obj) => {
            // Aplicar material ao modelo
            obj.traverse(child => {
                if (child.isMesh) {
                    child.material = grassMaterial;
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Clonar e instanciar múltiplas vezes
            for (let i = 0; i < count; i++) {
                const clone = obj.clone();
                // Espalhado sobre a área do chão - bem espalhado
                const x = (Math.random() - 0.5) * 600;
                const z = (Math.random() - 0.5) * 600;
                const y = -5.8 + Math.random() * 0.5; // muito próximo do chão

                clone.position.set(x, y, z);
                // Rotação aleatória no eixo Y (yaw)
                clone.rotation.set(0, Math.random() * Math.PI * 2, 0);

                // // Escala aleatória
                // const s = 0.5 + Math.random() * 1.0;
                // clone.scale.set(s, s, s);

                scene.add(clone);

                // Adicionar à categoria noite
                objetosPorIluminacao.noite.push(clone);
                clone.visible = (tipoIluminacao === 'noite');
            }

            console.log('Grama (noite) carregada:', count);
        }, undefined, (err) => {
            console.error('Erro ao carregar grama OBJ:', err);
        });
    }, undefined, (err) => {
        console.error('Erro ao carregar textura TGA:', err);
    });
}

// Carrega o modelo FBX dos pássaros e instancia alguns para o céu
function carregarPassaros(count = 6) {
    const fbxLoader = new FBXLoader();
    const center = new THREE.Vector3(0, 120, 0);
    fbxLoader.load('assets/obj/bird-flight-animation/source/birdTest.fbx', (group) => {
        // guarda o protótipo
        birdPrototype = group;
        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
            }
        });

        // cria instâncias simples (clones) e adiciona ao scene
        for (let i = 0; i < count; i++) {
            const inst = SkeletonUtils.clone(group);
            // definir posição inicial em círculo
            const angle = (i / count) * Math.PI * 2;
            const radius = 60 + Math.random() * 40;
            const height = center.y + (Math.random() * 40 - 20);
            const x = center.x + radius * Math.cos(angle);
            const z = center.z + radius * Math.sin(angle);
            inst.position.set(x, height, z);
            inst.scale.set(0.5, 0.5, 0.5);
            scene.add(inst);
            // garantir que cada malha do clone projete sombra
            inst.traverse(child => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = false;
                }
            });

            // guardar dados de animação
            const birdData = {
                obj: inst,
                angle: angle,
                radius: radius,
                speed: 0.5 + Math.random() * 0.5,
                height: height,
                center: center
            };
            birds.push(birdData);

            // Se houver clipes de animação no FBX carregado, cria um mixer por instância
            if (group.animations && group.animations.length > 0) {
                const mixer = new THREE.AnimationMixer(inst);
                const clip = group.animations[0];
                const action = mixer.clipAction(clip);
                action.play();
                birdMixers.push(mixer);
            }

            // adicionar à categoria entardecer para controle de visibilidade
            objetosPorIluminacao.entardecer.push(inst);
            inst.visible = (tipoIluminacao === 'entardecer');
        }

        console.log('Pássaros carregados:', birds.length);
    }, undefined, (err) => {
        console.error('Erro ao carregar FBX dos pássaros:', err);
    });
}


/**
 * Section of mouse move - Camera orbital 360 graus
 */
var click = false;
var mousePosition = {
    x: 0,
    y: 0,
    z: 0
};

// Controle de câmera orbital
var cameraControls = {
    theta: 0,      // Rotação horizontal (graus)
    phi: Math.PI / 4,   // Rotação vertical (graus) - começa 45 graus para cima
    radius: 80     // Distância da câmera do centro
};

var makeMove = function(e){
    
    if (click){
        let deltaX = mousePosition.x - e.offsetX;
        let deltaY = mousePosition.y - e.offsetY;
        
        // Atualizar ângulos (mais fluído)
        cameraControls.theta += deltaX * 0.005;  // Rotação horizontal suave
        cameraControls.phi -= deltaY * 0.005;     // Rotação vertical suave
        
        // Limitar phi para permitir olhar para cima (até 180 graus - totalmente para cima)
        cameraControls.phi = Math.max(0, Math.min(Math.PI, cameraControls.phi));
        
        // Calcular nova posição da câmera usando coordenadas esféricas
        const x = cameraControls.radius * Math.sin(cameraControls.phi) * Math.cos(cameraControls.theta);
        const y = cameraControls.radius * Math.cos(cameraControls.phi);
        const z = cameraControls.radius * Math.sin(cameraControls.phi) * Math.sin(cameraControls.theta);
        
        camera.position.set(x, y + 20, z);
        camera.lookAt(0, 0, 0);
    }
    mousePosition = {
        x: e.offsetX,
        y: e.offsetY
    }
}

var ClickOff = function (e) {
    click = true;
}

var clickOn = function (e) {
    click = false;
}

var toRadians = function (value){
    return value * (Math.PI / 180);
}

var onKeyUp = function (e){
    // Key up events handled here
}

var onKeyDown = function (e){
    // Key down events handled here
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}


