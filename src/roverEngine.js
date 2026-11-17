/* AstroRover: el presupuesto limita BLOQUES, no casillas recorridas.
   La ruta de referencia se calcula con BFS incluyendo cristales y ciclos x2/x3. */
export const MOVES = [
  {id:'up', dx:0, dy:-1, mark:'↑'},
  {id:'right', dx:1, dy:0, mark:'→'},
  {id:'down', dx:0, dy:1, mark:'↓'},
  {id:'left', dx:-1, dy:0, mark:'←'}
];
export function findRoute(world, maxRepeat=1) {
  const full=(1<<world.coins.length)-1;
  const key=(x,y,mask)=>`${x},${y},${mask}`;
  let initial=0;
  world.coins.forEach((c,i)=>{if(c[0]===world.start[0]&&c[1]===world.start[1])initial|=1<<i});
  const queue=[{x:world.start[0],y:world.start[1],mask:initial,path:[]}];
  const seen=new Set([key(...world.start,initial)]);
  for(let at=0;at<queue.length;at++) {
    const n=queue[at];
    if(n.x===world.goal[0]&&n.y===world.goal[1]&&n.mask===full)return n.path;
    for(const move of MOVES) {
      let x=n.x,y=n.y,mask=n.mask;
      for(let repeat=1;repeat<=maxRepeat;repeat++) {
        x+=move.dx;y+=move.dy;
        if(x<0||y<0||x>=world.size||y>=world.size||world.obstacles.some(o=>o[0]===x&&o[1]===y))break;
        world.coins.forEach((c,i)=>{if(c[0]===x&&c[1]===y)mask|=1<<i});
        const k=key(x,y,mask);
        if(!seen.has(k)){
          seen.add(k);
          queue.push({x,y,mask,path:[...n.path,{id:move.id,repeat}]});
        }
      }
    }
  }
  return [];
}
export function gameRules(world,index) {
  const usesCycles=index>=7;
  const basic=findRoute(world,1);
  const shortest=basic.length;
  const compressed=usesCycles?findRoute(world,3):basic;
  // Hay margen para resolver sin imponer una única ruta, pero nunca suficientes
  // bloques para escribir manualmente cada paso en los planetas de ciclos.
  const maxBlocks=usesCycles?Math.min(compressed.length+1,shortest-1):world.size*10;
  return {usesCycles,maxBlocks,maxSteps:world.size*10,shortest,compressed};
}
export function validateRoverProgram(commands,world,index) {
  const rules=gameRules(world,index);
  const totalSteps=commands.reduce((n,c)=>n+c.repeat,0);
  if(!commands.length)return {ok:false,message:'Agrega al menos una instrucción.'};
  if(commands.length>rules.maxBlocks)return {ok:false,message:`Usa ${rules.maxBlocks} bloques como máximo. Combina movimientos con ciclos.`};
  if(totalSteps>rules.maxSteps)return {ok:false,message:'Superaste el máximo de movimientos del planeta.'};
  if(commands.some(c=>!MOVES.some(d=>d.id===c.id)||!Number.isInteger(c.repeat)||c.repeat<1||c.repeat>3))return {ok:false,message:'Hay una instrucción no válida.'};
  if(rules.usesCycles&&!commands.some(c=>c.repeat>1))return {ok:false,message:'Este planeta requiere un ciclo. Usa ×2 o ×3 en una flecha.'};
  return {ok:true,message:''};
}
