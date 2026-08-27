-- ASSISTENTE DO INSTRUTOR — CURSOS V3 — CONTEÚDO COMPLETO
-- Migração complementar. Altera somente o conteúdo dos 6 cursos da nova aba CURSOS.
-- Não altera alunos, aulas, HSI-DOTH-P, RPA ÚNICO, financeiro ou assinatura.

begin;

-- Remove apenas o conteúdo anterior desses seis cursos para permitir atualização idempotente.
delete from public.ai_course_modules
where course_id in (
  select id from public.ai_courses where title in (
    'Formação de Instrutor Neuroeducador de Trânsito',
    'HSI-DOTH-P aplicado às aulas',
    'NEXUS 12 — Competências para condução segura',
    'Neurociência da aprendizagem no trânsito',
    'Psicologia do trânsito aplicada ao instrutor',
    'Percepção de risco e tomada de decisão',
    'Inteligência emocional e autorregulação no trânsito',
    'Andragogia aplicada à instrução de trânsito',
    'Comunicação, conflito e humanização no trânsito',
    'Primeiros socorros para instrutores'
  )
);

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 1 — Fundamentos da Neuroeducação', 'Cérebro, aprendizagem e comportamento', $content$A neuroeducação aproxima conhecimentos sobre funcionamento cerebral, aprendizagem e práticas educativas. No contexto da formação de condutores, sua utilidade está em ajudar o instrutor a compreender por que atenção, memória, emoção, repetição, feedback e contexto interferem na aprendizagem. O objetivo não é transformar o instrutor em profissional da saúde, mas ampliar sua capacidade pedagógica para organizar experiências de aprendizagem mais claras, significativas e seguras.

O instrutor deve observar o aluno como alguém que aprende em interação com uma tarefa, um ambiente e um estado emocional. Por isso, uma aula não deve ser entendida apenas como transmissão de comandos. Ela envolve preparação, percepção, execução, correção, repetição e reflexão. Quanto mais coerentes forem esses elementos, maiores são as oportunidades de consolidar comportamentos adequados.

Na prática ENAT, o conhecimento neuroeducacional deve resultar em decisões pedagógicas observáveis: dividir uma tarefa complexa em etapas, usar instruções objetivas, permitir tempo para processamento, repetir com propósito, oferecer feedback e registrar a evolução.$content$, 1, true
from public.ai_courses where title = 'Neuroeducação Aplicada ao Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 2 — Atenção e Memória', 'Como o aluno seleciona, processa e consolida informações', $content$A condução exige atenção contínua a sinais, movimentos, velocidade, posição, distância, comandos, pedestres e demais usuários. A atenção, entretanto, é limitada e pode sofrer interferência de fadiga, ansiedade, excesso de estímulos e preocupações externas. O instrutor deve, portanto, ensinar o aluno a selecionar informações relevantes e a organizar a observação.

A memória de trabalho participa do processamento imediato de instruções e situações. Quando muitas informações são apresentadas de uma vez, a execução pode se tornar confusa. Uma estratégia pedagógica é reduzir a carga inicial, trabalhar uma habilidade por vez e somente depois combinar tarefas.

A consolidação depende de prática significativa e recuperação das informações. Perguntar ao aluno o que ele percebeu, por que tomou determinada decisão e o que faria diferente ajuda a transformar a experiência em aprendizagem. O objetivo é sair da simples repetição mecânica e construir compreensão.$content$, 2, true
from public.ai_courses where title = 'Neuroeducação Aplicada ao Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 3 — Neuroplasticidade e Aprendizagem Motora', 'Prática, repetição, erro e consolidação', $content$A aprendizagem modifica padrões de resposta por meio da experiência. No ensino de direção, isso significa que prática e repetição precisam ter finalidade. Repetir um erro sem feedback pode reforçar uma estratégia inadequada; repetir uma execução corrigida, com atenção ao objetivo, favorece a construção de respostas mais consistentes.

A aprendizagem motora ocorre progressivamente. O aluno pode começar dependendo de instruções externas e, com experiência, passar a reconhecer situações e executar procedimentos com maior autonomia. O instrutor deve acompanhar essa transição sem retirar o suporte antes da hora.

