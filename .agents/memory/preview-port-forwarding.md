---
name: Preview port forwarding
description: A webview readiness failure despite a healthy local server can mean the forwarding map is missing.
---

Check the public port forwarding map before changing server code when a webview workflow says it did not open its port even though the server logs a correct bind.

**Why:** In this project, the app served HTTP successfully when started directly, but workflow readiness timed out and the proxied preview did not serve the app. Reconfiguring the workflow alone did not restore the missing forwarding map.

**How to apply:** Confirm the listener, bind address, workflow port, and public mapping together. If the mapping is absent, update the Replit configuration through its schema-validated path and restart the workflow once before investigating application code.