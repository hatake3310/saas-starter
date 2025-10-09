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
import { Pencil, ArrowLeft } from 'lucide-react';
import { use } from 'react';

type Article = {
  id: number;
  title: string;
  content: string;
  status: string;
  authorId: number;
  createdAt: Date;
  updatedAt: Date;
  publishedAt: Date | null;
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function ArticleDetailSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="animate-pulse">
          <div className="h-8 w-3/4 bg-gray-200 rounded mb-4"></div>
          <div className="h-4 w-1/4 bg-gray-200 rounded"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-full bg-gray-200 rounded"></div>
          <div className="h-4 w-3/4 bg-gray-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );
}

function ArticleDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: article, error } = useSWR<Article>(
    `/api/articles/${id}`,
    fetcher
  );

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        className={`px-3 py-1 rounded-full text-sm font-medium ${statusInfo.className}`}
      >
        {statusInfo.label}
      </span>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <p className="text-center text-red-500">記事の読み込みに失敗しました</p>
        </CardContent>
      </Card>
    );
  }

  if (!article) {
    return <ArticleDetailSkeleton />;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <CardTitle className="text-2xl">{article.title}</CardTitle>
              {getStatusBadge(article.status)}
            </div>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>作成日: {formatDate(article.createdAt)}</p>
              <p>更新日: {formatDate(article.updatedAt)}</p>
              {article.publishedAt && (
                <p>公開日: {formatDate(article.publishedAt)}</p>
              )}
            </div>
          </div>
          <Link href={`/dashboard/articles/${article.id}/edit`}>
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <Pencil className="mr-2 h-4 w-4" />
              編集
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap">{article.content}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <section className="flex-1 p-4 lg:p-8">
      <div className="mb-6">
        <Link href="/dashboard/articles">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            記事一覧に戻る
          </Button>
        </Link>
      </div>
      <ArticleDetail params={params} />
    </section>
  );
}

