import {useEffect,useState} from 'react';
import {useModel} from '@@/plugin-model';
import {Alert,App,Button,Descriptions,Drawer,Form,Input,InputNumber,Select,Space,Switch,Table,Tag,Tree,TreeSelect,Typography} from 'antd';
import {PageContainer} from '@ant-design/pro-components';
import {systemAdminApi} from '@/services/system-service';
import {buildConfiguredMenu} from '@/constants/menu';
import {useManagementState} from '@/components/management/useManagement';
import EditorDrawer from '@/components/management/EditorDrawer';
import type {PermissionOption,SystemMenuRecord} from '@/types/system';

const types={DIRECTORY:'目录',MENU:'页面',BUTTON:'按钮'};
type Node=SystemMenuRecord&{children?:Node[]};
function asTree(rows:SystemMenuRecord[]):Node[]{
  const nodes=new Map<string,Node>(rows.map(r=>[r.id,{...r}]));
  const roots:Node[]=[];rows.forEach(r=>{const node=nodes.get(r.id)!;const parent=r.parentId?nodes.get(r.parentId):undefined;if(parent&&parent!==node)(parent.children??=[]).push(node);else roots.push(node);});return roots;
}
export default function MenusPage(){
  const {params,set}=useManagementState();const {message,modal}=App.useApp();const {setInitialState}=useModel('@@initialState');
  const [rows,setRows]=useState<SystemMenuRecord[]>([]);const [routes,setRoutes]=useState<Array<{id:string;name:string}>>([]);const [permissions,setPermissions]=useState<PermissionOption[]>([]);
  const [loading,setLoading]=useState(true);const [error,setError]=useState<string>();const [revision,reload]=useState(0);const [editing,setEditing]=useState<Partial<SystemMenuRecord>>();const [preview,setPreview]=useState<SystemMenuRecord[]>();
  useEffect(()=>{let active=true;setLoading(true);setError(undefined);Promise.all([systemAdminApi.menus.tree(),systemAdminApi.menus.routes(),systemAdminApi.users.permissionOptions()])
    .then(([r,p,g])=>{if(active){setRows(r);setRoutes(p);setPermissions(g);}}).catch(e=>active&&setError(e.message)).finally(()=>active&&setLoading(false));return()=>{active=false;};},[revision]);
  const selected=rows.find(r=>r.id===params.get('id'));const keyword=params.get('keyword')||'';
  const filtersActive=keyword||params.get('type')||params.get('status')||params.has('visible');
  const filtered=rows.filter(r=>(!keyword||r.name.includes(keyword)||r.path.includes(keyword))&&(!params.get('type')||r.type===params.get('type'))&&(!params.get('status')||r.status===params.get('status'))&&(!params.has('visible')||String(r.visible)===params.get('visible')));
  const refreshNavigation=async()=>{const navigation=await systemAdminApi.navigation();await setInitialState(old=>old?{...old,navigation,navigationError:undefined}:old);};
  const save=async(values:Partial<SystemMenuRecord>)=>{
    await systemAdminApi.menus.save({...editing,...values,parentId:values.parentId||undefined});message.success('菜单配置已保存');
    reload(v=>v+1);try{await refreshNavigation();}catch(e){message.warning('配置已保存，导航刷新失败，请重新加载页面');}
  };
  const remove=(row:SystemMenuRecord)=>modal.confirm({title:'删除'+row.name+'？',content:'有下级的目录不可删除；隐藏菜单不会撤销接口权限。',okText:'删除',cancelText:'取消',okButtonProps:{danger:true},onOk:async()=>{try{await systemAdminApi.menus.remove(row.id);set({id:undefined});reload(v=>v+1);await refreshNavigation();}catch(e){message.error(e instanceof Error?e.message:'删除失败');throw e;}}});
  return <PageContainer title="菜单管理" subTitle="配置已有页面的显示位置，不改变业务接口权限。" extra={<Space><Button onClick={async()=>{try{setPreview(await systemAdminApi.navigation());}catch(e){message.error('导航预览加载失败');}}}>预览我的导航</Button><Button type="primary" onClick={()=>setEditing({type:'DIRECTORY',sort:0,visible:true,status:'ENABLED'})}>新增配置</Button></Space>}>
    {error&&<Alert type="error" showIcon message="菜单加载失败" description={error} action={<Button onClick={()=>reload(v=>v+1)}>重试</Button>} />}
    <div className="reception-panel"><Space wrap className="section-gap">
      <Input.Search placeholder="搜索名称或路由" defaultValue={keyword} allowClear onSearch={keyword=>set({keyword,id:undefined})} />
      <Select allowClear placeholder="全部类型" value={params.get('type')||undefined} options={Object.entries(types).map(([value,label])=>({value,label}))} onChange={type=>set({type})} style={{width:140}} />
      <Select allowClear placeholder="全部状态" value={params.get('status')||undefined} options={[{value:'ENABLED',label:'启用'},{value:'DISABLED',label:'停用'}]} onChange={status=>set({status})} style={{width:140}} />
      <Select allowClear placeholder="导航可见性" value={params.get('visible')||undefined} options={[{value:'true',label:'显示'},{value:'false',label:'隐藏'}]} onChange={visible=>set({visible})} style={{width:150}} />
      <Button loading={loading} onClick={()=>reload(v=>v+1)}>刷新</Button>
    </Space>
    <Table<Node> rowKey="id" loading={loading} dataSource={filtersActive?filtered:asTree(rows)} pagination={false} expandable={{defaultExpandAllRows:true}} scroll={{x:950}} columns={[
      {title:'名称',dataIndex:'name',render:(_,r)=><Button type="link" onClick={()=>set({id:r.id})}>{r.name}</Button>},{title:'类型',dataIndex:'type',render:v=>types[v as keyof typeof types]},
      {title:'页面地址',dataIndex:'path',render:v=>v||'—'},{title:'排序',dataIndex:'sort'},{title:'导航',dataIndex:'visible',render:v=>v?'显示':'隐藏'},
      {title:'状态',dataIndex:'status',render:v=><Tag>{v==='ENABLED'?'启用':'停用'}</Tag>},{title:'操作',render:(_,r)=><Button onClick={()=>setEditing(r)}>配置显示</Button>}
    ]} /></div>
    <Drawer open={!!selected} title={selected?.name} width={640} onClose={()=>set({id:undefined})}>{selected&&<>
      <Descriptions column={1} items={[{key:'type',label:'类型',children:types[selected.type]},{key:'parent',label:'上级',children:rows.find(r=>r.id===selected.parentId)?.name||'顶级目录'},{key:'path',label:'路由',children:selected.path||'—'},{key:'permission',label:'权限标识',children:selected.permissionCode||'由子页面决定'}]} />
      <Space><Button type="primary" onClick={()=>setEditing(selected)}>编辑配置</Button>{selected.type!=='MENU'&&<Button danger onClick={()=>remove(selected)}>删除配置</Button>}</Space>
    </>}</Drawer>
    <Drawer open={!!preview} title="当前账号导航预览" onClose={()=>setPreview(undefined)} width={500}><Tree defaultExpandAll treeData={buildConfiguredMenu(preview||[]) as never} fieldNames={{title:'name',key:'key',children:'children'}} /></Drawer>
    {editing&&<EditorDrawer title={editing.id?'编辑菜单配置':'新增菜单配置'} initialValues={editing} onSave={save} onClose={()=>setEditing(undefined)}>{form=><>
      <Typography.Title level={5}>基本信息</Typography.Title>
      <Form.Item name="name" label="名称" rules={[{required:true,message:'请填写名称'}]}><Input maxLength={100} /></Form.Item>
      <Form.Item name="type" label="类型" rules={[{required:true}]}><Select disabled={!!editing.id} options={Object.entries(types).map(([value,label])=>({value,label}))} /></Form.Item>
      <Form.Item noStyle shouldUpdate>{()=>form.getFieldValue('type')==='MENU'?<Form.Item name="path" label="已注册页面" rules={[{required:true}]}><Select disabled={!!editing.id} showSearch options={routes.map(r=>({value:r.id,label:(rows.find(m=>m.path===r.id)?.name||'已注册页面')+' · '+r.id,disabled:rows.some(m=>m.path===r.id&&m.id!==editing.id)}))} /></Form.Item>:form.getFieldValue('type')==='BUTTON'?<Form.Item name="permissionCode" label="对应操作" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={permissions.map(p=>({value:p.code,label:p.name}))} /></Form.Item>:null}</Form.Item>
      <Typography.Title level={5}>显示与位置</Typography.Title>
      <Form.Item name="parentId" label="上级目录"><TreeSelect allowClear showSearch treeNodeFilterProp="title" treeDataSimpleMode treeData={rows.filter(r=>r.type==='DIRECTORY').map(r=>({id:r.id,pId:r.parentId,value:r.id,title:r.name,disabled:r.id===editing.id}))} placeholder="顶级目录" /></Form.Item>
      <Form.Item name="sort" label="同级排序" rules={[{required:true}]}><InputNumber min={0} precision={0} /></Form.Item>
      <Form.Item name="visible" label="在导航显示" valuePropName="checked"><Switch checkedChildren="显示" unCheckedChildren="隐藏" /></Form.Item>
      <Form.Item name="status" label="配置状态"><Select options={[{value:'ENABLED',label:'启用'},{value:'DISABLED',label:'停用'}]} /></Form.Item>
      <Alert type="info" message="隐藏或停用只影响导航。撤销操作权限请进入角色与权限。" />
    </>}</EditorDrawer>}
  </PageContainer>;
}
