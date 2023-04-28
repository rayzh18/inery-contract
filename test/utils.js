const mineBlock = (web3, reject, resolve) => {
  web3.currentProvider.send(
    {
      method: 'evm_mine',
      jsonrpc: '2.0',
      id: new Date().getTime(),
    },
    (e) => (e ? reject(e) : resolve())
  );
}

const increaseTimestamp = (increase) => {
  return new Promise((resolve, reject) => {
    web3.currentProvider.send(
      {
        method: 'evm_increaseTime',
        params: [increase],
        jsonrpc: '2.0',
        id: new Date().getTime(),
      },
      (e) => (e ? reject(e) : mineBlock(web3, reject, resolve))
    );
  });
}

const increaseTimeTo = async (target) => {
  let now = (await web3.eth.getBlock('latest')).timestamp;
  if (target < now)
    throw Error(
      `Cannot increase current time(${now}) to a moment in the past(${target})`
    );
  let diff = target - now;
  return increaseTimestamp(diff);
}

const latestTime = async () => {
  return await(web3.eth.getBlock('latest')).timestamp;
}

const duration = {
  seconds: function (val) {
    return val;
  },
  minutes: function (val) {
    return val * this.seconds(60);
  },
  hours: function (val) {
    return val * this.minutes(60);
  },
  days: function (val) {
    return val * this.hours(24);
  },
  weeks: function (val) {
    return val * this.days(7);
  },
  months: function (val) {
    return val * this.days(30);
  },
  years: function (val) {
    return val * this.days(365);
  },
};

module.exports = {
  increaseTimestamp,
  increaseTimeTo,
  latestTime,
  duration,
};
