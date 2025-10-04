import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, Clock } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  duration?: string;
  level?: string;
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  order_index: number;
  duration?: string;
  module_name: string;
}

interface LessonProgress {
  lesson_id: string;
  completed: boolean;
}

export default function CourseDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<LessonProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (courseId) {
      fetchCourseData();
    }
  }, [user, courseId, navigate]);

  const fetchCourseData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // Fetch lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index');

      if (lessonsError) throw lessonsError;
      setLessons(lessonsData || []);

      // Fetch user progress
      if (user) {
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id);

        setProgress(progressData || []);
      }
    } catch (error: any) {
      toast({
        title: 'Error loading course',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLessonComplete = async (lessonId: string, currentStatus: boolean) => {
    if (!user) return;

    try {
      const newStatus = !currentStatus;

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          lesson_id: lessonId,
          completed: newStatus,
          completed_at: newStatus ? new Date().toISOString() : null,
        }, {
          onConflict: 'user_id,lesson_id'
        });

      if (error) throw error;

      // Update local state
      setProgress(prev => {
        const existing = prev.find(p => p.lesson_id === lessonId);
        if (existing) {
          return prev.map(p =>
            p.lesson_id === lessonId ? { ...p, completed: newStatus } : p
          );
        } else {
          return [...prev, { lesson_id: lessonId, completed: newStatus }];
        }
      });

      toast({
        title: newStatus ? 'Lesson completed!' : 'Progress updated',
        description: newStatus ? 'Great job! Keep learning.' : 'Lesson marked as incomplete.',
      });
    } catch (error: any) {
      toast({
        title: 'Error updating progress',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const completedCount = lessons.filter(lesson =>
    progress.some(p => p.lesson_id === lesson.id && p.completed)
  ).length;
  const progressPercentage = lessons.length > 0
    ? Math.round((completedCount / lessons.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
        <Navbar />
        <div className="container mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Course not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Courses
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <CardTitle className="text-3xl">{course.title}</CardTitle>
                  {course.level && <Badge variant="secondary">{course.level}</Badge>}
                </div>
                <CardDescription className="text-base">{course.description}</CardDescription>
              </CardHeader>
              {course.image_url && (
                <div className="px-6 pb-6">
                  <img
                    src={course.image_url}
                    alt={course.title}
                    className="w-full aspect-video object-cover rounded-lg"
                  />
                </div>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Course Content</CardTitle>
                <CardDescription>
                  {lessons.length} lessons • {completedCount} completed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {Object.entries(
                  lessons.reduce((acc, lesson) => {
                    const module = lesson.module_name;
                    if (!acc[module]) acc[module] = [];
                    acc[module].push(lesson);
                    return acc;
                  }, {} as Record<string, Lesson[]>)
                ).map(([moduleName, moduleLessons]) => (
                  <div key={moduleName} className="space-y-3">
                    <h3 className="text-lg font-semibold text-foreground border-b pb-2">
                      {moduleName}
                    </h3>
                    {moduleLessons.map((lesson) => {
                      const isCompleted = progress.some(
                        p => p.lesson_id === lesson.id && p.completed
                      );

                      return (
                        <Card
                          key={lesson.id}
                          className="transition-all hover:shadow-md cursor-pointer"
                          onClick={() => toggleLessonComplete(lesson.id, isCompleted)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleLessonComplete(lesson.id, isCompleted);
                                }}
                              >
                                {isCompleted ? (
                                  <CheckCircle2 className="h-5 w-5 text-primary" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                              </Button>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className={`font-medium ${isCompleted ? 'text-muted-foreground line-through' : ''}`}>
                                    {lesson.title}
                                  </h4>
                                  {lesson.duration && (
                                    <div className="flex items-center gap-1 text-sm text-muted-foreground shrink-0">
                                      <Clock className="h-3 w-3" />
                                      <span>{lesson.duration}</span>
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {lesson.content}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-20">
              <CardHeader>
                <CardTitle>Your Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold text-primary">
                      {progressPercentage}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {completedCount} / {lessons.length} lessons
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </div>

                {course.duration && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Total duration: {course.duration}
                    </span>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Click on any lesson to mark it as complete. Keep going!
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
