
export enum GoalCategory {
  HEALTH = 'Health',
  CAREER = 'Career',
  FINANCE = 'Finance',
  PERSONAL = 'Personal',
  RELATIONSHIPS = 'Relationships',
  LEARNING = 'Learning',
  OTHER = 'Other'
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: GoalCategory;
  completed: boolean;
}

export interface MonthData {
  month: string;
  goals: Goal[];
  focus: string;
}

export interface YearlyPlan {
  year: number;
  months: MonthData[];
}

export interface AISuggestion {
  title: string;
  description: string;
  category: GoalCategory;
}
