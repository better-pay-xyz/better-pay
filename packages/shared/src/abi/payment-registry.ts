/**
 * PaymentRegistry Contract ABI
 *
 * Immutable audit log for payment orders and subscriptions.
 * Events provide onchain transparency without storing state.
 *
 * Events:
 * - OrderCreated: Emitted when a new payment order is registered
 * - PaymentCompleted: Emitted when a payment is completed
 * - SubscriptionCreated: Emitted when a new subscription is registered
 * - SubscriptionPayment: Emitted when a subscription payment is made
 *
 * Functions:
 * - registerOrder: Register a new payment order
 * - recordPayment: Record a completed payment
 * - registerSubscription: Register a new subscription
 * - recordSubscriptionPayment: Record a subscription payment
 */

export const PaymentRegistryABI = [
  {
    "type": "function",
    "name": "recordPayment",
    "inputs": [
      {
        "name": "orderId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "memo",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "recordSubscriptionPayment",
    "inputs": [
      {
        "name": "subscriptionId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerOrder",
    "inputs": [
      {
        "name": "orderId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "currency",
        "type": "string",
        "internalType": "string"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "registerSubscription",
    "inputs": [
      {
        "name": "subscriptionId",
        "type": "string",
        "internalType": "string"
      },
      {
        "name": "customer",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "internalType": "uint256"
      },
      {
        "name": "interval",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "event",
    "name": "OrderCreated",
    "inputs": [
      {
        "name": "orderId",
        "type": "string",
        "indexed": true,
        "internalType": "string"
      },
      {
        "name": "merchant",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "currency",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "PaymentCompleted",
    "inputs": [
      {
        "name": "orderId",
        "type": "string",
        "indexed": true,
        "internalType": "string"
      },
      {
        "name": "customer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "memo",
        "type": "string",
        "indexed": false,
        "internalType": "string"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SubscriptionCreated",
    "inputs": [
      {
        "name": "subscriptionId",
        "type": "string",
        "indexed": true,
        "internalType": "string"
      },
      {
        "name": "merchant",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "customer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "interval",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  },
  {
    "type": "event",
    "name": "SubscriptionPayment",
    "inputs": [
      {
        "name": "subscriptionId",
        "type": "string",
        "indexed": true,
        "internalType": "string"
      },
      {
        "name": "customer",
        "type": "address",
        "indexed": true,
        "internalType": "address"
      },
      {
        "name": "amount",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      },
      {
        "name": "timestamp",
        "type": "uint256",
        "indexed": false,
        "internalType": "uint256"
      }
    ],
    "anonymous": false
  }
] as const;
