import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {lessons} from '../src/data.js';
import {checkMission} from '../src/missionValidation.js';
import {getMissionChecks} from '../src/extraCases.js';
import {exampleSolutions} from './solution-fixtures.js';

// Ejecuta literalmente el bloque de Python del Worker en CPython para comprobar
// entrada, stdout, errores y análisis AST sin requerir conexión al CDN.
const source=readFileSync(new URL('../public/python-worker.js',import.meta.url),'utf8');
const match=source.match(/const pythonRunner=String\.raw`([\s\S]*?)`;\s*self\.onmessage/);
assert.ok(match,'El motor Python debe estar en el Worker');
const runner=match[1];
function pythonBatch(jobs){
  const serialized=JSON.stringify(jobs.map(({code,inputs=[]})=>({code,inputs})));
  const script=`import json\n_jobs=json.loads(${JSON.stringify(serialized)})\n_results=[]\n`+
    `for _job in _jobs:\n`+
    `    _AEROBOT_CODE_JSON=json.dumps(_job['code'])\n`+
    `    _AEROBOT_INPUTS_JSON=json.dumps(_job['inputs'])\n`+
    `    _AEROBOT_ECHO_PROMPTS=False\n`+
    `    exec(${JSON.stringify(runner)})\n`+
    `    _results.append(_result)\n`+
    `print(json.dumps(_results,ensure_ascii=False))\n`;
  const finished=spawnSync('python3',['-c',script],{encoding:'utf8',timeout:8000,maxBuffer:2000000});
  assert.equal(finished.status,0,finished.stderr||`Python terminó con ${finished.signal}`);
  return JSON.parse(finished.stdout.trim());
}
function python(code,inputs=[]){return pythonBatch([{code,inputs}])[0]}


test('laboratorio ejecuta Python real: operaciones, entradas, bibliotecas, excepciones y funciones',()=>{
  assert.equal(python(`print(2**8)`).output,'256');
  assert.equal(python(`from math import sqrt\nprint(sqrt(81))`).output,'9.0');
  assert.equal(python(`nombre=input('Nombre: ')\nprint(f'Hola {nombre}')`,['Maya']).output,'Hola Maya');
  assert.equal(python(`import sys\na,b=map(int,sys.stdin.readline().split())\nprint(a+b)`,['4 8']).output,'12');
  assert.equal(python(`def f(x):\n return x*x\nprint(f(6))`).output,'36');
  assert.equal(python(`try:\n print(1/0)\nexcept ZeroDivisionError:\n print('No dividir entre cero')`).output,'No dividir entre cero');
  assert.equal(python(`print(1/0)`).error.includes('ZeroDivisionError'),true);
  assert.equal(python(`input()`).error.includes('EOFError'),true);
  assert.equal(python(`nombre=input()\nprint(nombre)`,['Ada']).features.includes('input'),true);
});

test('las 40 misiones se resuelven con código realmente ejecutado y múltiples entradas',()=>{
  assert.equal(exampleSolutions.length,40);
  const jobs=[];
  const segments=[];
  for(let i=0;i<lessons.length;i++){
    const mission=lessons[i],code=exampleSolutions[i],cases=getMissionChecks(mission,i);
    const start=jobs.length;
    jobs.push({code,inputs:mission.check.cases?.[0]?.inputs||[]});
    cases.forEach(c=>jobs.push({code,inputs:c.inputs}));
    segments.push({start,checks:cases});
  }
  const results=pythonBatch(jobs);
  for(let i=0;i<lessons.length;i++){
    const mission=lessons[i],code=exampleSolutions[i];
    const {start,checks}=segments[i];
    const visible=results[start],tests=results.slice(start+1,start+1+checks.length);
    const verified=checkMission(mission.check.type==='cases'?{...mission,extraChecks:checks.slice(mission.check.cases.length)}:mission,
      i,code,visible,tests);
    assert.equal(verified.passed,true,`Misión ${i+1}: ${mission.title}: ${verified.feedback}. Output ${visible.output} error ${visible.error}`);
  }
});


test('no se aprueban respuestas fijas ni un saludo equivocado',()=>{
  const m=lessons[10];
  const code='print("Saludos Ana")';
  const cases=getMissionChecks(m,10).map(c=>python(code,c.inputs));
  const evaluation={...m,extraChecks:cases.slice(m.check.cases.length)};
  assert.equal(checkMission(evaluation,10,code,python(code,['Ana']),cases).passed,false);
  assert.equal(checkMission(m,5,'print(15)',python('print(15)')).passed,false);
});
