import { Alert, Button, Empty, Segmented, Space, Spin, Table, Tabs, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { ReloadOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { receptionApi, type ReceptionBooking, type ReceptionPageData } from '@/services/reception-service';
import { useReception } from './ReceptionContext';
import ReceptionToolbar from './ReceptionToolbar';
import BookingForm, { type BookingSeed } from './BookingForm';
import BookingDetail from './BookingDetail';
import DaySchedule from './DaySchedule';
import BookingStatusTag from '@/components/BookingStatusTag';
import { actionLabels, errorText, money, primaryActions, receptionStages, statusLabels } from '@/constants/reception';
import { can, canAccessStore, readAdminSession } from '@/services/admin-auth';
import type { BookingStatus } from '@/types';

export default function ReceptionPage({ kind='appointments' }: {kind?:'workbench'|'appointments'|'orders'}) {
  const scope=useReception(); const location=useLocation();
  const navigate=useNavigate();
  const history={replace:(path:string)=>navigate(path,{replace:true})};
  const stateKey='qiyu-reception-view-'+readAdminSession()?.principal.userId+'-'+kind;
  const readState=()=>{try{return JSON.parse(sessionStorage.getItem(stateKey)||'{}');}catch{return {};}};
  const [keyword,setKeyword]=useState<string>(()=>readState().keyword||'');
  const [status,setStatus]=useState<string>(()=>readState().status|| (kind==='orders'?'CHECKED_IN,WAITING_SERVICE':''));
  const [view,setView]=useState<string>(()=>readState().view||'list');
  const [page,setPage]=useState<number>(()=>readState().page||1);
  const [size,setSize]=useState<number>(20);
  const [data,setData]=useState<ReceptionPageData>({list:[],total:0,pageNum:1,pageSize:20,counts:{}});
  const [board,setBoard]=useState<ReceptionBooking[]>([]);
  const [loading,setLoading]=useState(false); const [error,setError]=useState<string>();
  const [create,setCreate]=useState<BookingSeed>(); const [attempt,setAttempt]=useState(0);
  const id=new URLSearchParams(location.search).get('bookingId');
  const customerId=new URLSearchParams(location.search).get('customerId') || undefined;
  const filters=new URLSearchParams(location.search);
  const therapistId=filters.get('therapistId')||undefined,roomId=filters.get('roomId')||undefined,serviceId=filters.get('serviceId')||undefined;
  useEffect(()=>{const storeId=filters.get('storeId'),date=filters.get('date');if(storeId||date)scope.setScope({...storeId?{storeId}:{},...date?{date}:{}});},[location.search]);
  const title=kind==='workbench'?'今日接待':kind==='orders'?'服务订单':'预约管理';
  useEffect(()=>{sessionStorage.setItem(stateKey,JSON.stringify({keyword,status,view,page}));},[stateKey,keyword,status,view,page]);
  useEffect(()=>{setPage(1);},[scope.storeId,scope.date,keyword,status]);
  useEffect(()=>{
    if (!scope.storeId) return;
    let active=true; setLoading(true); setError(undefined);
    const allDates=filters.get('allDates')==='true';
    const query={storeId:filters.get('allStores')==='true'?undefined:scope.storeId,startDate:customerId||allDates?undefined:scope.date,endDate:customerId||allDates?undefined:scope.date,keyword,customerId,therapistId,roomId,serviceId,status,pageNum:page,pageSize:size};
    const request=view==='schedule' && kind==='appointments'
      ? Promise.all([receptionApi.list(query),receptionApi.all({...query,pageNum:undefined,pageSize:undefined})]).then(([result,all])=>{if(active){setData(result);setBoard(all);}})
      : receptionApi.list(query).then(result=>{if(active){setData(result);if(result.total>0 && result.list.length===0)setPage(1);}});
    request.catch(e=>active && setError(errorText(e))).finally(()=>active && setLoading(false));
    return ()=>{active=false;};
  },[scope.storeId,scope.date,scope.revision,keyword,status,page,size,view,attempt,customerId,therapistId,roomId,serviceId,filters.get('allDates'),filters.get('allStores')]);
  const open=(bookingId:string)=>{const params=new URLSearchParams(location.search);params.set('bookingId',bookingId);history.replace(location.pathname+'?'+params.toString());};
  const close=()=>{const params=new URLSearchParams(location.search);params.delete('bookingId');history.replace(location.pathname+(params.size?'?'+params.toString():''));};
  const session=readAdminSession();
  const canCreate=can(session,'booking:create') && !!scope.storeId && canAccessStore(session,'booking','CREATE',scope.storeId);
  const count=(statuses:string[])=>statuses.reduce((sum,s)=>sum+(data.counts[s as BookingStatus]||0),0);
  return <PageContainer title={title} subTitle={kind==='workbench'?'从到店到服务完成，安排好每一位客户。':kind==='orders'?'按服务进度处理当前门店订单。':'查看预约、安排时间与调整服务资源。'}>
    {filters.get('allStores')==='true'?<Alert type="info" className="section-gap" message="全部授权门店的项目预约记录" action={<Button onClick={()=>history.replace(location.pathname)}>返回当前门店</Button>} />:<ReceptionToolbar keyword={keyword} onSearch={setKeyword} onCreate={()=>setCreate({})} />}
    {(scope.error || error) && <Alert type="error" showIcon className="section-gap" message="数据加载失败" description={scope.error||error} action={<Button onClick={()=>{scope.retry();setAttempt(v=>v+1);}}>重试</Button>} />}
    {kind==='workbench' && <div className="reception-metrics">{receptionStages.map(stage=><button type="button" key={stage.key} className={'reception-metric '+(status===stage.key?'selected':'')} onClick={()=>setStatus(status===stage.key?'':stage.key)} aria-pressed={status===stage.key}><span>{stage.label}</span><strong>{count(stage.statuses)}</strong><small>查看待办 →</small></button>)}</div>}
    <div className="reception-panel">
      <div className="reception-list-heading"><Space><Typography.Text strong>{customerId?'客户预约记录':(filters.get('allDates')==='true'?'全部日期':scope.date)+' · '+(status?'筛选结果':'全部预约')}</Typography.Text><Typography.Text type="secondary">共 {data.total} 条</Typography.Text>{(customerId||filters.get('allDates')) && <Button onClick={()=>history.replace(location.pathname)}>返回当日</Button>}</Space><Space>
        {kind==='appointments' && <Segmented aria-label="预约视图" value={view} onChange={v=>setView(String(v))} options={[{label:'列表',value:'list'},{label:'日排期',value:'schedule'}]} />}
        <Button icon={<ReloadOutlined />} loading={loading} onClick={()=>setAttempt(v=>v+1)}>刷新</Button>
      </Space></div>
      <Tabs activeKey={status} onChange={setStatus} items={kind==='orders'?
        [{key:'',label:'全部'},...receptionStages.slice(1).map(s=>({key:s.key,label:s.label+' '+count(s.statuses)})),{key:'COMPLETED',label:'已完成 '+count(['COMPLETED'])}] :
        [{key:'',label:'全部'},...Object.entries(statusLabels).map(([key,label])=>({key,label:label+' '+count([key])})),...(status.includes(',')?[{key:status,label:'待服务 '+count(status.split(','))}]:[])]} />
      {scope.loading ? <Spin /> : !scope.storeId ? <Empty description="当前账号暂无可访问门店" /> :
        view==='schedule' && kind==='appointments' ? <Spin spinning={loading}><DaySchedule rows={board} onOpen={open} onCreate={setCreate} canCreate={canCreate} /></Spin> :
        <Table<ReceptionBooking> rowKey="id" loading={loading} dataSource={data.list} size="middle" scroll={{x:1000}} pagination={{current:page,pageSize:size,total:data.total,showSizeChanger:true,showTotal:total=>'共 '+total+' 条',onChange:(p,s)=>{setPage(p);setSize(s);}}}
          locale={{emptyText:<Empty description={keyword?'没有找到匹配的预约，请调整搜索条件。':'当前筛选下暂无预约'} />}}
          columns={[
            {title:'时间',dataIndex:'scheduledAt',width:135,render:(_,b)=><><strong>{b.scheduledAt.slice(11)}–{b.endTime}</strong><div className="muted">{b.scheduledAt.slice(0,10)}</div></>},
            {title:'客户',width:160,render:(_,b)=><><Button type="link" className="customer-link" onClick={()=>open(b.id)}>{b.customerName}</Button><div className="muted">{b.phone}</div></>},
            {title:'服务安排',render:(_,b)=><><div>{b.service}</div><div className="muted">{b.therapist} · {b.room}</div></>},
            {title:'状态',width:105,render:(_,b)=><BookingStatusTag status={b.status} label={b.statusLabel} />},
            {title:'金额',width:140,render:(_,b)=><><span>{money(b.amount)}</span><div className="muted">已付 {money(b.paidAmount)}</div></>},
            {title:'下一步',width:150,fixed:'right',render:(_,b)=>{const next=b.actions.find(a=>primaryActions.includes(a));return <Button type={next?'primary':'default'} ghost={!!next} onClick={()=>open(b.id)}>{next?actionLabels[next]:'查看详情'}</Button>;}}
          ]} />}
    </div>
    {id && !create && <BookingDetail key={id} id={id} onClose={close} />}
    {create && <BookingForm seed={create} onClose={()=>setCreate(undefined)} onSaved={b=>{setCreate(undefined);scope.setScope({storeId:b.storeId,date:b.scheduledAt.slice(0,10)});open(b.id);}} />}
  </PageContainer>;
}
