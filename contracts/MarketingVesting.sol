// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract MarketingVesting is Initializable, OwnableUpgradeable, ReentrancyGuardUpgradeable {
    using SafeMathUpgradeable for uint256;
    using SafeERC20Upgradeable for IERC20Upgradeable;

    /* the TGE time of the INERY */
    uint256 private tgeTime;

	/* the cliff time of the marketing vesting */
    uint256 private cliffTime;

	/* the duration of the marketing vesting */
    uint256 private duration;

    /* the address of the token contract */
    IERC20Upgradeable private tokenReward;

	/* the balances (in INERY) of all marketing members */
	mapping(address => uint256) public balanceOfINERY;

	/* the whitelist of the marketing team */
	mapping(address => bool) public whitelist;

	/* the amount of the token already released */
	mapping(address => uint256) public releasedAmount;

  	event TokensReleased(address addr, uint256 amount);

    function initialize(
        IERC20Upgradeable _token,
        uint256 _tge
    ) public initializer {
		__Ownable_init();
		__ReentrancyGuard_init();

        tokenReward = _token;
        tgeTime = _tge;
		cliffTime = tgeTime;	// no cliff
		duration = 60 * 60 * 24 * 30 * 9; // 9 months (180 days)
    }

    modifier onlyWhitelisted() {
        require(whitelist[_msgSender()] == true, "Caller is not whitelisted");
        _;
    }

	function updatetgeTime(uint256 _tge) external onlyOwner {
		tgeTime = _tge;
		cliffTime = tgeTime;		// no cliff
	}

	function checkINERYFunds(address addr) external view returns (uint256) {
		return balanceOfINERY[addr];
	}

	function isWhitelisted(address addr) external view returns (bool) {
		return whitelist[addr];
	}

	function addWhitelisted(address addr, uint256 amount) external onlyOwner {
		whitelist[addr] = true;
        balanceOfINERY[addr] = balanceOfINERY[addr].add(amount * 10**18);
	}

	function removeWhitelisted(address addr) external onlyOwner {
		whitelist[addr] = false;
	}

    modifier afterClosed() {
        require(block.timestamp >= tgeTime, "Before-TGE");
        _;
    }

	/**
	 * @dev
	 * Transfers vested tokens to beneficiary.
	 */
	function claim() external afterClosed onlyWhitelisted nonReentrant {
		require(balanceOfINERY[msg.sender] > 0, "Non-contribution");
		
		uint256 unreleasedAmount = _releasableAmount(msg.sender);
		require(unreleasedAmount > 0, "All-claimed");
		
		uint256 balance = tokenReward.balanceOf(address(this));
		require(balance >= unreleasedAmount, "Lack-of-funds");
		
		releasedAmount[msg.sender] = releasedAmount[msg.sender].add(unreleasedAmount);

		tokenReward.safeTransfer(msg.sender, unreleasedAmount);

		emit TokensReleased(msg.sender, unreleasedAmount);
	}

	/**
	 * @dev Calculates the amount that has already vested but hasn't been released yet.
	 * @param addr beneficiary
	 */
	function _releasableAmount(address addr) private view returns (uint256) {
		return _vestedAmount(addr).sub(releasedAmount[addr]);
	}

	/**
     * @dev Calculates the amount that has already vested.
     * @param addr beneficiary
     */
	function _vestedAmount(address addr) private view returns (uint256) {
		// before TGE
		if (block.timestamp < cliffTime) {
			return 0;
		// after TGE + duration
		} else if (block.timestamp > cliffTime.add(duration)) {
			return balanceOfINERY[addr];
		// linear part during 9 months
		} else {
			uint256 initialAmount = balanceOfINERY[addr].mul(5).div(100); // 5% after cliff time
			uint256 linearPart = balanceOfINERY[addr].sub(initialAmount);
			return initialAmount.add(linearPart.mul(block.timestamp.sub(cliffTime)).div(duration));
		}
	}
}
