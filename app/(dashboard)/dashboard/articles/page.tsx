'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import useSWR from 'swr';
import Link from 'next/link';
import { PlusCircle, Pencil, Trash2, Eye } from 'lucide-react';
import { useRouter } from 'next/navigation';

type Article = {
  id: number;
  title: string;
  content: string;
  status: string;
  authorId: number;
  authorName: string | null;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ArticlesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>記事一覧</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function ArticlesList() {
  const { data: articles, mutate } = useSWR<Article[]>('/api/articles', fetcher);
  const router = useRouter();

  const deleteArticle = async (id: number) => {
    if (!confirm('この記事を削除してもよろしいですか？')) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete article');
      }

      mutate();
    } catch (error) {
      console.error('Error deleting article:', error);
      alert('記事の削除に失敗しました');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: '下書き', className: 'bg-gray-200 text-gray-700' },
      published: { label: '公開中', className: 'bg-green-200 text-green-700' },
    };

    const statusInfo = statusMap[status] || statusMap.draft;

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  if (!articles || articles.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>記事一覧</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              まだ記事がありません。
            </p>
            <Link href="/dashboard/articles/new">
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                <PlusCircle className="mr-2 h-4 w-4" />
                記事を作成
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>記事一覧</CardTitle>
        <Link href="/dashboard/articles/new">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <PlusCircle className="mr-2 h-4 w-4" />
            新規作成
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {articles.map((article) => (
            <div
              key={article.id}
              className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{article.title}</h3>
                    {getStatusBadge(article.status)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {article.content.substring(0, 150)}
                    {article.content.length > 150 ? '...' : ''}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>著者: {article.authorName || '不明'}</span>
                    <span>更新: {formatDate(article.updatedAt)}</span>
                    {article.publishedAt && (
                      <span>公開: {formatDate(article.publishedAt)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 ml-4">
                  <Link href={`/dashboard/articles/${article.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link href={`/dashboard/articles/${article.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteArticle(article.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArticlesPage() {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">記事管理</h1>
      <ArticlesList />
    </section>
  );
}

