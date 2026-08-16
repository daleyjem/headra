import { useAppInit, useMessageHandler } from "@/hooks";
import { useAppStore } from "@/store/useAppStore";
import { SettingsMenu } from "@/components/global/SettingsMenu";
import { LeftPane } from "@/components/left-pane";
import { RightPane } from "@/components/right-pane";
import { ErrorAlert } from "@/components/global/ErrorAlert";
import { ToastMessage } from "@/components/global/ToastMessage";
import AppIcon from "@/assets/icons/app-icon.svg?react";
import "./app.css";

function App() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);

  useAppInit();
  const message = useMessageHandler("setError");

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
        <ErrorAlert error={message?.failure} />
        <SettingsMenu />
      </header>
      <main>
        <LeftPane />
        <RightPane />
        <ToastMessage />
      </main>
    </>
  );
}

export default App;
