-- Create courses table
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  duration TEXT,
  level TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lessons table
CREATE TABLE public.lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user progress table
CREATE TABLE public.user_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable Row Level Security
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Courses are viewable by everyone (public catalog)
CREATE POLICY "Courses are viewable by everyone"
ON public.courses
FOR SELECT
USING (true);

-- Lessons are viewable by everyone
CREATE POLICY "Lessons are viewable by everyone"
ON public.lessons
FOR SELECT
USING (true);

-- Users can view their own progress
CREATE POLICY "Users can view their own progress"
ON public.user_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own progress
CREATE POLICY "Users can create their own progress"
ON public.user_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own progress
CREATE POLICY "Users can update their own progress"
ON public.user_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert sample courses
INSERT INTO public.courses (title, description, image_url, duration, level) VALUES
('Web Development Fundamentals', 'Learn the basics of HTML, CSS, and JavaScript to build modern websites', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800', '8 hours', 'Beginner'),
('React Mastery', 'Master React and build dynamic user interfaces with hooks, context, and modern patterns', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800', '12 hours', 'Intermediate'),
('Database Design', 'Learn SQL, database design principles, and how to build scalable data architectures', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800', '10 hours', 'Intermediate');

-- Insert sample lessons for Web Development course
INSERT INTO public.lessons (course_id, title, content, order_index, duration)
SELECT 
  id,
  title,
  content,
  order_index,
  duration
FROM (
  SELECT 
    (SELECT id FROM public.courses WHERE title = 'Web Development Fundamentals') as id,
    'Introduction to HTML' as title,
    'Learn the structure and syntax of HTML, the backbone of every website.' as content,
    1 as order_index,
    '45 min' as duration
  UNION ALL
  SELECT 
    (SELECT id FROM public.courses WHERE title = 'Web Development Fundamentals'),
    'CSS Styling Basics',
    'Master CSS fundamentals including selectors, properties, and the box model.',
    2,
    '1 hour'
  UNION ALL
  SELECT 
    (SELECT id FROM public.courses WHERE title = 'Web Development Fundamentals'),
    'JavaScript Essentials',
    'Get started with JavaScript variables, functions, and DOM manipulation.',
    3,
    '1.5 hours'
  UNION ALL
  SELECT 
    (SELECT id FROM public.courses WHERE title = 'Web Development Fundamentals'),
    'Responsive Design',
    'Learn to create websites that work on all devices using responsive techniques.',
    4,
    '1 hour'
) as lessons;