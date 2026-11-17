import React,{useEffect,useMemo,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {Rocket,BookOpen,Code2,Gamepad2,Trophy,Home,ChevronRight,Play,RotateCcw,Lightbulb,Lock,CheckCircle2,Terminal,ArrowLeft,Menu,X,Star,Volume2,VolumeX,ChevronLeft,Check,ArrowUp,ArrowDown,ArrowRight,Map,Compass,ShieldCheck,Zap,Cloud,Target,Info,Settings2,GraduationCap,Medal,Copy,ExternalLink,Coins,Repeat2,Repeat} from 'lucide-react';
import {lessons,tiers} from './data';
import {checkMission} from './missionValidation.js';
import {getMissionChecks} from './extraCases.js';
import {levels} from './roverLevels';
import {gameRules,validateRoverProgram} from './roverEngine.js';
import './style.css';
// Una clave nueva evita que las misiones de versiones anteriores aparezcan resueltas.
// No se eliminan los datos antiguos del usuario.
const KEY='aerobot-progress-v5';
const GAME_KEY='aerobot-rover-v5';
const FREE_KEY='aerobot-practica-python-v7'; // Preserva el trabajo guardado anteriormente
const practiceExamples=[
 {
  "name": "Imprimir texto",
  "code": "print(\"¡Estoy aprendiendo Python!\")",
  "inputs": ""
 },
 {
  "name": "Operaciones",
  "code": "a = 18\nb = 6\nprint(\"Suma:\", a + b)\nprint(\"Resta:\", a - b)\nprint(\"Producto:\", a * b)\nprint(\"División:\", a / b)",
  "inputs": ""
 },
 {
  "name": "Calculadora",
  "code": "a = float(input(\"Primer número: \"))\nb = float(input(\"Segundo número: \"))\noperacion = input(\"Operación (+, -, *, /): \")\nif operacion == \"+\":\n    print(\"Resultado:\", a + b)\nelif operacion == \"-\":\n    print(\"Resultado:\", a - b)\nelif operacion == \"*\":\n    print(\"Resultado:\", a * b)\nelif operacion == \"/\":\n    print(\"Resultado:\", a / b if b else \"No se puede dividir entre cero\")\nelse:\n    print(\"Operación desconocida\")",
  "inputs": "8\n2\n+"
 },
 {
  "name": "Condicionales",
  "code": "edad = int(input(\"¿Qué edad tienes? \"))\nif edad >= 12:\n    print(\"Puedes entrar\")\nelse:\n    print(\"Aún no\")",
  "inputs": "14"
 },
 {
  "name": "Ciclo for",
  "code": "for numero in range(1, 6):\n    print(\"Número\", numero)",
  "inputs": ""
 },
 {
  "name": "Funciones",
  "code": "def cuadrado(numero):\n    return numero ** 2\n\nprint(\"El cuadrado es\", cuadrado(7))",
  "inputs": ""
 },
 {
  "name": "Listas",
  "code": "numeros = [7, 3, 9, 1]\nprint(\"Ordenados:\", sorted(numeros))\nprint(\"Suma:\", sum(numeros))",
  "inputs": ""
 },
 {
  "name": "Ciclo while",
  "code": "contador = 1\nwhile contador <= 5:\n    print('Conteo:', contador)\n    contador += 1",
  "inputs": ""
 },
 {
  "name": "Texto y cadenas",
  "code": "frase = input('Escribe una frase: ')\nprint('Mayúsculas:', frase.upper())\nprint('Palabras:', len(frase.split()))\nprint('Al revés:', frase[::-1])",
  "inputs": "Aprender Python es divertido"
 },
 {
  "name": "Estadística",
  "code": "from statistics import mean, median\nnumeros = [3, 7, 9, 10, 12]\nprint('Promedio:', mean(numeros))\nprint('Mediana:', median(numeros))",
  "inputs": ""
 },
 {
  "name": "Manejo de errores",
  "code": "try:\n    numero = float(input('Escribe un número: '))\n    print('Su inverso es:', 1 / numero)\nexcept ValueError:\n    print('Debes introducir un número')\nexcept ZeroDivisionError:\n    print('No se puede dividir entre cero')",
  "inputs": "4"
 },
 {
  "name": "Entrada de texto",
  "code": "nombre = input(\"Tu nombre: \")\nprint(\"Hola\", nombre)",
  "inputs": "Ada"
 },
 {
  "name": "Diccionario",
  "code": "capitales = {\"México\": \"Ciudad de México\", \"Francia\": \"París\"}\nfor pais, capital in capitales.items():\n    print(pais, \"→\", capital)",
  "inputs": ""
 }
];
function initialPractice(key,fallback){try{const value=JSON.parse(localStorage.getItem(FREE_KEY));return typeof value?.[key]==='string'?value[key]:fallback}catch{return fallback}}

const EMPTY_PROGRESS={done:[],xp:0,best:0};
function loadProgress(){
 try{
  const saved=JSON.parse(localStorage.getItem(KEY));
  if(!saved||!Array.isArray(saved.done))return {...EMPTY_PROGRESS};
  const done=[...new Set(saved.done.filter(n=>Number.isInteger(n)&&n>=0&&n<lessons.length))];
  return {done,xp:done.length*100,best:Number.isInteger(saved.best)?Math.max(0,Math.min(20,saved.best)):0};
 }catch{return {...EMPTY_PROGRESS}}
}
const dailyQuotes=['Cada gran programador comenzó con su primera línea de código.','Los errores son pistas para seguir aprendiendo.','Experimentar es una forma de descubrir.'];
function App(){
 const [page,setPage]=useState('inicio'),[selection,setSelection]=useState(0),[progress,setProgress]=useState(loadProgress),[code,setCode]=useState(lessons[0].starter),[output,setOutput]=useState(''),[result,setResult]=useState(''),[running,setRunning]=useState(false),[pyStatus,setPyStatus]=useState('Sin cargar'),[hint,setHint]=useState(false),[sidebar,setSidebar]=useState(false),[sound,setSound]=useState(true),[showHelp,setShowHelp]=useState(false),[filter,setFilter]=useState('Todos'),[inputs,setInputs]=useState([]),[feedbackNote,setFeedbackNote]=useState(''),[freeCode,setFreeCode]=useState(()=>initialPractice('code','print("¡Hola desde Python!")')),[freeInputs,setFreeInputs]=useState(()=>initialPractice('inputs','')),[freeOutput,setFreeOutput]=useState(''),[freeRunning,setFreeRunning]=useState(false),[freeError,setFreeError]=useState(false);
 const workerRef=useRef(null),jobCounter=useRef(0),loadedRef=useRef(false),cancelRef=useRef(null);
 useEffect(()=>()=>{workerRef.current?.terminate();workerRef.current=null},[]);
 useEffect(()=>{localStorage.setItem(KEY,JSON.stringify(progress))},[progress]);
 useEffect(()=>{try{localStorage.setItem(FREE_KEY,JSON.stringify({code:freeCode,inputs:freeInputs}))}catch{}},[freeCode,freeInputs]);
 const openLesson=(i)=>{setSelection(i);setCode(lessons[i].starter);setOutput('');setResult('');setHint(false);setFeedbackNote('');setInputs(lessons[i].check?.cases?.[0]?.inputs?.slice()||[]);setPage('editor');setSidebar(false)};
 const navigate=(p)=>{setPage(p);setSidebar(false);setResult('');window.scrollTo({top:0,behavior:'smooth'})};
 async function runPythonJob(payload){
   if(!workerRef.current)workerRef.current=new Worker(`${import.meta.env.BASE_URL}python-worker.js`,{type:'module'});
   setPyStatus(loadedRef.current?'Ejecutando Python…':'Cargando Python…');
   const worker=workerRef.current,id=++jobCounter.current;
   const timeout=loadedRef.current?60000:120000;
   const data=await new Promise((resolve,reject)=>{
     const cleanup=()=>{clearTimeout(timer);worker.removeEventListener('message',onMessage);worker.removeEventListener('error',onError);if(cancelRef.current===cancel)cancelRef.current=null};
     const cancel=()=>{cleanup();worker.terminate();workerRef.current=null;loadedRef.current=false;reject(new Error('Ejecución detenida.'))};
     const timer=setTimeout(()=>{cancel();},timeout);
     const onMessage=e=>{if(e.data.id!==id)return;cleanup();resolve(e.data)};
     const onError=()=>{cleanup();worker.terminate();workerRef.current=null;loadedRef.current=false;reject(new Error('No se pudo cargar Python. Revisa la conexión a internet.'))};
     cancelRef.current=cancel;
     worker.addEventListener('message',onMessage);worker.addEventListener('error',onError);
     worker.postMessage({...payload,id});
   });
   if(!data.ok)throw new Error(data.error);
   loadedRef.current=true;setPyStatus('Python listo');
   return data;
 }
 function stopPython(){cancelRef.current?.();setPyStatus('Detenido');}
 async function execute(validate=true){
   if(running||freeRunning)return;
   setRunning(true);setResult('');setFeedbackNote('');setOutput('Preparando ejecución…');
   const lesson=lessons[selection],check=lesson.check;
   const checks=getMissionChecks(lesson,selection);
   // Comparar con todas las entradas, sin exigir copiar el ejemplo.
   const evaluationLesson=check.type==='cases'?{...lesson,extraChecks:checks.slice(check.cases.length)}:lesson;
   try{
     const data=await runPythonJob({mode:'mission',code,inputs,checks});
     const parsed=data.visible,out=parsed.output.trim(),err=parsed.error.trim();
     setOutput([out,err].filter(Boolean).join('\n')||'(Sin salida. Utiliza print() para mostrar resultados.)');
     if(!validate){setResult(err?'error':'');return}
     const verified=checkMission(evaluationLesson,selection,code,parsed,data.tests);
     setResult(verified.state);setFeedbackNote(verified.feedback);
     if(check.type==='cases'&&err&&verified.passed)setOutput('Tu solución pasó todas las pruebas. Para ver la ejecución aquí, revisa los datos de entrada que escribiste.');
     if(verified.passed)setProgress(p=>p.done.includes(selection)?p:{...p,done:[...p.done,selection],xp:p.xp+100});
   }catch(e){setOutput('Python: '+e.message);setFeedbackNote(e.message);setResult('error');setPyStatus('Reintentar')}
   finally{setRunning(false)}
 }
 async function executeFree(){
   if(running||freeRunning)return;
   setFreeRunning(true);setFreeError(false);setFreeOutput('Preparando Python…');
   try{
     const data=await runPythonJob({mode:'free',code:freeCode,inputs:freeInputs===''?[]:freeInputs.replace(/\r\n/g,'\n').split('\n'),checks:[]});
     setFreeOutput([data.visible.output,data.visible.error].filter(Boolean).join('\n')||'(El programa terminó sin mostrar texto.)');
     setFreeError(Boolean(data.visible.error));
   }catch(e){setFreeOutput('Python: '+e.message);setFreeError(true);setPyStatus('Reintentar')}
   finally{setFreeRunning(false)}
 }
 const tierOf=i=>tiers.find(t=>i>=t.range[0]&&i<=t.range[1]);
 const items=[['inicio','Inicio',Home],['misiones','Misiones',Map],['editor','Misiones Python',Code2],['laboratorio','Práctica Python',Terminal],['juego','AstroRover',Gamepad2],['logros','Mis logros',Trophy]];
 return <div className="app-shell"><aside className={'sidebar '+(sidebar?'show':'')}><div className="brand" onClick={()=>navigate('inicio')}><div className="brand-symbol"><Rocket size={24}/></div><span>AERO<span className="brand-accent">BOT</span><small>ACADEMIA DE CÓDIGO</small></span></div><nav className="main-nav"><div className="nav-label">EXPLORAR</div>{items.map(([id,label,Icon])=><button key={id} className={'nav-item '+(page===id?'active':'')} onClick={()=>id==='editor'?openLesson(selection):navigate(id)}><Icon size={19}/><span>{label}</span>{id==='misiones'&&<span className="nav-count">{lessons.length}</span>}</button>)}</nav><div className="side-bottom"><div className="mini-progress"><div className="mini-progress-title"><Star size={17} fill="#ffcb71" color="#ffcb71"/> Tu progreso</div><div className="mini-numbers">{progress.done.length}<span>/{lessons.length} misiones</span></div><div className="progress-track"><span style={{width:progress.done.length/lessons.length*100+'%'}}/></div></div><button className="sound-toggle" onClick={()=>setSound(!sound)}>{sound?<Volume2 size={17}/>:<VolumeX size={17}/>} Sonidos {sound?'activados':'desactivados'}</button></div></aside>{sidebar&&<div className="mobile-overlay" onClick={()=>setSidebar(false)}/>}<div className="content"><header className="topbar"><button className="mobile-menu" aria-label="Abrir menú" onClick={()=>setSidebar(true)}><Menu/></button><div className="crumb">ACADEMIA <ChevronRight size={13}/> <b>{items.find(i=>i[0]===page)?.[1]||'AEROBOT'}</b></div><div className="topright"><span className="top-stat"><Zap size={17} fill="#f5ba64" color="#f5ba64"/> {progress.xp} XP</span><span className="avatar">AB</span></div></header><main>
 {page==='inicio'&&<><div className="hero"><div className="hero-copy"><div className="eyebrow"><span className="dot"/> TU AVENTURA EMPIEZA AQUÍ</div><h1>¡El futuro se <em>programa!</em></h1><p>Aprende Python con misiones, código real y aventuras interactivas. Desde tu primer <code>print()</code> hasta tu propio universo de ideas.</p><div className="hero-actions"><button className="btn primary" onClick={()=>openLesson(lessons.findIndex((_,i)=>!progress.done.includes(i))===-1?0:lessons.findIndex((_,i)=>!progress.done.includes(i)))}> <Rocket size={17}/> {progress.done.length?'Continuar aventura':'Comenzar aventura'} <ChevronRight size={18}/></button><button className="btn ghost" onClick={()=>navigate('misiones')}>Ver misiones</button></div><div className="hero-mini"><span><CheckCircle2 size={16}/> {lessons.length} misiones prácticas</span><span><CheckCircle2 size={16}/> Python real</span></div></div><div className="hero-art"><div className="orbit orbit-a"/><div className="orbit orbit-b"/><div className="planet planet-one"/><div className="planet planet-two"/><div className="star-dot s1"/><div className="star-dot s2"/><div className="star-dot s3"/><div className="astronaut"><div className="helmet"><div className="visor"><div className="eye"/><div className="eye"/></div><div className="blush left"/><div className="blush right"/></div><div className="robot-body"><span className="bot-light"/></div><div className="robot-arm a-left"/><div className="robot-arm a-right"/><div className="robot-foot f-left"/><div className="robot-foot f-right"/></div><div className="float-label"><Code2 size={18}/> print("¡Hola!")</div></div></div><div className="section-heading"><div><span className="section-kicker">TU UNIVERSO DE APRENDIZAJE</span><h2>Elige cómo quieres aprender</h2></div></div><div className="feature-grid"><button className="feature" onClick={()=>navigate('misiones')}><div className="feature-icon cyan"><BookOpen size={25}/></div><h3>Misiones guiadas</h3><p>Aprende la estructura con ejemplos pequeños y programa tus propias soluciones.</p><span>Explorar misiones <ChevronRight size={15}/></span></button><button className="feature" onClick={()=>navigate('laboratorio')}><div className="feature-icon violet"><Terminal size={25}/></div><h3>Compilador de práctica</h3><p>Prueba operaciones, print(), input(), ciclos, funciones y programas propios sin calificación.</p><span>Abrir laboratorio <ChevronRight size={15}/></span></button><button className="feature" onClick={()=>navigate('juego')}><div className="feature-icon peach"><Gamepad2 size={25}/></div><h3>AstroRover</h3><p>Programa la ruta de tu robot y supera obstáculos estelares.</p><span>Jugar ahora <ChevronRight size={15}/></span></button></div><div className="section-heading" style={{marginTop:36}}><div><span className="section-kicker">RUTA DE APRENDIZAJE</span><h2>Tres etapas, infinitas posibilidades</h2></div></div><div className="tier-grid">{tiers.map((t,i)=><button className="tier" key={t.name} onClick={()=>{setFilter(t.name);navigate('misiones')}}><div className="tier-top"><div className={'tier-icon n'+i}>{i===0?<Compass/>:i===1?<Target/>:<ShieldCheck/>}</div><span>ETAPA 0{i+1}</span></div><h3>{t.name}</h3><p>{t.desc}</p><div className="tier-foot">{t.range[1]-t.range[0]+1} misiones <ChevronRight size={16}/></div></button>)}</div></>}
 {page==='misiones'&&<><div className="page-heading"><span className="section-kicker">PLAN DE VUELO</span><h1>Tu mapa de <em>misiones</em></h1><p>Empieza con 10 retos fáciles, continúa con 10 intermedios y termina con 20 desafíos. En cada misión aprenderás la estructura antes de escribir tu código.</p></div><div className="filters">{['Todos',...tiers.map(x=>x.name)].map(x=><button className={filter===x?'chosen':''} key={x} onClick={()=>setFilter(x)}>{x}</button>)}</div><div className="mission-grid">{lessons.map((l,i)=>filter!=='Todos'&&l.level!==filter?null:<button className={'mission '+(progress.done.includes(i)?'completed':'')} key={i} onClick={()=>openLesson(i)}><div className="mission-top"><span className="mission-number">{String(i+1).padStart(2,'0')}</span><span className="mission-status">{progress.done.includes(i)?<><CheckCircle2 size={15}/> ¡Listo!</>:'Por hacer · 100 XP'}</span></div><div className="mission-topic">{l.topic}</div><h3>{l.title}</h3><p>{l.desc}</p><div className="mission-bottom"><span>{l.level}</span><ChevronRight size={19}/></div></button>)}</div></>}
 {page==='editor'&&<><button className="back-link" onClick={()=>navigate('misiones')}><ArrowLeft size={17}/> Todas las misiones</button><div className="lesson-header"><div><span className="section-kicker">MISIÓN {String(selection+1).padStart(2,'0')} / {lessons.length} · {lessons[selection].level.toUpperCase()}</span><h1>{lessons[selection].title}</h1><p>{lessons[selection].desc}</p></div><span className="xp-pill"><Zap size={16}/> +100 XP</span></div><div className="editor-layout"><div className="lesson-column"><div className="lesson-box"><div className="box-heading"><BookOpen size={18}/> DESCUBRE</div><h3>{lessons[selection].topic}</h3><p>{lessons[selection].learn.intro}</p></div><div className="lesson-box challenge"><div className="box-heading"><Target size={18}/> TU RETO</div><p>{lessons[selection].goal}</p><button className="hint-trigger" onClick={()=>setHint(!hint)}><Lightbulb size={17}/>{hint?'Cerrar pista':'¿Una pista?'}</button>{hint&&<div className="hint-card">{lessons[selection].hint}</div>}</div></div><div className="code-column"><section className="lesson-teach" aria-label="Aprende a escribir el código"><div className="teach-header"><div className="teach-header-icon"><GraduationCap size={24}/></div><div><span className="walkthrough-eyebrow">PRIMERO APRENDE</span><h2>Así se escribe en Python</h2><p>Observa la estructura y un ejemplo diferente a tu reto.</p></div><span className="teach-level">{lessons[selection].level}</span></div><div className="teach-grid"><div className="teach-card"><span className="teach-kicker"><Code2 size={16}/> 1. LA ESTRUCTURA</span><pre className="teach-code"><code>{lessons[selection].learn.syntax}</code></pre><p>{lessons[selection].learn.why}</p></div><div className="teach-card example"><span className="teach-kicker"><Lightbulb size={16}/> 2. MIRA ESTE EJEMPLO</span><pre className="teach-code"><code>{lessons[selection].learn.example}</code></pre><p>Es solo un ejemplo. Puedes escribir una solución distinta si cumple el objetivo.</p></div></div><div className="teach-next"><div className="teach-next-label"><Target size={18}/> 3. AHORA INTÉNTALO TÚ</div><ol className="teach-steps">{lessons[selection].learn.steps.map((step,index)=><li key={index}><b>{index+1}</b><span>{step}</span></li>)}</ol></div></section>{lessons[selection].inputLabels&&<div className="input-box"><div className="box-heading"><Terminal size={17}/> DATOS DE ENTRADA — input()</div><p>Escribe aquí los datos para probar tu programa.</p><div className="input-fields">{lessons[selection].inputLabels.map((label,i)=><label key={i}><span>{i+1}. {label}</span><input value={inputs[i]??''} onChange={e=>{setInputs(old=>{const next=[...old];next[i]=e.target.value;return next});setResult('');setFeedbackNote('')}} placeholder={`Dato ${i+1}`}/></label>)}</div><small>También probaremos tu programa con otros valores.</small></div>}<div className="editor-guide-label"><div><Code2 size={18}/><strong>¡AHORA TE TOCA!</strong></div><p>Aquí solo aparece <code>print()</code>. Escribe las demás instrucciones tú mismo, siguiendo la explicación de arriba.</p></div><div className="code-panel"><div className="panel-head"><span><span className="code-dot red"/><span className="code-dot yellow"/><span className="code-dot green"/> <strong>main.py</strong></span><small><span className={'live-dot '+(pyStatus==='Python listo'?'ready':'')}/>{pyStatus}</small></div><div className="code-edit"><div className="line-numbers">{Array.from({length:Math.max(10,code.split('\n').length)},(_,i)=><div key={i}>{i+1}</div>)}</div><textarea aria-label="Editor de código Python" spellCheck={false} value={code} onChange={e=>{setCode(e.target.value);setResult('');setFeedbackNote('')}} onKeyDown={e=>{if(e.key==='Tab'){e.preventDefault();const s=e.target.selectionStart;setCode(c=>c.slice(0,s)+'    '+c.slice(e.target.selectionEnd));requestAnimationFrame(()=>{e.target.selectionStart=e.target.selectionEnd=s+4})}}}/></div><div className="editor-actions"><button className="btn muted" onClick={()=>{setCode(lessons[selection].starter);setOutput('');setResult('');setFeedbackNote('')}}><RotateCcw size={16}/> Reiniciar</button>{running?<button className="btn muted" onClick={stopPython}>Detener ejecución</button>:<button className="btn primary" onClick={()=>execute(true)}><Play size={17} fill="currentColor"/> Probar mi código</button>}</div></div><div className="console-box"><div className="console-title"><Terminal size={17}/> CONSOLA <span>SALIDA DE PYTHON</span></div><pre className="console-output">{output||'Tu resultado aparecerá aquí cuando pruebes el código.'}</pre>{result==='success'&&<div className="feedback success"><CheckCircle2 size={21}/><div><b>¡Correcto! +100 XP</b><p>{feedbackNote||'El programa cumple el objetivo. ¿Listo para el siguiente?'}</p></div></div>}{result==='retry'&&<div className="feedback retry"><Info size={21}/><div><b>¡Sigue intentando!</b><p>{feedbackNote||"Revisa tu resultado y prueba otra vez."}</p></div></div>}{result==='error'&&<div className="feedback retry"><Info size={21}/><div><b>¡Podemos arreglarlo!</b><p>{feedbackNote||"Revisa los paréntesis, las comillas y los espacios."}</p></div></div>}</div><div className="practice-shortcut"><Terminal size={20}/><div><strong>¿Quieres experimentar con otro código?</strong><p>Abre el compilador independiente: ahí puedes imprimir, calcular o probar cualquier programa compatible sin afectar tus misiones.</p></div><button className="btn ghost" onClick={()=>navigate('laboratorio')}>Ir a practicar <ChevronRight size={16}/></button></div><div className="lesson-pager"><button disabled={selection===0} onClick={()=>openLesson(selection-1)}><ChevronLeft size={17}/> Anterior</button><span>Misión {selection+1} de {lessons.length}</span><button onClick={()=>selection===lessons.length-1?navigate('logros'):openLesson(selection+1)}>{selection===lessons.length-1?'Ver logros':'Siguiente'} <ChevronRight size={17}/></button></div></div></div></>}
 {page==='laboratorio'&&<><div className="page-heading"><span className="section-kicker">LABORATORIO DE PYTHON · INDEPENDIENTE Y SIN CALIFICACIÓN</span><h1>Compilador de <em>práctica Python</em></h1><p>Practica a tu manera. Escribe print(), operaciones matemáticas, condiciones, ciclos, funciones, listas, diccionarios y otros programas de Python compatibles con Pyodide. Aquí no se compara tu respuesta con la de un ejercicio.</p></div><div className="free-intro"><BookOpen size={19}/><div><strong>Tu espacio para probar todo tipo de ejercicios</strong><p>Es un intérprete real de Python que funciona dentro del navegador. <code>input()</code> toma los valores del cuadro de datos, uno por línea. Tu código queda guardado automáticamente en este navegador y puedes cambiar de ejemplo en cualquier momento.</p></div></div><div className="practice-quick-head"><h2>Prueba un ejemplo o escribe el tuyo</h2><span>No se revisan respuestas ni se exigen estructuras específicas en este editor.</span></div><div className="free-examples" aria-label="Ejemplos para practicar Python"><span>Ejemplos:</span>{practiceExamples.map(ex=><button key={ex.name} disabled={freeRunning} onClick={()=>{setFreeCode(ex.code);setFreeOutput('');setFreeInputs(ex.inputs);setFreeError(false)}}>{ex.name}</button>)}</div><div className="code-panel free-code-panel"><div className="panel-head"><span><span className="code-dot red"/><span className="code-dot yellow"/><span className="code-dot green"/> <strong>mi_practica.py</strong></span><small><span className={'live-dot '+(pyStatus==='Python listo'?'ready':'')}/>{pyStatus}</small></div><div className="code-edit"><div className="line-numbers">{Array.from({length:Math.max(12,freeCode.split('\n').length)},(_,i)=><div key={i}>{i+1}</div>)}</div><textarea aria-label="Compilador de práctica Python" spellCheck={false} value={freeCode} onChange={e=>setFreeCode(e.target.value)} onKeyDown={e=>{if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();executeFree()}else if(e.key==='Tab'){e.preventDefault();const start=e.target.selectionStart,end=e.target.selectionEnd;setFreeCode(c=>c.slice(0,start)+'    '+c.slice(end));requestAnimationFrame(()=>{e.target.selectionStart=e.target.selectionEnd=start+4})}}}/></div><label className="free-input-label"><strong>Datos para input() (uno por línea)</strong><p>Si tu programa pide nombre y edad, por ejemplo, escribe primero el nombre y debajo la edad.</p><textarea aria-label="Datos de entrada para Python" spellCheck={false} rows={4} value={freeInputs} onChange={e=>setFreeInputs(e.target.value)} placeholder={'Ada\n14'}/></label><div className="editor-actions"><span className="practice-autosave"><Check size={15}/> Guardado automático · Ctrl + Enter para ejecutar</span><button className="btn muted" onClick={()=>{setFreeCode('');setFreeOutput('');setFreeInputs('');setFreeError(false)}} disabled={freeRunning}>Nuevo programa</button>{freeRunning?<button className="btn muted" onClick={stopPython}>Detener ejecución</button>:<button className="btn primary" onClick={executeFree}><Play size={17} fill="currentColor"/> Ejecutar Python</button>}</div></div><div className="console-box" role="status" aria-live="polite"><div className="console-title"><Terminal size={17}/> CONSOLA <span>SALIDA REAL DE PYTHON · SIN CALIFICAR</span></div><pre className={'console-output '+(freeError?'free-error':'')}>{freeOutput||'Presiona «Ejecutar Python» para ver aquí tus resultados o los errores del programa.'}</pre></div><p className="free-warning">El intérprete usa Pyodide y necesita internet para la primera carga. Ejecuta Python, no todas las aplicaciones de escritorio ni todas las bibliotecas que existen para PC. Las ejecuciones largas tienen límite de tiempo; puedes detenerlas.</p></>}
 {page==='juego'&&<AstroRover onSuccess={i=>setProgress(p=>({...p,best:Math.max(p.best,i+1)}))} sound={sound}/>}
 {page==='logros'&&<><div className="page-heading"><span className="section-kicker">BITÁCORA DE VIAJE</span><h1>Tu constelación de <em>logros</em></h1><p>Todo gran avance empieza por atreverse a intentarlo.</p></div><div className="stats"><div><Star size={22}/><strong>{progress.xp}</strong><span>Experiencia ganada</span></div><div><CheckCircle2 size={22}/><strong>{progress.done.length}/{lessons.length}</strong><span>Misiones superadas</span></div><div><Target size={22}/><strong>{Math.round(progress.done.length/lessons.length*100)}%</strong><span>Ruta completada</span></div></div><div className="game-progress-inline"><Gamepad2 size={18}/> AstroRover: mejor planeta completado <strong>{progress.best}/20</strong></div><div className="achievements">{[{title:'Primer despegue',detail:'Completa tu primera misión',n:1},{title:'Piloto constante',detail:'Completa 5 misiones',n:5},{title:'Nivel básico superado',detail:'Completa 10 misiones',n:10},{title:'Nivel intermedio superado',detail:'Completa 20 misiones',n:20},{title:'Experto en código',detail:'Completa 30 misiones',n:30},{title:'Leyenda de AEROBOT',detail:'Completa las 40 misiones',n:40}].map((a,i)=><div key={i} className={'achievement '+(progress.done.length>=a.n?'earned':'')}><div className="medal"><Medal size={26}/></div><div><h3>{a.title}</h3><p>{a.detail}</p></div>{progress.done.length>=a.n?<CheckCircle2 size={20} color="#58d9ba"/>:<Lock size={18}/>}</div>)}</div><div className="reset-area"><button onClick={()=>{if(window.confirm('¿Comenzar desde cero? Se borrarán tus estrellas y planetas completados de esta versión.')){setProgress({...EMPTY_PROGRESS});localStorage.removeItem(GAME_KEY)}}}>Empezar desde cero</button><p>Tus avances se guardan en este navegador. La versión V6 conserva el avance de V5 para su nuevo currículo de 40 misiones.</p></div></>}
 </main><footer>© 2026 AEROBOT · Aprende, crea y explora. <span>Proyecto educativo · Sin cuentas ni registro</span></footer></div></div>
}
const directions=[
 {id:'up',Icon:ArrowUp,title:'Arriba',mark:'↑',d:[0,-1]},
 {id:'right',Icon:ArrowRight,title:'Derecha',mark:'→',d:[1,0]},
 {id:'down',Icon:ArrowDown,title:'Abajo',mark:'↓',d:[0,1]},
 {id:'left',Icon:ChevronLeft,title:'Izquierda',mark:'←',d:[-1,0]}
];
function getGameHint(world,start){
 const key=(x,y,mask)=>`${x},${y},${mask}`;
 const maskAll=(1<<world.coins.length)-1;
 const queue=[{x:start[0],y:start[1],mask:0,path:[]}];
 let index=0;
 const visited=new Set([key(...start,0)]);
 while(index<queue.length){
  const node=queue[index++];
  if(node.x===world.goal[0]&&node.y===world.goal[1]&&node.mask===maskAll)return node.path;
  for(const a of directions){
   const x=node.x+a.d[0],y=node.y+a.d[1];
   if(x<0||x>=world.size||y<0||y>=world.size||world.obstacles.some(o=>o[0]===x&&o[1]===y))continue;
   const coinIndex=world.coins.findIndex(c=>c[0]===x&&c[1]===y);
   const mask=coinIndex<0?node.mask:node.mask|(1<<coinIndex);
   const k=key(x,y,mask);
   if(visited.has(k))continue;
   visited.add(k);queue.push({x,y,mask,path:[...node.path,a.mark]});
  }
 }
 return [];
}
function AstroRover({onSuccess}){
 const [level,setLevel]=useState(0);
 const [completed,setCompleted]=useState(()=>{try{return JSON.parse(localStorage.getItem(GAME_KEY))||[]}catch{return []}});
 const [commands,setCommands]=useState([]);
 const [pos,setPos]=useState(levels[0].start);
 const [foundCoins,setFoundCoins]=useState([]);
 const [state,setState]=useState('idle');
 const [message,setMessage]=useState('Construye una ruta con las flechas y pulsa Iniciar.');
 const [executing,setExecuting]=useState(-1);
 const [showHint,setShowHint]=useState(false);
 const runToken=useRef(0);
 const world=levels[level];
 const steps=commands.reduce((n,c)=>n+c.repeat,0);
 const rules=useMemo(()=>gameRules(world,level),[world,level]);
 const {maxSteps,maxBlocks}=rules;
 useEffect(()=>{localStorage.setItem(GAME_KEY,JSON.stringify(completed))},[completed]);
 useEffect(()=>{runToken.current++;setCommands([]);setPos(levels[level].start);setFoundCoins([]);setExecuting(-1);setState('idle');setShowHint(false);setMessage('Nuevo planeta: crea una secuencia hasta la estrella.')},[level]);
 useEffect(()=>()=>{runToken.current++},[]);
 const reset=()=>{runToken.current++;setPos(world.start);setFoundCoins([]);setExecuting(-1);setState('idle');setMessage('Programa listo para volver a ejecutarse.')};
 const add=(id)=>{if(state==='running'||steps>=maxSteps||commands.length>=maxBlocks){setMessage('Límite de bloques: utiliza un ciclo ×2 o ×3 para avanzar más con menos instrucciones.');return;}setCommands(c=>[...c,{id,repeat:1}]);if(state!=='idle')reset()};
 const repeat=(count)=>{if(state==='running'||!rules.usesCycles||!commands.length)return;const last=commands[commands.length-1];if(steps-last.repeat+count>maxSteps)return;setCommands(c=>c.map((item,i)=>i===c.length-1?{...item,repeat:count}:item));if(state!=='idle')reset()};
 const go=(i)=>{if(state==='running')return;setLevel(i)};
 async function run(){
  if(state==='running'||!commands.length)return;
  const valid=validateRoverProgram(commands,world,level);
  if(!valid.ok){setState('failed');setMessage(valid.message);return;}
  const token=++runToken.current;
  setPos(world.start);setFoundCoins([]);setState('running');setExecuting(-1);
  setMessage('AEROBOT ejecuta tus instrucciones paso a paso…');
  let position=[...world.start], collected=[];
  for(let i=0;i<commands.length;i++){
   const cmd=commands[i],action=directions.find(a=>a.id===cmd.id);
   for(let repetition=0;repetition<cmd.repeat;repetition++){
    setExecuting(i);
    await new Promise(r=>setTimeout(r,300));
    if(runToken.current!==token)return;
    const next=[position[0]+action.d[0],position[1]+action.d[1]];
    if(next.some(v=>v<0||v>=world.size)||world.obstacles.some(o=>o[0]===next[0]&&o[1]===next[1])){
     setState('failed');setMessage('La ruta chocó con un meteorito o el borde del tablero. Corrige tu programa.');setExecuting(-1);return;
    }
    position=next;setPos(next);
    const coinIndex=world.coins.findIndex(c=>c[0]===next[0]&&c[1]===next[1]);
    if(coinIndex>=0&&!collected.includes(coinIndex)){
     collected=[...collected,coinIndex];setFoundCoins(collected);
    }
   }
  }
  if(runToken.current!==token)return;
  setExecuting(-1);
  const atGoal=position[0]===world.goal[0]&&position[1]===world.goal[1];
  const allCoins=collected.length===world.coins.length;
  if(atGoal&&allCoins){
   setState('won');setMessage('¡Planeta completado! AEROBOT llegó a la meta'+(world.coins.length?' con todos los cristales.':'.'));
   setCompleted(c=>c.includes(level)?c:[...c,level]);onSuccess(level);
  }else{
   setState('failed');setMessage(!atGoal?'Tu programa terminó antes de llegar a la estrella.':'Llegaste a la meta, pero faltan cristales por recoger.');
  }
 }
 const hint=useMemo(()=>getGameHint(world,world.start),[world]);
 return <>
  <div className="page-heading"><span className="section-kicker">LABORATORIO DE MOVIMIENTO</span><h1>Astro<span className="emph">Rover</span> <span className="small-label">20 PLANETAS</span></h1><p>Programa a AEROBOT, esquiva meteoritos y recoge cristales. Desde el planeta 8, los ciclos ×2 y ×3 son obligatorios: tendrás menos bloques que movimientos.</p></div>
  <div className="planet-picker"><div className="planet-picker-title"><span><Map size={17}/> ELIGE PLANETA</span><strong>{completed.length} / 20 superados</strong></div><div className="planet-buttons">{levels.map((planet,i)=><button key={i} type="button" disabled={state==='running'} className={(i===level?'current ':'')+(completed.includes(i)?'finished':'')} onClick={()=>go(i)} title={`${i+1}. ${planet.name}`}>{i+1}{completed.includes(i)&&<Check size={10}/>}</button>)}</div></div>
  <div className="game-layout"><div className="game-stage"><div className="stage-header"><span><Compass size={17}/> PLANETA {level+1}: {world.name.toUpperCase()}</span><span>{level+1} / {levels.length}</span></div>
  <div className="game-substats"><span><Coins size={15}/> CRISTALES {foundCoins.length}/{world.coins.length}</span><span><Code2 size={15}/> {commands.length}/{maxBlocks} bloques · {steps}/{maxSteps} pasos</span></div>
  <div className="space-world"><div className="world-stars"/><div className="grid-world" style={{gridTemplateColumns:`repeat(${world.size},1fr)`,width:`min(84%, ${world.size===8?370:350}px)`}}>{Array.from({length:world.size*world.size},(_,i)=>{const x=i%world.size,y=Math.floor(i/world.size);const ob=world.obstacles.some(c=>c[0]===x&&c[1]===y);const goal=world.goal[0]===x&&world.goal[1]===y;const robot=pos[0]===x&&pos[1]===y;const coinIndex=world.coins.findIndex(c=>c[0]===x&&c[1]===y);return <div className={'space-cell '+(ob?'asteroid-cell':'')} key={i}>{ob&&<div className="asteroid"/>}{goal&&<div className="goal-star"><Star size={world.size>6?22:28} fill="#ffd97c"/></div>}{coinIndex>=0&&!foundCoins.includes(coinIndex)&&<div className="crystal"><Coins size={world.size>6?18:23}/></div>}{robot&&<div className="rover"><div className="rover-eye"/><div className="rover-eye"/><i/></div>}</div>})}</div><div className="game-planet planet-a"/><div className="game-planet planet-b"/></div>
  <div aria-live="polite" className={'game-message '+state}><span>{state==='won'?<CheckCircle2 size={20}/>:state==='failed'?<Info size={20}/>:<Lightbulb size={20}/>}</span>{message}</div></div>
  <div className="program-panel"><div className="box-heading"><Code2 size={19}/> PROGRAMA TU RUTA</div><p>AEROBOT obedecerá cada instrucción en orden. Desde el planeta 8 debes utilizar ciclos para llegar a la meta: cada bloque representa una orden y un ciclo recorre varias casillas.</p>{rules.usesCycles&&<div className="cycle-info"><Repeat size={18}/><div><strong>¡Ciclo obligatorio!</strong><p>Solo tienes {maxBlocks} bloques. Agrega una flecha y pulsa ×2 o ×3 para repetirla; así recorres más casillas sin gastar otro bloque.</p></div></div>}<div className="control-label">MOVIMIENTOS</div><div className="arrow-controls">{directions.map(({id,Icon,title})=><button key={id} type="button" disabled={state==='running'||steps>=maxSteps||commands.length>=maxBlocks} title={title} onClick={()=>add(id)}><Icon size={26}/><span>{title}</span></button>)}</div>
  {rules.usesCycles&&<div className="repeat-actions"><span><Repeat size={15}/> CICLOS</span><button disabled={state==='running'||!commands.length} onClick={()=>repeat(2)}>Repetir último ×2</button><button disabled={state==='running'||!commands.length} onClick={()=>repeat(3)}>×3</button></div>}
  <div className="control-label">TU PROGRAMA <small>{commands.length}/{maxBlocks} bloques · {steps}/{maxSteps} movimientos</small></div><div className="sequence">{commands.length?commands.map((cmd,i)=>{const action=directions.find(a=>a.id===cmd.id);return <div key={i} className={'sequence-step '+(executing===i?'executing':'')} title={`${action.title}${cmd.repeat>1?' x'+cmd.repeat:''}`}><action.Icon size={17}/>{cmd.repeat>1&&<small>×{cmd.repeat}</small>}</div>}):<span>Selecciona las flechas para crear tu programa…</span>}</div>
  <div className="game-buttons"><button className="btn muted" disabled={state==='running'||!commands.length} onClick={()=>{setCommands(c=>c.slice(0,-1));reset()}}>Borrar último</button><button className="btn muted" title="Borrar programa" disabled={state==='running'} onClick={()=>{setCommands([]);reset()}}><RotateCcw size={17}/></button></div>
  <button className="btn primary game-run" disabled={!commands.length||state==='running'} onClick={run}><Play size={18} fill="currentColor"/>{state==='running'?'Ejecutando…':'Iniciar programa'}</button>
  {state==='won'&&<button className="btn next-game" onClick={()=>go(level===19?0:level+1)}>{level===19?'Volver al primer planeta':'Siguiente planeta'} <ChevronRight size={17}/></button>}
  <button className="hint-trigger rover-hint" onClick={()=>setShowHint(h=>!h)}><Lightbulb size={16}/>{showHint?'Ocultar pista':'Ver pista de ruta'}</button>{showHint&&<div className="hint-card">Una posible ruta comienza así: <strong>{hint.slice(0,Math.min(5,hint.length)).join(' ')}</strong>. {world.coins.length?'Recoge todos los cristales antes de llegar a la estrella.':'Planea los movimientos hasta la estrella.'}</div>}
  <div className="game-help"><Lightbulb size={17}/> Consejo: prueba una secuencia, observa dónde falla y modifícala. Los planetas completados se guardan en este navegador.</div></div></div>
 </>
}

createRoot(document.getElementById('root')).render(<App/>);
