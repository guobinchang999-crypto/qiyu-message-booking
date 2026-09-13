import { Alert, App, Button, Descriptions, Divider, Drawer, Dropdown, Empty, Space, Spin, Timeline, Typography } from 'antd';
import { MoreOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { receptionApi, type BookingHistory, type ReceptionBooking } from '@/services/reception-service';
import BookingStatusTag from '@/components/BookingStatusTag';
import BookingForm from './BookingForm';
import { useReception } from './ReceptionContext';
import { actionLabels, errorText, money, primaryActions, statusLabels } from '@/constants/reception';
import dayjs from 'dayjs';

const auditDescription = (raw: string) => {
  try {
    const value = JSON.parse(raw || '{}') as Record<string,unknown>;
    const labels: Record<string,string> = {status:'状态',scheduledAt:'预约时间',therapistId:'技师',roomId:'房间'};
    return Object.entries(value).filter(([key])=>key in labels).map(([key,v])=>labels[key] + '：' + (statusLabels[v as keyof typeof statusLabels] || String(v))).join('，');
  } catch { return ''; }
};
export default function BookingDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const scope=useReception();
  const { message, modal } = App.useApp();
  const [booking,setBooking]=useState<ReceptionBooking>(); const [loading,setLoading]=useState(true);
  const [error,setError]=useState<string>(); const [auditError,setAuditError]=useState<string>();
  const [logs,setLogs]=useState<BookingHistory[]>([]); const [attempt,setAttempt]=useState(0);
  const [busy,setBusy]=useState(false); const lock=useRef(false); const [editing,setEditing]=useState<string>();
  useEffect(()=>{
    let active=true; setLoading(true); setError(undefined);
    receptionApi.detail(id).then(b=>active && setBooking(b)).catch(e=>active && setError(errorText(e))).finally(()=>active && setLoading(false));
    setAuditError(undefined);
    receptionApi.history(id).then(rows=>active && setLogs(rows)).catch(e=>active && setAuditError(errorText(e)));
    return ()=>{active=false;};
  },[id,scope.revision,attempt]);
  const run = async (action:string) => {
    if (!booking || lock.current) return;
    lock.current=true; setBusy(true); setError(undefined);
    try { setBooking(await receptionApi.action(booking,action)); scope.refresh(); message.success(actionLabels[action] + '成功'); }
    catch(e) { setError(errorText(e)); }
    finally { lock.current=false; setBusy(false); }
  };
  const choose = (action:string) => {
    if (['reschedule','therapist','room'].includes(action)) {setEditing(action); return;}
    if (!booking) return;
    modal.confirm({title:actionLabels[action] + '？', content:<Space direction="vertical"><span>{booking.customerName} · {booking.service}</span><span>{booking.store} · {booking.scheduledAt}</span>{action==='settle' && <span>订单金额 {money(booking.amount)} · 已付 {money(booking.paidAmount)}。请确认已完成门店收款。</span>}{action==='cancel' && <span>取消后将释放预约占用的技师和房间。</span>}</Space>,okText:actionLabels[action],cancelText:'返回',okButtonProps:{danger:action==='cancel'},onOk:()=>run(action)});
  };
  const primary=booking?.actions.find(action=>primaryActions.includes(action));
  const others=booking?.actions.filter(action=>action!==primary) || [];
  if (editing && booking) return <BookingForm booking={booking} mode={editing} onClose={()=>setEditing(undefined)} onSaved={b=>{setBooking(b);setEditing(undefined);}} />;
  return <Drawer open title="预约详情" width={720} onClose={()=>!busy && onClose()} maskClosable={!busy} destroyOnHidden
    extra={<Button aria-label="刷新预约" icon={<ReloadOutlined />} loading={loading} onClick={()=>setAttempt(v=>v+1)}>刷新</Button>}
    footer={<div className="drawer-actions"><Button onClick={onClose} disabled={busy}>返回列表</Button><Space>{others.length>0 && <Dropdown menu={{items:others.map(key=>({key,label:actionLabels[key],danger:key==='cancel',onClick:()=>choose(key)}))}} trigger={['click']}><Button icon={<MoreOutlined />} disabled={busy}>更多操作</Button></Dropdown>}{primary && <Button type="primary" loading={busy} disabled={loading} onClick={()=>choose(primary)}>{actionLabels[primary]}</Button>}</Space></div>}>
    {error && <Alert type="error" showIcon message="操作未完成" description={error} action={<Button onClick={()=>setAttempt(v=>v+1)}>刷新状态</Button>} className="section-gap" />}
    {!booking ? (loading?<Spin />:<Empty description="无法读取预约" />) : <>
      <div className="booking-summary"><div><Typography.Text type="secondary">{booking.id}</Typography.Text><Typography.Title level={3}>{booking.customerName}</Typography.Title><span>{booking.phone}</span></div><BookingStatusTag status={booking.status} label={booking.statusLabel} /></div>
      {!primary && <Alert type="info" showIcon message={['COMPLETED','CANCELLED'].includes(booking.status)?'本次预约已结束，可查看完整服务信息。':'当前没有可执行的下一步操作，请等待支付或由有权限的人员处理。'} className="section-gap" />}
      <Descriptions column={{xs:1,sm:2}} bordered items={[
        {key:'store',label:'预约门店',children:booking.store},
        {key:'service',label:'服务项目',children:booking.service},
        {key:'date',label:'预约时间',children:booking.scheduledAt+'–'+booking.endTime,span:2},
        {key:'therapist',label:'技师',children:booking.therapist},
        {key:'room',label:'房间',children:booking.room},
        {key:'duration',label:'服务时长',children:booking.durationMinutes+' 分钟'},
        {key:'occupied',label:'资源占用',children:dayjs(booking.occupiedStartAt).format('HH:mm')+'–'+dayjs(booking.occupiedEndAt).format('HH:mm')},
        {key:'amount',label:'订单金额',children:money(booking.amount)},
        {key:'paid',label:'实付金额',children:money(booking.paidAmount)}
      ]} />
      <Typography.Paragraph type="secondary" className="section-gap">资源占用包含准备与清洁时间。</Typography.Paragraph>
      <Divider orientation="left">操作记录</Divider>
      {auditError ? <Alert type="warning" message="操作记录加载失败" description={auditError} action={<Button onClick={()=>setAttempt(v=>v+1)}>重试</Button>} /> :
        logs.length ? <Timeline items={logs.map(log=>({key:log.id,children:<><Typography.Text strong>{actionLabels[log.action.replace('booking:','')] || (log.action==='booking:update'?'调整预约':log.action==='booking:create'?'创建预约':log.action==='booking:checkin'?'确认到店':log.action)}</Typography.Text><div>{log.operator} · {log.createdAt}</div><Typography.Text type="secondary">{auditDescription(log.beforeData)}{auditDescription(log.beforeData)?' → ':''}{auditDescription(log.afterData)}</Typography.Text></>}))} /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无操作记录" />}
    </>}
  </Drawer>;
}
