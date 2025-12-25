
'use client';

import { useState, useEffect, useTransition } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  PlusCircle,
  Edit,
  Trash2,
  ListChecks,
  Eye,
  Video,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertTitle } from '@/components/ui/alert';


interface DailyTask {
  id: number;
  created_at: string;
  title: string;
  description: string;
  redirect_url: string;
  correct_code: string;
  rules: string;
  is_active: boolean;
}

type TaskType = 'visit-earn' | 'watch-earn';

export default function DailyTasksAdminPage() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<{ [key in TaskType]: DailyTask[] }>({
    'visit-earn': [],
    'watch-earn': [],
  });
  const [loading, setLoading] = useState(true);
  const [isSubmitting, startSubmitting] = useTransition();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask & { type: TaskType } | null>(null);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const [visitRes, watchRes] = await Promise.all([
        supabase.from('visit_earn_tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('watch_earn_tasks').select('*').order('created_at', { ascending: false })
      ]);

      if (visitRes.error) throw visitRes.error;
      if (watchRes.error) throw watchRes.error;

      setTasks({
        'visit-earn': visitRes.data,
        'watch-earn': watchRes.data,
      });

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch tasks. ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleEditClick = (task: DailyTask, type: TaskType) => {
    setEditingTask({ ...task, type });
    setDialogOpen(true);
  };
  
  const handleDeleteClick = async (task: DailyTask, type: TaskType) => {
      if(!window.confirm(`Are you sure you want to delete task "${task.title}"?`)) return;

      const tableName = type === 'visit-earn' ? 'visit_earn_tasks' : 'watch_earn_tasks';
      const { error } = await supabase.from(tableName).delete().eq('id', task.id);
      
      if(error){
          toast({ variant: 'destructive', title: 'Delete Failed', description: error.message });
      } else {
          toast({ title: 'Success', description: 'Task deleted successfully.' });
          await fetchTasks();
      }
  };

  const handleSaveTask = (newTask: Omit<DailyTask, 'id' | 'created_at'> & { type: TaskType }) => {
    startSubmitting(async () => {
      const { type, ...taskData } = newTask;
      const tableName = type === 'visit-earn' ? 'visit_earn_tasks' : 'watch_earn_tasks';
      
      const { error } = await supabase.from(tableName).insert(taskData);
      
      if(error){
          toast({ variant: 'destructive', title: 'Creation Failed', description: error.message });
      } else {
          toast({ title: 'Success', description: 'New task created successfully.' });
          await fetchTasks();
          setDialogOpen(false); // Close create dialog if it's open
          setEditingTask(null);
      }
    });
  };
  
  const handleUpdateTask = (updatedTask: DailyTask & { type: TaskType }) => {
     startSubmitting(async () => {
        const { type, id, created_at, ...taskData } = updatedTask;
        const tableName = type === 'visit-earn' ? 'visit_earn_tasks' : 'watch_earn_tasks';
        
        const { error } = await supabase.from(tableName).update(taskData).eq('id', id);
        
        if (error) {
            toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
        } else {
            toast({ title: 'Success', description: 'Task updated successfully.' });
            setEditingTask(null);
            setDialogOpen(false);
            await fetchTasks();
        }
     });
  };

  const sqlPolicyFix = `-- 1. पुरानी सभी नीतियों को हटाएं ताकि कोई टकराव न हो
DROP POLICY IF EXISTS "Allow all for admins" ON public.visit_earn_tasks;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.visit_earn_tasks;
DROP POLICY IF EXISTS "Allow all for admins" ON public.watch_earn_tasks;
DROP POLICY IF EXISTS "Allow read for authenticated" ON public.watch_earn_tasks;
-- पुरानी नीतियों के अन्य संभावित नामों को भी हटा दें
DROP POLICY IF EXISTS "Allow admin full access" ON public.visit_earn_tasks;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.visit_earn_tasks;
DROP POLICY IF EXISTS "Allow admins to do everything" ON public.visit_earn_tasks;
DROP POLICY IF EXISTS "Allow admin full access" ON public.watch_earn_tasks;
DROP POLICY IF EXISTS "Allow read access to authenticated users" ON public.watch_earn_tasks;
DROP POLICY IF EXISTS "Allow admins to do everything" ON public.watch_earn_tasks;

-- 2. visit_earn_tasks टेबल के लिए नई, सरल नीतियां बनाएं
CREATE POLICY "Allow all for admins"
ON public.visit_earn_tasks
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

CREATE POLICY "Allow read for authenticated"
ON public.visit_earn_tasks
FOR SELECT
USING (auth.role() = 'authenticated');

-- 3. watch_earn_tasks टेबल के लिए नई, सरल नीतियां बनाएं
CREATE POLICY "Allow all for admins"
ON public.watch_earn_tasks
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid())
);

CREATE POLICY "Allow read for authenticated"
ON public.watch_earn_tasks
FOR SELECT
USING (auth.role() = 'authenticated');
`;


  const renderTaskList = (type: TaskType) => (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center h-40"><Loader2 className="animate-spin h-8 w-8" /></div>
      ) : tasks[type].length > 0 ? (
        tasks[type].map(task => (
          <Card key={task.id}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start gap-4">
                <div>
                   <p className="font-semibold">{task.title}</p>
                   <p className="text-xs text-muted-foreground">{task.description}</p>
                </div>
                <div className="flex items-center gap-2">
                    <Switch checked={task.is_active} disabled />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditClick(task, type)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeleteClick(task, type)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <p className="text-xs text-muted-foreground">Created: {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</p>
            </CardContent>
          </Card>
        ))
      ) : (
        <p className="text-center text-muted-foreground py-10">No tasks found for this category.</p>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Daily Tasks</h1>
          <p className="text-muted-foreground">Manage Visit &amp; Earn and Watch &amp; Earn tasks.</p>
        </div>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Permission Error Detected</AlertTitle>
          <div className="space-y-2">
            <p>If you are unable to add or see tasks, you need to update your database security rules. Please run the following SQL code in your Supabase SQL Editor.</p>
            <Textarea className="font-mono bg-destructive/10 text-destructive-foreground h-48" readOnly value={sqlPolicyFix} />
            <Button variant="secondary" size="sm" onClick={() => navigator.clipboard.writeText(sqlPolicyFix)}>Copy SQL</Button>
          </div>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PlusCircle /> Create New Task</CardTitle>
            <CardDescription>Add a new task to either category.</CardDescription>
          </CardHeader>
          <CardContent>
             <Button onClick={() => { setEditingTask(null); setDialogOpen(true); }}>Add New Task</Button>
          </CardContent>
        </Card>
        
        <Tabs defaultValue="visit-earn" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="visit-earn"><Eye className="mr-2 h-4 w-4"/> Visit &amp; Earn Tasks</TabsTrigger>
            <TabsTrigger value="watch-earn"><Video className="mr-2 h-4 w-4"/> Watch &amp; Earn Tasks</TabsTrigger>
          </TabsList>
          <TabsContent value="visit-earn" className="mt-4">
            {renderTaskList('visit-earn')}
          </TabsContent>
          <TabsContent value="watch-earn" className="mt-4">
            {renderTaskList('watch-earn')}
          </TabsContent>
        </Tabs>
      </div>

      <TaskFormDialog
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        task={editingTask}
        onSave={handleSaveTask}
        onUpdate={handleUpdateTask}
        isSubmitting={isSubmitting}
      />
    </>
  );
}

// Sub-component for the form dialog
function TaskFormDialog({ isOpen, onOpenChange, task, onSave, onUpdate, isSubmitting }: {
    isOpen: boolean,
    onOpenChange: (open: boolean) => void,
    task: (DailyTask & { type: TaskType }) | null,
    onSave: (task: Omit<DailyTask, 'id' | 'created_at'> & { type: TaskType }) => void,
    onUpdate: (task: DailyTask & { type: TaskType }) => void,
    isSubmitting: boolean
}) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [redirectUrl, setRedirectUrl] = useState('');
    const [correctCode, setCorrectCode] = useState('');
    const [rules, setRules] = useState('');
    const [type, setType] = useState<TaskType>('visit-earn');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (task) {
            setTitle(task.title);
            setDescription(task.description);
            setRedirectUrl(task.redirect_url);
            setCorrectCode(task.correct_code);
            setRules(task.rules);
            setType(task.type);
            setIsActive(task.is_active);
        } else {
            // Reset form for new task
            setTitle('');
            setDescription('');
            setRedirectUrl('');
            setCorrectCode('');
            setRules('');
            setType('visit-earn');
            setIsActive(true);
        }
    }, [task]);

    const handleSubmit = () => {
        const taskData = { title, description, redirect_url: redirectUrl, correct_code: correctCode, rules, is_active: isActive };
        if (task) {
            onUpdate({ ...task, ...taskData });
        } else {
            onSave({ ...taskData, type });
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{task ? 'Edit Task' : 'Create New Task'}</DialogTitle>
                    <DialogDescription>Fill in the details for the task below.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
                    <div className="space-y-2">
                        <Label htmlFor="type">Task Type</Label>
                        <Select value={type} onValueChange={(v) => setType(v as TaskType)} disabled={!!task}>
                            <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="visit-earn">Visit &amp; Earn</SelectItem>
                                <SelectItem value="watch-earn">Watch &amp; Earn</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="redirectUrl">Link</Label>
                        <Input id="redirectUrl" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="correctCode">Verification Code</Label>
                        <Input id="correctCode" value={correctCode} onChange={(e) => setCorrectCode(e.target.value)} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="rules">Rules (optional, separate with ';')</Label>
                        <Textarea id="rules" value={rules} onChange={(e) => setRules(e.target.value)} />
                    </div>
                     <div className="flex items-center space-x-2">
                        <Switch id="is-active" checked={isActive} onCheckedChange={setIsActive} />
                        <Label htmlFor="is-active">Task is Active</Label>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {task ? 'Save Changes' : 'Create Task'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

    