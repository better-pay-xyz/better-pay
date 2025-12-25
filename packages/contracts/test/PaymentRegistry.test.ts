import { expect } from 'chai'
import { ethers } from 'hardhat'
import { PaymentRegistry } from '../typechain-types'

describe('PaymentRegistry', () => {
  let registry: PaymentRegistry
  let merchant: any
  let customer: any

  beforeEach(async () => {
    [merchant, customer] = await ethers.getSigners()

    const PaymentRegistryFactory = await ethers.getContractFactory('PaymentRegistry')
    registry = await PaymentRegistryFactory.deploy()
    await registry.waitForDeployment()
  })

  describe('registerOrder', () => {
    it('should emit OrderCreated event', async () => {
      const orderId = 'ord_test123'
      const amount = ethers.parseUnits('10', 18)
      const currency = 'USDC'

      const tx = await registry.connect(merchant).registerOrder(orderId, amount, currency)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt!.blockNumber)

      await expect(tx)
        .to.emit(registry, 'OrderCreated')
        .withArgs(orderId, merchant.address, amount, currency, block!.timestamp)
    })
  })

  describe('recordPayment', () => {
    it('should emit PaymentCompleted event', async () => {
      const orderId = 'ord_test123'
      const memo = 'memo_abc'
      const amount = ethers.parseUnits('10', 18)

      const tx = await registry.connect(customer).recordPayment(orderId, memo, amount)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt!.blockNumber)

      await expect(tx)
        .to.emit(registry, 'PaymentCompleted')
        .withArgs(orderId, customer.address, amount, memo, block!.timestamp)
    })
  })

  describe('registerSubscription', () => {
    it('should emit SubscriptionCreated event', async () => {
      const subscriptionId = 'sub_test123'
      const amount = ethers.parseUnits('10', 18)
      const interval = 2592000 // 30 days in seconds

      const tx = await registry.connect(merchant).registerSubscription(
        subscriptionId,
        customer.address,
        amount,
        interval
      )
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt!.blockNumber)

      await expect(tx)
        .to.emit(registry, 'SubscriptionCreated')
        .withArgs(
          subscriptionId,
          merchant.address,
          customer.address,
          amount,
          interval,
          block!.timestamp
        )
    })
  })

  describe('recordSubscriptionPayment', () => {
    it('should emit SubscriptionPayment event', async () => {
      const subscriptionId = 'sub_test123'
      const amount = ethers.parseUnits('10', 18)

      const tx = await registry.connect(customer).recordSubscriptionPayment(subscriptionId, amount)
      const receipt = await tx.wait()
      const block = await ethers.provider.getBlock(receipt!.blockNumber)

      await expect(tx)
        .to.emit(registry, 'SubscriptionPayment')
        .withArgs(
          subscriptionId,
          customer.address,
          amount,
          block!.timestamp
        )
    })
  })
})
