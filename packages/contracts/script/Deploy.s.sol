// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/PaymentRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        PaymentRegistry registry = new PaymentRegistry();
        console.log("PaymentRegistry deployed to:", address(registry));
        console.log("\nUpdate packages/shared/src/constants/tempo.ts with:");
        console.log("export const PAYMENT_REGISTRY_ADDRESS_TESTNET = '%s'", address(registry));

        vm.stopBroadcast();
    }
}
