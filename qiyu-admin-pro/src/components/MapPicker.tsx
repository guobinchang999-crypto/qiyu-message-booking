import { EnvironmentOutlined } from '@ant-design/icons';
import { Alert } from 'antd';
import { AMAP_CONFIG } from '@/config/map';

export interface MapPoint {
  longitude?: number;
  latitude?: number;
}

interface MapPickerProps {
  value?: MapPoint;
  onChange?: (point: MapPoint) => void;
}

/**
 * 门店地图选点占位组件。
 * 配置 AMAP_CONFIG.key 后可接入高德地图 JS API：点击地图选点 + 逆地理编码回填地址与经纬度。
 * 未配置 key 时显示提示，地址字段保持手动录入兜底。
 */
export default function MapPicker({ value }: MapPickerProps) {
  const hasKey = !!AMAP_CONFIG.key;
  return (
    <Alert
      type={hasKey ? 'info' : 'warning'}
      showIcon
      icon={<EnvironmentOutlined />}
      message={hasKey ? '地图选点' : '地图选点（待配置高德地图密钥）'}
      description={
        value?.longitude != null && value?.latitude != null
          ? `已选坐标：${Number(value.longitude).toFixed(6)}, ${Number(value.latitude).toFixed(6)}${hasKey ? '' : '（当前为手动录入）'}`
          : hasKey
            ? '点击地图选择门店位置，系统会自动回填地址与经纬度。'
            : '配置 AMAP_CONFIG.key 后即可在地图上点选门店位置并自动回填地址与经纬度。'
      }
      style={{ marginBottom: 16 }}
    />
  );
}
