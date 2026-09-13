import { Alert, App, Button, DatePicker, Drawer, Empty, Select, Space, Statistic, Table, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { adminRequest } from '@/services/http';
import { queryString, type ManagementPage } from '@/services/management-service';
import { useManagementState, useStoreOptions } from './useManagement';
import { can, readAdminSession } from '@/services/admin-auth';
import { money } from '@/constants/reception';
import BookingDetail from '@/components/reception/BookingDetail';
import { receptionApi, type ReceptionBooking } from '@/services/reception-service';
interface Metric {id:string;name:string;bookingCount:number;completedCount:number;revenue:number;completionRate:number;averageTicket:number}
interface Analytics {summary:Metric;trend:Metric[];stores:ManagementPage<Metric>;updatedAt:string;definition:string}
const titles={bookingCount:'预约数',completedCount:'完成数',completionRate:'完成率',revenue:'已完成订单金额',averageTicket:'平均完成订单金额'};
export default function AnalyticsPage({dashboard=false}:{dashboard?:boolean}) {
  const session=readAdminSession();const {message}=App.useApp();const {params,set}=useManagementState();
  const stores=useStoreOptions(dashboard?'dashboard':'report');
  const cacheKey='qiyu-analysis-'+session?.principal.userId;
  const cached=()=>{try{return JSON.parse(sessionStorage.getItem(cacheKey)||'{}');}catch{return {};}};
  const startDate=params.get('startDate')||cached().startDate||dayjs().startOf('month').format('YYYY-MM-DD');
  const endDate=params.get('endDate')||cached().endDate||dayjs().format('YYYY-MM-DD');
  const storeId=(params.has('storeId')?params.get('storeId'):cached().storeId)||undefined;const page=Number(params.get('page')||1);
  const query={startDate,endDate,storeId,pageNum:page,pageSize:20,sort:params.get('sort')||'revenue',order:params.get('order')||'descend',dashboard};
  const key=queryString(query);const [data,setData]=useState<Analytics>();const [loading,setLoading]=useState(false);const [error,setError]=useState<string>();const [revision,setRevision]=useState(0);
  const [resultKey,setResultKey]=useState<string>();
  const currentResult=resultKey===key;
  const [drill,setDrill]=useState<{storeId?:string;status?:string;startDate:string;endDate:string}>();const [selectedDate,setSelectedDate]=useState<string>();
  useEffect(()=>{if(session?.role!=='HQ_ADMIN'&&!storeId&&stores.options.length)set({storeId:stores.options[0].value});},[stores.options]);
  useEffect(()=>{sessionStorage.setItem(cacheKey,JSON.stringify({startDate,endDate,storeId}));},[cacheKey,startDate,endDate,storeId]);
  useEffect(()=>{let active=true;setLoading(true);setError(undefined);adminRequest<Analytics>('/admin/management/analytics?'+key)
    .then(v=>{if(active){setData(v);setResultKey(key);setSelectedDate(undefined);}}).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false;};},[key,revision]);
  const exportRows=async()=>{
    try {
      const result=await adminRequest<{csv:string}>('/admin/management/analytics/export?'+key);
      const url=URL.createObjectURL(new Blob(['\uFEFF'+result.csv],{type:'text/csv;charset=utf-8;'}));
      const anchor=document.createElement('a');anchor.href=url;anchor.download='经营报表-'+startDate+'-'+endDate+'.csv';anchor.click();URL.revokeObjectURL(url);
    }catch(e){message.error(e instanceof Error?e.message:'导出失败');}
  };
  const amount=(key:string,value:number)=>key==='completionRate'?value+'%':key==='revenue'||key==='averageTicket'?money(value):value;
  const max=Math.max(1,...(data?.trend.map(v=>v.revenue)||[]));
  return <PageContainer title={dashboard?'经营概览':'经营报表'} subTitle="按预约日期查看经营结果，点击指标追溯预约明细。">
    <div className="reception-panel section-gap"><Space wrap>
      <Select aria-label="经营门店" allowClear placeholder="全部授权门店" style={{width:210}} value={storeId} options={stores.options} onChange={v=>{sessionStorage.setItem(cacheKey,JSON.stringify({startDate,endDate,storeId:v}));set({storeId:v,page:1});}} />
      <DatePicker.RangePicker allowClear={false} aria-label="经营日期范围" value={[dayjs(startDate),dayjs(endDate)]} onChange={v=>v&&set({startDate:v[0]!.format('YYYY-MM-DD'),endDate:v[1]!.format('YYYY-MM-DD'),page:1})}
        presets={[{label:'今天',value:[dayjs(),dayjs()]},{label:'昨天',value:[dayjs().subtract(1,'day'),dayjs().subtract(1,'day')]},{label:'近七天',value:[dayjs().subtract(6,'day'),dayjs()]},{label:'本月',value:[dayjs().startOf('month'),dayjs()]}]} />
      <Button loading={loading} onClick={()=>setRevision(v=>v+1)}>刷新</Button>
      {can(session,'report:export')&&can(session,'report:read')&&<Button onClick={exportRows}>导出当前条件</Button>}
      {data&&<Typography.Text type="secondary">更新于 {dayjs(data.updatedAt).format('MM-DD HH:mm:ss')}</Typography.Text>}
    </Space></div>
    {(error||stores.error)&&<Alert type="error" showIcon message={data?'刷新失败，以下保留上次结果':'加载失败'} description={error||stores.error} action={<Button onClick={()=>{setRevision(v=>v+1);stores.retry();}}>重试</Button>} />}
    {data&&<>
      <Alert type="info" showIcon message="统计口径" description={data.definition} className="section-gap" />
      <div className="management-metrics">{Object.entries(titles).map(([key,label])=><div className="reception-panel" key={key}>
        <Statistic title={label} value={amount(key,data.summary[key as keyof typeof titles])} />
        {can(session,'booking:read')&&<Button type="link" disabled={!currentResult} onClick={()=>setDrill({startDate,endDate,storeId,status:key==='bookingCount'?undefined:'COMPLETED'})}>查看相关预约</Button>}
      </div>)}</div>
      {dashboard&&<div className="reception-panel section-gap"><Typography.Title level={5}>已完成订单金额趋势（元）</Typography.Title>
        {data.trend.length?<><div className="management-trend" role="region" aria-label="按日期查看订单金额">
          {data.trend.map(point=><button key={point.id} type="button" className="management-trend-point" title={point.name+' · '+money(point.revenue)} onFocus={()=>setSelectedDate(point.id)} onClick={()=>setSelectedDate(point.id)} aria-label={point.name+' '+money(point.revenue)}>
            <span className="management-trend-bar" style={{height:Math.max(2,point.revenue/max*140)}} /><span>{point.name.slice(5)}</span>
          </button>)}</div><Typography.Paragraph>{selectedDate?selectedDate+' · '+money(data.trend.find(v=>v.id===selectedDate)?.revenue):'点击日期查看准确金额'}</Typography.Paragraph></>:<Empty description="暂无经营数据" />}
      </div>}
      <div className="reception-panel section-gap"><Typography.Title level={5}>{dashboard?'门店经营排名':'门店经营明细'}</Typography.Title>
        <Table<Metric> rowKey="id" loading={loading} dataSource={data.stores.list} scroll={{x:1000}}
          pagination={{current:page,pageSize:20,total:data.stores.total,showSizeChanger:false}}
          onChange={(pagination,__,sorter,extra)=>{if(extra.action==='paginate')set({page:pagination.current||1});else if(extra.action==='sort'&&!Array.isArray(sorter))set({sort:String(sorter.field||'revenue'),order:sorter.order||'descend',page:1});}}
          columns={[{title:'门店',dataIndex:'name',render:(_,row)=>can(session,'booking:read')?<Button type="link" disabled={!currentResult} onClick={()=>setDrill({startDate,endDate,storeId:row.id})}>{row.name}</Button>:row.name},
            ...Object.entries(titles).map(([key,label])=>({title:label,dataIndex:key,sorter:true,render:(value:number)=>amount(key,value)}))]} />
      </div>
    </>}
    {drill&&<AnalyticsBookings {...drill} onClose={()=>setDrill(undefined)} />}
  </PageContainer>;
}
function AnalyticsBookings({startDate,endDate,storeId,status,onClose}:{startDate:string;endDate:string;storeId?:string;status?:string;onClose:()=>void}) {
  const [page,setPage]=useState(1);const [rows,setRows]=useState<ReceptionBooking[]>([]);const [total,setTotal]=useState(0);const [selected,setSelected]=useState<string>();const [error,setError]=useState<string>();const [retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setError(undefined);receptionApi.list({startDate,endDate,storeId,status,pageNum:page,pageSize:10}).then(v=>{if(active){setRows(v.list);setTotal(v.total);}}).catch(e=>active&&setError(e.message));return()=>{active=false;};},[startDate,endDate,storeId,status,page,retry]);
  return <><Drawer open title={'预约明细 · '+startDate+' 至 '+endDate} width={850} onClose={onClose}>
    {error&&<Alert type="error" message={error} action={<Button onClick={()=>setRetry(v=>v+1)}>重试</Button>} />}
    <Table rowKey="id" dataSource={rows} pagination={{current:page,pageSize:10,total,onChange:setPage}} columns={[{title:'客户',dataIndex:'customerName'},{title:'时间',dataIndex:'scheduledAt'},{title:'项目',dataIndex:'service'},{title:'状态',dataIndex:'statusLabel'},{title:'操作',render:(_,b)=><Button onClick={()=>setSelected(b.id)}>查看详情</Button>}]} />
  </Drawer>{selected&&<BookingDetail id={selected} onClose={()=>setSelected(undefined)} />}</>;
}
