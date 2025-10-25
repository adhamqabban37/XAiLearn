
import type { Resource } from "@/lib/types";
import SafeYouTube from "./SafeYouTube";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "lucide-react";

export function ResourcesPanel({ resources }: { resources: Resource[] }) {
  if (!resources || resources.length === 0) {
    return null;
  }

  const youtubeLinks = resources.filter(r => r.url.includes('youtube.com') || r.url.includes('youtu.be'));
  const otherLinks = resources.filter(r => !youtubeLinks.includes(r));

  return (
    <Card className="mt-4 bg-secondary/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
            <Link className="w-5 h-5 mr-2" />
            Additional Resources
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {youtubeLinks.length > 0 && (
          <div className="space-y-4">
            {youtubeLinks.map((resource, index) => (
              <div key={`yt-${index}`}>
                <h4 className="font-semibold mb-2">{resource.title}</h4>
                <SafeYouTube url={resource.url} title={resource.title} />
              </div>
            ))}
          </div>
        )}

        {otherLinks.length > 0 && (
          <ul className="space-y-2">
            {otherLinks.map((resource, index) => (
              <li key={`link-${index}`} className="text-sm">
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline transition-colors"
                >
                  {resource.title}
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
