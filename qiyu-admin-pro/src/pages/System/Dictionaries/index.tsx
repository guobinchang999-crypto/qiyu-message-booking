import { useEffect, useState } from 'react';
import { Alert, App, Button, Descriptions, Empty, Form, Input, InputNumber, List, Space, Table, Tag, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import EditorDrawer from '@/components/management/EditorDrawer';
import { useManagementState } from '@/components/management/useManagement';
import { systemAdminApi } from '@/services/system-service';
import type { DictionaryRecord, SystemPage } from '@/types/system';

type DictionaryType = Awaited<ReturnType<typeof systemAdminApi.dictionaries.types>>[number];

export default function DictionariesPage() {
  const { params, set } = useManagementState();
  const { message } = App.useApp();
  const [types, setTypes] = useState<DictionaryType[]>([]);
  const [typeSearch, setTypeSearch] = useState('');
  const [typeError, setTypeError] = useState<string>();
  const [typeLoading, setTypeLoading] = useState(true);
  const [data, setData] = useState<SystemPage<DictionaryRecord>>({records:[],total:0});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [revision, reload] = useState(0);
  const [editing, setEditing] = useState<DictionaryRecord>();
  const typeCode = params.get('type') || types[0]?.code;
  const selected = types.find(type => type.code === typeCode);
  const keyword = params.get('keyword') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const editingId = params.get('id');
  useEffect(() => {
    if(editingId) setEditing(data.records.find(record=>record.id===editingId));
    else setEditing(undefined);
  }, [editingId, data.records]);

  useEffect(() => {
    let active = true;
    setTypeLoading(true); setTypeError(undefined);
    systemAdminApi.dictionaries.types().then(value => {if(active) setTypes(value);})
      .catch(reason => {if(active) setTypeError(reason.message);})
      .finally(() => {if(active) setTypeLoading(false);});
    return () => {active = false;};
  }, [revision]);

  useEffect(() => {
    let active = true;
    setData({records:[],total:0}); setError(undefined);
    if(!typeCode) return () => {active = false;};
    setLoading(true);
    systemAdminApi.dictionaries.items(typeCode,{keyword,page,pageSize:20})
      .then(value => {if(active) setData(value);})
      .catch(reason => {if(active) setError(reason.message);})
      .finally(() => {if(active) setLoading(false);});
    return () => {active = false;};
  }, [typeCode, keyword, page, revision]);

  return <PageContainer title="数据字典" subTitle="按类型维护显示名称和排序，业务编码保持稳定。">
    <div className="system-master-detail">
      <aside className="reception-panel">
        <Input.Search aria-label="查找字典类型" placeholder="查找类型名称或编码" allowClear value={typeSearch} onChange={event => setTypeSearch(event.target.value)} />
        {typeError && <Alert type="error" showIcon message="字典类型加载失败" description={typeError} action={<Button onClick={() => reload(value=>value+1)}>重试</Button>} />}
        <List loading={typeLoading} rowKey="code" dataSource={types.filter(type => (type.name+type.code).toLowerCase().includes(typeSearch.toLowerCase()))}
          renderItem={type => <List.Item><Button block type={type.code===typeCode?'primary':'text'} onClick={() => set({type:type.code,keyword:undefined,page:1,id:undefined})}>{type.name}（{type.itemCount}）</Button></List.Item>} />
      </aside>
      <section className="reception-panel">
        {selected ? <>
          <Space wrap className="section-gap"><Typography.Title level={4} style={{margin:0}}>{selected.name}</Typography.Title><Tag>业务字典</Tag><Button loading={loading} onClick={() => reload(value=>value+1)}>刷新</Button></Space>
          <Descriptions column={1} items={[{key:'code',label:'类型编码',children:selected.code},{key:'description',label:'说明',children:selected.description || '暂无说明'}]} />
          <Alert className="section-gap" type="info" showIcon message="编码和值由业务规则定义，不支持新增、删除或启停选项。名称修改不改变已有记录的业务状态。" />
          <Input.Search key={keyword} className="section-gap" aria-label="查找字典选项" placeholder="搜索选项名称或值" defaultValue={keyword} allowClear onSearch={value => set({keyword:value,page:1})} />
          {error && <Alert type="error" showIcon message="选项加载失败" description={error} action={<Button onClick={() => reload(value=>value+1)}>重试</Button>} />}
          <Table<DictionaryRecord> rowKey="id" loading={loading} dataSource={data.records} scroll={{x:600}}
            pagination={{current:page,pageSize:20,total:data.total,showSizeChanger:false,showTotal:total=>`共 ${total} 项`,onChange:next=>set({page:next})}}
            columns={[{title:'选项名称',dataIndex:'itemLabel',render:(_,record)=><Button type="link" onClick={()=>{setEditing(record);set({id:record.id});}}>{record.itemLabel}</Button>},
              {title:'选项值',dataIndex:'itemValue'},{title:'排序',dataIndex:'sort',width:80},
              {title:'状态',dataIndex:'status',width:100,render:value=><Tag>{value==='ENABLED'?'启用':'停用'}</Tag>},
              {title:'操作',width:110,render:(_,record)=><Button onClick={()=>{setEditing(record);set({id:record.id});}}>编辑显示</Button>}]} />
        </> : !typeLoading && <Empty description={typeCode?'未找到该字典类型，请重新选择':'暂无字典类型'} />}
      </section>
    </div>
    {editing && <EditorDrawer title={'编辑选项 · '+editing.itemLabel} initialValues={editing}
      onClose={()=>{setEditing(undefined);set({id:undefined});}}
      onSave={async values=>{await systemAdminApi.dictionaries.save({...editing,...values});message.success('显示配置已保存');reload(value=>value+1);}}>
      <Descriptions column={1} items={[{key:'type',label:'所属类型',children:editing.typeName},{key:'value',label:'选项值（只读）',children:editing.itemValue}]} />
      <Form.Item name="itemLabel" label="显示名称" rules={[{required:true,whitespace:true,message:'请填写显示名称'}]}><Input maxLength={100} /></Form.Item>
      <Form.Item name="sort" label="同类型排序" rules={[{required:true,message:'请填写排序'}]}><InputNumber min={0} precision={0} /></Form.Item>
    </EditorDrawer>}
  </PageContainer>;
}
