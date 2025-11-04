// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title FolioToken
 * @dev ERC-20 민팅형 리워드 토큰
 * - 초기 발행량: 0 (모든 토큰은 활동 기반 민팅)
 * - 민팅 권한: Ownable 패턴으로 blockchain-api만 민팅 가능
 * - 커스텀 기능: 포트폴리오 균형 점수 기반 동적 보상 (백엔드에서 계산)
 */
contract FolioToken is ERC20, Ownable {
    // 이벤트
    event RewardMinted(address indexed to, uint256 amount, string activity);

    constructor() ERC20("FolioToken", "FOLIO") Ownable(msg.sender) {
        // 초기 발행량: 0
        // 모든 토큰은 mintReward 함수를 통해서만 발행됨
    }

    /**
     * @dev 활동 기반 리워드 민팅
     * @param to 리워드를 받을 주소
     * @param amount 민팅할 토큰 수량 (18 decimals)
     * @param activity 활동 타입 (asset_added, portfolio_analysis 등)
     */
    function mintReward(
        address to,
        uint256 amount,
        string memory activity
    ) external onlyOwner {
        require(to != address(0), "FolioToken: cannot mint to zero address");
        require(amount > 0, "FolioToken: amount must be greater than 0");

        _mint(to, amount);
        emit RewardMinted(to, amount, activity);
    }

    /**
     * @dev 여러 주소에 일괄 민팅 (효율성 향상)
     * @param recipients 받을 주소 배열
     * @param amounts 각 주소별 민팅 수량 배열
     * @param activities 각 활동 타입 배열
     */
    function batchMintReward(
        address[] memory recipients,
        uint256[] memory amounts,
        string[] memory activities
    ) external onlyOwner {
        require(
            recipients.length == amounts.length &&
                amounts.length == activities.length,
            "FolioToken: arrays length mismatch"
        );

        for (uint256 i = 0; i < recipients.length; i++) {
            require(
                recipients[i] != address(0),
                "FolioToken: cannot mint to zero address"
            );
            require(amounts[i] > 0, "FolioToken: amount must be greater than 0");

            _mint(recipients[i], amounts[i]);
            emit RewardMinted(recipients[i], amounts[i], activities[i]);
        }
    }

    /**
     * @dev 토큰 소각 (선택적 기능)
     * @param amount 소각할 수량
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }

    /**
     * @dev 소유자 권한으로 토큰 소각
     * @param from 소각할 주소
     * @param amount 소각할 수량
     */
    function burnFrom(address from, uint256 amount) external onlyOwner {
        _burn(from, amount);
    }
}

