import { Alert, App, Button, DatePicker, Descriptions, Drawer, Dropdown, Empty, Form, Input, InputNumber, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { adminRequest } from '@/services/http';
import { can, readAdminSession } from '@/services/admin-auth';
import { useManagementPage, useManagementState, useStoreOptions } from './useManagement';
import EditorDrawer from './EditorDrawer';
import { money } from '@/constants/reception';
import { useReception } from '@/components/reception/ReceptionContext';
import BookingDetail from '@/components/reception/BookingDetail';
import DaySchedule from '@/components/reception/DaySchedule';
import { receptionApi, type ReceptionBooking } from '@/services/reception-service';

type ResourceKind='stores'|'therapists'|'rooms'|'services';
interface ResourceRow {
  id:string;code:string;name:string;storeId?:string;store?:string;storeName?:string;enabled:boolean;status:string;
  address?:string;phone?:string;businessHours?:string;district?:string;province?:string;city?:string;
  longitude?:number;latitude?:number;regionId?:number;manager?:string;roomCount?:number;therapistCount?:number;
  level?:string;skills?:string[];rating?:number;specifyFee?:number;todayBookings?:number;
  category?:string;durationMinutes?:number;preparationMinutes?:number;cleanupMinutes?:number;
  price?:number;memberPrice?:number;description?:string;kind?:string;capacity?:number;note?:string;
}
const configs = {
  stores:{title:'门店管理',singular:'门店',permission:'store',statuses:['营业中','休息中']},
  therapists:{title:'技师管理',singular:'技师',permission:'therapist',statuses:['可预约','服务中','休假']},
  rooms:{title:'房间管理',singular:'房间',permission:'room',statuses:['AVAILABLE','BOOKED','IN_USE','CLEANING','MAINTENANCE']},
  services:{title:'服务项目',singular:'项目',permission:'service',statuses:['上架','下架']}
};
const labels:Record<string,string>={AVAILABLE:'空闲',BOOKED:'已预约',IN_USE:'使用中',CLEANING:'清洁中',MAINTENANCE:'维护中'};
const defaults:Record<ResourceKind,Partial<ResourceRow>>={
  stores:{status:'营业中',businessHours:'10:00-22:00',province:'上海市',city:'上海市'},
  therapists:{status:'可预约',level:'专业技师',skills:[],rating:5,specifyFee:0},
  rooms:{status:'AVAILABLE',kind:'推拿房',capacity:1},
  services:{status:'上架',durationMinutes:60,preparationMinutes:10,cleanupMinutes:10,price:0,memberPrice:0}
};

export default function ResourcePage({kind}:{kind:ResourceKind}) {
  const config=configs[kind];const session=readAdminSession();const {message,modal}=App.useApp();const navigate=useNavigate();
  const {params,set}=useManagementState();const scope=useReception();
  const storeOptions=useStoreOptions(kind==='services'?undefined:config.permission);
  const storeId=params.get('storeId')||undefined;
  const query={keyword:params.get('keyword')||undefined,storeId,status:params.get('status')||undefined,
    region:params.get('region')||undefined,category:params.get('category')||undefined,
    enabled:params.has('enabled')?params.get('enabled')==='true':undefined,pageNum:Number(params.get('page')||1),pageSize:20};
  const {data,loading,error,reload}=useManagementPage<ResourceRow>(kind,query);
  const [editing,setEditing]=useState<Partial<ResourceRow>>();const [bookingId,setBookingId]=useState<string>();
  const selected=data.list.find(row=>row.id===params.get('id'));
  const [tab,setTab]=useState('info');
  const manage=can(session,config.permission+(kind==='stores'?':update':':manage'));
  const create=can(session,config.permission+(kind==='stores'?':create':':manage'));
  const remove=can(session,config.permission+(kind==='stores'?':delete':':manage'));
  const change=(key:string,value:string|undefined)=>set({[key]:value,page:1,id:undefined});
  useEffect(()=>{
    if(!storeId && kind!=='services' && kind!=='stores' && scope.storeId && storeOptions.options.some(s=>s.value===scope.storeId))set({storeId:scope.storeId});
  },[scope.storeId,storeOptions.options]);
  const open=(row:ResourceRow,nextTab='info')=>{set({id:row.id});setTab(nextTab);};
  const save=async(values:Partial<ResourceRow>)=>{
    const payload={...editing,...values};
    await adminRequest('/admin/'+kind+(editing?.id?'/'+encodeURIComponent(editing.id):''),{method:editing?.id?'PUT':'POST',data:payload});
    message.success(config.singular+'已保存');reload();scope.retry();scope.refresh();
  };
  const run=async(row:ResourceRow,operation:'delete'|'toggle'|'status')=>{
    let impact=0;
    try {impact=(await adminRequest<{count:number}>('/admin/management/'+kind+'/'+encodeURIComponent(row.id)+'/impact')).count;}
    catch(e){message.error(e instanceof Error?e.message:'无法检查关联预约，请重试');return;}
    const next=kind==='services'?(row.status==='上架'?'下架':'上架'):kind==='rooms'?(row.status==='MAINTENANCE'?'AVAILABLE':'MAINTENANCE'):kind==='stores'?(row.status==='营业中'?'休息中':'营业中'):(row.status==='休假'?'可预约':'休假');
    const confirm=modal.confirm({title:operation==='delete'?'删除'+row.name+'？':operation==='toggle'?(row.enabled?'停用':'启用')+row.name+'？':'将'+row.name+'设为'+(labels[next]||next)+'？',
      content:<Space direction="vertical"><span>关联未完成预约 {impact} 笔。存在冲突时，请先处理预约再重试。</span>{impact>0&&can(session,'booking:read')&&<Button onClick={()=>{confirm.destroy();resourceLink(row,'/appointments');}}>查看关联预约</Button>}</Space>,okText:'确认',cancelText:'返回',okButtonProps:{danger:operation==='delete'},
      onOk:async()=>{try{await adminRequest('/admin/'+kind+'/'+encodeURIComponent(row.id),operation==='delete'?{method:'DELETE'}:{method:'PUT',data:{...row,...(operation==='toggle'?{enabled:!row.enabled}:{status:next})}});
        message.success('操作成功');reload();scope.retry();scope.refresh();}catch(e){message.error(e instanceof Error?e.message:'操作失败');throw e;}}});
  };
  const resourceLink=(row:ResourceRow,target:string)=>{if(row.storeId)scope.setScope({storeId:row.storeId});navigate(target+'?'+new URLSearchParams({...(kind==='stores'?{storeId:row.id}:row.storeId?{storeId:row.storeId}:{}),...(kind==='stores'?{}:{[kind==='rooms'?'roomId':kind==='services'?'serviceId':'therapistId']:row.id}),...(kind==='services'?{allStores:'true'}:{}),date:scope.date,allDates:'true'}));};
  return <PageContainer title={config.title} subTitle={kind==='services'?'维护全品牌项目与预约占用时间。':'查看门店资源，继续安排排班与预约。'}
    extra={create?[<Button key="new" type="primary" icon={<PlusOutlined />} onClick={()=>setEditing({...defaults[kind],enabled:true,storeId:storeId||scope.storeId})}>新增{config.singular}</Button>]:[]}>
    <div className="reception-panel">
      <Space wrap className="section-gap">
        <Input.Search allowClear aria-label="搜索资源" placeholder={'搜索'+config.singular+'名称'} defaultValue={query.keyword} onSearch={value=>change('keyword',value)} style={{width:240}} />
        {kind!=='services'&&kind!=='stores'&&<Select allowClear aria-label="门店" placeholder="全部门店" value={storeId} options={storeOptions.options} style={{width:200}} onChange={v=>{change('storeId',v);if(v)scope.setScope({storeId:v});}} />}
        <Select allowClear aria-label="状态" placeholder="全部状态" value={query.status} style={{width:140}} options={config.statuses.map(value=>({value,label:labels[value]||value}))} onChange={value=>change('status',value)} />
        <Select allowClear aria-label="启用状态" placeholder="启用状态" value={params.get('enabled')||undefined} style={{width:140}} options={[{value:'true',label:'已启用'},{value:'false',label:'已停用'}]} onChange={v=>change('enabled',v)} />
        {(kind==='stores'||kind==='services'||kind==='therapists')&&<Input.Search allowClear aria-label={kind==='stores'?'区域':kind==='services'?'分类':'技能'} placeholder={kind==='stores'?'按区县筛选':kind==='services'?'按分类筛选':'按技能筛选'} defaultValue={query.region||query.category} onSearch={v=>change(kind==='stores'?'region':'category',v)} style={{width:170}} />}
        <Button icon={<ReloadOutlined />} loading={loading} onClick={reload}>刷新</Button>
      </Space>
      {(error|| (kind!=='services'&&storeOptions.error))&&<Alert type="error" showIcon message={error||storeOptions.error} action={<Button onClick={()=>{reload();storeOptions.retry();}}>重试</Button>} />}
      {kind==='rooms'&&<Tabs activeKey={params.get('view')||'list'} onChange={v=>set({view:v})} items={[{key:'list',label:'房间列表'},...(can(session,'booking:read')?[{key:'schedule',label:'当日占用'}]:[])]} />}
      {kind==='rooms'&&params.get('view')==='schedule'?<ResourceOccupancy storeId={storeId} rows={data.list} onOpen={setBookingId} />:
      <Table<ResourceRow> rowKey="id" loading={loading} dataSource={data.list} scroll={{x:950}} pagination={{current:query.pageNum,pageSize:20,total:data.total,onChange:p=>set({page:p}),showTotal:total=>'共 '+total+' 条'}}
        columns={[
          {title:config.singular,dataIndex:'name',render:(_,row)=><Button type="link" onClick={()=>open(row)}>{row.name}</Button>},
          ...(kind==='stores'?[{title:'地址',dataIndex:'address'},{title:'营业时间',dataIndex:'businessHours'},
            {title:'资源',render:(_:unknown,row:ResourceRow)=><Space><Button onClick={()=>open(row,'therapists')}>{row.therapistCount} 位技师</Button><Button onClick={()=>open(row,'rooms')}>{row.roomCount} 间房</Button></Space>}]:
            kind==='services'?[{title:'分类',dataIndex:'category'},{title:'服务 / 总占用',render:(_:unknown,row:ResourceRow)=>row.durationMinutes+' / '+((row.durationMinutes||0)+(row.preparationMinutes||0)+(row.cleanupMinutes||0))+' 分钟'},
              {title:'标准价 / 会员价',render:(_:unknown,row:ResourceRow)=>money(row.price)+' / '+money(row.memberPrice)}]:
            [{title:'门店',render:(_:unknown,row:ResourceRow)=>row.store||row.storeName},
              {title:kind==='rooms'?'用途 / 容量':'等级 / 技能',render:(_:unknown,row:ResourceRow)=>kind==='rooms'?row.kind+' / '+row.capacity+' 人':row.level+' · '+(row.skills||[]).join('、')}]),
          {title:'状态',render:(_,row)=><Space><Tag>{labels[row.status]||row.status}</Tag>{!row.enabled&&<Tag>已停用</Tag>}</Space>},
          {title:'操作',width:170,fixed:'right',render:(_,row)=><Space><Button onClick={()=>open(row)}>详情</Button>
            {(manage||remove)&&<Dropdown trigger={['click']} menu={{items:[
              ...(manage?[{key:'edit',label:'编辑资料',onClick:()=>setEditing(row)},{key:'status',label:kind==='services'?'上架 / 下架':kind==='rooms'?'维护 / 恢复':kind==='stores'?'营业 / 休息':'休假 / 恢复',onClick:()=>run(row,'status')},{key:'toggle',label:row.enabled?'停用':'启用',onClick:()=>run(row,'toggle')}]:[]),
              ...(remove?[{key:'delete',label:'删除',danger:true,onClick:()=>run(row,'delete')}]:[])
            ]}}><Button>更多</Button></Dropdown>}</Space>}
        ]} />}
    </div>
    {selected&&<Drawer open width={760} title={selected.name} onClose={()=>set({id:undefined})} footer={<Space>
      {manage&&<Button type="primary" onClick={()=>setEditing(selected)}>编辑资料</Button>}
      {kind==='therapists'&&can(session,'schedule:read')&&<Button onClick={()=>resourceLink(selected,'/schedule')}>查看排班</Button>}
      {kind!=='stores'&&can(session,'booking:read')&&<Button onClick={()=>resourceLink(selected,'/appointments')}>查看预约</Button>}
    </Space>}>
      <Tabs activeKey={tab} onChange={setTab} items={[{key:'info',label:'基本信息',children:<Descriptions column={2} bordered items={Object.entries(selected).filter(([key])=>fieldLabels[key]).map(([key,value])=>({key,label:fieldLabels[key],children:Array.isArray(value)?value.join('、'):typeof value==='boolean'?(value?'已启用':'已停用'):labels[String(value)]||String(value??'—')}))}/>},
        ...(kind==='stores'?(['therapists','rooms'] as const).filter(resource=>can(session,configs[resource].permission+':read')).map(resource=>({key:resource,label:configs[resource].title,children:<RelatedResources resource={resource} storeId={selected.id} />})):[])]} />
    </Drawer>}
    {editing&&<EditorDrawer key={editing.id||'new'} title={(editing.id?'编辑':'新增')+config.singular} initialValues={editing} onClose={()=>setEditing(undefined)} onSave={save}>
      <ResourceFields kind={kind} editing={!!editing.id} stores={storeOptions.options} />
    </EditorDrawer>}
    {bookingId&&<BookingDetail id={bookingId} onClose={()=>setBookingId(undefined)} />}
  </PageContainer>;
}
const fieldLabels:Record<string,string>={code:'编码',name:'名称',store:'门店',storeName:'门店',address:'地址',phone:'联系电话',businessHours:'营业时间',district:'区县',manager:'店长',roomCount:'房间数',therapistCount:'技师数',level:'等级',skills:'技能',status:'状态',enabled:'启用状态',specifyFee:'指定费',category:'分类',durationMinutes:'服务分钟',preparationMinutes:'准备分钟',cleanupMinutes:'清洁分钟',price:'标准价',memberPrice:'会员价',description:'项目说明',kind:'用途',capacity:'接待人数',note:'备注'};
function ResourceFields({kind,editing,stores}:{kind:ResourceKind;editing:boolean;stores:Array<{value:string;label:string}>}) {
  const form=Form.useFormInstance();const duration=Form.useWatch('durationMinutes',form)||0;const preparation=Form.useWatch('preparationMinutes',form)||0;const cleanup=Form.useWatch('cleanupMinutes',form)||0;
  const text=(name:string,label:string,required=true)=><Form.Item key={name} name={name} label={label} rules={required?[{required:true,whitespace:true,message:'请填写'+label}]:[]}><Input disabled={name==='code'&&editing} /></Form.Item>;
  const number=(name:string,label:string,min=0)=><Form.Item key={name} name={name} label={label} rules={[{required:true,message:'请填写'+label}]}><InputNumber min={min} precision={['price','memberPrice','specifyFee'].includes(name)?2:0} style={{width:'100%'}} /></Form.Item>;
  return <><Typography.Title level={5}>基本信息</Typography.Title><div className="management-form-grid">
    {text('name','名称')}{text('code','编码')}
    {(kind==='rooms'||kind==='therapists')&&<Form.Item name="storeId" label="所属门店" rules={[{required:true,message:'请选择门店'}]}><Select options={stores} /></Form.Item>}
    {kind==='stores'&&<>{text('phone','联系电话',false)}{text('district','区县',false)}{text('address','详细地址')}{text('businessHours','营业时间（如 10:00-22:00）')}{text('province','省份')}{text('city','城市')}<Form.Item name="longitude" label="经度"><InputNumber min={-180} max={180} /></Form.Item><Form.Item name="latitude" label="纬度"><InputNumber min={-90} max={90} /></Form.Item></>}
    {kind==='therapists'&&<>{text('level','技师等级')}<Form.Item name="skills" label="技能" rules={[{required:true,message:'请选择或输入技能'}]}><Select mode="tags" tokenSeparators={[',','，']} /></Form.Item>{number('specifyFee','指定服务费')}</>}
    {kind==='rooms'&&<>{text('kind','用途')}{number('capacity','接待人数',1)}{text('note','维护与使用备注',false)}</>}
    {kind==='services'&&text('category','服务分类')}
    </div>{kind==='services'&&<><Typography.Title level={5}>价格</Typography.Title><div className="management-form-grid">{number('price','标准价')}{number('memberPrice','会员价')}</div><Typography.Title level={5}>时间安排</Typography.Title><div className="management-form-grid">{number('durationMinutes','服务时长（分钟）',1)}{number('preparationMinutes','准备时间（分钟）')}{number('cleanupMinutes','清洁时间（分钟）')}</div><Alert type="info" message={'每次预约共占用 '+(duration+preparation+cleanup)+' 分钟'} />{text('description','项目说明',false)}</>}</>;
}
function RelatedResources({resource,storeId}:{resource:'therapists'|'rooms';storeId:string}) {
  const navigate=useNavigate();const result=useManagementPage<ResourceRow>(resource,{storeId,pageSize:200});
  return <><Button type="primary" onClick={()=>navigate('/'+resource+'?storeId='+encodeURIComponent(storeId))}>进入{configs[resource].title}</Button>
    {result.error&&<Alert type="error" message={result.error} action={<Button onClick={result.reload}>重试</Button>} />}
    <Table rowKey="id" loading={result.loading} dataSource={result.data.list} columns={[{title:'名称',dataIndex:'name'},{title:'状态',dataIndex:'status',render:v=>labels[v]||v}]} /></>;
}
function ResourceOccupancy({storeId,rows,onOpen}:{storeId?:string;rows:ResourceRow[];onOpen:(id:string)=>void}) {
  const [date,setDate]=useState(dayjs());const [bookings,setBookings]=useState<ReceptionBooking[]>([]);const [error,setError]=useState<string>();
  useEffect(()=>{let active=true;setBookings([]);setError(undefined);if(storeId)receptionApi.all({storeId,startDate:date.format('YYYY-MM-DD'),endDate:date.format('YYYY-MM-DD')}).then(v=>active&&setBookings(v)).catch(e=>active&&setError(e.message));return()=>{active=false;};},[storeId,date]);
  return <><DatePicker allowClear={false} value={date} onChange={setDate} aria-label="占用日期" />{error&&<Alert type="error" message={error} />}
    {!storeId?<Empty description="请选择门店查看占用" />:<DaySchedule rows={bookings} onOpen={onOpen} onCreate={()=>{}} canCreate={false} roomContext={{storeId,date:date.format('YYYY-MM-DD'),rooms:rows.map(row=>({value:row.id,label:row.name,storeId}))}} />}</>;
}
