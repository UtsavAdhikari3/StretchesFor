import type { Answer, FlowResult, PainPattern } from '../data/types';

export type AnswerMap = Partial<Record<'emergency' | 'trauma' | 'systemic' | 'function' | 'match', Answer>>;

export function evaluateAnswers(pattern: PainPattern, answers: AnswerMap): FlowResult {
  if (pattern.action === 'urgent-care') {
    return {
      kind: 'urgent',
      title: 'Urgent medical care recommended',
      description: 'This symptom pattern should not be assessed or treated with an online movement routine.',
      nextStep: 'Stop here and seek urgent medical care now. If symptoms are severe or rapidly worsening, contact your local emergency service.',
    };
  }
  if (answers.emergency === 'yes') {
    return {
      kind: 'urgent',
      title: 'Possible urgent warning sign',
      description: 'Your answer includes a warning sign that should not be assessed with an online movement tool.',
      nextStep: 'Stop the exercise flow and seek urgent medical care now. If symptoms are severe or rapidly worsening, contact your local emergency service.',
    };
  }

  const safetyAnswers = [answers.emergency, answers.trauma, answers.systemic, answers.function];
  if (safetyAnswers.some((answer) => answer === 'unsure') || answers.trauma === 'yes' || answers.systemic === 'yes' || answers.function === 'yes') {
    return {
      kind: 'professional',
      title: 'Professional evaluation recommended',
      description: 'One or more answers make a self-guided stretching routine inappropriate right now.',
      nextStep: 'Arrange an assessment with a qualified healthcare professional. Avoid movements that aggravate the area until you have individual guidance.',
    };
  }

  if (pattern.action === 'professional-evaluation' || answers.match !== 'yes') {
    return {
      kind: 'professional',
      title: 'Professional evaluation recommended',
      description: pattern.action === 'professional-evaluation'
        ? 'This pattern is better assessed in person because an online questionnaire cannot examine strength, sensation, swelling, or the affected tissues.'
        : 'Your answers do not clearly match the low-risk movement pathway for this pattern.',
      nextStep: 'Consider a clinician or physiotherapist assessment, especially if symptoms persist, recur, or limit normal activity.',
    };
  }

  return {
    kind: 'movement',
    title: 'Gentle movement may be appropriate',
    description: 'Your answers are consistent with this symptom pattern, and did not identify the warning signs screened here.',
    nextStep: 'Keep every movement comfortable. Stop immediately if pain spreads, sharpens, causes numbness or weakness, or is worse afterward.',
  };
}