O erro é uma fonte de informação pedagógica. Em vez de apenas apontar que algo está errado, o instrutor pode perguntar o que o aluno percebeu, qual foi o ponto de decisão e qual alternativa seria mais segura. Essa abordagem transforma o erro em oportunidade de análise e reduz a aprendizagem baseada exclusivamente em medo ou punição.$content$, 3, true
from public.ai_courses where title = 'Neuroeducação Aplicada ao Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 4 — Emoção, Estresse e Tomada de Decisão', 'O estado emocional como componente da aprendizagem', $content$Emoções influenciam atenção, percepção, memória e tomada de decisão. Ansiedade elevada pode estreitar o foco do aluno; frustração pode aumentar impulsividade; excesso de confiança pode reduzir a percepção de risco. O instrutor precisa reconhecer esses estados sem diagnosticar transtornos ou assumir funções clínicas.

A primeira intervenção é pedagógica: reduzir a complexidade da tarefa quando necessário, organizar a sequência, comunicar com clareza e criar condições para que o aluno recupere o controle da situação. Pausas breves, respiração consciente e reformulação da instrução podem ajudar o aluno a retomar a atenção.

A tomada de decisão segura depende da capacidade de perceber, interpretar, avaliar alternativas e agir. Ensinar o aluno a verbalizar o raciocínio durante exercícios supervisionados pode revelar onde ocorre a dificuldade: percepção, interpretação, decisão ou execução. Esse diagnóstico pedagógico orienta a próxima experiência de aprendizagem.$content$, 4, true
from public.ai_courses where title = 'Neuroeducação Aplicada ao Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 5 — Neuroeducação na Aula Prática', 'Transformando conhecimento em metodologia', $content$Uma aula neuroeducacional começa antes da movimentação do veículo. O instrutor pode estabelecer o objetivo da sessão, explicar o que será observado e verificar o estado inicial do aluno. Durante a atividade, deve controlar a quantidade de informação, observar sinais de sobrecarga e adaptar a comunicação sem perder o objetivo pedagógico.

O feedback deve ser específico. Em vez de apenas dizer 'faça melhor', indique o comportamento observado, a consequência e a alternativa esperada. Depois, permita nova tentativa. A sequência observar → orientar → praticar → revisar cria um ciclo de aprendizagem.

A individualização também é importante. Dois alunos podem apresentar o mesmo erro por razões diferentes. Um pode não perceber o risco; outro pode perceber, mas não conseguir executar a resposta. O instrutor deve evitar conclusões precipitadas e usar os registros da aula para planejar intervenções posteriores.$content$, 5, true
from public.ai_courses where title = 'Neuroeducação Aplicada ao Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 6 — Aplicação ENAT', 'Integração com HSI-DOTH-P, NEXUS 12 e RPA ÚNICO', $content$A proposta ENAT integra neuroeducação, comportamento e segurança viária. O HSI-DOTH-P pode ser utilizado como registro pedagógico dos fatores humanos observados no processo de aprendizagem, enquanto o NEXUS 12 organiza competências relacionadas à condução segura. O RPA ÚNICO consolida registros produzidos no sistema para acompanhamento da evolução.

Essa integração não transforma instrumentos pedagógicos em diagnóstico clínico. Os resultados devem ser interpretados no contexto da aula e utilizados para orientar planejamento, feedback e acompanhamento.

O instrutor deve registrar fatos observáveis, evitar rótulos e comparar a evolução do aluno ao longo do tempo. Uma boa aplicação do modelo produz perguntas úteis: o que melhorou, o que permanece instável, em quais situações o aluno apresenta maior dificuldade e qual será o próximo objetivo de aprendizagem?$content$, 6, true
from public.ai_courses where title = 'Neuroeducação Aplicada ao Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 1 — O fator humano no trânsito', 'Pessoa, tarefa, ambiente e contexto', $content$O trânsito é um sistema no qual pessoas, veículos, vias, regras e condições ambientais interagem. O fator humano corresponde ao conjunto de processos cognitivos, emocionais, comportamentais e sociais que influenciam a forma como uma pessoa percebe situações, toma decisões e age.

Para o instrutor, estudar fatores humanos significa aprender a observar além do resultado final. Uma execução inadequada pode estar relacionada a falta de conhecimento, dificuldade perceptiva, ansiedade, pressa, influência social, excesso de tarefas ou inadequação da estratégia de ensino. A observação contextual evita reduzir todo comportamento a 'falta de atenção'.

