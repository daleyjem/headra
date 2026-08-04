import { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import CogIcon from "@/assets/icons/cog-icon.svg?react";
import DownloadIcon from "@/assets/icons/download-icon.svg?react";
import ImportIcon from "@/assets/icons/import-icon.svg?react";
import "./settings.css";

export const SettingsMenu = () => {
  const profiles = useAppStore((state) => state.profiles);
  const resetProfiles = useAppStore((state) => state.resetProfiles);
  const setErrorAlert = useAppStore((state) => state.setErrorAlert);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      resetProfiles(parsed);
    } catch {
      setErrorAlert({ message: "Failed to parse JSON" });
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div className="settings-menu">
      <button className="btn-settings" title="Settings" popoverTarget="settings-dropdown">
        <CogIcon />
      </button>
      <menu popover="auto" id="settings-dropdown">
        <a onClick={onImportClick}>
          <ImportIcon />
          Import Profiles
        </a>
        <a
          href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profiles))}`}
          download="modheader-profiles.json"
        >
          <DownloadIcon />
          Download Profiles
        </a>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={onFileChange}
          style={{ display: "none" }}
        />
      </menu>
    </div>
  );
};
