"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Page({ params }: { params: { id: string } }) {
    const router = useRouter();
    const pathname = usePathname();

    const id = params.id;

    const close = () => router.push("/test");

    return (
        <>
            <div>
                ID: {id}
            </div>
            <Link href="/test">
                Close
            </Link>
        </>
    )
}