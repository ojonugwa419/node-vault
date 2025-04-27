# Node Vault: Decentralized Node Management

The Node Vault is a Clarity smart contract that provides a secure and decentralized system for tracking and managing nodes on the Stacks blockchain. This project allows Stacks node operators to register, update the status, and deregister their nodes, ensuring transparency and accountability within the network.

## Contract Architecture

The `node-vault.clar` contract has the following key components:

### Data Structures
- `nodes`: A map that stores node information, including the node ID, metadata, status, and owner.
- `node-owners`: A map that tracks the nodes owned by each principal.

### Public Functions
- `register-node`: Allows users to register a new node with a unique ID and metadata.
- `update-node-status`: Enables node owners to update the status of their registered nodes (active or inactive).
- `get-node-info`: Retrieves the details of a registered node.
- `get-nodes-by-owner`: Returns the list of nodes owned by a specific principal.
- `deregister-node`: Allows node owners to remove their nodes from the system.

### Security Features
- Input validation: The contract checks for valid node ID and metadata before registration.
- Access control: Only the node owner can update the status or deregister their node.
- Error handling: The contract defines specific error codes for various failure scenarios.

## Installation & Setup

To use the Node Vault contract, you'll need the following:

1. Install [Clarinet](https://github.com/clarinets/clarinet), the Clarity smart contract development tool.
2. Clone the `node-vault` project repository.
3. Navigate to the project directory and run `clarinet check` to verify the project setup.

## Usage Guide

### Registering a Node
```clarity
(contract-call? 'node-vault register-node (buff 0x1234abcd) "My Node")
```

### Updating Node Status
```clarity
(contract-call? 'node-vault update-node-status 0)  ; Set status to inactive
```

### Retrieving Node Information
```clarity
(contract-call? 'node-vault get-node-info ' ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM)
```

### Deregistering a Node
```clarity
(contract-call? 'node-vault deregister-node)
```

## Testing

The `node-vault_test.ts` file contains a comprehensive test suite that covers the following scenarios:

- Successful node registration
- Preventing duplicate node registrations
- Validating node registration inputs
- Updating node status by authorized user
- Preventing unauthorized status updates
- Retrieving node details correctly
- Handling non-existent node queries
- Removing nodes by owner
- Preventing unauthorized deregistration
- Tracking nodes by owner

To run the tests, execute the following command in the project directory:

```
clarinet test
```

## Security Considerations

The Node Vault contract includes several security measures:

- **Input Validation**: The contract checks that the provided node ID and metadata are non-empty before registering a new node.
- **Access Control**: Only the node owner can update the status or deregister their node. Unauthorized attempts are rejected with an error.
- **Error Handling**: The contract defines specific error codes for various failure scenarios, such as "node already exists" or "unauthorized access".
- **Data Integrity**: The contract stores node information in a map, ensuring that each node has a unique ID and owner.

## Contributing

Contributions to the Node Vault project are welcome! If you find any issues or have suggestions for improvements, please create a new issue or submit a pull request.
