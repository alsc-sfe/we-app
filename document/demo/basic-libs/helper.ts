export function checkWhile(whileCondition: () => boolean, timeout: number = 5000, duration: number = 50) {
  return new Promise((resolve, reject) => {
    const start = new Date().getTime();

    let result = whileCondition();
    if (result) {
      resolve();
      return;
    }

    const t = setInterval(() => {
      result = whileCondition();
      if (result) {
        clearInterval(t);
        resolve();
      } else if (new Date().getTime() - start >= timeout) {
        clearInterval(t);
        reject(`checkWhile failed in ${timeout}ms`);
      }
    }, duration);
  });
}
