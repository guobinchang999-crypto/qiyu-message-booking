import { Button, Empty, Segmented, Space, Typography } from 'antd';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { ReceptionBooking } from '@/services/reception-service';
import { useReception } from './ReceptionContext';
import type { BookingSeed } from './BookingForm';
import { statusLabels } from '@/constants/reception';

export default function DaySchedule({ rows, onOpen, onCreate, canCreate, roomContext }: { rows: ReceptionBooking[]; onOpen: (id:string)=>void; onCreate: (seed:BookingSeed)=>void; canCreate:boolean;roomContext?:{storeId:string;date:string;rooms:Array<{value:string;label:string;storeId:string}>} }) {
  const reception=useReception(); const scope=roomContext?{...reception,...roomContext,options:{...reception.options,rooms:roomContext.rooms}}:reception;
  const [dimension,setDimension]=useState(roomContext?'room':'therapist');
  const resources=(dimension==='therapist'?scope.options.therapists:scope.options.rooms).filter(r=>r.storeId===scope.storeId);
  const startMinute=9*60; const endMinute=22*60; const timelineWidth=(endMinute-startMinute)*2;
  const times=Array.from({length:(endMinute-startMinute)/30},(_,i)=>{const value=startMinute+i*30;return String(Math.floor(value/60)).padStart(2,'0')+':'+(value%60?'30':'00');});
  const minutes=(value:string)=>dayjs(value).diff(dayjs(scope.date).startOf('day'),'minute');
  return <><div className="schedule-heading"><Space><Typography.Text strong>当日资源排期</Typography.Text><Typography.Text type="secondary">{canCreate?'点击预约查看详情，点击空白时段添加预约':'点击预约查看详情'}</Typography.Text></Space>{!roomContext&&<Segmented aria-label="排期维度" value={dimension} onChange={value=>setDimension(String(value))} options={[{label:'按技师',value:'therapist'},{label:'按房间',value:'room'}]} />}</div>
    {!resources.length ? <Empty description="当前门店暂无可排期资源" /> : <div className="day-schedule" role="region" aria-label="可横向滚动的 09:00 至 22:00 当日排期">
      <div className="schedule-axis" style={{width:140+timelineWidth}}><div className="resource-name">时间 / 资源</div><div className="schedule-hours" style={{width:timelineWidth}}>{times.filter((_,i)=>i%2===0).map(t=><span key={t}>{t}</span>)}</div></div>
      {resources.map(resource=><div className="resource-row" key={resource.value} style={{width:140+timelineWidth}}>
        <div className="resource-name">{resource.label}</div><div className="resource-track" style={{width:timelineWidth}}>
          {times.map(time=><button type="button" key={time} className="schedule-slot" disabled={!canCreate} aria-label={resource.label+' '+time+' 新建预约'} onClick={()=>onCreate({startTime:time,...(dimension==='therapist'?{therapistId:resource.value}:{roomId:resource.value})})} />)}
          {rows.filter(b=>b.status!=='CANCELLED' && (dimension==='therapist'?b.therapistId:b.roomId)===resource.value).map(b=>{
            const rawLeft=minutes(b.occupiedStartAt)-startMinute; const rawRight=minutes(b.occupiedEndAt)-startMinute;
            if (rawRight<=0 || rawLeft>=endMinute-startMinute) return null;
            const left=Math.max(0,rawLeft); const right=Math.min(endMinute-startMinute,rawRight);
            return <Button key={b.id} className={'schedule-booking status-'+b.status} style={{left:left*2,width:Math.max(60,(right-left)*2)}} onClick={()=>onOpen(b.id)}>
              <strong>{b.scheduledAt.slice(11)}–{b.endTime} · {b.customerName}</strong><span>{b.service}</span><small>{statusLabels[b.status]} · 含准备 / 清洁</small>
            </Button>;
          })}
        </div>
      </div>)}
    </div>}
  </>;
}
