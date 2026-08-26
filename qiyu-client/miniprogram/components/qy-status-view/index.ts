import { imagePlaceholderLabels } from '../../constants/ui';

Component({
  properties: {
    type: { type: String, value: 'empty' },
    title: { type: String, value: '' },
    description: { type: String, value: '' },
    actionText: { type: String, value: '' }
  },
  data: {
    placeholderLabel: imagePlaceholderLabels.brand
  },
  methods: {
    onAction() {
      this.triggerEvent('retry');
    }
  }
});
