import { checkWhile } from './helper';

export default async () => {
  await checkWhile(() => {
    // @ts-ignore
    return window['@alife/cook-pc'];
  });
  // @ts-ignore
  window.System.register('@alife/cook-pc', ['React', 'ReactDOM'], (exports) => {
    return {
      setters: [
        function () {},
      ],
      execute() {
        exports({
          // @ts-ignore
          default: window['@alife/cook-pc'],
          __useDefault: true,
        });
      },
    };
  });
  // @ts-ignore
  window.System.register('cookPc', ['React', 'ReactDOM'], (exports) => {
    return {
      setters: [
        function () {},
      ],
      execute() {
        exports({
          // @ts-ignore
          default: window['@alife/cook-pc'],
          __useDefault: true,
        });
      },
    };
  });
  // @ts-ignore
  window.System.register('antd', ['React', 'ReactDOM'], (exports) => {
    return {
      setters: [
        function () {},
      ],
      execute() {
        exports({
          // @ts-ignore
          default: window['@alife/cook-pc'],
          __useDefault: true,
        });
      },
    };
  });
};
