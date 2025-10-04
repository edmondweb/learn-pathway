import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { CourseCard } from '@/components/CourseCard';
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

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();
  }, [user]);

  const fetchCourses = async () => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });

      if (coursesError) throw coursesError;

      setCourses(coursesData || []);

      // Fetch user progress for all courses
      if (user) {
        const { data: lessonsData } = await supabase
          .from('lessons')
          .select('id, course_id');

        const { data: progressData } = await supabase
          .from('user_progress')
          .select('lesson_id, completed')
          .eq('user_id', user.id);

        // Calculate progress percentage per course
        if (lessonsData && progressData) {
          const progressMap: Record<string, number> = {};
          
          coursesData?.forEach((course) => {
            const courseLessons = lessonsData.filter(l => l.course_id === course.id);
            const completedLessons = courseLessons.filter(lesson =>
              progressData.some(p => p.lesson_id === lesson.id && p.completed)
            );
            
            progressMap[course.id] = courseLessons.length > 0
              ? Math.round((completedLessons.length / courseLessons.length) * 100)
              : 0;
          });
          
          setProgress(progressMap);
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error loading courses',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/20 to-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12 space-y-4">
          <div className="flex justify-center mb-4">
            <GraduationCap className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Your Learning Journey
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore our curated courses and track your progress as you master new skills
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading courses...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <CourseCard
                key={course.id}
                {...course}
                progress={progress[course.id]}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
