'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import useSWR from 'swr';
import { Loader2, Save, Eye, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

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

function EditArticleForm({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: article, error } = useSWR<Article>(
    `/api/articles/${id}`,
    fetcher
  );
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    if (article) {
      setTitle(article.title);
      setContent(article.content);
    }
  }, [article]);

  const handleSubmit = async (status?: 'draft' | 'published') => {
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const updateData: any = { title, content };
      if (status) {
        updateData.status = status;
      }

      const response = await fetch(`/api/articles/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error('Failed to update article');
      }

      router.push('/dashboard/articles');
    } catch (err) {
      setSubmitError('記事の更新に失敗しました');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
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
    return (
      <Card>
        <CardHeader>
          <CardTitle>記事を読み込み中...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>記事を編集</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="title" className="mb-2">
            タイトル
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="記事のタイトルを入力"
            required
          />
        </div>
        <div>
          <Label htmlFor="content" className="mb-2">
            本文
          </Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="記事の内容を入力"
            className="w-full min-h-[400px] p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            required
          />
        </div>
        {submitError && <p className="text-red-500">{submitError}</p>}
        <div className="flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          {article.status === 'draft' ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleSubmit('draft')}
                disabled={isSubmitting || !title || !content}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    下書き保存
                  </>
                )}
              </Button>
              <Button
                type="button"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => handleSubmit('published')}
                disabled={isSubmitting || !title || !content}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    公開中...
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    公開
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => handleSubmit()}
              disabled={isSubmitting || !title || !content}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  更新
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function EditArticlePage({
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
      <EditArticleForm params={params} />
    </section>
  );
}

