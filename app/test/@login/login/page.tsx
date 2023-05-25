"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();
    const pathname = usePathname();

    const close = () => router.push("/test");

    return (
        <Link href="/test">
            Close
        </Link>
    )
}