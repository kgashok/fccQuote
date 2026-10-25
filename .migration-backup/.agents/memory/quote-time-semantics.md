---
name: Quote time semantics
description: User requirement for original generation times and unknown historical dates.
---

The quote must be stored with its original generation time and displayed with that time if it is available. A page load is not a generation event.

**Why:** The user explicitly requested this after the UI incorrectly labeled browser display times as generation times.

**How to apply:** Preserve known original times rather than replacing them during reads, reloads, or repeat retrievals. Do not invent historical generation times for undated quotes.
