import { Alert, Card, Col, Popover, Row, Segmented, Space, Spin, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin-service';
import type { RoomStatus, ScheduleRow } from '@/types';

const roomStatus: Record<RoomStatus, { text: string; color: string }> = { FREE: { text: '空闲', color: 'green' }, BOOKED: { text: '已预约', color: 'blue' }, IN_USE: { text: '使用中', color: 'processing' }, CLEANING: { text: '清洁中', color: 'orange' } };
const cellClass: Record<ScheduleRow['slots'][number]['kind'], string> = { WORK: '', BOOKED: 'qiyu-calendar-cell--booked', LEAVE: 'qiyu-calendar-cell--leave', REST: '' };

export default function ResourcesPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof adminApi.getResources>>>();
  const [store, setStore] = useState('静安寺店');
  useEffect(() => { adminApi.getResources().then(setData); }, []);
  if (!data) return <Spin size="large" style={{ display: 'grid', placeItems: 'center', minHeight: 420 }} />;
  const headers = data.schedules[0].slots.map((slot) => slot.day);
  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">排班与资源管理</h1><div className="qiyu-page-description">查看技师排班、预约占用和房间当前状态，提前处理服务冲突。</div></div><Segmented value={store} options={['静安寺店', '徐家汇店', '陆家嘴店']} onChange={(value) => setStore(String(value))} /></div>
    <Alert type="warning" showIcon message={`${store} 存在 2 项资源提醒`} description="周语宁今日 15:00 后请假；芳疗房 01 处于清洁中，请在创建或修改预约时重新确认可用资源。" style={{ marginBottom: 16 }} />
    <Card className="qiyu-card" title="技师周排班" extra={<Space><Tag color="green">上班</Tag><Tag color="blue">已预约</Tag><Tag color="orange">请假</Tag><Tag>休息</Tag></Space>}>
      <div style={{ overflowX: 'auto' }}><table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '8px' }}><thead><tr><th style={{ textAlign: 'left', minWidth: 130 }}>技师 / 技能</th>{headers.map((header) => <th key={header} style={{ minWidth: 110, color: '#7c8780', fontWeight: 500 }}>{header}</th>)}</tr></thead><tbody>{data.schedules.map((row) => <tr key={row.therapist}><td><Typography.Text strong>{row.therapist}</Typography.Text><br /><Typography.Text type="secondary" style={{ fontSize: 12 }}>{row.skill}</Typography.Text></td>{row.slots.map((slot) => <td key={slot.day}><Popover title={`${row.therapist} · ${slot.day}`} content={slot.kind === 'BOOKED' ? '已占用时段：10:00–11:20、15:30–17:00、18:00–19:20' : slot.kind === 'LEAVE' ? '请假时间：15:00–20:00' : '可进行预约安排'}><div className={`qiyu-calendar-cell ${cellClass[slot.kind]}`}><Tag color={slot.kind === 'BOOKED' ? 'blue' : slot.kind === 'LEAVE' ? 'orange' : slot.kind === 'REST' ? 'default' : 'green'}>{slot.kind === 'BOOKED' ? '已预约' : slot.kind === 'LEAVE' ? '请假' : slot.kind === 'REST' ? '休息' : '上班'}</Tag><div style={{ marginTop: 6, fontSize: 12, color: '#68756d' }}>{slot.label}</div></div></Popover></td>)}</tr>)}</tbody></table></div>
    </Card>
    <Card className="qiyu-card" title="房间状态" style={{ marginTop: 16 }}><Row gutter={[14, 14]}>{data.rooms.map((room) => <Col xs={24} sm={12} lg={8} xl={6} key={room.id}><div className="qiyu-room-card"><div className="qiyu-room-card__title"><span>{room.name}</span><Tag color={roomStatus[room.status].color}>{roomStatus[room.status].text}</Tag></div><Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 10 }}>{room.type}</Typography.Paragraph>{room.customer ? <div style={{ fontSize: 13 }}>客户：{room.customer}<br />技师：{room.therapist}</div> : <Typography.Text type="secondary">当前可安排服务</Typography.Text>}<div style={{ borderTop: '1px solid #f0f2ef', marginTop: 13, paddingTop: 10, fontSize: 12, color: '#7c8780' }}>下一时段：{room.nextTime}</div></div></Col>)}</Row></Card>
  </div>;
}
