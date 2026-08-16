import "./error-alert.css";

type Props = {
  error?: string;
};

export const ErrorAlert = (props: Props) => {
  const { error } = props;

  return <div className="error-alert">{error}</div>;
};