A formação deve estimular responsabilidade sem culpabilização automática. O aluno precisa compreender que suas escolhas têm consequências e, ao mesmo tempo, aprender estratégias concretas para administrar riscos.$content$, 1, true
from public.ai_courses where title = 'Fatores Humanos no Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 2 — Percepção e Consciência Situacional', 'O que o condutor percebe antes de agir', $content$Perceber não é apenas enxergar. O condutor precisa selecionar informações relevantes, interpretar o que acontece e construir uma representação da situação. A consciência situacional envolve perceber elementos, compreender seu significado e antecipar como podem evoluir.

O instrutor pode desenvolver essa competência com perguntas: O que você está vendo? O que pode acontecer? Quem pode entrar na sua trajetória? Qual alternativa oferece maior margem de segurança? Essas perguntas estimulam o aluno a antecipar em vez de reagir apenas quando o risco já está instalado.

A percepção também é afetada por velocidade, visibilidade, distrações e carga cognitiva. A aula deve criar oportunidades para o aluno identificar essas limitações e desenvolver estratégias compensatórias.$content$, 2, true
from public.ai_courses where title = 'Fatores Humanos no Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 3 — Decisão e Comportamento', 'Da percepção à ação', $content$Toda condução envolve decisões. Algumas são rápidas e automatizadas; outras exigem análise. O instrutor deve ensinar que decisão segura não significa ausência de risco, mas escolha consciente de uma alternativa com maior margem de segurança diante das condições disponíveis.

Uma forma útil de trabalhar é reconstruir situações depois da execução: qual informação estava disponível, quais alternativas existiam, por que determinada escolha foi feita e qual consequência poderia ocorrer? A análise posterior permite transformar acontecimentos em aprendizagem.

O comportamento observado deve ser descrito de forma objetiva. Evite rótulos como 'irresponsável' ou 'nervoso'. Prefira descrições como 'manteve velocidade acima do objetivo durante a aproximação' ou 'demorou a identificar a presença do pedestre'. Isso melhora o feedback e reduz julgamentos pessoais.$content$, 3, true
from public.ai_courses where title = 'Fatores Humanos no Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 4 — Impulsividade e Autorregulação', 'Interromper respostas automáticas', $content$Impulsividade pode aparecer quando a pessoa age antes de avaliar suficientemente as consequências. No trânsito, isso pode se manifestar como aceleração desnecessária, ultrapassagem inadequada, reação agressiva ou insistência em uma decisão mesmo diante de novas informações.

A autorregulação envolve reconhecer o estado interno, interromper a resposta automática quando possível e escolher uma ação compatível com o objetivo de segurança. O instrutor pode treinar esse processo por meio de pausas deliberadas, verbalização do raciocínio e exercícios de antecipação.

O foco não deve ser moralizar a emoção. O aluno pode sentir irritação ou ansiedade e ainda assim aprender estratégias para não transformar o estado emocional em comportamento de risco.$content$, 4, true
from public.ai_courses where title = 'Fatores Humanos no Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 5 — Influência Social', 'Como outras pessoas alteram decisões', $content$O comportamento no trânsito é influenciado por passageiros, outros condutores, expectativas sociais, pressão por desempenho e modelos observados. Um aluno pode dirigir de forma diferente quando está sozinho, acompanhado ou sendo avaliado.

O instrutor deve explorar situações de influência social sem estimular confronto. Perguntas como 'o que mudaria se alguém pressionasse você?' ajudam o aluno a identificar gatilhos e preparar respostas.

A segurança precisa ser apresentada como valor coletivo. Respeitar o espaço do outro, comunicar intenções e evitar disputas são comportamentos que reduzem conflitos e contribuem para um ambiente viário mais previsível.$content$, 5, true
from public.ai_courses where title = 'Fatores Humanos no Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 6 — Intervenção Pedagógica', 'Do comportamento observado ao plano de aula', $content$A observação dos fatores humanos só tem valor pedagógico quando produz uma ação. Depois de identificar uma dificuldade, o instrutor deve definir um objetivo específico, selecionar uma estratégia e observar novamente o comportamento.

