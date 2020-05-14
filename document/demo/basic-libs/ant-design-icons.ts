import { checkWhile } from './helper';

export default async () => {
  await checkWhile(() => {
    // @ts-ignore
    return window.AntDesignIcons;
  });
  // @ts-ignore
  window.System.register('AntDesignIcons', [], (exports) => {
    return {
      setters: [
        function () {},
      ],
      execute() {
        exports({
          // @ts-ignore
          default: window.AntDesignIcons,
          __useDefault: true,
        });
      },
    };
  });
};
