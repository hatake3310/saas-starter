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
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, Eye } from 'lucide-react';

export default function NewArticlePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (status: 'draft' | 'published') => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, status }),
      });

      if (!response.ok) {
        throw new Error('Failed to create article');
      }

      const article = await response.json();
      router.push('/dashboard/articles');
    } catch (err) {
      setError('記事の作成に失敗しました');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium mb-6">新規記事作成</h1>
      <Card>
        <CardHeader>
          <CardTitle>記事情報</CardTitle>
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
          {error && <p className="text-red-500">{error}</p>}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
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
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

