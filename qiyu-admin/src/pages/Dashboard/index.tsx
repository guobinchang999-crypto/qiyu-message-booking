import { Alert, Badge, Card, Col, List, Progress, Row, Space, Spin, Statistic, Table, Tag, Typography } from 'antd';
import { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin-service';
import type { DashboardData } from '@/services/remote';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>();
  useEffect(() => { adminApi.getDashboard().then(setData); }, []);
  if (!data) return <Spin size="large" style={{ display: 'grid', placeItems: 'center', minHeight: 420 }} />;
  const points = data.revenue.map((value, index) => `${index * 16.4 + 1},${202 - value * 1.8}`).join(' ');
  return <div className="qiyu-page">
    <div className="qiyu-page-header"><div><h1 className="qiyu-page-title">总部运营看板</h1><div className="qiyu-page-description">2026 年 8 月 4 日 · 全部门店实时经营概览</div></div><Tag color="green">数据每 5 分钟更新</Tag></div>
    <Row gutter={[16, 16]}>{data.statistics.map((item) => <Col xs={24} sm={12} xl={6} key={item.label}><Card className="qiyu-card qiyu-stat"><Statistic title={item.label} value={item.value} suffix={item.suffix} /><Typography.Text type="success" style={{ fontSize: 12 }}>较昨日 {item.change}</Typography.Text></Card></Col>)}</Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} xl={15}><Card className="qiyu-card" title="近 7 日营业额趋势" extra={<Typography.Text type="secondary">单位：百元</Typography.Text>}><div className="qiyu-line-chart"><svg viewBox="0 0 100 220" preserveAspectRatio="none"><line className="grid" x1="0" y1="45" x2="100" y2="45" /><line className="grid" x1="0" y1="110" x2="100" y2="110" /><line className="grid" x1="0" y1="175" x2="100" y2="175" /><polyline className="curve" points={points} /></svg></div></Card></Col>
      <Col xs={24} xl={9}><Card className="qiyu-card" title="门店经营排名"><Table pagination={false} size="small" rowKey="store" dataSource={data.ranking} columns={[{ title: '门店', dataIndex: 'store' }, { title: '营业额', dataIndex: 'revenue', render: (value) => `¥${value.toLocaleString()}` }, { title: '到店率', dataIndex: 'rate', render: (value) => <Progress percent={value} size="small" strokeColor="#5d806d" /> }]} /></Card></Col>
    </Row>
    <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
      <Col xs={24} xl={14}><Card className="qiyu-card" title="待处理事项"><List dataSource={data.alerts} renderItem={(item) => <List.Item><List.Item.Meta avatar={<Badge status={item.type === 'error' ? 'error' : 'warning'} />} title={item.title} description={item.description} /></List.Item>} /></Card></Col>
      <Col xs={24} xl={10}><Card className="qiyu-card" title="技师利用率"><Space direction="vertical" style={{ width: '100%' }} size="large">{data.utilization.map((item) => <div key={item.name}><div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><Typography.Text strong>{item.name}</Typography.Text><Typography.Text type="secondary">{item.text}</Typography.Text></div><Progress percent={item.rate} strokeColor="#b58c5e" /></div>)}</Space></Card></Col>
    </Row>
    <Alert style={{ marginTop: 16 }} type="info" showIcon message="数据更新时间" description="看板数据由当前 API 模式提供，切换 Mock、开发环境或生产环境时保持相同页面契约。" />
  </div>;
}
