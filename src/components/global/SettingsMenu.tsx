import { useRef } from "react";
import { useAppStore } from "@/store/useAppStore";
import { GlobalErrors, STORAGE_KEY_BACKUP } from "@/config/constants";
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
  const setToastMessage = useAppStore((state) => state.setToastMessage);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLMenuElement>(null);

  const parseImport = async (text: string) => {
    try {
      const parsed = JSON.parse(text);
      const success = resetProfiles(parsed);
      if (success === true) {
        setToastMessage(`${parsed.length} profiles imported.`);
      } else {
        setToastMessage(GlobalErrors.parseImport);
      }
    } catch {
      setToastMessage("Failed to parse JSON");
    }
  };

  const onImportClick = () => {
    // For chromium-based browsers
    if (!import.meta.env.FIREFOX) {
      fileInputRef.current?.click();
    } else {
      const input = prompt("Paste profile JSON contents");
      if (input) {
        parseImport(input);
      }
      menuRef.current?.hidePopover();
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const text = await file.text();
    await parseImport(text);

    event.target.value = "";
    menuRef.current?.hidePopover();
  };

  const onBackupClick = async () => {
    await browser.storage.local.set<PersistedStorage>({ [STORAGE_KEY_BACKUP]: { profiles } });
    setToastMessage(`${profiles?.length ?? 0} profiles backed up to storage.`);
    menuRef.current?.hidePopover();
  };

  const onRestoreClick = async () => {
    const storage = await browser.storage.local
      .get<PersistedStorage>(STORAGE_KEY_BACKUP)
      .catch(() => {});
    if (!storage) {
      setToastMessage(`"${STORAGE_KEY_BACKUP}" could not be read from storage.`);
      menuRef.current?.hidePopover();
      return;
    }
    const state = storage[STORAGE_KEY_BACKUP];
    if (state.profiles) {
      const success = resetProfiles(state.profiles);
      if (success === true) {
        setToastMessage(`${state.profiles.length} profiles restored from backup.`);
      } else {
        setToastMessage(GlobalErrors.parseImport);
      }
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
