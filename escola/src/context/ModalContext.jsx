import React, { createContext, useContext, useState } from "react";

const ModalContext = createContext();

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error("useModal deve ser usado dentro de ModalProvider");
  }
  return context;
};

export const ModalProvider = ({ children }) => {
  const [modalStack, setModalStack] = useState([]);

  const openModal = (modalId) => {
    setModalStack((prev) => {
      if (!prev.includes(modalId)) {
        return [...prev, modalId];
      }
      return prev;
    });
  };

  const closeModal = (modalId) => {
    setModalStack((prev) => prev.filter((id) => id !== modalId));
  };

  const getZIndex = (modalId) => {
    const index = modalStack.indexOf(modalId);
    return index >= 0 ? 1000 + index * 10 : 1000;
  };

  return (
    <ModalContext.Provider
      value={{ openModal, closeModal, getZIndex, modalStack }}
    >
      {children}
    </ModalContext.Provider>
  );
};
