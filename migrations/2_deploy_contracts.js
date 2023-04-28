const { deployProxy } = require('@openzeppelin/truffle-upgrades');
const BN = require('bn.js');
const fs = require('fs');

const IneryToken = artifacts.require('IneryToken');
const StrategicVesting = artifacts.require('StrategicVesting');
const PreSeedVesting = artifacts.require('PreSeedVesting');
const SeedVesting = artifacts.require('SeedVesting');
const PrivateAVesting = artifacts.require('PrivateAVesting');
const PublicVesting = artifacts.require('PublicVesting');
const TeamVesting = artifacts.require('TeamVesting');
const AdvisorVesting = artifacts.require('AdvisorVesting');
const MarketingVesting = artifacts.require('MarketingVesting');
const DevelopmentVesting = artifacts.require('DevelopmentVesting');

module.exports = async function (deployer) {
  const ineryToken = await deployProxy(IneryToken, [], { deployer });
  console.log('IneryToken contract is deployed at', ineryToken.address);

  const totalSupply = await ineryToken.totalSupply();
  console.log("TotalSupply is", totalSupply.toString());

  // For Upgrade :
  // const instance = await upgradeProxy(existing.address, BoxV2, { deployer });
  // console.log("Upgraded", instance.address);

  
  // Strategic Vesting 
  const strategicVesting = await deployProxy(StrategicVesting, [ineryToken.address, 0], { deployer });
  console.log('Strategic contract is deployed at', strategicVesting.address);

  const strategicAllocation = totalSupply.mul(new BN(3)).div(new BN(100));
  console.log("Strategic total allocation is ", strategicAllocation.toString());
  await ineryToken.transfer(strategicVesting.address, strategicAllocation.toString());
  const balanceStrategic = await ineryToken.balanceOf(strategicVesting.address);
  console.log("Strategic vesting contract has ", balanceStrategic.toString(), "INERY");

  // PreSeed Vesting 
  const preSeedVesting = await deployProxy(PreSeedVesting, [ineryToken.address, 0], { deployer });
  console.log('PreSeed contract is deployed at', strategicVesting.address);

  const preSeedAllocation = totalSupply.mul(new BN(4)).div(new BN(100));
  await ineryToken.transfer(preSeedVesting.address, preSeedAllocation.toString());
  console.log("PreSeed total allocation is ", preSeedAllocation.toString());

  // Seed Vesting 
  const seedVesting = await deployProxy(SeedVesting, [ineryToken.address, 0], { deployer });
  console.log('Seed contract is deployed at', seedVesting.address);

  const seedAllocation = totalSupply.mul(new BN(7)).div(new BN(100));
  await ineryToken.transfer(seedVesting.address, seedAllocation.toString());
  console.log("Seed total allocation is ", seedAllocation.toString());

  // Private A Vesting 
  const privateAVesting = await deployProxy(PrivateAVesting, [ineryToken.address, 0], { deployer });
  console.log('Private A contract is deployed at', privateAVesting.address);

  const privateAAllocation = totalSupply.mul(new BN(7)).div(new BN(100));
  await ineryToken.transfer(privateAVesting.address, privateAAllocation.toString());
  console.log("Private A total allocation is ", privateAAllocation.toString());

  // Public Vesting 
  const publicVesting = await deployProxy(PublicVesting, [ineryToken.address, 0], { deployer });
  console.log('Public contract is deployed at', publicVesting.address);

  const publicAllocation = totalSupply.mul(new BN(1)).div(new BN(100));
  await ineryToken.transfer(publicVesting.address, publicAllocation.toString());
  console.log("Public total allocation is ", publicAllocation.toString());

  // Team Vesting 
  const teamVesting = await deployProxy(TeamVesting, [ineryToken.address, 0], { deployer });
  console.log('Team contract is deployed at', teamVesting.address);

  const teamAllocation = totalSupply.mul(new BN(5)).div(new BN(100));
  await ineryToken.transfer(teamVesting.address, teamAllocation.toString());
  console.log("Team total allocation is ", teamAllocation.toString());

  // Advisor Vesting 
  const advisorVesting = await deployProxy(AdvisorVesting, [ineryToken.address, 0], { deployer });
  console.log('Advisor contract is deployed at', advisorVesting.address);

  const advisorAllocation = totalSupply.mul(new BN(3)).div(new BN(100));
  await ineryToken.transfer(advisorVesting.address, advisorAllocation.toString());
  console.log("Advisor total allocation is ", advisorAllocation.toString());

  // Marketing Vesting 
  const marketingVesting = await deployProxy(MarketingVesting, [ineryToken.address, 0], { deployer });
  console.log('Marketing contract is deployed at', marketingVesting.address);

  const marketingAllocation = totalSupply.mul(new BN(5)).div(new BN(100));
  await ineryToken.transfer(marketingVesting.address, marketingAllocation.toString());
  console.log("Marketing total allocation is ", marketingAllocation.toString());

  // Development Vesting 
  const developmentVesting = await deployProxy(DevelopmentVesting, [ineryToken.address, 0], { deployer });
  console.log('Development contract is deployed at', developmentVesting.address);

  const developmentAllocation = totalSupply.mul(new BN(10)).div(new BN(100));
  await ineryToken.transfer(developmentVesting.address, developmentAllocation.toString());
  console.log("Development total allocation is ", developmentAllocation.toString());

  // Setup whitelist on Strategic Vesting contract
  
  let text = fs.readFileSync("./migrations/whitelist.csv");
  let whitelist = text.toString().replace(/\r\n/g,'\n').split("\n");

  for (let i = 0; i < whitelist.length; i ++) {
    const words = whitelist[i].split(',');
    const addr = words[0];
    const amount = words[1];
    if (addr.length == 42 && amount) {
      await strategicVesting.addWhitelisted(addr, amount);  
    }
  }
};
