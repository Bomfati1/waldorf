import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import "../css/ModalBase.css";

const ModalBase = ({
  isOpen,
  onClose,
  children,
  title,
  size = "medium",
  zIndex = 1000,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}) => {
  // Previne scroll do body quando modal está aberto
  useEffect(() => {
    if (isOpen) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  // Fecha modal ao pressionar ESC
  useEffect(() => {
    if (!closeOnEscape) return;

    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <div
      className="modal-base-overlay"
      onClick={handleOverlayClick}
      style={{ zIndex }}
    >
      <div
        className={`modal-base-container modal-base-${size}`}
        onClick={(e) => e.stopPropagation()}
        style={{ zIndex: zIndex + 1 }}
      >
        {(title || showCloseButton) && (
          <div className="modal-base-header">
            {title && <h2>{title}</h2>}
            {showCloseButton && (
              <button
                className="modal-base-close"
                onClick={onClose}
                aria-label="Fechar modal"
              >
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal-base-body">{children}</div>
      </div>
    </div>
  );

  // Renderiza no portal
  const modalRoot = document.getElementById("modal-root");
  if (!modalRoot) {
    console.error("modal-root não encontrado no DOM");
    return null;
  }

  return ReactDOM.createPortal(modalContent, modalRoot);
};

export default ModalBase;
