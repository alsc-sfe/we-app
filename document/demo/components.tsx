

export function Page404() {
  return (
    <div>
      <h1>This is 404 page</h1>
      <div>Please check pages routes</div>
    </div>
  );
}

export function Page403(props) {
  console.log('403 props', props);
  return (
    <div>
      <h1>This is 403 page</h1>
      <div>原因：
      {!props.hasOrg && '请创建组织'}
      {!props.hasOrg && '请签约'}
      {!props.orgPass && '组织不匹配'}
      </div>
    </div>
  );
}

export function Page500(props) {
  console.log('500 props', props);
  return (
    <div>
      <h1>This is 500 page</h1>
      <div>{props.error.message}</div>
    </div>
  );
}

export function Loading() {
  return (
    <div>Loading...</div>
  );
}
