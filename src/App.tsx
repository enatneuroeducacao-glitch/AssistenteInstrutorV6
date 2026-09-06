import React, { useEffect } from "react";
import MainApp from "./main";

export default function App() {
  useEffect(() => {
    document.title = "NEURODRIVE INSTRUTOR ENAT-HSI";
    document.documentElement.lang = "pt-BR";
    const meta = document.querySelector('meta[name="application-name"]') || document.createElement("meta");
    meta.setAttribute("name", "application-name");
    meta.setAttribute("content", "NEURODRIVE INSTRUTOR ENAT-HSI");
    if (!meta.parentNode) document.head.appendChild(meta);
  }, []);

  return <MainApp />;
}
