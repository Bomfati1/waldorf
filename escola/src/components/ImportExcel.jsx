import React, { useState } from 'react';

const ImportExcel = ({ 
  endpoint, 
  title, 
  description, 
  acceptedColumns, 
  onSuccess, 
  onError,
  buttonText = "Importar Excel"
}) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validar extensão do arquivo
      const validExtensions = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (!validExtensions.includes(fileExtension)) {
        setMessage('Por favor, selecione um arquivo válido (.xlsx, .xls ou .csv)');
        setMessageType('error');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setMessage('');
      setMessageType('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setMessage('Por favor, selecione um arquivo Excel');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    const formData = new FormData();
    // Determina o nome do campo baseado no endpoint
    let fieldName = 'responsaveis_excel'; // padrão
    if (endpoint.includes('alunos')) {
      fieldName = 'alunos_excel';
    } else if (endpoint.includes('interessados')) {
      fieldName = 'interessados_excel';
    }
    formData.append(fieldName, file);

    try {
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setMessageType('success');
        setFile(null);
        if (onSuccess) onSuccess(data);
      } else {
        if (data.details && Array.isArray(data.details)) {
          // Se há detalhes de erro, mostrar os primeiros 5
          const errorDetails = data.details.slice(0, 5).join('\n');
          const remainingErrors = data.details.length > 5 ? `\n... e mais ${data.details.length - 5} erros` : '';
          setMessage(`${data.error}\n\nDetalhes:\n${errorDetails}${remainingErrors}`);
        } else {
          setMessage(data.error || 'Erro na importação');
        }
        setMessageType('error');
        if (onError) onError(data);
      }
    } catch (error) {
      setMessage('Erro de conexão. Verifique se o servidor está rodando.');
      setMessageType('error');
      if (onError) onError({ error: 'Erro de conexão' });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Criar um template básico baseado no tipo de importação
    let templateData = [];
    
    if (endpoint.includes('alunos')) {
      templateData = [
        {
          'Nome Completo Aluno': 'João Silva',
          'Data Nascimento': '2015-03-15',
          'Informações Saúde': 'Alergia a lactose',
          'Status Pagamento': 'Integral',
          'Nome Responsável': 'Maria Silva',
          'Telefone': '(11) 99999-9999',
          'Email': 'maria@email.com',
          'Outro Telefone': '(11) 88888-8888',
          'RG': '12.345.678-9',
          'CPF': '123.456.789-00'
        },
        {
          'Nome Completo Aluno': 'Ana Santos',
          'Data Nascimento': '2016-07-22',
          'Informações Saúde': '',
          'Status Pagamento': 'Bolsista',
          'Nome Responsável': 'Pedro Santos',
          'Telefone': '(11) 77777-7777',
          'Email': 'pedro@email.com',
          'Outro Telefone': '',
          'RG': '',
          'CPF': '987.654.321-00'
        },
        {
          'Nome Completo Aluno': 'Carlos Oliveira',
          'Data Nascimento': '2014-11-08',
          'Informações Saúde': 'Asma',
          'Status Pagamento': 'Integral',
          'Nome Responsável': 'Claudia Oliveira',
          'Telefone': '(11) 66666-6666',
          'Email': 'claudia@email.com',
          'Outro Telefone': '(11) 55555-5555',
          'RG': '45.678.901-2',
          'CPF': '456.789.012-34'
        }
      ];
    } else if (endpoint.includes('interessados')) {
      templateData = [
        {
          'Nome': 'João Silva',
          'Email': 'joao@email.com',
          'Telefone': '(11) 99999-9999',
          'Data': '2024-01-15',
          'Status': 'Entrou Em Contato',
          'Intenção': 'sim',
          'Observações': 'Interessado em matrícula para 2024'
        },
        {
          'Nome': 'Maria Santos',
          'Email': 'maria@email.com',
          'Telefone': '(11) 88888-8888',
          'Data': '2024-01-20',
          'Status': 'Conversando',
          'Intenção': 'sim',
          'Observações': 'Aguardando visita agendada'
        },
        {
          'Nome': 'Pedro Oliveira',
          'Email': 'pedro@email.com',
          'Telefone': '(11) 77777-7777',
          'Data': '2024-01-25',
          'Status': 'Negociando',
          'Intenção': 'nao',
          'Observações': 'Precisa de mais informações sobre valores'
        }
      ];
    } else {
      templateData = [
        {
          'Nome Completo': 'Maria Silva',
          'Email': 'maria@email.com',
          'Telefone': '(11) 99999-9999',
          'Outro Telefone': '(11) 88888-8888',
          'RG': '12.345.678-9',
          'CPF': '123.456.789-00'
        },
        {
          'Nome Completo': 'Pedro Santos',
          'Email': 'pedro@email.com',
          'Telefone': '(11) 77777-7777',
          'Outro Telefone': '',
          'RG': '',
          'CPF': '987.654.321-00'
        }
      ];
    }

    // Criar CSV como alternativa (mais simples que Excel)
    const headers = Object.keys(templateData[0]);
    
    // Função para escapar campos CSV corretamente
    const escapeCSVField = (field) => {
      if (field === null || field === undefined) return '""';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };
    
    const csvContent = [
      headers.join(','),
      ...templateData.map(row => 
        headers.map(header => escapeCSVField(row[header])).join(',')
      )
    ].join('\n');

    // Criar e baixar arquivo CSV com BOM para compatibilidade
    const BOM = '\uFEFF';
    const csvContentWithBOM = BOM + csvContent;
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    let fileName = 'template-responsaveis.csv'; // padrão
    if (endpoint.includes('alunos')) {
      fileName = 'template-alunos.csv';
    } else if (endpoint.includes('interessados')) {
      fileName = 'template-interessados.csv';
    }
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="import-excel-container">
      <h3>{title}</h3>
              <p className="import-description">
          {description} 
          <br />
          <small>Formatos aceitos: .xlsx, .xls, .csv</small>
        </p>
      
      <div className="accepted-columns">
        <h4>Colunas aceitas:</h4>
        <ul>
          {acceptedColumns.map((column, index) => (
            <li key={index}>
              <strong>{column.name}</strong> - {column.description}
              {column.required && <span className="required"> *</span>}
            </li>
          ))}
        </ul>
      </div>

      <div className="template-section">
        <button 
          type="button" 
          onClick={downloadTemplate}
          className="template-button"
        >
          📥 Baixar Template CSV
        </button>
      </div>

      <form onSubmit={handleSubmit} className="import-form">
        <div className="file-input-container">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
            className="file-input"
            id="excel-file"
          />
          <label htmlFor="excel-file" className="file-input-label">
            {file ? file.name : 'Selecionar arquivo Excel'}
          </label>
        </div>

        {message && (
          <div className={`message ${messageType}`}>
            <pre>{message}</pre>
          </div>
        )}

        <button 
          type="submit" 
          disabled={!file || loading}
          className="import-button"
        >
          {loading ? 'Importando...' : buttonText}
        </button>
      </form>
    </div>
  );
};

export default ImportExcel;
