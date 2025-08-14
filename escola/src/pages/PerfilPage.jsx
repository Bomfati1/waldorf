import React from "react";
import { useAuth } from "../context/AuthContext"; // Importar o hook
import "../css/PerfilPage.css"; // Vamos criar este CSS a seguir

const PerfilPage = () => {
  // Obter dados do usuário logado a partir do nosso contexto
  const { user } = useAuth();

  const handlePhotoChange = (e) => {
    // Lógica para fazer upload da nova foto
    console.log("Nova foto selecionada:", e.target.files[0]);
    alert("Funcionalidade de upload de foto a ser implementada!");
  };

  // Se o usuário ainda não foi carregado (pode acontecer em um refresh),
  // mostramos uma mensagem de carregamento.
  if (!user) {
    return <div>Carregando perfil...</div>;
  }

  return (
    <div>
      <h1>Meu Perfil</h1>
      <div className="profile-details">
        <div className="profile-photo-container">
          {user.photoUrl ? (
            <img
              src={user.photoUrl}
              alt="Foto do Perfil"
              className="profile-photo"
            />
          ) : (
            <div className="profile-photo-placeholder">
              <span>{user.nome.charAt(0)}</span>
            </div>
          )}
          <label htmlFor="photo-upload" className="photo-upload-button">
            Alterar Foto
          </label>
          <input
            type="file"
            id="photo-upload"
            onChange={handlePhotoChange}
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
