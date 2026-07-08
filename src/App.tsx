/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { ChatProvider } from "./context/ChatContext";
import { ChatWorkspace } from "./pages/ChatWorkspace";

export default function App() {
  return (
    <ChatProvider>
      <ChatWorkspace />
    </ChatProvider>
  );
}

