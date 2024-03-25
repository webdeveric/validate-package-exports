import { describe, expect, it } from 'vitest';

import { getModuleName } from './getModuleName.js';

describe('getModuleName()', () => {
  it('Returns a string', () => {
    expect(getModuleName('some-package', '.')).toEqual('some-package');
    expect(getModuleName('some-package', './package.json')).toEqual('some-package/package.json');
    expect(getModuleName('some-package', './some-module')).toEqual('some-package/some-module');
    expect(getModuleName('@scope/package', './some-module.js')).toEqual('@scope/package/some-module.js');
  });
});
