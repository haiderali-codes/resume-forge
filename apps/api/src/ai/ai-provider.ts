export const AI_PROVIDER = Symbol('AI_PROVIDER');

export type TailoredResumeRequest = {
  resumeText: string;
  jobDescription: string;
};

export type TailoredResumeResponse = {
  outputText: string;
  provider: string;
  model: string;
};

export interface AiProvider {
  generateTailoredResume(
    request: TailoredResumeRequest,
  ): Promise<TailoredResumeResponse>;
}