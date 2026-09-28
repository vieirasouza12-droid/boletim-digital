// =====================================================
// DADOS FICTÍCIOS — 8º ANO (não alterar nesta etapa)
// =====================================================
const dadosBrutos = [
  { disciplina: "Língua Portuguesa", tri1: 82, tri2: "7,8", tri3: 85, faltas: [2, 1, 1] },
  { disciplina: "Matemática", tri1: 52, tri2: "5,8", tri3: null, faltas: [3, 2, 1] },
  { disciplina: "Ciências", tri1: "8,1", tri2: 76, tri3: 8.0, faltas: [1, 2, 0] },
  { disciplina: "História", tri1: 7.0, tri2: 84, tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Geografia", tri1: 68, tri2: 7.3, tri3: "7,9", faltas: [0, 1, 1] },
  { disciplina: "Língua Inglesa", tri1: 86, tri2: "8,1", tri3: 8.7, faltas: [1, 0, 0] },
  { disciplina: "Arte", tri1: 9.0, tri2: 92, tri3: null, faltas: [1, 1, 0] },
  { disciplina: "Educação Física", tri1: 95, tri2: 9.0, tri3: "9,4", faltas: [0, 1, 0] },
  { disciplina: "Educação Digital", tri1: 88, tri2: 9.1, tri3: 93, faltas: [1, 0, 1] },
  { disciplina: "Educação Financeira", tri1: 74, tri2: "7,8", tri3: null, faltas: [1, 1, 1] },
  { disciplina: "Estudo Orientado", tri1: 8.0, tri2: 83, tri3: "8,5", faltas: [0, 1, 0] },
  { disciplina: "Redação e Leitura", tri1: 62, tri2: "6,8", tri3: null, faltas: [2, 1, 1] },
  { disciplina: "Pensamento Lógico", tri1: 48, tri2: 5.6, tri3: "6,0", faltas: [2, 2, 1] },
  { disciplina: "Literatura Arte e Movimento", tri1: "7,7", tri2: 80, tri3: null, faltas: [1, 0, 1] },
  { disciplina: "Práticas Experimentais", tri1: 58, tri2: "6,2", tri3: 6.4, faltas: [1, 1, 1] }
];

// Média mínima de referência
const MEDIA_MINIMA = 6.0;

// =====================================================
// FUNÇÃO: normalizarNota(valor)
// Converte diferentes formatos para a escala 0 a 10.
// Retorna null quando a nota não existe ou é inválida.
// =====================================================
function normalizarNota(valor) {
  // Vazio, null ou undefined = nota ainda não lançada
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  // Se for texto, troca vírgula por ponto e converte para número
  let numero;
  if (typeof valor === "string") {
    numero = parseFloat(valor.replace(",", "."));
  } else {
    numero = valor;
  }

  // Se não for um número válido, retorna null (não entra na média)
  if (isNaN(numero)) {
    return null;
  }

  // Valores entre 0 e 10 permanecem iguais
  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  // Valores maiores que 10 e até 100 são divididos por 10
  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  // Fora das regras → inválido
  return null;
}

// =====================================================
// FUNÇÃO: calcularMedia(notas)
// Recebe um array de notas (já normalizadas ou null)
// e retorna a média usando SOMENTE as notas válidas.
// Se não houver nenhuma nota válida, retorna null.
// =====================================================
function calcularMedia(notas) {
  const validas = notas.filter(function (n) {
    return n !== null;
  });

  if (validas.length === 0) {
    return null;
  }

  const soma = validas.reduce(function (total, n) {
    return total + n;
  }, 0);

  return soma / validas.length;
}

// =====================================================
// FUNÇÃO: somarFaltas(faltas)
// Soma os números inteiros de faltas dos trimestres.
// =====================================================
function somarFaltas(faltas) {
  return faltas.reduce(function (total, f) {
    return total + f;
  }, 0);
}

// =====================================================
// FUNÇÃO: definirSituacao(media)
// Define a situação a partir da média disponível.
// =====================================================
function definirSituacao(media) {
  if (media === null) {
    return { texto: "Nota ainda não disponível", classe: "situacao-sem-nota" };
  }
  if (media >= MEDIA_MINIMA) {
    return { texto: "Bom desempenho", classe: "situacao-bom" };
  }
  return { texto: "Atenção", classe: "situacao-atencao" };
}

// =====================================================
// FUNÇÃO: formatarNota(valor)
// Mostra a nota com uma casa decimal, ou "—" se for null.
// =====================================================
function formatarNota(valor) {
  if (valor === null) {
    return "—";
  }
  return valor.toFixed(1).replace(".", ",");
}

// =====================================================
// FUNÇÃO: montarBoletim()
// Percorre os dados brutos, calcula tudo e preenche:
// - a tabela do HTML
// - os cards de resumo
// =====================================================
function montarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");

  // Variáveis para os cards
  let somaMedias = 0;
  let quantidadeMedias = 0;
  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;

  // forEach percorre cada disciplina do array
  dadosBrutos.forEach(function (item) {
    // 1) Normaliza as três notas
    const n1 = normalizarNota(item.tri1);
    const n2 = normalizarNota(item.tri2);
    const n3 = normalizarNota(item.tri3);

    // 2) Calcula a média apenas com as notas disponíveis
    const media = calcularMedia([n1, n2, n3]);

    // 3) Soma as faltas
    const faltas = somarFaltas(item.faltas);

    // 4) Define a situação
    const situacao = definirSituacao(media);

    // 5) Acumula para os cards
    totalFaltas += faltas;
    if (media !== null) {
      somaMedias += media;
      quantidadeMedias++;
    }
    if (situacao.texto === "Bom desempenho") {
      bomDesempenho++;
    } else if (situacao.texto === "Atenção") {
      atencao++;
    }

    // 6) Cria a linha da tabela e adiciona no DOM
    const linha = document.createElement("tr");
    linha.innerHTML =
      "<td>" + item.disciplina + "</td>" +
      "<td>" + formatarNota(n1) + "</td>" +
      "<td>" + formatarNota(n2) + "</td>" +
      "<td>" + formatarNota(n3) + "</td>" +
      "<td>" + formatarNota(media) + "</td>" +
      "<td>" + faltas + "</td>" +
      "<td class='" + situacao.classe + "'>" + situacao.texto + "</td>";

    corpoTabela.appendChild(linha);
  });

  // =====================================================
  // PREENCHER OS CARDS
  // =====================================================

  // Média geral (das disciplinas que têm pelo menos uma nota)
  const mediaGeral = quantidadeMedias > 0 ? somaMedias / quantidadeMedias : null;
  document.getElementById("card-media-geral").textContent =
    mediaGeral !== null ? formatarNota(mediaGeral) : "—";

  // Total de faltas
  document.getElementById("card-total-faltas").textContent = totalFaltas;

  // Disciplinas com bom desempenho
  document.getElementById("card-bom-desempenho").textContent = bomDesempenho;

  // Disciplinas que precisam de atenção
  document.getElementById("card-atencao").textContent = atencao;

  // Frequência — ATENÇÃO: valor apenas DEMONSTRATIVO nesta etapa.
  // Não é calculado a partir das faltas. No futuro será tratado de outra forma.
  const frequenciaDemo = 92;
  document.getElementById("card-frequencia").textContent = frequenciaDemo + "%";
  document.getElementById("card-frequencia-texto").textContent = "Frequência adequada";
}

// =====================================================
// Inicia o boletim quando a página carregar
// =====================================================
montarBoletim();