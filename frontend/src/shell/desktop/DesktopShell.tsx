import { useEffect } from "react";
import { useOs } from "../../os/store";
import Grub from "./boot/Grub";
import KernelLog from "./boot/KernelLog";
import Plymouth from "./boot/Plymouth";
import Shutdown from "./boot/Shutdown";
import Gdm from "./Gdm";
import LockScreen from "./LockScreen";
import Desktop from "./Desktop";

export default function DesktopShell() {
  const session = useOs(s => s.session);
  const powerOn = useOs(s => s.powerOn);
  const bootTo = useOs(s => s.bootTo);
  useEffect(() => {
    if (session === "poweredOff") {
      if (new URLSearchParams(location.search).has("fastboot")) bootTo("gdm");
      else if (matchMedia("(prefers-reduced-motion: reduce)").matches) bootTo("gdm");
      else powerOn();
    }
  }, [session, powerOn, bootTo]);
  switch (session) {
    case "poweredOff": return <div className="h-full bg-black" />;
    case "grub": return <Grub />;
    case "kernelLog": return <KernelLog />;
    case "plymouth": return <Plymouth />;
    case "gdm": return <Gdm />;
    case "locked": return <LockScreen />;
    case "shuttingDown": return <Shutdown />;
    case "desktop": return <Desktop />;
  }
}
