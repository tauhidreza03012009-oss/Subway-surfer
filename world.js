import * as THREE from "three";
import RAPIER from "https://cdn.jsdelivr.net/npm/@dimforge/rapier3d-compat@0.14.0/rapier.es.js";
// Import the materials AND the loading tracker promise
import { matter, matter2, matter3, matter4, texturesLoaded } from './material.js';

// Re-export the promise directly so your main file can import it from './world.js'
export { texturesLoaded };

function createKBox(parent, ap, x, y, z, w, h, l, c) {
const geo = new THREE.BoxGeometry(w, h, l);
const mat = new THREE.MeshStandardMaterial({ color: c });
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(x, y, z);
ap.add(mesh);

let rdesc = RAPIER.RigidBodyDesc.kinematicPositionBased().setTranslation(x, y, z);
let rbody = parent.createRigidBody(rdesc);
let collider=RAPIER.ColliderDesc.cuboid(w / 2, h / 2, l / 2).setFriction(0).setRestitution(0.0).setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
parent.createCollider(collider, rbody);

return [mesh, rbody];
}

function createDBox(parent, ap, x, y, z, w, h, l, c) {
const geo = new THREE.BoxGeometry(w, h, l);
const mat = new THREE.MeshStandardMaterial({ color: c });
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(x, y, z);
ap.add(mesh);

let rdesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y, z);
let rbody = parent.createRigidBody(rdesc);
let collider = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, l / 2).setFriction(0.0)
parent.createCollider(collider, rbody);

return [mesh, rbody];
}

function createFBox(parent, ap, x, y, z, w, h, l, c) {
const geo = new THREE.BoxGeometry(w, h, l);
const mat = new THREE.MeshStandardMaterial({ color: c });
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(x, y, z);
ap.add(mesh);

let rdesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z);
let rbody = parent.createRigidBody(rdesc);
let collider = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, l / 2);
parent.createCollider(collider, rbody);

return [mesh, rbody];
}

function createNBox(parent, ap, x, y, z, w, h, l, c) {
const geo = new THREE.BoxGeometry(w, h, l);
const mat = new THREE.MeshStandardMaterial({ color: c });
const mesh = new THREE.Mesh(geo, mat);
mesh.position.set(x, y, z);
ap.add(mesh);

return mesh;
}

function createRigid(parent, ap, x, y, z, w, h, l, c) {
let rdesc = RAPIER.RigidBodyDesc.fixed().setTranslation(x, y, z);
let rbody = parent.createRigidBody(rdesc);
let collider = RAPIER.ColliderDesc.cuboid(w / 2, h / 2, l / 2);
parent.createCollider(collider, rbody);

return rbody;
}

function createInstanced(parent, ap, position, geo, mat) {
const mesh = new THREE.InstancedMesh(geo, mat, position.length);
const dummy = new THREE.Object3D();
position.forEach((p, i) => {
dummy.position.set(p.x, p.y, p.z);
dummy.updateMatrix();
mesh.setMatrixAt(i, dummy.matrix);
});
mesh.instanceMatrix.needsUpdate = true;
ap.add(mesh);

return mesh;
}

