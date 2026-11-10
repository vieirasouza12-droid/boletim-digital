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

// Variáveis de controle das instâncias dos gráficos
let graficoMedias = null;
let graficoEvolucao = null;
let graficoFaltas = null;

// Referência interna de risco (NUNCA EXIBIDA NA INTERFACE)
const LIMITE_FALTAS_RISCO = 350;

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
// FUNÇÃO: carregarDadosLocais()
// Prepara os dados brutos padrão para a estrutura do sistema
// =====================================================
function carregarDadosLocais() {
  return dadosBrutos.map(function (item) {
    const f1 = item.faltas && item.faltas[0] !== undefined ? parseInt(item.faltas[0], 10) : 0;
    const f2 = item.faltas && item.faltas[1] !== undefined ? parseInt(item.faltas[1], 10) : 0;
    const f3 = item.faltas && item.faltas[2] !== undefined ? parseInt(item.faltas[2], 10) : 0;

    return {
      disciplina: item.disciplina,
      tri1: normalizarNota(item.tri1),
      tri2: normalizarNota(item.tri2),
      tri3: normalizarNota(item.tri3),
      faltas1: isNaN(f1) ? 0 : f1,
      faltas2: isNaN(f2) ? 0 : f2,
      faltas3: isNaN(f3) ? 0 : f3
    };
  });
}

// =====================================================
// FUNÇÃO: processarDadosAPI(dados)
// Adapta dados vindos da API
// =====================================================
function processarDadosAPI(dados) {
  if (!dados || !Array.isArray(dados.disciplinas)) {
    return carregarDadosLocais();
  }

  return dados.disciplinas.map(function (item) {
    const f1 = item.faltas1 !== undefined ? parseInt(item.faltas1, 10) : (item.faltas && item.faltas[0] !== undefined ? parseInt(item.faltas[0], 10) : 0);
    const f2 = item.faltas2 !== undefined ? parseInt(item.faltas2, 10) : (item.faltas && item.faltas[1] !== undefined ? parseInt(item.faltas[1], 10) : 0);
    const f3 = item.faltas3 !== undefined ? parseInt(item.faltas3, 10) : (item.faltas && item.faltas[2] !== undefined ? parseInt(item.faltas[2], 10) : 0);

    return {
      disciplina: item.disciplina,
      tri1: normalizarNota(item.tri1),
      tri2: normalizarNota(item.tri2),
      tri3: normalizarNota(item.tri3),
      faltas1: isNaN(f1) ? 0 : f1,
      faltas2: isNaN(f2) ? 0 : f2,
      faltas3: isNaN(f3) ? 0 : f3
    };
  });
}

// =====================================================
// FUNÇÕES DOS GRÁFICOS (CAMADA DE LEITURA)
// =====================================================
function atualizarGraficoMedias() {
  const canvas = document.getElementById("graficoMediasDisciplinas");
  if (!canvas || typeof Chart === "undefined") return;

  const labels = boletimAtual.map(function (item) { return item.disciplina; });
  const data = boletimAtual.map(function (item) {
    return calcularMedia([item.tri1, item.tri2, item.tri3]);
  });

  if (graficoMedias) {
    graficoMedias.destroy();
  }

  graficoMedias = new Chart(canvas, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Média",
        data: data,
        backgroundColor: "rgba(122, 74, 90, 0.75)",
        borderColor: "#7a4a5a",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          min: 0,
          max: 10,
          ticks: { color: "#777777" },
          grid: { color: "#e0e0e0" }
        },
        y: {
          ticks: { color: "#333333", font: { size: 11 } },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.raw;
              if (val === null || val === undefined) return " Sem nota";
              return " Média: " + val.toFixed(1).replace(".", ",");
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoEvolucao() {
  const canvas = document.getElementById("graficoEvolucaoTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  const t1Validas = boletimAtual.map(function (item) { return item.tri1; }).filter(function (n) { return n !== null; });
  const t2Validas = boletimAtual.map(function (item) { return item.tri2; }).filter(function (n) { return n !== null; });
  const t3Validas = boletimAtual.map(function (item) { return item.tri3; }).filter(function (n) { return n !== null; });

  const m1 = t1Validas.length > 0 ? t1Validas.reduce(function (a, b) { return a + b; }, 0) / t1Validas.length : null;
  const m2 = t2Validas.length > 0 ? t2Validas.reduce(function (a, b) { return a + b; }, 0) / t2Validas.length : null;
  const m3 = t3Validas.length > 0 ? t3Validas.reduce(function (a, b) { return a + b; }, 0) / t3Validas.length : null;

  if (graficoEvolucao) {
    graficoEvolucao.destroy();
  }

  graficoEvolucao = new Chart(canvas, {
    type: "line",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Média Geral",
        data: [m1, m2, m3],
        borderColor: "#7a4a5a",
        backgroundColor: "rgba(247, 198, 212, 0.4)",
        fill: true,
        tension: 0.2,
        pointBackgroundColor: "#7a4a5a",
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          min: 0,
          max: 10,
          ticks: { color: "#777777" },
          grid: { color: "#e0e0e0" }
        },
        x: {
          ticks: { color: "#333333" },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              const val = context.raw;
              if (val === null || val === undefined) return " Sem nota";
              return " Média: " + val.toFixed(1).replace(".", ",");
            }
          }
        }
      }
    }
  });
}

