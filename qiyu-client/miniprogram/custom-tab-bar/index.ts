import { tabBarItems } from '../constants/navigation';

Component({
  data: {
    selected: 0,
    items: tabBarItems
  },
  lifetimes: {
    attached() {
      this.syncSelected();
    }
  },
  pageLifetimes: {
    show() {
      this.syncSelected();
    }
  },
  methods: {
    syncSelected() {
      const current = getCurrentPages().pop()?.route || '';
      const selected = this.data.items.findIndex((item) => current === item.path.replace(/^\//, ''));
      this.setData({ selected: selected < 0 ? 0 : selected });
    },
    onChange(event: WechatMiniprogram.TouchEvent) {
      const { path, index } = event.currentTarget.dataset as { path: string; index: number };
      if (index === this.data.selected || !path) return;
      wx.switchTab({ url: path });
    }
  }
});
