import { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { STORAGE_KEY_BACKUP } from "@/config/constants";
import type { PersistedStorage } from "@/types";
import CogIcon from "@/assets/icons/cog-icon.svg?react";
import DownloadIcon from "@/assets/icons/download-icon.svg?react";
import ImportIcon from "@/assets/icons/import-icon.svg?react";
import BackupIcon from "@/assets/icons/backup-icon.svg?react";
import RestoreIcon from "@/assets/icons/restore-icon.svg?react";
import GithubIcon from "@/assets/icons/github-icon.svg?react";
import "./settings.css";

export const SettingsMenu = () => {
  const profiles = useAppStore((state) => state.profiles);
  const resetProfiles = useAppStore((state) => state.resetProfiles);
  const setErrorAlert = useAppStore((state) => state.setErrorAlert);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLMenuElement>(null);

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
      setErrorAlert("Failed to parse JSON");
    } finally {
      event.target.value = "";
    }

    menuRef.current?.hidePopover();
  };

  const onBackupClick = async () => {
    await browser.storage.local.set<PersistedStorage>({ [STORAGE_KEY_BACKUP]: { profiles } });
    menuRef.current?.hidePopover();
  };

  const onRestoreClick = async () => {
    const storage = await browser.storage.local.get<PersistedStorage>(STORAGE_KEY_BACKUP);
    const state = storage[STORAGE_KEY_BACKUP];
    if (state.profiles) {
      resetProfiles(state.profiles);
    }
    menuRef.current?.hidePopover();
  };

  return (
    <div className="settings-menu">
      <button className="btn-settings" title="Settings" popoverTarget="settings-dropdown">
        <CogIcon />
      </button>
      <menu popover="auto" id="settings-dropdown" ref={menuRef}>
        <a href="#" onClick={onImportClick}>
          <ImportIcon />
          Import Profiles
        </a>
        <a
          href={`data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(profiles))}`}
          download="headra-profiles.json"
          onClick={() => menuRef.current?.hidePopover()}
        >
          <DownloadIcon />
          Download Profiles
        </a>
        <a href="#" onClick={onBackupClick}>
          <BackupIcon />
          Backup to Storage
        </a>
        <a href="#" onClick={onRestoreClick}>
          <RestoreIcon />
          Restore from Backup
        </a>
        <a
          href="#"
          onClick={() => browser.tabs.create({ url: "https://github.com/daleyjem/headra" })}
        >
          <GithubIcon />
          Github Source
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
