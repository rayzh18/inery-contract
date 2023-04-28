const IneryToken = artifacts.require('IneryToken');
const PublicVesting = artifacts.require('PublicVesting');

const truffleAssert = require('truffle-assertions');

const { duration, increaseTimeTo, latestTime } = require('./utils');

const { BN } = web3.utils;

contract('PublicVesting', (accounts) => {
  const amount = new BN('1000000000000000000000000'); // 1M * 10**18
  const price = 120000; // in USDT
  const initalAmount = amount.mul(new BN(40)).div(new BN(100)); // 40%
  const weekAmount = amount.mul(new BN(10)).div(new BN(100)); // 10%
  const owner = accounts[1];
  const beneficiary = accounts[0];
  const tokenDeployer = accounts[2];

  beforeEach(async function () {
    this.token = await IneryToken.new({ from: tokenDeployer });
    await this.token.initialize({ from: tokenDeployer });

    const totalSupply = await this.token.totalSupply();

    this.tge = (await web3.eth.getBlock('latest')).timestamp + 100;

    this.duration = duration.weeks(6);

    this.vesting = await PublicVesting.new({ from: owner });
    await this.vesting.initialize(this.token.address, this.tge, { from: owner });
    await this.vesting.addWhitelisted(beneficiary, 1000000 * price, { from: owner });
    // transfer tokens to vesting contract
    await this.token.transfer(this.vesting.address, totalSupply.mul(new BN(1)).div(new BN(100)), {
      from: tokenDeployer,
    });
  });

  it('cannot be released before TGE time', async function () {
    await truffleAssert.reverts(this.vesting.claim());
  });

  it('should be released after the TGE time', async function () {
    await increaseTimeTo(this.tge + duration.seconds(1));
    const result = await this.vesting.claim({ from: beneficiary }); 

    truffleAssert.eventEmitted(result, 'TokensReleased');
  });


  it('should release proper amount after the TGE time', async function () {
    await increaseTimeTo(this.tge + duration.weeks(1));

    await this.vesting.claim({ from: beneficiary });

    const balance = await this.token.balanceOf(beneficiary);

    assert.ok(balance.eq(initalAmount.add(weekAmount)));
  });

  it('should weekly release tokens during vesting period', async function () {
    const checkpoints = 6;

    for (let i = 1; i < checkpoints; i++) {
      const now = this.tge + i * duration.weeks(1);
      await increaseTimeTo(now);

      await this.vesting.claim({ from: beneficiary });
      
      const balance = await this.token.balanceOf(beneficiary);
      const expectedVesting = initalAmount.add(weekAmount.mul(new BN(i)));

      assert.ok(balance.eq(expectedVesting));
    }
  });

  it('should have released all after end', async function () {
    await increaseTimeTo(this.tge + this.duration);
    await this.vesting.claim({ from: beneficiary });
    const balance = await this.token.balanceOf(beneficiary);
    assert.ok(balance.eq(amount));
  });
});
