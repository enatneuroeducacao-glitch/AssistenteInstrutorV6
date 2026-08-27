export function buildModuleAssessment(course, module, moduleIndex) {
  const firstSentence = (module.content || "").split(/[.!?]\s/)[0].trim();
  const otherSubtitles = course.modules
    .map((item, index) => ({ text: item.subtitle, index }))
    .filter(item => item.index !== moduleIndex)
    .map(item => item.text);

  const distractors = [
    "Decorar procedimentos sem compreender o contexto da aula.",
    "Substituir a observação pedagógica por uma conclusão automática sobre o aluno.",
    "Concentrar a formação apenas na execução mecânica, sem reflexão ou acompanhamento."
  ];

  return [
    {
      id: `${course.id}-${moduleIndex}-1`,
      question: "Qual é o foco central deste módulo?",
      options: [module.subtitle, ...otherSubtitles.slice(0, 3)],
      answer: 0
    },
    {
      id: `${course.id}-${moduleIndex}-2`,
      question: "Qual afirmação está diretamente de acordo com o conteúdo estudado?",
      options: [
        firstSentence || module.content.slice(0, 220),
        "O conteúdo deve ser aplicado sem considerar o contexto do aluno.",
        "A aprendizagem depende apenas da repetição mecânica de procedimentos.",
        "O instrutor deve evitar relacionar o conteúdo à prática profissional."
      ],
      answer: 0
    },
    {
      id: `${course.id}-${moduleIndex}-3`,
      question: "Qual é a forma mais adequada de levar este conhecimento para a prática do instrutor?",
      options: [
        "Transformar o conhecimento em observações, decisões pedagógicas e situações aplicáveis à aula.",
        distractors[0],
        distractors[1],
        distractors[2]
      ],
      answer: 0
    },
    {
      id: `${course.id}-${moduleIndex}-4`,
      question: "Qual postura é mais coerente com a proposta deste curso?",
      options: [
        "Considerar o contexto, observar evidências e acompanhar a evolução do aluno.",
        "Avaliar o aluno por um único episódio e desconsiderar sua evolução.",
        "Usar rótulos como substitutos de registros objetivos.",
        "Priorizar velocidade de execução mesmo quando a segurança estiver comprometida."
      ],
      answer: 0
    },
    {
      id: `${course.id}-${moduleIndex}-5`,
      question: "Qual é a finalidade pedagógica mais compatível com o conteúdo?",
      options: [
        "Ampliar a capacidade do instrutor de promover aprendizagem, segurança e desenvolvimento profissional.",
        "Substituir avaliações ou profissionais externos quando houver necessidade específica.",
        "Criar uma classificação permanente do aluno a partir de uma única aula.",
        "Eliminar a necessidade de planejamento e feedback durante a formação."
      ],
      answer: 0
    }
  ];
}
