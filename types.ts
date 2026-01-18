
export interface TaskStep {
  id: string;
  text: string;
  completed: boolean;
}

export interface Mission {
  id: string;
  name: string;
  steps: TaskStep[];
  focusTimeMinutes: number;
  xpReward: number;
  encouragement: string;
  createdAt: number;
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActive: string | null;
  completedLessonIds: string[];
}

export interface Activity {
  id: string;
  type: 'mission' | 'quiz' | 'auth' | 'system';
  message: string;
  timestamp: number;
  status: 'success' | 'info' | 'warning';
}

export interface UserProfile {
  name: string;
  avatar: string; // Seed for DiceBear or Base64
  is_custom_avatar?: boolean;
  cover_avatar: string; // URL or Base64
  is_custom_cover?: boolean;
  bio: string;
  location?: string;
  joined_date: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  type: 'lesson' | 'mission' | 'thought';
  likes: number;
  dislikes: number;
  comments_count: number;
  created_at: string;
  image_url?: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_name: string;
  user_avatar: string;
  content: string;
  created_at: string;
}

export interface Story {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string;
  image_url: string;
  media_type?: 'image' | 'video';
  // Added created_at property to fix type error in Community.tsx
  created_at: string;
}

export interface DirectMessage {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
}

export interface Contact {
  id: string;
  name: string;
  avatar: string;
  is_online: boolean;
  last_message?: string;
}

export interface LessonTopic {
  id: string;
  title: string;
  category: string;
  icon: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface QuizResult {
  score: number;
  total: number;
  feedback: string;
  corrections: { question: string; userAnswer: string; correctAnswer: string; isCorrect: boolean; explanation: string }[];
}

export interface StudyGuide {
  title: string;
  summary: string;
  sections: { heading: string; content: string }[];
  keyTakeaways: string[];
}

export interface AIResponse {
  missionName: string;
  steps: string[];
  focusTimeMinutes: number;
  xpReward: number;
  encouragement: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: { title: string; uri: string }[];
  audioData?: Uint8Array;
}