function atualizarGraficoFaltas() {
  const canvas = document.getElementById("graficoFaltasTrimestres");
  if (!canvas || typeof Chart === "undefined") return;

  let f1 = 0;
  let f2 = 0;
  let f3 = 0;

  boletimAtual.forEach(function (item) {
    f1 += (item.faltas1 || 0);
    f2 += (item.faltas2 || 0);
    f3 += (item.faltas3 || 0);
  });

  const totalAcumulado = f1 + f2 + f3;

  const elBadge = document.getElementById("estadoFaltas");
  const elCard = document.getElementById("card-grafico-faltas");

  if (totalAcumulado >= LIMITE_FALTAS_RISCO) {
    if (elBadge) elBadge.style.display = "block";
    if (elCard) elCard.classList.add("card-perigo");
  } else {
    if (elBadge) elBadge.style.display = "none";
    if (elCard) elCard.classList.remove("card-perigo");
  }

  if (graficoFaltas) {
    graficoFaltas.destroy();
  }

  graficoFaltas = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["1º Tri", "2º Tri", "3º Tri"],
      datasets: [{
        label: "Faltas",
        data: [f1, f2, f3],
        backgroundColor: "rgba(247, 198, 212, 0.85)",
        borderColor: "#7a4a5a",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { color: "#777777", precision: 0 },
          grid: { color: "#e0e0e0" }
        },
        x: {
          ticks: { color: "#333333" },
          grid: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (context) {
              return " " + context.raw + " faltas";
            }
          }
        }
      }
    }
  });
}

function atualizarGraficos() {
  atualizarGraficoMedias();
  atualizarGraficoEvolucao();
  atualizarGraficoFaltas();
}

// =====================================================
// FUNÇÃO: renderizarBoletim()
// Reconstrói os cards e a tabela garantindo segurança no DOM
// =====================================================
function renderizarBoletim() {
  const corpoTabela = document.getElementById("corpo-tabela");
  if (!corpoTabela) return;
  corpoTabela.innerHTML = "";

  let somaMedias = 0;
  let quantidadeMedias = 0;
  let totalFaltas = 0;
  let bomDesempenho = 0;
  let atencao = 0;

  boletimAtual.forEach(function (item) {
    const n1 = item.tri1;
    const n2 = item.tri2;
    const n3 = item.tri3;

    const arrFaltas = [item.faltas1 || 0, item.faltas2 || 0, item.faltas3 || 0];
    const faltasDisc = somarFaltas(arrFaltas);
    totalFaltas += faltasDisc;

    const media = calcularMedia([n1, n2, n3]);
    if (media !== null) {
      somaMedias += media;
      quantidadeMedias++;
      if (media >= MEDIA_MINIMA) {
        bomDesempenho++;
      } else {
        atencao++;
      }
    }

    const situacao = definirSituacao(media);

    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = item.disciplina;
    tr.appendChild(tdNome);

    const tdTri1 = document.createElement("td");
    tdTri1.textContent = formatarNota(n1);
    tr.appendChild(tdTri1);

    const tdTri2 = document.createElement("td");
    tdTri2.textContent = formatarNota(n2);
    tr.appendChild(tdTri2);

    const tdTri3 = document.createElement("td");
    tdTri3.textContent = formatarNota(n3);
    tr.appendChild(tdTri3);

    const tdMedia = document.createElement("td");
    tdMedia.textContent = formatarNota(media);
    tr.appendChild(tdMedia);

    const tdFaltas = document.createElement("td");
    tdFaltas.textContent = faltasDisc;
    tr.appendChild(tdFaltas);

    const tdSit = document.createElement("td");
    tdSit.textContent = situacao.texto;
    tdSit.className = situacao.classe;
    tr.appendChild(tdSit);

    corpoTabela.appendChild(tr);
  });

  // Atualiza Cards
  const elMediaGeral = document.getElementById("card-media-geral");
  if (elMediaGeral) {
    if (quantidadeMedias > 0) {
      elMediaGeral.textContent = formatarNota(somaMedias / quantidadeMedias);
    } else {
      elMediaGeral.textContent = "—";
    }
  }

  const elTotalFaltas = document.getElementById("card-total-faltas");
  if (elTotalFaltas) elTotalFaltas.textContent = totalFaltas;

  const elBomDesempenho = document.getElementById("card-bom-desempenho");
  if (elBomDesempenho) elBomDesempenho.textContent = bomDesempenho;

  const elAtencao = document.getElementById("card-atencao");
  if (elAtencao) elAtencao.textContent = atencao;

  const elFreq = document.getElementById("card-frequencia");
  if (elFreq) elFreq.textContent = "100%";

  const elFreqTxt = document.getElementById("card-frequencia-texto");
  if (elFreqTxt) elFreqTxt.textContent = "Frequência adequada";

  // Chamada de atualização da camada de visualização dos gráficos
  atualizarGraficos();
}

