export type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      generation_requests: {
        Row: {
          id: string;
          user_id: string | null;
          case_id: string | null;
          chain_id: string | null;
          model_key: string;
          theme: string;
          user_context: string;
          source: string;
          status: string;
          error_message: string | null;
          duration_ms: number | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          case_id?: string | null;
          chain_id?: string | null;
          model_key: string;
          theme: string;
          user_context: string;
          source: string;
          status?: string;
        };
        Update: {
          status?: string;
          case_id?: string | null;
          error_message?: string | null;
          duration_ms?: number;
        };
        Relationships: [];
      };
      llm_responses: {
        Row: {
          id: string;
          request_id: string;
          step_id: string | null;
          step_name: string;
          model_key: string;
          prompt: string;
          response_text: string | null;
          status: string;
          duration_ms: number | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          request_id: string;
          step_id?: string | null;
          step_name: string;
          model_key: string;
          prompt: string;
          response_text: string | null;
          status: string;
          duration_ms: number;
          error_message?: string | null;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      daily_court_sessions: {
        Row: {
          session_date: string;
          case_id: string;
          opens_at: string;
          closes_at: string;
        };
        Insert: {
          session_date: string;
          case_id: string;
          opens_at: string;
          closes_at: string;
        };
        Update: Record<string, never>;
        Relationships: [];
      };
      court_cases: {
        Row: CourtCase;
        Insert: Partial<CourtCase> &
          Pick<
            CourtCase,
            "user_id" | "image_path" | "theme" | "vision_prompt" | "model"
          >;
        Update: Partial<CourtCase>;
        Relationships: [];
      };
      captions: {
        Row: Caption;
        Insert: { id?: string; case_id: string; content: string };
        Update: { content?: string };
        Relationships: [];
      };
      caption_votes: {
        Row: {
          id: string;
          user_id: string;
          caption_id: string;
          value: number;
          created_at: string;
        };
        Insert: { user_id: string; caption_id: string; value: number };
        Update: { value?: number };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      generation_configuration: {
        Args: Record<string, never>;
        Returns: import("@/lib/generation").GenerationConfig;
      };
      ensure_daily_court: {
        Args: Record<string, never>;
        Returns: {
          session_date: string;
          case_id: string;
          opens_at: string;
          closes_at: string;
        }[];
      };
      court_scores: {
        Args: Record<string, never>;
        Returns: { caption_id: string; score: number; votes: number }[];
      };
      publish_court_case: {
        Args: {
          p_case: string;
          p_description: string;
          p_prompt: string;
          p_captions: string[];
        };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type CourtCase = {
  id: string;
  user_id: string;
  image_path: string;
  theme: string;
  description: string | null;
  vision_prompt: string;
  caption_prompt: string | null;
  model: string;
  status: string;
  created_at: string;
};
export type Caption = { id: string; case_id: string; content: string };
export type Evidence = CourtCase & {
  imageUrl: string;
  captions: (Caption & { score: number; votes: number; myVote: number })[];
};