Um plano simples pode conter: comportamento observado, situação em que ocorreu, possível fator contribuinte, objetivo da próxima aula, estratégia de intervenção e evidência esperada de evolução. O registro deve permanecer descritivo e contextual.

A intervenção deve respeitar os limites profissionais do instrutor. Questões que ultrapassem a finalidade pedagógica ou indiquem necessidade de avaliação especializada devem ser encaminhadas de maneira responsável, sem diagnóstico ou exposição do aluno.$content$, 6, true
from public.ai_courses where title = 'Fatores Humanos no Trânsito';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 1 — Conceito e Finalidade', 'Instrumento de acompanhamento pedagógico', $content$O HSI-DOTH-P é apresentado neste ambiente como instrumento de apoio ao acompanhamento de fatores humanos relacionados ao processo de formação. Sua finalidade é organizar observações e resultados para auxiliar o instrutor no planejamento pedagógico.

O instrumento não deve ser utilizado como diagnóstico clínico, perícia ou substituto de avaliações profissionais externas. Seu valor está na sistematização de informações do processo de aprendizagem.

Uma aplicação consistente exige registro padronizado, compreensão dos critérios e interpretação contextual. O resultado numérico deve ser acompanhado de evidências e observações, evitando que uma única pontuação seja tratada como retrato definitivo do aluno.$content$, 1, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 2 — D: Decisão', 'Escolhas, antecipação e risco', $content$A dimensão Decisão observa aspectos relacionados à forma como o aluno escolhe entre alternativas diante das condições de trânsito. O foco pedagógico está em identificar se o aluno percebe informações relevantes, considera consequências e seleciona respostas compatíveis com a segurança.

O instrutor pode registrar situações concretas e depois discutir o raciocínio utilizado. A intervenção deve favorecer antecipação e tomada de decisão consciente.

O acompanhamento longitudinal é mais útil do que uma leitura isolada. O objetivo é verificar se, com orientação e prática, o aluno passa a reconhecer riscos mais cedo e a escolher alternativas com maior margem de segurança.$content$, 2, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 3 — O: Organização', 'Planejamento e coordenação da condução', $content$Organização envolve preparar a ação, coordenar tarefas e manter uma sequência adequada. Durante a aula, pode ser observada na preparação do veículo, organização da atenção, execução de procedimentos e gerenciamento simultâneo de informações.

O instrutor deve separar desorganização momentânea de dificuldade persistente. Uma tarefa pode parecer desorganizada porque o aluno ainda está construindo uma rotina. Nesse caso, demonstração, checklist e repetição estruturada podem ajudar.

O objetivo é aumentar progressivamente a autonomia sem eliminar o acompanhamento. A organização deve servir à segurança e não apenas à eficiência.$content$, 3, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 4 — T: Tempo', 'Pressão temporal e ritmo de execução', $content$A dimensão Tempo permite observar como o aluno administra ritmo, tempo de reação, pressão temporal e necessidade de esperar o momento adequado para agir.

Pressa não é sinônimo de eficiência. Em diversas situações, esperar alguns segundos pode ampliar a margem de segurança. O instrutor deve ensinar o aluno a reconhecer quando a situação exige velocidade de resposta e quando exige contenção.

Registros devem considerar o contexto: tráfego, visibilidade, complexidade da tarefa e experiência do aluno. A interpretação deve evitar conclusões baseadas em um único episódio.$content$, 4, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 5 — H: Humanização', 'Empatia, convivência e responsabilidade', $content$Humanização envolve reconhecer que o trânsito é compartilhado por pessoas com diferentes necessidades, capacidades e vulnerabilidades. O instrutor pode trabalhar respeito, comunicação, paciência e responsabilidade coletiva como componentes da condução segura.

A empatia não significa abrir mão das regras. Significa compreender que uma escolha segura também considera os efeitos sobre os demais usuários.

Durante as aulas, situações envolvendo pedestres, ciclistas, motociclistas, idosos ou pessoas com mobilidade reduzida podem ser utilizadas para ampliar a percepção social do aluno.$content$, 5, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 6 — P: Psicocomportamental', 'Emoções, impulsividade e padrões de comportamento', $content$A dimensão Psicocomportamental permite organizar observações sobre estados emocionais, autorregulação, impulsividade e padrões comportamentais relevantes para a aprendizagem.

