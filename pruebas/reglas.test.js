const test=require('node:test');
const assert=require('node:assert/strict');
const {cliente,importe,momento,hash,coincide}=require('../servidor/reglas');
const base={Nombres:'Ana',Apellidos:'Prueba',Nacionalidad:'Peruana',Correo:'demo@example.org',
PaisEmisorDocumento:'Perú',IdSegmento:'SG01',TipoDocumento:'DNI',NumeroDocumento:'12345678'};
for(const [tipo,n,acepta] of [['DNI','12345678',true],['DNI','1234',false],['CE','CE123',true],
 ['Pasaporte','PAS9999',true],['Pasaporte','P-1',false]]){
  test(tipo+' '+n,()=>{const f=()=>cliente({...base,TipoDocumento:tipo,NumeroDocumento:n});
    if(acepta)assert.equal(f().NumeroDocumento,n);else assert.throws(f);});
}
test('Importe negativo y más de dos decimales',()=>{assert.throws(()=>importe(-1));assert.throws(()=>importe(2.345));});
test('Fechas reales y precisión por minuto',()=>{assert.throws(()=>momento('2026-02-30T10:00'));assert.equal(momento('2026-11-25T08:00'),'2026-11-25 08:00:00');});
test('Verificación de contraseña',async()=>{const h=await hash('solo-prueba');assert.equal(await coincide('solo-prueba',h),true);assert.equal(await coincide('otra',h),false);});
