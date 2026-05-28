import React, { useMemo } from "react";
import { Link } from "react-router";

interface SmartSynopsisProps {
  synopsis: string;
  tags: string[];
  categories: string[];
}

export function SmartSynopsis({ synopsis, tags, categories }: SmartSynopsisProps) {
  const content = useMemo(() => {
    if (!synopsis) return null;

    // Combine tags and categories into a dictionary of link targets
    const dictionary: { keyword: string; url: string; type: 'tag' | 'category' }[] = [];
    
    categories.forEach((cat) => {
      dictionary.push({
        keyword: cat.toLowerCase(),
        url: `/category/${cat.toLowerCase()}`,
        type: 'category'
      });
    });

    tags.forEach((tag) => {
      dictionary.push({
        keyword: tag.toLowerCase(),
        url: `/?tag=${encodeURIComponent(tag.toLowerCase())}`,
        type: 'tag'
      });
    });

    // Sort by length descending to prevent partial match issues (e.g., matching "Teen" inside "Teenager")
    dictionary.sort((a, b) => b.keyword.length - a.keyword.length);

    if (dictionary.length === 0) {
      return <>{synopsis}</>;
    }

    // Escape regex specials
    const escapeRegExp = (string: string) => {
      return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const pattern = new RegExp(`\\b(${dictionary.map(d => escapeRegExp(d.keyword)).join('|')})\\b`, 'gi');

    const parts = synopsis.split(pattern);

    return parts.map((part, i) => {
      const lowerPart = part.toLowerCase();
      const match = dictionary.find(d => d.keyword === lowerPart);

      if (match) {
        return (
          <Link
            key={i}
            to={match.url}
            className="text-night-accent hover:text-white hover:underline transition-colors font-medium"
            title={`Explore more ${match.keyword} videos`}
          >
            {part}
          </Link>
        );
      }
      return <React.Fragment key={i}>{part}</React.Fragment>;
    });
  }, [synopsis, tags, categories]);

  return <>{content}</>;
}
