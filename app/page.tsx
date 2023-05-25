import Image from 'next/image'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <div>
        Page: Home
      </div>
      <div className="mt-10 text-blue-500">
        <Link href="/test">Navigate to Test page</Link>
      </div>
    </>
  )
}
