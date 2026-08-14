import { useEffect, useRef, useState } from "react";
import cx from "classnames";
import { useDebouncedCallback } from "use-debounce";
import type { Profile } from "@/types";
import { DEFAULT_URL_PATTERN } from "@/config/constants";

type Props = {
  profile: Profile;
  updateProfile: (profile: Profile) => void;
};

type DraftPatterns = {
  domains: string;
  requestPattern: string;
  requestRegex: boolean;
};

export const ProfilePatterns = ({ profile, updateProfile }: Props) => {
  const [draftPatterns, setDraftPatterns] = useState<DraftPatterns>({
    domains: profile.domains ?? "",
    requestPattern: profile.requestPattern ?? "",
    requestRegex: profile.requestRegex ?? false,
  });

  const lastCommitted = useRef<DraftPatterns>(draftPatterns);

  useEffect(() => {
    const incoming: DraftPatterns = {
      domains: profile.domains ?? "",
      requestPattern: profile.requestPattern ?? "",
      requestRegex: profile.requestRegex ?? false,
    };

    const isExternalChange =
      incoming.domains !== lastCommitted.current.domains ||
      incoming.requestPattern !== lastCommitted.current.requestPattern ||
      incoming.requestRegex !== lastCommitted.current.requestRegex;

    if (isExternalChange) {
      setDraftPatterns(incoming);
      lastCommitted.current = incoming;
    }
  }, [profile.id, profile.domains, profile.requestPattern, profile.requestRegex]);

  const commitPatterns = useDebouncedCallback((patterns: Partial<DraftPatterns>) => {
    const next = { ...draftPatterns, ...patterns };
    lastCommitted.current = next; // mark this as self-originated before it round-trips back
    updateProfile({ ...profile, ...patterns });
  }, 300);

  const onPatternChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const next = { ...draftPatterns, [name]: value };
    setDraftPatterns(next);
    commitPatterns({ [name]: value });
  };

  const onPatternBlur = () => {
    commitPatterns.flush();
  };

  const onRegexToggle = () => {
    const requestRegex = !draftPatterns.requestRegex;
    const next = { ...draftPatterns, requestRegex };
    setDraftPatterns(next);
    lastCommitted.current = next;
    updateProfile({ ...profile, requestRegex });
  };

  return (
    <div className="profile-patterns">
      <label>
        <span className="pattern-label">Domain(s)</span>
        <input
          type="text"
          name="domains"
          placeholder="e.g. example.com, domain.net (optional)"
          value={draftPatterns.domains}
          onChange={onPatternChange}
          onBlur={onPatternBlur}
        />
      </label>
      <label>
        <span className="pattern-label">Request pattern</span>
        <input
          type="text"
          name="requestPattern"
          placeholder={draftPatterns.requestRegex ? ".*" : DEFAULT_URL_PATTERN}
          value={draftPatterns.requestPattern}
          onChange={onPatternChange}
          onBlur={onPatternBlur}
        />
        <span
          title="Regular Expression"
          className={cx({ regex: true, enabled: draftPatterns.requestRegex })}
          onClick={onRegexToggle}
        >
          (.*)
        </span>
      </label>
    </div>
  );
};
