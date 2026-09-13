import { Alert, App, Button, DatePicker, Descriptions, Drawer, Form, Input, InputNumber, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { useEffect, useRef, useState } from 'react';
import { can, readAdminSession } from '@/services/admin-auth';
import { adminRequest } from '@/services/http';
import { queryString } from '@/services/management-service';
import { useManagementPage, useManagementState, useStoreOptions } from './useManagement';
import { money } from '@/constants/reception';
import { memberManagementApi } from '@/services/member-service';
import BookingDetail from '@/components/reception/BookingDetail';
import BookingForm from '@/components/reception/BookingForm';
import { receptionApi, type ReceptionBooking } from '@/services/reception-service';
import EditorDrawer from './EditorDrawer';
import dayjs from 'dayjs';

interface Customer {id:string;memberId?:string;name:string;phone:string;memberLevel:string;lastVisitAt?:string;totalBookings:number;totalSpend?:number;balance?:number;packageBalance:number;couponCount:number}
const memberLevelLabel=(value?:string)=>value==='GOLD'?'金卡会员':value||'普通客户';
interface Ledger {id:string;type:string;amount:number;balanceAfter:number;remark:string;operator:string;createdAt:string}
export interface CouponRecord {id:string;customerId:string;name:string;status:string;validStartAt:string;validEndAt:string;usedAt?:string;bookingId?:string}
const ledgerLabels:Record<string,string>={ADJUSTMENT_CREDIT:'人工增加',ADJUSTMENT_DEBIT:'人工扣减',RECHARGE:'充值',DEDUCTION:'消费扣减',REFUND:'退回'};
export default function CustomerCenter() {
  const session=readAdminSession();const {params,set}=useManagementState();
  const customerAccess=can(session,'customer:read');const memberAccess=can(session,'member:read');
  const view=params.get('view')==='assets'&&memberAccess||!customerAccess?'assets':'customers';
  const resource=view==='assets'?'members':'customers';const stores=useStoreOptions(view==='assets'?'member':'customer');
  const level=params.get('level')||undefined;
  const query={keyword:params.get('keyword')||undefined,storeId:params.get('storeId')||undefined,level:level==='金卡'||level==='金卡会员'?'GOLD':level,
    startDate:params.get('startDate')||undefined,endDate:params.get('endDate')||undefined,pageNum:Number(params.get('page')||1),pageSize:20};
  const result=useManagementPage<Customer>(resource,query);
  const [revision,setRevision]=useState(0);const [booking,setBooking]=useState<string>();const [creating,setCreating]=useState(false);
  const selected=result.data.list.find(c=>c.id===params.get('id'));
  const [detailTab,setDetailTab]=useState('overview');
  const [asset,setAsset]=useState<Customer>();const [assetError,setAssetError]=useState<string>();
  const [adjusting,setAdjusting]=useState(false);
  useEffect(()=>{
    let active=true;setAsset(undefined);setAssetError(undefined);
    if(selected&&memberAccess)adminRequest<{list:Customer[]}>('/admin/management/members?'+queryString({customerId:selected.id}))
      .then(v=>active&&setAsset(v.list[0])).catch(e=>active&&setAssetError(e.message));
    return()=>{active=false;};
  },[selected?.id,memberAccess,revision]);
  const change=(key:string,value?:string)=>set({[key]:value,page:1,id:undefined});
  return <PageContainer title="客户中心" subTitle="一次找到客户，连续查看预约、会员资产与余额记录。">
    <div className="reception-panel">
      <Tabs activeKey={view} onChange={v=>set({view:v,page:1,id:undefined})} items={[
        ...(customerAccess?[{key:'customers',label:'客户名单'}]:[]),...(memberAccess?[{key:'assets',label:'会员资产'}]:[])]} />
      <Space wrap className="section-gap">
        <Input.Search allowClear placeholder="搜索姓名或手机号" aria-label="搜索客户" defaultValue={query.keyword} onSearch={v=>change('keyword',v)} style={{width:240}} />
        <Select allowClear aria-label="到店门店" placeholder="有预约记录的门店" value={query.storeId} options={stores.options} onChange={v=>change('storeId',v)} style={{width:210}} />
        <Input.Search allowClear placeholder="会员等级" aria-label="会员等级" defaultValue={query.level} onSearch={v=>change('level',v)} style={{width:160}} />
        <DatePicker.RangePicker aria-label="最近到店日期" value={query.startDate&&query.endDate?[dayjs(query.startDate),dayjs(query.endDate)]:null}
          onChange={v=>set({startDate:v?.[0]?.format('YYYY-MM-DD'),endDate:v?.[1]?.format('YYYY-MM-DD'),page:1})} />
        <Button loading={result.loading} onClick={result.reload}>刷新</Button>
      </Space>
      {(result.error||stores.error)&&<Alert type="error" message={result.error||stores.error} action={<Button onClick={()=>{result.reload();stores.retry();}}>重试</Button>} />}
      <Table<Customer> rowKey="id" dataSource={result.data.list} loading={result.loading} scroll={{x:950}}
        pagination={{current:query.pageNum,pageSize:20,total:result.data.total,onChange:p=>set({page:p}),showTotal:total=>'共 '+total+' 位客户'}}
        columns={[{title:'客户',render:(_,c)=><><Button type="link" onClick={()=>{set({id:c.id});setDetailTab('overview');}}>{c.name}</Button><div>{c.phone}</div></>},
          {title:'会员等级',dataIndex:'memberLevel',render:v=><Tag>{memberLevelLabel(v)}</Tag>},
          ...(view==='assets'?[{title:'余额',dataIndex:'balance',render:(v:number)=>money(v)},{title:'套餐余量',dataIndex:'packageBalance'},{title:'可用优惠券',dataIndex:'couponCount'}]:
            [{title:'最近到店',dataIndex:'lastVisitAt',render:(v:string)=>v||'暂无到店记录'},{title:'累计预约',dataIndex:'totalBookings'},
              ...(can(session,'finance:view')?[{title:'累计完成订单金额',dataIndex:'totalSpend',render:(v:number)=>money(v)}]:[])]),
          {title:'操作',render:(_,c)=><Button onClick={()=>{set({id:c.id});setDetailTab(view==='assets'?'assets':'overview');}}>查看详情</Button>}
        ]} />
    </div>
    {selected&&<Drawer open title="客户详情" width={800} onClose={()=>set({id:undefined})}
      footer={<Space>{can(session,'booking:create')&&<Button type="primary" disabled={selected.phone.includes('*')} onClick={()=>setCreating(true)}>为该客户预约</Button>}<Typography.Text type="secondary">会员权益全门店通用</Typography.Text></Space>}>
      <Typography.Title level={3}>{selected.name}</Typography.Title><Typography.Paragraph>{selected.phone} · {memberLevelLabel(selected.memberLevel)}</Typography.Paragraph>
      <Tabs activeKey={detailTab} onChange={setDetailTab} items={[
        {key:'overview',label:'概览',children:<Descriptions bordered column={2} items={[{key:'last',label:'最近到店',children:selected.lastVisitAt||'暂无记录'},{key:'count',label:'累计预约',children:selected.totalBookings+' 次'}]} />},
        ...(can(session,'booking:read')?[{key:'bookings',label:'预约记录',children:<CustomerBookings customerId={selected.id} onOpen={setBooking} />}]:[]),
        ...(memberAccess?[{key:'assets',label:'会员资产',children:<>
          {assetError?<Alert type="error" message={assetError} action={<Button onClick={()=>setRevision(v=>v+1)}>重试</Button>} />:
            asset?<><Descriptions bordered column={2} items={[{key:'balance',label:'余额',children:money(asset.balance)},{key:'packages',label:'套餐余量',children:asset.packageBalance+' 次'},{key:'coupons',label:'可用优惠券',children:asset.couponCount+' 张'},{key:'scope',label:'权益范围',children:'全门店通用'}]} />
              {can(session,'member:manage')&&<Button className="section-gap" onClick={()=>setAdjusting(true)}>调整余额</Button>}
              <CouponRecords customerId={selected.id} /></>:<Alert type="info" message="该客户暂无可查看的会员账户" />}
        </>},
        ...(asset?.memberId?[{key:'ledger',label:'余额流水',children:<LedgerList key={revision} memberId={asset.memberId} customerId={selected.id} />}]:[])]:[])
      ]} />
    </Drawer>}
    {adjusting&&asset?.memberId&&<BalanceAdjustment member={asset} onClose={()=>setAdjusting(false)} onSaved={()=>{result.reload();setRevision(v=>v+1);}} />}
    {booking&&<BookingDetail id={booking} onClose={()=>setBooking(undefined)} />}
    {creating&&selected&&<BookingForm seed={{customerName:selected.name,mobile:selected.phone}} onClose={()=>setCreating(false)} onSaved={b=>{setCreating(false);setBooking(b.id);result.reload();}} />}
  </PageContainer>;
}
function CustomerBookings({customerId,onOpen}:{customerId:string;onOpen:(id:string)=>void}) {
  const [page,setPage]=useState(1);const [rows,setRows]=useState<ReceptionBooking[]>([]);const [total,setTotal]=useState(0);const [error,setError]=useState<string>();const [retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setError(undefined);receptionApi.list({customerId,pageNum:page,pageSize:10}).then(v=>{if(active){setRows(v.list);setTotal(v.total);}}).catch(e=>active&&setError(e.message));return()=>{active=false;};},[customerId,page,retry]);
  return <>{error&&<Alert type="error" message={error} action={<Button onClick={()=>setRetry(v=>v+1)}>重试</Button>} />}<Table rowKey="id" dataSource={rows} pagination={{current:page,pageSize:10,total,onChange:setPage}} columns={[{title:'预约时间',dataIndex:'scheduledAt'},{title:'项目',dataIndex:'service'},{title:'门店',dataIndex:'store'},{title:'状态',dataIndex:'statusLabel'},{title:'操作',render:(_,b)=><Button onClick={()=>onOpen(b.id)}>查看预约</Button>}]} /></>;
}
function LedgerList({memberId,customerId}:{memberId:string;customerId:string}) {
  const [page,setPage]=useState(1);const result=useManagementPage<Ledger>('members/'+memberId+'/ledger',{customerId,pageNum:page,pageSize:10});
  return <>{result.error&&<Alert type="error" message={result.error} action={<Button onClick={result.reload}>重试</Button>} />}<Table rowKey="id" loading={result.loading} dataSource={result.data.list}
    pagination={{current:page,pageSize:10,total:result.data.total,onChange:setPage}} columns={[{title:'时间',dataIndex:'createdAt'},{title:'类型',dataIndex:'type',render:v=>ledgerLabels[v]||v},{title:'金额',dataIndex:'amount',render:money},{title:'变更后余额',dataIndex:'balanceAfter',render:money},{title:'原因',dataIndex:'remark'},{title:'操作人',dataIndex:'operator'}]} /></>;
}
export function CouponRecords({customerId,templateId,status}:{customerId?:string;templateId?:string;status?:string}) {
  const [page,setPage]=useState(1);const result=useManagementPage<CouponRecord>('coupon-records',{customerId,templateId,status,pageNum:page,pageSize:10});
  useEffect(()=>setPage(1),[status,templateId,customerId]);
  return <>{result.error&&<Alert type="error" message={result.error} action={<Button onClick={result.reload}>重试</Button>} />}<Table rowKey="id" dataSource={result.data.list} loading={result.loading} pagination={{current:page,pageSize:10,total:result.data.total,onChange:setPage}} columns={[{title:'优惠券',dataIndex:'name'},{title:'券编号',dataIndex:'id'},{title:'状态',dataIndex:'status',render:v=>({UNUSED:'未使用',USED:'已使用',EXPIRED:'已过期'}[v as string]||v)},{title:'有效期至',dataIndex:'validEndAt'},{title:'使用时间',dataIndex:'usedAt'}]} /></>;
}
function BalanceAdjustment({member,onClose,onSaved}:{member:Customer;onClose:()=>void;onSaved:()=>void}) {
  const {modal}=App.useApp();const request=useRef({signature:'',id:crypto.randomUUID()});
  return <EditorDrawer title={'调整余额 · '+member.name} initialValues={{direction:'CREDIT' as 'CREDIT'|'DEBIT',amount:undefined as number|undefined,remark:''}} onClose={onClose} onSave={async value=>{
    const amount=value.amount!;const after=Number(member.balance)+(value.direction==='CREDIT'?amount:-amount);
    if(after<0)throw new Error('扣减金额不能超过当前余额');
    const confirmed=await new Promise<boolean>(resolve=>modal.confirm({title:'确认调整余额',content:<Descriptions column={1} items={[{key:'name',label:'客户',children:member.name},{key:'amount',label:'调整',children:(value.direction==='CREDIT'?'+':'−')+money(amount)},{key:'after',label:'预计余额',children:money(after)},{key:'reason',label:'原因',children:value.remark}]} />,okText:'确认调整',cancelText:'返回修改',onOk:()=>resolve(true),onCancel:()=>resolve(false)}));
    if(!confirmed)throw new Error('尚未提交，可继续修改');
    const signature=JSON.stringify(value);if(signature!==request.current.signature)request.current={signature,id:crypto.randomUUID()};
    await memberManagementApi.adjustBalance(member.memberId!,{...value,amount,requestId:request.current.id});onSaved();
  }}>
    <Alert type="info" message={'当前余额 '+money(member.balance)} className="section-gap" />
    <Form.Item name="direction" label="调整方式" rules={[{required:true}]}><Select options={[{value:'CREDIT',label:'增加余额'},{value:'DEBIT',label:'扣减余额'}]} /></Form.Item>
    <Form.Item name="amount" label="调整金额" rules={[{required:true,message:'请填写调整金额'}]}><InputNumber min={0.01} max={99999999.99} precision={2} prefix="¥" /></Form.Item>
    <Form.Item name="remark" label="调整原因" rules={[{required:true,whitespace:true,message:'请填写调整原因'}]}><Input.TextArea maxLength={255} showCount /></Form.Item>
  </EditorDrawer>;
}
