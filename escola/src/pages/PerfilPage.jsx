import React from "react";
import "../css/PerfilPage.css"; // Vamos criar este CSS a seguir

const PerfilPage = () => {
  // No futuro, você buscará os dados do usuário do estado global ou de uma API
  const user = {
    name: "Matheus",
    email: "matheus@example.com",
    // A URL da foto viria do banco de dados
    photoUrl: null,
  };

  const handlePhotoChange = (e) => {
    // Lógica para fazer upload da nova foto
    console.log("Nova foto selecionada:", e.target.files[0]);
    alert("Funcionalidade de upload de foto a ser implementada!");
  };

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
              <span>{user.name.charAt(0)}</span>
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
            <strong>Nome:</strong> {user.name}
          </p>
          <p>
            <strong>Email:</strong> {user.email}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerfilPage;
