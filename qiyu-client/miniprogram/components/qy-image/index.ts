import { imagePlaceholderLabels } from '../../constants/ui';

Component({
  properties: {
    src: { type: String, value: '', observer() { this.setData({ failed: false }); } },
    label: { type: String, value: imagePlaceholderLabels.brand },
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
