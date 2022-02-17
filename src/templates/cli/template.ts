import { Api } from '../../lib/api';

const template = (root: Api): void => {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(root, null, ' '));
};

export {
  template
};