O instrutor deve registrar comportamentos observáveis, evitando rótulos. Em vez de classificar o aluno como 'agressivo', registre a situação, a resposta apresentada e as condições em que ocorreu.

O objetivo pedagógico é identificar oportunidades de desenvolvimento e acompanhar mudanças ao longo das aulas.$content$, 6, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 7 — Interpretação dos resultados', 'Leitura responsável dos indicadores', $content$Resultados devem ser interpretados considerando histórico, contexto e observações. Uma pontuação mais baixa ou mais alta não deve ser utilizada isoladamente para definir capacidades permanentes do aluno.

O instrutor pode procurar tendências: estabilidade, melhora, oscilação ou dificuldade persistente. A partir disso, define objetivos de aprendizagem e acompanha se a intervenção produziu mudança observável.

A interpretação responsável também exige atenção à qualidade dos registros. Dados incompletos podem produzir uma visão incompleta do processo.$content$, 7, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 8 — Aplicação pedagógica', 'HSI-DOTH-P, aula e RPA ÚNICO', $content$A aplicação mais útil ocorre quando o HSI-DOTH-P está integrado ao fluxo da aula. O instrutor realiza a atividade, observa fatores relevantes, registra os resultados e utiliza essas informações para planejar a próxima intervenção.

Quando os registros estão completos, o RPA ÚNICO pode organizar a evolução e facilitar a visualização de tendências. O foco continua sendo pedagógico: transformar dados em decisões de ensino.

O instrumento deve apoiar o profissional, não substituir seu julgamento técnico. Sempre que houver necessidade de avaliação fora do escopo pedagógico, deve-se buscar o profissional ou serviço competente.$content$, 8, true
from public.ai_courses where title = 'HSI-DOTH-P na Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 1 — Princípios da Direção Defensiva', 'Prevenção antes da reação', $content$Direção defensiva é uma abordagem preventiva. Seu fundamento pedagógico é ensinar o condutor a reconhecer condições de risco, antecipar possibilidades e adotar comportamentos que ampliem a margem de segurança.

O instrutor deve apresentar segurança como processo contínuo. Não basta conhecer regras; é necessário aplicar conhecimentos diante de situações variáveis.

Durante a aula, o aluno pode ser estimulado a identificar riscos antes de executar manobras, verbalizar possibilidades e justificar escolhas.$content$, 1, true
from public.ai_courses where title = 'Direção Defensiva e Percepção de Risco';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 2 — Identificação de Riscos', 'O que pode dar errado e por quê', $content$Risco envolve a possibilidade de um evento indesejado e suas consequências. A identificação de riscos começa pela observação do ambiente: circulação, sinalização, condições da via, clima, comportamento de outros usuários e características do próprio veículo.

O exercício pedagógico é transformar o olhar passivo em busca ativa de ameaças. O aluno deve aprender a perguntar: qual é o risco principal, quais riscos secundários existem e qual ação reduz a exposição?$content$, 2, true
from public.ai_courses where title = 'Direção Defensiva e Percepção de Risco';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 3 — Antecipação', 'Agir antes que a situação se torne crítica', $content$Antecipar significa considerar como a situação pode evoluir. Um veículo parado pode iniciar movimento; um pedestre pode mudar de trajetória; uma motocicleta pode surgir em área de menor visibilidade.

O instrutor pode trabalhar cenários hipotéticos durante a condução, sempre preservando a segurança. A pergunta 'o que você espera que aconteça nos próximos segundos?' ajuda a desenvolver consciência situacional.$content$, 3, true
from public.ai_courses where title = 'Direção Defensiva e Percepção de Risco';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 4 — Tomada de Decisão', 'Escolher com margem de segurança', $content$Uma decisão segura considera alternativas e consequências. O aluno deve aprender que reduzir velocidade, aumentar distância, esperar ou mudar a estratégia também são decisões.

A avaliação deve observar não somente se a manobra foi concluída, mas como foi tomada a decisão. O objetivo é formar um condutor capaz de adaptar sua ação às condições reais.$content$, 4, true
from public.ai_courses where title = 'Direção Defensiva e Percepção de Risco';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 5 — Situações Críticas', 'Gerenciamento de emergências e conflitos', $content$Situações críticas exigem reconhecimento rápido, controle emocional e priorização. O instrutor pode trabalhar cenários de risco de forma simulada e segura, evitando exercícios que coloquem aluno ou terceiros em perigo.

