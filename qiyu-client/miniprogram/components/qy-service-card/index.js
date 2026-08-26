"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("../../constants/ui");
Component({
    properties: {
        service: { type: Object, value: {} },
        variant: { type: String, value: 'list' },
        metaCopy: { type: Object, value: { durationUnit: '', servedPrefix: '', servedSuffix: '' } }
    },
    data: {
        placeholderLabel: ui_1.imagePlaceholderLabels.brand
    },
    methods: {
        onSelect() {
            const service = this.data.service;
            this.triggerEvent('select', { id: service?.id });
        }
    }
});
