const IneryToken = artifacts.require('IneryToken');
const DevelopmentVesting = artifacts.require('DevelopmentVesting');

const truffleAssert = require('truffle-assertions');

const { duration, increaseTimeTo, latestTime } = require('./utils');

const { BN } = web3.utils;

contract('DevelopmentVesting', (accounts) => {
  const amount = new BN('1000000000000000000000000'); // 1M * 10**18
  const initalAmount = amount.mul(new BN(10)).div(new BN(100)); // 10%
  const linearPart = amount.sub(initalAmount);
  const owner = accounts[1];
  const beneficiary = accounts[0];
  const tokenDeployer = accounts[2];

  beforeEach(async function () {
    this.token = await IneryToken.new({ from: tokenDeployer });
    await this.token.initialize({ from: tokenDeployer });

    const totalSupply = await this.token.totalSupply();

    this.tge = (await web3.eth.getBlock('latest')).timestamp + 100;
    this.cliff = this.tge + duration.months(1);

    this.duration = duration.months(15);

    this.vesting = await DevelopmentVesting.new({ from: owner });
    await this.vesting.initialize(this.token.address, this.tge, { from: owner });
    await this.vesting.addWhitelisted(beneficiary, 1000000, { from: owner });

    // transfer tokens to vesting contract
    await this.token.transfer(this.vesting.address, totalSupply.mul(new BN(10)).div(new BN(100)), {
      from: tokenDeployer,
    });
  });

  it('cannot be released before TGE time', async function () {
    await truffleAssert.reverts(this.vesting.claim());
  });

  it('should be released after the cliff time', async function () {
    await increaseTimeTo(this.cliff + duration.seconds(1));
    const result = await this.vesting.claim({ from: beneficiary }); 

    truffleAssert.eventEmitted(result, 'TokensReleased');
  });


  it('should release proper amount after the cliff time', async function () {
    await increaseTimeTo(this.cliff + duration.weeks(1));

    const { receipt } = await this.vesting.claim({ from: beneficiary });

    const releaseTime = (await web3.eth.getBlock(receipt.blockNumber))
      .timestamp;

    const balance = await this.token.balanceOf(beneficiary);

    const elapsed = new BN(releaseTime - this.cliff);

    const durationBN = new BN(this.duration);

    assert.ok(balance.eq(initalAmount.add(linearPart.mul(elapsed).div(durationBN))));
    assert.ok(!balance.eq(linearPart.mul(elapsed).div(durationBN)));
  });

  it('should linearly release tokens during vesting period', async function () {
    const vestingPeriod = this.duration;
    const checkpoints = 4;

    for (let i = 1; i < checkpoints; i++) {
      const now = this.cliff + i * (vestingPeriod / checkpoints);
      await increaseTimeTo(now);

      const { receipt } = await this.vesting.claim({ from: beneficiary });

      const releaseTime = (await web3.eth.getBlock(receipt.blockNumber))
        .timestamp;
      
      const balance = await this.token.balanceOf(beneficiary);
      const expectedVesting = initalAmount.add(linearPart
        .mul(new BN(releaseTime - this.cliff))
        .div(new BN(this.duration)));

      assert.ok(balance.eq(expectedVesting));
    }
  });

  it('should have released all after end', async function () {
    await increaseTimeTo(this.cliff + this.duration);
    await this.vesting.claim({ from: beneficiary });
    const balance = await this.token.balanceOf(beneficiary);
    assert.ok(balance.eq(amount));
  });
});
