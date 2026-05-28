import { useNavigate, useSearchParams } from "react-router";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { useTranslation } from "~/context/I18nContext";

interface FilterBarProps {
  tags: { id: string; name: string }[];
  categories?: { id: string; name: string }[];
}

export function FilterBar({ tags, categories }: FilterBarProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const currentTag = searchParams.get("tag") || "all";
  const currentCat = searchParams.get("category") || "all";
  const currentSort = searchParams.get("sort") || "newest";

  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === "all") {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // reset to page 1 on filter change
    newParams.set("page", "1");
    navigate(`?${newParams.toString()}`);
  };

  const handleClearFilters = () => {
    navigate("?");
  };

  const hasFilters = searchParams.has("tag") || searchParams.has("category") || searchParams.has("sort");

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-center bg-night-card p-4 rounded-xl border border-night-border mb-8 shadow-lg">
      <div className={`flex-1 w-full grid grid-cols-1 ${categories ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
        {/* Category Filter */}
        {categories && (
          <div>
            <Select value={currentCat} onValueChange={(val) => handleFilterChange("category", val)}>
              <SelectTrigger className="w-full bg-night-bg border-night-border text-night-text">
                <SelectValue placeholder={t("filter.allCategories")} />
              </SelectTrigger>
              <SelectContent className="bg-night-card border-night-border">
                <SelectItem value="all" className="text-night-text focus:bg-night-hover">
                  {t("filter.allCategories")}
                </SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.name} className="text-night-text focus:bg-night-hover">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tag Filter */}
        <div>
          <Select value={currentTag} onValueChange={(val) => handleFilterChange("tag", val)}>
            <SelectTrigger className="w-full bg-night-bg border-night-border text-night-text">
              <SelectValue placeholder={t("filter.allTags")} />
            </SelectTrigger>
            <SelectContent className="bg-night-card border-night-border">
              <SelectItem value="all" className="text-night-text focus:bg-night-hover">
                {t("filter.allTags")}
              </SelectItem>
              {tags.map((t) => (
                <SelectItem key={t.id} value={t.name} className="text-night-text focus:bg-night-hover">
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort Filter */}
        <div>
          <Select value={currentSort} onValueChange={(val) => handleFilterChange("sort", val)}>
            <SelectTrigger className="w-full bg-night-bg border-night-border text-night-text">
              <SelectValue placeholder={t("filter.sortBy")} />
            </SelectTrigger>
            <SelectContent className="bg-night-card border-night-border">
              <SelectItem value="newest" className="text-night-text focus:bg-night-hover">
                {t("filter.newest")}
              </SelectItem>
              <SelectItem value="popular" className="text-night-text focus:bg-night-hover">
                {t("filter.popular")}
              </SelectItem>
              <SelectItem value="views" className="text-night-text focus:bg-night-hover">
                {t("filter.views")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {hasFilters && (
        <Button 
          variant="destructive" 
          onClick={handleClearFilters}
          className="w-full sm:w-auto"
        >
          {t("filter.clear")}
        </Button>
      )}
    </div>
  );
}
