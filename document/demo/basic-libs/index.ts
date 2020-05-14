import cookPc from './cook-pc';
import antDesignIcons from './ant-design-icons';

export default () => {
  return Promise.all([
    cookPc(),
    antDesignIcons(),
  ]);
};
