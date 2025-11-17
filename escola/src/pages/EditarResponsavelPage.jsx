import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import InputWithHint from "../components/InputWithHint";

const EditarResponsavelCSS = () => (
  <style>{`
    .edit-responsavel-container {
      max-width: 700px;
      margin: 2rem auto;
      padding: 2rem;
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .edit-responsavel-form {
      /* A estilização principal agora está no container */
      margin-top: 1.5rem;
    }
    .edit-responsavel-form h1 {
      display: none; /* O título agora está fora do formulário */
    }
    .edit-responsavel-container h1 {
      text-align: center;
      margin-bottom: 2rem;
      font-size: 1.8rem;
      color: #333;
    }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-group.full-width {
      grid-column: 1 / -1;
    }
    .form-group label {
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #555;
    }
    .form-group input {
      padding: 10px 12px;
      border: 1px solid #ccc;
      border-radius: 6px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    .form-group input:focus {
      outline: none;
      border-color: #17a2b8;
      box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.2);
    }
    .form-actions {
      grid-column: 1 / -1;
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e0e0e0;
    }
    .form-actions button {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 600;
      transition: background-color 0.2s, transform 0.1s;
    }
    .form-actions button:hover {
      transform: translateY(-2px);
    }
    .btn-save {
      background-color: #28a745;
      color: white;
    }
    .btn-cancel {
      background-color: #6c757d;
      color: white;
    }

    /* Estilos das Abas */
    .tabs-container {
      display: flex;
      border-bottom: 1px solid #ccc;
      margin-bottom: 1.5rem;
    }
    .tab-button {
      padding: 10px 20px;
      cursor: pointer;
      border: none;
      background-color: transparent;
      border-bottom: 3px solid transparent;
      margin-bottom: -1px;
      font-size: 1rem;
      color: #555;
      transition: color 0.2s, border-color 0.2s;
    }
    .tab-button.active {
      border-bottom-color: #17a2b8; /* Adicionei uma cor, ajuste se necessário */
      color: #17a2b8;
    }
  `}</style>
);

const EditarResponsavelPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [responsavelData, setResponsavelData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    outro_telefone: "",
    cpf: "",
    rg: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResponsavel = async () => {
      try {
        const response = await fetch(
          `http://localhost:3001/responsaveis/${id}`,
          {
            credentials: "include",
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Usuário não autenticado. Faça login novamente.");
          } else if (response.status === 404) {
            throw new Error("Responsável não encontrado.");
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
              errorData.error ||
                `Erro ${response.status}: ${response.statusText}`
            );
          }
        }

        const data = await response.json();

        setResponsavelData({
          nome_completo: data.nome_completo || "",
          email: data.email || "",
          telefone: data.telefone || "",
          outro_telefone: data.outro_telefone || "",
          cpf: data.cpf || "",
          rg: data.rg || "",
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      // Verifica se o ID é um número válido
      if (isNaN(id) || id <= 0) {
        setError("ID do responsável inválido.");
        setLoading(false);
        return;
      }
      fetchResponsavel();
    } else {
      setError("ID do responsável não fornecido.");
      setLoading(false);
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResponsavelData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:3001/responsaveis/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(responsavelData),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        if (response.status === 401) {
          throw new Error("Usuário não autenticado. Faça login novamente.");
        } else if (response.status === 404) {
          throw new Error("Responsável não encontrado.");
        } else {
          throw new Error(
            errData.error ||
              `Erro ${response.status}: Falha ao atualizar o responsável.`
          );
        }
      }

      alert("Responsável atualizado com sucesso!");
      navigate("/home/responsaveis");
    } catch (err) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: "2rem" }}>Carregando...</div>;
  if (error)
    return <div style={{ padding: "2rem", color: "red" }}>Erro: {error}</div>;

  return (
    <>
      <EditarResponsavelCSS />
      <form className="edit-responsavel-form" onSubmit={handleSubmit}>
        <h1>Editar Responsável</h1>
        <div className="form-grid">
          <div className="form-group full-width">
            <InputWithHint
              label="Nome Completo"
              hint="Nome completo do responsável legal conforme documento de identidade"
              type="text"
              name="nome_completo"
              value={responsavelData.nome_completo}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <InputWithHint
              label="Email"
              hint="Endereço de email para comunicações e notificações"
              type="email"
              name="email"
              value={responsavelData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <InputWithHint
              label="Telefone"
              hint="Telefone principal para contato. Formato: (00) 00000-0000"
              type="text"
              name="telefone"
              value={responsavelData.telefone}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <InputWithHint
              label="Outro Telefone (Opcional)"
              hint="Telefone secundário ou de contato alternativo"
              type="text"
              name="outro_telefone"
              value={responsavelData.outro_telefone}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <InputWithHint
              label="CPF"
              hint="CPF do responsável. Formato: 000.000.000-00"
              type="text"
              name="cpf"
              value={responsavelData.cpf}
              onChange={handleChange}
            />
          </div>
          <div className="form-group">
            <InputWithHint
              label="RG"
              hint="Número do RG do responsável"
              type="text"
              name="rg"
              value={responsavelData.rg}
              onChange={handleChange}
            />
          </div>
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/home/responsaveis")}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-save">
              Salvar Alterações
            </button>
          </div>
        </div>
      </form>
    </>
  );
};

export default EditarResponsavelPage;
