"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("../../constants/ui");
Component({
    properties: {
        store: { type: Object, value: {} },
        variant: { type: String, value: 'list' },
        metaCopy: { type: Object, value: { ratingUnit: '', nextAvailablePrefix: '' } }
    },
    data: {
        placeholderLabel: ui_1.imagePlaceholderLabels.brand
    },
    methods: {
        onSelect() {
            const store = this.data.store;
            this.triggerEvent('select', { id: store?.id });
        }
    }
});
