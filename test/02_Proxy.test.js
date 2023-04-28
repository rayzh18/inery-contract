const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

const IneryToken = artifacts.require('IneryToken');
const IneryTokenV2 = artifacts.require('IneryTokenV2');

describe('Upgrades', () => {
  it('should work as upgradeable contract', async () => {
    const inery = await deployProxy(IneryToken, []);
    const inery2 = await upgradeProxy(inery.address, IneryTokenV2);

    const name = await inery2.name();
    assert.equal(name.toString(), 'INERY');
  });
});
