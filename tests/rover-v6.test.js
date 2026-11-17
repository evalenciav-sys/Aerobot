import test from 'node:test';
import assert from 'node:assert/strict';
import {levels} from '../src/roverLevels.js';
import {findRoute,gameRules,validateRoverProgram,MOVES} from '../src/roverEngine.js';
function follow(world,program){
  let [x,y]=world.start;
  const seen=new Set();
  for(const cmd of program){
    const {dx,dy}=MOVES.find(d=>d.id===cmd.id);
    for(let i=0;i<cmd.repeat;i++){
      x+=dx;y+=dy;
      assert.ok(x>=0&&y>=0&&x<world.size&&y<world.size);
      assert.ok(!world.obstacles.some(o=>o[0]===x&&o[1]===y),'Ruta sin colisiones');
      world.coins.forEach((c,j)=>{if(c[0]===x&&c[1]===y)seen.add(j)});
    }
  }
  assert.deepEqual([x,y],world.goal);
  assert.equal(seen.size,world.coins.length);
}
test('los 20 planetas tienen programa ganador dentro del presupuesto de bloques',()=>{
 for(const [i,w] of levels.entries()){
  const rules=gameRules(w,i);
  assert.ok(rules.compressed.length>0,`Planeta ${i+1} tiene solución`);
  assert.ok(rules.compressed.length<=rules.maxBlocks,`Planeta ${i+1} cabe en bloques`);
  assert.equal(validateRoverProgram(rules.compressed,w,i).ok,true,`Planeta ${i+1} acepta solución`);
  follow(w,rules.compressed);
 }
});
test('desde el planeta 8 un programa solo de flechas no puede ganar',()=>{
 for(let i=7;i<levels.length;i++){
  const w=levels[i], rules=gameRules(w,i),simple=findRoute(w,1);
  assert.ok(rules.maxBlocks<simple.length,`Planeta ${i+1} fuerza compresión`);
  assert.ok(rules.compressed.some(c=>c.repeat>1),`Planeta ${i+1} tiene ciclo útil`);
  assert.equal(validateRoverProgram(simple,w,i).ok,false);
 }
});
test('niveles básicos son secuenciales y las repeticiones se validan',()=>{
 assert.equal(gameRules(levels[0],0).usesCycles,false);
 assert.equal(gameRules(levels[7],7).usesCycles,true);
 assert.equal(validateRoverProgram([{id:'right',repeat:4}],levels[7],7).ok,false);
});
