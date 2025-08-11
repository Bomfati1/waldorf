import React, { useState } from "react";
import "../css/CadastrarTurmaPage.css"; // Importando o CSS para o formulário

// Dados de exemplo. No futuro, virão de uma API.
const professoresDisponiveis = [
  { id: 3, nome: "Beatriz Costa" },
  { id: 4, nome: "Daniel Martins" },
  { id: 5, nome: "Fernanda Lima" },
  { id: 6, nome: "Roberto Alves" },
];

const CadastrarTurmaPage = () => {
  const [nomeTurma, setNomeTurma] = useState("");
  const [periodo, setPeriodo] = useState("Manhã");
  const [nivel, setNivel] = useState("Maternal");
  const [professoresSelecionados, setProfessoresSelecionados] = useState([]);

  const handleProfessoresChange = (e) => {
    const selectedOptions = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    setProfessoresSelecionados(selectedOptions);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nomeTurma.trim()) {
      alert("Por favor, preencha o nome da turma.");
      return;
    }
    if (professoresSelecionados.length === 0) {
      alert("Por favor, selecione ao menos um professor.");
      return;
    }

    const novaTurma = {
      nome: nomeTurma,
      periodo,
      nivel,
      professoresIds: professoresSelecionados,
    };

    console.log("Nova Turma a ser cadastrada:", novaTurma);
    alert("Turma cadastrada com sucesso! (Verifique o console)");

    // Limpar o formulário
    setNomeTurma("");
    setPeriodo("Manhã");
    setNivel("Maternal");
    setProfessoresSelecionados([]);
  };

  return (
    <div className="cadastrar-turma-container">
      <h1>Cadastrar Nova Turma</h1>
      <form onSubmit={handleSubmit} className="turma-form">
        <div className="form-group">
          <label htmlFor="nome-turma">Nome da Turma</label>
          <input
            type="text"
            id="nome-turma"
            value={nomeTurma}
            onChange={(e) => setNomeTurma(e.target.value)}
            placeholder="Ex: Turma do Sol"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="periodo">Período</label>
          <select
            id="periodo"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="Manhã">Manhã</option>
            <option value="Tarde">Tarde</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="nivel">Nível</label>
          <select
            id="nivel"
            value={nivel}
            onChange={(e) => setNivel(e.target.value)}
          >
            <option value="Maternal">Maternal</option>
            <option value="Jardim">Jardim</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="professores">Professores</label>
          <select
            id="professores"
            multiple
            value={professoresSelecionados}
            onChange={handleProfessoresChange}
            className="multiple-select"
          >
            {professoresDisponiveis.map((prof) => (
              <option key={prof.id} value={prof.id}>
                {prof.nome}
              </option>
            ))}
          </select>
          <small>Segure Ctrl (ou Cmd em Mac) para selecionar mais de um.</small>
        </div>

        <button type="submit" className="submit-button">
          Cadastrar Turma
        </button>
      </form>
    </div>
  );
};

export default CadastrarTurmaPage;