function instanceGroup(group, positions, parent) {
let p = [];
group.children.forEach(child => {
const mesh = new THREE.InstancedMesh(
child.geometry,
child.material,
positions.length
);

const dummy = new THREE.Object3D();  
positions.forEach((pos, i) => {  
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
parent.add(mesh);  
p.push(mesh);

})
return p;
}

let world = {
player: null,
obs: [],
groups: [[], []],
currentGroup: 0
};
export { world };

export function runtime(physics, scene, obs, offset = 0) {

let group = [];  

obs[0].forEach(x => {  

    let obstacle = createKBox(  
        physics,  
        scene,  
        x[1]*1.8-1.8,  
        0.5,  
        (x[0]+10+offset)*8,  
        1.5,  
        1,  
        8,  
        0x56deed  
    );

obstacle[0].frustumCulled = false;
group.push(obstacle);

});  


return group;

}

export function initialize(physics, scene){

world.player = createDBox(physics,scene, 0, 2, 0, 0.33, 1, 0.2, 0xff00ff);
world.player[1].setEnabledRotations(false, false, false, true);
world.lane1 = createNBox(physics, scene, 2.6, 0.05, 0, 0.25, 0.1, 400, 0x444444);
world.lane2 = createNBox(physics, scene, -2.6, 0.05, 0, 0.25, 0.1, 400, 0x444444);
world.lane3 = createNBox(physics, scene, 1.1, 0.05, 0, 0.25, 0.1, 400, 0x444444);
world.lane4 = createNBox(physics, scene, -1.1, 0.05, 0, 0.25, 0.1, 400, 0x444444);
world.lane5 = createNBox(physics, scene, 0.75, 0.05, 0, 0.25, 0.1, 400, 0x444444);
world.lane6 = createNBox(physics, scene, -0.75, 0.05, 0, 0.25, 0.1, 400, 0x444444);
world.main = createRigid(physics, scene, 0, 0.05, 0, 20, 0.1, 400, 0x444444);

const pad = [];
for (let i = -1; i < 2; i++) {
for (let j = 0; j < 100; j++) {
pad.push({ x: i * 1.85, y: 0.05, z: 1 * j });
}
}
const geo = new THREE.BoxGeometry(1.5, 0.05, 0.4);
const mat = new THREE.MeshStandardMaterial({ color: 0xccaa55 });
world.pads = [createInstanced(physics, scene, pad, geo, mat), pad];

const lamp = new THREE.Group();
const geo1 = new THREE.BoxGeometry(0.1, 3, 0.1);
const geo2 = new THREE.BoxGeometry(0.5, 0.1, 0.1);
const geo3 = new THREE.BoxGeometry(0.1, 0.1, 0.1);
const mat1 = new THREE.MeshStandardMaterial({ color: 0x555555 });
const mat2 = new THREE.MeshStandardMaterial({ color: 0x777777 });
const mat3 = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0xffaa00, emissiveIntensity: 1.0 });

const m1 = new THREE.Mesh(geo1, mat1); m1.position.y = 1.5; lamp.add(m1);
const m2 = new THREE.Mesh(geo2, mat2); m2.position.set(0.25, 3, 0); lamp.add(m2);
const m3 = new THREE.Mesh(geo3, mat3); m3.position.set(0.45, 2.9, 0); lamp.add(m3);

let lampost = [];
for (let i = 0; i < 50; i++) {
lampost.push({ x: -3, y: -0.1, z: i * 10 });
}
world.lamps = [instanceGroup(lamp, lampost, scene), lamp, lampost];

const lam = new THREE.Group();
const mr1 = new THREE.Mesh(geo1, mat1); mr1.position.y = 1.5;lam.add(mr1);
const mr2 = new THREE.Mesh(geo2, mat2); mr2.position.set(-0.25, 3, 0); lam.add(mr2);
const mr3 = new THREE.Mesh(geo3, mat3); mr3.position.set(-0.45, 2.9, 0); lam.add(mr3);

lampost = [];
for (let i = 0; i < 50; i++) {
lampost.push({ x: 3, y: -0.1, z: i * 10 });
}
world.lampsr = [instanceGroup(lam, lampost, scene), lam, lampost];

//==============================chunk 1==========================//
world.chunk1 = new THREE.Group();
scene.add(world.chunk1);
const geo4 = new THREE.BoxGeometry(0.1, 8, 320);
const geo5 = new THREE.BoxGeometry(0.1, 8, 32);
const ground = createNBox(physics, world.chunk1, 0, 0, 0, 50, 0.1, 352, 0x555555);

let k = new THREE.Mesh(geo4, matter);
let k1 = k.clone();
k1.position.set(-4, 4, 0);
k.position.set(4, 4, 0);
world.chunk1.add(k);
world.chunk1.add(k1);

let ke = new THREE.Mesh(geo5, matter3);
let ke1 = ke.clone();
ke1.position.set(-4, 4, 176);
ke.position.set(4, 4, 176);
world.chunk1.add(ke);
world.chunk1.add(ke1);

const ground1= createNBox(physics, world.chunk1, 4, 8, 0, 1.5, 0.1, 352, 0x555555);
const ground2= createNBox(physics, world.chunk1, -4, 8, 0, 1.5, 0.1, 352, 0x555555);
//==============================chunk 2==========================//
world.chunk2 = new THREE.Group();
world.chunk2.position.z = 352;
scene.add(world.chunk2);

let k3 = new THREE.Mesh(geo4, matter2);
let k2 = k3.clone();
k3.position.set(-4, 4, 0);
k2.position.set(4, 4, 0);
world.chunk2.add(k3);
world.chunk2.add(k2);

let ket = new THREE.Mesh(geo5, matter4);
let ket1 = ket.clone();
ket1.position.set(-4, 4, 176);
ket.position.set(4, 4, 176);
world.chunk2.add(ket);
world.chunk2.add(ket1);
createNBox(physics, world.chunk2, 4, 0.5, 0, 2, 2, 352, 0x999999);
createNBox(physics, world.chunk2,- 4, 0.5, 0, 2, 2, 352, 0x999999);
createNBox(physics, world.chunk2, 0, 8, 0, 50, 0.1, 352, 0x555555);
createNBox(physics, world.chunk2, 0, 0, 0, 50, 0.1, 352, 0x6b4c2a);
createNBox(physics, world.chunk2, 0, 7, -176, 50, 2, 2, 0x6b4c2a);
createNBox(physics, world.chunk2, 4, 4, -176, 1.5, 8, 0.5, 0x6b4c2a);
createNBox(physics, world.chunk2, -4, 4, -176, 1.5, 8, 0.5, 0x6b4c2a);

  }
