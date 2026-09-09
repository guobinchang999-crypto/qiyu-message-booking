import type { ThemeConfig } from 'antd';

/** 品牌主色：鼠尾草绿（沿用现有后台视觉基调） */
export const QIYU_PRIMARY = '#5d806d';
/** 暖棕强调色：用于会员、利用率、头像等少量点缀 */
export const QIYU_WARM = '#b58c5e';
export const QIYU_PRIMARY_LIGHT = '#edf4ee';

export const qiyuTheme: ThemeConfig = {
  token: {
    colorPrimary: QIYU_PRIMARY,
    colorInfo: QIYU_PRIMARY,
    colorLink: QIYU_PRIMARY,
    colorSuccess: '#3F6B4F',
    colorWarning: '#B7793E',
    colorError: '#C25B52',
    colorTextBase: '#26332c',
    colorBgLayout: '#f6f7f5',
    borderRadius: 8,
    fontSize: 14
  },
  components: {
    Layout: {
      headerBg: '#ffffff',
      bodyBg: '#f6f7f5',
      siderBg: '#ffffff'
    },
    Menu: {
      itemSelectedBg: QIYU_PRIMARY_LIGHT,
      itemSelectedColor: QIYU_PRIMARY,
      itemBorderRadius: 8
    },
    Card: {
      borderRadiusLG: 12
    }
  }
};
