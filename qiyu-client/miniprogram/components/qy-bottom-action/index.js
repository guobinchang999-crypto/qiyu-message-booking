"use strict";
Component({
    properties: {
        primaryText: { type: String, value: '' },
        secondaryText: { type: String, value: '' },
        loading: { type: Boolean, value: false },
        disabled: { type: Boolean, value: false }
    },
    methods: {
        onPrimary() {
            if (this.data.disabled || this.data.loading)
                return;
            this.triggerEvent('primary');
        },
        onSecondary() {
            if (this.data.disabled || this.data.loading)
                return;
            this.triggerEvent('secondary');
        }
    }
});
