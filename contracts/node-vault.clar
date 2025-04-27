;; Node Vault: Decentralized Node Management Contract
;; A secure system for registering, tracking, and managing nodes on the Stacks blockchain

;; Error Codes
(define-constant ERR_UNAUTHORIZED u403)
(define-constant ERR_NODE_ALREADY_EXISTS u100)
(define-constant ERR_NODE_NOT_FOUND u404)
(define-constant ERR_INVALID_NODE_DATA u101)

;; Node Status Enum
(define-constant NODE_STATUS_ACTIVE u1)
(define-constant NODE_STATUS_INACTIVE u0)

;; Data Structures
;; Store node information with metadata and status
(define-map nodes 
  principal 
  {
    node-id: (buff 32),  ;; Unique node identifier
    metadata: (string-ascii 256),  ;; Additional node info
    status: uint,  ;; Node status (active/inactive)
    owner: principal  ;; Node owner/operator
  }
)

;; Owner-to-nodes tracking
(define-map node-owners 
  principal 
  (list 10 principal)  ;; Track nodes owned by each principal
)

;; Check if the caller is the node owner
(define-private (is-node-owner (node-owner principal))
  (is-eq tx-sender node-owner)
)

;; Validate node registration data
(define-private (validate-node-data 
  (node-id (buff 32)) 
  (metadata (string-ascii 256))
)
  (begin
    (asserts! (> (len node-id) u0) (err ERR_INVALID_NODE_DATA))
    (asserts! (> (len metadata) u0) (err ERR_INVALID_NODE_DATA))
    (ok true)
  )
)

;; Register a new node
(define-public (register-node 
  (node-id (buff 32)) 
  (metadata (string-ascii 256))
)
  (let 
    (
      (node-data {
        node-id: node-id,
        metadata: metadata,
        status: NODE_STATUS_ACTIVE,
        owner: tx-sender
      })
    )
    ;; Validate node data
    (try! (validate-node-data node-id metadata))

    ;; Check node doesn't already exist
    (asserts! (is-none (map-get? nodes tx-sender)) (err ERR_NODE_ALREADY_EXISTS))

    ;; Register node
    (map-set nodes tx-sender node-data)

    ;; Track nodes owned by this principal
    (map-set node-owners tx-sender 
      (unwrap! 
        (as-max-len? 
          (append 
            (default-to (list) (map-get? node-owners tx-sender)) 
            tx-sender
          ) 
          u10
        ) 
        (err ERR_UNAUTHORIZED)
      )
    )

    (ok node-data)
)

;; Update node status (only by node owner)
(define-public (update-node-status 
  (new-status uint)
)
  (let 
    (
      (current-node (unwrap! (map-get? nodes tx-sender) (err ERR_NODE_NOT_FOUND)))
      (updated-node (merge current-node { status: new-status }))
    )
    ;; Validate caller is node owner
    (asserts! (is-node-owner (get owner current-node)) (err ERR_UNAUTHORIZED))

    ;; Update node status
    (map-set nodes tx-sender updated-node)
    (ok updated-node)
)

;; Retrieve node information
(define-read-only (get-node-info (node-owner principal))
  (map-get? nodes node-owner)
)

;; List nodes owned by a principal
(define-read-only (get-nodes-by-owner (owner principal))
  (map-get? node-owners owner)
)

;; Deregister a node
(define-public (deregister-node)
  (let 
    (
      (current-node (unwrap! (map-get? nodes tx-sender) (err ERR_NODE_NOT_FOUND)))
      (owned-nodes (default-to (list) (map-get? node-owners tx-sender)))
    )
    ;; Validate caller is node owner
    (asserts! (is-node-owner (get owner current-node)) (err ERR_UNAUTHORIZED))

    ;; Remove node from nodes map
    (map-delete nodes tx-sender)

    ;; Remove node from owner's node list
    (map-set node-owners tx-sender 
      (filter 
        (lambda (node) (not (is-eq node tx-sender))) 
        owned-nodes
      )
    )

    (ok true)
  )
)