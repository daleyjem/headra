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
};

export const ProfilePatterns = ({ profile, updateProfile }: Props) => {
  const [draftPatterns, setDraftPatterns] = useState<DraftPatterns>({
    domains: profile.domains ?? "",
    requestPattern: profile.requestPattern ?? "",
  });
  const [draftRegex, setDraftRegex] = useState<boolean>(profile.requestRegex ?? false);

  // tracks the last values *this component* pushed to the store, so the sync
  // effect below can tell "external change (restore)" apart from "my own edit
  // finally landed back in props"
  const lastCommitted = useRef<DraftPatterns>(draftPatterns);

  useEffect(() => {
    const incoming: DraftPatterns = {
      domains: profile.domains ?? "",
      requestPattern: profile.requestPattern ?? "",
    };

    const isExternalChange =
      incoming.domains !== lastCommitted.current.domains ||
      incoming.requestPattern !== lastCommitted.current.requestPattern;

    if (isExternalChange) {
      setDraftPatterns(incoming);
      setDraftRegex(profile.requestRegex ?? false);
      lastCommitted.current = incoming;
    }
  }, [profile.id, profile.domains, profile.requestPattern, profile.requestRegex]);

  const commitPatterns = useDebouncedCallback((patterns: DraftPatterns) => {
    lastCommitted.current = patterns; // mark this as self-originated before it round-trips back
    updateProfile({ ...profile, ...patterns });
  }, 300);

  const onPatternChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const next = { ...draftPatterns, [name]: value };
    setDraftPatterns(next);
    commitPatterns(next);
  };

  const onPatternBlur = () => {
    commitPatterns.flush();
  };

  const onRegexToggle = () => {
    const requestRegex = !draftRegex;
    setDraftRegex(requestRegex);
    updateProfile({ ...profile, requestRegex });
  };

  return (
    <div className="header-patterns">
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
          placeholder={draftRegex ? ".*" : DEFAULT_URL_PATTERN}
          value={draftPatterns.requestPattern}
          onChange={onPatternChange}
          onBlur={onPatternBlur}
        />
        <span
          title="Regular Expression"
          className={cx({ regex: true, enabled: draftRegex })}
          onClick={onRegexToggle}
        >
          (.*)
        </span>
      </label>
    </div>
  );
};
