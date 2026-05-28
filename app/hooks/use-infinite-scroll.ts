import { useEffect, useState } from "react";
import { useFetcher } from "react-router";
import { useInView } from "react-intersection-observer";

interface UseInfiniteScrollOptions<T> {
  initialData: T[];
  totalPages: number;
  currentPage: number;
  searchParams: URLSearchParams;
}

export function useInfiniteScroll<T>({
  initialData,
  totalPages,
  currentPage,
  searchParams,
}: UseInfiniteScrollOptions<T>) {
  const [items, setItems] = useState<T[]>(initialData);
  const [page, setPage] = useState(currentPage);
  const [lastFetchedPage, setLastFetchedPage] = useState(currentPage);
  const fetcher = useFetcher<any>();
  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: "400px",
  });

  // Reset items when initialData completely changes (e.g., search or filter changed)
  useEffect(() => {
    setItems(initialData);
    setPage(currentPage);
    setLastFetchedPage(currentPage);
  }, [initialData, currentPage]);

  useEffect(() => {
    if (inView && page < totalPages && fetcher.state === "idle" && lastFetchedPage === page) {
      const nextPage = page + 1;
      const params = new URLSearchParams(searchParams);
      params.set("page", nextPage.toString());
      setLastFetchedPage(nextPage); // mark as fetched immediately to avoid double fetching
      fetcher.load(`?${params.toString()}`);
    }
  }, [inView, page, totalPages, fetcher.state, searchParams, lastFetchedPage]);

  useEffect(() => {
    if (fetcher.data && fetcher.state === "idle" && lastFetchedPage > page) {
      const newItems = fetcher.data.videos || [];
      if (newItems.length > 0) {
        setItems((prev) => {
          // Prevent duplicates by checking ID (assuming item has 'id')
          const existingIds = new Set(prev.map((item: any) => item.id));
          const uniqueNewItems = newItems.filter((item: any) => !existingIds.has(item.id));
          return [...prev, ...uniqueNewItems];
        });
        setPage(lastFetchedPage);
      }
    }
  }, [fetcher.data, fetcher.state, lastFetchedPage, page]);

  return { items, hasMore: page < totalPages, ref, isFetching: fetcher.state === "loading" };
}
