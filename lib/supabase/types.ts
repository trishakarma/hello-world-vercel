export type Item = {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      items: {
        Row: Item;
        Insert: Omit<Item, "id" | "created_at"> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Item>;
      };
    };
  };
};
