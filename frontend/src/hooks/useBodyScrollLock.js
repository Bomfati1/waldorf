import { useEffect } from "react";

/**
 * Hook para bloquear o scroll do body quando um modal está aberto
 * @param {boolean} isOpen - Se o modal está aberto ou não
 */
export const useBodyScrollLock = (isOpen) => {
  useEffect(() => {
    if (isOpen) {
      // Salva a posição atual do scroll
      const scrollY = window.scrollY;

      // Adiciona classes e estilos para bloquear o scroll
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflowY = "scroll"; // Mantém a scrollbar para evitar jump

      return () => {
        // Remove os estilos quando o modal fechar
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        document.body.style.overflowY = "";

        // Restaura a posição do scroll
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
};
