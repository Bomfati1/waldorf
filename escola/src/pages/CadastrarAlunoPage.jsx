import React, { useState } from "react";
import "../css/CadastrarAlunoPage.css"; // Importar o CSS

const CadastrarAlunoPage = () => {
  // Estado para os dados do aluno
  const [nomeAluno, setNomeAluno] = useState("");
  const [nascimento, setNascimento] = useState("");
  const [infoSaude, setInfoSaude] = useState("");
  const [statusPagamento, setStatusPagamento] = useState("Em dia");
  const [periodo, setPeriodo] = useState("Manhã");
  const [nivel, setNivel] = useState("Maternal");

  // Estado para os dados do responsável
  const [nomeResponsavel, setNomeResponsavel] = useState("");
  const [telefoneResponsavel, setTelefoneResponsavel] = useState("");
  const [emailResponsavel, setEmailResponsavel] = useState("");
  const [outroTelefone, setOutroTelefone] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validação simples
    if (
      !nomeAluno.trim() ||
      !nascimento ||
      !nomeResponsavel.trim() ||
      !telefoneResponsavel.trim() ||
      !emailResponsavel.trim()
    ) {
      alert("Por favor, preencha todos os campos obrigatórios (*).");
      return;
    }

    const novoAluno = {
      aluno: {
        nome: nomeAluno,
        nascimento,
        infoSaude,
        statusPagamento,
        periodo,
        nivel,
      },
      responsavel: {
        nome: nomeResponsavel,
        telefone: telefoneResponsavel,
        email: emailResponsavel,
        outroTelefone,
      },
    };

    console.log("Novo Aluno a ser cadastrado:", novoAluno);
    alert("Aluno cadastrado com sucesso! (Verifique o console)");

    // Limpar o formulário
    setNomeAluno("");
    setNascimento("");
    setInfoSaude("");
    setStatusPagamento("Em dia");
    setPeriodo("Manhã");
    setNivel("Maternal");
    setNomeResponsavel("");
    setTelefoneResponsavel("");
    setEmailResponsavel("");
    setOutroTelefone("");
  };

  return (
    <div className="cadastrar-aluno-container">
      <h1>Cadastrar Novo Aluno</h1>
      <form onSubmit={handleSubmit} className="aluno-form">
        <fieldset className="form-section">
          <legend>Dados do Aluno</legend>
          <div className="form-group">
            <label htmlFor="nome-aluno">Nome Completo *</label>
            <input
              type="text"
              id="nome-aluno"
              value={nomeAluno}
              onChange={(e) => setNomeAluno(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="nascimento">Data de Nascimento *</label>
            <input
              type="date"
              id="nascimento"
              value={nascimento}
              onChange={(e) => setNascimento(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="info-saude">Informações de Saúde</label>
            <textarea
              id="info-saude"
              value={infoSaude}
              onChange={(e) => setInfoSaude(e.target.value)}
              placeholder="Alergias, medicamentos, etc."
            ></textarea>
          </div>
          <div className="form-group">
            <label htmlFor="pagamento">Status do Pagamento</label>
            <select
              id="pagamento"
              value={statusPagamento}
              onChange={(e) => setStatusPagamento(e.target.value)}
            >
              <option value="Bolsista">Bolsista</option>
              <option value="Integral">Integral</option>
            </select>
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
              <option value="Integral">Integral</option>
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
        </fieldset>

        <fieldset className="form-section">
          <legend>Dados do Responsável</legend>
          <div className="form-group">
            <label htmlFor="nome-responsavel">Nome do Responsável *</label>
            <input
              type="text"
              id="nome-responsavel"
              value={nomeResponsavel}
              onChange={(e) => setNomeResponsavel(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="telefone-responsavel">Telefone *</label>
            <input
              type="tel"
              id="telefone-responsavel"
              value={telefoneResponsavel}
              onChange={(e) => setTelefoneResponsavel(e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="email-responsavel">Email *</label>
            <input
              type="email"
              id="email-responsavel"
              value={emailResponsavel}
              onChange={(e) => setEmailResponsavel(e.target.value)}
              placeholder="email@exemplo.com"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="outro-telefone">Outro Telefone</label>
            <input
              type="tel"
              id="outro-telefone"
              value={outroTelefone}
              onChange={(e) => setOutroTelefone(e.target.value)}
              placeholder="(XX) XXXXX-XXXX"
            />
          </div>
        </fieldset>

        <button type="submit" className="submit-button">
          Cadastrar Aluno
        </button>
      </form>
    </div>
  );
};

export default CadastrarAlunoPage;
