import { Link } from 'react-router-dom';
import { Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  duration?: string;
  level?: string;
  progress?: number;
}

export function CourseCard({ id, title, description, image_url, duration, level, progress }: CourseCardProps) {
  return (
    <Link to={`/course/${id}`}>
      <Card className="overflow-hidden transition-all hover:shadow-[var(--shadow-hover)] hover:-translate-y-1" style={{ boxShadow: 'var(--shadow-card)' }}>
        <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
          {image_url ? (
            <img 
              src={image_url} 
              alt={title}
              className="w-full h-full object-cover transition-transform hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <TrendingUp className="h-12 w-12 text-primary/40" />
            </div>
          )}
          {progress !== undefined && progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-background/50">
              <div 
                className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
        
        <CardHeader>
          <div className="flex items-start justify-between gap-2 mb-2">
            <CardTitle className="text-lg">{title}</CardTitle>
            {level && (
              <Badge variant="secondary" className="shrink-0">
                {level}
              </Badge>
            )}
          </div>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {duration && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{duration}</span>
              </div>
            )}
            {progress !== undefined && (
              <div className="ml-auto font-medium text-primary">
                {progress}% Complete
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
