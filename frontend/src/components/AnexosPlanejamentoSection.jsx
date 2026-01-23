import React, { useEffect, useState } from "react";
import {
  AnexoPlanejamentoUpload,
  ListaAnexos,
} from "./FirebaseUploadComponents";
import api from "../config/api";

export default function AnexosPlanejamentoSection({ planejamentoId }) {
  const [anexos, setAnexos] = useState([]);

  useEffect(() => {
    carregarAnexos();
    // eslint-disable-next-line
  }, [planejamentoId]);

  async function carregarAnexos() {
    try {
      const response = await api.get(`/planejamentos/${planejamentoId}/anexos`);
      setAnexos(response.data);
    } catch (error) {
      setAnexos([]);
    }
  }

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      <h3 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#333" }}>
        📎 Anexos do Planejamento
      </h3>
      <div style={{ marginBottom: "1rem" }}>
        <AnexoPlanejamentoUpload
          planejamentoId={planejamentoId}
          onUploadSuccess={carregarAnexos}
        />
      </div>
      {anexos.length === 0 ? (
        <div
          style={{
            padding: "2rem",
            textAlign: "center",
            background: "#f8f9fa",
            borderRadius: "8px",
            color: "#6c757d",
          }}
        >
          <p style={{ fontSize: "2rem", margin: "0 0 0.5rem 0" }}>📄</p>
          <p style={{ margin: 0 }}>Nenhum anexo adicionado ainda</p>
        </div>
      ) : (
        <ListaAnexos
          anexos={anexos}
          tipo="planejamento"
          idRef={planejamentoId}
          onDelete={() => carregarAnexos()}
        />
      )}
    </div>
  );
}
