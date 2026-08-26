"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const navigation_1 = require("../constants/navigation");
Component({
    data: {
        selected: 0,
        items: navigation_1.tabBarItems
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
        onChange(event) {
            const { path, index } = event.currentTarget.dataset;
            if (index === this.data.selected || !path)
                return;
            wx.switchTab({ url: path });
        }
    }
});
