import { App, Button, Drawer, Form, Alert, Space } from 'antd';
import { useEffect, useState, useRef } from 'react';
import type { FormInstance } from 'antd';

export default function EditorDrawer<T extends object>({title,initialValues,children,onSave,onClose}: {
  title:string;initialValues:T;children:React.ReactNode | ((form:FormInstance<T>)=>React.ReactNode);
  onSave:(value:T)=>Promise<unknown>;onClose:()=>void;
}) {
  const [form]=Form.useForm<T>();const {modal}=App.useApp();
  const [busy,setBusy]=useState(false);const lock=useRef(false);const [dirty,setDirty]=useState(false);const [error,setError]=useState<string>();
  useEffect(()=>{const warn=(event:BeforeUnloadEvent)=>{if(dirty){event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);return()=>window.removeEventListener('beforeunload',warn);},[dirty]);
  const close=()=>{if(busy)return;if(dirty)modal.confirm({title:'放弃尚未保存的修改？',okText:'放弃修改',cancelText:'继续填写',onOk:onClose});else onClose();};
  return <Drawer open title={title} width={760} onClose={close} maskClosable={!busy} keyboard={!busy} destroyOnHidden
    footer={<div className="drawer-actions"><Button disabled={busy} onClick={close}>取消</Button><Button type="primary" loading={busy} onClick={()=>form.submit()}>保存</Button></div>}>
    {error&&<Alert type="error" showIcon message="保存未完成" description={error} className="section-gap" />}
    <Form<T> form={form} layout="vertical" initialValues={initialValues as never} onValuesChange={()=>setDirty(true)} onFinish={async value=>{
      if(lock.current)return;lock.current=true;setBusy(true);setError(undefined);
      try{await onSave(value);onClose();}catch(reason){setError(reason instanceof Error?reason.message:'保存失败，请重试');}
      finally{lock.current=false;setBusy(false);}
    }}>{typeof children==='function'?children(form):children}</Form>
  </Drawer>;
}