// =====================================================
// FUNÇÃO: renderizarTabelaEdicao()
// Monta os campos de input para edição de notas e faltas
// =====================================================
function renderizarTabelaEdicao() {
  const corpoEdicao = document.getElementById("corpo-tabela-edicao");
  if (!corpoEdicao) return;
  corpoEdicao.innerHTML = "";

  boletimAtual.forEach(function (item, idx) {
    const tr = document.createElement("tr");

    const tdNome = document.createElement("td");
    tdNome.textContent = item.disciplina;
    tr.appendChild(tdNome);

    function criarInputNota(valor, id) {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.type = "text";
      inp.id = id;
      inp.value = valor !== null ? String(valor).replace(".", ",") : "";
      td.appendChild(inp);
      return td;
    }

    function criarInputFalta(valor, id) {
      const td = document.createElement("td");
      const inp = document.createElement("input");
      inp.type = "number";
      inp.id = id;
      inp.value = valor !== null && valor !== undefined ? valor : 0;
      td.appendChild(inp);
      return td;
    }

    tr.appendChild(criarInputNota(item.tri1, `edit-n1-${idx}`));
    tr.appendChild(criarInputFalta(item.faltas1, `edit-f1-${idx}`));
    tr.appendChild(criarInputNota(item.tri2, `edit-n2-${idx}`));
    tr.appendChild(criarInputFalta(item.faltas2, `edit-f2-${idx}`));
    tr.appendChild(criarInputNota(item.tri3, `edit-n3-${idx}`));
    tr.appendChild(criarInputFalta(item.faltas3, `edit-f3-${idx}`));

    corpoEdicao.appendChild(tr);
  });
}

// =====================================================
// VALIDAÇÕES DA EDIÇÃO
// =====================================================
function validarNotaDigitada(str) {
  if (str === null || str === undefined) return null;
  const texto = str.trim();
  if (texto === "") return null;

  if (!/^\d+([.,]\d+)?$/.test(texto)) {
    return false;
  }

  const num = parseFloat(texto.replace(",", "."));
  if (isNaN(num) || num < 0 || num > 10) {
    return false;
  }

  return num;
}

function validarFaltaDigitada(str) {
  if (str === null || str === undefined) return false;
  const texto = String(str).trim();
  if (texto === "") return false;

  if (!/^\d+$/.test(texto)) {
    return false;
  }

  const num = parseInt(texto, 10);
  if (isNaN(num) || num < 0) {
    return false;
  }

  return num;
}

