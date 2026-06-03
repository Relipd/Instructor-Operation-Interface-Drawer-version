import { Toast } from '@douyinfe/semi-ui';

export const ElMessage = {
  success(msg: string) {
    Toast.success(msg);
  },
  error(msg: string) {
    Toast.error(msg);
  },
  info(msg: string) {
    Toast.info(msg);
  },
  warning(msg: string) {
    Toast.warning(msg);
  },
};
