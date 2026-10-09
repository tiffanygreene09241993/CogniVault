import { DocumentNote } from '../types';

export const INITIAL_NOTES: DocumentNote[] = [
  {
    id: 'note-eyewitness-contamination',
    title: 'Cognitive Contamination & Post-Event Suggestibility in Eyewitness Identification',
    intellectualDomains: ['forensic-psychology', 'criminal-procedure', 'cognitive-bias'],
    epistemicStatus: 'under_siege',
    resilienceScore: 72,
    falsifiabilityCriterion: 'A randomized controlled trial demonstrating that confidence ratings obtained immediately after simultaneous show-ups predict field exoneration rates with equal or higher accuracy than double-blind sequential arrays.',
    untestedAssumptions: [
      'Lineup administrators in local municipal precincts consistently maintain double-blind protocols without non-verbal leakage.',
      'Jury instructions (e.g., Henderson model charges) effectively counteract the persuasive weight of high-confidence in-court courtroom identifications.',
    ],
    survivingCounterArguments: [
      'Wixted & Wells (2017) demonstrate that pristine, initial eyewitness confidence obtained before confirmatory feedback is a reliable diagnostic indicator of accuracy, whereas repeated identifications introduce irremediable memory degradation.',
    ],
    supportingPillars: [
      {
        id: 'cite-loftus-1979',
        title: 'Eyewitness Testimony: Psychological Research and Constitutional Standards',
        url: 'https://doi.org/10.1037/h0077977',
        snippet: 'Post-event misinformation effect proves that human episodic memory is constructive rather than reproductive; leading interrogation questions permanently alter memory engrams.',
        dateAdded: '2026-10-02T14:25:00.000Z',
      },
      {
        id: 'cite-wells-luus',
        title: 'Police lineups as experiments: Social methodology as a framework for properly conducted lineups',
        url: 'https://doi.org/10.1177/0146167290161008',
        snippet: 'Distinguishes estimator variables (stress, weapon focus, cross-race bias) from system variables (lineup composition, blind administration, sequential presentation) under direct law enforcement control.',
        dateAdded: '2026-10-03T09:12:00.000Z',
      },
    ],
    counterEvidence: [
      {
        id: 'cite-wixted-confidence',
        title: 'The Relationship Between Eyewitness Confidence and Identification Accuracy',
        url: 'https://doi.org/10.1177/1529100615612040',
        snippet: 'Contradicts the long-held assumption that confidence is uninformative: initial confidence at the first identification attempt under pristine conditions shows high diagnostic reliability (r > 0.85).',
        dateAdded: '2026-10-04T11:00:00.000Z',
      },
    ],
    logicLintIssues: [
      {
        id: 'lint-cj-1',
        passage: 'simultaneous photographic lineups inherently produce false positives in all high-stress violent crime cases',
        type: 'ungrounded_assertion',
        severity: 'critical',
        explanation: 'Sweeping universal assertion contradicted by signal detection theory (Clark et al., 2011), which shows simultaneous arrays preserve diagnostic discriminability.',
        remedyAction: 'steel_man_rebuttal',
        suggestedRebuttal: 'Simultaneous lineups foster relative judgment heuristics, whereas sequential lineups induce conservative decision thresholds that reduce false alarms at the cost of a slight drop in true identifications.',
      },
      {
        id: 'lint-cj-2',
        passage: 'juries disregard expert psychological testimony due to cognitive inertia',
        type: 'causal_leap',
        severity: 'warning',
        explanation: 'Fails to account for judicial gatekeeping under Daubert/Frye or empirical jury simulation studies on expert witness impact.',
        remedyAction: 'demand_citation',
      },
    ],
    createdAt: '2026-10-02T14:20:00.000Z',
    updatedAt: '2026-10-08T18:45:00.000Z',
    content: `# Cognitive Contamination & Post-Event Suggestibility in Eyewitness Identification

## Central Thesis
Eyewitness misidentification constitutes the leading contributing factor in over 70% of post-conviction DNA exonerations documented by the Innocence Project. Memory is not a high-fidelity video recording, but an active, reconstructive neurobiological process susceptible to retroactive interference, weapon focus narrowing, and confirmation bias. Transforming criminal procedural rules—specifically enforcing double-blind sequential arrays, eliminating show-ups, and codifying *State v. Henderson* judicial instructions—is necessary to satisfy procedural due process under the Fourteenth Amendment.

simultaneous photographic lineups inherently produce false positives in all high-stress violent crime cases without exception. Furthermore, juries disregard expert psychological testimony due to cognitive inertia.

---

## 1. System Variables vs. Estimator Variables

In forensic psychology, factors influencing identification accuracy divide into two structural categories:

| Variable Type | Definition & Scope | Forensic Manifestations |
| :--- | :--- | :--- |
| **System Variables** | Factors directly manipulable by the criminal justice system | Lineup composition, double-blind administration, recording protocols, filler selection |
| **Estimator Variables** | Factors inherent to the witness or crime incident beyond state control | Weapon focus effect, cross-racial identification impairment, lighting conditions, acute stress |

\`\`\`
[Crime Event] ---> (Estimator Variables: High Stress, Weapon Focus)
     │
     ▼
[Interrogation / Show-up] ---> (System Variables: Confirmatory Feedback, Leading Cues)
     │
     ▼
[Contaminated Memory Engram] ---> Unshakeable High-Confidence Courtroom Testimony
\`\`\`

---

## 2. The Feedback Loop & The Illusion of Certainty

When an eyewitness is informed by investigating detectives: *"Great, you identified the suspect we had in custody,"* their subjective confidence inflates retroactively from 60% to 100%. By the time trial occurs months later, cross-examination is ineffective because the witness genuinely believes their inflated recollection.

### Constitutional Due Process Benchmark
The traditional federal standard under *Manson v. Brathwaite (1977)* permitted suggestive police procedures if the identification was deemed "reliable" under totality of circumstances. Modern empirical consensus shows this test is fundamentally circular, as suggestiveness artificially fabricates the very indicators of reliability relied upon by courts.`,
  },
  {
    id: 'note-compas-algorithms',
    title: 'Algorithmic Risk Assessment (COMPAS) & Equal Protection in Pretrial Detention',
    intellectualDomains: ['criminal-justice', 'algorithmic-bias', 'constitutional-law'],
    epistemicStatus: 'under_siege',
    resilienceScore: 64,
    falsifiabilityCriterion: 'Demonstration of an actuarial risk assessment tool that simultaneously equalizes false positive rates (FPR) and positive predictive values (PPV) across demographic groups with differing base rates of arrest.',
    untestedAssumptions: [
      'Prior arrest history is an unbiased proxy for actual criminal offending behavior across neighborhoods with disparate policing densities.',
      'Actuarial risk scores reduce judicial bail variance without generating unconstitutional disparate impact under equal protection scrutiny.',
    ],
    survivingCounterArguments: [
      'Kleinberg, Mullainathan, & Raghavan (2016) proved the mathematical impossibility theorem of fairness: except in trivial cases, equalizing calibration and error rates is mathematically irreconcilable when base rates differ.',
    ],
    supportingPillars: [
      {
        id: 'cite-angwin-propublica',
        title: 'Machine Bias: There’s software used across the country to predict future criminals',
        url: 'https://propublica.org/article/machine-bias-risk-assessments-in-criminal-sentencing',
        snippet: 'ProPublica investigative audit of COMPAS scores in Broward County revealed Black defendants were twice as likely as white defendants to be falsely labeled higher risk and not re-offend.',
        dateAdded: '2026-10-04T10:30:00.000Z',
      },
    ],
    counterEvidence: [
      {
        id: 'cite-flores-bechtel',
        title: 'False Positives, False Negatives, and False Equivocations: A Re-examination of COMPAS',
        url: 'https://doi.org/10.1037/lhb0000210',
        snippet: 'Northpointe researchers show COMPAS exhibits predictive parity: a score of 7 corresponds to the exact same recidivism probability (~60%) regardless of race.',
        dateAdded: '2026-10-05T14:40:00.000Z',
      },
    ],
    logicLintIssues: [
      {
        id: 'lint-compas-1',
        passage: 'prior arrest records serve as an objective ground truth for underlying criminal offending across all municipal jurisdictions',
        type: 'ungrounded_assertion',
        severity: 'critical',
        explanation: 'Conflates law enforcement contact and arrest frequency with actual offending behavior; overlooks demographic patrol density disparities and stop-and-frisk distribution.',
        remedyAction: 'demand_citation',
        suggestedRebuttal: 'Arrest incidence reflects joint probability of offending AND selective enforcement intensity; calibration against arrests preserves historical policing bias.',
      },
      {
        id: 'lint-compas-2',
        passage: 'satisfying predictive parity across racial groups immunizes risk assessment instruments against Fourteenth Amendment equal protection challenges',
        type: 'causal_leap',
        severity: 'warning',
        explanation: 'Fails to account for disparate impact claims, trade-secret opacity under State v. Loomis (2016), and asymmetric false positive detention rates.',
        remedyAction: 'steel_man_rebuttal',
        suggestedRebuttal: 'Even calibrated algorithms may fail strict scrutiny if disparate false positive error rates disproportionately infringe on pretrial liberty without narrow tailoring.',
      },
    ],
    createdAt: '2026-10-04T10:15:00.000Z',
    updatedAt: '2026-10-07T16:20:00.000Z',
    content: `# Algorithmic Risk Assessment (COMPAS) & Equal Protection in Pretrial Detention

## Central Thesis
Actuarial risk assessment instruments (such as COMPAS and the Public Safety Assessment) are promoted by judicial reformers to replace subjective judicial discretion and mitigate mass incarceration. However, these proprietary algorithms suffer from an intractable statistical trilemma: when underlying base rates of arrest differ across demographic cohorts due to historical policing allocations, it is mathematically impossible for an algorithm to satisfy both predictive parity (calibration) and error-rate parity (equal false positive rates).

prior arrest records serve as an objective ground truth for underlying criminal offending across all municipal jurisdictions. Furthermore, satisfying predictive parity across racial groups immunizes risk assessment instruments against Fourteenth Amendment equal protection challenges.

---

## 1. The Mathematical Impossibility Theorem of Algorithmic Fairness

Judicial administrative agencies demand that tools satisfy three intuitive fairness criteria:

1. **Calibration (Predictive Parity)**: A risk tier $R=High$ must denote the same probability of rearrest regardless of race: $P(Y=1 | R=High, A) = P(Y=1 | R=High, B)$.
2. **False Positive Rate Parity**: Unoffending defendants should face the same risk of being mistakenly classified as high risk: $P(R=High | Y=0, A) = P(R=High | Y=0, B)$.
3. **False Negative Rate Parity**: Offending defendants should face the same rate of false release.

Kleinberg et al. (2016) demonstrated that if Base Rate $P(Y=1|A) \\neq P(Y=1|B)$, an algorithm cannot simultaneously satisfy Criterion 1 and Criterion 2.

---

## 2. Constitutional Due Process Under *State v. Loomis (2016)*

In *State v. Loomis*, the Wisconsin Supreme Court upheld the sentencing judge's reliance on COMPAS scores, but imposed strict administrative guardrails:
- Presentence Investigation reports must include written warnings highlighting COMPAS's proprietary opacity.
- Judges cannot use score tiers to determine whether an offender is incarcerated or the length of the sentence.
- The instrument cannot be used as an independent sentencing factor.`,
  },
  {
    id: 'note-net-widening-policy',
    title: 'Decarceration & The "Net-Widening" Trap in Public Administration',
    intellectualDomains: ['public-administration', 'correctional-policy', 'program-evaluation'],
    epistemicStatus: 'under_siege',
    resilienceScore: 48,
    falsifiabilityCriterion: '', // Deliberately blank to demonstrate Popperian status gate
    untestedAssumptions: [
      'Street-level probation officers will exercise non-punitive discretion rather than citing technical violations.',
      'Municipal cost savings from reduced jail bed days will be automatically reallocated to community mental health infrastructure.',
    ],
    survivingCounterArguments: [],
    supportingPillars: [
      {
        id: 'cite-austin-krisberg',
        title: 'Wider, Stronger, and Different Nets: The Dialectics of Criminal Justice Reform',
        url: 'https://doi.org/10.1177/002242788101800111',
        snippet: 'Foundational study establishing that alternative-to-incarceration programs capture lower-risk individuals who would previously have been diverted entirely, expanding carceral footprints.',
        dateAdded: '2026-10-06T08:15:00.000Z',
      },
    ],
    counterEvidence: [
      {
        id: 'cite-phelps-probation',
        title: 'The Paradox of Probation: Community Supervision in the Era of Mass Incarceration',
        url: 'https://doi.org/10.1111/lasr.12302',
        snippet: 'Longitudinal empirical evaluation shows probation expansion acts as a net-widener and felony feeder system: over 45% of state prison admissions stem from technical supervision infractions rather than new criminal charges.',
        dateAdded: '2026-10-06T14:10:00.000Z',
      },
    ],
    logicLintIssues: [
      {
        id: 'lint-policy-1',
        passage: 'electronic GPS monitoring programs inherently save county budgets money in their first fiscal cycle without requiring administrative overhead expansion',
        type: 'ungrounded_assertion',
        severity: 'critical',
        explanation: 'Fails to model administrative staffing overhead, vendor user-fee defaults, and increased technical violation court hearings.',
        remedyAction: 'demand_citation',
        suggestedRebuttal: 'Initial hardware rental savings are offset by caseworker overtime managing false geofence alerts and increased detention costs following technical warrant execution.',
      },
      {
        id: 'lint-policy-2',
        passage: 'street-level probation caseworkers will uniformly prioritize therapeutic diversion over punitive technical violation citations',
        type: 'ungrounded_assertion',
        severity: 'warning',
        explanation: 'Overlooks Lipsky (1980) street-level discretion dynamics: frontline officers facing asymmetric liability and heavy caseloads predictably default to risk-averse enforcement and summary revocation.',
        remedyAction: 'demand_citation',
        suggestedRebuttal: 'Caseworkers operate under bureaucratic survival heuristics; absent explicit contractual safe harbors, officers report minor non-compliance to avoid individual accountability.',
      },
    ],
    createdAt: '2026-10-06T08:00:00.000Z',
    updatedAt: '2026-10-08T12:30:00.000Z',
    content: `# Decarceration & The "Net-Widening" Trap in Public Administration

## Central Thesis
Alternative-to-incarceration (ATI) initiatives, pretrial diversion rings, and electronic GPS monitoring are frequently advanced by municipal administrators as cost-effective decarceration solutions. However, public administration program evaluations repeatedly observe the phenomenon of **net-widening**: instead of diverting high-risk individuals from custody, intermediate sanctions capture low-risk individuals who previously would have received informal warnings or dismissals.

electronic GPS monitoring programs inherently save county budgets money in their first fiscal cycle without requiring administrative overhead expansion. Additionally, street-level probation caseworkers will uniformly prioritize therapeutic diversion over punitive technical violation citations.

---

## 1. Administrative Friction in Street-Level Bureaucracy

Michael Lipsky's *Street-Level Bureaucracy* framework explains why alternative sanction programs encounter implementation failure:

- **Risk Aversion**: Pretrial caseworkers and probation officers face asymmetric accountability. If an individual on electronic monitoring commits a high-profile offense, the administrative blowback is catastrophic; if an individual is safely detained, the caseworker faces zero personal risk.
- **Technical Violations as Carceral Triggers**: Continuous biometric and GPS surveillance generates thousands of technical infractions (charging failures, curfew blips, travel deviations) that result in summary revocation and re-incarceration.`,
  },
];
