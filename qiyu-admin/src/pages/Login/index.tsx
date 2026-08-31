import { LockOutlined, MobileOutlined } from '@ant-design/icons';
import { Button, Card, Checkbox, Form, Input, Space, Typography, message } from 'antd';
import { createAdminSession, saveAdminSession } from '@/services/admin-auth';
import { adminApi } from '@/services/admin-service';
import './style.less';

export default function LoginPage() {
  const [form] = Form.useForm();
  const onFinish = async (values: { identifier: string; credential: string; remember: boolean }) => {
    try {
      const response = await adminApi.login(values.identifier, values.credential);
      saveAdminSession(createAdminSession(response, values.remember));
      message.success('欢迎进入栖愈运营中心');
      window.location.href = '/dashboard';
    } catch (error) { message.error(error instanceof Error ? error.message : '登录失败，请稍后重试'); }
  };
  return <div className="login-page">
    <div className="login-intro"><div className="login-brand-mark">栖</div><Typography.Title level={1}>栖愈运营中心</Typography.Title><Typography.Paragraph>统一品牌门店运营 · 预约履约 · 资源管理</Typography.Paragraph><div className="login-intro-card">今日服务的每一次安心体验，都在这里被妥善安排。</div></div>
    <Card className="login-card" variant="borderless">
      <Typography.Title level={3}>管理员登录</Typography.Title>
      <Typography.Paragraph type="secondary">账号权限和门店范围由服务端统一返回。</Typography.Paragraph>
      <Form layout="vertical" form={form} initialValues={{ identifier: 'admin', credential: '123456', remember: true }} onFinish={onFinish}>
        <Form.Item name="identifier" label="账号" rules={[{ required: true, message: '请输入账号' }]}><Input prefix={<MobileOutlined />} size="large" /></Form.Item>
        <Form.Item name="credential" label="密码" rules={[{ required: true, message: '请输入密码' }]}><Input.Password prefix={<LockOutlined />} size="large" /></Form.Item>
        <Form.Item name="remember" valuePropName="checked"><Checkbox>保持登录状态</Checkbox></Form.Item>
        <Button type="primary" htmlType="submit" size="large" block>进入运营中心</Button>
      </Form>
      <Space style={{ marginTop: 20 }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>栖愈｜推拿·SPA</Typography.Text><Typography.Text type="secondary" style={{ fontSize: 12 }}>统一运营管理平台</Typography.Text></Space>
    </Card>
  </div>;
}
