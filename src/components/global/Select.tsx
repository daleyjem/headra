import "./select.css";

export const Select = (props: React.HTMLProps<HTMLSelectElement>) => (
  <div className="select-wrapper">
    <select {...props}>{props.children}</select>
  </div>
);
