import * as THREE from "three";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.es.js";
// Import the world setup along with the exported texture tracking promise
import { world, initialize, texturesLoaded ,runtime} from "./world.js";

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceed);
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.5, -4.5);
camera.lookAt(0, 0, 0);
scene.add(camera);

const light = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(light);
const light1 = new THREE.DirectionalLight(0xffffff, 1.0);
light1.position.set(0, 40, 40);
scene.add(light1);
scene.fog = new THREE.Fog(0x97deed, 0, 120);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let physics;
let movementTarget = {};
let isMoving = false;
let hasSwiped = false;
let motionReady = false;

// 🔥 STAGE LOOP ENTRY: Wait for physics framework initialization and all images to load
Promise.all([
RAPIER.init(),
texturesLoaded
]).then(() => {
const gravity = { x: 0, y: -9.81, z: 0 };
physics = new RAPIER.World(gravity);
let n = createPath();
world.c = n;
world.groups[0] =
runtime(physics, scene, n,0);

let n2 = createPath(n[1]);
initialize(physics, scene);
world.player[1].enableCcd(false);
world.player[1].setLinearDamping(0.1);
world.player[1].setAngularDamping(1.0);
world.player[1].restitution = 0;
init(physics);

setTimeout(() => {
let n2 = createPath(n[1]);
world.groups[1] = runtime(physics, scene, n2, 80);
}, 100);
});

let chunk;
let current = 0;
function init(physics) {
chunk = [world.chunk1, world.chunk2];
// Safe to start loop now because all textures and engines are fully ready
frame();
}

let then = 0;
let dt = 0;
let d = 0;
let dummy = new THREE.Object3D();
let lane = [1.8, 0, -1.8];
let currentLane = 1;
let gametime=0;
let ready = false;
let warmup = 0;
let isGameOver=false;

function createPath(forbid = Math.floor(Math.random() * 3)) {
    let n = [];
    let currentForbid = forbid;

    for (let k = 1; k <= 15; k++) {
        let b = Math.floor(Math.random() * 3);
        let obstacleForbid = currentForbid;

        if (Math.abs(currentForbid - b) < 2) {
            let j = [b, currentForbid, b];
            currentForbid = j[Math.floor(Math.random() * j.length)];
        }

        for (let i = 0; i < 3; i++) {
            if (i === obstacleForbid || i === b) continue;
            n.push([k, i]);
        }
    }

    return [n, currentForbid];
}



function repositionGroup(group,path,offset){

group.forEach((obs,i)=>{  

 let data = path?.[0]?.[i];

if(!data) return;

if(!data) return;  


    let x = data[1]*1.8-1.8;  

    let z = (data[0]+offset+10)*8;  


    obs[1].setTranslation(  
        {  
            x:x,  
            y:0.5,  
            z:z  
        },  
        true  
    );  


    obs[0].position.set(  
        x,  
        0.5,  
        z  
    );  

});

}

