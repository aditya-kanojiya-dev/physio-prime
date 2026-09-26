import { BlogFormPage, type BlogScope } from './admin/BlogFormPage'

const SCOPE: BlogScope = {
  base: '/doctor/blog',
  listPath: '/blogs',
  listKey: 'doctor/blog/posts',
  portal: 'doctor',
  subtitle: 'Create a new article.',
}

export function DoctorBlogFormPage() {
  return <BlogFormPage scope={SCOPE} />
}
