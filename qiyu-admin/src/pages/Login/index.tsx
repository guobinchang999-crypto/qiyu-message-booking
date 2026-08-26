import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Form, Input, Select, Space, Typography, message } from 'antd';
import { createMockSession, saveAdminSession, type AdminRole } from '@/services/admin-auth';
import './style.less';

export default function LoginPage() {
  const [form] = Form.useForm();
  const onFinish = (values: { role: AdminRole; remember: boolean }) => {
    saveAdminSession(createMockSession(values.role, values.remember));
    message.success('欢迎进入栖愈运营中心');
    window.location.href = '/dashboard';
  };
  return <div className="login-page">
    <div className="login-intro"><div className="login-brand-mark">栖</div><Typography.Title level={1}>栖愈运营中心</Typography.Title><Typography.Paragraph>统一品牌门店运营 · 预约履约 · 资源管理</Typography.Paragraph><div className="login-intro-card">今日服务的每一次安心体验，都在这里被妥善安排。</div></div>
    <Card className="login-card" bordered={false}>
      <Typography.Title level={3}>管理员登录</Typography.Title>
      <Typography.Paragraph type="secondary">MVP 演示环境，任意手机号和密码均可进入。</Typography.Paragraph>
      <Form layout="vertical" form={form} initialValues={{ phone: '13800138000', password: '123456', role: 'HQ_ADMIN', remember: true }} onFinish={onFinish}>
        <Form.Item name="phone" label="手机号" rules={[{ required: true, message: '请输入手机号' }]}><Input prefix={<MobileOutlined />} size="large" /></Form.Item>
        <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} size="large" /></Form.Item>
        <Form.Item name="role" label="演示角色" rules={[{ required: true }]}><Select options={[{ label: '总部运营管理员', value: 'HQ_ADMIN' }, { label: '静安寺店店长', value: 'STORE_MANAGER' }]} /></Form.Item>
        <Form.Item name="remember" valuePropName="checked"><Checkbox>保持登录状态</Checkbox></Form.Item>
        <Button type="primary" htmlType="submit" size="large" block>进入运营中心</Button>
      </Form>
      <Space style={{ marginTop: 20 }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>栖愈｜推拿·SPA</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>Mock 演示版</Typography.Text></Space>
    </Card>
  </div>;
}
