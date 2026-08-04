import type { PropsWithChildren } from "react";
import "./no-items.css";

export const NoItems = (props: PropsWithChildren) => {
  return <div className="no-items">{props.children}</div>;
};
