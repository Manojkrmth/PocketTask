
export type TaskStatus = 'Pending' | 'Approved' | 'Rejected';

export interface AppTask {
  id: string; // Should be UUID string
  submission_time: string;
  task_type: string;
  reward: number;
  status: TaskStatus;
  user_id: string;
  submission_data: any;
  users: {
    full_name: string | null;
    email: string | null;
  } | null;
}
