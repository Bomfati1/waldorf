import React, { useState } from "react";
import "../css/InputWithHint.css";

const InputWithHint = ({
  label,
  hint,
  type = "text",
  value,
  onChange,
  name,
  required = false,
  placeholder = "",
  disabled = false,
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
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        disabled={disabled}
        {...props}
      />
    </div>
  );
};

export default InputWithHint;
