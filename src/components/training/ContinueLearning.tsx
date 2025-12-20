'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Course } from '@/types/content';

interface ContinueLearningProps {
  course: Course;
  progressPercent: number;
}

export function ContinueLearning({ course, progressPercent }: ContinueLearningProps) {
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div
          className="h-32 w-full rounded-lg bg-gray-800 md:h-24 md:w-40"
          style={{
            backgroundImage: `url(${course.coverImageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider text-accent">Continue Learning</p>
          <h3 className="mt-1 text-lg font-bold text-white">{course.title}</h3>
          <p className="text-sm text-gray-400">{course.coach.name}</p>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-1.5 flex-1 rounded-full bg-gray-800">
              <div
                className="h-1.5 rounded-full bg-accent"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium text-gray-400">{progressPercent}%</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/courses/${course.slug}`}>
            <Button>Resume Training</Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
