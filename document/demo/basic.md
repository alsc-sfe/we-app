---
order: 1
title: demo1
---

PC模板

````jsx
import TemplatePc from "@alife/we-app";

class Demo extends React.Component {
  componentDidMount() {}

  render() {
    return (
      <TemplatePc title="test" />
    );
  }
}

ReactDOM.render(<Demo />, mountNode);
````
