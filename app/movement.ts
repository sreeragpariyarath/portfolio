export type Point={x:number;z:number};
export type Obstacle={x:number;z:number;w:number;d:number};
export const SPAWN:Point={x:0,z:10};
export function stepPosition(position:Point, direction:Point, dt:number, running:boolean, obstacles:Obstacle[]):Point {
 const length=Math.hypot(direction.x,direction.z);
 if(!length)return {...position};
 const distance=(running?7:4)*Math.min(Math.max(dt,0),.05);
 const dx=direction.x/length*distance,dz=direction.z/length*distance;
 const blocked=(x:number,z:number)=>obstacles.some(o=>Math.abs(x-o.x)<o.w/2+.36&&Math.abs(z-o.z)<o.d/2+.36);
 const x=Math.max(-18,Math.min(18,position.x+dx));
 const nextX=blocked(x,position.z)?position.x:x;
 const z=Math.max(-23,Math.min(18,position.z+dz));
 return {x:nextX,z:blocked(nextX,z)?position.z:z};
}
export function nearestProject(position:Point,projects:readonly (Point&{id:string})[],radius=3.2):string|null {
 let nearest:string|null=null,best=radius;
 for(const p of projects){const d=Math.hypot(p.x-position.x,p.z-position.z);if(d<best){best=d;nearest=p.id;}}
 return nearest;
}
export function stepToward(position:Point,target:Point,dt:number,obstacles:Obstacle[]):Point {
 const direction={x:target.x-position.x,z:target.z-position.z};
 const distance=Math.hypot(direction.x,direction.z);
 return stepPosition(position,direction,Math.min(dt,distance/4),false,obstacles);
}
