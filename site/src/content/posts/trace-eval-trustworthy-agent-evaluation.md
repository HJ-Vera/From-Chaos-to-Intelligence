---
title: 'Trace 与 Eval：面向复杂 Agent 系统的可信评估方法论'
description: '从 Trace、Eval 到 Validation，建立一套可追溯、可复现、可红队、可回归的复杂 Agent 可信评估框架。'
pubDate: 2026-07-13
category: 'Research'
heroImage: '../../assets/trace-eval-trustworthy-agent-evaluation.jpg'
homeFeatured: true
---

> 适用场景：为 Agent 或复杂异步系统建立可信评估，并且不能改变被测系统的运行行为。

## 摘要

复杂 Agent 系统的评估难点，往往不在于“如何让系统完成一次任务”，而在于“如何让我们相信自己对系统表现的判分是可信的”。一个 Agent 生成了报告、调用了工具、产出了文件，并不意味着它真的完成了任务；同样，一个 evaluator 给出了高分，也不意味着这个分数真的反映了系统能力。对于长链路、异步、多工具、多阶段的 Agent Runtime 来说，评估本身必须被视为一个需要设计、验证和维护的系统。

本文提出一套面向复杂 Agent 的可信评估框架。它的核心纲领是：**Trace 让我们相信事实记录是真的，Eval 让我们相信判分是真的，而 Validation 让我们相信评分器本身是可靠的。** 在这个框架中，Trace 负责记录系统实际发生了什么，Eval 基于 trace、artifact 和环境状态进行证据化判分，Validation 则反过来检验 evaluator 是否能够正确地区分成功、失败、绕过流程和 reward hacking。

这套方法论建立在两个有效性概念之上：Task Validity 与 Outcome Validity。前者回答任务是否真的测到了目标能力，后者回答评分是否真的反映了任务成功。二者是乘法关系：如果任务设计本身允许捷径，评分器再准确也只能准确地测到错误对象；如果任务设计合理但评分器没有被验证，最终报告同样无法支撑可信结论。因此，可靠评估的目标不是产生一个漂亮的成功率，而是建立一条可追溯、可复现、可红队、可回归的评估链路。

## 一、评估的核心问题不是完成任务，而是相信判分

在很多 Agent 项目中，评估最初会被简化为一个结果检查问题：文件是否生成，接口是否返回 `status=ok`，回答是否包含几个必要章节，或者模型是否自称已经完成任务。这种检查方式在简单自动化场景中或许够用，但一旦系统进入复杂任务，它就会迅速失效。一个 Agent 可能生成了格式完整的综述，却没有真实证据支撑；也可能调用了正确工具，却在关键步骤绕过了取证流程；还可能产出看似高质量的自然语言回答，但引用来自证据池之外，或者根本无法追溯来源。

因此，复杂 Agent 评估真正要解决的问题，不是“有没有产物”，而是“我们凭什么相信这个产物代表任务成功”。进一步说，也不是“评分器有没有给分”，而是“我们凭什么相信这个分数”。这就是 Outcome Validity 的问题：评估结论是否真实反映了被测系统的成功程度。

这个问题之所以重要，是因为 Agent 系统很容易产生“表面完成”。它们擅长生成流畅文本，擅长补齐结构，擅长在不完整证据下给出看似合理的结论。如果 evaluator 只观察最终文本，就很容易被这种表面完成欺骗。可信评估必须进入运行轨迹，检查系统是否真的按照预期流程取证、推理、恢复、引用和产出。

## 二、Task Validity 与 Outcome Validity 是评估的脊椎

一套评估框架首先要区分两个问题：任务是否设计正确，评分是否反映成功。前者是 **Task Validity**，后者是 **Outcome Validity**。

Task Validity 关注任务与能力之间的关系。一个任务如果声称评估“基于证据写综述”的能力，就不能允许模型直接编写一篇结构完整的文章而不引用指定证据。一个任务如果声称评估“工具使用与恢复能力”，就不能只检查最后文件是否存在，而应该要求系统经过指定流程、处理失败情况，并把中间证据留在可观察轨迹中。换句话说，Task Validity 问的是：完成这个任务，是否真的需要目标能力。

Outcome Validity 关注判分与成功之间的关系。即使任务本身设计合理，如果 evaluator 只是检查章节数量、字符串匹配或模型自述，它仍然可能把失败判成成功。Outcome Validity 问的是：我的打分是否真的反映任务成功，评分器是否会被漂亮文本、形式合规或局部完成欺骗。

