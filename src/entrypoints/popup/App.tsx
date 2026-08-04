import { useAppStore } from "@/store/useAppStore";
import { SettingsMenu } from "@/components/global/SettingsMenu";
import { Profiles } from "@/components/profiles/Profiles";
import { Headers } from "@/components/headers/Headers";
import HeaderIcon from "@/assets/icons/header-icon.svg?react";
import "./app.css";

function App() {
  const hasHydrated = useAppStore((state) => state.hasHydrated);
  const errorAlert = useAppStore((state) => state.errorAlert);

  if (!hasHydrated) {
    return null;
  }

  return (
    <>
      <header>
        <h1>
          <HeaderIcon />
          Headra
        </h1>
        <div
          className="error-alert"
          dangerouslySetInnerHTML={{ __html: errorAlert?.message ?? "" }}
        ></div>
        <SettingsMenu />
      </header>
      <main>
        <Profiles />
        <Headers />
      </main>
      <footer></footer>
    </>
  );
}

export default App;