function frame(now = 0) {
  if (isGameOver) return;
if (!ready) {
physics.step();
warmup++;

if (warmup > 3) {
ready = true;
motionReady = true;   // ADD THIS
}

requestAnimationFrame(frame);
renderer.render(scene, camera);
return;}

dt = (now - then) / 1000;
if (dt > 0.033) dt = 0.033;
then = now;
let speed = 1 * dt;
d += speed;
gametime+=dt;
let recycle = world.currentGroup;

let canRecycle = world.groups[recycle].every(
obs => obs[1].translation().z < -20
);

if (canRecycle) {

world.currentGroup = (world.currentGroup + 1) % 2;  

let newPath = createPath(world.c[1]);  

world.groups[recycle].path = newPath;  

repositionGroup(  
    world.groups[recycle],  
    newPath,  
    15  
);  

world.c = newPath;

}
if (motionReady) {
world.groups.forEach(group => {

group.forEach(x => {  

    let body = x[1];  
    let pos = body.translation();  

    body.setNextKinematicTranslation({  
        x: pos.x,  
        y: pos.y,  
        z: pos.z - 10 * dt  
    });  

});

});

if (chunk[current].position.z < -352) {
chunk[current].position.z += 704;
current = current === 0 ? 1 : 0;
}

if (isMoving) {
let pos = world.player[1].translation();
let currentVel = world.player[1].linvel();
let targetX = lane[currentLane];
let distanceX = targetX - pos.x;

if (Math.abs(distanceX) < 0.05) {
world.player[1].setLinvel({
x: 0,
y: currentVel.y,
z: currentVel.z
}, true);

isMoving = false;

} else {
let moveSpeed = 12.0;
let newVelX = Math.sign(distanceX) * moveSpeed;
world.player[1].setLinvel({ x: newVelX, y: currentVel.y, z: 0 }, true);
}
}

world.pads[1].forEach((p, i) => {
p.z -= 10 * speed;
if (p.z < -10) p.z += 100;
dummy.position.set(p.x, p.y, p.z);
dummy.updateMatrix();
world.pads[0].setMatrixAt(i, dummy.matrix);
});

dummy = new THREE.Object3D();
world.lampsr[1].children.forEach((child, k) => {
let mesh = world.lampsr[0][k];
world.lampsr[2].forEach((pos, i) => {
pos.z -= 10 * speed;
if (pos.z < -10) pos.z += 500;
dummy.position.set(
pos.x + child.position.x,
pos.y + child.position.y,
pos.z + child.position.z
);
dummy.rotation.copy(child.rotation);
dummy.scale.copy(child.scale);
dummy.updateMatrix();
mesh.setMatrixAt(i, dummy.matrix);
});
mesh.instanceMatrix.needsUpdate = true;
scene.add(mesh);
});

dummy = new THREE.Object3D();
world.lamps[1].children.forEach((child, k) => {
let mesh = world.lamps[0][k];
world.lamps[2].forEach((pos, i) => {
pos.z -= 10 * speed;
if (pos.z < -10) pos.z += 500;
dummy.position.set(
pos.x + child.position.x,
pos.y + child.position.y,
pos.z + child.position.z
);
dummy.rotation.copy(child.rotation);
dummy.scale.copy(child.scale);
dummy.updateMatrix();
mesh.setMatrixAt(i, dummy.matrix);
});
mesh.instanceMatrix.needsUpdate = true;
scene.add(mesh);
});

world.pads[0].instanceMatrix.needsUpdate = true;
world.chunk1.position.z -= 10 * speed;
world.chunk2.position.z -= 10 * speed;
}
physics.step();
  
let playerPos = world.player[1].translation();
  for (let x of world.groups[1]) {
    let obsPos = x[1].translation();
    
    let overlapX = Math.abs(playerPos.x - obsPos.x) < (0.25 + 1.0);
    let overlapZ = Math.abs(playerPos.z - obsPos.z) < (0.25 + 4.0);
    let isHitFromFront = playerPos.y < (obsPos.y + 0.9); 

    if (overlapX && overlapZ && isHitFromFront) {
      console.log("Game Over! Head-on crash detected.");
      alert("Game Over!");
      isGameOver = true; // Flips the main switch to freeze the loop
          // Exits frame execution immediately
    }
  }
  for (let x of world.groups[0]) {
    let obsPos = x[1].translation();
    
    let overlapX = Math.abs(playerPos.x - obsPos.x) < (0.25 + 1.0);
    let overlapZ = Math.abs(playerPos.z - obsPos.z) < (0.25 + 4.0);
    let isHitFromFront = playerPos.y < (obsPos.y + 0.9); 

    if (overlapX && overlapZ && isHitFromFront) {
      console.log("Game Over! Head-on crash detected.");
      alert("Game Over!");
      isGameOver = true; // Flips the main switch to freeze the loop
         // Exits frame execution immediately
    }
  }
world.groups.forEach(group => {

group.forEach(x => {  

    let body = x[1];  
    let mesh = x[0];  

    let pos = body.translation();  

    mesh.position.set(  
        pos.x,  
        pos.y,  
        pos.z  
    );  

});

});
let t = world.player[1].translation();
let r = world.player[1].rotation();
world.player[0].position.set(t.x, t.y, t.z);
world.player[0].quaternion.set(r.x, r.y, r.z, r.w);
camera.position.set(world.player[0].position.x,world.player[0].position.y+2.5,world.player[0].position.z-4.5)

requestAnimationFrame(frame);
renderer.render(scene, camera);
}

let touch = {};
document.addEventListener("pointerdown", e => {
touch[e.pointerId] = {
sx: e.clientX,
sy: e.clientY
};
});

document.addEventListener("pointermove", e => {
if (touch[e.pointerId] && !hasSwiped) {
let dx = e.clientX - touch[e.pointerId].sx;
let dy = e.clientY - touch[e.pointerId].sy;

if (Math.abs(dy) > Math.abs(dx)) {  
  if (dy < -40) {  
    let currentVel = world.player[1].linvel();  
    if (Math.abs(currentVel.y) < 0.01) {  
      world.player[1].applyImpulse({ x: 0, y: 0.4, z: 0 }, true);  
    }  
    hasSwiped = true;  
  }  
} else {  
  if (dx < -40) {  
    if (currentLane > 0) {  
      currentLane--;  
      isMoving = true;  
    }  
    hasSwiped = true;  
  } else if (dx > 40) {  
    if (currentLane < 2) {  
      currentLane++;  
      isMoving = true;  
    }  
    hasSwiped = true;  
  }  
}  

if (isMoving) {  
  // 🛠️ FIX: Corrected raw object scope reference to world.player[1]  
  movementTarget = {  
    x: lane[currentLane],  
    y: world.player[1].translation().y,  
    z: world.player[1].translation().z  
  };  
}

}
});

document.addEventListener("pointerup", e => { delete touch[e.pointerId]; hasSwiped = false; });
document.addEventListener("pointercancel", e => { delete touch[e.pointerId]; hasSwiped = false; });
                          
