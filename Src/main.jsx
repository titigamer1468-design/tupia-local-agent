// main.jsx
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AppUI from "./AppUI.jsx";

const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <StrictMode>
    <AppUI />
  </StrictMode>
);
