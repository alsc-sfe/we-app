export function parseUri(str: string) {
  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // MIT License
  // http://blog.stevenlevithan.com/archives/parseuri
  const parseOptions = {
    strictMode: true,
    key: ['href', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'pathname', 'directory', 'file', 'query', 'anchor'],
    q: {
      name: 'queryKey',
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g,
    },
    parser: {
      // eslint-disable-next-line
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      // eslint-disable-next-line
      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/,
    },
  };

  const o = parseOptions;
  const m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str);
  const uri: { [prop: string]: any } = {};
  let i = 14;

  while (i--) uri[o.key[i]] = m[i] || '';

  uri[o.q.name] = {};
  uri[o.key[12]].replace(o.q.parser, ($0, $1, $2) => {
    if ($1) uri[o.q.name][$1] = $2;
  });

  // hash
  uri.hash = '';
  if (uri.relative.indexOf('#') > -1) {
    uri.hash = uri.relative.replace(uri.pathname, '');
  }

  uri.source = uri.href;
  uri.hostname = uri.host;
  uri.search = uri.query ? '?' + uri.query : '';

  return uri as Location;
}
