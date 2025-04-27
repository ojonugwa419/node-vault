import { Clarinet, Tx, Chain, Account, types } from 'https://deno.land/x/clarinet@v1.0.2/index.ts';
import { assertEquals } from 'https://deno.land/std@0.90.0/testing/asserts.ts';

// Constants matching contract
const ERR_UNAUTHORIZED = 403;
const ERR_NODE_ALREADY_EXISTS = 100;
const ERR_NODE_NOT_FOUND = 404;
const ERR_INVALID_NODE_DATA = 101;

const NODE_STATUS_ACTIVE = 1;
const NODE_STATUS_INACTIVE = 0;

Clarinet.test({
  name: "Node Registration: Successfully register a new node",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const nodeId = Buffer.from('unique-node-id-1');
    const metadata = 'Test Node Metadata';
    
    const block = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);

    // Verify transaction succeeded
    block.receipts[0].result.expectOk();

    // Verify node info can be retrieved
    const nodeInfo = chain.callReadOnlyFn(
      'node-vault', 
      'get-node-info', 
      [types.principal(deployer.address)], 
      deployer.address
    );

    // Check node details
    nodeInfo.result.expectSome();
    const nodeDetails = nodeInfo.result.expectTuple();
    assertEquals(nodeDetails.node_id, types.buff(nodeId));
    assertEquals(nodeDetails.metadata, types.ascii(metadata));
    assertEquals(nodeDetails.status, types.uint(NODE_STATUS_ACTIVE));
  }
});

Clarinet.test({
  name: "Node Registration: Prevent duplicate node registrations",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const nodeId = Buffer.from('unique-node-id-2');
    const metadata = 'Test Node Metadata';
    
    // First registration should succeed
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectOk();

    // Second registration should fail
    const block2 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);
    block2.receipts[0].result.expectErr().expectUint(ERR_NODE_ALREADY_EXISTS);
  }
});

Clarinet.test({
  name: "Node Registration: Validate node registration inputs",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    // Test empty node ID
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(Buffer.from('')), 
          types.ascii('Test Metadata')
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectErr().expectUint(ERR_INVALID_NODE_DATA);

    // Test empty metadata
    const block2 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(Buffer.from('node-id')), 
          types.ascii('')
        ], 
        deployer.address
      )
    ]);
    block2.receipts[0].result.expectErr().expectUint(ERR_INVALID_NODE_DATA);
  }
});

Clarinet.test({
  name: "Node Status Management: Update node status by authorized user",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const nodeId = Buffer.from('status-test-node');
    const metadata = 'Status Test Node';
    
    // First, register a node
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectOk();

    // Update node status to inactive
    const block2 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'update-node-status', 
        [types.uint(NODE_STATUS_INACTIVE)], 
        deployer.address
      )
    ]);
    block2.receipts[0].result.expectOk();

    // Verify status was updated
    const nodeInfo = chain.callReadOnlyFn(
      'node-vault', 
      'get-node-info', 
      [types.principal(deployer.address)], 
      deployer.address
    );
    const nodeDetails = nodeInfo.result.expectSome();
    assertEquals(nodeDetails.status, types.uint(NODE_STATUS_INACTIVE));
  }
});

Clarinet.test({
  name: "Node Status Management: Prevent unauthorized status updates",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    const nodeId = Buffer.from('unauthorized-status-node');
    const metadata = 'Unauthorized Status Test';
    
    // Register node as deployer
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectOk();

    // Attempt to update status by unauthorized user
    const block2 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'update-node-status', 
        [types.uint(NODE_STATUS_INACTIVE)], 
        wallet1.address
      )
    ]);
    block2.receipts[0].result.expectErr().expectUint(ERR_UNAUTHORIZED);
  }
});

Clarinet.test({
  name: "Node Information Retrieval: Retrieve node details correctly",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const nodeId = Buffer.from('retrieval-test-node');
    const metadata = 'Retrieval Test Node';
    
    // Register node
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectOk();

    // Retrieve node info
    const nodeInfo = chain.callReadOnlyFn(
      'node-vault', 
      'get-node-info', 
      [types.principal(deployer.address)], 
      deployer.address
    );

    // Verify retrieved details
    nodeInfo.result.expectSome();
    const nodeDetails = nodeInfo.result;
    assertEquals(nodeDetails.node_id, types.buff(nodeId));
    assertEquals(nodeDetails.metadata, types.ascii(metadata));
    assertEquals(nodeDetails.status, types.uint(NODE_STATUS_ACTIVE));
    assertEquals(nodeDetails.owner, types.principal(deployer.address));
  }
});

Clarinet.test({
  name: "Node Information Retrieval: Handle non-existent node queries",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const wallet1 = accounts.get('wallet_1')!;
    
    // Query non-existent node
    const nodeInfo = chain.callReadOnlyFn(
      'node-vault', 
      'get-node-info', 
      [types.principal(wallet1.address)], 
      wallet1.address
    );

    // Should return None
    nodeInfo.result.expectNone();
  }
});

Clarinet.test({
  name: "Deregistration: Remove node by owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const nodeId = Buffer.from('deregister-test-node');
    const metadata = 'Deregister Test Node';
    
    // Register node
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectOk();

    // Deregister node
    const block2 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'deregister-node', 
        [], 
        deployer.address
      )
    ]);
    block2.receipts[0].result.expectOk();

    // Verify node is removed
    const nodeInfo = chain.callReadOnlyFn(
      'node-vault', 
      'get-node-info', 
      [types.principal(deployer.address)], 
      deployer.address
    );
    nodeInfo.result.expectNone();
  }
});

Clarinet.test({
  name: "Deregistration: Prevent unauthorized deregistration",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    const wallet1 = accounts.get('wallet_1')!;
    
    const nodeId = Buffer.from('unauthorized-deregister-node');
    const metadata = 'Unauthorized Deregister Test';
    
    // Register node as deployer
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeId), 
          types.ascii(metadata)
        ], 
        deployer.address
      )
    ]);
    block1.receipts[0].result.expectOk();

    // Attempt to deregister by unauthorized user
    const block2 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'deregister-node', 
        [], 
        wallet1.address
      )
    ]);
    block2.receipts[0].result.expectErr().expectUint(ERR_UNAUTHORIZED);
  }
});

Clarinet.test({
  name: "Node Ownership: Track nodes by owner",
  async fn(chain: Chain, accounts: Map<string, Account>) {
    const deployer = accounts.get('deployer')!;
    
    const nodeIds = [
      Buffer.from('node-1'),
      Buffer.from('node-2')
    ];
    const metadata = 'Ownership Test Node';
    
    // Register multiple nodes
    const block1 = chain.mineBlock([
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeIds[0]), 
          types.ascii(metadata + '1')
        ], 
        deployer.address
      ),
      Tx.contractCall(
        'node-vault', 
        'register-node', 
        [
          types.buff(nodeIds[1]), 
          types.ascii(metadata + '2')
        ], 
        deployer.address
      )
    ]);

    // Verify both registrations succeeded
    block1.receipts[0].result.expectOk();
    block1.receipts[1].result.expectOk();

    // Get nodes by owner
    const nodesOwned = chain.callReadOnlyFn(
      'node-vault', 
      'get-nodes-by-owner', 
      [types.principal(deployer.address)], 
      deployer.address
    );

    // Verify list of owned nodes
    nodesOwned.result.expectSome();
  }
});