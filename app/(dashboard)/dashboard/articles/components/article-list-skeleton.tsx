import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

/**
 * Article list loading skeleton
 * Displays while articles are being fetched
 */
export function ArticleListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4" role="status" aria-label="Loading articles">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border rounded-lg animate-pulse"
              aria-hidden="true"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-3">
                  <div className="h-6 w-3/4 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-5/6 bg-gray-200 rounded" />
                  <div className="flex gap-4">
                    <div className="h-3 w-20 bg-gray-200 rounded" />
                    <div className="h-3 w-24 bg-gray-200 rounded" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                  <div className="h-8 w-8 bg-gray-200 rounded" />
                </div>
              </div>
            </div>
          ))}
          <span className="sr-only">Loading...</span>
        </div>
      </CardContent>
    </Card>
  );
}


