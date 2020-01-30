import React, { Component } from 'react';
import classNames from 'classnames';
import { Card } from 'antd';

import { ComponentProps } from './props-type';
import './style';

const prefix = 'mo-template-pc';

class TemplatePc extends Component<ComponentProps, any> {
  static defaultProps = {
    title: ''
  };

  render() {
    const { className, ...others } = this.props;
    const cls = classNames({
      [`${prefix}`]: true,
      [className]: className,
    });

    return (
      <div {...others} className={cls}>
        <Card title={this.props.title} extra={<a href="/">More</a>} style={{ width: 300 }}>
          <p>1122</p>
          <p>2233</p>
        </Card>
      </div>
    );
  }
}

export default TemplatePc;
