import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StoryComments } from "@/components/stories/story-comments";
import { StoryPollCard } from "@/components/stories/story-poll";
import { StoryReactions } from "@/components/stories/story-reactions";
import type { StoryEngagementView } from "@/lib/story-engagement";

export function StoryEngagement({
  engagement,
  signedIn,
}: {
  engagement: StoryEngagementView;
  signedIn: boolean;
}) {
  const signInHref = `/sign-in`;

  if (engagement.poll) {
    return (
      <StoryPollCard
        poll={engagement.poll}
        signedIn={signedIn}
        signInHref={signInHref}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join the desk</CardTitle>
        <CardDescription>
          React or leave a take. Polls are reserved for primetime slates and
          other lock-in articles.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-8">
        <StoryReactions
          storyId={engagement.storyId}
          reactions={engagement.reactions}
          signedIn={signedIn}
          signInHref={signInHref}
        />
        <StoryComments
          storyId={engagement.storyId}
          comments={engagement.comments}
          signedIn={signedIn}
          signInHref={signInHref}
        />
      </CardContent>
    </Card>
  );
}
