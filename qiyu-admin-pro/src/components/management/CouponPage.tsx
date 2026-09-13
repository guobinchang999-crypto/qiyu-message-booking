import { Alert, App, Button, DatePicker, Descriptions, Drawer, Dropdown, Form, Input, InputNumber, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { useState } from 'react';
import dayjs from 'dayjs';
import { can, readAdminSession } from '@/services/admin-auth';
import { couponTemplateApi, type CouponTemplateResource } from '@/services/coupon-service';
import { useManagementPage, useManagementState } from './useManagement';
import EditorDrawer from './EditorDrawer';
import { CouponRecords } from './CustomerCenter';
import { money } from '@/constants/reception';
const statusLabels={DRAFT:'草稿',ACTIVE:'投放中',ENDED:'已结束'};
export const couponDescription=(row:Pick<CouponTemplateResource,'discountType'|'discountPercent'|'discountAmount'>)=>
  row.discountType==='PERCENT'?'优惠 '+row.discountPercent+'%（'+((100-(row.discountPercent||0))/10)+' 折）':'减 '+money(row.discountAmount);
export default function CouponPage() {
  const {params,set}=useManagementState();const {message,modal}=App.useApp();const manage=can(readAdminSession(),'coupon:manage');
  const [editing,setEditing]=useState<Partial<CouponTemplateResource>>();const [tab,setTab]=useState('rules');
  const result=useManagementPage<CouponTemplateResource>('coupons',{status:params.get('status')||undefined,keyword:params.get('keyword')||undefined,pageNum:Number(params.get('page')||1),pageSize:20});
  const selected=result.data.list.find(r=>r.id===params.get('id'));
  const updateStatus=(row:CouponTemplateResource,status:'ACTIVE'|'ENDED')=>modal.confirm({title:status==='ACTIVE'?'发布优惠券？':'结束优惠券投放？',content:row.name+' · '+couponDescription(row),okText:'确认',cancelText:'返回',onOk:async()=>{await couponTemplateApi.update(row.id,{...row,status});message.success('状态已更新');result.reload();}});
  return <PageContainer title="优惠券" subTitle="查看优惠规则、发放记录和使用情况，全门店通用。"
    extra={manage?[<Button key="create" type="primary" onClick={()=>setEditing({code:'',name:'',discountType:'FIXED',discountAmount:20,thresholdAmount:0,status:'DRAFT',validStartAt:dayjs().startOf('day').format('YYYY-MM-DDTHH:mm:ss'),validEndAt:dayjs().add(30,'day').endOf('day').format('YYYY-MM-DDTHH:mm:ss')})}>创建优惠券</Button>]:[]}>
    <div className="reception-panel"><Tabs activeKey={params.get('status')||''} onChange={v=>set({status:v,page:1,id:undefined})} items={[{key:'',label:'全部'},...Object.entries(statusLabels).map(([key,label])=>({key,label}))]} />
      <Space className="section-gap"><Input.Search allowClear placeholder="搜索名称或编码" aria-label="搜索优惠券" defaultValue={params.get('keyword')||''} onSearch={v=>set({keyword:v,page:1})} /><Button loading={result.loading} onClick={result.reload}>刷新</Button></Space>
      {result.error&&<Alert type="error" message={result.error} action={<Button onClick={result.reload}>重试</Button>} />}
      <Table<CouponTemplateResource> rowKey="id" dataSource={result.data.list} loading={result.loading} scroll={{x:1050}}
        pagination={{current:Number(params.get('page')||1),pageSize:20,total:result.data.total,onChange:p=>set({page:p})}}
        columns={[{title:'优惠券',render:(_,r)=><Button type="link" onClick={()=>{set({id:r.id});setTab('rules');}}>{r.name}</Button>},
          {title:'优惠规则',render:(_,r)=>(r.thresholdAmount?'满 '+money(r.thresholdAmount):'无门槛')+' · '+couponDescription(r)},
          {title:'有效期',render:(_,r)=>r.validStartAt.slice(0,10)+' 至 '+r.validEndAt.slice(0,10)},
          {title:'发放 / 使用',render:(_,r)=><Space><Button onClick={()=>{set({id:r.id});setTab('issued');}}>{r.issuedCount}</Button>/<Button onClick={()=>{set({id:r.id});setTab('used');}}>{r.usedCount}</Button></Space>},
          {title:'状态',render:(_,r)=><Tag>{statusLabels[r.status]}</Tag>},
          {title:'操作',render:(_,r)=>manage?<Dropdown trigger={['click']} menu={{items:[
            {key:'edit',label:'编辑规则',disabled:r.issuedCount>0,onClick:()=>setEditing(r)},
            ...(r.status==='DRAFT'?[{key:'publish',label:'发布',onClick:()=>updateStatus(r,'ACTIVE')}]:[]),
            ...(r.status==='ACTIVE'?[{key:'end',label:'结束投放',onClick:()=>updateStatus(r,'ENDED')}]:[]),
            {key:'delete',label:'删除',danger:true,disabled:r.issuedCount>0,onClick:()=>modal.confirm({title:'删除'+r.name+'？',okText:'删除',cancelText:'返回',onOk:async()=>{await couponTemplateApi.remove(r.id);result.reload();}})}
          ]}}><Button>更多操作</Button></Dropdown>:<Button onClick={()=>set({id:r.id})}>详情</Button>}
        ]} />
    </div>
    {selected&&<Drawer open title={selected.name} width={800} onClose={()=>set({id:undefined})}><Tabs activeKey={tab} onChange={setTab} items={[
      {key:'rules',label:'优惠规则',children:<><Descriptions bordered column={1} items={[{key:'discount',label:'优惠',children:couponDescription(selected)},{key:'threshold',label:'使用门槛',children:money(selected.thresholdAmount)},{key:'dates',label:'有效期',children:selected.validStartAt+' 至 '+selected.validEndAt},{key:'scope',label:'适用范围',children:'全门店通用'}]} />{selected.issuedCount>0&&<Alert type="info" message="已有发放记录，优惠规则不可修改" />}</>},
      {key:'issued',label:'发放记录',children:<CouponRecords templateId={selected.id} />},{key:'used',label:'使用记录',children:<CouponRecords templateId={selected.id} status="USED" />}
    ]} /></Drawer>}
    {editing&&<EditorDrawer title={editing.id?'编辑优惠券':'创建优惠券'} initialValues={editing} onClose={()=>setEditing(undefined)} onSave={async values=>{
      const command=values as CouponTemplateResource;
      if(editing.id)await couponTemplateApi.update(editing.id,command);else await couponTemplateApi.create(command);
      message.success('优惠券已保存');result.reload();
    }}><CouponFields editing={!!editing.id} /></EditorDrawer>}
  </PageContainer>;
}
function CouponFields({editing}:{editing:boolean}) {
  const form=Form.useFormInstance();const values=Form.useWatch([],form)||{};
  const subtotal=Math.max(100,Number(values.thresholdAmount)||0);
  const discount=subtotal<(values.thresholdAmount||0)?0:Math.min(subtotal,values.discountType==='PERCENT'?subtotal*(values.discountPercent||0)/100:values.discountAmount||0);
  return <><Typography.Title level={5}>优惠规则</Typography.Title><div className="management-form-grid">
    <Form.Item name="code" label="编码" rules={[{required:true}]}><Input disabled={editing} /></Form.Item>
    <Form.Item name="name" label="名称" rules={[{required:true,whitespace:true}]}><Input /></Form.Item>
    <Form.Item name="discountType" label="优惠类型" rules={[{required:true}]}><Select options={[{value:'FIXED',label:'减固定金额'},{value:'PERCENT',label:'按比例优惠'}]} /></Form.Item>
    {values.discountType==='PERCENT'?<Form.Item name="discountPercent" label="减免比例（20 表示优惠 20%，即 8 折）" rules={[{required:true}]}><InputNumber min={0.01} max={100} precision={2} suffix="%" /></Form.Item>:<Form.Item name="discountAmount" label="优惠金额" rules={[{required:true}]}><InputNumber min={0.01} precision={2} prefix="¥" /></Form.Item>}
    <Form.Item name="thresholdAmount" label="使用门槛（0 为无门槛）" rules={[{required:true}]}><InputNumber min={0} precision={2} prefix="¥" /></Form.Item>
    </div><Typography.Title level={5}>有效期</Typography.Title><div className="management-form-grid">
      {['validStartAt','validEndAt'].map((key,index)=><Form.Item key={key} name={key} label={index?'结束时间':'开始时间'} rules={[{required:true}]} getValueProps={v=>({value:v?dayjs(v):null})} getValueFromEvent={v=>v?.format('YYYY-MM-DDTHH:mm:ss')}><DatePicker showTime /></Form.Item>)}
    </div><Typography.Title level={5}>确认预览</Typography.Title><Alert type="info" message={'全门店通用 · 订单 '+money(subtotal)+'，优惠 '+money(discount)+'，优惠后 '+money(subtotal-discount)} description="保存为草稿后，可在列表中发布。" /></>;
}
