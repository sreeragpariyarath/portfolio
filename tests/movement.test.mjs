import test from 'node:test';
import assert from 'node:assert/strict';
import {stepPosition, nearestProject, stepToward} from '../app/movement.ts';
test('movement is normalized: diagonal speed matches forward speed',()=>{
 const start={x:0,z:0};const straight=stepPosition(start,{x:0,z:-1},.05,false,[]);const diagonal=stepPosition(start,{x:1,z:-1},.05,false,[]);
 assert.ok(Math.abs(Math.hypot(diagonal.x,diagonal.z)-Math.abs(straight.z))<1e-10);
});
test('running increases speed and stale frame time is clamped',()=>{
 const start={x:0,z:0};assert.equal(stepPosition(start,{x:1,z:0},10,false,[]).x,.2);assert.ok(Math.abs(stepPosition(start,{x:1,z:0},.05,true,[]).x-.35)<1e-10);
});
test('collisions reject a blocked axis while allowing sliding',()=>{
 const pos=stepPosition({x:0,z:0},{x:1,z:1},.05,false,[{x:.8,z:0,w:.7,d:4}]);assert.equal(pos.x,0);assert.ok(pos.z>0);
});
test('world boundaries prevent leaving the scene',()=>{
 const pos=stepPosition({x:18,z:-23},{x:1,z:-1},.05,true,[]);assert.deepEqual(pos,{x:18,z:-23});
});
test('a project reveals only inside the interaction radius; nearest wins',()=>{
 const stops=[{id:'one',x:0,z:0},{id:'two',x:2,z:0}];assert.equal(nearestProject({x:1.8,z:0},stops),'two');assert.equal(nearestProject({x:10,z:10},stops),null);
});

test('guided routes arrive without oscillating or overshooting at low frame rates',()=>{
 let position={x:0,z:10};const target={x:0,z:6};
 for(let frame=0;frame<6;frame++)for(let substep=0;substep<5;substep++)position=stepToward(position,target,.05,[]);
 assert.ok(Math.hypot(position.x-target.x,position.z-target.z)<1e-10);
});
