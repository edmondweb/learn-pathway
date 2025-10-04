-- Add module column to lessons table
ALTER TABLE public.lessons 
ADD COLUMN module_name TEXT NOT NULL DEFAULT 'Module 1';

-- Update existing lessons with module information
UPDATE public.lessons 
SET module_name = CASE 
  WHEN order_index <= 2 THEN 'Module 1: Introduction'
  WHEN order_index <= 4 THEN 'Module 2: Core Concepts'
  ELSE 'Module 3: Advanced Topics'
END;