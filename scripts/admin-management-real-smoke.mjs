import assert from 'node:assert/strict';

// This fixed loopback endpoint is reserved for the isolated acceptance database.
const base='http://127.0.0.1:18098';
assert.equal(process.env.QIYU_ISOLATED_DATABASE,'qiyu_admin_ui_20260910','Explicit isolated database acknowledgement required');
let token;
async function request(path,body){
  const response=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body?JSON.stringify(body):undefined});
  const result=await response.json();
  assert.equal(result.code,0,path+': '+result.message);
  return result.data;
}
const login=await request('/auth/login',{clientType:'ADMIN_WEB',grantType:'PASSWORD',identifier:'admin',credential:process.env.QIYU_ISOLATED_ADMIN_PASSWORD});
token=login.accessToken;
for(const resource of ['store','therapist','room','customer','member','report','dashboard']){
  assert(Array.isArray(await request('/admin/management/store-options?resource='+resource)));
}
const lists={};
for(const resource of ['stores','therapists','rooms','services','customers','members','coupons']){
  const first=await request('/admin/management/'+resource+'?pageNum=1&pageSize=1');
  assert(first.total>=first.list.length);assert(first.list.length<=1);lists[resource]=first.list;
  if(first.total>1){const second=await request('/admin/management/'+resource+'?pageNum=2&pageSize=1');assert.equal(second.total,first.total);assert.notEqual(first.list[0].id,second.list[0].id);}
  console.log(resource+': pagination passed ('+first.total+' rows)');
}
for(const resource of ['stores','therapists','rooms','services']){
  const impact=await request('/admin/management/'+resource+'/'+lists[resource][0].id+'/impact');assert(Number.isInteger(impact.count));
}
const range='startDate=2026-09-01&endDate=2026-09-30';
const analytics=await request('/admin/management/analytics?'+range);
assert.equal(analytics.trend.length,30);
assert.equal(analytics.summary.bookingCount,analytics.trend.reduce((sum,row)=>sum+row.bookingCount,0));
assert.equal(analytics.summary.completedCount,analytics.trend.reduce((sum,row)=>sum+row.completedCount,0));
const csv=await request('/admin/management/analytics/export?'+range);assert(csv.csv.includes('门店'));
const member=lists.members[0];assert(member?.memberId);
await request('/admin/management/coupon-records?customerId='+member.id);
const ledgerPath='/admin/management/members/'+member.memberId+'/ledger?customerId='+member.id;
const before=await request(ledgerPath);
const command={direction:'CREDIT',amount:1,remark:'独立数据库幂等验收',requestId:'isolated-management-'+crypto.randomUUID()};
const path='/admin/members/'+member.memberId+'/balance-adjustments';
const first=await request(path,command);const replay=await request(path,command);
assert.equal(first.transactionNo,replay.transactionNo);
const after=await request(ledgerPath);assert.equal(after.total,before.total+1);
assert.equal(Number(first.balanceAfter),Number(first.balanceBefore)+1);
console.log('Real MySQL smoke passed: scoped options, pagination, resource impacts, date metrics, export, coupons and one durable ledger row per replayed request.');
