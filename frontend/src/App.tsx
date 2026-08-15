import { useMemo } from "react";
import DesktopShell from "./shell/desktop/DesktopShell";
import MobileShell from "./shell/mobile/MobileShell";

export default function App() {
  const isMobile = useMemo(
    () => window.matchMedia("(max-width: 768px)").matches && "ontouchstart" in window,
    []);
  return isMobile ? <MobileShell /> : <DesktopShell />;
}
