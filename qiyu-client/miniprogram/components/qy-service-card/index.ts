import { imagePlaceholderLabels } from '../../constants/ui';

Component({
  properties: {
    service: { type: Object, value: {} },
    variant: { type: String, value: 'list' },
    metaCopy: { type: Object, value: { durationUnit: '', servedPrefix: '', servedSuffix: '' } }
  },
  data: {
    placeholderLabel: imagePlaceholderLabels.brand
  },
  methods: {
    onSelect() {
      const service = this.data.service as { id?: string };
      this.triggerEvent('select', { id: service?.id });
    }
  }
});
