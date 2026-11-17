/* AEROBOT V7. Pyodide oficial en un Web Worker de tipo module.
   Misiones = comprobaciones automáticas; Práctica = Python libre. */
import {loadPyodide} from 'https://cdn.jsdelivr.net/pyodide/v0.27.8/full/pyodide.mjs';
let pyodidePromise;
async function getPython(){
  if(!pyodidePromise){
    pyodidePromise=(async()=>{
      return await loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.27.8/full/'});
    })().catch(err=>{pyodidePromise=null;throw err});
  }
  return pyodidePromise;
}
const pythonRunner=String.raw`
import io, contextlib, traceback, json, ast, sys, builtins
_code = json.loads(_AEROBOT_CODE_JSON)
_inputs = [str(v) for v in json.loads(_AEROBOT_INPUTS_JSON)]
_echo_prompts = bool(_AEROBOT_ECHO_PROMPTS)
class LimitedOutput(io.StringIO):
    def write(self, value):
        value = str(value)
        remaining = max(0, 20000 - self.tell())
        if remaining:
            super().write(value[:remaining])
        return len(value)
_out = LimitedOutput()
_err = LimitedOutput()
_stream = io.StringIO('\n'.join(_inputs) + ('\n' if _inputs else ''))
_input_calls = 0
def _student_input(prompt=''):
    global _input_calls
    _input_calls += 1
    if prompt and _echo_prompts:
        _out.write(str(prompt))
    line = _stream.readline()
    if line == '':
        raise EOFError('Faltan datos para input(). Escribe las entradas en el panel, una por línea.')
    return line.rstrip('\n').rstrip('\r')
def _features(source):
    try:
        tree = ast.parse(source)
    except SyntaxError:
        return []
    found = set()
    for node in ast.walk(tree):
        if isinstance(node, ast.BinOp):
            for typ, label in ((ast.Add,'add'),(ast.Sub,'sub'),(ast.Mult,'mult'),(ast.Div,'div')):
                if isinstance(node.op,typ): found.add(label)
        if isinstance(node,ast.AugAssign) and isinstance(node.op,ast.Add): found.add('add')
        if isinstance(node,ast.AugAssign) and isinstance(node.op,ast.Sub): found.add('sub')
        if isinstance(node,ast.AugAssign) and isinstance(node.op,ast.Mult): found.add('mult')
        if isinstance(node,(ast.For,ast.AsyncFor)): found.add('for')
        if isinstance(node,ast.While): found.add('while')
        if isinstance(node,ast.Subscript): found.add('subscript')
        if isinstance(node,ast.Call):
            if isinstance(node.func,ast.Name) and node.func.id == 'input': found.add('input')
            if isinstance(node.func,ast.Attribute):
                if node.func.attr == 'input' and isinstance(node.func.value,ast.Name) and node.func.value.id=='builtins': found.add('input')
                if node.func.attr in ('read','readline','readlines') and isinstance(node.func.value,ast.Attribute) and node.func.value.attr=='stdin': found.add('input')
        if isinstance(node,ast.Return): found.add('return')
        if isinstance(node,(ast.FunctionDef,ast.AsyncFunctionDef)):
            found.add('function')
            found.add('function:'+node.name)
        if isinstance(node,ast.Assign):
            for target in node.targets:
                for sub in ast.walk(target):
                    if isinstance(sub,ast.Name): found.add('assign:'+sub.id)
        if isinstance(node,ast.AnnAssign) and isinstance(node.target,ast.Name): found.add('assign:'+node.target.id)
        if isinstance(node,ast.AugAssign) and isinstance(node.target,ast.Name): found.add('assign:'+node.target.id)
    return sorted(found)
_namespace={'__name__':'__main__','input':_student_input}
_original_stdin=sys.stdin
_original_input=builtins.input
try:
    with contextlib.redirect_stdout(_out), contextlib.redirect_stderr(_err):
        sys.stdin=_stream
        builtins.input=_student_input
        exec(compile(_code,'programa.py','exec'),_namespace)
except SystemExit:
    pass
except BaseException:
    traceback.print_exc(limit=6,file=_err)
finally:
    sys.stdin=_original_stdin
    builtins.input=_original_input
_result={'output':_out.getvalue().strip(), 'error':_err.getvalue().strip(),
    'vars':{k:_namespace.get(k) for k in ('energia','piloto') if isinstance(_namespace.get(k),(int,float,str))},
    'features':_features(_code), 'inputCalls':_input_calls}
json.dumps(_result,ensure_ascii=False,default=str)
`;
self.onmessage=async event=>{
  const {id,code='',inputs=[],checks=[],mode='mission'}=event.data||{};
  try{
    const py=await getPython();
    // Carga paquetes de la distribución Pyodide cuando hay imports compatibles;
    // la biblioteca estándar funciona normalmente, sin descargas adicionales.
    await py.loadPackagesFromImports(String(code));
    const run=async(values,echo=false)=>{
      py.globals.set('_AEROBOT_CODE_JSON',JSON.stringify(String(code)));
      py.globals.set('_AEROBOT_INPUTS_JSON',JSON.stringify((values||[]).map(String)));
      py.globals.set('_AEROBOT_ECHO_PROMPTS',Boolean(echo));
      const raw=await py.runPythonAsync(pythonRunner);
      return JSON.parse(raw);
    };
    const visible=await run(inputs,mode==='free');
    const tests=[];
    if(mode==='mission'){
      for(const item of checks){
        const result=await run(item.inputs);
        tests.push({output:result.output,error:result.error});
        if(result.error)break;
      }
    }
    self.postMessage({id,ok:true,visible,tests});
  }catch(error){
    self.postMessage({id,ok:false,error:String(error?.message||error)});
  }
};
