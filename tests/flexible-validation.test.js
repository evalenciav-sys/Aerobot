import test from 'node:test';
import assert from 'node:assert/strict';
import {sameAnswer,checkMission} from '../src/missionValidation.js';
import {lessons} from '../src/data.js';

// La calificación no debe depender de calcar las palabras de la muestra.
test('salidas numéricas con explicaciones, operaciones y decimal equivalente',()=>{
  assert.equal(sameAnswer('El resultado es: 15','15'),true);
  assert.equal(sameAnswer('Suma = 15.0','15'),true);
  assert.equal(sameAnswer('La suma es 16','15'),false);
  assert.equal(sameAnswer('5 + 10 = 15','15'),true);
  assert.equal(sameAnswer('5 + 10 = 14','15'),false);
  assert.equal(sameAnswer('Total 69.0','Total: 69.00'),true);
});
test('mensajes de texto, acentos, mayúsculas y signos no cambian aciertos',()=>{
  assert.equal(sameAnswer('¡HOLA, ADA!','Hola Ada'),true);
  assert.equal(sameAnswer('El robot dice: ¡Hola, mundo!','Hola, mundo'),true);
  assert.equal(sameAnswer('Respuesta: Sí','Si'),true);
  assert.equal(sameAnswer('Impar','Par'),false);
  assert.equal(sameAnswer('No es primo','Primo'),false);
  assert.equal(sameAnswer('No es segura','Segura'),false);
  assert.equal(sameAnswer('Respuesta: Primo','Primo'),true);
  assert.equal(sameAnswer('No es primo','No primo'),true);
  assert.equal(sameAnswer('Hola Marte','Hola mundo'),false);
});
test('las secuencias de resultados mantienen el orden y las líneas',()=>{
  assert.equal(sameAnswer('Paso 1\nPaso 2\nPaso 3\nPaso 4\nPaso 5','1\n2\n3\n4\n5'),true);
  assert.equal(sameAnswer('1\n2\n4\n3\n5','1\n2\n3\n4\n5'),false);
  assert.equal(sameAnswer('Pares: 2, 4','2,4'),true);
  assert.equal(sameAnswer('Pares: [2, 4]','2,4'),true);
  assert.equal(sameAnswer('Pares: 2, 6','2,4'),false);
});
test('la multiplicación admite variable y salida explicada, nunca imprimir literal sin operación',()=>{
  const m=lessons[5];
  const code='a = 3\nb = 5\nprint("El resultado es", a*b)';
  assert.equal(checkMission(m,5,code,{output:'El resultado es 15',error:'',vars:{},features:['mult']}).passed,true);
  const fake='print("El resultado es 15")  # *';
  const result=checkMission(m,5,fake,{output:'El resultado es 15',error:'',vars:{},features:[]});
  assert.equal(result.passed,false);
});
test('misiones de entrada aceptan distintas formas, pero exigen resolver los diferentes casos',()=>{
  const m=lessons[10],checks=m.check.cases.map(c=>({output:'Saludo: '+c.output,error:''}));
  const code='nombre = input ("Nombre: ")\nprint("Saludo: Hola", nombre)';
  assert.equal(checkMission(m,10,code,{output:'Saludo: Hola Ada',error:'',vars:{},features:['input']},checks).passed,true);
  assert.equal(checkMission(m,10,code,{output:'Saludo: Hola Ada',error:'',vars:{},features:['input']},checks.map((c,i)=>i===1?{output:'Hola Error',error:''}:c)).passed,false);
  assert.equal(checkMission(m,10,'print("Hola Ada")',{output:'Hola Ada',error:'',vars:{},features:[]},checks).passed,false);
});
test('las funciones y bucles del objetivo sí se comprueban sintácticamente',()=>{
  const m=lessons[31],t=m.check.cases.map(c=>({output:c.output,error:''}));
  assert.equal(checkMission(m,31,'def saludar(x):\n  print("Hola",x)\nsaludar(input())',{output:'Hola Ana',error:'',vars:{},features:['input','function','function:saludar']},t).passed,true);
  assert.equal(checkMission(m,31,'print("Hola", input())',{output:'Hola Ana',error:'',vars:{},features:['input']},t).passed,false);
  const counting=lessons[17];
  assert.equal(checkMission(counting,17,'for n in range(1,6):\n print(n)',{output:'1\n2\n3\n4\n5',error:'',features:['for']}).passed,true);
  assert.equal(checkMission(counting,17,'print(1,2,3,4,5,sep="\\n")',{output:'1\n2\n3\n4\n5',error:'',features:[]}).passed,false);
});

test('las secuencias numéricas se pueden imprimir como listas o tuplas',()=>{
  assert.equal(sameAnswer('[1, 2, 3, 4, 5]','1\n2\n3\n4\n5'),true);
  assert.equal(sameAnswer('Serie: (1, 2, 3, 4, 5)','1\n2\n3\n4\n5'),true);
  assert.equal(sameAnswer('[1, 2, 3, 5, 4]','1\n2\n3\n4\n5'),false);
  assert.equal(sameAnswer('[1, 2, 3]','1\n2\n3\n4\n5'),false);
});
test('unidades y explicaciones son opcionales pero el valor debe coincidir',()=>{
  assert.equal(sameAnswer('Resultado: 15 metros','15'),true);
  assert.equal(sameAnswer('La respuesta es 15.0 unidades','15'),true);
  assert.equal(sameAnswer('Resultado: 17 metros','15'),false);
  assert.equal(sameAnswer('2 + 3 = 6 metros','5'),false);
});
