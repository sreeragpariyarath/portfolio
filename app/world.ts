import * as THREE from 'three';
import { SVGRenderer, SVGObject } from 'three/examples/jsm/renderers/SVGRenderer.js';
import { PROJECTS } from './projects';
import { nearestProject, Obstacle, Point, SPAWN, stepPosition, stepToward } from './movement';

export type WorldState={position:Point;nearest:string|null;moving:boolean};
export type WorldAPI={destroy:()=>void;reset:()=>void;travel:(id:string)=>void;press:(key:string,down:boolean)=>void};
export function createWorld(host:HTMLDivElement,onState:(s:WorldState)=>void,onInteract:(id:string)=>void,onReady:()=>void):WorldAPI {
 const scene=new THREE.Scene();scene.background=new THREE.Color('#f4f2eb');scene.fog=new THREE.Fog('#f4f2eb',34,76);
 const canvas=document.createElement('canvas');
 const context=canvas.getContext('webgl2',{antialias:true,alpha:false});
 const vector=!context;
 const renderer:THREE.WebGLRenderer|SVGRenderer=context?new THREE.WebGLRenderer({canvas,context,antialias:true,alpha:false,powerPreference:'high-performance'}):new SVGRenderer();
 host.dataset.renderMode=vector?'vector':'webgl';
 if(vector){(renderer as SVGRenderer).setQuality('high');}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.6));renderer.setSize(host.clientWidth,host.clientHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;
 renderer.domElement.setAttribute('aria-label','Walkable pencil city. Use WASD or arrow keys to move, E to inspect nearby projects.');
 host.appendChild(renderer.domElement);
 const camera=new THREE.PerspectiveCamera(43,host.clientWidth/host.clientHeight,.1,130);
 scene.add(new THREE.HemisphereLight(0xffffff,0xc7c0af,2.7));if(vector)scene.add(new THREE.AmbientLight('#ffffff',.55));const sun=new THREE.DirectionalLight('#ffffff',vector?.35:2);sun.position.set(-10,30,15);scene.add(sun);
 let seed=203;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const textures:THREE.Texture[]=[];
 function hatch(base:string,density=80){const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d')!;ctx.fillStyle=base;ctx.fillRect(0,0,256,256);ctx.strokeStyle='rgba(50,46,42,.17)';ctx.lineWidth=.65;for(let i=0;i<density;i++){const x=rand()*320-40,y=rand()*320-40;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+35+rand()*70,y-40-rand()*60);ctx.stroke();}for(let i=0;i<300;i++){ctx.fillStyle=`rgba(38,35,31,${rand()*.12})`;ctx.fillRect(rand()*256,rand()*256,1,1);}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.userData.base=base;textures.push(t);return t;}
 const paper=new THREE.MeshStandardMaterial({color:'#ffffff',map:hatch('#f3f0e7'),roughness:1});
 const pale=new THREE.MeshStandardMaterial({color:'#ffffff',map:hatch('#dedbd2',120),roughness:1});
 const graphite=new THREE.MeshStandardMaterial({color:'#ffffff',map:hatch('#343532',190),roughness:1});
 const road=new THREE.MeshStandardMaterial({color:'#ffffff',map:hatch('#d5d2c9',220),roughness:1});
 const edgeMat=new THREE.LineBasicMaterial({color:'#484740',transparent:true,opacity:.73});
 const obstacles:Obstacle[]=[];
 function mesh(geo:THREE.BufferGeometry,mat:THREE.Material,x=0,y=0,z=0,parent:THREE.Object3D=scene,outline=true){if(vector&&mat instanceof THREE.MeshStandardMaterial&&mat.map?.userData.base){mat.color.set(mat.map.userData.base);}const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);if(parent===scene&&y<=.1)m.renderOrder=-100;parent.add(m);if(outline){const e=new THREE.LineSegments(new THREE.EdgesGeometry(geo,32),edgeMat);e.renderOrder=m.renderOrder;m.add(e);}return m;}
 function box(w:number,h:number,d:number,x:number,y:number,z:number,mat=paper,parent:THREE.Object3D=scene){return mesh(new THREE.BoxGeometry(w,h,d),mat,x,y,z,parent);}
 function line(points:number[][],parent:THREE.Object3D=scene,color='#747268',opacity=.55){const g=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(p[0],p[1],p[2])));const l=new THREE.Line(g,new THREE.LineBasicMaterial({color,transparent:true,opacity}));parent.add(l);return l;}
 function label(text:string,x:number,y:number,z:number,size=3.6,color='#34362f'):THREE.Object3D {
  if(vector){const group=document.createElementNS('http://www.w3.org/2000/svg','g');const node=document.createElementNS('http://www.w3.org/2000/svg','text');node.setAttribute('text-anchor','middle');node.setAttribute('fill',color);node.setAttribute('font-family','monospace');node.setAttribute('font-size',String(size*2.8));node.setAttribute('font-weight','600');node.textContent=text;group.appendChild(node);const object=new SVGObject(group);object.position.set(x,y,z);scene.add(object);return object;}
  const c=document.createElement('canvas');c.width=768;c.height=160;const ctx=c.getContext('2d')!;ctx.font='600 48px monospace';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,384,70);ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(160,96);ctx.lineTo(603,92);ctx.stroke();const tex=new THREE.CanvasTexture(c);textures.push(tex);const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthTest:false}));sprite.position.set(x,y,z);sprite.scale.set(size,size*160/768,1);scene.add(sprite);return sprite;
 }
 const ground=mesh(new THREE.PlaneGeometry(150,150),paper,0,-.09,0,scene,false);ground.rotation.x=-Math.PI/2;ground.renderOrder=-1000;
 box(5,.07,51,0,-.02,-2,road);
 for(const x of [-3,3]){box(.9,.11,51,x,0,-2,paper);for(let z=-26;z<24;z+=2)line([[x-.4,.07,z],[x+.4,.07,z]]);}
 for(let z=-25;z<23;z+=3.1)box(.07,.015,1.1,0,.04,z,paper);
 for(const z of [-15,-9,0,6]){box(21,.035,2.6,0,.015,z,pale);for(let x=-10;x<=10;x+=1.3)line([[x,.04,z-1.2],[x,.04,z+1.2]],scene,'#938f83',.25);}
 for(const z of [2.4,-6.2])for(let x=-2;x<2.5;x+=.75)box(.38,.02,1.25,x,.06,z,paper);
 // Light pencil ground marks and a quiet boundary, rather than an invisible wall.
 for(let i=0;i<(vector?60:230);i++){const x=rand()*42-21,z=rand()*52-28;if(Math.abs(x)<4)continue;line([[x,.025,z],[x+.25+rand()*.45,.025,z-.22]],scene,'#aaa496',.28);}
 for(const x of [-18.5,18.5])line([[x,.015,-24],[x,.015,19]],scene,'#8c877a',.4);
 for(const z of [-23.5,18.5])line([[-18.5,.015,z],[18.5,.015,z]],scene,'#8c877a',.4);
 function tree(x:number,z:number,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);scene.add(g);mesh(new THREE.CylinderGeometry(.09,.17,1.8,5),graphite,0,.9,0,g);const crown=mesh(new THREE.IcosahedronGeometry(.9,0),pale,0,2.2,0,g);crown.scale.set(1,1.25,1);mesh(new THREE.IcosahedronGeometry(.65,0),paper,.5,2.05,0,g);obstacles.push({x,z,w:s*.8,d:s*.8});}
 function lamp(x:number,z:number){mesh(new THREE.CylinderGeometry(.045,.065,2.5,6),graphite,x,1.25,z);box(.27,.12,.27,x,.07,z,graphite);box(.38,.48,.38,x,2.65,z,paper);mesh(new THREE.ConeGeometry(.34,.3,4),graphite,x,3.04,z);}
 for(const z of [-20,-11,-2,8,16]){lamp(-3.8,z);lamp(3.8,z+1.4);}
 for(const [x,z,s] of [[-6,8,1.1],[6,14,1.3],[-7,-7,1],[7,-17,1.1],[-16,9,1.7],[16,0,1.4],[-15,-22,1.3],[15,-21,1.6],[-8,16,1.2],[10,15,.8]])tree(x,z,s);
 function bench(x:number,z:number){box(1.7,.12,.5,x,.58,z,pale);box(1.7,.55,.1,x,.98,z-.24,pale);for(const d of [-.65,.65])box(.07,.55,.4,x+d,.28,z,graphite);}
 bench(-5,5);bench(5,-5);bench(-5,-19);
 const rings:THREE.Mesh[]=[];
 for(const [index,p] of PROJECTS.entries()){
  const side=p.x<0?-1:1;const bx=p.x+side*4,bz=p.z;const w=4.3,d=4.8,h=index===2?6.8:index===1?4.2:3.6;
  const g=new THREE.Group();g.position.set(bx,0,bz);scene.add(g);
  const colorMat=new THREE.MeshStandardMaterial({map:hatch(p.color,120),roughness:1});
  box(w,h,d,0,h/2,0,paper,g);obstacles.push({x:bx,z:bz,w,d});
  // Dark recessed doorway and drawn window frames face the road.
  const front=-side*(w/2+.015);
  box(.035,1.8,.9,front,.9,.1,graphite,g);
  for(const zz of [-1.5,1.4]){box(.04,.85,.7,front,2.5,zz,pale,g);line([[front-side*.02,2.05,zz],[front-side*.02,2.92,zz]],g);}
  if(index===0){const roof=mesh(new THREE.ConeGeometry(3.6,1.9,4),colorMat,0,h+.9,0,g);roof.rotation.y=Math.PI/4;label('A B C',bx,h+2.7,bz,2.5);}
  if(index===1){box(4.7,.22,5.2,0,h+.1,0,pale,g);for(const zz of [-1.9,0,1.9])box(.8,.7,.8,0,h+.5,zz,paper,g);box(.6,2.3,.6,1.2,h+1.15,1.2,graphite,g);}
  if(index===2){mesh(new THREE.ConeGeometry(2.65,2,4),pale,0,h+1,0,g).rotation.y=Math.PI/4;mesh(new THREE.CylinderGeometry(.04,.05,2.8,5),graphite,0,h+3,0,g);mesh(new THREE.TorusGeometry(.9,.025,3,32),colorMat,0,h+3.8,0,g);box(.04,1.1,1,front,4.8,0,colorMat,g);}
  if(index===3){box(4.6,.18,5.2,0,h+.1,0,pale,g);box(.07,1.4,3.7,front,2.3,0,colorMat,g);for(let i=0;i<5;i++)line([[front-side*.05,1.6,-1.8+i*.8],[front-side*.05,3,-1.8+i*.8]],g);box(2.1,.2,2,-side*1.8,h+.3,0,colorMat,g);}
  // A coloured pencil flag identifies each portfolio stop.
  mesh(new THREE.CylinderGeometry(.025,.025,2.6,5),graphite,p.x,1.3,p.z-1.3);
  const flag=box(.8,.5,.025,p.x+.4,2.3,p.z-1.3,colorMat);flag.rotation.z=.04;
  label(p.number+' / '+p.title,p.x,3.4,p.z-1.2,4.5);
  const ring=mesh(new THREE.RingGeometry(.83,.89,48),new THREE.MeshBasicMaterial({color:p.color,side:THREE.DoubleSide,transparent:true,opacity:.8}),p.x,.08,p.z,scene,false);ring.rotation.x=-Math.PI/2;rings.push(ring);
 }
 // A modest skyline, fully modelled; no photographic backdrop.
 for(const [x,z,w,h,d] of [[-17,-14,3,5,4],[17,-14,3.5,7,4],[-17,-4,3,4.5,3],[17,13,4,3.2,3],[-13,16,3.4,2.8,3],[8,-25,4,5,3],[-1,-27,4,8,4],[16,-26,5,3.8,3]]){
  box(w,h,d,x,h/2,z,pale);obstacles.push({x,z,w,d});for(let y=1.5;y<h-.4;y+=1.8)for(let xx=-w/2+.65;xx<w/2;xx+=1.1)box(.45,.65,.025,x+xx,y,z+d/2+.015,paper);
 }
 label('THE LONG WAY IS THE GOOD WAY',0,.15,-22,6,'#8c877a');
 // Graphite Reaper: round faceless head, angular torso, slim joints, flared calves.
 const player=new THREE.Group();scene.add(player);
 const body=new THREE.Group();player.add(body);
 mesh(new THREE.SphereGeometry(.36,12,9),graphite,0,2.05,0,body);
 const torso=mesh(new THREE.CylinderGeometry(.21,.13,.68,4),graphite,0,1.42,0,body);torso.rotation.y=Math.PI/4;
 mesh(new THREE.SphereGeometry(.14,6,5),graphite,0,1.03,0,body);
 function limb(x:number,y:number,length:number,leg:boolean){const pivot=new THREE.Group();pivot.position.set(x,y,0);body.add(pivot);mesh(new THREE.CylinderGeometry(leg?.07:.055,leg?.085:.09,length,5),graphite,0,-length/2,0,pivot);if(leg){const calf=mesh(new THREE.CylinderGeometry(.07,.20,.48,4),graphite,0,-length+.06,.03,pivot);calf.rotation.y=Math.PI/4;}else{mesh(new THREE.IcosahedronGeometry(.11,0),graphite,0,-length,0,pivot);}return pivot;}
 const leftLeg=limb(-.14,1.05,.79,true),rightLeg=limb(.14,1.05,.79,true),leftArm=limb(-.25,1.72,.67,false),rightArm=limb(.25,1.72,.67,false);
 const shadow=mesh(new THREE.CircleGeometry(.55,24),new THREE.MeshBasicMaterial({color:'#242722',transparent:true,opacity:.15,depthWrite:false}),0,.07,0,scene,false);shadow.rotation.x=-Math.PI/2;shadow.scale.y=.65;
 const keys=new Set<string>();let position:Point={...SPAWN},nearest:string|null=null,phase=0,frame=0,last=performance.now(),lastUI=0,dead=false,lastDraw=0;
 let route:Point[]=[];let facing=Math.PI;const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function down(event:KeyboardEvent){const target=event.target as HTMLElement;if(target?.closest('input,textarea,dialog,[role="dialog"],[contenteditable]'))return;const k=event.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','shift','e','r',' '].includes(k))event.preventDefault();if(k==='e'&&!event.repeat&&nearest)onInteract(nearest);if(k==='r'&&!event.repeat)reset();keys.add(k);}
 function up(event:KeyboardEvent){keys.delete(event.key.toLowerCase());}
 const clear=()=>{keys.clear();last=performance.now();};
 window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);document.addEventListener('visibilitychange',clear);
 const resize=()=>{camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();renderer.setSize(host.clientWidth,host.clientHeight);};const observer=new ResizeObserver(resize);observer.observe(host);
 function reset(){position={...SPAWN};route=[];keys.clear();nearest=null;onState({position,nearest,moving:false});}
 function tick(now:number){if(dead)return;frame=requestAnimationFrame(tick);const dt=Math.min((now-last)/1000,.25);last=now;
  const paused=host.dataset.paused==='true';
  let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);
  let dz=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);
  if(paused){keys.clear();dx=dz=0;}else if(dx||dz)route=[];
  if(!paused&&route.length){const target=route[0];dx=target.x-position.x;dz=target.z-position.z;if(Math.hypot(dx,dz)<.18){route.shift();dx=dz=0;}}
  const before=position;const steps=Math.max(1,Math.ceil(dt/.05));for(let i=0;i<steps;i++)position=!paused&&route.length?stepToward(position,route[0],dt/steps,obstacles):stepPosition(position,{x:dx,z:dz},dt/steps,keys.has('shift'),obstacles);
  const moving=Math.hypot(position.x-before.x,position.z-before.z)>.0001;
  if(moving){phase+=dt*(keys.has('shift')?15:10);const target=Math.atan2(dx,dz);facing+=Math.atan2(Math.sin(target-facing),Math.cos(target-facing))*Math.min(1,dt*13);}
  player.rotation.y=facing;player.position.set(position.x,0,position.z);body.position.y=moving&&!reduced?Math.abs(Math.sin(phase))*.045:Math.sin(now*.0017)*.015;
  const stride=moving?Math.sin(phase)*.48:0;leftLeg.rotation.x=stride;rightLeg.rotation.x=-stride;leftArm.rotation.x=-stride*.75;rightArm.rotation.x=stride*.75;
  shadow.position.set(position.x,.07,position.z);
  const width=host.clientWidth;const offsetX=width>1000?-3.7:0;
  const look=new THREE.Vector3(position.x+offsetX,1,position.z-3.6);const desired=new THREE.Vector3(position.x+offsetX,13,position.z+17);
  if(lastUI===0){camera.position.copy(desired);}else camera.position.lerp(desired,reduced?1:1-Math.exp(-dt*4));camera.lookAt(look);
  const next=nearestProject(position,PROJECTS);
  for(let i=0;i<rings.length;i++){const active=PROJECTS[i].id===next;rings[i].scale.setScalar(active?1.25:1);}
  if(next!==nearest||now-lastUI>100){nearest=next;onState({position:{...position},nearest,moving});lastUI=now;}
  if(!vector||now-lastDraw>80){renderer.render(scene,camera);lastDraw=now;}
 }
 frame=requestAnimationFrame(tick);onReady();
 const contextLost=(e:Event)=>{e.preventDefault();host.dataset.error='true';};renderer.domElement.addEventListener('webglcontextlost',contextLost);
 return {reset,travel:(id)=>{const p=PROJECTS.find(p=>p.id===id);if(p){route=[{x:0,z:position.z},{x:0,z:p.z},{x:p.x,z:p.z}];keys.clear();}},press:(key,pressed)=>{if(pressed)keys.add(key);else keys.delete(key);},destroy:()=>{dead=true;cancelAnimationFrame(frame);observer.disconnect();window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);document.removeEventListener('visibilitychange',clear);renderer.domElement.removeEventListener('webglcontextlost',contextLost);scene.traverse(o=>{const m=o as THREE.Mesh;if(m.geometry)m.geometry.dispose();if(m.material){for(const mat of Array.isArray(m.material)?m.material:[m.material])mat.dispose();}});textures.forEach(t=>t.dispose());if(renderer instanceof THREE.WebGLRenderer)renderer.dispose();renderer.domElement.remove();}};
}
