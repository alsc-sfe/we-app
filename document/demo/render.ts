import React from 'react';
import ReactDOM from 'react-dom';

export default {
  mount(Component, container, customProps) {
    ReactDOM.render(React.createElement(Component, customProps), container);
  },
  unmount(container) {
    ReactDOM.unmountComponentAtNode(container);
  },
};
