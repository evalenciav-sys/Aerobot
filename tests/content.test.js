import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {lessons,tiers} from '../src/data.js';
import {levels} from '../src/roverLevels.js';
import {sameAnswer,checkMission} from '../src/missionValidation.js';
const read = file => readFileSync(new URL(file,import.meta.url),'utf8');

function solvable(world) {
  const key=(p,mask)=>p.join(',')+'/'+mask;
  const full=(1<<world.coins.length)-1;
  const at=(point,other)=>point.every((n,i)=>n===other[i]);
  const initial=world.coins.reduce((m,c,i)=>at(c,world.start)?m|(1<<i):m,0);
  const queue=[{p:world.start,mask:initial}],seen=new Set([key(world.start,initial)]);
  for(let i=0;i<queue.length;i++) {
    const {p,mask}=queue[i];
    if(at(p,world.goal)&&mask===full)return true;
    for(const d of [[0,1],[1,0],[0,-1],[-1,0]]){
      const n=[p[0]+d[0],p[1]+d[1]];
      if(n.some(x=>x<0||x>=world.size)||world.obstacles.some(o=>at(o,n)))continue;
      const m=world.coins.reduce((acc,c,j)=>at(c,n)?acc|(1<<j):acc,mask);
      if(!seen.has(key(n,m))){seen.add(key(n,m));queue.push({p:n,mask:m})}
    }
  }
  return false;
}
test('40 misiones en tres dificultades 10 + 10 + 20',()=>{
  assert.equal(lessons.length,40);
  assert.deepEqual(tiers.map(t=>[t.name,t.range[1]-t.range[0]+1]),[['Básico',10],['Intermedio',10],['Avanzado',20]]);
  assert.deepEqual(['Básico','Intermedio','Avanzado'].map(t=>lessons.filter(m=>m.level===t).length),[10,10,20]);
  assert.equal(new Set(lessons.map(m=>m.title)).size,40);
});
test('cada reto enseña estructura, ejemplo distinto, explicación y pasos; editor sin resolver',()=>{
  for(const [i,l] of lessons.entries()){
    assert.ok(l.title&&l.topic&&l.goal&&l.learn&&l.check&&l.hint,`Misión ${i+1}`);
    assert.equal(l.starter,'print()',`Editor con solución en misión ${i+1}`);
    assert.ok(l.learn.intro.length>=15 && l.learn.why.length>=15);
    assert.ok(l.learn.syntax.length>=8 && l.learn.example.length>=7);
    assert.ok(l.learn.steps.length>=2&&l.learn.steps.length<=3);
    assert.ok(l.learn.steps.every(x=>x.length>=8));
  }
});
test('los retos con entrada prueban resultados diferentes del mismo programa',()=>{
  let count=0;
  for(const [i,l] of lessons.entries())if(l.inputLabels){
    assert.equal(l.check.type,'cases',`Misión ${i+1}`);
    assert.ok(l.check.cases.length>=3,`Misión ${i+1}`);
    assert.ok(l.check.requires.includes('input('),`Misión ${i+1}`);
    for(const c of l.check.cases){assert.equal(c.inputs.length,l.inputLabels.length);assert.equal(typeof c.output,'string');count++}
  }
  assert.ok(count>=90);
});
test('acepta saludos con distinta separación y resultados numéricos equivalentes',()=>{
  assert.equal(sameAnswer('Hola,mundo','Hola, mundo',0),true);
  assert.equal(sameAnswer('  Hola,  mundo ','Hola, mundo',0),true);
  assert.equal(sameAnswer('15.0','15'),true);
  assert.equal(sameAnswer('9.0','9.00'),true);
  assert.equal(sameAnswer('Hola, Marte','Hola, mundo',0),false);
  assert.equal(sameAnswer('15.5','15'),false);
  const first=checkMission(lessons[0],0,'print("Hola,mundo")',{output:'Hola,mundo',error:'',vars:{}});
  assert.equal(first.passed,true);
  assert.equal(checkMission(lessons[0],0,'print()',{output:'',error:'',vars:{}}).passed,false);
});
test('rechaza programas que no superan todos los casos',()=>{
  const mission=lessons[10];
  const good=mission.check.cases.map(c=>({output:c.output,error:''}));
  const code='nombre = input()\nprint("Hola", nombre)';
  assert.equal(checkMission(mission,10,code,{output:'Hola Ada',error:'',vars:{}},good).passed,true);
  assert.equal(checkMission(mission,10,code,{output:'Hola Ada',error:'',vars:{}},[{output:'Hola Ada',error:''}]).passed,false);
  assert.equal(checkMission(mission,10,'print("Hola Ada")',{output:'Hola Ada',error:'',vars:{}},good).passed,false);
});
test('20 planetas de AstroRover tienen solución',()=>{
  assert.equal(levels.length,20);
  assert.equal(new Set(levels.map(x=>x.name)).size,20);
  for(const [i,world] of levels.entries())assert.ok(solvable(world),`Planeta ${i+1}`);
});
test('interfaz enseña antes de pedir el código y conserva AEROBOT',()=>{
  const main=read('../src/main.jsx'),html=read('../index.html');
  assert.match(main,/lessons\[selection\]\.learn\.syntax/);
  assert.match(main,/lessons\[selection\]\.learn\.example/);
  assert.match(main,/lessons\[selection\]\.learn\.steps\.map/);
  assert.match(main,/aerobot-progress-v5/);
  assert.match(main,/n<lessons\.length/);
  assert.match(main,/AERO<span className="brand-accent">BOT<\/span>/);
  assert.match(html,/<title>AEROBOT/);
  assert.doesNotMatch(main,/missionGuides/);
});
