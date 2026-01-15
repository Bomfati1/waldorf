// Exemplo de como converter um modal antigo para o novo sistema

// ❌ ANTES - Modal Antigo
const OldModal = ({ isOpen, onClose, data }) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "8px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2>Título</h2>
        <button onClick={onClose}>✕</button>
        <div>{data}</div>
      </div>
    </div>
  );
};

// ✅ DEPOIS - Modal Novo (com ModalBase)
import { useEffect } from "react";
import { useModal } from "../context/ModalContext";
import ModalBase from "../components/ModalBase";

const NewModal = ({ isOpen, onClose, data }) => {
  const { openModal, closeModal, getZIndex } = useModal();
  const modalId = "example-modal";

  useEffect(() => {
    if (isOpen) {
      openModal(modalId);
    }
    return () => closeModal(modalId);
  }, [isOpen]);

  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Título"
      size="medium"
      zIndex={getZIndex(modalId)}
    >
      <div>{data}</div>
    </ModalBase>
  );
};

// ✨ VANTAGENS:
// 1. Menos código manual
// 2. z-index gerenciado automaticamente
// 3. Scroll bloqueado automaticamente
// 4. Animações suaves incluídas
// 5. Responsivo por padrão
// 6. Acessibilidade (ESC, click fora)
// 7. Renderizado via Portal (sempre no topo)
