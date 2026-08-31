import { SearchOutlined } from '@ant-design/icons';
import { Button, Card, Drawer, Input, Space, Table, Tag, Typography } from 'antd';
import type { TableProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useMemo, useState } from 'react';

interface ManagementTablePageProps<T extends { id: string }> {
  title: string;
  description: string;
  dataSource: T[];
  columns: ColumnsType<T>;
  searchKeys: Array<keyof T>;
  primaryActionText?: string;
  drawerTitle?: string;
  drawerContent?: (record?: T) => React.ReactNode;
  rowTags?: (record: T) => string[];
  toolbar?: React.ReactNode;
  rowSelection?: TableProps<T>['rowSelection'];
}

const stringifyValue = (value: unknown): string => {
  if (Array.isArray(value)) return value.join(' ');
  if (value === null || value === undefined) return '';
  return String(value);
};

export default function ManagementTablePage<T extends { id: string }>(props: ManagementTablePageProps<T>) {
  const [keyword, setKeyword] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeRecord, setActiveRecord] = useState<T>();
  const rows = useMemo(() => {
    const normalizedKeyword = keyword.trim();
    if (!normalizedKeyword) return props.dataSource;
    return props.dataSource.filter((record) => props.searchKeys.some((key) => stringifyValue(record[key]).includes(normalizedKeyword)));
  }, [keyword, props.dataSource, props.searchKeys]);
  const openDrawer = (record?: T) => {
    setActiveRecord(record);
    setDrawerOpen(true);
  };
  const columns: ColumnsType<T> = [
    ...props.columns,
    {
      title: '操作',
      key: 'actions',
      fixed: 'right',
      width: 120,
      render: (_, record) => <Button type="link" size="small" onClick={() => openDrawer(record)}>查看</Button>
    }
  ];
  return <div className="qiyu-page">
    <div className="qiyu-page-header">
      <div>
        <h1 className="qiyu-page-title">{props.title}</h1>
        <div className="qiyu-page-description">{props.description}</div>
      </div>
      {props.primaryActionText && <Button type="primary" onClick={() => openDrawer()}>{props.primaryActionText}</Button>}
    </div>
    <Card className="qiyu-card">
      <div className="qiyu-toolbar">
        <Input allowClear prefix={<SearchOutlined />} placeholder={`搜索${props.title}`} style={{ width: 280 }} value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <Space wrap>{props.toolbar}{[...new Set(props.dataSource.slice(0, 3).flatMap((record) => props.rowTags?.(record) ?? []))].slice(0, 6).map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
      </div>
      <Table<T> rowKey="id" rowSelection={props.rowSelection} columns={columns} dataSource={rows} scroll={{ x: 980 }} pagination={{ pageSize: 8, showSizeChanger: false, showTotal: (total) => `共 ${total} 条` }} />
    </Card>
    <Drawer title={props.drawerTitle ?? props.title} width={440} open={drawerOpen} onClose={() => setDrawerOpen(false)}>
      {props.drawerContent?.(activeRecord) ?? <Typography.Paragraph type="secondary">该记录暂未提供更多详情。</Typography.Paragraph>}
    </Drawer>
  </div>;
}
