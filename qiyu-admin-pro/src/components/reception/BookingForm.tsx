import { Alert, App, Button, Checkbox, DatePicker, Descriptions, Divider, Drawer, Form, Input, Select, Space, Spin, Typography } from 'antd';
import dayjs, { type Dayjs } from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { receptionApi, type Availability, type Placement, type ReceptionBooking, type ReceptionCustomer } from '@/services/reception-service';
import { useReception } from './ReceptionContext';
import { actionLabels, errorText, money } from '@/constants/reception';
import { canAccessStore, readAdminSession } from '@/services/admin-auth';

interface Values { storeId: string; mobile: string; customerName: string; serviceId: string; therapistId: string; roomId: string; scheduledAt: Dayjs; depositConfirmed: boolean }
export interface BookingSeed { therapistId?: string; roomId?: string; startTime?: string; customerName?: string; mobile?: string }
export default function BookingForm({ booking, mode = 'create', seed, onClose, onSaved }: {
  booking?: ReceptionBooking; mode?: string; seed?: BookingSeed; onClose: () => void; onSaved: (booking: ReceptionBooking) => void;
}) {
  const scope = useReception(); const [form] = Form.useForm<Values>();
  const { modal } = App.useApp();
  const [busy, setBusy] = useState(false); const locked = useRef(false);
  const [dirty, setDirty] = useState(false); const [error, setError] = useState<string>();
  const [customer, setCustomer] = useState<ReceptionCustomer | null>(); const [lookupBusy, setLookupBusy] = useState(false);
  const [availability, setAvailability] = useState<Availability>(); const [checking, setChecking] = useState(false);
  const [review, setReview] = useState(false);
  const requestId = useRef(crypto.randomUUID());
  const values = Form.useWatch([], form) as Partial<Values> | undefined;
  const storeId = values?.storeId || booking?.storeId || scope.storeId;
  const selectedService = scope.options.services.find(option => option.value === values?.serviceId);
  const selectedTherapist = scope.options.therapists.find(option => option.value === values?.therapistId);
  const placement = (v: Values): Placement => ({ storeId: v.storeId, serviceId: v.serviceId, therapistId: v.therapistId, roomId: v.roomId, date: v.scheduledAt.format('YYYY-MM-DD'), startTime: v.scheduledAt.format('HH:mm'), bookingId: booking?.id });
  useEffect(() => {
    form.setFieldsValue(booking ? { storeId: booking.storeId, mobile: booking.phone, customerName: booking.customerName, serviceId: booking.serviceId, therapistId: booking.therapistId, roomId: booking.roomId, scheduledAt: dayjs(booking.scheduledAt) } :
      { storeId: scope.storeId, scheduledAt: dayjs(scope.date + 'T' + (seed?.startTime || '10:00')), therapistId: seed?.therapistId, roomId: seed?.roomId, customerName:seed?.customerName,mobile:seed?.mobile });
  }, []);
  useEffect(() => {
    if (booking || !values?.mobile || !storeId) return;
    const mobile = values.mobile.replace(/[\s-]/g,'').replace(/^\+86/,'');
    if (!/^1[3-9]\d{9}$/.test(mobile)) { setCustomer(undefined); return; }
    let active = true;
    const timer = window.setTimeout(() => {
      setLookupBusy(true);
      receptionApi.lookupCustomer(storeId, mobile).then(result => {
        if (!active) return; setCustomer(result);
        if (result) form.setFieldValue('customerName',result.name);
      }).catch(reason => active && setError(errorText(reason))).finally(() => active && setLookupBusy(false));
    },400);
    return () => { active=false; clearTimeout(timer); };
  }, [values?.mobile, storeId]);
  useEffect(() => {
    setAvailability(undefined);
    if (!values?.storeId || !values.serviceId || !values.therapistId || !values.roomId || !values.scheduledAt) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setChecking(true);
      receptionApi.availability(placement(values as Values)).then(result => active && setAvailability(result))
        .catch(reason => active && setAvailability({available:false,message:errorText(reason)})).finally(() => active && setChecking(false));
    },350);
    return () => { active=false; clearTimeout(timer); };
  }, [values?.storeId, values?.serviceId, values?.therapistId, values?.roomId, values?.scheduledAt?.valueOf()]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue=''; } };
    window.addEventListener('beforeunload',warn); return () => window.removeEventListener('beforeunload',warn);
  }, [dirty]);
  const close = () => {
    if (busy) return;
    if (dirty) modal.confirm({ title:'放弃尚未保存的修改？', content:'当前表单内容尚未提交。', okText:'放弃修改', cancelText:'继续填写', onOk:onClose });
    else onClose();
  };
  const submit = async () => {
    if (locked.current) return;
    const v = await form.validateFields().catch(() => undefined); if (!v) return;
    locked.current=true; setBusy(true); setError(undefined);
    try {
      const check = await receptionApi.availability(placement(v)); setAvailability(check);
      if (!check.available) throw new Error(check.message);
      if (!review) { setReview(true); return; }
      let result: ReceptionBooking;
      if (booking) {
        const data = mode==='reschedule' ? {date:v.scheduledAt.format('YYYY-MM-DD'),startTime:v.scheduledAt.format('HH:mm')} :
          mode==='therapist' ? {therapistId:v.therapistId} : {roomId:v.roomId};
        result = await receptionApi.change(booking,data);
      } else {
        const mobile = v.mobile.replace(/[\s-]/g,'').replace(/^\+86/,'');
        const existing = await receptionApi.lookupCustomer(v.storeId,mobile);
        const resolved = existing || await receptionApi.createCustomer(v.storeId,mobile,v.customerName);
        setCustomer(resolved);
        result = await receptionApi.create({...placement(v),mobile,customerName:resolved.name || v.customerName,requestId:requestId.current});
      }
      setDirty(false); scope.refresh(); onSaved(result);
    } catch(reason) { setError(errorText(reason)); setReview(false); }
    finally { locked.current=false; setBusy(false); }
  };
  const price = Number(selectedService?.price || 0) + Number(selectedTherapist?.price || 0);
  return <Drawer title={booking ? actionLabels[mode] : '新建预约'} width={760} open onClose={close} maskClosable={false} destroyOnHidden
    footer={<div className="drawer-actions"><Button onClick={close} disabled={busy}>取消</Button><Space>{review && <Button onClick={() => setReview(false)}>返回修改</Button>}<Button type="primary" loading={busy} onClick={submit}>{review ? (booking ? '确认修改' : '确认创建预约') : '核对预约信息'}</Button></Space></div>}>
    {error && <Alert type="error" showIcon message="未能保存" description={error} className="section-gap" />}
    {review ? <><Alert type="info" showIcon message="请与客户核对以下安排" className="section-gap" /><Descriptions bordered column={1} items={[
      {key:'customer',label:'客户',children:form.getFieldValue('customerName')},
      {key:'store',label:'门店',children:scope.options.stores.find(s=>s.value===storeId)?.label},
      {key:'service',label:'项目',children:selectedService?.label},
      {key:'time',label:'时间',children:<>{booking && mode==='reschedule' && <Typography.Text delete>{booking.scheduledAt} → </Typography.Text>}{values?.scheduledAt?.format('YYYY-MM-DD HH:mm')} · {selectedService?.durationMinutes} 分钟</>},
      {key:'therapist',label:'技师',children:<>{booking && mode==='therapist' && <Typography.Text delete>{booking.therapist} → </Typography.Text>}{selectedTherapist?.label}</>},
      {key:'room',label:'房间',children:<>{booking && mode==='room' && <Typography.Text delete>{booking.room} → </Typography.Text>}{scope.options.rooms.find(r=>r.value===values?.roomId)?.label}</>},
      {key:'money',label:booking?'订单金额':'参考价格',children:money(booking?.amount ?? price)}
    ]} />{!booking && <Alert className="section-gap" type="warning" showIcon message="创建后将记为已预约，并按现有规则登记订金已收；请确认已收到订金。" />}</> : <Form form={form} layout="vertical" disabled={busy} onValuesChange={changed => {
      setDirty(true); setReview(false); setError(undefined);
      if ('storeId' in changed) form.setFieldsValue({serviceId:undefined,therapistId:undefined,roomId:undefined});
      if ('serviceId' in changed) form.setFieldsValue({therapistId:undefined,roomId:undefined});
      if ('mobile' in changed) {setCustomer(undefined); form.setFieldValue('customerName','');}
    }}>
      <Typography.Title level={5}>客户信息</Typography.Title>
      <div className="form-grid">
        <Form.Item name="mobile" label="手机号" rules={[{required:true,message:'请输入手机号'}, ...(!booking ? [{validator:(_:unknown,v:string) => /^1[3-9]\d{9}$/.test((v||'').replace(/[\s-]/g,'').replace(/^\+86/,'')) ? Promise.resolve():Promise.reject(new Error('请输入有效的 11 位手机号'))}]:[])]}>
          <Input disabled={!!booking} inputMode="tel" autoComplete="off" placeholder="手机号查找客户" suffix={lookupBusy?<Spin size="small" />:null} />
        </Form.Item>
        <Form.Item name="customerName" label="客户姓名" rules={[{required:true,whitespace:true,message:'请输入客户姓名'},{max:64,message:'姓名最多 64 字'}]}><Input disabled={!!booking || !!customer} placeholder="请输入客户姓名" /></Form.Item>
      </div>
      {!booking && customer === null && <Alert type="info" showIcon message="新客户：确认预约时将同时建立客户档案。" />}
      {!booking && customer && <Alert type="success" showIcon message={'已找到客户：' + customer.name} />}
      <Divider /><Typography.Title level={5}>项目与资源</Typography.Title>
      <div className="form-grid">
        <Form.Item name="storeId" label="门店" rules={[{required:true}]}><Select disabled={!!booking} options={scope.options.stores.filter(s=>canAccessStore(readAdminSession(),'booking','CREATE',s.value) || s.value===booking?.storeId)} /></Form.Item>
        <Form.Item name="serviceId" label="服务项目" rules={[{required:true,message:'请选择服务项目'}]}><Select disabled={!!booking} showSearch optionFilterProp="label" options={scope.options.services} placeholder="选择服务项目" /></Form.Item>
        <Form.Item name="therapistId" label="服务技师" rules={[{required:true,message:'请选择技师'}]}><Select disabled={!!booking && mode!=='therapist'} showSearch optionFilterProp="label" options={scope.options.therapists.filter(t=>t.storeId===storeId)} placeholder="选择本店技师" /></Form.Item>
        <Form.Item name="roomId" label="服务房间" rules={[{required:true,message:'请选择房间'}]}><Select disabled={!!booking && mode!=='room'} options={scope.options.rooms.filter(r=>r.storeId===storeId)} placeholder="选择本店房间" /></Form.Item>
      </div>
      <Typography.Text type="secondary">{selectedService ? selectedService.durationMinutes + ' 分钟 · 参考价格 ' + money(price) : '选择项目后显示时长与价格'}</Typography.Text>
      <Divider /><Typography.Title level={5}>预约时间</Typography.Title>
      <Form.Item name="scheduledAt" label="服务开始时间" rules={[{required:true,message:'请选择预约时间'}]}>
        <DatePicker disabled={!!booking && mode!=='reschedule'} showTime={{format:'HH:mm'}} format="YYYY-MM-DD HH:mm" style={{width:'100%'}} allowClear={false} />
      </Form.Item>
      {checking ? <Spin size="small" /> : availability && <Alert type={availability.available?'success':'warning'} showIcon message={availability.message} description={availability.occupiedStartAt ? '资源占用：' + dayjs(availability.occupiedStartAt).format('HH:mm') + '–' + dayjs(availability.occupiedEndAt).format('HH:mm') + '（含准备和清洁）' : '请调整时间、技师或房间后重试。'} />}
      {!booking && <Form.Item className="section-gap" name="depositConfirmed" valuePropName="checked" rules={[{validator:(_:unknown,v:boolean)=>v?Promise.resolve():Promise.reject(new Error('请确认已收取订金'))}]}><Checkbox>已收取订金，确认按现有规则登记预约</Checkbox></Form.Item>}
    </Form>}
  </Drawer>;
}
