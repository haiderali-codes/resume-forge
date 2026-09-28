import type {
  AiProvider,
  TailoredResumeRequest,
  TailoredResumeResponse,
} from './ai-provider.js';

export class MockAiProvider implements AiProvider {
  async generateTailoredResume(
    request: TailoredResumeRequest,
  ): Promise<TailoredResumeResponse> {
    const outputText = [
      'TAILORED RESUME DRAFT',
      '',
      'Professional Summary',
      'Experienced software engineer with a strong background aligned to the target role.',
      '',
      'Target Job Description',
      request.jobDescription,
      '',
      'Resume Content',
      request.resumeText,
      '',
      'Tailoring Notes',
      '- Emphasize experience relevant to the target job.',
      '- Highlight measurable achievements.',
      '- Prioritize skills mentioned in the job description.',
    ].join('\n');

    return {
      outputText,
      provider: 'mock',
      model: 'mock-v1',
    };
  }
}