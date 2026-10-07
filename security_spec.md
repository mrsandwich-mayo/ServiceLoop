# Security Specification - ServiceLoop

## 1. Data Invariants
- A Business document must belong to the authenticated user (`ownerId == request.auth.uid`).
- `ownerId` and `createdAt` are immutable after document creation.
- A user can only read, write, or list their own Business documents.
- Document keys must be strictly validated with no ghost/unauthorized fields.
- String fields must strictly respect length boundaries (`businessName` <= 100, `ownerName` <= 100, `businessType` <= 50).
- Unauthenticated users cannot read or write any documents.

## 2. Dirty Dozen Payloads (Target: PERMISSION_DENIED)
1. **Unauthenticated Read**: Attempt to read `/businesses/{businessId}` without auth token.
2. **Unauthenticated Write**: Attempt to create `/businesses/{businessId}` without auth token.
3. **Identity Spoofing on Create**: Authenticated user `uid_123` attempts to create `/businesses/b1` with `ownerId: "uid_999"`.
4. **Cross-Tenant Read**: Authenticated user `uid_123` attempts to read `/businesses/b2` owned by `uid_456`.
5. **Cross-Tenant Update**: Authenticated user `uid_123` attempts to update `/businesses/b2` owned by `uid_456`.
6. **Cross-Tenant Delete**: Authenticated user `uid_123` attempts to delete `/businesses/b2` owned by `uid_456`.
7. **Ghost Field Injection**: Authenticated user `uid_123` sends payload with ghost field `{ role: "admin" }` or `{ isVerified: true }`.
8. **Owner Reassignment Attack**: Authenticated user `uid_123` attempts to update their own business document changing `ownerId` to `uid_target`.
9. **Creation Timestamp Tampering on Update**: Authenticated user attempts to modify immutable `createdAt` timestamp.
10. **Denial-of-Wallet Long String Injection**: Authenticated user sends a 50KB string in `businessName` exceeding maximum allowed length of 100.
11. **ID Poisoning Attack**: Attempt to create document with 200-character malicious string ID or invalid characters.
12. **Blanket Query Scraping**: Attempt to list all `/businesses` without filtering by `ownerId == request.auth.uid`.

## 3. Test Invariant Mapping
Each of the 12 scenarios above is mathematically guarded by the Eight Pillars implemented in `firestore.rules`.
