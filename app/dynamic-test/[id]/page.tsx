import Link from "next/link";
import { headers } from "next/headers";


export default function Page({ params }: { params: { id: string } }) {

  const nonce = headers().get('x-nonce')

  console.log('nonce', nonce)

  return (
    <div>
      <h1 className="text-4xl font-bold">Dyanmic Page: {params.id}</h1>
      <Link href="/" className="text-blue-500 hover:text-blue-800">
        Go to Home
      </Link>

      <div className="mt-6">
        Nonce: {nonce}
      </div>
    </div>
  );
}
