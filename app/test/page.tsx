import Link from "next/link.js";

export default function Page() {
    return (
        <>
            <div>
                <Link href="/test/1/modal">
                    Modal 1
                </Link>
            </div>
            <div>
                <Link href="/test/2/modal">
                    Modal 2
                </Link>
            </div>
        </>
    );
}