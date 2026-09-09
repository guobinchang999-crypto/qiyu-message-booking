import type { ProColumns } from '@ant-design/pro-components';
import SystemCrudPage, { statusColumn } from '@/components/SystemCrudPage';
import { systemAdminApi } from '@/services/system-service';
import type { DictionaryRecord } from '@/types/system';

const columns: ProColumns<DictionaryRecord>[] = [
  { title: '字典类型', dataIndex: 'typeName' },
  { title: '类型编码', dataIndex: 'typeCode' },
  { title: '选项名称', dataIndex: 'itemLabel' },
  { title: '选项值', dataIndex: 'itemValue' },
  { title: '排序', dataIndex: 'sort', width: 80 },
  { title: '备注', dataIndex: 'remark', ellipsis: true, render: (_, record) => record.remark || '-' },
  statusColumn<DictionaryRecord>()
];

export default function DictionariesPage() {
  return <SystemCrudPage<DictionaryRecord>
    title="数据字典"
    description="集中维护状态、类别和筛选选项，业务页面通过字典接口消费，不散落硬编码。"
    permissionHint="system:dictionary:manage"
    columns={columns}
    fields={[
      { name: 'typeName', label: '字典类型名称', required: true },
      { name: 'typeCode', label: '字典类型编码', required: true },
      { name: 'itemLabel', label: '选项名称', required: true },
      { name: 'itemValue', label: '选项值', required: true },
      { name: 'sort', label: '排序', type: 'number', required: true },
      { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '启用', value: 'ENABLED' }, { label: '停用', value: 'DISABLED' }] },
      { name: 'remark', label: '备注', type: 'textarea' }
    ]}
    initialValues={{ sort: 0, status: 'ENABLED' }}
    list={systemAdminApi.dictionaries.list}
    save={systemAdminApi.dictionaries.save}
    remove={systemAdminApi.dictionaries.remove}
  />;
}
