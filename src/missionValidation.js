/** AEROBOT V7 — valoración por resultados, no por coincidencia literal con la muestra.
 * Los casos se ejecutan con el intérprete real. Los requisitos de estructura
 * se obtienen del AST de Python, no de comentarios o de palabras del código.
 */
const canonical = value => String(value ?? '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[¡!¿?"“”'‘’]/g,'')
  .replace(/[,;:]/g,' ')
  .replace(/\s+/g,' ')
  .trim().toLocaleLowerCase('es');
const numberPattern='[-+]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:[eE][-+]?\\d+)?';
const numberRe=new RegExp(`^${numberPattern}$`);
const allNumbersRe=new RegExp(`(?<![\\w.])${numberPattern}(?![\\w.])`,'g');
const isNumber=value=>numberRe.test(String(value).trim());
const equalNumber=(a,b,tolerance=1e-7)=>{
  const x=Number(a),y=Number(b);
  return Number.isFinite(x)&&Number.isFinite(y)&&Math.abs(x-y)<=Math.max(tolerance,Math.abs(y)*1e-9);
};
// Permite texto extra explicativo: "La suma es 15", "4 + 6 = 10".
// En ningún caso acepta otro resultado final.
function numericResult(actual,expected,missionIndex){
  const a=String(actual).trim(),e=String(expected).trim();
  const tolerance=missionIndex===23?0.005001:1e-7;
  if(isNumber(a))return equalNumber(a,e,tolerance);
  const numbers=a.match(allNumbersRe)||[];
  // «Resultado: 15», «Son 15 unidades», «15 metros» son respuestas válidas.
  // Se rechazan las etiquetas que contengan otro número distinto del objetivo.
  if(numbers.length===1)return equalNumber(numbers[0],e,tolerance);
  // «5 + 10 = 15» se acepta si y solo si el resultado final es el correcto.
  const result=a.match(new RegExp(String.raw`(?:=|→|->|:)\s*(${numberPattern})\s*(?:[\p{L}%°]+(?:\s+[\p{L}%°]+)*)?\s*$`,'iu'));
  return Boolean(result&&equalNumber(result[1],e,tolerance));
}
const equivalentTexts={
  'si':['es palindromo','es un palindromo','verdadero'],
  'no':['no es palindromo','no es un palindromo','falso'],
  'primo':['es primo','es un numero primo'],
  'no primo':['no es primo','no es un numero primo'],
  'segura':['es segura','contrasena segura'],
  'insegura':['no es segura','contrasena insegura'],
  'no encontrado':['no existe','no se encontro','sin resultados'],
  'fondos insuficientes':['saldo insuficiente','no tienes saldo suficiente'],
  'operacion no valida':['operacion invalida','retiro invalido'],
  'indefinido':['division entre cero','no se puede dividir entre cero','error division por cero'],
  'adelante':['puedes entrar','acceso permitido','si puedes entrar'],
  'espera':['no puedes entrar','acceso denegado','todavia no puedes entrar']
};
const escapeRegex=value=>value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
function textResult(actual,expected){
  const a=canonical(actual),e=canonical(expected);
  // Variantes naturales de un saludo. Se sigue comprobando el nombre correcto:
  // «Saludos Ana» equivale a «Hola Ana»; «Saludos Leo» no equivale a «Hola Ana».
  const saludo=e.match(/^hola ([\p{L}\p{N}][\p{L}\p{N} ]*)$/u);
  if(saludo){
    const nombre=saludo[1].trim();
    if(new RegExp(`(?:^|[ :])(?:hola|saludos|buenas|buenos dias)\\s+${escapeRegex(nombre)}$`,'u').test(a))return true;
  }
  if(a===e || equivalentTexts[e]?.includes(a))return true;
  // Una etiqueta como "Respuesta: Par" es válida. Una negación anterior
  // NO lo es: "No es primo" nunca puede aprobar el resultado "Primo".
  const suffix=new RegExp(`(?:^|[^\\p{L}\\p{N}])${escapeRegex(e)}$`,'u');
  if(!suffix.test(a))return false;
  const prefix=a.slice(0,a.length-e.length).trim();
  if(/\b(no|nunca|sin|falso|incorrecto|insegura|impar)\b(?:\s|:|$)/u.test(prefix) && !/^no\b/.test(e))return false;
  return true;
}
function parseSeries(text){
  const candidate=String(text).trim().replace(/^.*?:\s*/,'').trim();
  const bare=(/^(\[.*\]|\(.*\))$/s.test(candidate))?candidate.slice(1,-1):candidate;
  const parts=bare.split(',').map(part=>part.trim());
  return parts.length>1&&parts.every(isNumber)?parts:null;
}
function lineEquivalent(actual,expected,missionIndex){
  const a=String(actual).trim(),e=String(expected).trim();
  if(isNumber(e))return numericResult(a,e,missionIndex);
  const series=parseSeries(e);
  if(series){
    const got=parseSeries(a);
    return Boolean(got&&got.length===series.length&&got.every((n,i)=>equalNumber(n,series[i])));
  }
  // "Total: 69.00" admite "El total es 69".
  if(/^total\s*:/i.test(e))return numericResult(a,e.replace(/^total\s*:/i,'').trim(),missionIndex);
  return textResult(a,e);
}
export function sameAnswer(actual,expected,missionIndex=-1){
  const a=String(actual??'').replace(/\r\n?/g,'\n').trim();
  const e=String(expected??'').replace(/\r\n?/g,'\n').trim();
  if(!a||!e)return a===e;
  const ae=a.split('\n').map(x=>x.trim()).filter(Boolean);
  const ee=e.split('\n').map(x=>x.trim()).filter(Boolean);
  if(ae.length===ee.length&&ae.every((value,i)=>lineEquivalent(value,ee[i],missionIndex)))return true;
  // Permitir imprimir una secuencia con lista/tupla en una línea en vez de
  // mostrar cada número en una línea. Mantener orden, cantidad y valores.
  if(ee.length>1&&ee.every(isNumber)&&ae.length===1){
    const nums=parseSeries(ae[0]);
    if(nums&&nums.length===ee.length)return nums.every((n,i)=>equalNumber(n,ee[i]));
  }
  return false;
}
// En retos expresamente dedicados a una herramienta, se comprueba su empleo.
// En los demás, se admiten for/while, funciones auxiliares, listas y variables
// distintas de las que aparecen en los ejemplos.
const requiredStructures={
  3:['add'],4:['sub'],5:['mult'],6:['assign:energia'],7:['assign:piloto'],
  8:['assign:puntos','add'],9:['assign:edad'],17:['for'],18:['for','mult'],
  19:['assign:planetas','subscript'],31:['function'],32:['function','return']
};
const missingDescriptions={add:'hacer la suma con +',sub:'hacer la resta con -',
  mult:'multiplicar usando *',for:'escribir un ciclo for',
  subscript:'consultar una posición de la lista',function:'crear una función con def',return:'devolver un valor con return'};
