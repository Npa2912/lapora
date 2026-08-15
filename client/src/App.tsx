import { useEffect, useState } from "react";

import Home from "./pages/Home";
import Products from "./pages/Products";
import VoiceAssistantButton from "./components/voice/VoiceAssistantButton";

function getCurrentPath() {
  return window.location.pathname;
}

export default function App() {
  const [path, setPath] = useState(getCurrentPath());

  useEffect(() => {
    const handlePopState = () => {
      setPath(getCurrentPath());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const isProductsPage = path.startsWith("/products");

  return (
    <>
      {isProductsPage ? <Products /> : <Home />}

      {/* Đặt ở App để chuyển trang mà robot/giọng AI không bị mất. */}
      <VoiceAssistantButton />
    </>
  );
}