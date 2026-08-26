import { imagePlaceholderLabels } from '../../constants/ui';

Component({
  properties: {
    store: { type: Object, value: {} },
    variant: { type: String, value: 'list' },
    metaCopy: { type: Object, value: { ratingUnit: '', nextAvailablePrefix: '' } }
  },
  data: {
    placeholderLabel: imagePlaceholderLabels.brand
  },
  methods: {
    onSelect() {
      const store = this.data.store as { id?: string };
      this.triggerEvent('select', { id: store?.id });
    }
  }
});
