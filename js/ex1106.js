import * as THREE from 'three';
import {GUI} from 'three/addons/libs/lil-gui.module.min.js'
import {OBJLoader} from 'three/addons/loaders/OBJLoader.js'
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js'

import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import {RGBELoader} from 'three/examples/jsm/loaders/RGBELoader.js';


let camera, scene, renderer;

let  objects = [];

let velCubo = 0.001;

let parametrosGui;


var mixer;
var animationActions = [];
var activeAnimation;
var lastAnimation;
var loadFinished = false;
var clock = new THREE.Clock();

var isMovingForward = false;
const dragonFowardSpeed = 10;
var directionalLight, spotLight, pointLight;
var ActualLightType = 'Directional';


var criaIluminacao = function(){
    luzAmbiente();
    createDirectionalLight();
    createPointLight();
    createSpotLight()   
    scene.add(directionalLight);
}

// Criação da DirectionalLight
var createDirectionalLight = function(){
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.castShadow = true;
    directionalLight.position.set(0, 900, 0);

    directionalLight.shadow.mapSize.width = 2024;
    directionalLight.shadow.mapSize.height = 2024;

    directionalLight.shadow.camera.far = 950;
    directionalLight.shadow.camera.left = -100;
    directionalLight.shadow.camera.right = 100;
    directionalLight.shadow.camera.top = 100;
    directionalLight.shadow.camera.bottom = -100;
}

// Criação da PointLight
var createPointLight = function(){
    pointLight = new THREE.PointLight(0xff0000, 50, 100); // Luz vermelha forte
    pointLight.position.set(0, 5, 0); // Posição próxima ao centro
    pointLight.castShadow = true;
}

// Criação da SpotLight
var createSpotLight = function(){
    spotLight = new THREE.SpotLight(0x00ffff, 50, 100, Math.PI / 6, 0.5, 1);
    spotLight.position.set(50, 50, 0);
    spotLight.target.position.set(0, 0, 0); // Aponta para o centro
    scene.add(spotLight.target);
    spotLight.castShadow = true;
}

var luzAmbiente = function(){
    let amb = new THREE.AmbientLight(0xffffff, .5);
    scene.add(amb);
}


var setAction = function( animacao){
    if (animacao != activeAnimation){
        lastAnimation = activeAnimation;
        activeAnimation = animacao;
        lastAnimation.stop();
        activeAnimation.reset().play(); 
    }
}

var switchLight = function(type){
    // Remove a luz anterior
    if (directionalLight.parent) scene.remove(directionalLight);
    if (spotLight.parent) scene.remove(spotLight);
    if (pointLight.parent) scene.remove(pointLight);
    
    // Adiciona a nova luz
    if (type === 'Directional') {
        scene.add(directionalLight);
    } else if (type === 'Spot') {
        scene.add(spotLight);
    } else if (type === 'Point') {
        scene.add(pointLight);
    }
    currentLightType = type;
}

var createGui = function(){
    const gui = new GUI();

    parametrosGui = {
        scale: 1,
        positionX : 0,
        lobaoScale : 30,
        lobaoRotationY: 0,
        opt : 'Origem',
        lightType: 'Directional'

    }

    // Pasta de Iluminação
    let lightFolder = gui.addFolder("Iluminação");
    lightFolder.add(parametrosGui, 'lightType')
        .options(['Directional', 'Spot', 'Point'])
        .name("Tipo de Luz")
        .onChange(switchLight);
        
    // Adicione controles (SpotLight)
    let spotFolder = lightFolder.addFolder("Controle SpotLight");
    spotFolder.add(spotLight.position, 'x').min(-100).max(100).step(1).name('Pos X');
    spotFolder.add(spotLight.position, 'y').min(1).max(100).step(1).name('Pos Y');
    spotFolder.add(spotLight, 'angle').min(0).max(Math.PI / 2).step(0.01).name('Ângulo');

    let scale  = gui.add (parametrosGui, 'scale')
        .min (0.1)
        .max(10)
        .step (0.3)
        .name("Scale");
    scale.onChange(function(value){
        objects["ombro"].scale.x = objects["ombro"].scale.y = objects["ombro"].scale.z = value;
    }); 

    let position = gui.addFolder("Position");

    let lobao = gui.addFolder("Lobao");
    lobao.add (parametrosGui, 'lobaoScale')
        .min (0)
        .max(40)
        .step (1)
        .name("Scale")
        .onChange(function(value){
            objects["dragon"].scale.x  = objects["dragon"].scale.y = objects["dragon"].scale.z = value;
        }
    );
    lobao.add (parametrosGui, 'lobaoRotationY')
        .min (-2)
        .max(2)
        .step (0.1)
        .name("Rotation")
        .onChange(function(value){
            objects["dragon"].rotation.y =  value;
        }
    );
     let options = ['Origem', 'Lobao']
    lobao.add(parametrosGui, 'opt')
        .options(options)
        .name("Look")
        .onChange(function(value){
            console.log(value);
            if (value == "Lobao")
                camera.lookAt(objects["lobao"].position);
            else
                camera.lookAt(objects["dragon"].position);
        });


    position.add (parametrosGui, 'positionX')
        .min (-4)
        .max(4)
        .step (0.1)
        .name("X")
        .onChange(function(value){
            objects["ombro"].position.x = value;
        }
    ); 
}

