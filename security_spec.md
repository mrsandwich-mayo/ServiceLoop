# Security Specification - ServiceLoop V1 (Firestore Foundation)

## 1. Data Invariants & Architecture
ServiceLoop V1 establishes Cloud Firestore as the primary database with 6 top-level collections:
1. `businesses`
2. `business_verifications`
3. `customers`
4. `services`
5. `appointments`
6. `follow_ups`

### Core Tenet & Relationship Rules:
- Multi-tenancy isolation: Every child document (`business_verifications`, `customers`, `services`, `appointments`, `follow_ups`) is owned by a single business and explicitly contains `businessId`.
- A user can ONLY access documents belonging to their own business (`isBusinessOwner(businessId)`).
- Document IDs must conform to `isValidId` (`[a-zA-Z0-9_\-]+`, size 1..128).
- Query isolation: `allow list` evaluates `resource.data.businessId == request.auth.uid` (or `ownerId` for `businesses`) with no costly `get()` calls in list contexts.
- Government ID PII protection: Sensitive government identity information (like raw Aadhaar) is strictly forbidden. Only masked/safe reference strings are permitted.
- Verification status tampering: Business owners can submit verification requests with status `PENDING`, but cannot self-verify (`VERIFIED`) or forge admin reviews.

## 2. Dirty Dozen Payloads (Target: PERMISSION_DENIED)
1. **Unauthenticated Read on Any Collection**: Attempting `get` or `list` on `businesses`, `customers`, `services`, `appointments`, or `follow_ups` without authentication token.
2. **Cross-Tenant Business Read**: User A (`uid_A`) attempting to read `/businesses/uid_B`.
3. **Cross-Tenant Customer Read**: User A attempting to read `/customers/cust_999` where `businessId == "uid_B"`.
4. **Cross-Tenant Service Write**: User A attempting to create or update `/services/srv_1` with `businessId: "uid_B"`.
5. **Cross-Tenant Appointment Modification**: User A attempting to update or delete `/appointments/apt_1` belonging to `uid_B`.
6. **Cross-Tenant Follow-Up Snooping**: User A attempting to query `/follow_ups` belonging to `uid_B`.
7. **Business ID Reassignment (Orphan Write)**: User A attempting to update an existing customer document by changing `businessId` from `"uid_A"` to `"uid_B"`.
8. **Self-Verification Privilege Escalation**: User A attempting to create `/business_verifications/v1` with `verificationStatus: "VERIFIED"` or with non-null `reviewedBy`.
9. **Global List Query Scraping**: Attempting `allow list` without filtering query by authenticated business ID (`resource.data.businessId == request.auth.uid`).
10. **ID Poisoning Attack**: Attempting document operations with path IDs containing invalid characters, null bytes, or oversized length (> 128 chars).
11. **Denial-of-Wallet Payload Flooding**: Submitting payload with strings exceeding size bounds (e.g., > 1000 characters in notes).
12. **Owner Impersonation on Business Creation**: Authenticated user `uid_A` attempting to create `/businesses/uid_A` with `ownerId: "uid_victim"`.
13. **Tenant Tampering with Verification Status**: Business owner attempting to update `/businesses/{uid}` to `verificationStatus: "VERIFIED"`, `REJECTED`, or `SUSPENDED`, or altering `createdAt`.

## 3. Test Invariant Mapping
All 12 attack vectors are blocked by attribute-based access control (ABAC) and schema validation in `firestore.rules`.
