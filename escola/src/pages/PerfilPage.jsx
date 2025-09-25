import React, { useState } from "react";
import { useAuth } from "../context/AuthContext"; // Importar o hook
import "../css/PerfilPage.css"; // Vamos criar este CSS a seguir

const PerfilPage = () => {
  // Obter dados do usuário logado a partir do nosso contexto
  const { user, updateUser } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
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

    const formData = new FormData();
    formData.append('profilePhoto', file);

    try {
      const response = await fetch('http://localhost:3001/upload-profile-photo', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType("success");
        // Atualiza o contexto do usuário com a nova foto
        updateUser({ ...user, foto_perfil: data.imageUrl });
      } else {
        setMessage(data.error || "Erro ao fazer upload da foto.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Erro de conexão. Tente novamente.");
      setMessageType("error");
    } finally {
      setUploading(false);
      // Limpa o input
      e.target.value = '';
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
      const response = await fetch('http://localhost:3001/remove-profile-photo', {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType("success");
        // Atualiza o contexto do usuário removendo a foto
        updateUser({ ...user, foto_perfil: null });
      } else {
        setMessage(data.error || "Erro ao remover a foto.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Erro de conexão. Tente novamente.");
      setMessageType("error");
    } finally {
      setUploading(false);
    }
  };

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
        <div className={`profile-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="profile-details">
        <div className="profile-photo-container">
          {user.foto_perfil ? (
            <img
              src={`http://localhost:3001${user.foto_perfil}`}
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
              className={`photo-upload-button ${uploading ? 'uploading' : ''}`}
            >
              {uploading ? 'Enviando...' : 'Alterar Foto'}
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