Depois de cada situação, faça uma revisão: o que foi percebido, quando o risco ficou claro, qual ação foi escolhida e que alternativa poderia ampliar a segurança?$content$, 5, true
from public.ai_courses where title = 'Direção Defensiva e Percepção de Risco';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 6 — Aplicação na Aula', 'Transformando direção defensiva em competência', $content$A direção defensiva deve aparecer em todas as aulas, não apenas em um conteúdo isolado. O instrutor pode definir um objetivo por sessão, observar comportamentos e registrar evidências de evolução.

A integração com HSI-DOTH-P e NEXUS 12 permite relacionar percepção de risco, decisão, adaptação, comunicação e responsabilidade social ao desempenho observado.$content$, 6, true
from public.ai_courses where title = 'Direção Defensiva e Percepção de Risco';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 1 — O Instrutor como Educador', 'Identidade profissional e responsabilidade pedagógica', $content$O instrutor de trânsito exerce uma função educativa. Sua comunicação, postura, organização e forma de corrigir erros influenciam a experiência de aprendizagem.

Ser educador não significa perder objetividade. Significa transformar cada intervenção em oportunidade de desenvolvimento, respeitando limites profissionais e mantendo a segurança como referência.$content$, 1, true
from public.ai_courses where title = 'Metodologia da Aula Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 2 — Planejamento da Aula', 'Objetivos antes da execução', $content$Uma aula planejada possui objetivo, estratégia, critérios de observação e forma de fechamento. O instrutor deve considerar o estágio do aluno, experiências anteriores e dificuldades registradas.

Objetivos específicos facilitam a avaliação. Em vez de 'melhorar a direção', formule algo observável, como 'identificar antecipadamente situações de conflito em cruzamentos'. $content$, 2, true
from public.ai_courses where title = 'Metodologia da Aula Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 3 — Comunicação Instrutor-Aluno', 'Clareza, escuta e instrução', $content$Instruções precisam ser claras, oportunas e compatíveis com a capacidade de processamento do aluno naquele momento. Evite excesso de fala durante tarefas complexas.

A escuta também é pedagógica. Pergunte ao aluno o que percebeu, o que entendeu e por que tomou determinada decisão. Isso fornece evidências do processo cognitivo.$content$, 3, true
from public.ai_courses where title = 'Metodologia da Aula Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 4 — Feedback e Correção', 'Corrigir para ensinar', $content$Feedback eficaz descreve o comportamento, explica a consequência e orienta a próxima tentativa. O objetivo é permitir que o aluno saiba o que fazer diferente.

A correção deve ocorrer em condições seguras. Quando a situação exige intervenção imediata, priorize a segurança; a análise pedagógica pode ocorrer depois.$content$, 4, true
from public.ai_courses where title = 'Metodologia da Aula Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 5 — Avaliação do Desempenho', 'Evidências de aprendizagem', $content$Avaliar não é apenas aprovar ou reprovar. É verificar evolução em relação aos objetivos definidos. O instrutor pode combinar observação, perguntas, desempenho prático e registros de aula.

A avaliação contínua permite adaptar o planejamento. Uma dificuldade persistente pode exigir mudança de estratégia, mais prática ou encaminhamento quando ultrapassar o escopo pedagógico.$content$, 5, true
from public.ai_courses where title = 'Metodologia da Aula Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 6 — Registro e Evolução', 'Documentar para acompanhar', $content$Registros organizados permitem comparar sessões e identificar tendências. Devem ser objetivos, respeitosos e úteis para a próxima intervenção.

O RPA ÚNICO pode consolidar informações do sistema. Quanto melhor a qualidade dos registros originais, mais útil será a consolidação.$content$, 6, true
from public.ai_courses where title = 'Metodologia da Aula Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 7 — Individualização', 'Ensinar pessoas, não apenas procedimentos', $content$Alunos têm experiências, ritmos e necessidades diferentes. Individualizar não significa criar privilégios; significa ajustar estratégias para alcançar objetivos pedagógicos.

