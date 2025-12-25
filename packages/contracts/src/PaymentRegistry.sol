// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PaymentRegistry
 * @notice Immutable audit log for payment orders and subscriptions
 * @dev Events provide onchain transparency without storing state
 */
contract PaymentRegistry {
    event OrderCreated(
        string indexed orderId,
        address indexed merchant,
        uint256 amount,
        string currency,
        uint256 timestamp
    );

    event PaymentCompleted(
        string indexed orderId,
        address indexed customer,
        uint256 amount,
        string memo,
        uint256 timestamp
    );

    event SubscriptionCreated(
        string indexed subscriptionId,
        address indexed merchant,
        address indexed customer,
        uint256 amount,
        uint256 interval,
        uint256 timestamp
    );

    event SubscriptionPayment(
        string indexed subscriptionId,
        address indexed customer,
        uint256 amount,
        uint256 timestamp
    );

    /**
     * @notice Register a new payment order
     * @param orderId Unique order identifier
     * @param amount Payment amount
     * @param currency Currency symbol (e.g., "USDC")
     */
    function registerOrder(
        string calldata orderId,
        uint256 amount,
        string calldata currency
    ) external {
        emit OrderCreated(
            orderId,
            msg.sender,
            amount,
            currency,
            block.timestamp
        );
    }

    /**
     * @notice Record a completed payment
     * @param orderId Order identifier
     * @param memo Payment memo for matching
     * @param amount Payment amount
     */
    function recordPayment(
        string calldata orderId,
        string calldata memo,
        uint256 amount
    ) external {
        emit PaymentCompleted(
            orderId,
            msg.sender,
            amount,
            memo,
            block.timestamp
        );
    }

    /**
     * @notice Register a new subscription
     * @param subscriptionId Unique subscription identifier
     * @param customer Customer address
     * @param amount Subscription amount per interval
     * @param interval Billing interval in seconds
     */
    function registerSubscription(
        string calldata subscriptionId,
        address customer,
        uint256 amount,
        uint256 interval
    ) external {
        emit SubscriptionCreated(
            subscriptionId,
            msg.sender,
            customer,
            amount,
            interval,
            block.timestamp
        );
    }

    /**
     * @notice Record a subscription payment
     * @param subscriptionId Subscription identifier
     * @param amount Payment amount
     */
    function recordSubscriptionPayment(
        string calldata subscriptionId,
        uint256 amount
    ) external {
        emit SubscriptionPayment(
            subscriptionId,
            msg.sender,
            amount,
            block.timestamp
        );
    }
}
