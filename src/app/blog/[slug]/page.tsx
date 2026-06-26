import { notFound } from 'next/navigation'
import { getArticleBySlug, getRelatedArticles, type ArticleSection } from '@/lib/articles'
import ArticlePageClient from '@/components/landing/ArticlePageClient'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  return {
    title: `${article.title} – Blog MisiPintar`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      locale: 'id_ID',
    },
  }
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()
  const related = getRelatedArticles(slug, 3)
  return <ArticlePageClient article={article} related={related} />
}
