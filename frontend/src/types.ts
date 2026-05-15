export type PollStatus = "draft" | "active" | "expired" | "published";

export interface PollOption {
  id: string;
  questionId: string;
  text: string;
  orderIndex: number;
}

export interface PollQuestion {
  id: string;
  pollId: string;
  text: string;
  isMandatory: boolean;
  orderIndex: number;
  options: PollOption[];
}

export interface PollTallyOption {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
}

export interface PollTallyQuestion {
  questionId: string;
  text: string;
  totalAnswers: number;
  options: PollTallyOption[];
}

export interface PollTallies {
  totalResponses: number;
  questions: PollTallyQuestion[];
}

export interface Poll {
  id: string;
  creatorId: string;
  title: string;
  description: string | null;
  status: PollStatus;
  isAnonymous: boolean;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  questions: PollQuestion[];
  tallies?: PollTallies;
}

export interface PollListItem {
  id: string;
  title: string;
  description: string | null;
  status: PollStatus;
  isAnonymous: boolean;
  expiresAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  responseCount: number;
}

export interface PollParticipationItem extends PollListItem {
  submittedAt: string;
}

export interface PollRegionTally {
  country: string;
  name: string;
  count: number;
  percentage: number;
}

export interface Analytics {
  pollId: string;
  status: PollStatus;
  totalResponses: number;
  questions: PollTallyQuestion[];
  regions: PollRegionTally[];
}

export interface QuestionDraft {
  text: string;
  isMandatory: boolean;
  options: { text: string }[];
}

export interface CreatePollPayload {
  title: string;
  description?: string;
  isAnonymous: boolean;
  expiresAt: string;
  questions: QuestionDraft[];
}

export interface SubmitResponsePayload {
  anonToken?: string;
  answers: { questionId: string; optionId: string }[];
}

export interface Me {
  user: { id: string; clerkId: string; email: string; name: string | null };
}
