import { notFound } from 'next/navigation'
import { getArticleBySlug, getRelatedArticles, getAllSlugs, type ArticleSection } from '@/lib/articles'
import ArticlePageClient from '@/components/landing/ArticlePageClient'

// force-dynamic: mencegah pre-rendering statis di cPanel shared hosting.
// generateStaticParams tetap ada agar route /blog/[slug] dikenali oleh Next.js
// (untuk sitemap, prefetch, dll.) tapi halaman TIDAK di-render saat build.
// Root cause: build worker yang spawn thread baru untuk 30+ halaman statis
// menyebabkan SIGABRT di environment dengan ulimit -u ketat.
export const dynamic = 'force-dynamic'

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }))
}

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
