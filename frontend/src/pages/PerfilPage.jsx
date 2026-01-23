import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getApiUrl, API_URL, fetchWithAuth } from "../config/api"; // Importar o hook
import {
  getImageUrl,
  uploadFotoPerfilUsuario,
  excluirFotoPerfilUsuario,
} from "../utils/firebaseUpload";
import "../css/PerfilPage.css"; // Vamos criar este CSS a seguir

const PerfilPage = () => {
  // Obter dados do usuário logado a partir do nosso contexto
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [userImageUrl, setUserImageUrl] = useState(null);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setMessage("Por favor, selecione apenas arquivos de imagem.");
      setMessageType("error");
      return;
    }

    // Validar tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage("A imagem deve ter no máximo 5MB.");
      setMessageType("error");
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    try {
      console.log("📤 [PerfilPage] Iniciando upload:", {
        userId: user.id,
        userIdType: typeof user.id,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      });

      // Upload para Firebase
      const caminhoFirebase = await uploadFotoPerfilUsuario(
        file,
        String(user.id),
      );

      // Atualizar no backend (salvar caminho no banco)
      const response = await fetchWithAuth("/usuario/atualizar-foto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ foto_perfil: caminhoFirebase }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Foto de perfil atualizada com sucesso!");
        setMessageType("success");
        // Atualiza o contexto do usuário com a nova foto
        const updatedUser = { ...user, foto_perfil: caminhoFirebase };
        updateUser(updatedUser);
        console.log("Foto atualizada:", caminhoFirebase);
        console.log("Usuário atualizado:", updatedUser);
      } else {
        setMessage(data.error || "Erro ao atualizar foto no banco.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      setMessage("Erro de conexão. Tente novamente.");
      setMessageType("error");
    } finally {
      setUploading(false);
      // Limpa o input
      e.target.value = "";
    }
  };

  const handleRemovePhoto = async () => {
    if (!user.foto_perfil) return;

    if (!window.confirm("Tem certeza que deseja remover sua foto de perfil?")) {
      return;
    }

    setUploading(true);
    setMessage("");
    setMessageType("");

    try {
      // Se o caminho for do Firebase, deletar do Firebase
      if (user.foto_perfil.startsWith("imagem_perfil/")) {
        await excluirFotoPerfilUsuario(user.foto_perfil);
      }

      // Atualizar no backend (remover caminho do banco)
      const response = await fetchWithAuth("/usuario/atualizar-foto", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ foto_perfil: null }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Foto de perfil removida com sucesso!");
        setMessageType("success");
        // Atualiza o contexto do usuário removendo a foto
        updateUser({ ...user, foto_perfil: null });
      } else {
        setMessage(data.error || "Erro ao remover a foto.");
        setMessageType("error");
      }
    } catch (error) {
      console.error("Erro na remoção:", error);
      setMessage("Erro de conexão. Tente novamente.");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    const loadUserImageUrl = async () => {
      if (user?.foto_perfil) {
        try {
          const url = await getImageUrl(user.foto_perfil);
          setUserImageUrl(url);
        } catch (error) {
          console.error("Erro ao carregar imagem do usuário:", error);
          setUserImageUrl(null);
        }
      } else {
        setUserImageUrl(null);
      }
    };

    loadUserImageUrl();
  }, [user]);

  // Se o usuário ainda não foi carregado (pode acontecer em um refresh),
  // mostramos uma mensagem de carregamento.
  if (!user) {
    return <div>Carregando perfil...</div>;
  }

  return (
    <div>
      <h1>Meu Perfil</h1>

      {/* Mensagens de feedback */}
      {message && (
        <div className={`profile-message ${messageType}`}>{message}</div>
      )}

      <div className="profile-details">
        <div className="profile-photo-container">
          {user.foto_perfil ? (
            <img
              src={userImageUrl || `${API_URL}${user.foto_perfil}`}
              alt="Foto do Perfil"
              className="profile-photo"
            />
          ) : (
            <div className="profile-photo-placeholder">
              <span>{user.nome.charAt(0)}</span>
            </div>
          )}

          <div className="photo-buttons">
            <label
              htmlFor="photo-upload"
              className={`photo-upload-button ${uploading ? "uploading" : ""}`}
            >
              {uploading ? "Enviando..." : "Alterar Foto"}
            </label>

            {user.foto_perfil && (
              <button
                onClick={handleRemovePhoto}
                className="photo-remove-button"
                disabled={uploading}
              >
                Remover Foto
              </button>
            )}
          </div>

          <input
            type="file"
            id="photo-upload"
            accept="image/*"
            onChange={handlePhotoChange}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </div>

        <div className="profile-info-text">
          <p>
            <strong>Nome:</strong> {user.nome}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
          <p>
            <strong>Cargo:</strong> {user.cargo}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;
