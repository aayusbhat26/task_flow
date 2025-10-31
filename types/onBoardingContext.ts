// Custom UseCase type - only STUDY is supported in onboarding
export type UseCase = "STUDY";

export enum ActionType {
  CHANGE_SITE = "CHANGE_SITE",
  NAME = "NAME",
  SURNAME = "SURNAME",
  PROFILEIMAGE = "PROFILEIMAGE",
  USECASE = "USECASE",
  WORKSPACE_NAME = "WORKSPACE_NAME",
  WORKSPACE_IMAGE = "WORKSPACE_IMAGE",
  LEETCODE_USERNAME = "LEETCODE_USERNAME",
  CODEFORCES_USERNAME = "CODEFORCES_USERNAME",
  CODECHEF_USERNAME = "CODECHEF_USERNAME",
  GITHUB_USERNAME = "GITHUB_USERNAME",
  REDDIT_USERNAME = "REDDIT_USERNAME",
}

export interface Action {
  type: ActionType;
  payload: string | number | UseCase | undefined | null | string[];
}

export interface OnboardingFormReducer {
  currentStep: 1 | 2 | 3 | 4;
  name?: string | null;
  surname?: string | null;
  profileImage?: string | null;
  useCase: UseCase | null;
  workspaceName: string | null;
  workspaceImage?: string | null;
  leetcodeUsername?: string | null;
  codeforcesUsername?: string | null;
  codechefUsername?: string | null;
  githubUsername?: string | null;
  redditUsername?: string | null;
}

export interface OnboardingFormContext extends OnboardingFormReducer {
  dispatch: React.Dispatch<Action>;
}
