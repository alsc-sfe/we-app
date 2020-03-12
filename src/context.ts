let context: any = {};

export function setContext(c: any, value?: any) {
  if (typeof c === 'string') {
    context[c] = value;
    return;
  }

  context = {
    ...context,
    ...c,
  };
}

export function getContext() {
  return context;
}
