import "./buttons-container.css";

type ButtonConfig = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon?: React.FunctionComponent;
};

type Props = {
  buttons: ButtonConfig[];
};

export const ButtonsContainer = (props: Props) => {
  const { buttons } = props;

  return (
    <footer className="buttons-container">
      {buttons.map((button, index) => (
        <button key={index} onClick={button.onClick} disabled={button.disabled}>
          {button.label}
          {button.icon && <button.icon />}
        </button>
      ))}
    </footer>
  );
};
