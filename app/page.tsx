import { headers } from "next/headers";
import Link from "next/link";


export default function Page() {

  const nonce = headers().get('x-nonce')

  console.log('nonce', nonce)

  return (
    <div>
      <h1 className="text-4xl font-bold">Hello World</h1>
      <Link href="/dynamic-test/1" className="text-blue-500 hover:text-blue-800">
        Go to Dynamic Test 1
      </Link>

      <div className="mt-6">
        Nonce: {nonce}
      </div>
    </div>
  );
}