这两个有效性不是加法关系，而是乘法关系。任务测错了，评分器再精确也没有意义；任务设计正确但评分器不可靠，最终结论同样不能成立。因此，一个严肃的评估体系必须同时回答两件事：任务是否迫使被测系统展示目标能力，评分器是否经过验证，能够识别真正成功与伪成功。

在实际建设中，很多系统缺失的是 Outcome Validity。大家往往愿意花大量时间构造任务和运行环境，却很少系统性地红队评分器。结果是评估报告给出了分数，却没有证明分数可信。本文的重点也正是在这一层：如何让 evaluator 自己被评估，如何让判分具有证据基础，如何让历史分数在评分器版本演化后仍然可比较。

## 三、Trace、Eval、Validation 必须分层

可信评估的第一条工程原则，是把事实记录、评价判断和评分器验证分开。它们对应 Trace、Eval 和 Validation 三层。

| 层级 | 职责 | 不能做什么 |
| --- | --- | --- |
| Trace | 记录发生了什么，包括调用、时延、输入输出、错误、路由和状态变化 | 不直接下“成功”或“质量高”的判断 |
| Eval | 基于 trace、artifact 和环境状态进行判分，并为每条判分挂证据 | 不影响被测系统行为，必须离线运行 |
| Validation | 验证 evaluator 本身是否可靠 | 不替代正式判分，而是评估判分器 |

这个分层非常关键。Trace 是事实层，它应该尽可能忠实地记录系统行为，但不应该在采集时混入评价标签。比如，trace 可以记录某个 tool call 返回了 HTTP 429，可以记录系统随后重试了两次，也可以记录最终切换了数据源；但 trace 不应该直接写“恢复成功”或“系统鲁棒性高”。这些判断应由 Eval 层在离线阶段根据证据和 rubric 生成。

Eval 层的职责是从事实中导出判断。它可以判断流程是否合规、证据是否来自指定范围、引用是否能追溯、失败后是否恢复、最终产物是否满足结构和内容要求。但每一条判断都应该带 evidence pointer、confidence 和 coverage。无证据的判分不应该进入正式报告。

Validation 层则是“考官被考”。它不评估被测 Agent，而是评估 evaluator。一个 evaluator 必须在已知真值的验证集上证明自己能让应该通过的样本通过，让应该拒绝的样本被拒绝。否则，它给被测系统打出的分数没有足够的 Outcome Validity。

## 四、Evidence-first：有证据，不等于证据支持结论

在复杂 Agent 评估中，evidence-first 是底线原则。每条判分都应该挂证据指针，说明它依据的是哪个 artifact、哪个 trace span、哪个状态记录、哪个 checker 输出，或者哪个缺失事件。判分还应该带 confidence 和 coverage，表示判断的可信程度和观察范围。

但是，“有证据”并不等于“证据支持结论”。一个引用可能存在，但来源不可靠；一个文档可能被检索到，但并不支持最终 claim；一个路径可能出现在日志里，但无法证明系统按正确流程执行。因此，证据本身需要有结构化状态，例如 `supportStatus` 和 `sourceQuality`。

`supportStatus` 用来标记证据与论断的关系，可以是 `supports`、`contradicts`、`partial` 或 `insufficient`。`sourceQuality` 用来标记来源质量，可以是 `primary`、`secondary` 或 `unknown`。这样做的意义在于避免把“引用了某个来源”误判为“来源支持了结论”。对于科研综述、代码审查、事实核查和合规任务来说，这个区别极其重要。

负证据也应该被追踪。很多判分来自“某件事没有发生”，例如没有调用指定 skill、没有使用本 scope 的证据、没有执行 fact-check、错误发生后没有 recovery。如果评估系统无法为“未发生”挂证据，很多关键失败就会变成不可判定。因此，evidence reference 应该支持 query 类型，例如 `count(skill.work)==0` 或 `no span matching factcheck.after_claim`，让缺失本身也成为可审计对象。

证据还应该采用两阶段机制。第一阶段是 candidate，即从 trace 或 artifact 中抽取出候选证据，但尚未证明可信。第二阶段是 verified，即经过 checker 或规则验证后，成为可用于正式判分的证据。如果后续发现证据错误，不应该覆盖原记录，而应该新增 revoked 记录，并用 `supersedes` 指向旧记录。这样既保持 append-only 的审计链，也允许系统纠错。

## 五、Evaluator 的四种类型与优先级

可信评估不应该默认使用 LLM-as-judge。相反，评估器应该按照可验证性优先的原则设计：能程序化判定的内容，尽量程序化判定；只有真正无法程序化的部分，才交给 LLM judge，并且要加严格纪律。

