import { Alert, App, Button, Descriptions, Empty, Input, Space, Table, Typography } from 'antd';
import type { InputRef } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import { ScanOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { receptionApi, type ReceptionBooking } from '@/services/reception-service';
import { useReception } from '@/components/reception/ReceptionContext';
import ReceptionToolbar from '@/components/reception/ReceptionToolbar';
import BookingDetail from '@/components/reception/BookingDetail';
import BookingForm from '@/components/reception/BookingForm';
import { errorText, statusLabels } from '@/constants/reception';

export default function CheckinPage() {
  const { message } = App.useApp();
  const scope=useReception(); const [code,setCode]=useState(''); const [keyword,setKeyword]=useState('');
  const [record,setRecord]=useState<ReceptionBooking>(); const [foundCode,setFoundCode]=useState('');
  const [rows,setRows]=useState<ReceptionBooking[]>([]); const [error,setError]=useState<string>();
  const [busy,setBusy]=useState(false); const lock=useRef(false); const input=useRef<InputRef>(null);
  const [detail,setDetail]=useState<string>(); const [create,setCreate]=useState(false);
  const [success,setSuccess]=useState(false);
  useEffect(()=>{setRecord(undefined);setFoundCode('');setCode('');setSuccess(false);setError(undefined);},[scope.storeId]);
  useEffect(()=>{
    if (!scope.storeId || !keyword) {setRows([]); return;}
    let active=true;
    receptionApi.all({storeId:scope.storeId,keyword}).then(result=>active && setRows(result)).catch(e=>active && setError(errorText(e)));
    return ()=>{active=false;};
  },[keyword,scope.storeId,scope.revision]);
  const resolve=async()=>{
    if (!scope.storeId || !code.trim() || lock.current) return;
    lock.current=true;setBusy(true);setError(undefined);setSuccess(false);setRecord(undefined);
    try {const result=await receptionApi.resolve(scope.storeId,code.trim());setRecord(result);setFoundCode(code.trim());}
    catch(e){setError(errorText(e));}
    finally{lock.current=false;setBusy(false);}
  };
  const confirm=async()=>{
    if (!record || !scope.storeId || lock.current) return;
    lock.current=true;setBusy(true);setError(undefined);
    try {setRecord(await receptionApi.confirm(record,scope.storeId,foundCode));setSuccess(true);scope.refresh();message.success('客户已到店');}
    catch(e){setError(errorText(e));}
    finally{lock.current=false;setBusy(false);}
  };
  const next=()=>{setRecord(undefined);setCode('');setFoundCode('');setSuccess(false);setError(undefined);input.current?.focus();};
  return <PageContainer title="到店核销" subTitle="核对预约后确认到店，继续安排服务。">
    <ReceptionToolbar hideCheckin onCreate={()=>setCreate(true)} />
    <div className="checkin-layout">
      <section className="reception-panel checkin-entry">
        <ScanOutlined className="checkin-icon" /><Typography.Title level={3}>输入客户核销码</Typography.Title>
        <Typography.Paragraph type="secondary">支持手动输入或扫码枪输入，按回车查询。</Typography.Paragraph>
        <Input.Search ref={input} aria-label="客户核销码" size="large" autoFocus autoComplete="off" value={code} placeholder="输入客户出示的核销码" enterButton="查询预约" loading={busy} disabled={!scope.storeId} onChange={e=>{setCode(e.target.value);setRecord(undefined);setSuccess(false);}} onSearch={resolve} />
        {(scope.error || error) && <Alert className="section-gap" type="error" showIcon message={scope.error||error} />}
        <div className="checkin-help"><Typography.Text strong>没有核销码？</Typography.Text><Typography.Paragraph type="secondary">可通过客户姓名、手机号或预约编号查找，在详情中核对后确认到店。</Typography.Paragraph><Input.Search aria-label="辅助查找预约" allowClear placeholder="姓名、手机号、预约编号" onSearch={setKeyword} /></div>
        {keyword && <Table rowKey="id" dataSource={rows} size="small" pagination={{pageSize:5}} columns={[{title:'客户',dataIndex:'customerName'},{title:'时间',dataIndex:'scheduledAt'},{title:'操作',render:(_,b)=><Button onClick={()=>setDetail(b.id)}>核对详情</Button>}]} />}
      </section>
      <section className="reception-panel">
        {!record ? <Empty description="查询后在这里核对客户与服务信息" /> : <>
          <Alert showIcon type={success?'success':record.status==='BOOKED'?'info':'warning'} message={success?'到店确认成功':record.status==='BOOKED'?'请核对以下预约':'当前状态：'+statusLabels[record.status]} description={record.status!=='BOOKED' && !success?'该预约不能重复核销，请查看详情继续处理。':undefined} />
          <Typography.Title level={3}>{record.customerName}</Typography.Title>
          <Descriptions column={1} bordered items={[
            {key:'phone',label:'手机号',children:record.phone},{key:'store',label:'预约门店',children:record.store},
            {key:'time',label:'时间',children:record.scheduledAt+'–'+record.endTime},
            {key:'service',label:'项目',children:record.service},{key:'resource',label:'安排',children:record.therapist+' · '+record.room}
          ]} />
          <Space wrap className="section-gap">
            {record.status==='BOOKED' && <Button size="large" type="primary" loading={busy} onClick={confirm}>确认客户到店</Button>}
            {success && <Button type="primary" size="large" onClick={next}>接待下一位</Button>}
            <Button size="large" onClick={()=>setDetail(record.id)}>{success?'继续安排服务':'查看详情'}</Button>
          </Space>
        </>}
      </section>
    </div>
    {detail && <BookingDetail id={detail} onClose={()=>setDetail(undefined)} />}
    {create && <BookingForm onClose={()=>setCreate(false)} onSaved={b=>{setCreate(false);setDetail(b.id);}} />}
  </PageContainer>;
}
