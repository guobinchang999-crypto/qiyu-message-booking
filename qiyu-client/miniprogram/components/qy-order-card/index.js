"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ui_1 = require("../../constants/ui");
Component({
    properties: {
        booking: { type: Object, value: {} },
        dictionaries: { type: Object, value: {} },
        metaCopy: { type: Object, value: { paidPrefix: '' } }
    },
    data: {
        placeholderLabel: ui_1.imagePlaceholderLabels.service
    },
    methods: {
        onSelect() {
            const booking = this.data.booking;
            this.triggerEvent('select', { id: booking?.id });
        },
        onAction(event) {
            const booking = this.data.booking;
            this.triggerEvent('action', {
                id: booking?.id,
                action: event.currentTarget.dataset.action
            });
        }
    }
});