第一类 evaluator 是确定性 evaluator。它们基于事实层的真实字段进行判断，例如文件是否存在、路径是否正确、是否调用 forbidden tool、引用是否属于证据池、trace 是否存在异常中断、流程是否出现违规顺序。确定性 evaluator 的优点是可复现、可解释、抗文风干扰，因此应该优先使用。

第二类是状态 evaluator。它们检查数据库记录、种子是否入库、产物与会话是否绑定、run config 是否匹配、artifact 是否被 runtime state 正确登记。这类 evaluator 适合发现“系统表面完成但状态没有闭环”的问题。

第三类是轨迹 evaluator。它们判断系统是否按照合理轨迹完成任务，例如是否先取证再下结论，路由是否符合预期，错误后是否恢复，是否出现无意义循环，是否绕过指定流程。轨迹 evaluator 对 Agent 尤其重要，因为许多失败并不体现在最终产物，而体现在过程依赖关系断裂。

第四类才是 LLM judge。它适合判断真正难以程序化的内容，例如行文质量、论证清晰度、表达完整性和某些开放性综合判断。但 LLM judge 是评估系统中最大的负债，因为它可能被漂亮文风欺骗，也可能受 prompt、模型版本和随机性的影响。因此，它只能作为有限兜底，而不能成为默认裁判。

## 六、LLM-as-judge 的纪律

如果确实需要使用 LLM judge，就必须把它当成不稳定测量仪器，而不是绝对裁判。至少应该做到多次判分取稳定、多模型投票去偏、连续分而非单一 pass/fail、多 rubric 拆分、与人工小样本交叉验证、judge prompt 版本化固定，并记录 judge model、version、自洽性方差和 short rationale。

这里需要特别注意两点。第一，LLM judge 的 reasoning 不应成为证据本体。证据应该来自 artifact、trace span、checker 或状态记录，而不是来自裁判的内心推理。可以保存简短 rationale 解释分数，但不要把长 CoT 作为持久化证据。第二，当 LLM judge 与确定性 checker 冲突时，应默认以确定性 checker 为准，除非有明确机制证明 checker 的规则不适用。

从系统设计角度看，LLM judge 的位置应该是“不可验证部分的辅助评价”，而不是“所有质量的统一入口”。越是复杂的 Agent 任务，越应该把开放判断拆成可验证子问题，然后仅把剩余部分交给 LLM judge。

## 七、Validation Suite：让评分器自己被评估

Outcome Validity 的核心动作，是为每个 evaluator 建立 Validation Suite。这个验证集应该包含一组已知真值的 run、artifact、trace 和 state，并为每个 evaluator 标注 expected verdict。它既要包含应该通过的正样本，也要包含应该拒绝的负样本。

负样本尤其重要，因为真实系统的失败往往不是“什么都没做”，而是“用错误方式看起来成功”。因此，Validation Suite 应主动包含 reward hacking、绕过流程、列举蒙对、引用证据池外材料、编造来源、漂亮但无证据、生成文件但状态未登记、工具失败后无恢复等样本。只有 evaluator 能够拒绝这些样本，它的分数才有资格进入正式报告。

Validation Suite 的负样本应该直接来自任务声明的 `failureModes`。这形成一个闭环：任务设计阶段列出可能的捷径和失败模式，评分器验证阶段将这些 failure modes 变成负样本，最终报告阶段再展示 evaluator 对这些负样本的识别能力。这样，Task Validity 与 Outcome Validity 就不再是口号，而是通过同一套资产连接起来。

对于 evaluator 自身，也应该记录 precision 和 recall。Precision 关注被判通过的样本是否真的应该通过，recall 关注应该通过的样本是否被正确放行。对于拒绝能力，还可以单独记录 negative recall，即应拒样本是否被成功拒绝。没有这些指标的 evaluator，本质上没有被评估过。

评分器还必须版本化，并进入 CI 门禁。每次 evaluator 规则、prompt、模型或阈值发生变化，都应该先通过 Validation Suite 才能上线。正式 scorecard 必须记录 evaluatorVersion，改版只新增 revision，不覆盖旧分。对于历史 run，可以通过离线 replay 进行重判，比较评分器自身是否发生漂移。

## 八、离线 replay 是可信评估的工程地基

可靠评估应该尽量离线运行。Trace 和 artifact 先落盘，Eval 后读取这些已存在事实进行判分。这样做有几个关键好处。

首先，离线 replay 使评估可重复。相同的 trace、artifact 和 evaluator version 应该得到相同结果，这使分数具备可审计性。其次，它允许历史 run 被重新判分。当 evaluator 升级后，我们可以用新版本对旧 run 进行回归测试，而不是只能从某个时间点重新跑系统。第三，它降低了被测系统对评分器的感知。被测 Agent 在运行时不需要知道哪些字段会被评分，从而减少 evaluation awareness。

