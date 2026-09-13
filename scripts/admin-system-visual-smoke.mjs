import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';
assert.equal(process.env.QIYU_ISOLATED_DATABASE,'qiyu_admin_ui_20260910');
const api='http://127.0.0.1:18098';
assert((await fetch('http://localhost:8000/login')).ok,'Frontend must be running on port 8000 before visual checks');
const login=await(await fetch(api+'/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientType:'ADMIN_WEB',grantType:'PASSWORD',identifier:'admin',credential:process.env.QIYU_ISOLATED_ADMIN_PASSWORD})})).json();
assert.equal(login.code,0);
const session={...login.data,token:login.data.accessToken,role:'HQ_ADMIN',displayName:login.data.principal.displayName,storeScope:['ALL_STORES'],expiresAt:Date.now()+3600000};
const organizations=await(await fetch(api+'/admin/system/organizations/tree',{headers:{Authorization:'Bearer '+session.token}})).json();
const root=organizations.data.find(r=>!r.parentId);
const profile=await mkdtemp(join(tmpdir(),'qiyu-system-ui-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--disable-gpu','--remote-debugging-port=19228','--user-data-dir='+profile,'http://localhost:8000/login'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));let socket;
try{
  let target;
  for(let n=0;n<50;n++){try{target=(await(await fetch('http://127.0.0.1:19228/json/list')).json()).find(t=>t.type==='page');if(target)break;}catch{}await sleep(100);}
  assert(target);socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
  let sequence=0;const pending=new Map();
  socket.addEventListener('message',event=>{const data=JSON.parse(event.data);if(data.id){const p=pending.get(data.id);pending.delete(data.id);data.error?p.reject(data.error):p.resolve(data.result);}});
  const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
  const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result?.value;};
  await send('Page.enable');await send('Emulation.setDeviceMetricsOverride',{width:1366,height:768,deviceScaleFactor:1,mobile:false});
  for(let n=0;n<50;n++){if(await evaluate("location.origin==='http://localhost:8000' && document.readyState==='complete'"))break;await sleep(100);}
  assert(await evaluate("location.origin==='http://localhost:8000'"),'Browser did not load the frontend origin');
  await evaluate("localStorage.setItem('qiyu-admin-auth',"+JSON.stringify(JSON.stringify(session))+");localStorage.setItem('qiyu-admin-api-mode','prod');localStorage.setItem('qiyu-admin-api-base-url',"+JSON.stringify(api)+");");
  const navigate=async path=>{await send('Page.navigate',{url:'http://localhost:8000'+path});await sleep(1800);};
  const click=async text=>{assert(await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.replace(/\\s/g,'')==="+JSON.stringify(text)+");b?.click();return !!b;})()"),'Missing button '+text);await sleep(400);};
  const capture=async(name,width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await sleep(300);const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(resolve('design',name),Buffer.from(result.data,'base64'));};
  await navigate('/system/organizations?id='+root.id);
  let content=await evaluate('document.body.innerText');assert(content.includes('下级组织'));assert(content.includes('高级配置'));assert(!content.includes('导航加载失败'));
  await capture('admin-system-organizations-1366.png',1366,768);
  await click('编辑资料');assert((await evaluate('document.body.innerText')).includes('上级组织'));
  await capture('admin-system-organization-editor-1024.png',1024,768);
  await navigate('/system/organizations?id='+root.id+'&tab=users&descendants=true');assert((await evaluate('document.body.innerText')).includes('包含下级组织'));
  await navigate('/system/menus');assert((await evaluate('document.body.innerText')).includes('配置显示'));
  await capture('admin-system-menus-1920.png',1920,1080);
  await click('预览我的导航');await capture('admin-system-menu-preview-1366.png',1366,768);
  await navigate('/system/dictionaries?type=booking_status');assert((await evaluate('document.body.innerText')).includes('同类型') || (await evaluate('document.body.innerText')).includes('选项名称'));
  await capture('admin-system-dictionaries-1366.png',1366,768);
  await click('编辑显示');assert((await evaluate('document.body.innerText')).includes('选项值（只读）'));
  await capture('admin-system-dictionary-editor-1024.png',1024,768);
  console.log('System UI smoke passed: real login, organization details/editor/member tab, persisted menu tree, navigation preview and protected dictionary editor; 6 screenshots.');
}finally{socket?.close();chrome.kill('SIGTERM');}
