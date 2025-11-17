import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import EditAlunoModal from "../components/EditAlunoModal";

const AlunoPerfilPage = () => {
  const { alunoId } = useParams();
  const navigate = useNavigate();
  const [aluno, setAluno] = useState(null);
  const [turmas, setTurmas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [detRes, turRes] = await Promise.all([
        fetch(`http://localhost:3001/alunos/${alunoId}/detalhes`, {
          credentials: "include",
        }),
        fetch("http://localhost:3001/turmas", { credentials: "include" }),
      ]);
      if (!detRes.ok) throw new Error("Falha ao carregar dados do aluno");
      if (!turRes.ok) throw new Error("Falha ao carregar turmas");
      const det = await detRes.json();
      const tur = await turRes.json();
      setAluno(det);
      setTurmas(tur);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alunoId) fetchAll();
  }, [alunoId]);

  const handleSave = async (updatedData) => {
    try {
      const resp = await fetch(
        `http://localhost:3001/alunos/${updatedData.aluno_id}`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedData),
        }
      );
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Falha ao salvar");
      setIsEditOpen(false);
      await fetchAll();
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading) return <div style={{ padding: 16 }}>Carregando...</div>;
  if (error)
    return <div style={{ padding: 16, color: "red" }}>Erro: {error}</div>;
  if (!aluno) return <div style={{ padding: 16 }}>Aluno não encontrado.</div>;

  return (
    <div style={{ padding: 16 }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: 12 }}>
        ← Voltar
      </button>
      <h1>Perfil do Aluno</h1>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: "50%",
            overflow: "hidden",
            background: "#eee",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 32,
          }}
        >
          {aluno.foto_perfil ? (
            <img
              src={`http://localhost:3001${aluno.foto_perfil}`}
              alt="Foto"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            (aluno.nome_aluno || "A").charAt(0).toUpperCase()
          )}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{aluno.nome_aluno}</h2>
          <div>Data de nascimento: {aluno.data_nascimento?.split("T")[0]}</div>
          <div>Pagamento: {aluno.status_pagamento}</div>
          <div>
            Turma:{" "}
            {aluno.nome_turma
              ? `${aluno.nome_turma} (${aluno.periodo}) - ${aluno.ano_letivo}`
              : "Sem turma"}
          </div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button onClick={() => setIsEditOpen(true)}>✏️ Editar</button>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          padding: 12,
          border: "1px solid #eee",
          borderRadius: 8,
        }}
      >
        <h3>Responsável</h3>
        <div>Nome: {aluno.nome_responsavel}</div>
        <div>Telefone: {aluno.telefone}</div>
        <div>Email: {aluno.email}</div>
      </div>

      {isEditOpen && (
        <EditAlunoModal
          alunoData={aluno}
          turmas={turmas}
          onClose={() => setIsEditOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default AlunoPerfilPage;
