// =====================================================
// CONFIGURAÇÃO FIXA DO ALUNO
// =====================================================
const CONFIG_ALUNO = {
  turma: "8B",
  numeroChamada: 4,
  apiUrl: "https://boletim-api.profbt.com.br"
};

// =====================================================
// DADOS FICTÍCIOS — 8º ANO (utilizados como fallback/inicial)
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

// Variáveis globais em memória para o estado da aplicação
let boletimAtual = [];
let pinSessao = "";

// =====================================================
// FUNÇÃO: normalizarNota(valor)
// Converte diferentes formatos para a escala 0 a 10.
// Retorna null quando a nota não existe ou é inválida.
// =====================================================
function normalizarNota(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  let numero;
  if (typeof valor === "string") {
    numero = parseFloat(valor.replace(",", "."));
  } else {
    numero = valor;
  }

  if (isNaN(numero)) {
    return null;
  }

  if (numero >= 0 && numero <= 10) {
    return numero;
  }

  if (numero > 10 && numero <= 100) {
    return numero / 10;
  }

  return null;
}

// =====================================================
// FUNÇÃO: calcularMedia(notas)
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
// =====================================================
function somarFaltas(faltas) {
  if (!Array.isArray(faltas)) return 0;
  return faltas.reduce(function (total, f) {
    const num = parseInt(f, 10);
    return total + (isNaN(num) ? 0 : num);
  }, 0);
}

// =====================================================
// FUNÇÃO: definirSituacao(media)
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
// =====================================================
function formatarNota(valor) {
  if (valor === null) {
    return "—";
  }
  return valor.toFixed(1).replace(".", ",");
}

// =====================================================
// FUNÇÃO: renderizarBoletim()
// Reconstrói os cards e a tabela garantindo segurança no DOM
// =====================================================
function renderizarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  corpoTabela.innerHTML = "";

  let somaMedias = 0;
  let quantidadeMedias = 0;
  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;