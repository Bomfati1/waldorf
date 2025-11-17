import React, { useState } from "react";
import "../css/InputWithHint.css";

const SelectWithHint = ({
  label,
  hint,
  value,
  onChange,
  name,
  required = false,
  disabled = false,
  children,
  ...props
}) => {
  const [showHint, setShowHint] = useState(false);

  return (
    <div className="input-with-hint-container">
      <label>
        {label} {required && <span className="required">*</span>}
        {hint && (
          <span
            className="hint-icon"
            onMouseEnter={() => setShowHint(true)}
            onMouseLeave={() => setShowHint(false)}
            onClick={() => setShowHint(!showHint)}
          >
            ℹ️
            {showHint && <span className="hint-tooltip">{hint}</span>}
          </span>
        )}
      </label>
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        disabled={disabled}
        {...props}
      >
        {children}
      </select>
    </div>
  );
};

export default SelectWithHint;