更重要的是，离线 replay 让评估系统不改变被测系统行为。对于 Agent 或复杂异步系统，这一点非常关键。如果 evaluator 在运行时干预系统、改变 prompt、插入额外工具或影响调度，那么它测到的就不再是原始系统行为，而是评估环境下的系统行为。可信评估必须尽量做到 observation without intervention。

## 九、不要只看二值成功，要看细粒度轨迹

复杂任务不适合只用 pass/fail。二值指标会把“差一点完成”和“完全错误”压成同一个分数，也会把“过程正确但最后小错误”和“过程错误但结果蒙对”混为一谈。对于 Agent 系统，评估应该同时观察最终结果和中间过程。

一个更合理的报告应该包含多个维度，例如 TaskSuccess、ProgressScore、EvidenceGrounding、RouteCompliance、ToolRobustness、Cost/Latency、Safety/Privacy、EvaluatorConfidence 和 TraceHealth。每个维度都应该标明 method、confidence、coverage、supporting evidence 和 failure examples。这样，读者不仅能看到总分，还能知道分数是如何产生的、哪些部分由确定性 checker 支持、哪些部分由 LLM judge 给出、哪些部分覆盖不足。

轨迹评估尤其适合给 partial credit。一个系统可能没有完成最终任务，但已经正确完成了检索、去重和证据登记；另一个系统可能产出了漂亮报告，但没有按流程取证。二者如果只看最终 pass/fail，可能完全无法区分；如果看轨迹，就能清楚看到能力结构的差异。

## 十、可靠性应该看 pass^k，而不只是 pass@k

在评估模型能力时，很多人习惯看 pass@k，即 k 次尝试中至少一次成功。这是一个有用指标，因为它衡量系统的能力上限：如果给足尝试次数，它是否有可能做到。

但生产系统更关心的是稳定性。用户并不只想知道系统偶尔能成功，而是想知道它是否每次都能可靠完成任务。因此，复杂 Agent 的关键指标应该包括 pass^k，即 k 次尝试全部成功。pass@k 衡量“能不能做到”，pass^k 衡量“稳不稳”。

两类指标的使用场景不同。对于召回、探索、解题这类能力上限问题，pass@k 很有价值；对于流程合规、证据 grounding、安全约束、错误恢复和隐私边界这类硬保证问题，应该优先看 pass^k。生产系统默认应该更重视 pass^k，因为一次失败就可能造成严重后果。

## 十一、解耦模型能力与 Harness 能力

当评估分数提升时，必须追问涨分来自哪里。是模型能力提升，还是 prompt 改了？是检索工具变好，还是路由策略变了？是 harness 提供了更多上下文，还是 evaluator 变松了？如果不做解耦，系统很容易把 harness improvement 误归因给 model improvement。

最直接的方法是固定一边、变化一边做 A/B。固定模型，比较不同 harness；固定 harness，比较不同模型；固定工具和 prompt，观察调度策略变化；固定 evaluator version，比较不同运行配置。每个 run 都应该记录 configFingerprint，至少包括 model、prompt version、harness version、tool version、evaluator version 和关键 runtime config。拿不到的维度可以标记 coverage 缺失，但不能假装已经控制变量。

这种解耦不仅是为了科学归因，也是为了工程决策。如果分数提升来自工具层，继续换模型可能不是最优投资；如果失败来自 evaluator 漏判，继续优化 Agent 也无法解决评估可信度问题。

## 十二、防污染与评估意识

Benchmark 不是永恒有效的。固定静态集会被记住、被优化、被泄漏，也会因为模型能力提升而逐渐饱和。因此，可靠评估需要动态或 live 种子，需要污染分析，也需要定期更新任务分布。

更隐蔽的问题是 evaluation awareness。强模型可能识别出“我正在被评估”，从而表现得比真实场景更谨慎、更合规、更迎合评分标准。这会系统性高估真实表现。缓解方式包括使用自然任务语气，避免在 prompt 中显式声明“请接受评估”；隐藏部分评分标准；采用动态种子；通过离线 trace replay 减少被测方对评分器的感知。

可以额外增加一个轻量观测项：输出是否提及“测试”“评估”“benchmark”“评分”等词。但这个信号只能作为 low-confidence guardrail，不能过度依赖。真正的杠杆仍然是自然任务、隐藏标准、动态种子和离线 replay。

## 十三、好 Benchmark 的四个原则

