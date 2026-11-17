/** AEROBOT V7: casos complementarios por misión.
 * No sustituyen los casos del currículo; verifican que los programas funcionen
 * con diferentes datos, no solamente con los ejemplos mostrados al estudiante.
 */
export const extraCases = {
  10:[[['Maya'],'Hola Maya'],[['Teo'],'Hola Teo']],
  11:[[ ['-11','25'],'14'],[['2','10'],'12']],
  12:[[ ['11'],'22'],[['-8'],'-16']],
  13:[[ ['17'],'-17'],[['-13'],'13']],
  14:[[ ['15'],'Impar'],[['-10'],'Par']],
  15:[[ ['-7','-1'],'-1'],[['24','2'],'24']],
  16:[[ ['11'],'Espera'],[['12'],'Adelante']],
  20:[[ ['5','6','*'],'30'],[['11','2','/'],'5.5'],[['3','7','-'],'-4'],[['3','0','/'],'Indefinido']],
  21:[[ ['20'],'68'],[['37'],'98.6']],
  22:[[ ['8','6'],'24'],[['6.5','4'],'13']],
  23:[[ ['4','5','6'],'5.00'],[['8','8','9'],'8.33']],
  24:[[ ['casa'],'asac'],[['abrir'],'rirba']],
  25:[[ ['aeiou'],'5'],[['BCDF'],'0'],[['Universo'],'4']],
  26:[[ ['Radar'],'Si'],[['sol y los'],'Si'],[['casa'],'No']],
  27:[[ ['4,10,6'],'10'],[['-9,-3,-5'],'-3']],
  28:[[ ['2,4,6'],'2,4,6'],[['11,15'],'Ninguno']],
  29:[[ ['8'],'20'],[['12'],'42']],
  30:[[ ['4'],'24'],[['7'],'5040']],
  31:[[ ['Maya'],'Hola Maya'],[['Teo'],'Hola Teo']],
  32:[[ ['5'],'25'],[['-6'],'36']],
  33:[[ ['abc12345'],'Segura'],[['Abcdefgh'],'Insegura'],[['12345678'],'Insegura']],
  34:[[ ['Ana'],'123'],[['Sofi'],'No encontrado']],
  35:[[ ['2,3,2,4,3'],'2,3,4'],[['-1,-1,2,-1,0'],'-1,2,0']],
  36:[[ ['uno dos tres cuatro'],'4'],[['a    b'],'2']],
  37:[[ ['17'],'Primo'],[['25'],'No primo'],[['0'],'No primo']],
  38:[[ ['75','15'],'60'],[['8','8'],'0'],[['8','20'],'Fondos insuficientes']],
  39:[[ ['50,60','NO'],'Total: 110.00'],[['100','SI'],'Total: 105.00'],[['200','NO'],'Total: 200.00']]
};
export function getMissionChecks(lesson,index){
  if(lesson.check?.type!=='cases')return [];
  return [...lesson.check.cases,...(extraCases[index]||[]).map(([inputs,output])=>({inputs,output}))];
}
