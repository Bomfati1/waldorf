import React, { useState, useEffect, useRef } from "react";
import ImportExcel from "./ImportExcel";
import "../css/ImportDropdown.css";

const ImportDropdown = ({
  options = [], // Array de opções de importação
  buttonText = "Importar via Excel",
  buttonIcon = "📊",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  const handleOptionClick = (option) => {
    setSelectedOption(option);
    setIsOpen(false);
  };

  const handleCloseModal = () => {
    setSelectedOption(null);
  };

  const handleSuccess = (data) => {
    if (selectedOption && selectedOption.onSuccess) {
      selectedOption.onSuccess(data);
    }
    handleCloseModal();
  };

  const handleError = (data) => {
    if (selectedOption && selectedOption.onError) {
      selectedOption.onError(data);
    }
  };

  // Fechar menu quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div className="import-dropdown-container" ref={dropdownRef}>
        <button
          className={`import-dropdown-button ${isLoading ? "loading" : ""}`}
          onClick={() => setIsOpen(!isOpen)}
          type="button"
          disabled={isLoading}
          aria-label={
            isLoading
              ? "Carregando opções de importação"
              : "Abrir menu de importação via Excel"
          }
          aria-expanded={isOpen}
          aria-haspopup="true"
          title={buttonText}
        >
          <span className="import-dropdown-icon">{buttonIcon}</span>
          <span className="import-dropdown-text">
            {isLoading ? "Carregando..." : buttonText}
          </span>
          <span className={`import-dropdown-arrow ${isOpen ? "open" : ""}`}>
            ▼
          </span>
        </button>

        {isOpen && (
          <div className="import-dropdown-menu" role="menu">
            {options.map((option, index) => (
              <button
                key={index}
                className="import-dropdown-item"
                onClick={() => handleOptionClick(option)}
                type="button"
                role="menuitem"
                aria-label={`${option.title} - ${option.description}`}
                title={option.description}
              >
                <span className="import-dropdown-item-icon">{option.icon}</span>
                <div className="import-dropdown-item-content">
                  <span className="import-dropdown-item-title">
                    {option.title}
                  </span>
                  <span className="import-dropdown-item-description">
                    {option.description}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal para exibir o componente ImportExcel */}
      {selectedOption && (
        <div className="import-modal-overlay" onClick={handleCloseModal}>
          <div
            className="import-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="import-modal-header">
              <h3>{selectedOption.title}</h3>
              <button
                className="import-modal-close"
                onClick={handleCloseModal}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="import-modal-body">
              <ImportExcel
                endpoint={selectedOption.endpoint}
                title={selectedOption.title}
                description={selectedOption.description}
                acceptedColumns={selectedOption.acceptedColumns}
                onSuccess={handleSuccess}
                onError={handleError}
                buttonText={selectedOption.buttonText}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImportDropdown;
