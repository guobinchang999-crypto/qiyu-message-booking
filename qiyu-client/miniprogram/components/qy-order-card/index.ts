import { imagePlaceholderLabels } from '../../constants/ui';

Component({
  properties: {
    booking: { type: Object, value: {} },
    dictionaries: { type: Object, value: {} },
    metaCopy: { type: Object, value: { paidPrefix: '' } }
  },
  data: {
    placeholderLabel: imagePlaceholderLabels.service
  },
  methods: {
    onSelect() {
      const booking = this.data.booking as { id?: string };
      this.triggerEvent('select', { id: booking?.id });
    },
    onAction(event: WechatMiniprogram.TouchEvent) {
      const booking = this.data.booking as { id?: string };
      this.triggerEvent('action', {
        id: booking?.id,
        action: event.currentTarget.dataset.action
      });
    }
  }
});
