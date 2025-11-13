'use client';

import { useViewTranslation } from 'audarma';
import type { HNStory } from '@/lib/hackernews';
import { getStoryAge } from '@/lib/hackernews';

interface StoryCardProps {
  story: HNStory;
  summary: string;
}

export function StoryCard({ story, summary }: StoryCardProps) {
  const { text: title, isTranslating: titleTranslating } = useViewTranslation(
    'hn_title',
    story.id.toString(),
    story.title
  );

  const { text: translatedSummary, isTranslating: summaryTranslating } = useViewTranslation(
    'hn_summary',
    story.id.toString(),
    summary
  );

  const ageData = getStoryAge(story.time);
  const { text: timeText } = useViewTranslation(
    'hn_time',
    story.id.toString(),
    ageData.text
  );

  const { text: pointsLabel } = useViewTranslation('ui', 'story_points', 'points');
  const { text: byLabel } = useViewTranslation('ui', 'story_by', 'by');
  const { text: commentsLabel } = useViewTranslation('ui', 'story_comments', 'comments');
  const { text: readLabel } = useViewTranslation('ui', 'story_read', 'Read article');

  return (
    <div className="border rounded-lg p-6 hover:shadow-lg transition-shadow bg-card">
      {/* Title */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold leading-tight flex items-center gap-2">
          {title}
          {titleTranslating && (
            <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0"></span>
          )}
        </h3>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground mb-4 flex items-start gap-2">
        <span className="flex-1">{translatedSummary}</span>
        {summaryTranslating && (
          <span className="inline-block w-3 h-3 border-2 border-orange-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5"></span>
        )}
      </p>

      {/* Meta info */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{story.score} {pointsLabel}</span>
        <span>{byLabel} {story.by}</span>
        <span>{timeText}</span>
        {story.descendants && <span>{story.descendants} {commentsLabel}</span>}
      </div>

      {/* External link */}
      {story.url && (
        <a
          href={story.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mt-2 inline-block"
        >
          {readLabel}
        </a>
      )}
    </div>
  );
}
