"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("../../constants/ui");
Component({
    properties: {
        src: { type: String, value: '', observer() { this.setData({ failed: false }); } },
        label: { type: String, value: ui_1.imagePlaceholderLabels.brand },
        height: { type: String, value: '132rpx' },
        radius: { type: String, value: '16rpx' }
    },
    data: {
        failed: false
    },
    methods: {
        onError() {
            this.setData({ failed: true });
        }
    }
});
