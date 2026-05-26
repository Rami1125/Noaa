# Security Specification: ח. סבן חומרי בניין (נועה)

This document outlines the security architecture, data invariants, and adversarial test payloads ("Dirty Dozen") designed to stress-test our Firestore security rules boundaries.

## 1. Data Invariants

1. **Identity & Authority**: No user can write messages, orders, or customers masquerading as another user or system entity.
2. **Noa's Integrity**: Message outputs sent by "Noa" (system generated) are readonly for general clients; clients should only append user messages.
3. **Temporal Integrity**: All `createdAt` and `updatedAt` properties must strictly match `request.time`. They cannot be backdated or postdated.
4. **Order State Machine Integrity**: Drivers can only be assigned to valid, existing orders, and once an order is dispatched/shipped, it cannot be edited or modified back to a previous state by unauthorized parties.
5. **No Spoofing**: Critical properties like outstanding balances (`outstandingBalance` on `Customer`) or availability status of items (`inStock` on `InventoryItem`) must not be directly manipulated without authorization.

## 2. The Dirty Dozen (Vulnerability Test Scenarios)

1. **UID Forgery**: A user tries to create a message with a custom `sender` and `isNoa: true` to inject fake logistics instructions.
2. **Temporal Backdating**: A user tries to insert a backdated order with `createdAt` set to 5 days ago to bypass delivery delays.
3. **Unauthorized Stock Manipulation**: An external user tries to modify the `quantity` of "מלט שחור" (Black Cement) on the `inventory` collection.
4. **Driver Self-Assignment Bypass**: A driver tries to update an order with a driver update, while sneakily changing the items list or price.
5. **Ghost Field Write**: A user tries to write a ghost key (e.g., `bypassVerification: true`) into the `orders` document.
6. **Outstanding Balance Eraser**: A customer tries to change their `outstandingBalance` directly to `0` inside the `customers` collection.
7. **Junk Character Path Variable Injection**: A user attempts to write a document with a 1.5KB malicious path identifier (e.g., `orders/INVALID_$$$###_PoisonId`).
8. **PII Leakage via Blanket Get**: An unauthenticated user tries to query list of `customers` or list of `orders` to retrieve PII like phones/addresses.
9. **Null Auth Leak**: An anonymous user with null authentication tries to read the `inventory` or append `messages`.
10. **State Shortcutting**: Trying to mark an order as "נשלח" (shipped) when it was never approved, bypassing the state sequence.
11. **Denial of Wallet Recursion**: Injecting deeply recursive queries that force multiple relational `get()` queries without prior authentication checking.
12. **System Log Destruction**: A malicious actor attempting to `delete` messages from the conversational log history to cover their tracks.

## 3. Test Cases (firestore.rules)

The rules will be formulated to return `PERMISSION_DENIED` for all twelve of these toxic payloads, securing the system as a true "Fortress."
