import { Button, DatePicker, Input, Select, Space } from 'antd';
import { PlusOutlined, ScanOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useReception } from './ReceptionContext';
import { can, canAccessStore, readAdminSession } from '@/services/admin-auth';

export default function ReceptionToolbar({ keyword, onSearch, onCreate, hideCheckin = false }: {
  keyword?: string; onSearch?: (value: string) => void; onCreate?: () => void; hideCheckin?: boolean;
}) {
  const scope = useReception(); const session = readAdminSession();
  const navigate = useNavigate();
  return <div className="reception-toolbar">
    <Space wrap>
      <Select aria-label="当前门店" value={scope.storeId} loading={scope.loading} placeholder="选择门店" options={scope.options.stores} onChange={storeId => scope.setScope({storeId})} className="store-select" />
      <DatePicker aria-label="接待日期" allowClear={false} value={dayjs(scope.date)} onChange={date => date && scope.setScope({date: date.format('YYYY-MM-DD')})} />
      <Button onClick={() => scope.setScope({date: dayjs().format('YYYY-MM-DD')})}>今天</Button>
      {onSearch && <Input.Search aria-label="查找客户或预约" allowClear placeholder="客户、手机号、预约编号" defaultValue={keyword} key={keyword} onSearch={onSearch} style={{width: 250}} />}
    </Space>
    <Space wrap>
      {!hideCheckin && can(session,'booking:checkin') && <Button icon={<ScanOutlined />} onClick={() => navigate('/checkin')}>到店核销</Button>}
      {onCreate && can(session,'booking:create') && <Button type="primary" icon={<PlusOutlined />} disabled={!scope.storeId || !canAccessStore(session,'booking','CREATE',scope.storeId)} onClick={onCreate}>新建预约</Button>}
    </Space>
  </div>;
}
