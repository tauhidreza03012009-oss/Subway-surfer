import * as THREE from "three";

// 1. Create a LoadingManager to monitor image load status
export const loadingManager = new THREE.LoadingManager();

// 2. Create and export a promise that resolves when everything is loaded
export const texturesLoaded = new Promise((resolve) => {
    loadingManager.onLoad = () => {
        console.log("All 6 game textures loaded completely!");
        resolve();
    };
});

// 3. Attach the loadingManager to your TextureLoader
const loader = new THREE.TextureLoader(loadingManager);

const texture = loader.load('./fr.png');
const ntext = loader.load('./fr1.png');
const texture1 = loader.load('./fr2.png');
const ntext1 = loader.load('./fr3.png');
const texture3 = loader.load('./fr4.png');
const texture4 = loader.load('./fr5.png');

texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.ClampToEdgeWrapping;
texture.repeat.set(10, 1);    

ntext.wrapS = THREE.RepeatWrapping;
ntext.repeat.set(10, 1); 

texture1.wrapS = THREE.RepeatWrapping;
texture1.wrapT = THREE.ClampToEdgeWrapping;
texture1.repeat.set(10, 1);    

ntext1.wrapS = THREE.RepeatWrapping;
ntext1.repeat.set(10, 1); 

const matter = new THREE.MeshStandardMaterial({ map: texture, normalMap: ntext, roughness: 0.7, metalness: 0.1 });
const matter2 = new THREE.MeshStandardMaterial({ map: texture1, normalMap: ntext1, roughness: 0.7, metalness: 0.1 });
const matter3 = new THREE.MeshStandardMaterial({ map: texture3, roughness: 0.7, metalness: 0.1 });
const matter4 = new THREE.MeshStandardMaterial({ map: texture4, roughness: 0.7, metalness: 0.1 });

// Export materials and the loading tracker
export { matter, matter2, matter3, matter4 };
