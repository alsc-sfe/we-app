export function checkWhile(whileCondition: () => boolean, output: { [p: string]: any } = {}, timeout = 3000, duration = 50) {
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
        reject();
      }
    }, duration);

    output.cancel = () => {
      clearInterval(t);
    };
  });
}

export function loadScript(url: string) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.crossOrigin = 'anonymous';
    script.onload = resolve;
    script.onerror = reject;

    document.querySelector('head').appendChild(script);
  });
}

export function removeScript(url: string) {
  const head = document.querySelector('head');
  const script = head.querySelector(`[src="${url}"]`);
  script && head.removeChild(script);
}

export function loadCSS(url: string) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = resolve;
    link.onerror = reject;

    document.querySelector('head').appendChild(link);
  });
}

export function removeCSS(url: string) {
  const head = document.querySelector('head');
  const link = head.querySelector(`[rel="stylesheet"][href="${url}"]`);
  link && head.removeChild(link);
}
