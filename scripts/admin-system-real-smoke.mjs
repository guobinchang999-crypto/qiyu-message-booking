import assert from 'node:assert/strict';
assert.equal(process.env.QIYU_ISOLATED_DATABASE,'qiyu_admin_ui_20260910');
const base='http://127.0.0.1:18098';let token;
async function request(path,method='GET',data,expected=0){
  const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:data?JSON.stringify(data):undefined});
  const result=await response.json();if(expected===0)assert.equal(result.code,0,path+': '+result.message);else assert.notEqual(result.code,0,path+' should be rejected');return result.data;
}
const login=await request('/auth/login','POST',{clientType:'ADMIN_WEB',grantType:'PASSWORD',identifier:'admin',credential:process.env.QIYU_ISOLATED_ADMIN_PASSWORD});token=login.accessToken;
const prefix='/admin/system';const tree=await request(prefix+'/organizations/tree');assert(tree.length);
const parent=tree.find(r=>!r.parentId&&r.status==='ENABLED')||tree.find(r=>r.status==='ENABLED');assert(parent);
const name='组织验收-'+Date.now();
const create=(name,parentId)=>request(prefix+'/organizations','POST',{name,parentId,type:'DEPARTMENT',leader:'',sort:0,status:'ENABLED'});
const first=await create(name,parent.id);const child=await create(name+'-下级',first.id);
assert.equal(first.version,0);
await request(prefix+'/organizations/'+first.id,'PUT',{...first,parentId:child.id},1);
await request(prefix+'/organizations/'+first.id,'PUT',{...first,status:'DISABLED'},1);
const updated=await request(prefix+'/organizations/'+first.id,'PUT',{...first,name:name+'-已编辑'});
assert.equal(updated.version,1);
await request(prefix+'/organizations/'+first.id,'PUT',{...first,name:'旧版本修改'},1);
await request(prefix+'/organizations/'+first.id,'DELETE',undefined,1);
const people=await request(prefix+'/organizations/'+parent.id+'/members?descendants=true&page=1&pageSize=1');
assert(people.records.length<=1);assert(people.total>=people.records.length);
const navigation=await request(prefix+'/navigation');assert(navigation.some(r=>r.name==='高级配置'));assert(navigation.some(r=>r.path==='/reception'));assert(!navigation.some(r=>r.path==='/members'));
const menus=await request(prefix+'/menus/tree');const menu=menus.find(m=>m.path==='/reports');assert(menu);
try{
  const hidden=await request(prefix+'/menus/'+menu.id,'PUT',{...menu,visible:false});
  assert.equal(hidden.visible,false);assert.equal(hidden.status,menu.status);
  assert(!(await request(prefix+'/navigation')).some(m=>m.id===menu.id));
  await request(prefix+'/menus/'+menu.id,'PUT',{...menu,name:'过期提交'},1);
  await request(prefix+'/menus/'+menu.id,'DELETE',undefined,1);
  const directory=menus.find(m=>m.type==='DIRECTORY'&&!m.parentId);assert(directory);
  await request(prefix+'/menus/'+directory.id,'PUT',{...directory,parentId:directory.id},1);
}finally{
  const latest=(await request(prefix+'/menus/tree')).find(m=>m.id===menu.id);
  await request(prefix+'/menus/'+menu.id,'PUT',{...menu,version:latest.version});
}
await request(prefix+'/organizations/'+child.id,'DELETE');await request(prefix+'/organizations/'+first.id,'DELETE');
const types=await request(prefix+'/dictionaries/types');assert(types.some(t=>t.code==='booking_status'));
const dictionaryPage=await request(prefix+'/dictionaries/items?typeCode=booking_status&page=1&pageSize=1');assert.equal(dictionaryPage.records.length,1);assert(dictionaryPage.total>1);
const item=dictionaryPage.records[0];
await request(prefix+'/dictionaries/'+item.id,'PUT',{...item,itemValue:'INVALID'},1);
await request(prefix+'/dictionaries/'+item.id,'PUT',{...item,status:item.status==='ENABLED'?'DISABLED':'ENABLED'},1);
await request(prefix+'/dictionaries/'+item.id,'DELETE',undefined,1);
await request(prefix+'/dictionaries','POST',{...item,id:undefined},1);
try{const saved=await request(prefix+'/dictionaries/'+item.id,'PUT',{...item,itemLabel:item.itemLabel+'（验收）'});assert.equal(saved.itemValue,item.itemValue);assert.equal(saved.itemLabel,item.itemLabel+'（验收）');}
finally{await request(prefix+'/dictionaries/'+item.id,'PUT',item);}
console.log('Dictionary MySQL smoke passed: type query, exact filtering/pagination, protected values/status/deletion/creation, display edit and restoration.');
console.log('System MySQL smoke passed: hierarchy cycles, disabled parent, version conflict, reference protection, member pagination, persisted navigation visibility and restoration.');
