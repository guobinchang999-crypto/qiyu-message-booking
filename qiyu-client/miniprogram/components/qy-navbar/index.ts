import { pageRoutes } from '../../constants/navigation';

Component({
  properties: {
    title: { type: String, value: '' },
    showBack: { type: Boolean, value: true }
  },
  data: {
    statusBarHeight: 44,
    navHeight: 44
  },
  lifetimes: {
    attached() {
      const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync();
      this.setData({
        statusBarHeight: windowInfo.statusBarHeight || 44,
        navHeight: 44
      });
    }
  },
  methods: {
    back() {
      if (!this.data.showBack) return;
      const pages = getCurrentPages();
      if (pages.length > 1) {
        wx.navigateBack();
        return;
      }
      wx.switchTab({ url: pageRoutes.home });
    }
  }
});
