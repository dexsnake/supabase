import Image from 'next/image'
import Link from 'next/link'

import authors from '@/lib/authors.json'
import type PostTypes from '@/types/post'

function FeaturedThumb(blog: PostTypes) {
  const authorArray = blog.author?.split(',').map((a) => a.trim()) || []
  const author = []

  for (let i = 0; i < authorArray.length; i++) {
    const foundAuthor = authors.find((authors: any) => {
      return authors.author_id === authorArray[i]
    })
    if (foundAuthor) {
      author.push(foundAuthor)
    }
  }

  return renderFeaturedThumb(blog, author)
}

function renderFeaturedThumb(blog: PostTypes, author: any[]) {
  const resolveImagePath = (img: string | undefined): string | null => {
    if (!img) return null
    return img.startsWith('/') || img.startsWith('http') ? img : `/images/blog/${img}`
  }

  const imageUrl =
    resolveImagePath(blog.imgThumb) ||
    resolveImagePath(blog.imgSocial) ||
    '/images/blog/blog-placeholder.png'

  return (
    <div key={blog.slug} className="w-full grid lg:grid-cols-12 gap-8">
      {/* Image */}
      <Link
        href={`${blog.path}`}
        prefetch={false}
        className="relative w-full aspect-[16/10] lg:col-span-6 overflow-hidden block group"
      >
        <div className="relative w-full h-full min-h-[200px] shadow-lg border border-foreground/10 rounded-lg overflow-hidden">
          <Image
            src={imageUrl}
            fill
            sizes="100%"
            quality={100}
            priority
            className="object-cover bg-alternative group-hover:scale-[1.02] transition-transform duration-300"
            alt="blog thumbnail"
          />
        </div>
      </Link>

      {/* Text */}
      <div className="flex flex-col lg:col-span-6 px-6 pb-8">
        <div>
          <Link href={`${blog.path}`} prefetch={false} className="group">
            <h2 className="h2 lg:!text-xl xl:!text-2xl !mb-2 group-hover:underline">{blog.title}</h2>
          </Link>
          <p className="p">{blog.description}</p>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {author.filter(Boolean).map((author: any, i: number) => {
              const authorImageUrl =
                typeof author.author_image_url === 'string'
                  ? author.author_image_url
                  : (author.author_image_url as { url: string })?.url || ''

              return (
                <div
                  className="flex items-center space-x-2"
                  key={`author-feat-${i}-${author.author}`}
                >
                  {authorImageUrl && (
                    <div className="relative h-6 w-6 overflow-hidden">
                      <Image
                        src={authorImageUrl}
                        alt={`${author.author} avatar`}
                        className="rounded-full object-cover"
                        fill
                        sizes="30px"
                      />
                    </div>
                  )}
                  <span className="text-foreground m-0 text-sm">{author.author}</span>
                </div>
              )
            })}
          </div>

          <div className="text-foreground-lighter flex space-x-2 text-sm">
            <span>{blog.formattedDate}</span>
            <span>•</span>
            <span>{blog.readingTime}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FeaturedThumb
