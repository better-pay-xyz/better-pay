import { ethers } from 'hardhat'

async function main() {
  console.log('Deploying PaymentRegistry...')

  const PaymentRegistry = await ethers.getContractFactory('PaymentRegistry')
  const registry = await PaymentRegistry.deploy()

  await registry.waitForDeployment()

  const address = await registry.getAddress()
  console.log(`PaymentRegistry deployed to: ${address}`)

  // Save the address to update constants
  console.log('\nUpdate packages/shared/src/constants/tempo.ts with:')
  console.log(`export const PAYMENT_REGISTRY_ADDRESS_TESTNET = '${address}'`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