一个好的 benchmark 至少应该满足四个原则：真实、分难度、防饱和、防污染。真实意味着任务接近系统实际使用场景，而不是只服务于跑分；分难度意味着任务集能够区分不同能力阶段，而不是全都过于简单或过于困难；防饱和意味着 benchmark 能够随能力提升继续提供区分度；防污染意味着任务不容易被训练数据、公开答案或固定模式泄漏。

同时需要警惕一个常见误解：基础设施重不等于评估好。一个复杂环境、漂亮 dashboard、庞大任务集，如果没有可靠 scoring、没有 evaluator validation、没有红队样本，仍然可能只是一个看起来很工程化的弱评测。相反，一个小而干净、被认真红队过、能证明 Outcome Validity 的评测，往往比勉强跑通的大系统更有价值。

## 十四、设计可信评估的操作清单

设计任务时，首先要问它是否真的需要目标能力，是否存在捷径可以假装成功，是否要求基于指定证据、经过指定流程、可追溯引用并产出结构化结果。任务应该显式声明 `successCriteria` 与 `failureModes`，并把 failure modes 直接转化为 Validation Suite 的负样本。

设计 evaluator 时，首先要问能否程序化判定。如果能，就不要使用 LLM judge。每条判分都应该挂 evidence pointer，并记录 confidence 和 coverage。每个 evaluator 都应该有验证集，能报告自身 precision 和 recall，并在上线前通过 CI 门禁。正式报告中必须记录 evaluatorVersion，支持对历史 run 离线重判。

选择判分方法时，可以遵循一个简单决策树：如果存在 oracle 或明确标准，就写 checker；如果没有客观 ground truth，先尝试把任务拆成可验证子问题；如果仍然无法程序化判断，再使用 LLM judge，并配套多次判分、多模型投票、人工小样本交叉、prompt 版本化和自洽性度量。

选择可靠性指标时，也要区分 pass@k 与 pass^k。能力上限类任务可以看 pass@k，硬保证类任务必须看 pass^k。生产默认应该更关注 pass^k，因为稳定性比偶尔成功更重要。

## 十五、评估系统中的常见误区

最常见的误区，是只检查文件存在、章节数量或 `status=ok`，就把任务判为成功。这些信号只能证明某些表面产物存在，不能证明产物合格，也不能证明证据链闭环。

第二个误区，是把 LLM judge 当默认裁判。LLM judge 很容易被漂亮文风和完整结构欺骗，也可能在不同模型、不同 prompt 或不同采样下产生不稳定结果。能程序化验证的内容，不应该交给它。

第三个误区，是只使用二值成败。二值指标看不到中间进展，也无法区分流程正确但最终小错、流程错误但结果蒙对、完全失败这几类情况。

第四个误区，是任务本身可被捷径完成。比如要求“写一篇综述”，但没有约束指定证据、流程、引用和结构化产物，那么测到的很可能只是生成能力，而不是研究能力或证据使用能力。

第五个误区，是评分器从不被红队。没有 Validation Suite 的 evaluator，本质上没有被验证；用没被验证的评分器给被测系统下结论，是一种循环论证。

第六个误区，是把单次成功当可靠。没有 pass^k，就无法判断系统在重复运行中的稳定性。对于生产系统，这种遗漏会直接转化为线上风险。

第七个误区，是涨分误归因。没有解耦模型、prompt、harness、tool 和 evaluator，就无法知道提升来自哪里。最后一个重要反模式，是固定 benchmark 被记住或被识破。污染和评估意识都会系统性高估模型表现，因此必须通过动态种子、隐藏标准和离线 replay 缓解。

## 结语：可信评估本身也是一个系统

Agent 评估不是给系统跑一个任务、拿一个分数这么简单。对于复杂异步系统，评估本身就是一个由 Trace、Eval 和 Validation 组成的系统。Trace 负责让我们相信事实记录是真的，Eval 负责让我们相信判分与证据相连，Validation 负责让我们相信评分器本身没有被伪成功欺骗。

因此，可信评估的核心不是追求一个更复杂的 benchmark，而是建立一条更可信的评估链路：任务设计要有 Task Validity，判分过程要有 Outcome Validity，证据要可追溯，评分器要被红队，历史 run 要能离线 replay，指标要区分能力上限与生产可靠性，报告要展示 evaluator version、confidence、coverage 和 failure examples。

最终，一个可靠的 Agent 评估系统应该回答的不只是“Agent 成功了吗”，而是“我们为什么相信它成功了”。这也是复杂 Agent 从 demo 走向真实应用时，评估系统必须承担的责任。
