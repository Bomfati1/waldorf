/**
 * Utilitários para validação e formatação de CPF
 */

/**
 * Remove caracteres não numéricos do CPF
 */
export const cleanCPF = (cpf) => {
  if (!cpf) return "";
  return cpf.replace(/\D/g, "");
};

/**
 * Formata CPF para exibição (XXX.XXX.XXX-XX)
 */
export const formatCPF = (cpf) => {
  const cleaned = cleanCPF(cpf);
  if (cleaned.length !== 11) return cpf;

  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

/**
 * Valida CPF usando algoritmo oficial
 */
export const validateCPF = (cpf) => {
  const cleaned = cleanCPF(cpf);

  // CPF deve ter 11 dígitos
  if (cleaned.length !== 11) return false;

  // Verifica se todos os dígitos são iguais (CPF inválido)
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(9))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cleaned.charAt(10))) return false;

  return true;
};

/**
 * Máscara de CPF para input
 * Formata enquanto o usuário digita
 */
export const maskCPF = (value) => {
  const cleaned = cleanCPF(value);

  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return cleaned.replace(/(\d{3})(\d{1,3})/, "$1.$2");
  if (cleaned.length <= 9)
    return cleaned.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
};
