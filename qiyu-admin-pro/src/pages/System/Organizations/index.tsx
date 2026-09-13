import { useEffect, useState } from 'react';
import { Alert, App, Button, Checkbox, Descriptions, Dropdown, Empty, Form, Input, InputNumber, Select, Space, Spin, Table, Tabs, Tag, Tree, TreeSelect, Typography } from 'antd';
import { PageContainer } from '@ant-design/pro-components';
import type { TreeDataNode } from 'antd';
import { systemAdminApi } from '@/services/system-service';
import { can, readAdminSession } from '@/services/admin-auth';
import type { OrganizationRecord } from '@/types/system';
import { useManagementState } from '@/components/management/useManagement';
import EditorDrawer from '@/components/management/EditorDrawer';

const typeText={HEADQUARTERS:'总部',REGION:'区域',STORE:'门店',DEPARTMENT:'部门'};
function descendants(rows:OrganizationRecord[],id:string):Set<string>{
  const result=new Set([id]);let changed=true;
  while(changed){changed=false;rows.forEach(r=>{if(r.parentId&&result.has(r.parentId)&&!result.has(r.id)){result.add(r.id);changed=true;}});}return result;
}
function pathOf(rows:OrganizationRecord[],id?:string):string{
  const names:string[]=[];const visited=new Set<string>();
  while(id&&!visited.has(id)){visited.add(id);const row=rows.find(r=>r.id===id);if(!row)break;names.unshift(row.name);id=row.parentId;}return names.join(' / ')||'顶级组织';
}
function treeOf(rows:OrganizationRecord[],keyword=''):TreeDataNode[]{
  const allowed=new Set<string>();
  rows.filter(r=>r.name.includes(keyword)).forEach(r=>{let node:OrganizationRecord|undefined=r;while(node&&!allowed.has(node.id)){allowed.add(node.id);node=rows.find(p=>p.id===node!.parentId);}});
  const nodes=new Map(rows.filter(r=>allowed.has(r.id)).map(r=>[r.id,{key:r.id,title:r.name+(r.status==='DISABLED'?'（已停用）':''),children:[] as TreeDataNode[]}]));
  const roots:TreeDataNode[]=[];rows.forEach(r=>{const node=nodes.get(r.id);if(!node)return;const parent=r.parentId?nodes.get(r.parentId):undefined;if(parent&&parent!==node)parent.children.push(node);else roots.push(node);});return roots;
}
export default function OrganizationsPage(){
  const {params,set}=useManagementState();const {modal,message}=App.useApp();
  const [rows,setRows]=useState<OrganizationRecord[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState<string>();const [revision,reload]=useState(0);
  const [editing,setEditing]=useState<Partial<OrganizationRecord>>();const [keyword,setKeyword]=useState(params.get('keyword')||'');
  const selected=rows.find(r=>r.id===params.get('id'));const userAccess=can(readAdminSession(),'system:user:manage');
  useEffect(()=>{let active=true;setLoading(true);setError(undefined);systemAdminApi.organizations.tree().then(v=>active&&setRows(v)).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false;};},[revision]);
  const confirm=(title:string,content:string)=>new Promise<void>((resolve,reject)=>modal.confirm({title,content,okText:'确认变更',cancelText:'继续编辑',onOk:()=>resolve(),onCancel:()=>reject(new Error('尚未确认变更，已保留填写内容'))}));
  const save=async(values:Partial<OrganizationRecord>)=>{
    const before=editing?.id?rows.find(r=>r.id===editing.id):undefined;
    if(before&&(before.parentId||undefined)!==(values.parentId||undefined)){
      const impact=await systemAdminApi.organizations.impact(before.id);
      await confirm('确认调整上级组织？','原位置：'+pathOf(rows,before.parentId)+'；新位置：'+pathOf(rows,values.parentId)+'。关联人员 '+impact.userCount+' 人，请核对组织及数据范围影响。');
    }
    const saved=await systemAdminApi.organizations.save({...editing,...values,parentId:values.parentId||undefined});
    message.success('组织已保存');set({id:saved.id});reload(v=>v+1);
  };
  const operate=async(row:OrganizationRecord,remove=false)=>{
    try{const impact=await systemAdminApi.organizations.impact(row.id);await confirm(remove?'删除组织？':row.status==='ENABLED'?'停用组织？':'启用组织？',pathOf(rows,row.id)+'，关联人员 '+impact.userCount+' 人。'+(remove?'有下级或人员引用时不能删除。':'不会自动迁移人员，有启用下级时不能停用。'));
      if(remove){await systemAdminApi.organizations.remove(row.id);set({id:undefined});}else await systemAdminApi.organizations.save({...row,status:row.status==='ENABLED'?'DISABLED':'ENABLED'});
      message.success('操作成功');reload(v=>v+1);
    }catch(e){message.error(e instanceof Error?e.message:'操作失败');}
  };
  const children=selected?rows.filter(r=>r.parentId===selected.id):rows.filter(r=>!r.parentId||!rows.some(p=>p.id===r.parentId));
  const unavailable=editing?.id?descendants(rows,editing.id):new Set<string>();
  return <PageContainer title="组织与部门" subTitle="选择组织，查看下级和人员，继续安排职责。" extra={<Button type="primary" onClick={()=>setEditing({type:'DEPARTMENT',status:'ENABLED',sort:0,parentId:selected?.id})}>{selected?'新增下级组织':'新增组织'}</Button>}>
    {error&&<Alert showIcon type="error" message="组织加载失败" description={error} action={<Button onClick={()=>reload(v=>v+1)}>重试</Button>} />}
    <div className="system-master-detail">
      <aside className="reception-panel system-tree"><Input.Search aria-label="查找组织" placeholder="查找组织名称" value={keyword} allowClear onChange={e=>setKeyword(e.target.value)} onSearch={v=>set({keyword:v})} />
        <Button type="link" onClick={()=>set({id:undefined,tab:undefined})}>全部组织</Button>
        {loading?<Spin />:rows.length?<Tree key={revision+keyword} blockNode defaultExpandAll selectedKeys={selected?[selected.id]:[]} treeData={treeOf(rows,keyword)} onSelect={keys=>keys[0]&&set({id:String(keys[0]),page:1})} />:<Empty description="暂无组织" />}
      </aside>
      <section className="reception-panel">
        <Space wrap className="section-gap"><Typography.Title level={4} style={{margin:0}}>{selected?.name||'全部组织'}</Typography.Title>
          {selected&&<><Tag>{typeText[selected.type]}</Tag><Tag color={selected.status==='ENABLED'?'success':'default'}>{selected.status==='ENABLED'?'启用':'停用'}</Tag><Button onClick={()=>setEditing(selected)}>编辑资料</Button><Dropdown menu={{items:[{key:'status',label:selected.status==='ENABLED'?'停用组织':'启用组织',onClick:()=>void operate(selected)},{key:'delete',label:'删除组织',danger:true,onClick:()=>void operate(selected,true)}]}}><Button>更多</Button></Dropdown></>}
          <Button loading={loading} onClick={()=>reload(v=>v+1)}>刷新</Button></Space>
        {selected&&<Descriptions column={1} items={[{key:'path',label:'组织路径',children:pathOf(rows,selected.id)},{key:'leader',label:'负责人',children:selected.leader||'未设置'}]} />}
        <Tabs activeKey={params.get('tab')==='users'&&userAccess&&selected?'users':'children'} onChange={tab=>set({tab,page:1})} items={[
          {key:'children',label:'下级组织',children:<Table rowKey="id" loading={loading} dataSource={children} pagination={false} columns={[{title:'组织名称',dataIndex:'name',render:(_,r)=><Button type="link" onClick={()=>set({id:r.id,page:1})}>{r.name}</Button>},{title:'类型',dataIndex:'type',render:v=>typeText[v as keyof typeof typeText]},{title:'负责人',dataIndex:'leader'},{title:'状态',dataIndex:'status',render:v=>v==='ENABLED'?'启用':'停用'}]} />},
          ...(selected&&userAccess?[{key:'users',label:'关联人员',children:<OrganizationMembers id={selected.id} revision={revision} />}]:[])
        ]} />
      </section>
    </div>
    {editing&&<EditorDrawer title={editing.id?'编辑组织资料':'新增组织'} initialValues={editing} onSave={save} onClose={()=>setEditing(undefined)}>
      <Typography.Title level={5}>基本信息</Typography.Title>
      <Form.Item name="name" label="组织名称" rules={[{required:true,message:'请填写组织名称'}]}><Input maxLength={100} /></Form.Item>
      <Form.Item name="type" label="组织类型" rules={[{required:true}]}><Select disabled={!!editing.id} options={Object.entries(typeText).map(([value,label])=>({value,label}))} /></Form.Item>
      <Form.Item name="leader" label="负责人"><Input placeholder="已有后台用户姓名" /></Form.Item>
      <Typography.Title level={5}>组织关系</Typography.Title>
      <Form.Item name="parentId" label="上级组织"><TreeSelect allowClear showSearch treeNodeFilterProp="title" treeDataSimpleMode treeDefaultExpandAll placeholder="不选则为顶级组织" treeData={rows.map(r=>({id:r.id,pId:r.parentId,value:r.id,title:pathOf(rows,r.id),disabled:unavailable.has(r.id)||r.status!=='ENABLED'}))} /></Form.Item>
      <Form.Item name="sort" label="同级排序" rules={[{required:true}]}><InputNumber min={0} precision={0} /></Form.Item>
    </EditorDrawer>}
  </PageContainer>;
}
function OrganizationMembers({id,revision}:{id:string;revision:number}){
  const {params,set}=useManagementState();const page=Number(params.get('page')||1);const descendants=params.get('descendants')==='true';
  const [data,setData]=useState<Awaited<ReturnType<typeof systemAdminApi.organizations.members>>>({records:[],total:0});const [loading,setLoading]=useState(false);const [error,setError]=useState<string>();const [retry,setRetry]=useState(0);
  useEffect(()=>{let active=true;setData({records:[],total:0});setLoading(true);setError(undefined);systemAdminApi.organizations.members(id,descendants,page).then(v=>active&&setData(v)).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false;};},[id,descendants,page,revision,retry]);
  return <><Checkbox checked={descendants} onChange={e=>set({descendants:String(e.target.checked),page:1})}>包含下级组织</Checkbox>{error&&<Alert type="error" message={error} action={<Button onClick={()=>setRetry(v=>v+1)}>重试</Button>} />}
    <Table rowKey="id" loading={loading} dataSource={data.records} pagination={{current:page,pageSize:20,total:data.total,showSizeChanger:false,onChange:p=>set({page:p})}} columns={[{title:'姓名',dataIndex:'displayName'},{title:'账号',dataIndex:'username'},{title:'所属组织',dataIndex:'departmentName'},{title:'状态',dataIndex:'status',render:v=>v==='ENABLED'?'启用':'停用'}]} />
  </>;
}
