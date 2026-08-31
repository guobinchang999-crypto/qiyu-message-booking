import { KeyOutlined, RollbackOutlined, SafetyCertificateOutlined, SafetyOutlined } from '@ant-design/icons';
import { Button, DatePicker, Form, Input, Modal, Select, Space, Tag, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { type Dayjs } from 'dayjs';
import { useState } from 'react';
import SystemCrudPage, { statusColumn } from '@/components/SystemCrudPage';
import { systemAdminApi } from '@/services/system-service';
import type { DataScopeOptions, PermissionOption, SystemUserRecord, UserDataScopeType } from '@/types/system';
const columns: ColumnsType<SystemUserRecord> = [
  { title: '账号', dataIndex: 'username' }, { title: '姓名', dataIndex: 'displayName' }, { title: '手机号', dataIndex: 'phone' }, { title: '部门', dataIndex: 'departmentName' },
  { title: '角色', dataIndex: 'roleNames', render: (values: string[]) => <Space size={4}>{values.map((value) => <Tag key={value}>{value}</Tag>)}</Space> }, { title: '数据范围', dataIndex: 'dataScope' }, { title: '最后登录', dataIndex: 'lastLoginAt', render: (value) => value || '-' }, statusColumn<SystemUserRecord>()
];
export default function UsersPage() {
  const [passwordForm] = Form.useForm<{ newPassword: string; confirmPassword: string }>();
  const [scopeForm] = Form.useForm<{ scopeType: UserDataScopeType; storeIds: string[]; regionIds: string[]; validRange?: [Dayjs, Dayjs] }>();
  const [scopeUser, setScopeUser] = useState<SystemUserRecord>();
  const [scopeOptions, setScopeOptions] = useState<DataScopeOptions>({ stores: [], regions: [] });
  const [scopeInherited, setScopeInherited] = useState(true);
  const [scopeLoading, setScopeLoading] = useState(false);
  const [permForm] = Form.useForm<{ allowedCodes: string[]; deniedCodes: string[] }>();
  const [permUser, setPermUser] = useState<SystemUserRecord>();
  const [permOptions, setPermOptions] = useState<PermissionOption[]>([]);
  const [permLoading, setPermLoading] = useState(false);
  const scopeType = Form.useWatch('scopeType', scopeForm);
  const resetPassword = (record: SystemUserRecord) => {
    passwordForm.resetFields();
    Modal.confirm({
      title: `重置 ${record.displayName} 的密码`,
      icon: <KeyOutlined />,
      content: <Form form={passwordForm} layout="vertical" style={{ marginTop: 24 }}>
        <Form.Item name="newPassword" label="新密码" rules={[{ required: true }, { min: 8, message: '至少输入 8 个字符' }]}><Input.Password autoComplete="new-password" /></Form.Item>
        <Form.Item name="confirmPassword" label="确认密码" dependencies={['newPassword']} rules={[{ required: true }, ({ getFieldValue }) => ({ validator: (_, value) => value === getFieldValue('newPassword') ? Promise.resolve() : Promise.reject(new Error('两次输入的密码不一致')) })]}><Input.Password autoComplete="new-password" /></Form.Item>
      </Form>,
      okText: '确认重置',
      onOk: async () => {
        const values = await passwordForm.validateFields();
        await systemAdminApi.users.resetPassword(record.id, values.newPassword);
        message.success('密码已重置');
      }
    });
  };
  const editDataScope = async (record: SystemUserRecord) => {
    setScopeLoading(true);
    try {
      const [scope, options] = await Promise.all([
        systemAdminApi.users.getDataScope(record.id),
        systemAdminApi.users.dataScopeOptions(),
      ]);
      setScopeOptions(options);
      setScopeInherited(scope.inherited);
      scopeForm.setFieldsValue({
        scopeType: scope.scopeType,
        storeIds: scope.storeIds,
        regionIds: scope.regionIds,
        validRange: scope.validFrom && scope.validUntil ? [dayjs(scope.validFrom), dayjs(scope.validUntil)] : undefined,
      });
      setScopeUser(record);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '数据权限加载失败');
    } finally {
      setScopeLoading(false);
    }
  };
  const clearDataScope = async () => {
    if (!scopeUser) return;
    setScopeLoading(true);
    try {
      await systemAdminApi.users.clearDataScope(scopeUser.id);
      message.success('已恢复角色默认数据权限');
      setScopeUser(undefined);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '恢复角色权限失败');
    } finally {
      setScopeLoading(false);
    }
  };
  const saveDataScope = async () => {
    if (!scopeUser) return;
    const values = await scopeForm.validateFields();
    setScopeLoading(true);
    try {
      await systemAdminApi.users.saveDataScope(scopeUser.id, {
        scopeType: values.scopeType,
        storeIds: values.scopeType === 'ASSIGNED_STORES' ? values.storeIds || [] : [],
        regionIds: values.scopeType === 'REGION_STORES' ? values.regionIds || [] : [],
        validFrom: values.validRange?.[0].format('YYYY-MM-DDTHH:mm:ss'),
        validUntil: values.validRange?.[1].format('YYYY-MM-DDTHH:mm:ss'),
      });
      message.success('数据权限已更新');
      setScopeUser(undefined);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '数据权限保存失败');
    } finally {
      setScopeLoading(false);
    }
  };
  const editPermissions = async (record: SystemUserRecord) => {
    setPermLoading(true);
    try {
      const [grants, options] = await Promise.all([
        systemAdminApi.users.getPermissions(record.id),
        systemAdminApi.users.permissionOptions(),
      ]);
      setPermOptions(options);
      permForm.setFieldsValue({
        allowedCodes: grants.filter((grant) => grant.effect === 'ALLOW').map((grant) => grant.permissionCode),
        deniedCodes: grants.filter((grant) => grant.effect === 'DENY').map((grant) => grant.permissionCode),
      });
      setPermUser(record);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '权限覆盖加载失败');
    } finally {
      setPermLoading(false);
    }
  };
  const clearPermissions = async () => {
    if (!permUser) return;
    setPermLoading(true);
    try {
      await systemAdminApi.users.clearPermissions(permUser.id);
      message.success('已清除用户级权限覆盖，恢复角色权限');
      setPermUser(undefined);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '清除权限覆盖失败');
    } finally {
      setPermLoading(false);
    }
  };
  const savePermissions = async () => {
    if (!permUser) return;
    const values = await permForm.validateFields();
    setPermLoading(true);
    try {
      await systemAdminApi.users.savePermissions(permUser.id, {
        allowedCodes: values.allowedCodes || [],
        deniedCodes: values.deniedCodes || [],
      });
      message.success('权限覆盖已更新');
      setPermUser(undefined);
    } catch (error) {
      message.error(error instanceof Error ? error.message : '权限覆盖保存失败');
    } finally {
      setPermLoading(false);
    }
  };
  return <SystemCrudPage title="系统用户" description="管理员工登录账号、角色和默认数据范围；密码由后端安全流程重置。" permissionHint="system:user:manage" columns={columns} fields={[
  { name: 'username', label: '登录账号', required: true }, { name: 'displayName', label: '姓名', required: true }, { name: 'phone', label: '手机号', required: true }, { name: 'departmentName', label: '所属组织/部门', required: true }, { name: 'roleNames', label: '角色', type: 'tags', required: true, placeholder: '输入后按回车' }, { name: 'status', label: '状态', type: 'select', required: true, options: [{ label: '启用', value: 'ENABLED' }, { label: '停用', value: 'DISABLED' }] }
]} initialValues={{ status: 'ENABLED', roleNames: [], dataScope: '本人' }} list={systemAdminApi.users.list} save={systemAdminApi.users.save} remove={systemAdminApi.users.remove}
extraActions={(record) => <Space size={0}>
  <Button type="text" size="small" icon={<SafetyCertificateOutlined />} title="数据权限" loading={scopeLoading && scopeUser?.id === record.id} onClick={() => void editDataScope(record)} />
  <Button type="text" size="small" icon={<SafetyOutlined />} title="权限覆盖" loading={permLoading && permUser?.id === record.id} onClick={() => void editPermissions(record)} />
  <Button type="text" size="small" icon={<KeyOutlined />} title="重置密码" onClick={() => resetPassword(record)} />
</Space>}>
  <Modal title={`${scopeUser?.displayName || ''}的数据权限`} open={!!scopeUser} confirmLoading={scopeLoading} onOk={() => void saveDataScope()} onCancel={() => setScopeUser(undefined)} destroyOnHidden>
    <Form form={scopeForm} layout="vertical" preserve={false} style={{ marginTop: 24 }} initialValues={{ scopeType: 'SELF', storeIds: [], regionIds: [] }}>
      <Form.Item name="scopeType" label="数据范围" rules={[{ required: true }]}>
        <Select options={[
          { label: '仅本人', value: 'SELF' }, { label: '本门店', value: 'PRIMARY_STORE' },
          { label: '指定门店', value: 'ASSIGNED_STORES' }, { label: '指定区域及下级', value: 'REGION_STORES' },
          { label: '全部门店', value: 'ALL_STORES' }, { label: '禁止访问', value: 'NONE' },
        ]} />
      </Form.Item>
      {scopeType === 'ASSIGNED_STORES' && <Form.Item name="storeIds" label="授权门店" rules={[{ required: true, message: '请选择授权门店' }]}>
        <Select mode="multiple" options={scopeOptions.stores.map((item) => ({ label: item.name, value: item.id }))} />
      </Form.Item>}
      {scopeType === 'REGION_STORES' && <Form.Item name="regionIds" label="授权区域" rules={[{ required: true, message: '请选择授权区域' }]}>
        <Select mode="multiple" options={scopeOptions.regions.map((item) => ({ label: item.name, value: item.id }))} />
      </Form.Item>}
      <Form.Item name="validRange" label="授权有效期"><DatePicker.RangePicker showTime style={{ width: '100%' }} /></Form.Item>
      {!scopeInherited && <Button icon={<RollbackOutlined />} onClick={() => void clearDataScope()} loading={scopeLoading}>恢复角色默认</Button>}
    </Form>
  </Modal>
  <Modal title={`${permUser?.displayName || ''}的权限覆盖`} open={!!permUser} confirmLoading={permLoading} onOk={() => void savePermissions()} onCancel={() => setPermUser(undefined)} destroyOnHidden width={520}>
    <Form form={permForm} layout="vertical" preserve={false} style={{ marginTop: 24 }} initialValues={{ allowedCodes: [], deniedCodes: [] }}>
      <Form.Item name="allowedCodes" label="直接允许权限" extra="叠加在角色权限之上，输入权限码后回车或从列表选择">
        <Select mode="tags" allowClear options={permOptions.map((item) => ({ label: `${item.code}（${item.name}）`, value: item.code }))} placeholder="例如 booking:read" />
      </Form.Item>
      <Form.Item name="deniedCodes" label="直接禁止权限" extra="DENY 优先于角色权限和用户 ALLOW">
        <Select mode="tags" allowClear options={permOptions.map((item) => ({ label: `${item.code}（${item.name}）`, value: item.code }))} placeholder="例如 customer:reveal_phone" />
      </Form.Item>
      <Button icon={<RollbackOutlined />} onClick={() => void clearPermissions()} loading={permLoading}>清除覆盖，恢复角色权限</Button>
    </Form>
  </Modal>
</SystemCrudPage>;
}
