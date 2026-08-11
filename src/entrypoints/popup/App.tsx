import { useAppInit, useMessageHandler } from "@/hooks";
import { useAppStore } from "@/store/useAppStore";
import { SettingsMenu } from "@/components/global/SettingsMenu";
import { Profiles } from "@/components/profiles/Profiles";
import { Headers } from "@/components/headers/Headers";
import { ToastMessage } from "@/components/global/ToastMessage";
import AppIcon from "@/assets/icons/app-icon.svg?react";
import "./app.css";

function App() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const errorAlert = useAppStore((state) => state.errorAlert);

  useAppInit();
  useMessageHandler();

  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      <header>
        <h1>
          <AppIcon />
          Headra
        </h1>
        <div className="error-alert">{errorAlert}</div>
        <SettingsMenu />
      </header>
      <main>
        <Profiles />
        <Headers />
        <ToastMessage />
      </main>
    </>
  );
}

export default App;
