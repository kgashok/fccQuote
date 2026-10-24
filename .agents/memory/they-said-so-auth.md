---
name: They Said So authentication documentation
description: Conflicting provider examples and which source to trust for authentication.
---

Prefer the current interactive API specification at https://quotes.rest/ over older code samples on the provider's marketing documentation when selecting authentication.

**Why:** The marketing documentation mixes bearer authentication instructions with legacy `X-TheySaidSo-Api-Secret` examples. The interactive specification explicitly declares bearer authentication for the quote-of-the-day endpoint.

**How to apply:** Recheck the live specification before changing authentication. A configured secret and passing mocked tests do not establish that the provider accepts a key; verify a live request without exposing credentials.
