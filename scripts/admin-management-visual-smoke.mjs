import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import assert from 'node:assert/strict';

// Explicit, isolated UI fixtures. This server never forwards requests to a business database.
const store={id:'store-jingan',code:'JINGAN',name:'静安寺店',address:'上海市静安区愚园路 88 号',phone:'021-55551234',businessHours:'10:00-22:00',district:'静安区',province:'上海市',city:'上海市',manager:'李店长',roomCount:2,therapistCount:2,status:'营业中',enabled:true};
const therapist={id:'therapist-anran',code:'TH_JA_ANRAN',name:'沈安然',storeId:store.id,store:store.name,level:'高级技师',skills:['肩颈舒缓','中式推拿'],status:'可预约',rating:4.9,todayBookings:3,specifyFee:20,enabled:true};
const room={id:'room-1',code:'R01',name:'听雨',storeId:store.id,storeName:store.name,kind:'推拿房',capacity:1,status:'AVAILABLE',note:'安静房间',enabled:true};
const service={id:'service-neck',code:'NECK',name:'肩颈舒缓',category:'推拿',durationMinutes:60,preparationMinutes:10,cleanupMinutes:15,price:198,memberPrice:168,description:'舒缓肩颈，放松身心',status:'上架',enabled:true};
const customer={id:'1',memberId:'member-11',name:'林知夏',phone:'13800000001',memberLevel:'金卡会员',lastVisitAt:'2026-09-10 10:00:00',totalBookings:8,totalSpend:1288,balance:500,packageBalance:3,couponCount:1};
const coupon={id:'coupon-test',code:'TEST',name:'秋日舒缓礼遇',discountType:'PERCENT',discountPercent:20,thresholdAmount:100,validStartAt:'2026-09-01T00:00:00',validEndAt:'2026-10-01T00:00:00',issuedCount:12,usedCount:3,status:'ACTIVE',scope:'ALL_STORES'};
const entry={booking:{id:'BK-TEST-1',customerName:customer.name,mobile:customer.phone,customerId:'1',store:{id:store.id,name:store.name},service:{id:service.id,name:service.name,durationMinutes:60},therapist:{id:therapist.id,name:therapist.name},roomId:room.id,appointmentDate:'2026-09-10',startTime:'10:00',endTime:'11:00',status:'BOOKED',statusLabel:'已预约',amount:198,paidAmount:30,verificationCode:'123456',depositDueAmount:30,therapistFeeAmount:20,discountAmount:0},roomName:room.name,occupiedStartAt:'2026-09-10T09:50:00',occupiedEndAt:'2026-09-10T11:15:00',version:0,actions:[]};
const page=(list,url)=>{const p=Number(url.searchParams.get('pageNum')||1),size=Number(url.searchParams.get('pageSize')||20);return {list:list.slice((p-1)*size,p*size),total:list.length,pageNum:p,pageSize:size};};
const metrics=Array.from({length:7},(_,i)=>({id:'2026-09-'+String(i+4).padStart(2,'0'),name:'2026-09-'+String(i+4).padStart(2,'0'),bookingCount:10+i,completedCount:8+i,revenue:1500+i*227.35,completionRate:80,averageTicket:187.5}));
const totals=metrics.reduce((sum,row)=>({bookingCount:sum.bookingCount+row.bookingCount,completedCount:sum.completedCount+row.completedCount,revenue:sum.revenue+row.revenue}),{bookingCount:0,completedCount:0,revenue:0});
const summary={id:'total',name:'汇总',...totals,completionRate:Number((totals.completedCount/totals.bookingCount*100).toFixed(2)),averageTicket:Number((totals.revenue/totals.completedCount).toFixed(2))};
const ledger=[];const requests=[];let failedAdjustment=false;let analyticsPagination=false;let failAnalytics=false;
const server=createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost');let body='';
  for await(const chunk of req)body+=chunk;
  const payload=body?JSON.parse(body):{};requests.push({path:url.pathname,query:url.search,method:req.method,body:payload});
  res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,PUT,DELETE,OPTIONS');
  if(req.method==='OPTIONS'){res.end();return;}
  const send=(data,status=200)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({code:status===200?0:status,message:status===200?'success':'测试：网络中断，请重试',data}));};
  const path=url.pathname;
  if(path==='/admin/management/store-options')return send([{value:store.id,label:store.name}]);
  if(path==='/admin/reception/options')return send({stores:[{value:store.id,label:store.name}],services:[{value:service.id,label:service.name,price:198,durationMinutes:60}],therapists:[{value:therapist.id,label:therapist.name,storeId:store.id}],rooms:[{value:room.id,label:room.name,storeId:store.id}]});
  if(path==='/admin/reception/bookings')return send({...page([entry],url),counts:{BOOKED:1}});
  if(path.endsWith('/history'))return send([]);
  if(path==='/admin/reception/bookings/BK-TEST-1')return send(entry);
  if(path.endsWith('/impact'))return send({count:1});
  if(path.endsWith('/balance-adjustments')){
    if(!ledger.some(item=>item.requestId===payload.requestId)){customer.balance+=payload.direction==='CREDIT'?payload.amount:-payload.amount;ledger.push({id:'T1',requestId:payload.requestId,type:'ADJUSTMENT_CREDIT',amount:payload.amount,balanceAfter:customer.balance,remark:payload.remark,operator:'测试管理员',createdAt:'2026-09-10 12:00'});}
    if(!failedAdjustment){failedAdjustment=true;return send(null,503);}return send({balanceAfter:customer.balance});
  }
  if(path.endsWith('/ledger'))return send(page(ledger,url));
  if(path==='/admin/management/coupon-records')return send(page([{id:'C1',customerId:'1',name:coupon.name,status:'USED',validStartAt:coupon.validStartAt,validEndAt:coupon.validEndAt,usedAt:'2026-09-10 11:00'}],url));
  if(path==='/admin/management/analytics')return failAnalytics?send(null,503):send({summary,trend:metrics,stores:page(analyticsPagination?Array.from({length:21},(_,i)=>({...summary,id:'page-store-'+i,name:'分页门店'+i})):[{...summary,id:store.id,name:store.name}],url),updatedAt:'2026-09-10T12:15:00',definition:'按预约日期统计。已完成订单金额为订单净额，不代表现金实收。'});
  const resources={stores:[store],therapists:[therapist],rooms:[room],services:[service],customers:[customer],members:[customer],coupons:[coupon]};
  if(path.startsWith('/admin/management/'))return resources[path.split('/').pop()]?send(page(resources[path.split('/').pop()],url)):send(null,404);
  return send(null,404);
});
await new Promise(resolve=>server.listen(18097,'127.0.0.1',resolve));
const profile=await mkdtemp(join(tmpdir(),'qiyu-management-ui-'));
const chrome=spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--disable-gpu','--remote-debugging-port=19227','--user-data-dir='+profile,'http://localhost:8000/login'],{stdio:'ignore'});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let target;
for(let attempt=0;attempt<50;attempt++){try{target=(await(await fetch('http://127.0.0.1:19227/json/list')).json()).find(v=>v.type==='page');if(target)break;}catch{}await sleep(100);}
assert(target,'Chrome did not start');
const socket=new WebSocket(target.webSocketDebuggerUrl);await new Promise(resolve=>socket.addEventListener('open',resolve,{once:true}));
let sequence=0;const pending=new Map();
socket.addEventListener('message',event=>{const value=JSON.parse(event.data);if(value.id){const request=pending.get(value.id);pending.delete(value.id);value.error?request.reject(value.error):request.resolve(value.result);}});
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});
const evaluate=async expression=>{const result=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result?.value;};
const navigate=async path=>{await send('Page.navigate',{url:'http://localhost:8000'+path});await sleep(1400);};
const click=async text=>{assert(await evaluate(`(()=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.replace(/\\s/g,'')===${JSON.stringify(text)});button?.click();return !!button;})()`),'Missing button: '+text);await sleep(450);};
const capture=async(name,width,height)=>{await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await sleep(300);const result=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(resolve('design',name),Buffer.from(result.data,'base64'));};
const check=async text=>assert((await evaluate('document.body.innerText')).includes(text),'Missing content: '+text);
try{
  await send('Page.enable');await send('Runtime.enable');await sleep(900);
  const session={accessToken:'isolated-ui-test',token:'isolated-ui-test',tokenType:'Bearer',expiresIn:43200,expiresAt:Date.now()+43200000,role:'HQ_ADMIN',displayName:'验收管理员',storeScope:['ALL_STORES'],principal:{userId:'ui-test',userType:'STAFF',roles:['HQ_ADMIN'],permissions:['*'],storeScopes:['booking','store','therapist','room','member','customer','report'].map(resourceCode=>({resourceCode,actionCode:'*',scopeTypes:['ALL_STORES'],storeIds:[]}))}};
  await evaluate(`localStorage.setItem('qiyu-admin-auth',${JSON.stringify(JSON.stringify(session))});localStorage.setItem('qiyu-admin-api-mode','prod');localStorage.setItem('qiyu-admin-api-base-url','http://127.0.0.1:18097');sessionStorage.setItem('qiyu-reception-scope-ui-test',JSON.stringify({storeId:'store-jingan',date:'2026-09-10'}));`);
  await navigate('/stores');await check('静安寺店');await capture('admin-resources-stores-1366.png',1366,768);
  await click('静安寺店');await check('基本信息');await capture('admin-resources-detail-1366.png',1366,768);
  await navigate('/services');await click('新增项目');await check('时间安排');await capture('admin-resources-form-1024.png',1024,768);
  await navigate('/rooms?storeId=store-jingan&view=schedule');await check('当日资源排期');await capture('admin-resources-occupancy-1920.png',1920,1080);
  await navigate('/customers?view=assets');await check('林知夏');await capture('admin-customers-assets-1366.png',1366,768);
  await click('查看详情');await click('调整余额');
  await evaluate(`(()=>{for(const [id,value] of [['amount','20'],['remark','隔离验收余额调整']]){const element=document.getElementById(id);Object.getOwnPropertyDescriptor(element.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}));}})()`);
  await click('保存');await click('确认调整');await check('保存未完成');
  await click('保存');await click('确认调整');await check('¥520.00');
  const adjustments=requests.filter(r=>r.method==='POST'&&r.path.endsWith('/balance-adjustments'));assert.equal(adjustments.length,2);assert.equal(adjustments[0].body.requestId,adjustments[1].body.requestId);assert.equal(ledger.length,1);
  await capture('admin-customer-detail-1024.png',1024,768);
  await navigate('/coupons');await check('8 折');await click('创建优惠券');await check('确认预览');await capture('admin-coupons-form-1024.png',1024,768);
  await navigate('/dashboard?startDate=2026-09-04&endDate=2026-09-10');await check(totals.revenue.toFixed(2));await capture('admin-analysis-overview-1920.png',1920,1080);
  await click('查看相关预约');await check('预约明细');await capture('admin-analysis-drilldown-1366.png',1366,768);
  analyticsPagination=true;
  await navigate('/reports?startDate=2026-09-04&endDate=2026-09-10');
  assert(await evaluate(`(()=>{const next=document.querySelector('.ant-pagination-next button');next?.click();return !!next;})()`));await sleep(800);
  assert.equal(await evaluate("new URLSearchParams(location.search).get('page')"),'2');await check('分页门店20');
  await navigate('/reports?storeId=store-jingan');await navigate('/dashboard');
  assert(requests.filter(r=>r.path==='/admin/management/analytics').at(-1).query.includes('storeId=store-jingan'));
  failAnalytics=true;
  await evaluate(`(()=>{history.pushState({},'',location.pathname+'?startDate=2026-08-01&endDate=2026-08-02');dispatchEvent(new PopStateEvent('popstate'));})()`);await sleep(800);
  await check('刷新失败');
  assert(await evaluate(`(()=>{const buttons=[...document.querySelectorAll('button')].filter(b=>b.textContent.includes('查看相关预约'));return buttons.length===5&&buttons.every(b=>b.disabled);})()`));
  console.log('Visual smoke passed: 9 screenshots; balance retry, report pagination, remembered store and stale-result drilldown protection.');
  if(process.env.QIYU_REAL_UI==='1'){
    assert.equal(process.env.QIYU_ISOLATED_DATABASE,'qiyu_admin_ui_20260910');
    const response=await fetch('http://127.0.0.1:18098/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({clientType:'ADMIN_WEB',grantType:'PASSWORD',identifier:'admin',credential:process.env.QIYU_ISOLATED_ADMIN_PASSWORD})});
    const result=await response.json();assert.equal(result.code,0);
    const realSession={...result.data,token:result.data.accessToken,role:'HQ_ADMIN',displayName:result.data.principal.displayName,storeScope:['ALL_STORES'],expiresAt:Date.now()+3600000};
    await evaluate(`localStorage.setItem('qiyu-admin-auth',${JSON.stringify(JSON.stringify(realSession))});localStorage.setItem('qiyu-admin-api-base-url','http://127.0.0.1:18098');`);
    for(const [path,name,width,height] of [
      ['/stores','admin-real-stores-1366.png',1366,768],
      ['/customers?view=assets','admin-real-members-1024.png',1024,768],
      ['/dashboard?startDate=2026-09-01&endDate=2026-09-30','admin-real-analysis-1920.png',1920,1080]
    ]){
      await navigate(path);await sleep(1000);
      const content=await evaluate('document.body.innerText');
      assert(!content.includes('加载失败')&&!content.includes('刷新失败')&&!content.includes('登录栖愈'),path+' failed');
      await capture(name,width,height);
    }
    console.log('Real authenticated UI passed: 3 screenshots backed by isolated MySQL.');
  }
}finally{socket.close();chrome.kill('SIGTERM');server.close();}
