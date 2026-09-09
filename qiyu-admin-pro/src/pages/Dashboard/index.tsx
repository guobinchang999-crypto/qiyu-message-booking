import { Alert, Badge, Button, List, Progress, Space, Spin, Statistic, Table, Tag, Typography } from 'antd';
import { PageContainer, ProCard } from '@ant-design/pro-components';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { adminApi } from '@/services/admin-service';
import type { DashboardData } from '@/services/remote';
import { QIYU_PRIMARY, QIYU_WARM } from '@/theme';

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>();
  const [loadError, setLoadError] = useState<string>();
  const [refreshing, setRefreshing] = useState(false);
  const reload = async () => {
    try {
      setRefreshing(true);
      setLoadError(undefined);
      setData(await adminApi.getDashboard());
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '看板数据加载失败');
    } finally {
      setRefreshing(false);
    }
  };
  useEffect(() => {
    void reload();
    const timer = window.setInterval(() => void reload(), REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, []);
  if (!data) {
    if (loadError) {
      return (
        <PageContainer header={{ title: '总部运营看板' }}>
          <Alert
            type="error"
            showIcon
            message="看板数据加载失败"
            description={loadError}
            action={<Button loading={refreshing} onClick={() => void reload()}>重试</Button>}
          />
        </PageContainer>
      );
    }
    return <Spin size="large" style={{ display: 'grid', placeItems: 'center', minHeight: 420 }} />;
  }
  const maxRevenue = Math.max(...data.revenue.map((value) => Number(value) || 0), 1);
  const stepX = data.revenue.length > 1 ? 100 / (data.revenue.length - 1) : 100;
  const points = data.revenue.map((value, index) => `${(index * stepX).toFixed(1)},${(200 - (Number(value) / maxRevenue) * 180).toFixed(1)}`).join(' ');
  return (
    <PageContainer
      header={{
        title: '总部运营看板',
        subTitle: `${dayjs().format('YYYY 年 M 月 D 日')} · 全部门店实时经营概览`
      }}
      extra={[<Space key="actions"><Button loading={refreshing} onClick={() => void reload()}>刷新</Button><Tag color="green">数据每 5 分钟自动更新</Tag></Space>]}
    >
      {loadError && (
        <Alert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          message="看板数据刷新失败"
          description={loadError}
          action={<Button loading={refreshing} onClick={() => void reload()}>重试</Button>}
        />
      )}
      <ProCard gutter={[16, 16]} wrap>
        {data.statistics.map((item) => (
          <ProCard key={item.label} colSpan={{ xs: 24, sm: 12, xl: 6 }}>
            <Statistic title={item.label} value={item.value} suffix={item.suffix} />
            <Typography.Text type="success" style={{ fontSize: 12 }}>较昨日 {item.change}</Typography.Text>
          </ProCard>
        ))}
      </ProCard>
      <ProCard gutter={[16, 16]} wrap style={{ marginTop: 16 }}>
        <ProCard colSpan={{ xs: 24, xl: 15 }} title="近 7 日营业额趋势" extra={<Typography.Text type="secondary">单位：百元</Typography.Text>}>
          <div className="qiyu-line-chart">
            <svg viewBox="0 0 100 220" preserveAspectRatio="none">
              <line className="grid" x1="0" y1="45" x2="100" y2="45" />
              <line className="grid" x1="0" y1="110" x2="100" y2="110" />
              <line className="grid" x1="0" y1="175" x2="100" y2="175" />
              <polyline className="curve" points={points} />
            </svg>
          </div>
        </ProCard>
        <ProCard colSpan={{ xs: 24, xl: 9 }} title="门店经营排名">
          <Table
            pagination={false}
            size="small"
            rowKey="store"
            dataSource={data.ranking}
            columns={[
              { title: '门店', dataIndex: 'store' },
              { title: '营业额', dataIndex: 'revenue', render: (value) => `¥${value.toLocaleString()}` },
              { title: '到店率', dataIndex: 'rate', render: (value) => <Progress percent={value} size="small" strokeColor={QIYU_PRIMARY} /> }
            ]}
          />
        </ProCard>
      </ProCard>
      <ProCard gutter={[16, 16]} wrap style={{ marginTop: 16 }}>
        <ProCard colSpan={{ xs: 24, xl: 14 }} title="待处理事项">
          <List
            dataSource={data.alerts}
            renderItem={(item) => (
              <List.Item>
                <List.Item.Meta avatar={<Badge status={item.type === 'error' ? 'error' : 'warning'} />} title={item.title} description={item.description} />
              </List.Item>
            )}
          />
        </ProCard>
        <ProCard colSpan={{ xs: 24, xl: 10 }} title="技师利用率">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            {data.utilization.map((item) => (
              <div key={item.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><Typography.Text strong>{item.name}</Typography.Text><Typography.Text type="secondary">{item.text}</Typography.Text></div>
                <Progress percent={item.rate} strokeColor={QIYU_WARM} />
              </div>
            ))}
          </Space>
        </ProCard>
      </ProCard>
      <Alert style={{ marginTop: 16 }} type="info" showIcon message="数据更新时间" description="看板按当前账号的数据权限实时聚合，每 5 分钟自动更新，也可点击右上角刷新按钮立即获取最新数据。" />
    </PageContainer>
  );
}
