/**
 * Utilitários para trabalhar com semanas ISO 8601
 * Usando date-fns para cálculos precisos de calendário
 */

const {
  getISOWeek,
  getISOWeekYear,
  startOfISOWeek,
  endOfISOWeek,
  eachDayOfInterval,
  getMonth,
  setISOWeek,
  setYear,
  startOfMonth,
  endOfMonth,
  eachWeekOfInterval,
  format,
} = require("date-fns");
const { ptBR } = require("date-fns/locale");

/**
 * Retorna informações completas de uma semana ISO
 * @param {number} ano - Ano ISO da semana
 * @param {number} semana - Número da semana ISO (1-53)
 * @returns {Object} Informações detalhadas da semana
 */
function getInfoSemanaISO(ano, semana) {
  try {
    // Cria uma data na semana especificada
    const dataReferencia = setISOWeek(setYear(new Date(), ano), semana);

    const inicioSemana = startOfISOWeek(dataReferencia);
    const fimSemana = endOfISOWeek(dataReferencia);

    // Pega todos os dias da semana
    const diasSemana = eachDayOfInterval({
      start: inicioSemana,
      end: fimSemana,
    });

    // Identifica os meses tocados (1-12)
    const mesesAbrangidos = [
      ...new Set(diasSemana.map((dia) => getMonth(dia) + 1)),
    ];

    return {
      semanaISO: getISOWeek(dataReferencia),
      anoISO: getISOWeekYear(dataReferencia),
      inicioSemana: format(inicioSemana, "yyyy-MM-dd"),
      fimSemana: format(fimSemana, "yyyy-MM-dd"),
      inicioSemanaFormatado: format(inicioSemana, "dd 'de' MMMM", {
        locale: ptBR,
      }),
      fimSemanaFormatado: format(fimSemana, "dd 'de' MMMM", { locale: ptBR }),
      mesesAbrangidos,
      diasSemana: diasSemana.map((d) => format(d, "yyyy-MM-dd")),
      compartilhada: mesesAbrangidos.length > 1,
      descricao: `Semana ${getISOWeek(dataReferencia)}/${getISOWeekYear(
        dataReferencia
      )}`,
    };
  } catch (error) {
    console.error("Erro ao calcular info da semana:", error);
    throw new Error(`Semana ${semana}/${ano} inválida`);
  }
}

/**
 * Retorna todas as semanas ISO que tocam um mês específico
 * @param {number} ano - Ano do mês
 * @param {number} mes - Mês (1-12)
 * @returns {Array} Lista de semanas ISO que tocam o mês
 */
function getSemanasISOMes(ano, mes) {
  try {
    const inicioMes = startOfMonth(new Date(ano, mes - 1));
    const fimMes = endOfMonth(new Date(ano, mes - 1));

    // Pega todas as semanas do mês (começando na segunda-feira)
    const semanasDoMes = eachWeekOfInterval(
      { start: inicioMes, end: fimMes },
      { weekStartsOn: 1 } // Segunda-feira
    );

    // Remove duplicatas usando Set baseado em chave única
    const semanasUnicas = new Map();

    semanasDoMes.forEach((dataSegunda) => {
      const semanaISO = getISOWeek(dataSegunda);
      const anoISO = getISOWeekYear(dataSegunda);
      const chave = `${anoISO}-W${semanaISO}`;

      if (!semanasUnicas.has(chave)) {
        semanasUnicas.set(chave, getInfoSemanaISO(anoISO, semanaISO));
      }
    });

    return Array.from(semanasUnicas.values());
  } catch (error) {
    console.error("Erro ao calcular semanas do mês:", error);
    throw new Error(`Erro ao processar mês ${mes}/${ano}`);
  }
}

/**
 * Verifica se uma semana é compartilhada entre meses
 * @param {number} ano - Ano ISO
 * @param {number} semana - Número da semana ISO
 * @returns {boolean}
 */
function isSemanaCompartilhada(ano, semana) {
  const info = getInfoSemanaISO(ano, semana);
  return info.compartilhada;
}

/**
 * Retorna o nome do mês em português
 * @param {number} mes - Número do mês (1-12)
 * @returns {string}
 */
function getNomeMes(mes) {
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return meses[mes - 1] || "Mês Inválido";
}

/**
 * Retorna informações sobre quais meses uma semana compartilhada toca
 * @param {number} ano - Ano ISO
 * @param {number} semana - Número da semana ISO
 * @returns {Object} Informações sobre compartilhamento
 */
function getInfoCompartilhamento(ano, semana) {
  const info = getInfoSemanaISO(ano, semana);

  if (!info.compartilhada) {
    return {
      compartilhada: false,
      meses: [info.mesesAbrangidos[0]],
      nomesMeses: [getNomeMes(info.mesesAbrangidos[0])],
    };
  }

  return {
    compartilhada: true,
    meses: info.mesesAbrangidos,
    nomesMeses: info.mesesAbrangidos.map((m) => getNomeMes(m)),
    descricao: `Semana compartilhada entre ${info.mesesAbrangidos
      .map((m) => getNomeMes(m))
      .join(" e ")}`,
  };
}

module.exports = {
  getInfoSemanaISO,
  getSemanasISOMes,
  isSemanaCompartilhada,
  getNomeMes,
  getInfoCompartilhamento,
};
