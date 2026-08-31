import React from "react";

// Access-control compatibility layer.
// The production application currently lives in the legacy main.jsx entrypoint.
// This file intentionally contains no UI changes; access is resolved server-side
// through the effective-access RPC before protected modules are unlocked.
export default function App() {
  return null;
}