O instrutor pode variar demonstração, explicação, repetição, perguntas e feedback conforme a resposta do aluno, mantendo critérios de segurança e desempenho.$content$, 7, true
from public.ai_courses where title = 'Metodologia da Aula Prática';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 1 — Inteligência Emocional', 'Reconhecer emoções sem perder o foco', $content$Inteligência emocional pode ser trabalhada pedagogicamente como capacidade de reconhecer estados emocionais, compreender sua influência e escolher respostas mais adequadas. No trânsito, isso é relevante porque emoções alteram atenção, interpretação e comportamento.

O primeiro passo é reconhecer sinais. O instrutor pode incentivar o aluno a identificar tensão, pressa, irritação ou medo antes que esses estados determinem uma ação insegura.$content$, 1, true
from public.ai_courses where title = 'Inteligência Emocional para Instrutores';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 2 — Autorregulação', 'Criar espaço entre impulso e resposta', $content$Autorregulação envolve interromper respostas automáticas e escolher conscientemente uma conduta. Estratégias simples incluem pausa, respiração, redução de velocidade quando apropriado, reavaliação da situação e retomada do objetivo de segurança.

O treinamento deve ocorrer em situações seguras e progressivas. O instrutor deve demonstrar autorregulação pelo próprio comportamento.$content$, 2, true
from public.ai_courses where title = 'Inteligência Emocional para Instrutores';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 3 — Ansiedade e Desempenho', 'Quando a emoção interfere na aprendizagem', $content$Ansiedade pode aumentar preocupação, reduzir confiança e dificultar a execução. O instrutor não deve diagnosticar transtornos, mas pode reconhecer sinais pedagógicos de sobrecarga.

Reduzir a complexidade, dividir tarefas, oferecer instruções claras e permitir repetição estruturada pode ajudar. Quando houver sofrimento significativo ou necessidade clínica, a orientação deve respeitar os limites profissionais e buscar apoio adequado.$content$, 3, true
from public.ai_courses where title = 'Inteligência Emocional para Instrutores';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 4 — Comunicação Assertiva', 'Falar com clareza e respeito', $content$Comunicação assertiva combina objetividade e respeito. O instrutor precisa transmitir informações importantes sem humilhar, ameaçar ou criar medo desnecessário.

Mensagens curtas e específicas são especialmente úteis durante a condução. Após a situação, uma conversa mais detalhada pode explorar o raciocínio e a emoção envolvida.$content$, 4, true
from public.ai_courses where title = 'Inteligência Emocional para Instrutores';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 5 — Conflitos', 'Reduzir escalada emocional', $content$Conflitos podem ocorrer entre instrutor e aluno ou entre usuários da via. O profissional deve evitar alimentar disputas. A prioridade é segurança, redução da exposição e comunicação controlada.

Depois do evento, a análise deve buscar aprendizagem: qual foi o gatilho, qual resposta apareceu e qual estratégia poderia reduzir a escalada numa situação futura?$content$, 5, true
from public.ai_courses where title = 'Inteligência Emocional para Instrutores';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 6 — Empatia Profissional', 'Compreender sem abandonar critérios', $content$Empatia é compreender a perspectiva do outro sem necessariamente concordar com todas as suas escolhas. Na relação instrutor-aluno, ela ajuda a identificar medo, insegurança e expectativas.

A empatia deve coexistir com limites profissionais. O instrutor pode acolher uma dificuldade e, ao mesmo tempo, manter o objetivo pedagógico e os requisitos de segurança.$content$, 6, true
from public.ai_courses where title = 'Inteligência Emocional para Instrutores';

insert into public.ai_course_modules (course_id,title,subtitle,content,sort_order,active)
select id, 'Módulo 7 — Autocuidado e Desempenho', 'O instrutor também precisa se regular', $content$O estado do instrutor influencia a qualidade da aula. Fadiga, irritação e sobrecarga podem prejudicar comunicação e tomada de decisão.

Autocuidado profissional inclui organização da agenda, pausas possíveis, preparação antes das aulas, reconhecimento de limites e busca de apoio quando necessário. Cuidar do profissional contribui para uma prática mais segura e sustentável.$content$, 7, true
from public.ai_courses where title = 'Inteligência Emocional para Instrutores';

commit;
