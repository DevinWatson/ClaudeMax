---
name: aws-managed-blockchain
description: Use when designing, provisioning, securing, or operating Amazon Managed Blockchain — Hyperledger Fabric networks (networks, members, peer nodes, channels, chaincode, the ordering service) and Ethereum/public-network nodes (AMB Access), VPC endpoints/PrivateLink connectivity, certificate-based Fabric identities, member governance/voting, and node sizing (Amazon Managed Blockchain). Loads the Managed Blockchain knowledge: create a Fabric network + member + peer node (or an Ethereum node), connect via VPC endpoint, secure identities, and verify the node is healthy. Consumed by the Managed Blockchain specialist and by the AWS role team (aws-iac-engineer / aws-cloud-architect) when they handle blockchain workloads.
allowed-tools: Read, Grep, Glob, Bash
category: cloud
tags: [aws, managed-blockchain, hyperledger-fabric, ethereum, specialized]
version: 1.0.0
maintainer: devinwatson@gmail.com
license: MIT
status: stable
---

# Amazon Managed Blockchain

A managed service for creating and operating blockchain networks. Two offerings: **Managed
Blockchain Networks** (a managed **Hyperledger Fabric** consortium network) and **AMB Access**
(managed nodes/endpoints for public chains such as **Ethereum**/Bitcoin). It removes the work of
provisioning, the ordering service, certificate authority, and node patching.

## Core concepts and components (Hyperledger Fabric)
- **Network** — the Fabric network, with a framework version, edition (Starter/Standard), and a
  managed **ordering service** and **certificate authority (CA)**.
- **Member** — an organization in the consortium (each AWS account joins as a member); members
  govern the network by **proposal/voting**.
- **Peer node** — a member's node that maintains the ledger and runs **chaincode**; sized by
  instance type and given storage.
- **Channel** — a private ledger/communication scope among a subset of members; **chaincode** is the
  smart-contract logic deployed to a channel.

## Core concepts (AMB Access / public networks)
- A managed **node** (e.g., Ethereum) exposing a JSON-RPC/WebSocket endpoint; **token-based or
  Sig v4** access, reachable via PrivateLink. No consortium/membership — just managed node access.

## Configuration and sizing
- Fabric: pick framework version + edition; size peer node instance types by chaincode/ledger load;
  one CA per member. Start with Starter for dev, Standard for production HA. Ethereum: pick the
  network (mainnet/testnet) and instance type; choose query (Sig v4) vs dedicated node.

## Security and IAM
- Fabric uses **certificate-based identities** issued by the member CA (admin + user certs) — manage
  and rotate them; AWS IAM controls the AMB control plane, not on-ledger identity. Connect clients
  over a **VPC interface endpoint (PrivateLink)**; restrict with security groups.
- For Ethereum/AMB Access, use Sig v4/token auth and least-privilege IAM on the endpoint.

## Cost levers
- Largest levers: peer-node instance type/count and the ordering service (network membership fee),
  plus per-node hours and data written/transferred. Use Starter edition and small instances for
  dev; stop/right-size idle nodes; share endpoints where possible.

## Scaling and limits
- Quotas bound members per network, peer nodes per member, and networks per Region; Fabric framework
  versions are fixed sets. Adding members requires a governance vote. Raise quotas via support.

## Operating procedure
1. **Provision** — create the **Fabric network** + first **member** (Terraform support is partial;
   primarily use CLI/CloudFormation `aws managedblockchain create-network` /
   `AWS::ManagedBlockchain::Member`), then create a **peer node** (`create-node`). For Ethereum, use
   AMB Access to create a managed node.
2. **Configure** — enroll the member CA admin, create the **channel**, install/instantiate
   **chaincode**, and set up the **VPC interface endpoint (PrivateLink)** for client access.
3. **Secure** — issue least-privilege Fabric user certs, rotate CA credentials, lock the VPC
   endpoint with security groups, and scope IAM on the AMB control plane (and Ethereum endpoint).
4. **Verify** — apply [[verify-by-running]]: `aws managedblockchain get-network`/`get-member`/
   `get-node` show `AVAILABLE`, the VPC endpoint resolves, and a Fabric peer query (or an Ethereum
   JSON-RPC `eth_blockNumber` call) returns ledger state.

## Inputs
Framework (Fabric vs Ethereum/public), consortium members + governance model, chaincode/channels,
node sizing + edition, VPC/PrivateLink connectivity, certificate-identity management, compliance.

## Output
A blockchain network/node (Fabric network + member + peer node + channel + chaincode, or a managed
Ethereum node), a PrivateLink endpoint, managed certificate identities/IAM, and verification of an
`AVAILABLE` node plus a working ledger query.

## Notes
- Gotchas: Terraform coverage is partial — `aws_managedblockchain_member` exists but networks/nodes
  often need CLI/CloudFormation; the first member is created with the network; Fabric identity is
  cert-based (not IAM), so cert lifecycle is on you; deleting the last member tears down the
  network; framework versions and editions are not interchangeable in place.
- IaC/CLI: Terraform `aws_managedblockchain_member` (partial). CLI `aws managedblockchain
  create-network`, `create-member`, `create-node`, `create-proposal`, `vote-on-proposal`,
  `get-network`, `get-node`; `aws managedblockchain-query` for AMB Access. CloudFormation
  `AWS::ManagedBlockchain::Member`, `AWS::ManagedBlockchain::Node`, `AWS::ManagedBlockchain::Accessor`.