function missingStructure(index,features){
  if(!Array.isArray(features))return null;
  const missing=(requiredStructures[index]||[]).find(item=>!features.includes(item));
  if(!missing)return null;
  if(missing.startsWith('assign:'))return `Crea y utiliza la variable ${missing.slice(7)}.`;
  return `El reto pide ${missingDescriptions[missing]||missing}. Puedes escribir el resto a tu manera.`;
}
export function checkMission(mission,index,code,visible,tests=[]){
  const check=mission.check;
  const out=String(visible?.output??'').trim(),err=String(visible?.error??'').trim();
  if(!String(code).trim()||/^print\(\s*\)$/.test(String(code).trim()))
    return {passed:false,state:'retry',feedback:'Escribe tu programa para resolver el reto.'};
  let passed=false,firstFailure=-1;
  if(check.type==='output')passed=!err&&sameAnswer(out,check.value,index);
  if(check.type==='variable')passed=!err&&visible?.vars?.[check.name]===check.value&&sameAnswer(out,check.output,index);
  if(check.type==='cases'){
    // Tanto las pruebas del currículo como las complementarias deben pasar.
    passed=tests.length===check.cases.length+(mission.extraChecks?.length||0)&&tests.every((t,i)=>{
      const expected=check.cases[i] || mission.extraChecks?.[i-check.cases.length];
      const good=Boolean(expected&&!t.error&&sameAnswer(t.output,expected.output,index));
      if(!good&&firstFailure===-1)firstFailure=i;
      return good;
    });
  }
  if(passed){
    if(check.type==='cases'&&!(Array.isArray(visible?.features)?visible.features.includes('input'):/\binput\s*\(|\bsys\s*\.\s*stdin\s*\.\s*(?:read|readline)\s*\(/.test(code)))
      return {passed:false,state:'retry',feedback:'Este reto necesita leer los datos de entrada con input() o sys.stdin.'};
    const missing=missingStructure(index,visible?.features);
    if(missing)return {passed:false,state:'retry',feedback:missing};
    return {passed:true,state:'success',feedback:'¡Correcto! Tu código funciona. No necesitas escribirlo igual que el ejemplo.'};
  }
  if(err&&check.type!=='cases')return {passed:false,state:'error',feedback:'Python encontró un error. Revisa la consola y corrígelo.'};
  if(check.type==='cases'){
    const failing=firstFailure>=0?tests[firstFailure]:null;
    if(failing?.error)return {passed:false,state:'retry',feedback:'Un caso de prueba produjo un error de Python. Revisa tu código y los datos de entrada.'};
    return {passed:false,state:'retry',feedback:'Puedes usar otra solución, pero debe producir el resultado correcto con distintos datos. Revisa el cálculo e inténtalo de nuevo.'};
  }
  return {passed:false,state:'retry',feedback:'La forma de escribir el programa puede ser distinta. Revisa que el resultado cumpla el objetivo.'};
}
