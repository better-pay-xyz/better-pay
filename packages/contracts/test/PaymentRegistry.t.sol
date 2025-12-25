// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/PaymentRegistry.sol";

contract PaymentRegistryTest is Test {
    PaymentRegistry public registry;
    address public merchant;
    address public customer;

    // Declare events for testing
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

    function setUp() public {
        registry = new PaymentRegistry();
        merchant = makeAddr("merchant");
        customer = makeAddr("customer");
    }

    function test_RegisterOrder() public {
        string memory orderId = "ord_test123";
        uint256 amount = 10 ether;
        string memory currency = "USDC";

        vm.prank(merchant);
        vm.expectEmit(true, true, false, true);
        emit OrderCreated(
            orderId,
            merchant,
            amount,
            currency,
            block.timestamp
        );
        registry.registerOrder(orderId, amount, currency);
    }

    function test_RecordPayment() public {
        string memory orderId = "ord_test123";
        string memory memo = "memo_abc";
        uint256 amount = 10 ether;

        vm.prank(customer);
        vm.expectEmit(true, true, false, true);
        emit PaymentCompleted(
            orderId,
            customer,
            amount,
            memo,
            block.timestamp
        );
        registry.recordPayment(orderId, memo, amount);
    }

    function test_RegisterSubscription() public {
        string memory subscriptionId = "sub_test123";
        uint256 amount = 10 ether;
        uint256 interval = 2592000; // 30 days

        vm.prank(merchant);
        vm.expectEmit(true, true, true, true);
        emit SubscriptionCreated(
            subscriptionId,
            merchant,
            customer,
            amount,
            interval,
            block.timestamp
        );
        registry.registerSubscription(subscriptionId, customer, amount, interval);
    }

    function test_RecordSubscriptionPayment() public {
        string memory subscriptionId = "sub_test123";
        uint256 amount = 10 ether;

        vm.prank(customer);
        vm.expectEmit(true, true, false, true);
        emit SubscriptionPayment(
            subscriptionId,
            customer,
            amount,
            block.timestamp
        );
        registry.recordSubscriptionPayment(subscriptionId, amount);
    }
}