// =====================================================
// AÇÕES E EVENTOS HTTP / API
// =====================================================
document.addEventListener("DOMContentLoaded", function () {
  const btnEntrar = document.getElementById("btn-entrar");
  const inputPin = document.getElementById("input-pin");
  const msgLogin = document.getElementById("mensagem-login");
  const areaLogin = document.getElementById("area-login");
  const areaBoletim = document.getElementById("area-boletim");

  const btnAlterarDados = document.getElementById("btn-alterar-dados");
  const areaEdicao = document.getElementById("area-edicao");
  const btnSalvar = document.getElementById("btn-salvar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const msgSalvar = document.getElementById("mensagem-salvar");

  if (btnEntrar) {
    btnEntrar.addEventListener("click", async function () {
      const pinDigitado = inputPin.value.trim();
      if (!pinDigitado) {
        msgLogin.textContent = "Digite o PIN para continuar.";
        msgLogin.className = "mensagem-status erro";
        return;
      }

      msgLogin.textContent = "Conectando...";
      msgLogin.className = "mensagem-status";

      try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/abrir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turma: CONFIG_ALUNO.turma,
            numero_chamada: CONFIG_ALUNO.numeroChamada,
            pin: pinDigitado
          })
        });

        if (resposta.status === 401) {
          msgLogin.textContent = "Turma, chamada ou PIN inválidos.";
          msgLogin.className = "mensagem-status erro";
          return;
        }

        if (resposta.status === 429) {
          msgLogin.textContent = "Muitas tentativas. Aguarde um minuto e tente novamente.";
          msgLogin.className = "mensagem-status erro";
          return;
        }

        if (!resposta.ok) {
          msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
          msgLogin.className = "mensagem-status erro";
          return;
        }

        const resultado = await resposta.json();
        pinSessao = pinDigitado;
        inputPin.value = "";

        if (resultado.dados !== null) {
          boletimAtual = processarDadosAPI(resultado.dados);
        } else {
          boletimAtual = carregarDadosLocais();
        }

        areaLogin.style.display = "none";
        areaBoletim.style.display = "block";
        renderizarBoletim();

      } catch (err) {
        msgLogin.textContent = "Não foi possível conectar ao servidor. Tente novamente.";
        msgLogin.className = "mensagem-status erro";
      }
    });
  }

  if (btnAlterarDados) {
    btnAlterarDados.addEventListener("click", function () {
      renderizarTabelaEdicao();
      msgSalvar.textContent = "";
      areaEdicao.style.display = "block";
    });
  }

  if (btnCancelar) {
    btnCancelar.addEventListener("click", function () {
      areaEdicao.style.display = "none";
      msgSalvar.textContent = "";
    });
  }

  if (btnSalvar) {
    btnSalvar.addEventListener("click", async function () {
      let houverErro = false;
      const novosDados = [];

      document.querySelectorAll(".campo-invalido").forEach(function (el) {
        el.classList.remove("campo-invalido");
      });

      boletimAtual.forEach(function (item, idx) {
        const inpN1 = document.getElementById(`edit-n1-${idx}`);
        const inpF1 = document.getElementById(`edit-f1-${idx}`);
        const inpN2 = document.getElementById(`edit-n2-${idx}`);
        const inpF2 = document.getElementById(`edit-f2-${idx}`);
        const inpN3 = document.getElementById(`edit-n3-${idx}`);
        const inpF3 = document.getElementById(`edit-f3-${idx}`);

        const valN1 = validarNotaDigitada(inpN1.value);
        if (valN1 === false) { inpN1.classList.add("campo-invalido"); houverErro = true; }

        const valF1 = validarFaltaDigitada(inpF1.value);
        if (valF1 === false) { inpF1.classList.add("campo-invalido"); houverErro = true; }

        const valN2 = validarNotaDigitada(inpN2.value);
        if (valN2 === false) { inpN2.classList.add("campo-invalido"); houverErro = true; }

        const valF2 = validarFaltaDigitada(inpF2.value);
        if (valF2 === false) { inpF2.classList.add("campo-invalido"); houverErro = true; }

        const valN3 = validarNotaDigitada(inpN3.value);
        if (valN3 === false) { inpN3.classList.add("campo-invalido"); houverErro = true; }

        const valF3 = validarFaltaDigitada(inpF3.value);
        if (valF3 === false) { inpF3.classList.add("campo-invalido"); houverErro = true; }

        novosDados.push({
          disciplina: item.disciplina,
          tri1: valN1 === false ? null : valN1,
          tri2: valN2 === false ? null : valN2,
          tri3: valN3 === false ? null : valN3,
          faltas1: valF1 === false ? 0 : valF1,
          faltas2: valF2 === false ? 0 : valF2,
          faltas3: valF3 === false ? 0 : valF3
        });
      });

      if (houverErro) {
        msgSalvar.textContent = "Existem campos com valores inválidos. Corrija-os para salvar.";
        msgSalvar.className = "mensagem-status erro";
        return;
      }

      msgSalvar.textContent = "Salvando...";
      msgSalvar.className = "mensagem-status";

      try {
        const resposta = await fetch(`${CONFIG_ALUNO.apiUrl}/api/v1/boletins/salvar`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turma: CONFIG_ALUNO.turma,
            numero_chamada: CONFIG_ALUNO.numeroChamada,
            pin: pinSessao,
            dados: {
              disciplinas: novosDados
            }
          })
        });

        if (!resposta.ok) {
          msgSalvar.textContent = "Não foi possível salvar as alterações. Tente novamente.";
          msgSalvar.className = "mensagem-status erro";
          return;
        }

        boletimAtual = novosDados;
        renderizarBoletim();
        msgSalvar.textContent = "Dados salvos com sucesso.";
        msgSalvar.className = "mensagem-status sucesso";

        setTimeout(function () {
          areaEdicao.style.display = "none";
          msgSalvar.textContent = "";
        }, 1500);

      } catch (err) {
        msgSalvar.textContent = "Não foi possível salvar as alterações. Tente novamente.";
        msgSalvar.className = "mensagem-status erro";
      }
    });
  }
});