var loadObj = function(){
    let objLoader = new OBJLoader();
    let fbxLoader = new FBXLoader();
    let textLoader = new THREE.TextureLoader();

    objLoader.load (
        "assets/Wolf.obj",
        function(obj){
            obj.traverse(function (child){
                if (child instanceof THREE.Mesh){
                    child.material = new THREE.MeshNormalMaterial();
                }
            });
            scene.add(obj);
            objects["lobao"] = obj;
            obj.position.x = 90;
            obj.scale.x = obj.scale.y = obj.scale.z = 30;

            
        },
        function(progress){
            console.log("ta vivo! "+(progress.loaded/progress.total)*100 + "%");
        },
        function(error){
            console.log("Deu merda " + error);
        }
    );

    fbxLoader.load (
        "asset/source/MegaLycanroc.fbx",
        function(obj){
            obj.traverse(function (child){
                if (child instanceof THREE.Mesh){
                    console.log(child)

                    let texture = textLoader.load("assets/textures/pm0829_12_body_col.png");
                    child.material =  new THREE.MeshStandardMaterial({map: texture});
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            scene.add(obj);
            objects["dragon"] = obj;
            obj.position.x = -10;
            obj.scale.x = obj.scale.y = obj.scale.z = 0.01;
            obj.position.y -=5.8;


            //Animation stuff
            let animation;

            mixer = new THREE.AnimationMixer(obj);

            //voando
            animation = mixer.clipAction(obj.animations[1]);
            animationActions.push(animation);

            //andando
            animation = mixer.clipAction(obj.animations[0]);
            animationActions.push(animation);

            //idle
            animation = mixer.clipAction(obj.animations[2]);
            animationActions.push(animation);

             //apertado banheiro
            animation = mixer.clipAction(obj.animations[3]);
            animationActions.push(animation);

             


            activeAnimation = animation;

            setAction(animationActions[0]);

            loadFinished = true;
            
            activeAnimation.play();
     
            
        },
        function(progress){
            console.log("ta vivo! "+(progress.loaded/progress.total)*100 + "%");
        },
        function(error){
            console.log("Deu merda " + error);
        }
    );
}

export function init() {

    camera = new THREE.PerspectiveCamera( 100, window.innerWidth / window.innerHeight, 0.1, 200 );
   
    
    //cria o mundo
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xcce0ff);

    
    renderer = new THREE.WebGLRenderer( );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;


   
    criaIluminacao();
    //criaSer();
    createGui();
    loadObj();

    console.log('QUALER COISA');
    camera.position.z = 60;
    //necessário se queremos fazer algo com animação
    renderer.setAnimationLoop( nossaAnimacao );
    
    document.body.appendChild( renderer.domElement );

    renderer.render( scene, camera );


    //GROUND

    let textLoader = new THREE.TextureLoader();
    let textGround = textLoader.load("assets/grasslight-big.jpg");
    textGround.wrapS = textGround.wrapT = THREE.RepeatWrapping;
    textGround.repeat.set(25,25);
    textGround.anisotropy = 16;


    let materialGround = new THREE.MeshStandardMaterial({map: textGround});

    let ground = new THREE.Mesh(new THREE.PlaneGeometry(1000,1000),
                                 materialGround);

    ground.rotation.x = -Math.PI/2;
    ground.position.y-=6;

    ground.receiveShadow = true;

    scene.add(ground);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousemove', makeMove);
    document.addEventListener('mouseup', clickOn);
    document.addEventListener('mousedown', ClickOff);

    window.addEventListener( 'resize', onWindowResize );
}

const getForwardVector = () => {
    return new THREE.Vector3(0, 0, 1);
};

var nossaAnimacao = function () {
   
    let delta = clock.getDelta();
    if (loadFinished){
        mixer.update(delta);
        const dragon = objects["dragon"];
        //movimentacao
        if(isMovingForward && objects["dragon"]){

            let direction = getForwardVector();

            direction.applyQuaternion(dragon.quaternion);

            dragon.position.addScaledVector(direction, dragonFowardSpeed * delta);
        }
    } 
    
    renderer.render( scene, camera );
}


/**
 * Section of mouse mouve
 * 
 */
var click = false;
var mousePosition = {
    x: 0,
    y: 0,
    z: 0
};

var  makeMove = function(e){
    
    if (click){
        let deltaX =  mousePosition.x - e.offsetX;
        let deltaY  =  mousePosition.y - e.offsetY;
        
        let eulerMat = new THREE.Euler(0, toRadians(deltaX)*0.1, 0, "YXZ");
        let quater = new THREE.Quaternion().setFromEuler(eulerMat);
        camera.quaternion.multiplyQuaternions(quater,camera.quaternion);
    }
     mousePosition = {
        x: e.offsetX,
        y : e.offsetY
    }
}

var ClickOff  = function (e) {
    click = true;
}
var clickOn = function (e) {
    click = false;
    
}

var toRadians = function (value){
    return value*(Math.PI/180);
}




// Moves
var velOmbro = 0.01;
var velCotovelo = 0.01;

var onKeyUp = function (e){
    if(e.keyCode == 87){
        isMovingForward = false;
        setAction(animationActions[0]);
    }
}

var onKeyDown = function (e){
   
    if (e.keyCode == 187){ // +
        objects["ombro"].scale.x+= 0.01;
        objects["ombro"].scale.y+= 0.01;
        objects["ombro"].scale.z+= 0.01;
    }

    if (e.keyCode == 189){ //-
        objects["cubo1"].scale.x-= 0.01;
        objects["cubo1"].scale.y-= 0.01;
        objects["cubo1"].scale.z-= 0.01;
    }

    if (e.keyCode == 82){ //R
         objects["pivoOmbro"].rotation.x-= velOmbro;
         if (objects["pivoOmbro"].rotation.x < -1.62 || objects["pivoOmbro"].rotation.x > 0.9)
            velOmbro*=-1;

    }
    if (e.keyCode == 32) // space
            velCubo = velCubo == 0 ? 0.001 : 0;

    if(e.keyCode == 87 && !isMovingForward){ // W
        console.log("cheguei aqui");
        isMovingForward = true;
        setAction(animationActions[1]);
    }
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}


