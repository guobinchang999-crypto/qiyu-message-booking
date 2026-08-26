"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("../../constants/ui");
Component({
    properties: {
        type: { type: String, value: 'empty' },
        title: { type: String, value: '' },
        description: { type: String, value: '' },
        actionText: { type: String, value: '' }
    },
    data: {
        placeholderLabel: ui_1.imagePlaceholderLabels.brand
    },
    methods: {
        onAction() {
            this.triggerEvent('retry');
        }
    }
});
